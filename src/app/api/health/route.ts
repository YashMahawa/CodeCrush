import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV || "local",
      },
      apiKeys: {
        gemini: !!process.env.GEMINI_API_KEY,
        geminiLength: process.env.GEMINI_API_KEY?.length || 0,
        judge0: !!process.env.JUDGE0_API_KEY,
        judge0Length: process.env.JUDGE0_API_KEY?.length || 0,
      },
    };

    return NextResponse.json(health);
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
