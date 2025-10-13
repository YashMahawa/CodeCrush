"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Editor from "@monaco-editor/react";

interface CodePanelProps {
  code: string;
  setCode: (code: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  testCases: any[];
  setEvaluationResults: (results: any) => void;
  isEvaluating: boolean;
  setIsEvaluating: (value: boolean) => void;
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
}: CodePanelProps) {
  const [customInput, setCustomInput] = useState("");
  const [runLog, setRunLog] = useState("");
  const [activeTab, setActiveTab] = useState<"input" | "log">("input");
  const [isRunning, setIsRunning] = useState(false);
  const [useLocalExecution, setUseLocalExecution] = useState(false);
  const [isCheckingLocal, setIsCheckingLocal] = useState(false);
  const [localMessage, setLocalMessage] = useState<
    { text: string; type: "info" | "success" | "error" } | null
  >(null);

  const handleRun = async () => {
    setIsRunning(true);
    setActiveTab("log");
    setRunLog("Running...");

    try {
      const apiEndpoint = useLocalExecution ? "/api/run-local" : "/api/run-code";
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
      
      // Handle API errors (rate limits, etc.)
      if (response.status === 429 || data.error?.includes("rate limit")) {
        setRunLog("⚠️ Judge0 API Rate Limit Reached!\n\nPlease try:\n1. Enable 'Local Execution' toggle if you have compilers installed\n2. Wait a few minutes and try again\n3. Upgrade your Judge0 API plan");
        return;
      }

      if (data.error) {
        setRunLog(`Error: ${data.error}\n${data.details || ""}\n${data.hint || ""}`);
        return;
      }
      
      if (data.compileOutput) {
        setRunLog(`Compilation Error:\n${data.compileOutput}`);
      } else if (data.stderr) {
        setRunLog(`Runtime Error:\n${data.stderr}`);
      } else {
        const execMode = data.executionMode === "local" ? " (Local)" : " (Judge0)";
        setRunLog(`Output${execMode}:\n${data.stdout || "(no output)"}`);
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

    try {
      const results = [];
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        
        const apiEndpoint = useLocalExecution ? "/api/run-local" : "/api/run-code";
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            language,
            input: testCase.input,
            timeLimit: testCase.timeLimitSeconds,
            memoryLimit: testCase.memoryLimitMB,
          }),
        });

        const data = await response.json();

        // Handle API rate limits
        if (response.status === 429 || data.error?.includes("rate limit")) {
          setEvaluationResults({
            error: true,
            message: "⚠️ Judge0 API Rate Limit Reached!",
            hint: "Enable 'Local Execution' toggle if you have compilers installed, or wait a few minutes.",
            results: results,
          });
          setIsEvaluating(false);
          return;
        }

        // Handle other errors
        if (data.error) {
          setEvaluationResults({
            error: true,
            message: `Error: ${data.error}`,
            hint: data.hint || "Please try again or enable local execution.",
            results: results,
          });
          setIsEvaluating(false);
          return;
        }
        
        let status = "Passed";
        if (data.compileOutput) {
          status = "Compilation Error";
        } else if (data.status?.id === 5) { // Time Limit Exceeded
          status = "TLE";
        } else if (data.status?.id === 6) { // Memory Limit Exceeded  
          status = "MLE";
        } else if (!compareOutputs(data.stdout || "", testCase.expectedOutput || "")) {
          status = "Wrong Answer";
        }

        results.push({
          testNumber: i + 1,
          status,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: data.stdout || "",
          time: typeof data.time === 'number' ? data.time : parseFloat(data.time || '0'),
          memory: typeof data.memory === 'number' ? data.memory : parseFloat(data.memory || '0'),
          timeLimit: testCase.timeLimitSeconds,
          memoryLimit: testCase.memoryLimitMB,
        });

        // Update progress
        setEvaluationResults({
          loading: true,
          progress: { current: i + 1, total: testCases.length },
        });
      }

      const passedCount = results.filter((r) => r.status === "Passed").length;
      const totalTime = results.reduce((sum, r) => sum + (typeof r.time === 'number' ? r.time : parseFloat(r.time || '0')), 0);
      
      setEvaluationResults({
        loading: false,
        results,
        summary: {
          passed: passedCount,
          total: results.length,
          percentage: Math.round((passedCount / results.length) * 100),
          totalTime: totalTime.toFixed(2),
        },
      });
    } catch (err) {
      console.error(err);
      setEvaluationResults({ error: "Failed to evaluate test cases" });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleLocalToggle = async (checked: boolean) => {
    if (!checked) {
      setUseLocalExecution(false);
      if (localMessage?.type !== "success") {
        setLocalMessage(null);
      }
      return;
    }

    if (isCheckingLocal) return;

    setIsCheckingLocal(true);
    setLocalMessage({ text: "Checking local execution environment...", type: "info" });

    try {
      const response = await fetch("/api/local-health");
      const data = await response.json();

      if (data.available) {
        setUseLocalExecution(true);
        setLocalMessage({ text: "🖥️ Local execution ready! Cloud mode still available anytime.", type: "success" });
      } else {
        setUseLocalExecution(false);

        if (data.cloudEnvironment) {
          setLocalMessage({
            text: "Local execution requires running CodeCrush on your own machine. Redirecting to GitHub so you can clone the repo...",
            type: "error",
          });
          setTimeout(() => {
            window.location.href = "https://github.com/YashMahawa/CodeCrush";
          }, 3000);
        } else if (Array.isArray(data.missing) && data.missing.length > 0) {
          setLocalMessage({
            text: `Install these tools to enable local execution: ${data.missing.join(", ")}`,
            type: "error",
          });
        } else {
          setLocalMessage({
            text: "Local execution is currently unavailable on this environment.",
            type: "error",
          });
        }
      }
    } catch (error) {
      console.error("Failed to check local execution", error);
      setUseLocalExecution(false);
      setLocalMessage({
        text: "Couldn't verify local execution. Ensure you're running CodeCrush locally with gcc/g++/python3/java installed.",
        type: "error",
      });
    } finally {
      setIsCheckingLocal(false);
    }
  };

  return (
    <div className="glass-panel h-full flex flex-col overflow-hidden">
      {/* Action Bar */}
      <div className="flex items-center justify-between p-4 border-b border-neonCyan/20">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚡</span>
          <h2 className="text-xl font-bold text-neonCyan">Code Forge</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Local Execution Toggle */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={useLocalExecution}
                onChange={(e) => handleLocalToggle(e.target.checked)}
                disabled={isCheckingLocal}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer 
                              peer-checked:bg-neonLime/50 
                              transition-all duration-300 
                              border border-gray-600 peer-checked:border-neonLime/50">
              </div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full 
                              transition-transform duration-300 
                              peer-checked:translate-x-5 peer-checked:bg-neonLime">
              </div>
            </div>
            <span className="text-xs text-gray-400 group-hover:text-neonLime transition-colors">
              {isCheckingLocal ? "⏳ Checking..." : useLocalExecution ? "🖥️ Local" : "☁️ Cloud"}
            </span>
          </label>

          <select
            className="bg-black/30 text-white px-3 py-1.5 rounded border border-neonCyan/20 
                       focus:border-neonCyan/50 focus:outline-none text-sm"
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
            className="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded border border-blue-400/50 
                       hover:bg-blue-500/30 disabled:opacity-50 text-sm font-medium"
          >
            {isRunning ? "Running..." : "▶ Run"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEvaluate}
            disabled={isEvaluating}
            className="px-4 py-1.5 bg-neonCyan/20 text-neonCyan rounded border border-neonCyan/50 
                       hover:bg-neonCyan/30 disabled:opacity-50 text-sm font-medium neon-cyan-glow"
          >
            {isEvaluating ? "Evaluating..." : "✓ Evaluate"}
          </motion.button>
        </div>
      </div>

      {localMessage && (
        <div
          className={`mx-4 mt-2 rounded border px-3 py-2 text-sm transition-all duration-300 ${
            localMessage.type === "success"
              ? "border-neonLime/50 text-neonLime bg-neonLime/10"
              : localMessage.type === "error"
              ? "border-red-500/40 text-red-300 bg-red-500/10"
              : "border-neonCyan/40 text-neonCyan bg-neonCyan/10"
          }`}
        >
          {localMessage.text}
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language === "cpp" ? "cpp" : language}
          value={code}
          onChange={(value: string | undefined) => setCode(value || "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
          }}
        />
      </div>

      {/* AI Assistant Bar */}
      <div className="flex gap-2 p-3 border-t border-neonCyan/20 bg-black/20">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => alert("💬 Ask Help feature coming soon! This will open a chat where you can ask the AI for hints without revealing the solution.")}
          className="flex-1 py-2 bg-neonMagenta/20 text-neonMagenta rounded border border-neonMagenta/50 
                     hover:bg-neonMagenta/30 text-sm font-medium"
        >
          🤔 Ask for Hint
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => alert("💬 Get Solution feature coming soon! This will open a chat showing the corrected solution with explanations.")}
          className="flex-1 py-2 bg-neonMagenta/20 text-neonMagenta rounded border border-neonMagenta/50 
                     hover:bg-neonMagenta/30 text-sm font-medium"
        >
          💡 Get Solution
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => alert("💬 Chat feature coming soon! This will open an AI assistant chat where you can ask any questions about your code.")}
          className="px-4 py-2 bg-neonCyan/20 text-neonCyan rounded border border-neonCyan/50 
                     hover:bg-neonCyan/30 text-sm font-medium"
        >
          💬 Chat
        </motion.button>
      </div>

      {/* Tabs for Custom Input / Run Log */}
      <div className="border-t border-neonCyan/20">
        <div className="flex">
          <button
            onClick={() => setActiveTab("input")}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === "input"
                ? "bg-neonCyan/20 text-neonCyan border-t-2 border-neonCyan"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Custom Input
          </button>
          <button
            onClick={() => setActiveTab("log")}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === "log"
                ? "bg-neonCyan/20 text-neonCyan border-t-2 border-neonCyan"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Run Log
          </button>
        </div>

        <div className="h-32">
          {activeTab === "input" ? (
            <textarea
              className="w-full h-full bg-black/30 text-white p-3 resize-none focus:outline-none 
                         font-mono text-sm"
              placeholder="Enter custom input here..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
            />
          ) : (
            <pre className="w-full h-full bg-black/30 text-white p-3 overflow-auto font-mono text-sm">
              {runLog || "No output yet. Click 'Run' to execute your code."}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
