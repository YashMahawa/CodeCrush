import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({
  apiKey,
});

export async function POST(req: NextRequest) {
  let modelUsed = "gemini-2.5-flash";
  try {
    const {
      problemDescription,
      complexity,
      quantity,
      model = "gemini-2.5-flash",
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
      return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
    })();

    const prompt = `You are a competitive programming expert. Produce a JSON object containing a short descriptive problem name and ${normalizedQuantity} diverse, fully-specified test cases for the following problem.

Problem Description:
${problemDescription}

Complexity Level: ${effectiveComplexity}
${complexityInstructions[effectiveComplexity]}

RESPONSE FORMAT (MANDATORY):
{
  "name": "Concise descriptive title (max 60 characters)",
  "testCases": [
    {
      "input": "stdin for the test case",
      "expectedOutput": "stdout for the correct solution",
      "timeLimitSeconds": 2.0,
      "memoryLimitMB": 256
    }
  ]
}

RULES:
1. Return ONLY raw JSON (no markdown, no code fences, no explanations).
2. Provide exactly ${normalizedQuantity} test cases.
3. Inputs must be fully written out (no ellipsis or descriptive text).
4. Outputs must match the exact formatting a judge expects (including newlines).
5. Keep inputs reasonable in size (max ~50 tokens/elements per test).
6. Time limits: 1-2 seconds for simple problems, up to 3 seconds for heavy cases.
7. Memory limits: typically 256MB, at most 512MB when justified.
8. The name should be unique, specific, and reflect the core challenge.
`;

    console.log(`🧠 Calling Gemini API (${model}) to generate test cases...`);

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 8000,
  ...(model === "gemini-2.5-flash" && {
          thinkingConfig: {
            thinkingBudget: 5000,
          },
        }),
      },
    });

    console.log("✅ Received response from Gemini");
    let text = response.text || "";

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

    for (const tc of testCases) {
      if (!tc?.input || !tc?.expectedOutput || !tc?.timeLimitSeconds || !tc?.memoryLimitMB) {
        throw new Error("Test case missing required fields");
      }
    }

    const resolvedName =
      typeof name === "string" && name.trim().length > 0 ? name.trim() : fallbackName;

    console.log(
      `✅ Successfully generated ${testCases.length} test cases with name: ${resolvedName}`
    );

    return NextResponse.json({
      testCases,
      name: resolvedName,
      message: `Successfully generated ${testCases.length} test cases`,
    });
  } catch (error: any) {
    console.error("❌ Error generating test cases:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });

    const errorMessage = error.message || String(error);
    const shouldSuggestFlash =
      modelUsed !== "gemini-2.5-flash" &&
      (errorMessage.includes("404") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("quota"));

    return NextResponse.json(
      {
        error: "Failed to generate test cases. Please try again.",
        details: error.message || "Unknown error",
        apiKeySet: !!process.env.GEMINI_API_KEY,
        suggestion: shouldSuggestFlash
          ? "Try switching to Gemini 2.5 Flash in the model selector at the top."
          : undefined,
      },
      { status: 500 }
    );
  }
}
