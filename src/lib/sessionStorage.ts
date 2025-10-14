// Local storage utilities for CodeCrush sessions

import { cloneDefaultSnippets, getDefaultSnippet } from "./codeSnippets";

export interface TestCase {
  input: string;
  expectedOutput: string;
  timeLimitSeconds: number;
  memoryLimitMB: number;
}

export interface EvaluationResult {
  testNumber: number;
  status: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  time: number;
  memory: number;
  timeLimit: number;
  memoryLimit: number;
}

export interface TimerSnapshot {
  totalSeconds: number;
  remainingSeconds: number;
  status: "idle" | "running" | "paused" | "finished";
  startedAt: number | null;
}

export interface StopwatchSnapshot {
  elapsedSeconds: number;
  status: "idle" | "running" | "paused";
  startedAt: number | null;
}

export interface Session {
  id: string;
  name: string; // AI-generated name
  problem: string;
  codeByLanguage: Record<string, string>;
  language: string;
  testCases: TestCase[];
  lastEvaluation?: {
    results: EvaluationResult[];
    summary: {
      passed: number;
      total: number;
      percentage: number;
      totalTime?: number | string;
    };
  };
  lastRun?: {
    input: string;
    output: string;
  };
  timerState?: TimerSnapshot;
  stopwatchState?: StopwatchSnapshot;
  timerMinutes?: number; // legacy fields
  timerStartedAt?: number;
  stopwatchStartedAt?: number;
  stopwatchElapsed?: number;
  code?: string; // legacy field
  chatHistory?: any[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "codecrush_sessions";
const ACTIVE_SESSION_KEY = "codecrush_active_session";
const LAST_LANGUAGE_KEY = "codecrush_last_language";

export function getLastUsedLanguage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LAST_LANGUAGE_KEY);
  } catch (error) {
    console.error("Failed to read last language:", error);
    return null;
  }
}

export function setLastUsedLanguage(language: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_LANGUAGE_KEY, language);
  } catch (error) {
    console.error("Failed to persist last language:", error);
  }
}

const DEFAULT_TIMER_STATE: TimerSnapshot = {
  totalSeconds: 0,
  remainingSeconds: 0,
  status: "idle",
  startedAt: null,
};

const DEFAULT_STOPWATCH_STATE: StopwatchSnapshot = {
  elapsedSeconds: 0,
  status: "idle",
  startedAt: null,
};

function normalizeSession(raw: any): Session {
  const defaults = cloneDefaultSnippets();

  const fallbackLanguage = getLastUsedLanguage() ?? "c";
  let language = typeof raw?.language === "string" ? raw.language : fallbackLanguage;

  const codeByLanguage: Record<string, string> = {
    ...defaults,
    ...(typeof raw?.codeByLanguage === "object" && raw.codeByLanguage !== null
      ? raw.codeByLanguage
      : {}),
  };

  if (typeof raw?.code === "string") {
    const legacyLang = typeof raw?.language === "string" ? raw.language : "cpp";
    codeByLanguage[legacyLang] = raw.code;
  }

  // Ensure currently selected language exists
  if (!codeByLanguage[language]) {
    codeByLanguage[language] = getDefaultSnippet(language);
  }

  const timerState: TimerSnapshot = raw?.timerState
    ? {
        totalSeconds: Math.max(0, Number(raw.timerState.totalSeconds ?? 0)),
        remainingSeconds: Math.max(0, Number(raw.timerState.remainingSeconds ?? 0)),
        status: raw.timerState.status ?? "idle",
        startedAt:
          typeof raw.timerState.startedAt === "number" ? raw.timerState.startedAt : null,
      }
    : (() => {
        const minutes = typeof raw?.timerMinutes === "number" ? raw.timerMinutes : null;
        const startedAt = typeof raw?.timerStartedAt === "number" ? raw.timerStartedAt : null;
        const totalSeconds = minutes ? minutes * 60 : 0;
        let remaining = totalSeconds;
        let status: TimerSnapshot["status"] = "idle";
        let startValue: number | null = null;

        if (minutes && startedAt) {
          const elapsed = Math.floor((Date.now() - startedAt) / 1000);
          remaining = Math.max(totalSeconds - elapsed, 0);
          status = remaining > 0 ? "running" : "finished";
          startValue = status === "running" ? startedAt : null;
        }

        return {
          totalSeconds,
          remainingSeconds: remaining,
          status,
          startedAt: startValue,
        };
      })();

  const stopwatchState: StopwatchSnapshot = raw?.stopwatchState
    ? {
        elapsedSeconds: Math.max(0, Number(raw.stopwatchState.elapsedSeconds ?? 0)),
        status: raw.stopwatchState.status ?? "idle",
        startedAt:
          typeof raw.stopwatchState.startedAt === "number"
            ? raw.stopwatchState.startedAt
            : null,
      }
    : (() => {
        const elapsed = typeof raw?.stopwatchElapsed === "number" ? raw.stopwatchElapsed : 0;
        const startedAt =
          typeof raw?.stopwatchStartedAt === "number" ? raw.stopwatchStartedAt : null;
        const status = startedAt ? "running" : elapsed > 0 ? "paused" : "idle";
        return {
          elapsedSeconds: elapsed,
          status,
          startedAt,
        };
      })();

  const currentCode = codeByLanguage[language] ?? getDefaultSnippet(language);

  return {
    id: raw?.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: typeof raw?.name === "string" ? raw.name : "New Problem",
    problem: typeof raw?.problem === "string" ? raw.problem : "",
    codeByLanguage,
    language,
    code: currentCode,
    testCases: Array.isArray(raw?.testCases) ? raw.testCases : [],
    lastEvaluation: raw?.lastEvaluation,
    lastRun: raw?.lastRun,
    timerState,
    stopwatchState,
    chatHistory: Array.isArray(raw?.chatHistory) ? raw.chatHistory : [],
    createdAt: typeof raw?.createdAt === "number" ? raw.createdAt : Date.now(),
    updatedAt: typeof raw?.updatedAt === "number" ? raw.updatedAt : Date.now(),
  };
}

export function getAllSessions(): Session[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const rawSessions = JSON.parse(data);
    if (!Array.isArray(rawSessions)) return [];
    return rawSessions.map((session) => normalizeSession(session));
  } catch (error) {
    console.error("Failed to load sessions:", error);
    return [];
  }
}

export function getSession(id: string): Session | null {
  const sessions = getAllSessions();
  return sessions.find((s) => s.id === id) || null;
}

export function saveSession(session: Session): void {
  try {
    const normalized = normalizeSession(session);
    const sessions = getAllSessions();
    const index = sessions.findIndex((s) => s.id === session.id);
    
    normalized.updatedAt = Date.now();
    if (normalized.language) {
      setLastUsedLanguage(normalized.language);
    }
    
    if (index >= 0) {
      sessions[index] = normalized;
    } else {
      sessions.unshift(normalized);
    }
    
    // Keep only last 50 sessions
    const trimmed = sessions.slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Failed to save session:", error);
  }
}

export function deleteSession(id: string): void {
  try {
    const sessions = getAllSessions();
    const filtered = sessions.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete session:", error);
  }
}

export function getActiveSessionId(): string | null {
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

export function setActiveSessionId(id: string): void {
  localStorage.setItem(ACTIVE_SESSION_KEY, id);
}

export function createNewSession(): Session {
  const base = normalizeSession({ language: getLastUsedLanguage() ?? "c" });
  return {
    ...base,
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: "New Problem",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export async function generateSessionName(problem: string): Promise<string> {
  if (!problem || problem.trim().length < 10) {
    return "Untitled Problem";
  }

  try {
    const response = await fetch("/api/name-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem: problem.slice(0, 500) }),
    });

    const data = await response.json();
    return data.name || "Untitled Problem";
  } catch (error) {
    console.error("Failed to generate session name:", error);
    // Fallback: use first line or first 40 chars
    const firstLine = problem.split("\n")[0].trim();
    return firstLine.slice(0, 40) + (firstLine.length > 40 ? "..." : "");
  }
}
