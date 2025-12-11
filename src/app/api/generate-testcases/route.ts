import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { OpenRouter } from "@openrouter/sdk";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import util from "util";

const execAsync = util.promisify(exec);

export const runtime = "nodejs"; // Required for child_process
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({
    apiKey,
  });
}

function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY || "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";
  return new OpenRouter({
    apiKey,
  });
}

/**
 * Normal Mode: Direct JSON generation for small batches (~30)
 */
async function generateNormalCases(ai: GoogleGenAI, model: string, problemDescription: string, existingName?: string) {
  const shouldGenerateName = !existingName || existingName === "New Problem" || existingName === "Untitled Problem";

  const prompt = `Generate 30 diverse test cases for the following coding problem. Return strictly valid JSON.

Problem:
${problemDescription}

Requirements:
- Coverage: Include happy paths, basic edge cases (min/max inputs, empty, negative), boundary values, and common error scenarios.
- Format:
{
  ${shouldGenerateName ? '"name": "Problem Title (max 30 chars)",' : ''}
  "testCases": [
    {
      "input": "stdin input string",
      "expectedOutput": "stdout output string",
      "timeLimitSeconds": 2.0,
      "memoryLimitMB": 256
    }
  ]
}
- IMPORTANT: Input/Output must be raw strings exactly as expected by a competitive programming judge.
- Arrays/Vectors: Space-separated (e.g., "1 2 3 4"), NOT JSON arrays.
- Matrices: Newline-separated rows.
- No markdown formatting in the response, just the JSON string.
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { temperature: 0.7 },
  });

  return response.text || "";
}

/**
 * Comprehensive Mode: Python Script generation -> Execution (>100 cases)
 */
async function generateComprehensiveCases(ai: GoogleGenAI, model: string, problemDescription: string, existingName?: string) {
  const shouldGenerateName = !existingName || existingName === "New Problem" || existingName === "Untitled Problem";

  const prompt = `Write a Python script that generates 100-300 COMPREHENSIVE test cases for the following problem. 
The script must print ONLY a valid JSON object to stdout.

Problem:
${problemDescription}

Script Requirements:
1. Generate between 100 to 300 test cases.
2. EXHAUSTIVE EDGE CASE COVERAGE including:
   - Small manual edge cases (min constraints, empty, single items).
   - "LeetCode" style large random inputs (max constraints).
   - Tricky logic cases.
3. Input/Output Formatting:
   - "input": The string fed to stdin. Arrays must be space-separated (e.g., "1 2 3"), matrices newline-separated.
   - "expectedOutput": The EXACT stdout string expected from the correct solution.
   - YOU MUST SOLVE THE PROBLEM in the script to generate correct "expectedOutput".
4. Output JSON Structure:
{
  ${shouldGenerateName ? '"name": "Problem Title (max 30 chars)",' : ''}
  "testCases": [
    { "input": "...", "expectedOutput": "...", "timeLimitSeconds": 2.0, "memoryLimitMB": 256 }
  ]
}
5. The script should be self-contained and ready to run. Do not use external non-standard libraries (standard 'random', 'json', 'math' are fine).
6. PRINT ONLY THE JSON to stdout. No other text.
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { temperature: 0.7 },
  });

  const scriptText = response.text || "";
  // Extract python code from markdown blocks if present
  const cleanScript = scriptText.replace(/```python/g, "").replace(/```/g, "").trim();

  return cleanScript;
}

export async function POST(req: NextRequest) {
  try {
    const {
      problemDescription,
      mode = "normal", // "normal" | "comprehensive"
      model = "gemini-2.5-flash",
      existingName,
    } = await req.json();

    if (!problemDescription || problemDescription.trim().length < 10) {
      return NextResponse.json({ error: "Problem description too short" }, { status: 400 });
    }

    let jsonString = "";
    let generatedName = existingName;

    // Try Gemini first
    try {
      const ai = getGeminiClient();

      if (mode === "comprehensive") {
        const pythonScript = await generateComprehensiveCases(ai, model, problemDescription, existingName);
        const tempDir = os.tmpdir();
        const scriptPath = path.join(tempDir, `testgen_${Date.now()}.py`);
        await fs.writeFile(scriptPath, pythonScript, "utf-8");

        try {
          const { stdout } = await execAsync(`python "${scriptPath}"`, { timeout: 30000 });
          jsonString = stdout.trim();
        } catch (execError: any) {
          console.error("Python exec failed:", execError);
          return NextResponse.json({ error: "Failed to execute test generation script", details: execError.message }, { status: 500 });
        } finally {
          await fs.unlink(scriptPath).catch(() => { });
        }
      } else {
        jsonString = await generateNormalCases(ai, model, problemDescription, existingName);
      }
    } catch (geminiError: any) {
      console.log("Gemini failed, falling back to OpenRouter...", geminiError.message);

      // Fallback to OpenRouter
      try {
        const openrouter = getOpenRouterClient();
        const shouldGenerateName = !existingName || existingName === "New Problem" || existingName === "Untitled Problem";

        const prompt = `Generate 30 diverse test cases for the following coding problem. Return strictly valid JSON.

Problem:
${problemDescription}

Requirements:
- Coverage: Include happy paths, basic edge cases (min/max inputs, empty, negative), boundary values, and common error scenarios.
- Format:
{
  ${shouldGenerateName ? '"name": "Problem Title (max 30 chars)",' : ''}
  "testCases": [
    {
      "input": "stdin input string",
      "expectedOutput": "stdout output string",
      "timeLimitSeconds": 2.0,
      "memoryLimitMB": 256
    }
  ]
}
- IMPORTANT: Input/Output must be raw strings exactly as expected by a competitive programming judge.
- Arrays/Vectors: Space-separated (e.g., "1 2 3 4"), NOT JSON arrays.
- Matrices: Newline-separated rows.
- No markdown formatting in the response, just the JSON string.
`;

        const stream = await openrouter.chat.send({
          model: "mistralai/devstral-2512:free",
          messages: [{ role: "user", content: prompt }],
          stream: true
        });

        let fullResponse = "";
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            fullResponse += content;
          }
        }
        jsonString = fullResponse;
      } catch (openrouterError: any) {
        console.error("Both Gemini and OpenRouter failed:", openrouterError);
        return NextResponse.json({
          error: "All AI services failed. Please try again later.",
          details: `Gemini: ${geminiError.message}, OpenRouter: ${openrouterError.message}`
        }, { status: 503 });
      }
    }

    // 4. Parse and Validate
    let parsed: any;
    try {
      // Clean markdown if present (for normal mode or sloppy script output)
      const cleanJson = jsonString.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
      // Try finding JSON object braces if there is extra noise
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      const toParse = jsonMatch ? jsonMatch[0] : cleanJson;

      parsed = JSON.parse(toParse);
    } catch (err) {
      console.error("JSON Parse Error:", err, "Raw:", jsonString.slice(0, 200));
      return NextResponse.json({ error: "Failed to parse generated test cases." }, { status: 500 });
    }

    if (!parsed.testCases || !Array.isArray(parsed.testCases)) {
      return NextResponse.json({ error: "Invalid JSON structure: missing testCases array" }, { status: 500 });
    }

    // Use name if normal mode generated it, otherwise keep existing
    if (parsed.name && (!existingName || existingName === "New Problem")) {
      generatedName = parsed.name;
    }

    const validCases = parsed.testCases.filter((tc: any) => tc.input && tc.expectedOutput);

    console.log(`✅ Returned ${validCases.length} valid test cases.`);

    return NextResponse.json({
      testCases: validCases,
      name: generatedName,
      message: `Success`
    });

  } catch (error: any) {
    console.error("Critical Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
