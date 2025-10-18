"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ProblemPanelProps {
  problemText: string;
  setProblemText: (text: string) => void;
  setTestCases: (cases: any[]) => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  selectedModel: string;
  problemName: string;
  onProblemNameChange: (name: string) => void;
}

export default function ProblemPanel({
  problemText,
  setProblemText,
  setTestCases,
  isGenerating,
  setIsGenerating,
  selectedModel,
  problemName,
  onProblemNameChange,
}: ProblemPanelProps) {
  const [complexity, setComplexity] = useState("Basic");
  const [quantity, setQuantity] = useState(10);
  const [error, setError] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(problemName);

  useEffect(() => {
    setTempName(problemName);
  }, [problemName]);

  const handleNameSubmit = () => {
    const normalized = tempName.trim() || "Untitled Problem";
    onProblemNameChange(normalized);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleNameSubmit();
    } else if (event.key === "Escape") {
      setTempName(problemName);
      setIsEditingName(false);
    }
  };

  const handleGenerate = async () => {
    if (!problemText.trim()) {
      setError("Please enter a problem description first!");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-testcases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemDescription: problemText,
          complexity,
          quantity,
          model: selectedModel, // Pass the selected model
          existingName: problemName !== "New Problem" && problemName !== "Untitled Problem" ? problemName : undefined,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.suggestion 
          ? `${data.error}\n\n💡 ${data.suggestion}`
          : data.error || "Failed to generate test cases";
        throw new Error(errorMsg);
      }

      setTestCases(data.testCases);
      if (data.name && (!problemName || problemName === "New Problem" || problemName === "Untitled Problem")) {
        onProblemNameChange(data.name);
      }
      
      // Show success notification
      const successMsg = data.name && (!problemName || problemName === "New Problem" || problemName === "Untitled Problem")
        ? `✅ Success! Generated ${data.testCases.length} test cases for "${data.name}"`
        : `✅ Success! Generated ${data.testCases.length} test cases`;
      alert(successMsg);
    } catch (err: any) {
      setError(err.message || "Oops! The AI assistant is currently unavailable. Please try again.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="glass-panel h-full flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📝</span>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={handleNameKeyDown}
                className="bg-black/40 text-white px-3 py-2 rounded border border-neonCyan/40 focus:border-neonCyan/70 focus:outline-none text-lg"
              />
            </div>
          ) : (
            <h2 className="text-2xl font-bold text-neonCyan flex items-center gap-3">
              <span className="truncate max-w-[14rem]" title={problemName}>
                {problemName || "Untitled Problem"}
              </span>
            </h2>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (isEditingName) {
              handleNameSubmit();
            } else {
              setTempName(problemName);
              setIsEditingName(true);
            }
          }}
          className="px-3 py-2 bg-black/30 text-neonCyan border border-neonCyan/30 rounded-lg hover:border-neonCyan/60 transition-colors text-sm flex items-center gap-2"
        >
          ✏️ <span>{isEditingName ? "Save" : "Edit"}</span>
        </motion.button>
      </div>

      <textarea
        className="flex-1 w-full bg-black/30 text-white p-4 rounded-lg border border-neonCyan/20 
                   focus:border-neonCyan/50 focus:outline-none resize-none mb-4 
                   placeholder-gray-500"
        placeholder="Paste your problem description here... The more detail, the better the test cases."
        value={problemText}
        onChange={(e) => setProblemText(e.target.value)}
      />

      {/* Settings */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Complexity</label>
          <select
            className="w-full bg-black/30 text-white p-2 rounded border border-neonCyan/20 
                       focus:border-neonCyan/50 focus:outline-none"
            value={complexity}
            onChange={(e) => setComplexity(e.target.value)}
          >
            <option value="Basic">Basic (Common test cases)</option>
            <option value="Comprehensive">Comprehensive (All major edge cases)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Quantity</label>
          <select
            className="w-full bg-black/30 text-white p-2 rounded-lg border border-neonCyan/50 
                       hover:bg-neonCyan/10 focus:border-neonCyan focus:outline-none transition-colors cursor-pointer"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          >
            <option value={5}>5 Test Cases</option>
            <option value={10}>10 Test Cases</option>
            <option value={15}>15 Test Cases</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brightRed/20 border border-brightRed text-brightRed p-3 rounded-lg mb-4 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Generate Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGenerate}
        disabled={isGenerating}
        className={`w-full py-3 rounded-lg font-semibold text-lg transition-all
                   ${
                     isGenerating
                       ? "bg-neonMagenta/30 text-neonMagenta cursor-not-allowed"
                       : "bg-neonCyan/20 text-neonCyan hover:bg-neonCyan/30 neon-cyan-glow"
                   }`}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-pulse">⚡</span>
            <span>Generating...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>🧠</span>
            <span>Generate Test Cases</span>
          </span>
        )}
      </motion.button>
    </div>
  );
}
