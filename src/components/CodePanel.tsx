"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import { getActiveSessionId, getSession, saveSession } from "@/lib/sessionStorage";

interface CodePanelProps {
  code: string;
  setCode: (code: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  testCases: any[];
  setEvaluationResults: (results: any) => void;
  isEvaluating: boolean;
  setIsEvaluating: (value: boolean) => void;
  setShowChat: (value: boolean) => void;
}

export default function CodePanel({
  code,
  setCode,
  language,
  setLanguage,
  testCases,
  setEvaluationResults,
  isEvaluating,
  setIsEvaluating,
  setShowChat,
}: CodePanelProps) {
  const [customInput, setCustomInput] = useState("");
  const [runLog, setRunLog] = useState("");
  const [activeTab, setActiveTab] = useState<"input" | "log">("input");
  const [isRunning, setIsRunning] = useState(false);
  const [localMessage, setLocalMessage] = useState<
    { text: string; type: "info" | "success" | "error" } | null
  >(null);

  // Load custom input from session
  useEffect(() => {
    const sessionId = getActiveSessionId();
    if (sessionId) {
      const session = getSession(sessionId);
      if (session && session.customInput) {
        setCustomInput(session.customInput);
      }
    }
  }, []);

  // Save custom input to session on change
  const handleCustomInputChange = (value: string) => {
    setCustomInput(value);
    const sessionId = getActiveSessionId();
    if (sessionId) {
      const session = getSession(sessionId);
      if (session) {
        session.customInput = value;
        saveSession(session);
      }
    }
  };

  const checkLocalCompiler = async (lang: string) => {
    try {
      const response = await fetch("/api/local-health");
      const data = await response.json();

      if (!data.available) return { available: false, error: "Local execution environment not found." };

      if (data.languages && !data.languages[lang]) {
        let msg = "";
        switch (lang) {
          case "cpp": msg = "C++ compiler (g++) not found. Please install GCC."; break;
          case "c": msg = "C compiler (gcc) not found. Please install GCC."; break;
          case "python": msg = "Python interpreter not found. Please install Python."; break;
          case "java": msg = "Java JDK not found. Please install Java Development Kit."; break;
          default: msg = `${lang} compiler/interpreter not found.`;
        }
        return { available: false, error: msg };
      }

      return { available: true };
    } catch (e) {
      return { available: false, error: "Failed to check local environment." };
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setActiveTab("log");
    setRunLog("Running locally...");

    // Check environment first
    const envCheck = await checkLocalCompiler(language);
    if (!envCheck.available) {
        setRunLog(`Error: ${envCheck.error}\n\nPlease install the necessary tools to run code locally.`);
        setLocalMessage({ text: envCheck.error || "Compiler missing", type: "error" });
        setIsRunning(false);
        return;
    }
    setLocalMessage(null);

    try {
      const apiEndpoint = "/api/run-local";
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          input: customInput,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setRunLog(`Error: ${data.error}\n${data.details || ""}\n${data.hint || ""}`);
        return;
      }

      if (data.compileOutput) {
        setRunLog(`Compilation Error:\n${data.compileOutput}`);
      } else if (data.stderr) {
        setRunLog(`Runtime Error:\n${data.stderr}`);
      } else {
        setRunLog(`Output (Local):\n${data.stdout || "(no output)"}`);
      }
    } catch (err: any) {
      setRunLog(`Error: Failed to execute code\n${err.message || ""}`);
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  // Flexible output comparison that handles whitespace differences
  const compareOutputs = (actual: string, expected: string): boolean => {
    // Normalize both outputs:
    // 1. Trim leading/trailing whitespace
    // 2. Split by any whitespace (spaces, tabs, newlines)
    // 3. Filter out empty strings
    // 4. Compare token by token
    const normalizeOutput = (str: string) => {
      return str
        .trim()
        .split(/\s+/)
        .filter(token => token.length > 0);
    };

    const actualTokens = normalizeOutput(actual);
    const expectedTokens = normalizeOutput(expected);

    // Compare length first
    if (actualTokens.length !== expectedTokens.length) {
      return false;
    }

    // Compare each token
    for (let i = 0; i < actualTokens.length; i++) {
      if (actualTokens[i] !== expectedTokens[i]) {
        return false;
      }
    }

    return true;
  };

  const handleEvaluate = async () => {
    if (testCases.length === 0) {
      alert("Please generate test cases first!");
      return;
    }

    setIsEvaluating(true);
    setEvaluationResults({ loading: true });

    // Check environment first
    const envCheck = await checkLocalCompiler(language);
    if (!envCheck.available) {
        setEvaluationResults({
            error: true,
            message: "Compiler/Interpreter Missing",
            hint: envCheck.error,
            results: [],
        });
        setLocalMessage({ text: envCheck.error || "Compiler missing", type: "error" });
        setIsEvaluating(false);
        return;
    }
    setLocalMessage(null);

    try {
      // Use batch evaluation for local execution (compile once, run multiple times)
        const response = await fetch("/api/batch-evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            language,
            testCases,
          }),
        });

        const data = await response.json();

        if (data.error) {
          setEvaluationResults({
            error: true,
            message: data.message || "Evaluation failed",
            hint: data.compileOutput || data.details || "Check your code and try again.",
            results: data.results || [],
          });
          setIsEvaluating(false);
          return;
        }

        setEvaluationResults({
          loading: false,
          results: data.results,
          summary: data.summary,
        });
        setIsEvaluating(false);
        return;
    } catch (err) {
      console.error(err);
      setEvaluationResults({ error: "Failed to evaluate test cases" });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleExport = () => {
    const extensionMap: Record<string, string> = {
      cpp: "cpp",
      c: "c",
      python: "py",
      java: "java",
    };

    const ext = extensionMap[language] || "txt";
    const filename = `solution.${ext}`;
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="kinetic-panel h-full flex flex-col overflow-hidden">
      {/* Action Bar */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#050505]/40">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            <svg className="w-5 h-5 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold tracking-wide text-white/90">Code Forge</h2>
        </div>

        <div className="flex items-center gap-4">

          {/* Export Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="px-3 py-1.5 bg-white/5 text-white/80 rounded-lg border border-white/10
                       hover:bg-white/10 hover:text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </motion.button>

          <div className="h-6 w-px bg-white/10 mx-1"></div>

          <select
            className="bg-white/5 text-white/90 px-3 py-1.5 rounded-lg border border-white/10 
                       hover:bg-white/10 focus:border-[#FF5500]/50 focus:outline-none text-xs font-medium 
                       transition-colors cursor-pointer min-w-[100px]"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRun}
            disabled={isRunning}
            className="px-5 py-1.5 bg-white/5 text-white rounded-lg border border-white/10 
                       hover:bg-white/10 disabled:opacity-50 text-xs font-bold tracking-wide flex items-center gap-2"
          >
            {isRunning ? (
              <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              // Tech Play Icon (Outlined Triangle with internal detail)
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polygon points="5 3 19 12 5 21 5 3" />
                <path d="M9 7v10" strokeLinecap="round" strokeOpacity={0.5} />
              </svg>
            )}
            Run
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEvaluate}
            disabled={isEvaluating}
            className="px-5 py-1.5 bg-[#FF5500] text-black 
                       rounded-lg border border-[#FF5500] 
                       hover:brightness-110 disabled:opacity-50 text-xs font-bold tracking-wide shadow-[0_0_15px_rgba(255,85,0,0.3)]"
          >
            {isEvaluating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full"></span>
                Evaluating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {/* Stylized Lightning/Check Icon */}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Evaluate Master
              </span>
            )}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {localMessage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`overflow-hidden border-b ${localMessage.type === "success"
              ? "bg-green-500/5 border-green-500/10 text-green-400"
              : localMessage.type === "error"
                ? "bg-red-500/5 border-red-500/10 text-red-400"
                : "bg-blue-500/5 border-blue-500/10 text-blue-400"
              }`}
          >
            <div className="px-4 py-2 text-xs font-medium text-center">
              {localMessage.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden relative group">
        <Editor
          height="100%"
          language={language === "cpp" ? "cpp" : language}
          value={code}
          onChange={(value: string | undefined) => setCode(value || "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            padding: { top: 20 },
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            renderLineHighlight: "none", // Cleaner look
            contextmenu: false,
          }}
          className="bg-transparent" // Important for glass effect if editor allows
        />
        {/* Editor Gloss Overlay */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]"></div>
      </div>

      {/* Tabs for Custom Input / Run Log */}
      <div className="border-t border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setActiveTab("input")}
            className={`px-6 py-2 text-xs font-bold tracking-wider transition-all border-b-2 ${activeTab === "input"
              ? "border-[#FF5500] text-[#FF5500] bg-white/5"
              : "border-transparent text-white/40 hover:text-white hover:bg-white/5"
              }`}
          >
            CUSTOM INPUT
          </button>
          <button
            onClick={() => setActiveTab("log")}
            className={`px-6 py-2 text-xs font-bold tracking-wider transition-all border-b-2 ${activeTab === "log"
              ? "border-[#FF5500] text-[#FF5500] bg-white/5"
              : "border-transparent text-white/40 hover:text-white hover:bg-white/5"
              }`}
          >
            RUN LOG
          </button>
        </div>

        <div className="h-32 relative">
          {activeTab === "input" ? (
            <textarea
              className="w-full h-full bg-transparent text-white/90 p-3 resize-none focus:outline-none 
                         font-mono text-xs leading-relaxed placeholder-white/20"
              placeholder="Enter custom input here..."
              value={customInput}
              onChange={(e) => handleCustomInputChange(e.target.value)}
              spellCheck={false}
            />
          ) : (
            <pre className={`w-full h-full bg-transparent p-3 overflow-auto font-mono text-xs leading-relaxed ${runLog.includes("Error") ? "text-red-300" : "text-white/80"
              }`}>
              {runLog || <span className="text-white/30 italic">Execution output will appear here...</span>}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
