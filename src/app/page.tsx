"use client";

import { useState, useEffect, useCallback } from "react";
import HolographicBackground from "@/components/HolographicBackground";
import ProblemPanel from "@/components/ProblemPanel";
import CodePanel from "@/components/CodePanel";
import EvaluationPanel from "@/components/EvaluationPanel";
import SessionSidebar from "@/components/SessionSidebar";
import TimerStopwatch from "@/components/TimerStopwatch";
import AIChat from "@/components/AIChat";
import ModelSelector from "@/components/ModelSelector";
import {
  createNewSession,
  getSession,
  saveSession,
  getActiveSessionId,
  setActiveSessionId,
  generateSessionName,
  type Session,
} from "@/lib/sessionStorage";

export default function Home() {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [problemText, setProblemText] = useState("");
  const [testCases, setTestCases] = useState<any[]>([]);
  const [code, setCode] = useState("// Write your code here\n");
  const [language, setLanguage] = useState("cpp");
  const [evaluationResults, setEvaluationResults] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");

  // Load last session on mount
  useEffect(() => {
    const activeId = getActiveSessionId();
    let session: Session | null = null;

    if (activeId) {
      session = getSession(activeId);
    }

    if (!session) {
      session = createNewSession();
      saveSession(session);
      setActiveSessionId(session.id);
    }

    setCurrentSession(session);
    setProblemText(session.problem);
    setCode(session.code);
    setLanguage(session.language);
    setTestCases(session.testCases);
    setChatHistory(session.chatHistory || []);
    if (session.lastEvaluation) {
      setEvaluationResults(session.lastEvaluation);
    }
    setIsInitialized(true);
  }, []);

  // Auto-save on state changes
  useEffect(() => {
    if (!isInitialized || !currentSession) return;

    const updatedSession: Session = {
      ...currentSession,
      problem: problemText,
      code,
      language,
      testCases,
      chatHistory,
      lastEvaluation: evaluationResults?.results
        ? {
            results: evaluationResults.results,
            summary: evaluationResults.summary,
          }
        : currentSession.lastEvaluation,
    };

    saveSession(updatedSession);
    setCurrentSession(updatedSession);
  }, [problemText, code, language, testCases, evaluationResults, chatHistory]);

  // Auto-generate session name when problem changes
  useEffect(() => {
    if (!isInitialized || !currentSession || !problemText || currentSession.name !== "New Problem") return;

    const timer = setTimeout(async () => {
      const newName = await generateSessionName(problemText);
      const updatedSession = { ...currentSession, name: newName };
      saveSession(updatedSession);
      setCurrentSession(updatedSession);
    }, 2000);

    return () => clearTimeout(timer);
  }, [problemText]);

  const handleSelectSession = useCallback((sessionId: string) => {
    const session = getSession(sessionId);
    if (!session) return;

    setCurrentSession(session);
    setProblemText(session.problem);
    setCode(session.code);
    setLanguage(session.language);
    setTestCases(session.testCases);
    setChatHistory(session.chatHistory || []);
    setEvaluationResults(session.lastEvaluation || null);
    setActiveSessionId(session.id);
  }, []);

  const handleNewSession = useCallback(() => {
    const session = createNewSession();
    saveSession(session);
    setCurrentSession(session);
    setProblemText("");
    setCode("// Write your code here\n");
    setLanguage("cpp");
    setTestCases([]);
    setChatHistory([]);
    setEvaluationResults(null);
    setActiveSessionId(session.id);
  }, []);

  const handleTimerUpdate = useCallback(
    (minutes: number | null, startedAt: number | null) => {
      if (!currentSession) return;
      const updatedSession = {
        ...currentSession,
        timerMinutes: minutes || undefined,
        timerStartedAt: startedAt || undefined,
      };
      saveSession(updatedSession);
      setCurrentSession(updatedSession);
    },
    [currentSession]
  );

  const handleStopwatchUpdate = useCallback(
    (startedAt: number | null, elapsed: number) => {
      if (!currentSession) return;
      const updatedSession = {
        ...currentSession,
        stopwatchStartedAt: startedAt || undefined,
        stopwatchElapsed: elapsed,
      };
      saveSession(updatedSession);
      setCurrentSession(updatedSession);
    },
    [currentSession]
  );

  if (!isInitialized || !currentSession) {
    return (
      <main className="relative w-screen h-screen overflow-hidden bg-darkBg flex items-center justify-center">
        <div className="text-neonCyan text-2xl animate-pulse">Loading...</div>
      </main>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <HolographicBackground />

      {/* Session Sidebar */}
      <SessionSidebar
        currentSessionId={currentSession.id}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
      />
      
      {/* Logo Header + Model Selector + Timer/Stopwatch */}
      <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-10">
        <div className="w-64"></div> {/* Spacer for sidebar button */}
        
        <div className="text-4xl font-bold text-neonCyan flex items-center">
          <span className="animate-pulse">&lt;</span>
          <span className="mx-2">CodeCrush</span>
          <span className="animate-pulse">&gt;</span>
        </div>

        <div className="w-64 flex justify-end items-center gap-3">
          <ModelSelector 
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
          
          <TimerStopwatch
            onTimerUpdate={handleTimerUpdate}
            onStopwatchUpdate={handleStopwatchUpdate}
            initialTimerMinutes={currentSession.timerMinutes}
            initialTimerStartedAt={currentSession.timerStartedAt}
            initialStopwatchStartedAt={currentSession.stopwatchStartedAt}
            initialStopwatchElapsed={currentSession.stopwatchElapsed}
          />
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
            selectedModel={selectedModel}
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
            setShowChat={setShowChat}
          />
        </div>

        {/* Right Panel - Evaluation / Help */}
        <div className="w-1/3 flex flex-col">
          <div className="h-full flex flex-col relative">
            {/* Tab Buttons */}
            <div className="absolute top-0 right-0 z-20 flex gap-2 p-2">
              <button
                onClick={() => setShowChat(false)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  !showChat
                    ? "bg-neonCyan/30 text-neonCyan border border-neonCyan/50"
                    : "bg-black/20 text-gray-400 border border-gray-700 hover:border-gray-600"
                }`}
              >
                📊 Evaluation
              </button>
              <button
                onClick={() => setShowChat(true)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  showChat
                    ? "bg-neonMagenta/30 text-neonMagenta border border-neonMagenta/50"
                    : "bg-black/20 text-gray-400 border border-gray-700 hover:border-gray-600"
                }`}
              >
                💬 Help
              </button>
            </div>

            {showChat ? (
              <AIChat
                code={code}
                language={language}
                problemText={problemText}
                testResults={evaluationResults}
                chatHistory={chatHistory}
                onUpdateChatHistory={setChatHistory}
                selectedModel={selectedModel}
                setCode={setCode}
              />
            ) : (
              <EvaluationPanel
                results={evaluationResults}
                isEvaluating={isEvaluating}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
