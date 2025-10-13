import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({
  apiKey,
});

export async function POST(req: NextRequest) {
  const { problemDescription, complexity, quantity, model = "gemini-2.5-flash" } = await req.json();
  
  try {

    // Validate input
    if (!problemDescription || problemDescription.trim().length < 10) {
      return NextResponse.json(
        { error: "Problem description must be at least 10 characters" },
        { status: 400 }
      );
    }

    const complexityInstructions: Record<string, string> = {
      Standard:
        "Include common test cases and basic edge cases (e.g., single element, small arrays, typical inputs).",
      Comprehensive:
        "Include ALL edge cases: empty inputs, single elements, maximum values, negative numbers, duplicates, boundary conditions, special characters, and corner cases.",
      Performance:
        "Focus on LARGE inputs to test time complexity. Use arrays with 10^4 to 10^5 elements, very long strings, deep recursion depths, and stress-test scenarios.",
    };

    const prompt = `You are a competitive programming expert and test case generator. Generate exactly ${quantity} diverse test cases for the following problem.

**Problem Description:**
${problemDescription}

**Complexity Level:** ${complexity}
${complexityInstructions[complexity]}

**CRITICAL REQUIREMENTS:**
1. Generate VALID, WORKING test cases with correct expected outputs
2. Keep test inputs REASONABLE in size - avoid generating massive test cases with 100+ lines
3. For arrays/matrices, use small to medium sizes (1-20 elements typically, max 50 for performance tests)
4. Time limits should allow standard O(n) or O(n log n) solutions but prevent O(n³) algorithms
5. For simple problems: 1-2 seconds time limit
6. For problems with higher complexity: 2-3 seconds time limit
7. Memory limit is typically 256MB unless the problem requires large data structures (then use 512MB)
8. Make sure inputs and outputs are EXACTLY as they would appear in stdin/stdout
9. Include newlines (\\n) where needed in multi-line inputs/outputs
10. Test cases should progressively increase in difficulty
11. IMPORTANT: Do NOT use string concatenation (like "...") in your JSON. Provide COMPLETE, ACTUAL test data.

**Output Format:**
Return ONLY a valid JSON array with NO markdown formatting, NO code blocks, NO explanations, NO ellipsis (...). Just the raw, complete, parseable JSON array:

[
  {
    "input": "actual input string exactly as it appears in stdin",
    "expectedOutput": "correct output string exactly as it appears in stdout",
    "timeLimitSeconds": 2.0,
    "memoryLimitMB": 256
  }
]

Generate ${quantity} test cases now. Remember: ONLY JSON array, nothing else.`;

    // Call Gemini API with thinking mode enabled for Flash
    console.log(`🧠 Calling Gemini API (${model}) to generate test cases...`);
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 8000,
        ...(model === "gemini-2.5-flash" && {
          thinkingConfig: {
            thinkingBudget: 5000, // Enable thinking for better test case generation
          }
        })
      },
    });

    console.log("✅ Received response from Gemini");
    let text = response.text || "";

    // Clean up response - remove markdown code blocks if present
    text = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Try to parse directly first (most common case)
    let testCases;
    try {
      testCases = JSON.parse(text);
      console.log(`✅ Successfully parsed ${testCases.length} test cases`);
    } catch (parseError: any) {
      console.log("Direct parse failed, trying extraction...");
      console.log("Parse error:", parseError.message);
      console.log("First 200 chars of response:", text.substring(0, 200));
      console.log("Last 200 chars of response:", text.substring(text.length - 200));
      
      // If direct parse fails, try to extract JSON array
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("Could not extract JSON from response:", text.substring(0, 500));
        throw new Error("Invalid response format from AI");
      }
      
      try {
        testCases = JSON.parse(jsonMatch[0]);
        console.log(`✅ Successfully parsed ${testCases.length} test cases after extraction`);
      } catch (e2: any) {
        console.error("Failed to parse extracted JSON:", e2.message);
        throw new Error("Invalid response format from AI");
      }
    }

    // Validate structure
    if (!Array.isArray(testCases) || testCases.length === 0) {
      throw new Error("Invalid test cases format");
    }

    // Validate each test case has required fields
    for (const tc of testCases) {
      if (!tc.input || !tc.expectedOutput || !tc.timeLimitSeconds || !tc.memoryLimitMB) {
        throw new Error("Test case missing required fields");
      }
    }

    console.log(`✅ Successfully generated ${testCases.length} test cases`);

    return NextResponse.json({
      testCases,
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
    const shouldSuggestFlash = model !== "gemini-2.5-flash" && 
      (errorMessage.includes("404") || errorMessage.includes("not found") || errorMessage.includes("quota"));
    
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
