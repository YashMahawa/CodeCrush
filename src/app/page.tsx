"use client";

import { useState, useEffect, useCallback, useRef } from "react";
// LiquidBackground removed in favor of static kinetic background
import ProblemPanel from "@/components/ProblemPanel";
import CodePanel from "@/components/CodePanel";
import EvaluationPanel from "@/components/EvaluationPanel";
import SessionSidebar from "@/components/SessionSidebar";
import TimerStopwatch from "@/components/TimerStopwatch";
import AIChat from "@/components/AIChat";
import ModelSelector from "@/components/ModelSelector";
import InstructionsModal from "@/components/InstructionsModal"; // Added
import Image from "next/image"; // Added for optimized asset loading
import { AnimatePresence } from "framer-motion"; // Ensure this is imported
import {
  createNewSession,
  getSession,
  saveSession,
  getActiveSessionId,
  setActiveSessionId,
  getLastUsedLanguage,
  setLastUsedLanguage,
  type Session,
  type TimerSnapshot,
  type StopwatchSnapshot,
} from "@/lib/sessionStorage";
import { cloneDefaultSnippets, getDefaultSnippet } from "@/lib/codeSnippets";

const createDefaultTimerState = (): TimerSnapshot => ({
  totalSeconds: 0,
  remainingSeconds: 0,
  status: "idle",
  startedAt: null,
});

const createDefaultStopwatchState = (): StopwatchSnapshot => ({
  elapsedSeconds: 0,
  status: "idle",
  startedAt: null,
});

type ToastNotification = {
  id: string;
  message: string;
};

export default function Home() {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [problemText, setProblemText] = useState("");
  const [testCases, setTestCases] = useState<any[]>([]);
  const [codeByLanguage, setCodeByLanguage] = useState<Record<string, string>>(() =>
    cloneDefaultSnippets()
  );
  const [language, setLanguage] = useState(() => getLastUsedLanguage() ?? "c");
  const [evaluationResults, setEvaluationResults] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [problemName, setProblemName] = useState("New Problem");
  const [timerState, setTimerState] = useState<TimerSnapshot>(() => createDefaultTimerState());
  const [stopwatchState, setStopwatchState] = useState<StopwatchSnapshot>(() =>
    createDefaultStopwatchState()
  );
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const notificationTimeouts = useRef<Record<string, number>>({});
  const lastSavedSnapshot = useRef<string>("");

  const currentCode = codeByLanguage[language] ?? getDefaultSnippet(language);

  // --- Handlers & Effects ---
  const pushNotification = useCallback((message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setNotifications((prev) => [...prev, { id, message }]);
    if (typeof window !== "undefined") {
      const timeoutId = window.setTimeout(() => {
        setNotifications((prev) => prev.filter((note) => note.id !== id));
        if (notificationTimeouts.current[id]) {
          window.clearTimeout(notificationTimeouts.current[id]);
          delete notificationTimeouts.current[id];
        }
      }, 4000);
      notificationTimeouts.current[id] = timeoutId;
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((note) => note.id !== id));
    if (typeof window !== "undefined") {
      const timeoutId = notificationTimeouts.current[id];
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        delete notificationTimeouts.current[id];
      }
    }
  }, []);

  const loadSession = useCallback((sessionId: string) => {
    console.log("Loading session:", sessionId);
    const session = getSession(sessionId);
    if (!session) {
      console.warn("Session not found:", sessionId);
      return;
    }
    setCurrentSession(session);
    setProblemText(session.problem); // Fixed: mapped from session.problem
    setTestCases(session.testCases);
    setCodeByLanguage(session.codeByLanguage);
    setLanguage(session.language);
    setEvaluationResults(session.lastEvaluation || null);
    setChatHistory(session.chatHistory || []);
    setProblemName(session.name);
    if (session.timerState) setTimerState(session.timerState);
    if (session.stopwatchState) setStopwatchState(session.stopwatchState);
    setActiveSessionId(sessionId);
    setLastUsedLanguage(session.language);
    console.log("Session loaded successfully, language:", session.language);
  }, []);

  const saveCurrentSession = useCallback(() => {
    if (!currentSession) return;
    const sessionToSave: Session = {
      ...currentSession,
      name: problemName,
      problem: problemText,
      testCases,
      codeByLanguage,
      language,
      lastEvaluation: evaluationResults || undefined,
      updatedAt: Date.now(),
      chatHistory,
      timerState,
      stopwatchState,
    };
    saveSession(sessionToSave);
  }, [currentSession, problemName, problemText, testCases, codeByLanguage, language, evaluationResults, chatHistory, timerState, stopwatchState]);

  useEffect(() => {
    if (!isInitialized) {
      const activeId = getActiveSessionId();
      if (activeId && getSession(activeId)) {
        loadSession(activeId);
      } else {
        const newSession = createNewSession();
        setCurrentSession(newSession);
        setActiveSessionId(newSession.id);
        setLanguage(newSession.language);
      }
      setIsInitialized(true);
    }
  }, [isInitialized, loadSession]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentSession) {
        const snapshot = JSON.stringify({
          problemText,
          testCases,
          codeByLanguage,
          language,
          chatHistory,
          problemName,
        });
        if (snapshot !== lastSavedSnapshot.current) {
          saveCurrentSession();
          lastSavedSnapshot.current = snapshot;
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [currentSession, saveCurrentSession, problemText, testCases, codeByLanguage, language, chatHistory, problemName]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setLastUsedLanguage(newLang);
    pushNotification(`Switched to ${newLang.toUpperCase()}`);
  };

  const handleCodeChange = (newCode: string) => {
    setCodeByLanguage((prev) => ({
      ...prev,
      [language]: newCode,
    }));
  };

  const handleNewSession = () => {
    if (currentSession) saveCurrentSession();
    const newSession = createNewSession();
    setCurrentSession(newSession);
    setActiveSessionId(newSession.id);
    setProblemText(newSession.problem); // Fixed: mapped from session.problem
    setTestCases(newSession.testCases);
    setCodeByLanguage(newSession.codeByLanguage);
    setLanguage(newSession.language);
    setEvaluationResults(null);
    setChatHistory([]);
    setProblemName("New Problem");
    setTimerState(createDefaultTimerState());
    setStopwatchState(createDefaultStopwatchState());
    pushNotification("Created new session");
  };

  const handleTimerStateChange = (newState: TimerSnapshot) => setTimerState(newState);
  const handleStopwatchStateChange = (newState: StopwatchSnapshot) => setStopwatchState(newState);
  const handleTimerFinished = () => pushNotification("Timer Finished!");
  const handleProblemNameChange = (name: string) => setProblemName(name);

  if (!isInitialized) return null;

  return (
    <main className="relative min-h-screen bg-[#050505] text-white font-sans overflow-hidden selection:bg-[#FF5500]/30 selection:text-white">
      {/* Cinematic Background Layer */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/background.png"
          alt="Kinetic Background"
          fill
          className="object-cover opacity-60"
          priority
        />
        {/* Vignette Overlay for Focus */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#050505_100%)] z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[#050505]/30 z-10 pointer-events-none" />
      </div>

      <div className="kinetic-atmosphere" />

      {/* Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {notifications.map((note) => (
          <div key={note.id} className="pointer-events-auto bg-[#1A1A1A] border border-white/10 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 fade-in duration-300">
            <span className="text-[#FF5500]">ℹ</span>
            <span className="text-sm font-medium">{note.message}</span>
            <button onClick={() => dismissNotification(note.id)} className="ml-2 text-white/40 hover:text-white">✕</button>
          </div>
        ))}
      </div>

      {/* Header - Expansive Hero Style */}
      <header className="absolute top-0 left-0 right-0 h-32 flex items-center justify-between px-10 z-20 border-b border-white/5 bg-[#050505]/50 backdrop-blur-sm">
        <SessionSidebar
          currentSessionId={currentSession?.id || ""}
          refreshKey={0}
          onSelectSession={loadSession}
          onNewSession={handleNewSession}
        />

        {/* Logo - Hero Size (Absolute Top Center) */}
        <div className="absolute left-1/2 top-[-10px] -translate-x-1/2 transform transition-transform duration-500 hover:scale-105 z-50">
          <div className="relative h-40 w-[600px] mb-1 filter drop-shadow-[0_0_30px_rgba(255,85,0,0.4)] pointer-events-none">
            <Image
              src="/logo.png"
              alt="CodeCrush"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Controls - Absolute Right */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4 z-50">
          <TimerStopwatch
            timerState={timerState}
            stopwatchState={stopwatchState}
            onTimerStateChange={handleTimerStateChange}
            onStopwatchStateChange={handleStopwatchStateChange}
            onTimerFinished={handleTimerFinished}
          />
          <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
          <button
            onClick={() => setShowInstructions(true)}
            className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-2xl hover:bg-white/10 text-white/60 hover:text-[#FF5500] flex items-center justify-center transition-all border border-white/5 group shadow-lg"
            title="How to Use & Formats"
          >
            <span className="text-lg font-bold group-hover:scale-110 transition-transform">?</span>
          </button>
        </div>
      </header>

      {/* Global Modals */}
      <AnimatePresence>
        {showInstructions && (
          <InstructionsModal isOpen={showInstructions} onClose={() => setShowInstructions(false)} />
        )}
      </AnimatePresence>

      {/* Main Workspace Layout - Adjusted for taller header */}
      <div className="absolute top-36 left-0 right-0 bottom-6 px-6 gap-6 flex z-10">
        {/* Left Panel - Problem */}
        <div className="w-[30%] flex flex-col kinetic-panel">
          <ProblemPanel
            problemText={problemText}
            setProblemText={setProblemText}
            setTestCases={setTestCases}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            selectedModel={selectedModel}
            problemName={problemName}
            onProblemNameChange={handleProblemNameChange}
          />
        </div>

        {/* Middle Panel - Code */}
        <div className="flex-1 flex flex-col kinetic-panel relative group">
          {/* Active border glow for Code Panel */}
          <div className="absolute -inset-[1px] bg-gradient-to-b from-[#FF5500]/20 to-transparent opacity-0 group-hover:opacity-100 rounded-[20px] transition-opacity duration-500 pointer-events-none -z-10" />

          <CodePanel
            code={currentCode}
            setCode={handleCodeChange}
            language={language}
            setLanguage={handleLanguageChange}
            testCases={testCases}
            setEvaluationResults={setEvaluationResults}
            isEvaluating={isEvaluating}
            setIsEvaluating={setIsEvaluating}
            setShowChat={setShowChat}
          />
        </div>

        {/* Right Panel - Evaluation / Help */}
        <div className="w-[28%] flex flex-col kinetic-panel">
          <div className="h-full flex flex-col">
            {/* Tab Buttons - High Contrast Matte */}
            <div className="flex justify-center gap-1 p-2 border-b border-white/5 bg-[#0A0A0A]">
              <button
                onClick={() => setShowChat(false)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-300 ${!showChat
                  ? "bg-white text-black shadow-lg"
                  : "text-white/40 hover:text-white hover:bg-white/5"
                  }`}
              >
                Results
              </button>
              <button
                onClick={() => setShowChat(true)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-300 ${showChat
                  ? "bg-[#FF5500] text-black shadow-[0_0_15px_rgba(255,85,0,0.4)]"
                  : "text-white/40 hover:text-white hover:bg-white/5"
                  }`}
              >
                AI Assistant
              </button>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {showChat ? (
                <AIChat
                  onClose={() => setShowChat(false)}
                  chatHistory={chatHistory}
                  onUpdateChatHistory={setChatHistory}
                  code={currentCode}
                  problemText={problemText}
                  language={language}
                  selectedModel={selectedModel}
                  testResults={evaluationResults}
                  setCode={handleCodeChange}
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
      </div>
    </main>
  );
}
