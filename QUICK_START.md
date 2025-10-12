# 🚀 Quick Start Guide - API Setup

This guide will walk you through getting CodeCrush fully operational in under 10 minutes.

---

## Step 1: Get Google Gemini API Key (2 minutes)

1. **Visit Google AI Studio**
   - Go to: https://aistudio.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key**
   - Click the blue "Create API Key" button
   - Select "Create API key in new project" (or select existing project)
   - Copy the generated key (it looks like: `AIzaSy...`)

3. **Save it**
   - Keep this key handy for the next step

---

## Step 2: Get Judge0 API Key (3 minutes)

1. **Sign up on RapidAPI**
   - Go to: https://rapidapi.com/judge0-official/api/judge0-ce
   - Click "Sign Up" (or "Log In" if you have an account)
   - Create a free account

2. **Subscribe to Judge0**
   - On the Judge0 CE page, click "Subscribe to Test"
   - Select the **FREE** plan (Basic - 50 requests/day)
   - Confirm subscription (no credit card required for free tier)

3. **Get Your API Key**
   - After subscribing, you'll see the API dashboard
   - Look for "X-RapidAPI-Key" in the code snippet section
   - Copy this key (it looks like: `a1b2c3d4e5...`)

---

## Step 3: Configure Environment Variables (1 minute)

1. **Create `.env.local` file**
   ```bash
   cd /home/yash/CodeCrush
   cp .env.example .env.local
   ```

2. **Edit `.env.local`**
   Open the file and replace the placeholder values:
   
   ```env
   # Google Gemini API Key
   GEMINI_API_KEY=AIzaSy_YOUR_ACTUAL_KEY_HERE
   
   # Judge0 API Configuration
   JUDGE0_API_KEY=a1b2c3d4e5_YOUR_ACTUAL_KEY_HERE
   JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
   ```

3. **Save the file**

---

## Step 4: Install Gemini SDK (30 seconds)

```bash
cd /home/yash/CodeCrush
npm install @google/generative-ai
```

---

## Step 5: Update API Routes (5 minutes)

### Update `/src/app/api/generate-testcases/route.ts`

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { problemDescription, complexity, quantity } = await req.json();

    const complexityInstructions = {
      Standard: "Include common test cases and basic edge cases (e.g., single element, small arrays).",
      Comprehensive:
        "Include all edge cases: empty inputs, single elements, max values, negative numbers, duplicates, and boundary conditions.",
      Performance:
        "Focus on large inputs to test time complexity. Use arrays with 10^4 to 10^5 elements, large strings, deep recursion depths.",
    };

    const prompt = `You are a competitive programming expert. Generate exactly ${quantity} test cases for the following problem.

**Problem Description:**
${problemDescription}

**Complexity Level:** ${complexity}
${complexityInstructions[complexity as keyof typeof complexityInstructions]}

**CRITICAL REQUIREMENTS:**
1. Time limits should allow standard solutions but prevent extremely inefficient ones
2. For problems expecting O(n) or O(n log n), set limit to 1-2 seconds
3. For problems allowing O(n²), set limit to 2-3 seconds
4. Memory limit is typically 256MB unless problem requires large data structures

**Output Format:**
Return ONLY a valid JSON array (no markdown, no explanations). Each test case MUST have this exact structure:

[
  {
    "input": "actual input as a string (exactly as it would appear in stdin)",
    "expectedOutput": "correct output as a string (exactly as it should appear in stdout)",
    "timeLimitSeconds": 2.0,
    "memoryLimitMB": 256
  }
]

**Important:**
- Input and output must be complete, valid test data
- Include newlines where needed (use \\n)
- Ensure outputs are correct for the given inputs
- Make test cases progressively harder`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // Extract JSON array
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from Gemini response");
    }

    const testCases = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!Array.isArray(testCases) || testCases.length === 0) {
      throw new Error("Invalid test cases format");
    }

    return NextResponse.json({
      testCases,
      message: `Successfully generated ${testCases.length} test cases`,
    });
  } catch (error: any) {
    console.error("Error generating test cases:", error);
    return NextResponse.json(
      {
        error: "Failed to generate test cases",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
```

### Update `/src/app/api/run-code/route.ts`

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com";
const API_KEY = process.env.JUDGE0_API_KEY!;
const API_HOST = process.env.JUDGE0_API_HOST!;

// Judge0 Language IDs
const LANGUAGE_IDS: Record<string, number> = {
  c: 50, // C (GCC 9.2.0)
  cpp: 54, // C++ (GCC 9.2.0)
  python: 71, // Python (3.8.1)
  java: 62, // Java (OpenJDK 13.0.1)
};

export async function POST(req: NextRequest) {
  try {
    const { code, language, input, timeLimit, memoryLimit } = await req.json();

    if (!LANGUAGE_IDS[language]) {
      return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }

    // Submit code for execution
    const submissionData = {
      source_code: code,
      language_id: LANGUAGE_IDS[language],
      stdin: input || "",
      cpu_time_limit: timeLimit || 2.0,
      memory_limit: memoryLimit ? Math.round(memoryLimit * 1024) : 262144, // Convert MB to KB
    };

    const submissionResponse = await axios.post(
      `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
      submissionData,
      {
        headers: {
          "content-type": "application/json",
          "X-RapidAPI-Key": API_KEY,
          "X-RapidAPI-Host": API_HOST,
        },
        params: {
          base64_encoded: "false",
          wait: "true",
          fields: "*",
        },
      }
    );

    const result = submissionResponse.data;

    // Return formatted response
    return NextResponse.json({
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      compileOutput: result.compile_output || "",
      time: parseFloat(result.time || "0"),
      memory: parseFloat(result.memory || "0") / 1024, // Convert KB to MB
      status: {
        id: result.status?.id,
        description: result.status?.description,
      },
    });
  } catch (error: any) {
    console.error("Error executing code:", error);
    return NextResponse.json(
      {
        error: "Failed to execute code",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
```

---

## Step 6: Restart Development Server

1. **Stop the current server** (Ctrl+C in the terminal where it's running)

2. **Start it again:**
   ```bash
   npm run dev
   ```

3. **The server will pick up the new environment variables**

---

## Step 7: Test Everything! 🎉

### Test 1: Generate Test Cases
1. Open http://localhost:3000
2. Paste a problem like:
   ```
   Write a program that reads two integers and prints their sum.
   Input: Two integers on a single line
   Output: Their sum
   ```
3. Click "Generate Test Cases"
4. You should see real AI-generated test cases!

### Test 2: Run Code
1. In the Code Forge panel, write a simple C program:
   ```c
   #include <stdio.h>
   int main() {
       int a, b;
       scanf("%d %d", &a, &b);
       printf("%d\n", a + b);
       return 0;
   }
   ```
2. Go to "Custom Input" tab, enter: `5 3`
3. Click "Run"
4. You should see output: `8`

### Test 3: Evaluate
1. With the code above and test cases generated
2. Click "Evaluate"
3. Watch the magic happen as it runs all test cases
4. See the beautiful results panel with pass/fail status!

---

## 🎊 You're Done!

CodeCrush is now fully operational! You can:
- ✅ Generate AI test cases
- ✅ Write code in C/C++/Python/Java
- ✅ Execute code securely
- ✅ Evaluate against all test cases
- ✅ See detailed results with pass/fail status

---

## 🐛 Troubleshooting

### "Failed to generate test cases"
- Check if `GEMINI_API_KEY` is correctly set in `.env.local`
- Verify the key works by testing at https://aistudio.google.com
- Check browser console for detailed error messages

### "Failed to execute code"
- Check if `JUDGE0_API_KEY` is correctly set in `.env.local`
- Verify you're subscribed to the free tier on RapidAPI
- Check if you've exceeded the rate limit (50 requests/day on free tier)

### Server not picking up environment variables
- Make sure the file is named `.env.local` (not `.env`)
- Restart the dev server completely (Ctrl+C, then `npm run dev`)
- Check for typos in variable names

### Compilation errors in code
- For C/C++: Make sure to include necessary headers
- For Python: Ensure proper indentation
- For Java: Class name must be `Main`

---

## 📚 What's Next?

Now that Phase 2 is complete, you can:
1. Add the AI Debugger (Phase 4)
2. Add confetti animations (Phase 3)
3. Deploy to Vercel (Phase 5)
4. Share with friends and show off! 🚀

---

**Estimated Time to Complete This Guide:** 10-15 minutes  
**Difficulty Level:** Easy  
**Prerequisites:** Node.js installed, basic command line knowledge

Happy coding with CodeCrush! 💙⚡
