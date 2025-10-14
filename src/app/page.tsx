"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const notificationTimeouts = useRef<Record<string, number>>({});
  const lastSavedSnapshot = useRef<string>("");

  const currentCode = codeByLanguage[language] ?? getDefaultSnippet(language);

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

  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return;
      Object.values(notificationTimeouts.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      notificationTimeouts.current = {};
    };
  }, []);

  const playTimerSound = useCallback(() => {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext: AudioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.4);

    oscillator.onended = () => {
      gainNode.disconnect();
      oscillator.disconnect();
      audioContext.close().catch(() => {});
    };
  }, []);

  const handleTimerFinished = useCallback(() => {
    playTimerSound();
    pushNotification("⏰ Time's up! Great work—take a breather.");
  }, [playTimerSound, pushNotification]);

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
    setCodeByLanguage({
      ...cloneDefaultSnippets(),
      ...session.codeByLanguage,
    });
    setLanguage(session.language);
  setLastUsedLanguage(session.language);
    setLastUsedLanguage(session.language);
    setTestCases(session.testCases);
    setChatHistory(session.chatHistory || []);
    setProblemName(session.name || "New Problem");
    setTimerState(session.timerState ?? createDefaultTimerState());
    setStopwatchState(session.stopwatchState ?? createDefaultStopwatchState());
    if (session.lastEvaluation) {
      setEvaluationResults(session.lastEvaluation);
    }
    setIsInitialized(true);
  }, []);

  // Auto-save on state changes
  useEffect(() => {
    if (!isInitialized || !currentSession) return;

    const snapshot = JSON.stringify({
      id: currentSession.id,
      problemName,
      problemText,
      codeByLanguage,
      language,
      testCases,
      chatHistory,
      evaluationResults,
      timerState,
      stopwatchState,
    });

    if (lastSavedSnapshot.current === snapshot) {
      return;
    }

    lastSavedSnapshot.current = snapshot;

    const updatedSession: Session = {
      ...currentSession,
      name: problemName || "Untitled Problem",
      problem: problemText,
      codeByLanguage,
      language,
      testCases,
      chatHistory,
      timerState,
      stopwatchState,
      lastEvaluation: evaluationResults?.results
        ? {
            results: evaluationResults.results,
            summary: evaluationResults.summary,
          }
        : currentSession.lastEvaluation,
    };

    saveSession(updatedSession);
    setCurrentSession(updatedSession);
  }, [
    isInitialized,
    currentSession,
    problemName,
    problemText,
    codeByLanguage,
    language,
    testCases,
    evaluationResults,
    chatHistory,
    timerState,
    stopwatchState,
  ]);

  const handleSelectSession = useCallback((sessionId: string) => {
    const session = getSession(sessionId);
    if (!session) return;

    setCurrentSession(session);
    setProblemText(session.problem);
    setCodeByLanguage({
      ...cloneDefaultSnippets(),
      ...session.codeByLanguage,
    });
    setLanguage(session.language);
  setLastUsedLanguage(session.language);
    setTestCases(session.testCases);
    setChatHistory(session.chatHistory || []);
    setEvaluationResults(session.lastEvaluation || null);
    setTimerState(session.timerState ?? createDefaultTimerState());
    setStopwatchState(session.stopwatchState ?? createDefaultStopwatchState());
    setActiveSessionId(session.id);
    setProblemName(session.name || "New Problem");
  }, []);

  const handleNewSession = useCallback(() => {
    const session = createNewSession();
    saveSession(session);
    setCurrentSession(session);
    setProblemText(session.problem);
    setCodeByLanguage({
      ...cloneDefaultSnippets(),
      ...session.codeByLanguage,
    });
    setLanguage(session.language);
    setTestCases(session.testCases);
    setChatHistory(session.chatHistory || []);
    setEvaluationResults(session.lastEvaluation || null);
    setTimerState(session.timerState ?? createDefaultTimerState());
    setStopwatchState(session.stopwatchState ?? createDefaultStopwatchState());
    setActiveSessionId(session.id);
    setProblemName(session.name || "New Problem");
  }, []);

  const handleProblemNameChange = useCallback(
    (name: string) => {
      setProblemName(name);
    },
    []
  );

  const handleCodeChange = useCallback(
    (updatedCode: string) => {
      setCodeByLanguage((prev) => ({
        ...prev,
        [language]: updatedCode,
      }));
    },
    [language]
  );

  const handleLanguageChange = useCallback((nextLanguage: string) => {
    setLanguage(nextLanguage);
    setLastUsedLanguage(nextLanguage);
    setCodeByLanguage((prev) => {
      if (prev[nextLanguage] !== undefined) {
        return prev;
      }
      return {
        ...prev,
        [nextLanguage]: getDefaultSnippet(nextLanguage),
      };
    });
  }, []);

  const handleTimerStateChange = useCallback((nextState: TimerSnapshot) => {
    setTimerState(nextState);
  }, []);

  const handleStopwatchStateChange = useCallback((nextState: StopwatchSnapshot) => {
    setStopwatchState(nextState);
  }, []);

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

      {notifications.length > 0 && (
        <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 pointer-events-none">
          {notifications.map((note) => (
            <div
              key={note.id}
              className="pointer-events-auto glass-panel border border-neonCyan/40 bg-black/70 backdrop-blur-xl text-neonCyan px-4 py-3 rounded-lg shadow-lg flex items-start gap-3"
            >
              <div className="text-sm font-medium leading-snug">{note.message}</div>
              <button
                onClick={() => dismissNotification(note.id)}
                className="ml-auto text-neonCyan/70 hover:text-neonCyan transition-colors"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Session Sidebar */}
      <SessionSidebar
        currentSessionId={currentSession.id}
        refreshKey={currentSession.updatedAt}
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
            timerState={timerState}
            stopwatchState={stopwatchState}
            onTimerStateChange={handleTimerStateChange}
            onStopwatchStateChange={handleStopwatchStateChange}
            onTimerFinished={handleTimerFinished}
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
            problemName={problemName}
            onProblemNameChange={handleProblemNameChange}
          />
        </div>

        {/* Middle Panel - Code */}
        <div className="w-1/3 flex flex-col">
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
        <div className="w-1/3 flex flex-col">
          <div className="h-full flex flex-col">
            {/* Tab Buttons */}
            <div className="flex justify-end gap-2 mb-3">
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
                code={currentCode}
                language={language}
                problemText={problemText}
                testResults={evaluationResults}
                chatHistory={chatHistory}
                onUpdateChatHistory={setChatHistory}
                selectedModel={selectedModel}
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
    </main>
  );
}
