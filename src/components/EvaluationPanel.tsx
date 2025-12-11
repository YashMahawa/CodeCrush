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
      <div className="flex flex-col h-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md"
        >
          <div className="text-5xl mb-6 opacity-80">
            <svg className="w-12 h-12 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-300 mb-3 tracking-wide">{results.message}</h3>
          <p className="text-white/50 mb-6 text-sm leading-relaxed">{results.hint}</p>
          {results.results && results.results.length > 0 && (
            <div className="inline-block px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/60">
              Completed {results.results.length} test(s) before error
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  if (!results || results.loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 relative z-10">
        {isEvaluating && results?.progress ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center w-full max-w-xs"
          >
            <div className="text-5xl mb-6 animate-pulse opacity-80">
              <svg className="w-12 h-12 mx-auto text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5500] to-[#FF9900] mb-2">Evaluating...</h3>
            <p className="text-white/40 text-sm font-mono mb-6">
              Test {results.progress.current} / {results.progress.total}
            </p>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#FF5500] to-[#FF9900]"
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
            <div className="text-6xl mb-6 text-white/5 font-thin tracking-tighter select-none">
              &lt;/&gt;
            </div>
            <h3 className="text-lg font-bold text-white/40 tracking-widest uppercase">Evaluation Matrix</h3>
            <p className="text-white/20 text-xs mt-2 font-light">
              Results will materialize here
            </p>
          </motion.div>
        )
        }
      </div >
    );
  }

  if (results.error) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-red-400 font-bold bg-white/5 rounded-2xl border border-white/10">
        Failed to Load Results
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
      case "Passed": return "✅";
      case "Wrong Answer": return "❌";
      case "TLE": return "⏳";
      case "MLE": return "💣";
      case "Compilation Error": return "⚠️";
      default: return "❓";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Passed": return "border-green-500 shadow-[inset_4px_0_0_0_rgba(34,197,94,0.5)]";
      case "Wrong Answer": return "border-red-500 shadow-[inset_4px_0_0_0_rgba(239,68,68,0.5)]";
      case "TLE":
      case "MLE": return "border-yellow-500 shadow-[inset_4px_0_0_0_rgba(234,179,8,0.5)]";
      case "Compilation Error": return "border-orange-500 shadow-[inset_4px_0_0_0_rgba(249,115,22,0.5)]";
      default: return "border-gray-500";
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative z-10">
      {/* Header with Summary */}
      <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
        <h2 className="text-lg font-bold text-white/90 mb-6 flex items-center gap-3 tracking-wide">
          <span className="p-1.5 bg-white/5 rounded-lg border border-white/10">📊</span>
          <span>Evaluation Matrix</span>
        </h2>

        {/* Circular Progress & KPI */}
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="relative w-28 h-28">
            <svg className="transform -rotate-90 w-28 h-28">
              <circle cx="56" cy="56" r="48" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="6" fill="none" />
              <motion.circle
                cx="56" cy="56" r="48"
                stroke="url(#gradient)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDashoffset: 301 }}
                animate={{
                  strokeDashoffset: 301 - (301 * results.summary.percentage) / 100,
                }}
                strokeDasharray="301"
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF5500" />
                  <stop offset="100%" stopColor="#FF2200" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-white">
                {results.summary.percentage}%
              </div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                Success Output
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-right">
            <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/5">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Passed</div>
              <div className="text-xl font-mono font-bold text-green-400">{results.summary.passed} <span className="text-white/20 text-sm">/ {results.summary.total}</span></div>
            </div>
            <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/5">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Runtime</div>
              <div className="text-xl font-mono font-bold text-[#FF5500]">{results.summary.totalTime}s</div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 p-1 bg-black/20 rounded-xl">
          {["all", "passed", "failed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filter === f
                ? f === "all" ? "bg-white/10 text-white shadow-sm" : f === "passed" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                : "text-white/30 hover:text-white/60 hover:bg-white/5"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Test Cases List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <AnimatePresence>
          {filteredResults.map((result: any) => (
            <motion.div
              key={result.testNumber}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`bg-white/5 rounded-xl overflow-hidden border border-white/5 hover:bg-white/10 transition-colors ${getStatusColor(result.status)}`}
            >
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedTest(expandedTest === result.testNumber ? null : result.testNumber)
                }
                className="w-full p-4 text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl filter drop-shadow-md">{getStatusIcon(result.status)}</span>
                  <div>
                    <div className="font-bold text-sm text-white/90 group-hover:text-white transition-colors">Test Case #{result.testNumber}</div>
                    <div className={`text-xs font-medium mt-0.5 ${result.status === "Passed" ? "text-green-400" :
                      result.status === "Wrong Answer" ? "text-red-400" : "text-yellow-400"
                      }`}>
                      {result.status}
                    </div>
                  </div>
                </div>
                <span className="text-white/20 group-hover:text-white/60 transition-colors">
                  {expandedTest === result.testNumber ? "−" : "+"}
                </span>
              </button>

              {/* Details */}
              <AnimatePresence>
                {expandedTest === result.testNumber && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 bg-black/20"
                  >
                    <div className="p-4 space-y-4 font-mono text-xs">
                      <div>
                        <div className="text-[10px] font-bold text-white/30 uppercase mb-2 tracking-wider">Input</div>
                        <div className="bg-black/40 p-3 rounded-lg text-white/80 border border-white/5 overflow-x-auto">
                          {result.input || <span className="text-white/20 italic">(empty)</span>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-[10px] font-bold text-white/30 uppercase mb-2 tracking-wider">Expected</div>
                          <div className="bg-black/40 p-3 rounded-lg text-green-400/90 border border-white/5 overflow-x-auto">
                            {result.expectedOutput || <span className="text-white/20 italic">(empty)</span>}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-white/30 uppercase mb-2 tracking-wider">Actual</div>
                          <div className={`bg-black/40 p-3 rounded-lg border border-white/5 overflow-x-auto ${result.status === "Passed" ? "text-green-400/90" : "text-red-400/90"
                            }`}>
                            {result.actualOutput || <span className="text-white/20 italic">(empty)</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-white/20 pt-2 border-t border-white/5">
                        <span>Time: {result.time}s</span>
                        <span>Memory: {result.memory}KB</span>
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
