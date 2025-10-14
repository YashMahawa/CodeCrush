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
      messages,
      code,
      language,
      problemText,
      testResults,
      model = "gemini-2.5-flash",
    } = await req.json();

    modelUsed = model;

    // Build context
    let context = "You are an expert programming tutor helping a student with competitive programming.\n\n";
    
    if (problemText) {
      context += `Problem Description:\n${problemText}\n\n`;
    }
    
    if (code) {
      context += `Student's Current Code (${language}):\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    }
    
    if (testResults?.results) {
      const passed = testResults.results.filter((r: any) => r.status === "Passed").length;
      const total = testResults.results.length;
      context += `Test Results: ${passed}/${total} passed\n\n`;
    }

    // Convert messages to Gemini format
    const conversationHistory = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const systemPrompt = {
      role: "user",
      parts: [{
        text: `${context}

Guidelines:
- When asked for hints: Guide the student's thinking without revealing the solution. Ask probing questions.
- When asked for solution: Provide a clear, working solution with detailed explanations of the approach.
- Be encouraging and educational.
- Use code blocks with proper syntax highlighting.
- Explain time and space complexity when relevant.

Now respond to the student's question.`
      }]
    };

    const allMessages = [systemPrompt, ...conversationHistory];

    console.log(`🤖 Calling Gemini AI (${model}) for chat assistance...`);

    const response = await ai.models.generateContent({
      model,
      contents: allMessages,
      config: {
        temperature: 0.7,
        maxOutputTokens: 4000,
        ...(model === "gemini-2.5-flash" && {
          thinkingConfig: { thinkingBudget: 5000 }
        })
      },
    });

    const responseText = response.text || "";
    console.log("✅ Received AI response");

    return NextResponse.json({ response: responseText });
  } catch (error: any) {
    console.error("❌ Error in AI chat:", error);

    const errorMessage = error.message || String(error);
    const shouldSuggestFlash =
      modelUsed !== "gemini-2.5-flash" &&
      (errorMessage.includes("404") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("quota"));

    return NextResponse.json(
      {
        error: "Failed to get AI response",
        details: error.message,
        suggestion: shouldSuggestFlash 
          ? "Try switching to Gemini 2.5 Flash in the model selector at the top."
          : undefined,
      },
      { status: 500 }
    );
  }
}
