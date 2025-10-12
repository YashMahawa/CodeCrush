# 🚀 CodeCrush

<div align="center">

![CodeCrush Logo](https://img.shields.io/badge/CodeCrush-v2.0-00FFFF?style=for-the-badge&logo=code&logoColor=white)

**Your Ultimate AI-Powered Coding Companion**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

*Transform your competitive programming workflow with AI-generated test cases, secure code execution, and intelligent debugging assistance—all in a stunning holographic interface.*

[Demo](#) • [Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation)

</div>

---

## ✨ Features

### 🧠 **AI Test Case Generation**
Powered by Google Gemini AI, CodeCrush intelligently analyzes your problem description and generates:
- **Standard** test cases covering common scenarios
- **Comprehensive** test cases including edge cases (empty inputs, max values, boundaries)
- **Performance** test cases focusing on large inputs to stress-test your algorithms

### ⚡ **Secure Multi-Language Execution**
Execute your code safely in an isolated sandbox environment:
- **Supported Languages:** C, C++, Python, Java
- **Real-time feedback** with compilation errors, runtime errors, and output
- **Resource monitoring** with time and memory usage tracking

### 📊 **Advanced Evaluation System**
Comprehensive test case evaluation with detailed reporting:
- **Status Types:** Passed ✅, Wrong Answer ❌, Time Limit Exceeded ⏳, Memory Limit Exceeded 💣
- **Visual diff view** comparing expected vs actual output
- **Interactive test case cards** with expandable details
- **Filter results** by status (All, Passed, Failed)

### 🤖 **Tiered AI Assistance** *(Coming in Phase 4)*
A revolutionary learning system that guides you to solutions:
- **Tier 1: AI Debugger** - Analyzes your failed code and provides hints without giving away the solution
- **Tier 2: AI Code Corrector** - Shows the corrected code with side-by-side diff and explanations

### 🎨 **Holographic Glitch UI**
A breathtaking, hyper-interactive interface:
- **Dynamic particle system** that responds to cursor movement
- **Glassmorphism panels** with beautiful frosted glass effects
- **Neon accents** in Cyan, Magenta, and Lime Green
- **Smooth animations** powered by Framer Motion
- **Fully responsive** three-panel layout with resizable dividers

---

## 🎯 Quick Start

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **Google Gemini API Key** - [Get yours here](https://aistudio.google.com/app/apikey)
- **Judge0 API Key** - [Sign up on RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/codecrush.git
cd codecrush
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
JUDGE0_API_KEY=your_judge0_api_key_here
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
```

4. **Run the development server:**
```bash
npm run dev
```

5. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Project Structure

```
codecrush/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate-testcases/    # AI test case generation endpoint
│   │   │   └── run-code/              # Code execution endpoint
│   │   ├── globals.css                # Global styles & animations
│   │   ├── layout.tsx                 # Root layout
│   │   └── page.tsx                   # Main application page
│   └── components/
│       ├── HolographicBackground.tsx  # Animated particle background
│       ├── ProblemPanel.tsx           # Problem input & test generation
│       ├── CodePanel.tsx              # Monaco editor & execution
│       └── EvaluationPanel.tsx        # Results display & analysis
├── public/                            # Static assets
├── .env.example                       # Environment variables template
├── tailwind.config.ts                 # Tailwind CSS configuration
├── tsconfig.json                      # TypeScript configuration
└── package.json                       # Dependencies
```

---

## 🛠️ Technology Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Animations** | Framer Motion |
| **Code Editor** | Monaco Editor (VS Code's editor) |
| **AI Provider** | Google Gemini API |
| **Code Execution** | Judge0 API |
| **Validation** | Zod |

---

## 📖 Usage Guide

### 1️⃣ Generate Test Cases
1. Paste your problem description in the **Problem Sphere** panel (left)
2. Select complexity level and quantity
3. Click **"Generate Test Cases"**
4. AI will analyze and create test cases with time/memory limits

### 2️⃣ Write Your Solution
1. Write your code in the **Code Forge** panel (middle)
2. Select your programming language
3. Use the **Custom Input** tab to test with specific inputs
4. Click **"Run"** to execute and see output

### 3️⃣ Evaluate Against All Tests
1. Click **"Evaluate"** to run against all generated test cases
2. Watch real-time progress in the **Evaluation Matrix** (right)
3. View comprehensive results with pass/fail status
4. Expand individual test cases to see detailed comparisons

### 4️⃣ Debug with AI *(Phase 4)*
1. If tests fail, click **"Stuck? Analyze Code"**
2. AI provides hints and guidance without spoiling the solution
3. If needed, click **"Need a fix? Show Solution"**
4. View side-by-side diff of your code vs corrected version

---

## 🎨 Design Philosophy

CodeCrush isn't just a tool—it's an **experience**. Every pixel, animation, and interaction is crafted to:

- **Reduce cognitive load** with clear visual hierarchies
- **Provide instant feedback** through color-coded status indicators
- **Create delight** with smooth animations and satisfying interactions
- **Enable focus** with a distraction-free, immersive interface

The **Holographic Glitch** aesthetic combines:
- Dark, high-contrast backgrounds for reduced eye strain
- Neon accents that draw attention to key actions
- Particle effects that make the interface feel alive
- Glassmorphism that adds depth and elegance

---

## 🚀 Development Roadmap

### ✅ Phase 1: Foundation (Complete)
- [x] Next.js project setup
- [x] Three-panel layout
- [x] Monaco Editor integration
- [x] Holographic background

### 🔄 Phase 2: Intelligence (In Progress)
- [ ] `/api/generate-testcases` endpoint
- [ ] `/api/run-code` endpoint
- [ ] Test case evaluation logic
- [ ] Results visualization

### 📅 Phase 3: Polish
- [ ] Framer Motion animations
- [ ] Diff view for wrong answers
- [ ] Confetti effect for 100% pass
- [ ] Responsive layout improvements

### 📅 Phase 4: AI Assistance
- [ ] AI Debugger (Tier 1)
- [ ] AI Code Corrector (Tier 2)
- [ ] Markdown rendering for AI responses
- [ ] Modal system for AI interactions

### 📅 Phase 5: Production
- [ ] Shareable session links
- [ ] Local history persistence
- [ ] Performance optimizations
- [ ] Comprehensive testing

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini** for powerful AI capabilities
- **Judge0** for secure code execution
- **Monaco Editor** for the world-class code editing experience
- **Vercel** for seamless deployment

---

## 📧 Contact

**Your Name** - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: [https://github.com/yourusername/codecrush](https://github.com/yourusername/codecrush)

---

<div align="center">

**Made with 💙 and ⚡ by [Your Name]**

*Crush your coding challenges, one test case at a time.*

</div>
