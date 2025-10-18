import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
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

export async function POST(req: NextRequest) {
  let modelUsed = "gemini-2.5-flash";
  try {
    const ai = getGeminiClient();
    const {
      problemDescription,
      complexity,
      quantity,
      model = "gemini-2.5-flash",
      existingName,
    } = await req.json();
    modelUsed = model;

    if (!problemDescription || problemDescription.trim().length < 10) {
      return NextResponse.json(
        { error: "Problem description must be at least 10 characters" },
        { status: 400 }
      );
    }

    const normalizedQuantity = Number(quantity) || 10;
    const effectiveComplexity =
      complexity === "Comprehensive" ? "Comprehensive" : "Basic";

    const complexityInstructions: Record<string, string> = {
      Basic:
        "Include common happy-path and edge scenarios (single element, empty input, small arrays, typical values).",
      Comprehensive:
        "Include ALL major edge cases: empty inputs, single elements, maximal constraints, negative numbers, duplicates, boundary conditions, stress tests, and tricky corner cases.",
    };

    const fallbackName = (() => {
      const firstLine = problemDescription.split("\n")[0].trim();
      if (!firstLine) return "Untitled Problem";
      return firstLine.length > 30 ? `${firstLine.slice(0, 27)}...` : firstLine;
    })();

    // Only request name if not provided
    const shouldGenerateName = !existingName || existingName === "New Problem" || existingName === "Untitled Problem";

    const prompt = shouldGenerateName 
      ? `Generate ${normalizedQuantity} test cases for this problem. Return only valid JSON.

Problem:
${problemDescription}

Coverage: ${effectiveComplexity === "Comprehensive" ? "Include edge cases, max constraints, empty inputs, single elements, duplicates, and corner cases" : "Include typical cases and basic edge cases"}

Format:
{
  "name": "Problem Title (max 30 chars)",
  "testCases": [
    {
      "input": "actual stdin input",
      "expectedOutput": "exact stdout output",
      "timeLimitSeconds": 2,
      "memoryLimitMB": 256
    }
  ]
}

Requirements:
- Return ONLY the JSON object (no markdown, no explanations)
- All inputs/outputs must have actual content (no empty strings, no whitespace-only, no single newlines)
- Write full inputs (no "..." or placeholders)
- Match exact output format expected by a judge
- Keep inputs reasonably sized (under 1000 characters each)
- Time: 1-3 seconds, Memory: 128-512 MB
`
      : `Generate ${normalizedQuantity} test cases for this problem. Return only valid JSON.

Problem:
${problemDescription}

Coverage: ${effectiveComplexity === "Comprehensive" ? "Include edge cases, max constraints, empty inputs, single elements, duplicates, and corner cases" : "Include typical cases and basic edge cases"}

Format:
{
  "testCases": [
    {
      "input": "actual stdin input",
      "expectedOutput": "exact stdout output",
      "timeLimitSeconds": 2,
      "memoryLimitMB": 256
    }
  ]
}

Requirements:
- Return ONLY the JSON object (no markdown, no explanations)
- All inputs/outputs must have actual content (no empty strings, no whitespace-only, no single newlines)
- Write full inputs (no "..." or placeholders)
- Match exact output format expected by a judge
- Keep inputs reasonably sized (under 1000 characters each)
- Time: 1-3 seconds, Memory: 128-512 MB
`;

    console.log(`🧠 Calling Gemini API (${model}) to generate test cases...`);
    console.log(`📝 Problem description length: ${problemDescription.length} chars`);

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.5,
        topP: 0.9,
        topK: 40,
      },
    });

    console.log("✅ Received response from Gemini");
    
    if (!response || !response.text) {
      console.error("❌ Empty response from Gemini API");
      throw new Error("Empty response from AI model");
    }
    
    let text = response.text || "";
    console.log(`📄 Response length: ${text.length} chars`);

    text = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");

    let parsed: any = null;

    const attemptParse = (raw: string) => {
      const cleaned = raw.trim();
      if (!cleaned) return null;
      return JSON.parse(cleaned);
    };

    try {
      parsed = attemptParse(text);
    } catch (error) {
      console.log("Direct parse failed, attempting extraction", (error as Error).message);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = attemptParse(jsonMatch[0]);
        } catch (nestedError) {
          console.error("Failed to parse extracted JSON:", (nestedError as Error).message);
        }
      }
    }

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid response format from AI");
    }

    const { name, testCases } = parsed;

    if (!Array.isArray(testCases) || testCases.length === 0) {
      throw new Error("Invalid test cases format");
    }

    const validatedTestCases = testCases.map((tc: any, index: number) => {
      // Ensure all required fields exist with defaults
      const input = typeof tc?.input === "string" ? tc.input : "";
      const expectedOutput = typeof tc?.expectedOutput === "string" ? tc.expectedOutput : "";
      const timeLimitSeconds = typeof tc?.timeLimitSeconds === "number" 
        ? tc.timeLimitSeconds 
        : (typeof tc?.timeLimitSeconds === "string" ? parseFloat(tc.timeLimitSeconds) : 2.0);
      const memoryLimitMB = typeof tc?.memoryLimitMB === "number" 
        ? tc.memoryLimitMB 
        : (typeof tc?.memoryLimitMB === "string" ? parseFloat(tc.memoryLimitMB) : 256);

      // Reject empty or whitespace-only inputs/outputs
      const inputTrimmed = input.trim();
      const outputTrimmed = expectedOutput.trim();
      
      if (!inputTrimmed || !outputTrimmed) {
        console.warn(`⚠️ Test case ${index + 1} rejected: empty input or output`);
        return null;
      }

      // Reject inputs that are only whitespace characters
      if (/^[\s\n\r\t]+$/.test(input) || /^[\s\n\r\t]+$/.test(expectedOutput)) {
        console.warn(`⚠️ Test case ${index + 1} rejected: whitespace-only content`);
        return null;
      }

      return {
        input,
        expectedOutput,
        timeLimitSeconds: Math.max(0.5, Math.min(timeLimitSeconds, 10)),
        memoryLimitMB: Math.max(64, Math.min(memoryLimitMB, 1024)),
      };
    }).filter(Boolean);

    if (validatedTestCases.length === 0) {
      throw new Error("No valid test cases generated");
    }

    // Use existing name if provided, otherwise use AI-generated name (max 30 chars) or fallback
    const resolvedName = existingName && existingName !== "New Problem" && existingName !== "Untitled Problem"
      ? existingName
      : (typeof name === "string" && name.trim().length > 0 
          ? name.trim().slice(0, 30) 
          : fallbackName);

    console.log(
      `✅ Successfully generated ${validatedTestCases.length} test cases${!existingName ? ` with name: ${resolvedName}` : ''}`
    );

    return NextResponse.json({
      testCases: validatedTestCases,
      name: resolvedName,
      message: `Successfully generated ${validatedTestCases.length} test cases`,
    });
  } catch (error: any) {
    console.error("❌ Error generating test cases:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      name: error.name,
      code: error.code,
    });
    
    // Log environment info (without exposing keys)
    console.error("Environment check:", {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      keyLength: process.env.GEMINI_API_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    });

    const errorMessage = error.message || String(error);
    
    // Detect network/fetch errors
    const isNetworkError = 
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("ETIMEDOUT") ||
      errorMessage.includes("network") ||
      errorMessage.includes("ENOTFOUND");
    
    const shouldSuggestFlash =
      modelUsed !== "gemini-2.5-flash" &&
      (errorMessage.includes("404") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("quota"));

    let userMessage = "Failed to generate test cases. Please try again.";
    let suggestion = undefined;

    if (isNetworkError) {
      userMessage = "Network connection error. Check your internet connection.";
      suggestion = "Verify your internet connection and try again in a moment.";
    } else if (shouldSuggestFlash) {
      suggestion = "Try switching to Gemini 2.5 Flash in the model selector at the top.";
    } else if (errorMessage.includes("API key")) {
      userMessage = "API authentication error.";
      suggestion = "Check that your GEMINI_API_KEY is set correctly in .env.local";
    }

    return NextResponse.json(
      {
        error: userMessage,
        details: error.message || "Unknown error",
        apiKeySet: !!process.env.GEMINI_API_KEY,
        suggestion,
      },
      { status: 500 }
    );
  }
}
