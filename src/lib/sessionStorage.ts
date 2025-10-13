// Local storage utilities for CodeCrush sessions

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

export interface Session {
  id: string;
  name: string; // AI-generated name
  problem: string;
  code: string;
  language: string;
  testCases: TestCase[];
  lastEvaluation?: {
    results: EvaluationResult[];
    summary: {
      passed: number;
      total: number;
      percentage: number;
    };
  };
  lastRun?: {
    input: string;
    output: string;
  };
  timerMinutes?: number;
  timerStartedAt?: number;
  stopwatchStartedAt?: number;
  stopwatchElapsed?: number;
  chatHistory?: any[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "codecrush_sessions";
const ACTIVE_SESSION_KEY = "codecrush_active_session";

export function getAllSessions(): Session[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
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
    const sessions = getAllSessions();
    const index = sessions.findIndex((s) => s.id === session.id);
    
    session.updatedAt = Date.now();
    
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
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
  return {
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: "New Problem",
    problem: "",
    code: "",
    language: "cpp",
    testCases: [],
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
