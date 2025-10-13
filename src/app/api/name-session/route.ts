import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { problem } = await req.json();

    if (!problem || problem.trim().length < 10) {
      return NextResponse.json({ name: "Untitled Problem" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured");
      return NextResponse.json({ name: extractFallbackName(problem) });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Given this competitive programming problem description, generate a short, descriptive name (3-5 words max) that captures the essence of the problem. Be concise and specific.

Problem:
${problem}

Respond with ONLY the name, nothing else. Examples: "Two Sum Problem", "Binary Tree Traversal", "Matrix Rotation"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 50,
      },
    });

    const name = response.text?.trim() || extractFallbackName(problem);
    
    // Clean up the name (remove quotes, extra spaces)
    const cleanName = name.replace(/['"]/g, "").trim().slice(0, 50);

    return NextResponse.json({ name: cleanName });
  } catch (error: any) {
    console.error("Error generating session name:", error);
    const { problem } = await req.json();
    return NextResponse.json({ name: extractFallbackName(problem) });
  }
}

function extractFallbackName(problem: string): string {
  const firstLine = problem.split("\n")[0].trim();
  return firstLine.slice(0, 40) + (firstLine.length > 40 ? "..." : "") || "Untitled Problem";
}
