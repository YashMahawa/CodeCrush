# 📁 CodeCrush Project Structure

```
CodeCrush/
│
├── 📄 README.md                          # Main project documentation
├── 📄 PROJECT_STATUS.md                  # Current status & next steps
├── 📄 QUICK_START.md                     # API setup guide
├── 📄 ARCHITECTURE.md                    # This file
│
├── 📦 package.json                       # Dependencies & scripts
├── 📦 package-lock.json                  # Locked dependency versions
│
├── ⚙️ Configuration Files
│   ├── next.config.js                    # Next.js configuration
│   ├── tsconfig.json                     # TypeScript configuration
│   ├── tailwind.config.ts                # Tailwind CSS custom theme
│   ├── postcss.config.js                 # PostCSS configuration
│   ├── .gitignore                        # Git ignore rules
│   └── .env.example                      # Environment variables template
│
├── 📂 src/                               # Source code
│   │
│   ├── 📂 app/                           # Next.js App Router
│   │   │
│   │   ├── 📄 layout.tsx                 # Root layout (metadata, fonts)
│   │   ├── 📄 page.tsx                   # Main application page
│   │   ├── 🎨 globals.css                # Global styles & animations
│   │   │
│   │   └── 📂 api/                       # API Routes (Backend)
│   │       │
│   │       ├── 📂 generate-testcases/    
│   │       │   └── 📄 route.ts           # Gemini AI test generation
│   │       │
│   │       └── 📂 run-code/              
│   │           └── 📄 route.ts           # Judge0 code execution
│   │
│   └── 📂 components/                    # React Components
│       │
│       ├── 🌌 HolographicBackground.tsx  # Animated particle system
│       ├── 📝 ProblemPanel.tsx           # Left panel: Problem input
│       ├── ⚡ CodePanel.tsx              # Middle panel: Code editor
│       └── 📊 EvaluationPanel.tsx        # Right panel: Results display
│
└── 📂 public/                            # Static assets (images, icons)
    └── (empty for now)
```

---

## 🔍 Detailed Component Breakdown

### **Main Application (`src/app/page.tsx`)**
```
┌─────────────────────────────────────────────────────────────┐
│                      📱 CodeCrush Logo                        │
├──────────────┬──────────────┬──────────────────────────────┤
│              │              │                               │
│  Problem     │  Code        │  Evaluation                   │
│  Sphere      │  Forge       │  Matrix                       │
│              │              │                               │
│  [TextArea]  │  [Monaco     │  [Results Display]            │
│              │   Editor]    │                               │
│  Complexity  │              │  - Progress Circle            │
│  Quantity    │  Language    │  - Filter Pills               │
│              │              │  - Test Case Cards            │
│  [Generate]  │  [Run] [Eval]│                               │
│              │              │                               │
│              │  AI Buttons  │                               │
│              │  Tabs        │                               │
└──────────────┴──────────────┴──────────────────────────────┘
```

**State Management:**
- `problemText`: User's problem description
- `testCases`: Array of generated test cases
- `code`: User's code in the editor
- `language`: Selected programming language
- `evaluationResults`: Results from test execution
- `isGenerating`: Loading state for test generation
- `isEvaluating`: Loading state for evaluation

---

### **Component 1: ProblemPanel** (Left)

**Purpose:** Problem input and test case generation

**UI Elements:**
- Large textarea for problem description
- Dropdown for complexity (Standard, Comprehensive, Performance)
- Dropdown for quantity (10, 25, 50)
- Generate button with loading state
- Error message display

**API Integration:**
```typescript
POST /api/generate-testcases
Body: { problemDescription, complexity, quantity }
Response: { testCases: Array<TestCase> }
```

**State:**
- Local: `complexity`, `quantity`, `error`
- Global: `problemText`, `setTestCases`, `isGenerating`

---

### **Component 2: CodePanel** (Middle)

**Purpose:** Code editing and execution

**UI Elements:**
- Monaco Editor (VS Code's editor)
- Language selector (C, C++, Python, Java)
- Run button (for custom input)
- Evaluate button (for all test cases)
- AI assistance buttons (disabled in Phase 1)
- Tabs: Custom Input, Run Log

**API Integration:**
```typescript
POST /api/run-code
Body: { code, language, input, timeLimit?, memoryLimit? }
Response: { stdout, stderr, compileOutput, time, memory, status }
```

**Features:**
- Syntax highlighting
- Auto-completion
- Line numbers
- Custom theme matching the UI

---

### **Component 3: EvaluationPanel** (Right)

**Purpose:** Display test results

**UI States:**

1. **Initial State:**
   - CodeCrush logo animation
   - "Results will materialize here" message

2. **Loading State:**
   - Lightning bolt animation
   - Progress text: "Test 5/25"
   - Progress bar

3. **Results State:**
   - Circular progress ring (% passed)
   - Filter pills (All, Passed, Failed)
   - Scrollable list of test case cards

**Test Case Card (Collapsed):**
```
✅ Test Case #5 | Time: 0.12s | Memory: 4.2MB
```

**Test Case Card (Expanded):**
```
✅ Test Case #5

Input:
[Display input]

Expected Output:       Your Output:
[Expected]             [Actual]

[Status-specific info for TLE/MLE]
```

**Status Types:**
- ✅ Passed (green border)
- ❌ Wrong Answer (red border)
- ⏳ Time Limit Exceeded (yellow border)
- 💣 Memory Limit Exceeded (yellow border)
- ⚠️ Compilation Error (orange border)

---

## 🎨 Styling Architecture

### **Color Palette**
```css
--neonCyan: #00FFFF     /* Primary actions, interactive elements */
--neonMagenta: #FF00FF  /* AI features, loading states */
--neonLime: #39FF14     /* Pass states, positive feedback */
--brightRed: #FF1744    /* Fail states, errors */
--background: #101015   /* Main background */
--panel: rgba(20,20,25,0.6) /* Glass panels */
```

### **Key CSS Classes**
- `.glass-panel`: Glassmorphism effect
- `.neon-cyan-glow`: Cyan glow for buttons
- `.neon-magenta-glow`: Magenta glow for AI features
- Custom scrollbars with neon accents

### **Animations**
- Particle movement (Canvas API)
- Cursor spotlight (Radial gradient)
- Button hover effects (Framer Motion)
- Progress animations (Framer Motion)
- Test card expand/collapse (Framer Motion)

---

## 🔌 API Architecture

### **Backend: Next.js API Routes**

**Why Next.js API Routes?**
- Serverless by default (perfect for Vercel)
- TypeScript support
- Automatic API routing
- Built-in request/response handling
- Easy environment variable access

**Route 1: Test Case Generation**
```
File: src/app/api/generate-testcases/route.ts
Method: POST
Purpose: Generate test cases using Gemini AI

Flow:
1. Receive problem description, complexity, quantity
2. Construct optimized prompt for Gemini
3. Call Gemini API
4. Parse and validate JSON response
5. Return test cases array

Error Handling:
- Invalid prompt → 400 Bad Request
- Gemini API failure → 502 Bad Gateway
- Malformed response → 500 Internal Server Error
```

**Route 2: Code Execution**
```
File: src/app/api/run-code/route.ts
Method: POST
Purpose: Execute code using Judge0 API

Flow:
1. Receive code, language, input, limits
2. Map language to Judge0 language ID
3. Submit to Judge0 for execution
4. Poll for results (Judge0 async execution)
5. Return stdout, stderr, time, memory

Error Handling:
- Unsupported language → 400 Bad Request
- Judge0 API failure → 502 Bad Gateway
- Timeout → 504 Gateway Timeout
```

---

## 🔐 Security & Best Practices

### **Environment Variables**
- Never commit `.env.local` to git
- Store API keys only on server-side
- Use Next.js built-in `process.env`

### **Input Validation**
- Sanitize all user inputs
- Use Zod for schema validation
- Limit problem description length
- Validate language selection

### **Rate Limiting**
- Monitor API usage (especially Judge0 free tier)
- Implement client-side request throttling
- Add loading states to prevent spam clicks

### **Error Handling**
- Graceful degradation
- User-friendly error messages
- Console logging for debugging
- Toast notifications for temporary errors

---

## 📊 Data Flow

### **Test Case Generation Flow**
```
User Input (Problem Text)
  ↓
ProblemPanel validates input
  ↓
POST /api/generate-testcases
  ↓
Gemini AI generates test cases
  ↓
Backend validates & parses JSON
  ↓
TestCases stored in state
  ↓
UI updates with test count
```

### **Code Evaluation Flow**
```
User clicks "Evaluate"
  ↓
Loop through all test cases
  ↓
For each test case:
  POST /api/run-code with input
  ↓
  Judge0 executes code
  ↓
  Compare output with expected
  ↓
  Determine status (Pass/Fail/TLE/MLE)
  ↓
  Update progress UI
  ↓
Store all results in state
  ↓
Display summary & detailed results
```

---

## 🚀 Deployment Architecture

### **Vercel Deployment**
```
GitHub Repository
  ↓
Vercel Auto-Deploy
  ↓
Build Next.js App
  ↓
Deploy to Edge Network
  ↓
Environment Variables from Vercel Dashboard
  ↓
Live at yourapp.vercel.app
```

**Build Configuration:**
- Framework: Next.js
- Build Command: `next build`
- Output Directory: `.next`
- Install Command: `npm install`

**Environment Variables (Vercel Dashboard):**
- `GEMINI_API_KEY`
- `JUDGE0_API_KEY`
- `JUDGE0_API_HOST`

---

## 🔮 Future Extensions (Phase 4+)

### **AI Debugger Integration**
```
New Component: AIDebuggerModal.tsx
New API Route: /api/ai-debug

Flow:
User clicks "Analyze Code" → 
Send (code + problem + failed test) to Gemini →
AI provides hints and questions →
Display in modal with Markdown rendering
```

### **AI Code Corrector**
```
New Component: AICodeCorrectorModal.tsx
New API Route: /api/ai-correct

Flow:
User clicks "Show Solution" →
Send code to Gemini for correction →
AI returns corrected code + explanations →
Display side-by-side diff view
```

### **Additional Features**
- Shareable session URLs (store state in database)
- Local history (IndexedDB)
- Code templates for each language
- Export results as PDF
- Leaderboard for problem-solving speed

---

## 📚 Dependencies Explained

### **Production Dependencies**
```json
{
  "@monaco-editor/react": "VS Code editor component",
  "axios": "HTTP client for API calls",
  "framer-motion": "Animation library",
  "next": "React framework with SSR",
  "react": "UI library",
  "react-markdown": "Markdown rendering for AI",
  "react-syntax-highlighter": "Code syntax highlighting",
  "zod": "Schema validation"
}
```

### **Dev Dependencies**
```json
{
  "@types/*": "TypeScript type definitions",
  "autoprefixer": "CSS vendor prefixes",
  "eslint": "Code linting",
  "postcss": "CSS processing",
  "tailwindcss": "Utility-first CSS",
  "typescript": "Type safety"
}
```

---

## 🎓 Learning Resources

If you want to understand the technologies better:

- **Next.js App Router:** https://nextjs.org/docs/app
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Framer Motion:** https://www.framer.com/motion
- **Monaco Editor:** https://microsoft.github.io/monaco-editor
- **Google Gemini:** https://ai.google.dev/docs
- **Judge0:** https://ce.judge0.com

---

**This architecture is designed for:**
- ⚡ Performance (serverless, edge deployment)
- 🎨 Beautiful UX (animations, glassmorphism)
- 🧠 Intelligence (AI test generation, debugging)
- 🔒 Security (API keys on server, input validation)
- 📈 Scalability (stateless APIs, edge functions)

---

*Built with precision, powered by AI, designed for developers. 🚀*
