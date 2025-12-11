import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
    let tmpDir: string | null = null;

    try {
        const { code, language, testCases, timeLimit = 5 } = await req.json();

        if (!Array.isArray(testCases) || testCases.length === 0) {
            return NextResponse.json(
                { error: "No test cases provided" },
                { status: 400 }
            );
        }

        // Create a temporary directory
        tmpDir = path.join("/tmp", `codecrush-batch-${randomBytes(8).toString("hex")}`);
        await fs.mkdir(tmpDir, { recursive: true });

        let fileName: string;
        let compileCmd: string | null = null;
        let runCmdTemplate: string;
        let needsCompilation = true;

        // Setup based on language
        switch (language) {
            case "c":
                fileName = path.join(tmpDir, "main.c");
                await fs.writeFile(fileName, code);
                compileCmd = `gcc "${fileName}" -o "${path.join(tmpDir, "main")}" 2>&1`;
                runCmdTemplate = `"${path.join(tmpDir, "main")}"`;
                break;

            case "cpp":
                fileName = path.join(tmpDir, "main.cpp");
                await fs.writeFile(fileName, code);
                compileCmd = `g++ "${fileName}" -o "${path.join(tmpDir, "main")}" -std=c++17 2>&1`;
                runCmdTemplate = `"${path.join(tmpDir, "main")}"`;
                break;

            case "java":
                const classMatch = code.match(/public\s+class\s+(\w+)/);
                const className = classMatch ? classMatch[1] : "Main";
                fileName = path.join(tmpDir, `${className}.java`);
                await fs.writeFile(fileName, code);
                compileCmd = `javac "${fileName}" 2>&1`;
                runCmdTemplate = `cd "${tmpDir}" && java ${className}`;
                break;

            case "python":
                fileName = path.join(tmpDir, "main.py");
                await fs.writeFile(fileName, code);

                let pythonPath = "python3";
                try {
                    await execAsync("python3 --version", { timeout: 1000 });
                } catch {
                    pythonPath = "py";
                }

                runCmdTemplate = `${pythonPath} "${fileName}"`;
                needsCompilation = false;
                break;

            default:
                return NextResponse.json(
                    { error: `Unsupported language: ${language}` },
                    { status: 400 }
                );
        }

        // COMPILE ONCE (if needed)
        if (needsCompilation && compileCmd) {
            try {
                const { stdout, stderr } = await execAsync(compileCmd, {
                    timeout: timeLimit * 1000,
                    maxBuffer: 10 * 1024 * 1024,
                    encoding: "utf8",
                });

                const compileOutput = `${stdout || ""}${stderr || ""}`;

                if (compileOutput.toLowerCase().includes("error")) {
                    return NextResponse.json({
                        error: true,
                        message: "Compilation Error",
                        compileOutput: compileOutput.trim(),
                        results: []
                    });
                }
            } catch (error: any) {
                const errorStdout = typeof error.stdout === "string" ? error.stdout : "";
                const errorStderr = typeof error.stderr === "string" ? error.stderr : "";

                return NextResponse.json({
                    error: true,
                    message: "Compilation Error",
                    compileOutput: (errorStdout + errorStderr || error.message || "Compilation failed").trim(),
                    results: []
                });
            }
        }

        // RUN AGAINST ALL TEST CASES
        const results = [];

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            const startTime = Date.now();

            try {
                // Use child_process spawn for stdin support
                const { spawn } = await import("child_process");
                const shell = process.platform === "win32";
                const cmdParts = shell ? ["cmd", "/c", runCmdTemplate] : ["sh", "-c", runCmdTemplate];

                const child = spawn(cmdParts[0], cmdParts.slice(1), {
                    timeout: (testCase.timeLimitSeconds || timeLimit) * 1000,
                });

                let stdout = "";
                let stderr = "";

                child.stdout.on("data", (data) => {
                    stdout += data.toString();
                });

                child.stderr.on("data", (data) => {
                    stderr += data.toString();
                });

                // Write input to stdin
                if (testCase.input) {
                    child.stdin.write(testCase.input);
                }
                child.stdin.end();

                // Wait for process to complete
                await new Promise((resolve, reject) => {
                    child.on("close", resolve);
                    child.on("error", reject);
                });

                const endTime = Date.now();
                const executionTime = (endTime - startTime) / 1000;

                // Normalize outputs for comparison
                const normalizeOutput = (str: string) => {
                    return str.trim().split(/\s+/).filter(token => token.length > 0);
                };

                const actualTokens = normalizeOutput(stdout || "");
                const expectedTokens = normalizeOutput(testCase.expectedOutput || "");

                let status = "Passed";
                if (actualTokens.length !== expectedTokens.length) {
                    status = "Wrong Answer";
                } else {
                    for (let j = 0; j < actualTokens.length; j++) {
                        if (actualTokens[j] !== expectedTokens[j]) {
                            status = "Wrong Answer";
                            break;
                        }
                    }
                }

                if (stderr) {
                    status = "Runtime Error";
                }

                results.push({
                    testNumber: i + 1,
                    status,
                    input: testCase.input,
                    expectedOutput: testCase.expectedOutput,
                    actualOutput: stdout || "",
                    time: executionTime,
                    memory: 0, // Memory tracking not available in simple exec
                    timeLimit: testCase.timeLimitSeconds || timeLimit,
                    memoryLimit: testCase.memoryLimitMB || 256,
                });

            } catch (error: any) {
                const endTime = Date.now();
                const executionTime = (endTime - startTime) / 1000;

                let status = "Runtime Error";
                if (error.killed || error.signal === "SIGTERM") {
                    status = "TLE";
                }

                results.push({
                    testNumber: i + 1,
                    status,
                    input: testCase.input,
                    expectedOutput: testCase.expectedOutput,
                    actualOutput: error.stdout || "",
                    time: executionTime,
                    memory: 0,
                    timeLimit: testCase.timeLimitSeconds || timeLimit,
                    memoryLimit: testCase.memoryLimitMB || 256,
                });
            }
        }

        // Calculate summary
        const passedCount = results.filter(r => r.status === "Passed").length;
        const totalTime = results.reduce((sum, r) => sum + r.time, 0);

        return NextResponse.json({
            results,
            summary: {
                passed: passedCount,
                total: results.length,
                percentage: Math.round((passedCount / results.length) * 100),
                totalTime: totalTime.toFixed(2),
            },
            executionMode: "local-batch"
        });

    } catch (error: any) {
        console.error("Batch evaluation error:", error);
        return NextResponse.json(
            {
                error: true,
                message: "Batch evaluation failed",
                details: error.message
            },
            { status: 500 }
        );
    } finally {
        // Cleanup
        if (tmpDir) {
            try {
                await fs.rm(tmpDir, { recursive: true, force: true });
            } catch (cleanupError) {
                console.error("Cleanup failed:", cleanupError);
            }
        }
    }
}
