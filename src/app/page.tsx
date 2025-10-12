"use client";

import { useState } from "react";
import HolographicBackground from "@/components/HolographicBackground";
import ProblemPanel from "@/components/ProblemPanel";
import CodePanel from "@/components/CodePanel";
import EvaluationPanel from "@/components/EvaluationPanel";

export default function Home() {
  const [problemText, setProblemText] = useState("");
  const [testCases, setTestCases] = useState<any[]>([]);
  const [code, setCode] = useState("// Write your code here\n");
  const [language, setLanguage] = useState("c");
  const [evaluationResults, setEvaluationResults] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <HolographicBackground />
      
      {/* Logo Header */}
      <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center z-10">
        <div className="flex items-center gap-3">
          <div className="text-4xl font-bold text-neonCyan flex items-center">
            <span className="animate-pulse">&lt;</span>
            <span className="mx-2">CodeCrush</span>
            <span className="animate-pulse">&gt;</span>
          </div>
        </div>
      </header>

      {/* Three Panel Layout */}
      <div className="absolute top-16 left-0 right-0 bottom-0 flex gap-4 p-4">
        {/* Left Panel - Problem */}
        <div className="w-1/3 flex flex-col">
          <ProblemPanel
            problemText={problemText}
            setProblemText={setProblemText}
            setTestCases={setTestCases}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
          />
        </div>

        {/* Middle Panel - Code */}
        <div className="w-1/3 flex flex-col">
          <CodePanel
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            testCases={testCases}
            setEvaluationResults={setEvaluationResults}
            isEvaluating={isEvaluating}
            setIsEvaluating={setIsEvaluating}
          />
        </div>

        {/* Right Panel - Evaluation */}
        <div className="w-1/3 flex flex-col">
          <EvaluationPanel
            results={evaluationResults}
            isEvaluating={isEvaluating}
          />
        </div>
      </div>
    </main>
  );
}
