import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { problemDescription, complexity, quantity } = await req.json();

    // TODO: Implement Gemini API integration
    // For now, return mock data
    const mockTestCases = Array.from({ length: Math.min(quantity, 5) }, (_, i) => ({
      input: `Test input ${i + 1}`,
      expectedOutput: `Expected output ${i + 1}`,
      timeLimitSeconds: 2.0,
      memoryLimitMB: 256,
    }));

    return NextResponse.json({
      testCases: mockTestCases,
      message: "Test cases generated successfully (mock data)",
    });
  } catch (error) {
    console.error("Error generating test cases:", error);
    return NextResponse.json(
      { error: "Failed to generate test cases" },
      { status: 500 }
    );
  }
}
