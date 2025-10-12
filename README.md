# 🚀 CodeCrush

<div align="center">

![CodeCrush Logo](https://img.shields.io/badge/CodeCrush-v2.0-00FFFF?style=for-the-badge&logo=code&logoColor=white)

**AI-Powered Competitive Programming Environment**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

*Generate intelligent test cases, execute code securely, and evaluate solutions—all in a stunning holographic interface.*

</div>

---

## ✨ Features

### 🧠 **AI Test Case Generation**
Powered by Google Gemini 2.5 Flash with thinking mode:
- **Standard** test cases for common scenarios
- **Comprehensive** test cases with edge cases (empty inputs, boundaries, max values)
- **Performance** test cases for large inputs
- Automatic time/memory limit recommendations

### ⚡ **Multi-Language Code Execution**
Secure sandbox execution via Judge0 API:
- **Languages:** C, C++, Python, Java
- Real-time compilation and runtime error feedback
- Time and memory usage tracking
- Custom input testing

### 📊 **Smart Evaluation System**
Comprehensive test case evaluation:
- Flexible output comparison (handles whitespace variations)
- Status tracking: Passed ✅, Wrong Answer ❌, TLE ⏳, MLE 💣
- Interactive expandable test cards with diff views
- Filter by status (All/Passed/Failed)
- Circular progress visualization

### 🎨 **Holographic Glitch UI**
Immersive, distraction-free interface:
- Dynamic particle system with cursor spotlight
- Glassmorphism panels with neon accents (Cyan/Magenta/Lime)
- Monaco Editor (VS Code's editor)
- Smooth Framer Motion animations

---

## 🎯 Quick Start

### Prerequisites
- Node.js 18+
- [Google Gemini API Key](https://aistudio.google.com/app/apikey)
- [Judge0 API Key](https://rapidapi.com/judge0-official/api/judge0-ce) (via RapidAPI)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/codecrush.git
cd codecrush

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

Edit `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
JUDGE0_API_KEY=your_judge0_api_key_here
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
```

```bash
# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Code Editor:** Monaco Editor
- **AI:** Google Gemini 2.5 Flash (with thinking mode)
- **Code Execution:** Judge0 API (RapidAPI)

---

## 📖 How to Use

1. **Generate Test Cases** → Paste problem description, select complexity, click generate
2. **Write Code** → Use Monaco editor, select language (C/C++/Python/Java)
3. **Test** → Run with custom input or evaluate against all test cases
4. **Debug** → Expand failed tests to see input/expected/actual output comparison

---

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com) and import your repository
3. Add environment variables:
   - `GEMINI_API_KEY`
   - `JUDGE0_API_KEY`
   - `JUDGE0_API_HOST`
4. Deploy!

Vercel will automatically detect Next.js and configure the build settings.

---

## 📝 License

MIT License - feel free to use this project for learning or personal use.

---

<div align="center">

**Made with 💙 by Yash**

*Crush your coding challenges, one test case at a time.*

</div>
