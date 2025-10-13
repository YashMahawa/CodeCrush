"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface EvaluationPanelProps {
  results: any;
  isEvaluating: boolean;
}

export default function EvaluationPanel({ results, isEvaluating }: EvaluationPanelProps) {
  const [filter, setFilter] = useState<"all" | "passed" | "failed">("all");
  const [expandedTest, setExpandedTest] = useState<number | null>(null);

  // Handle error state
  if (results?.error) {
    return (
      <div className="glass-panel h-full flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="text-6xl mb-4 text-red-400">⚠️</div>
          <h3 className="text-xl font-bold text-red-400 mb-3">{results.message}</h3>
          <p className="text-gray-400 mb-4">{results.hint}</p>
          {results.results && results.results.length > 0 && (
            <p className="text-sm text-gray-500">
              Completed {results.results.length} test(s) before error
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  if (!results || results.loading) {
    return (
      <div className="glass-panel h-full flex flex-col items-center justify-center p-6">
        {isEvaluating && results?.progress ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="text-6xl mb-4 animate-pulse">⚡</div>
            <h3 className="text-2xl font-bold text-neonMagenta mb-2">Evaluating...</h3>
            <p className="text-gray-400">
              Test {results.progress.current} / {results.progress.total}
            </p>
            <div className="w-64 h-2 bg-black/30 rounded-full mt-4 overflow-hidden">
              <motion.div
                className="h-full bg-neonMagenta"
                initial={{ width: 0 }}
                animate={{
                  width: `${(results.progress.current / results.progress.total) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="text-6xl mb-4 text-neonCyan">
              <span className="animate-pulse">&lt;</span>
              <span>/</span>
              <span className="animate-pulse">&gt;</span>
            </div>
            <h3 className="text-xl font-bold text-gray-400">Evaluation Matrix</h3>
            <p className="text-gray-500 mt-2">
              Your evaluation results will materialize here
            </p>
          </motion.div>
        )}
      </div>
    );
  }

  if (results.error) {
    return (
      <div className="glass-panel h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-brightRed mb-2">Evaluation Failed</h3>
          <p className="text-gray-400">{results.error}</p>
        </div>
      </div>
    );
  }

  const filteredResults = results.results.filter((r: any) => {
    if (filter === "all") return true;
    if (filter === "passed") return r.status === "Passed";
    if (filter === "failed") return r.status !== "Passed";
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Passed":
        return "✅";
      case "Wrong Answer":
        return "❌";
      case "TLE":
        return "⏳";
      case "MLE":
        return "💣";
      case "Compilation Error":
        return "⚠️";
      default:
        return "❓";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Passed":
        return "border-neonLime";
      case "Wrong Answer":
        return "border-brightRed";
      case "TLE":
      case "MLE":
        return "border-yellow-500";
      case "Compilation Error":
        return "border-orange-500";
      default:
        return "border-gray-500";
    }
  };

  return (
    <div className="glass-panel h-full flex flex-col overflow-hidden">
      {/* Header with Summary */}
      <div className="p-6 border-b border-neonCyan/20">
        <h2 className="text-2xl font-bold text-neonCyan mb-4 flex items-center gap-2">
          <span>📊</span>
          <span>Evaluation Matrix</span>
        </h2>

        {/* Circular Progress */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-32 h-32">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="rgba(0, 255, 255, 0.1)"
                strokeWidth="8"
                fill="none"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                stroke="#39FF14"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDashoffset: 352 }}
                animate={{
                  strokeDashoffset: 352 - (352 * results.summary.percentage) / 100,
                }}
                strokeDasharray="352"
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-neonLime">
                {results.summary.percentage}%
              </div>
              <div className="text-xs text-gray-400">
                {results.summary.passed}/{results.summary.total}
              </div>
              {results.summary.totalTime && (
                <div className="text-xs text-neonCyan mt-1">
                  {results.summary.totalTime}s total
                  {parseFloat(results.summary.totalTime) > 10 && results.summary.percentage === 100 && (
                    <div className="text-yellow-400 mt-0.5">⚡ Consider optimizing</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 py-2 rounded text-sm font-medium transition-all ${
              filter === "all"
                ? "bg-neonCyan text-black"
                : "bg-black/30 text-gray-400 hover:text-white"
            }`}
          >
            All ({results.results.length})
          </button>
          <button
            onClick={() => setFilter("passed")}
            className={`flex-1 py-2 rounded text-sm font-medium transition-all ${
              filter === "passed"
                ? "bg-neonLime text-black"
                : "bg-black/30 text-gray-400 hover:text-white"
            }`}
          >
            Passed ({results.summary.passed})
          </button>
          <button
            onClick={() => setFilter("failed")}
            className={`flex-1 py-2 rounded text-sm font-medium transition-all ${
              filter === "failed"
                ? "bg-brightRed text-white"
                : "bg-black/30 text-gray-400 hover:text-white"
            }`}
          >
            Failed ({results.summary.total - results.summary.passed})
          </button>
        </div>
      </div>

      {/* Test Cases List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence>
          {filteredResults.map((result: any) => (
            <motion.div
              key={result.testNumber}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`border-l-4 ${getStatusColor(
                result.status
              )} bg-black/30 rounded-r-lg overflow-hidden`}
            >
              {/* Collapsed View */}
              <button
                onClick={() =>
                  setExpandedTest(expandedTest === result.testNumber ? null : result.testNumber)
                }
                className="w-full p-3 text-left hover:bg-white/5 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusIcon(result.status)}</span>
                  <div>
                    <div className="font-semibold text-white">Test Case #{result.testNumber}</div>
                    <div className="text-xs text-gray-400">
                      {result.status}
                    </div>
                  </div>
                </div>
                <span className="text-gray-400">
                  {expandedTest === result.testNumber ? "▼" : "▶"}
                </span>
              </button>

              {/* Expanded View */}
              <AnimatePresence>
                {expandedTest === result.testNumber && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 space-y-3">
                      {/* Input */}
                      <div>
                        <div className="text-xs font-semibold text-gray-400 mb-1">Input:</div>
                        <pre className="bg-black/50 p-2 rounded text-sm text-white overflow-x-auto">
                          {result.input || "(empty)"}
                        </pre>
                      </div>

                      {/* Expected vs Actual Output */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-semibold text-gray-400 mb-1">
                            Expected Output:
                          </div>
                          <pre className="bg-black/50 p-2 rounded text-sm text-neonLime overflow-x-auto">
                            {result.expectedOutput || "(empty)"}
                          </pre>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-400 mb-1">
                            Your Output:
                          </div>
                          <pre
                            className={`bg-black/50 p-2 rounded text-sm overflow-x-auto ${
                              result.status === "Passed" ? "text-neonLime" : "text-brightRed"
                            }`}
                          >
                            {result.actualOutput || "(empty)"}
                          </pre>
                        </div>
                      </div>


                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
