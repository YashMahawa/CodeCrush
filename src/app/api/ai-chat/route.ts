import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, code, language, problemText, testResults } = await req.json();

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

    console.log("🤖 Calling Gemini AI for chat assistance...");

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: allMessages,
      config: {
        temperature: 0.7,
        maxOutputTokens: 4000,
      },
    });

    const responseText = response.text || "";
    console.log("✅ Received AI response");

    return NextResponse.json({ response: responseText });
  } catch (error: any) {
    console.error("❌ Error in AI chat:", error);
    return NextResponse.json(
      {
        error: "Failed to get AI response",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
