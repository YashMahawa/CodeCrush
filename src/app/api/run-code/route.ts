import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com";
const API_KEY = process.env.JUDGE0_API_KEY!;
const API_HOST = process.env.JUDGE0_API_HOST!;

// Judge0 Language IDs (https://ce.judge0.com/languages)
const LANGUAGE_IDS: Record<string, number> = {
  c: 50,       // C (GCC 9.2.0)
  cpp: 54,     // C++ (GCC 9.2.0)
  python: 71,  // Python (3.8.1)
  java: 62,    // Java (OpenJDK 13.0.1)
};

export async function POST(req: NextRequest) {
  try {
    const { code, language, input, timeLimit, memoryLimit } = await req.json();

    // Validate inputs
    if (!code || !language) {
      return NextResponse.json(
        { error: "Code and language are required" },
        { status: 400 }
      );
    }

    if (!LANGUAGE_IDS[language]) {
      return NextResponse.json(
        { error: `Unsupported language: ${language}` },
        { status: 400 }
      );
    }

    // Prepare submission data
    const submissionData = {
      source_code: code,
      language_id: LANGUAGE_IDS[language],
      stdin: input || "",
      cpu_time_limit: timeLimit || 2.0,
      memory_limit: memoryLimit ? Math.round(memoryLimit * 1024) : 262144, // Convert MB to KB
    };

    console.log(`🚀 Submitting ${language} code to Judge0...`);

    // Submit code to Judge0 with wait=true for synchronous response
    const submissionResponse = await axios.post(
      `${JUDGE0_API_URL}/submissions`,
      submissionData,
      {
        headers: {
          "content-type": "application/json",
          "X-RapidAPI-Key": API_KEY,
          "X-RapidAPI-Host": API_HOST,
        },
        params: {
          base64_encoded: "false",
          wait: "true",        // Wait for execution to complete
          fields: "*",         // Get all fields in response
        },
      }
    );

    const result = submissionResponse.data;

    console.log(`✅ Execution completed - Status: ${result.status?.description}`);

    // Format and return the response
    const response = {
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      compileOutput: result.compile_output || "",
      time: parseFloat(result.time || "0"),
      memory: parseFloat(result.memory || "0") / 1024, // Convert KB to MB
      status: {
        id: result.status?.id || 0,
        description: result.status?.description || "Unknown",
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("❌ Error executing code:", error.response?.data || error.message);

    // Handle Judge0 API errors
    if (error.response?.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: "Authentication failed. Please check API configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to execute code",
        details: error.response?.data?.message || error.message,
      },
      { status: 500 }
    );
  }
}
