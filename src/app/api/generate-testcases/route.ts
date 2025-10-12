import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { problemDescription, complexity, quantity } = await req.json();

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
2. Time limits should allow standard O(n) or O(n log n) solutions but prevent O(n³) algorithms
3. For simple problems: 1-2 seconds time limit
4. For problems with higher complexity: 2-3 seconds time limit
5. Memory limit is typically 256MB unless the problem requires large data structures (then use 512MB)
6. Make sure inputs and outputs are EXACTLY as they would appear in stdin/stdout
7. Include newlines (\\n) where needed in multi-line inputs/outputs
8. Test cases should progressively increase in difficulty

**Output Format:**
Return ONLY a valid JSON array with NO markdown formatting, NO code blocks, NO explanations. Just the raw JSON array:

[
  {
    "input": "actual input string exactly as it appears in stdin",
    "expectedOutput": "correct output string exactly as it appears in stdout",
    "timeLimitSeconds": 2.0,
    "memoryLimitMB": 256
  }
]

Generate ${quantity} test cases now. Remember: ONLY JSON array, nothing else.`;

    // Call Gemini API
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8000,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up response - remove markdown code blocks if present
    text = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Extract JSON array (handle cases where there's extra text)
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      console.error("Could not extract JSON from response:", text);
      throw new Error("Invalid response format from AI");
    }

    const testCases = JSON.parse(jsonMatch[0]);

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
    return NextResponse.json(
      {
        error: "Failed to generate test cases. Please try again.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
