import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { code, language, input, timeLimit = 5 } = await req.json();

    // Create a temporary directory for this execution
    const tmpDir = path.join("/tmp", `codecrush-${randomBytes(8).toString("hex")}`);
    await fs.mkdir(tmpDir, { recursive: true });

    let fileName: string;
    let compileCmd: string | null = null;
    let runCmd: string;

    try {
      switch (language) {
        case "c":
          fileName = path.join(tmpDir, "main.c");
          await fs.writeFile(fileName, code);
          compileCmd = `gcc "${fileName}" -o "${path.join(tmpDir, "main")}" 2>&1`;
          runCmd = `"${path.join(tmpDir, "main")}"`;
          break;

        case "cpp":
          fileName = path.join(tmpDir, "main.cpp");
          await fs.writeFile(fileName, code);
          compileCmd = `g++ "${fileName}" -o "${path.join(tmpDir, "main")}" -std=c++17 2>&1`;
          runCmd = `"${path.join(tmpDir, "main")}"`;
          break;

        case "python":
          fileName = path.join(tmpDir, "main.py");
          await fs.writeFile(fileName, code);

          let pythonPath = "python3";
          try {
            // Check if python3 is available
            await execAsync("python3 --version", { timeout: 1000 });
          } catch {
            // Fallback to py if python3 is missing
            pythonPath = "py";
          }

          runCmd = `${pythonPath} "${fileName}"`;
          break;

        case "java":
          // Extract class name from code
          const classMatch = code.match(/public\s+class\s+(\w+)/);
          const className = classMatch ? classMatch[1] : "Main";
          fileName = path.join(tmpDir, `${className}.java`);
          await fs.writeFile(fileName, code);
          compileCmd = `javac "${fileName}" 2>&1`;
          runCmd = `cd "${tmpDir}" && java ${className}`;
          break;

        default:
          return NextResponse.json(
            { error: `Unsupported language: ${language}` },
            { status: 400 }
          );
      }

      // Compile if needed
      let compileOutput = "";
      if (compileCmd) {
        try {
          const { stdout, stderr } = await execAsync(compileCmd, {
            timeout: timeLimit * 1000,
            maxBuffer: 10 * 1024 * 1024,
            encoding: "utf8",
          });
          compileOutput = `${stdout || ""}${stderr || ""}`;

          // Check for compilation errors
          if (compileOutput.toLowerCase().includes("error")) {
            return NextResponse.json({
              compileOutput: compileOutput.trim(),
              status: { id: 6, description: "Compilation Error" },
            });
          }
        } catch (error: any) {
          const errorStdout = typeof error.stdout === "string" ? error.stdout : Buffer.isBuffer(error.stdout) ? error.stdout.toString("utf8") : "";
          const errorStderr = typeof error.stderr === "string" ? error.stderr : Buffer.isBuffer(error.stderr) ? error.stderr.toString("utf8") : "";

          return NextResponse.json({
            compileOutput: (errorStdout + errorStderr || error.message || "Compilation failed").trim(),
            status: { id: 6, description: "Compilation Error" },
          });
        }
      }

      // Run the code with input
      const startTime = Date.now();
      try {
        // Write input to a temp file if provided
        let finalCmd = runCmd;
        if (input) {
          const inputFile = path.join(tmpDir, "input.txt");
          await fs.writeFile(inputFile, input);
          finalCmd = `${runCmd} < "${inputFile}"`;
        }

        const { stdout, stderr } = await execAsync(finalCmd, {
          timeout: timeLimit * 1000,
          maxBuffer: 10 * 1024 * 1024,
          encoding: "utf8",
        });
        const endTime = Date.now();

        return NextResponse.json({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          time: ((endTime - startTime) / 1000).toFixed(3),
          status: { id: 3, description: "Accepted" },
          executionMode: "local",
        });
      } catch (error: any) {
        const endTime = Date.now();

        if (error.killed && error.signal === "SIGTERM") {
          return NextResponse.json({
            status: { id: 5, description: "Time Limit Exceeded" },
            time: timeLimit.toString(),
            executionMode: "local",
          });
        }

        const stderrOutput = typeof error.stderr === "string"
          ? error.stderr
          : Buffer.isBuffer(error.stderr)
            ? error.stderr.toString("utf8")
            : "";
        const stdoutOutput = typeof error.stdout === "string"
          ? error.stdout
          : Buffer.isBuffer(error.stdout)
            ? error.stdout.toString("utf8")
            : "";

        return NextResponse.json({
          stderr: stderrOutput || stdoutOutput || error.message,
          time: ((endTime - startTime) / 1000).toFixed(3),
          status: { id: 11, description: "Runtime Error" },
          executionMode: "local",
        });
      }
    } finally {
      // Cleanup temporary files
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error("Failed to cleanup temp files:", cleanupError);
      }
    }
  } catch (error: any) {
    console.error("Local execution error:", error);
    return NextResponse.json({
      error: "Local execution failed",
      details: error.message,
      hint: "Make sure gcc/g++/python3/java are installed on the server",
    }, { status: 500 });
  }
}
