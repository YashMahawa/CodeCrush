import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { code, language, input, timeLimit, memoryLimit } = await req.json();

    // TODO: Implement Judge0 API integration
    // For now, return mock data
    const mockOutput = {
      stdout: "Mock output\nYour code will be executed here",
      stderr: null,
      compileOutput: null,
      time: 0.123,
      memory: 4.5,
      status: { id: 3, description: "Accepted" },
    };

    return NextResponse.json(mockOutput);
  } catch (error) {
    console.error("Error running code:", error);
    return NextResponse.json(
      { error: "Failed to execute code" },
      { status: 500 }
    );
  }
}
