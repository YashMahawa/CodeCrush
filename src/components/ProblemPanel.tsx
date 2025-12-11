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
  // Mode: "normal" (30 tests) or "comprehensive" (100-300 tests)
  const [mode, setMode] = useState<"normal" | "comprehensive">("normal");
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
          mode, // "normal" or "comprehensive"
          model: selectedModel,
          existingName: problemName !== "New Problem" && problemName !== "Untitled Problem" ? problemName : undefined,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(`Error: ${data.error}`);
        setIsGenerating(false);
        return;
      }

      if (data.testCases && data.testCases.length > 0) {
        setTestCases(data.testCases);
        if (data.name && (!problemName || problemName === "New Problem" || problemName === "Untitled Problem")) {
          onProblemNameChange(data.name);
        }

        // Show success message
        alert(`✅ Generated ${data.testCases.length} test cases successfully!`);
      } else {
        alert("No test cases were generated. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate test cases. Please try again.");
    }

    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col h-full p-6 relative z-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#FF5500]/10 border border-[#FF5500]/20">
            <span className="text-xl">📝</span>
          </div>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={handleNameKeyDown}
                className="bg-white/5 text-white px-3 py-1.5 rounded-lg border border-[#FF5500]/40 focus:border-[#FF5500] focus:outline-none text-xl font-bold tracking-tight w-full"
              />
            </div>
          ) : (
            <h2 className="text-xl font-bold text-white flex items-center gap-3 tracking-wide">
              <span className="truncate max-w-[14rem] bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent" title={problemName}>
                {problemName || "Untitled Problem"}
              </span>
            </h2>
          )}
        </div>
        <div className="flex items-center gap-2">

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
            className="px-3 py-1.5 bg-white/5 text-white/60 hover:text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-xs font-medium"
          >
            {isEditingName ? "Save" : "Edit"}
          </motion.button>
        </div>
      </div>

      <textarea
        className="flex-1 w-full p-5 rounded-xl border border-white/5 
                   focus:border-[#FF5500]/40 focus:ring-1 focus:ring-[#FF5500]/20 focus:outline-none resize-none mb-6
                   placeholder-white/20 text-sm leading-relaxed tracking-wide font-light shadow-inner
                   bg-black/20"
        placeholder="Paste your problem description here (e.g., LeetCode/Codeforces problem statement)..."
        value={problemText}
        onChange={(e) => setProblemText(e.target.value)}
      />

      {/* Settings Grid */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Generation Mode</label>
          <div className="grid grid-cols-2 gap-2 bg-black/20 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setMode("normal")}
              className={`py-2 px-4 rounded-lg text-xs font-bold transition-all ${mode === "normal"
                ? "bg-white/10 text-white shadow-sm border border-white/10"
                : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
            >
              Normal (30)
            </button>
            <button
              onClick={() => setMode("comprehensive")}
              className={`py-2 px-4 rounded-lg text-xs font-bold transition-all ${mode === "comprehensive"
                ? "bg-[#FF5500]/20 text-[#FF5500] shadow-sm border border-[#FF5500]/20"
                : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
            >
              Comprehensive (100+)
            </button>
          </div>
          <p className="text-[10px] text-white/30 mt-2 ml-1">
            {mode === "normal"
              ? "Generates ~30 randomized test cases for quick checks."
              : "Generates 100-300+ test cases covering edge cases, large inputs, and stress tests (LeetCode style)."}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 text-red-200 p-3 rounded-lg mb-4 text-xs font-medium"
        >
          {error}
        </motion.div>
      )}

      {/* Generate Button - Premium Gradient */}
      <motion.button
        whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(255, 85, 0, 0.3)" }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGenerate}
        disabled={isGenerating}
        className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg
                   ${isGenerating
            ? "bg-white/10 text-white/40 cursor-not-allowed"
            : "bg-gradient-to-r from-[#FF5500] to-[#FF2200] text-black border border-[#FF5500]/20 shadow-[0_4px_20px_rgba(255,85,0,0.2)]"
          }`}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin w-4 h-4 border-2 border-black/20 border-t-black rounded-full"></span>
            <span>Generating...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Generate Test Cases</span>
          </span>
        )}
      </motion.button>


    </div>
  );
}
