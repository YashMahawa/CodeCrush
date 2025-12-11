import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { OpenRouter } from "@openrouter/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }

  return new GoogleGenAI({
    apiKey,
  });
}

function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY || "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";
  return new OpenRouter({
    apiKey,
  });
}

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

    if (language) {
      context += `Current Programming Language: ${language.toUpperCase()}\n`;
      context += `IMPORTANT: When providing code solutions or examples, use ${language.toUpperCase()} unless explicitly asked for a different language.\n\n`;
    }

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

    const systemInstructions = `${context}

IMPORTANT - Interface Context:
You are helping in an IDE with these features:
- LEFT PANEL: Problem description
- MIDDLE PANEL: Code editor with Run button (tests single input) and Evaluate button (tests all test cases)
- RIGHT PANEL: This chat / Test results

CRITICAL CODE GUIDELINES:
1. When writing code, ALWAYS read input from stdin (not hardcoded examples)
   - C/C++: Use scanf, cin, or similar
   - Python: Use input()
   - Java: Use Scanner or BufferedReader
2. Write output to stdout (print/cout/System.out)
3. DO NOT include example hardcoded test values in the code
4. The user will provide input through the "Run" button interface
5. Your code should work with ANY valid input, not just specific examples

Language-specific input patterns:
- C: scanf("%d", &n);
- C++: cin >> n;
- Python: n = int(input())
- Java: Scanner sc = new Scanner(System.in); int n = sc.nextInt();

Chat Guidelines:
- DEFAULT: Always use ${language || 'the current'} language for code solutions unless user specifically requests another language
- Hints: Guide thinking with questions, don't reveal solutions
- Solutions: Provide complete, runnable code that reads from stdin
- Be clear, encouraging, and educational
- Explain complexity when relevant
- Use proper markdown code blocks with \`\`\`${language || 'language'}\`\`\` tags

Now respond to the student's question.`;

    let responseText = "";

    if (model.startsWith("gemini")) {
        const ai = getGeminiClient();
        // Convert messages to Gemini format
        const conversationHistory = messages.map((msg: any) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
        }));

        const systemPrompt = {
            role: "user",
            parts: [{ text: systemInstructions }]
        };

        const allMessages = [systemPrompt, ...conversationHistory];

        console.log(`🤖 Calling Gemini AI (${model}) for chat assistance...`);

        const response = await ai.models.generateContent({
            model,
            contents: allMessages,
            config: {
                temperature: 0.7,
            },
        });
        responseText = response.text || "";

    } else {
        // Use OpenRouter
        const openRouter = getOpenRouterClient();
        console.log(`🤖 Calling OpenRouter (${model}) for chat assistance...`);

        const openRouterMessages = [
            { role: "system", content: systemInstructions },
            ...messages
        ];

        const response = await openRouter.chat.send({
            model: model,
            messages: openRouterMessages,
            temperature: 0.7,
        });

        const content = response.choices[0]?.message?.content;
        responseText = typeof content === "string" ? content : "";
    }

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
