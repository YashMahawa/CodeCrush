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
Powered by Google Gemini 2.5 Flash/Pro with thinking mode:
- **Model Selection**: Choose between Flash (fast & reliable) or Pro (more capable)
- **Basic** test cases for common scenarios (likely to pass with correct logic)
- **Comprehensive** test cases with all major edge cases
- Custom question naming for organized sessions
- Automatic time/memory limit recommendations
- Smart error handling with model switching suggestions

### 💬 **AI Chat Assistant**
Get help without leaving the editor:
- **Model Selection**: Choose between Gemini 2.5 Flash (fast) or 2.5 Pro (more capable)
- **Syntax-Highlighted Code Blocks**: AI responses with code are beautifully formatted
- **Interactive Code Actions**: Hover over code blocks to Copy or Replace your editor code
- **Smart Error Handling**: Automatic suggestions to switch models if quota exceeded
- Persistent chat history across sessions
- Full conversation context maintained
- Ask for hints, explanations, or solutions
- Quick action buttons: "Ask for Hint", "Get Solution", "Chat"
- Contextual awareness of your code and problem

### ⚡ **Dual Execution Modes**
Choose your execution environment:
- **☁️ Cloud Mode** (Judge0 API): Works everywhere, no setup needed
- **🖥️ Local Mode**: Run on your machine (requires gcc/g++/python3/java)
- Automatic fallback and error handling
- Seamless switching between modes

### 📊 **Smart Evaluation System**
Comprehensive test case evaluation:
- Flexible output comparison (handles whitespace variations like C's scanf)
- Status tracking: Passed ✅, Wrong Answer ❌
- Total execution time tracking with optimization suggestions
- Interactive expandable test cards with diff views
- Filter by status (All/Passed/Failed)
- Circular progress visualization

### 💾 **Session Management**
Never lose your work:
- Automatic localStorage-based persistence
- Multiple sessions with quick switching
- Auto-save on every change
- Chat history saved per session
- Last active session restored on reload
- Works offline, no database needed

### ⏱️ **Timer & Stopwatch**
Track your practice time:
- Built-in timer with presets (5/15/30/60 min) or custom duration
- Stopwatch for open-ended practice
- Compact dropdown design
- State persists across page reloads

### 🎨 **Holographic Glitch UI**
Immersive, distraction-free interface:
- Dynamic particle system with cursor spotlight
- Glassmorphism panels with neon accents (Cyan/Magenta/Lime)
- Monaco Editor (VS Code's editor)
- Smooth Framer Motion animations
- Responsive three-panel layout

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
- **Code Editor:** Monaco Editor (VS Code's editor)
- **AI:** Google Gemini 2.5 Flash/Pro (with thinking mode & chat)
- **Code Execution:** 
  - Cloud: Judge0 API (RapidAPI)
  - Local: Native compilers (gcc/g++/python3/java)
- **Storage:** Browser localStorage (no database needed)
- **Markdown Rendering:** react-markdown with react-syntax-highlighter
- **Code Highlighting:** Prism with VS Code Dark Plus theme

---

## 📖 How to Use

### First Time Setup
1. Clone and install (see Quick Start above)
2. Add your API keys to `.env.local`
3. Run `npm run dev`
4. Your browser will automatically create a new session on first visit

### Workflow
1. **Select AI Model** → Choose Flash (fast) or Pro (powerful) from top-right dropdown
2. **Name Your Problem** → Enter problem description, name it when generating test cases
3. **Generate Test Cases** → Choose Basic or Comprehensive complexity
4. **Write Code** → Use Monaco editor with C/C++/Python/Java support
5. **Execute** → Toggle Cloud ☁️ or Local 🖥️ mode, then Run or Evaluate
6. **Get Help** → Click Help tab or any chat button to open AI assistant
   - Hover over AI code responses to Copy or Replace your code
7. **Track Time** → Use timer/stopwatch to monitor your practice

### Session Management
- Click hamburger menu (☰) to view all sessions
- Click "+ New Problem" to start fresh
- Sessions auto-save every change
- Switch between sessions anytime
- Delete old sessions with 🗑️ button

### AI Chat Code Blocks
When the AI generates code in chat:
- **Syntax Highlighting**: Automatic language detection with line numbers
- **Copy Button**: Click to copy code to clipboard (shows ✓ confirmation)
- **Replace Button**: Directly replace your editor code with AI's suggestion
- **Language Badge**: Shows detected language in top-left corner
- Buttons appear on hover at top-right of code block
- Black background with neon cyan borders for clarity

### Data Storage
- **Everything is stored locally** in your browser (localStorage)
- No server-side database needed
- Works offline once loaded
- Data persists across browser restarts
- Each browser/device has its own separate data

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
