"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface ProblemPanelProps {
  problemText: string;
  setProblemText: (text: string) => void;
  setTestCases: (cases: any[]) => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}

export default function ProblemPanel({
  problemText,
  setProblemText,
  setTestCases,
  isGenerating,
  setIsGenerating,
}: ProblemPanelProps) {
  const [complexity, setComplexity] = useState("Standard");
  const [quantity, setQuantity] = useState(10);
  const [error, setError] = useState("");

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
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate test cases");
      }

      const data = await response.json();
      setTestCases(data.testCases);
      
      // Show success notification
      alert(`✅ Success! Generated ${data.testCases.length} test cases`);
    } catch (err) {
      setError("Oops! The AI assistant is currently unavailable. Please try again.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="glass-panel h-full flex flex-col p-6 overflow-hidden">
      <h2 className="text-2xl font-bold text-neonCyan mb-4 flex items-center gap-2">
        <span>📝</span>
        <span>Problem Sphere</span>
      </h2>

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
            <option value="Standard">Standard (Common Cases)</option>
            <option value="Comprehensive">Comprehensive (+ Edge Cases)</option>
            <option value="Performance">Performance (Large Inputs)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Quantity</label>
          <select
            className="w-full bg-black/30 text-white p-2 rounded border border-neonCyan/20 
                       focus:border-neonCyan/50 focus:outline-none"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          >
            <option value={10}>10 Test Cases</option>
            <option value={25}>25 Test Cases</option>
            <option value={50}>50 Test Cases</option>
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
