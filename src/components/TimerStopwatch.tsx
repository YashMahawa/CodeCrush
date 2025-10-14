"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TimerSnapshot, StopwatchSnapshot } from "@/lib/sessionStorage";

interface TimerStopwatchProps {
  timerState: TimerSnapshot;
  stopwatchState: StopwatchSnapshot;
  onTimerStateChange: (state: TimerSnapshot) => void;
  onStopwatchStateChange: (state: StopwatchSnapshot) => void;
  onTimerFinished?: () => void;
}

const TIMER_PRESETS = [5, 15, 30, 60];

const formatTimerTime = (seconds: number) => {
  const clamped = Math.max(seconds, 0);
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatStopwatchTime = (seconds: number) => {
  const clamped = Math.max(seconds, 0);

  if (clamped < 60) {
    return `${clamped}`;
  }

  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function TimerStopwatch({
  timerState,
  stopwatchState,
  onTimerStateChange,
  onStopwatchStateChange,
  onTimerFinished,
}: TimerStopwatchProps) {
  const [mode, setMode] = useState<"timer" | "stopwatch">(
    timerState.status !== "idle" ? "timer" : "stopwatch"
  );
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stopwatchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (timerState.status !== "running" || !timerState.startedAt) {
      return;
    }

    let remaining = timerState.remainingSeconds;
    let lastStartedAt = timerState.startedAt;

    timerIntervalRef.current = setInterval(() => {
      if (!lastStartedAt) return;
      const now = Date.now();
      const elapsed = Math.floor((now - lastStartedAt) / 1000);
      if (elapsed <= 0) {
        return;
      }

      const nextRemaining = Math.max(remaining - elapsed, 0);

      if (nextRemaining === remaining) {
        return;
      }

      if (nextRemaining <= 0) {
        clearInterval(timerIntervalRef.current!);
        timerIntervalRef.current = null;
        onTimerStateChange({
          totalSeconds: timerState.totalSeconds,
          remainingSeconds: 0,
          status: "finished",
          startedAt: null,
        });

        if (typeof window !== "undefined") {
          window.navigator.vibrate?.(200);
        }
        onTimerFinished?.();
        return;
      }

      remaining = nextRemaining;
      lastStartedAt = now;
      onTimerStateChange({
        totalSeconds: timerState.totalSeconds,
        remainingSeconds: remaining,
        status: "running",
        startedAt: now,
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [
    timerState.totalSeconds,
    timerState.remainingSeconds,
    timerState.status,
    timerState.startedAt,
    onTimerStateChange,
    onTimerFinished,
  ]);

  useEffect(() => {
    if (stopwatchIntervalRef.current) {
      clearInterval(stopwatchIntervalRef.current);
      stopwatchIntervalRef.current = null;
    }

    if (stopwatchState.status !== "running" || !stopwatchState.startedAt) {
      return;
    }

    let elapsed = stopwatchState.elapsedSeconds;
    let lastStartedAt = stopwatchState.startedAt;

    stopwatchIntervalRef.current = setInterval(() => {
      if (!lastStartedAt) return;
      const now = Date.now();
      const additional = Math.floor((now - lastStartedAt) / 1000);

      if (additional <= 0) {
        return;
      }

      elapsed += additional;
      lastStartedAt = now;
      onStopwatchStateChange({
        elapsedSeconds: elapsed,
        status: "running",
        startedAt: now,
      });
    }, 1000);

    return () => {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
        stopwatchIntervalRef.current = null;
      }
    };
  }, [stopwatchState.elapsedSeconds, stopwatchState.status, stopwatchState.startedAt, onStopwatchStateChange]);

  const startTimer = (minutes: number) => {
    const totalSeconds = minutes * 60;
    const now = Date.now();
    onTimerStateChange({
      totalSeconds,
      remainingSeconds: totalSeconds,
      status: "running",
      startedAt: now,
    });
    setMode("timer");
    setIsOpen(false);
  };

  const pauseTimer = () => {
    if (timerState.status !== "running") return;
    const now = Date.now();
    const elapsed = timerState.startedAt ? Math.floor((now - timerState.startedAt) / 1000) : 0;
    const remaining = Math.max(timerState.remainingSeconds - elapsed, 0);
    onTimerStateChange({
      totalSeconds: timerState.totalSeconds,
      remainingSeconds: remaining,
      status: remaining === 0 ? "finished" : "paused",
      startedAt: null,
    });
  };

  const resumeTimer = () => {
    if (timerState.status !== "paused" || timerState.remainingSeconds <= 0) return;
    const now = Date.now();
    onTimerStateChange({
      totalSeconds: timerState.totalSeconds || timerState.remainingSeconds,
      remainingSeconds: timerState.remainingSeconds,
      status: "running",
      startedAt: now,
    });
    setMode("timer");
  };

  const resetTimer = () => {
    onTimerStateChange({
      totalSeconds: 0,
      remainingSeconds: 0,
      status: "idle",
      startedAt: null,
    });
  };

  const startStopwatch = () => {
    if (stopwatchState.status === "running") return;
    const now = Date.now();
    onStopwatchStateChange({
      elapsedSeconds: stopwatchState.elapsedSeconds,
      status: "running",
      startedAt: now,
    });
    setMode("stopwatch");
    setIsOpen(false);
  };

  const pauseStopwatch = () => {
    if (stopwatchState.status !== "running") return;
    const now = Date.now();
    const additional = stopwatchState.startedAt
      ? Math.floor((now - stopwatchState.startedAt) / 1000)
      : 0;
    const elapsed = stopwatchState.elapsedSeconds + Math.max(additional, 0);
    onStopwatchStateChange({
      elapsedSeconds: elapsed,
      status: "paused",
      startedAt: null,
    });
  };

  const resumeStopwatch = () => {
    if (stopwatchState.status !== "paused") return;
    const now = Date.now();
    onStopwatchStateChange({
      elapsedSeconds: stopwatchState.elapsedSeconds,
      status: "running",
      startedAt: now,
    });
  };

  const resetStopwatch = () => {
    onStopwatchStateChange({
      elapsedSeconds: 0,
      status: "idle",
      startedAt: null,
    });
  };

  const timerDisplaySeconds = Math.max(timerState.remainingSeconds, 0);
  const stopwatchDisplaySeconds = Math.max(stopwatchState.elapsedSeconds, 0);
  const isTimerCritical = timerState.status === "running" && timerDisplaySeconds <= 60 && timerDisplaySeconds > 0;

  const compactDisplay =
    mode === "timer"
      ? formatTimerTime(timerDisplaySeconds)
      : formatStopwatchTime(stopwatchDisplaySeconds);

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-lg border transition-all font-mono text-sm flex items-center gap-2 ${
          mode === "timer"
            ? isTimerCritical
              ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse"
              : "bg-neonCyan/20 border-neonCyan/50 text-neonCyan"
            : "bg-neonMagenta/20 border-neonMagenta/50 text-neonMagenta"
        }`}
      >
        {mode === "timer" ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
  <span>{compactDisplay}</span>
        <svg className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-72 glass-panel p-4 z-50 border border-neonCyan/30"
          >
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setMode("timer")}
                className={`flex-1 py-1.5 rounded text-sm font-medium transition-all ${
                  mode === "timer"
                    ? "bg-neonCyan/30 text-neonCyan border border-neonCyan/50"
                    : "bg-black/20 text-gray-400 border border-gray-700 hover:border-gray-600"
                }`}
              >
                ⏱️ Timer
              </button>
              <button
                onClick={() => setMode("stopwatch")}
                className={`flex-1 py-1.5 rounded text-sm font-medium transition-all ${
                  mode === "stopwatch"
                    ? "bg-neonMagenta/30 text-neonMagenta border border-neonMagenta/50"
                    : "bg-black/20 text-gray-400 border border-gray-700 hover:border-gray-600"
                }`}
              >
                ⏲️ Stopwatch
              </button>
            </div>

            {mode === "timer" && (
              <div>
                <div
                  className={`text-3xl font-mono text-center mb-3 ${
                    isTimerCritical ? "text-brightRed animate-pulse" : "text-neonCyan"
                  }`}
                >
                  {formatTimerTime(timerDisplaySeconds)}
                </div>

                {timerState.status === "running" ? (
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={pauseTimer}
                      className="flex-1 py-2 bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/50 hover:bg-yellow-500/30 text-sm font-medium"
                    >
                      ⏸️ Pause
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetTimer}
                      className="flex-1 py-2 bg-red-500/20 text-red-400 rounded border border-red-500/50 hover:bg-red-500/30 text-sm font-medium"
                    >
                      ⏹️ Reset
                    </motion.button>
                  </div>
                ) : timerState.status === "paused" && timerState.remainingSeconds > 0 ? (
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resumeTimer}
                      className="flex-1 py-2 bg-neonCyan/20 text-neonCyan rounded border border-neonCyan/50 hover:bg-neonCyan/30 text-sm font-medium"
                    >
                      ▶️ Resume
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetTimer}
                      className="flex-1 py-2 bg-red-500/20 text-red-400 rounded border border-red-500/50 hover:bg-red-500/30 text-sm font-medium"
                    >
                      ⏹️ Reset
                    </motion.button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {TIMER_PRESETS.map((min) => (
                      <motion.button
                        key={min}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => startTimer(min)}
                        className="py-2 bg-neonCyan/20 text-neonCyan rounded border border-neonCyan/50 hover:bg-neonCyan/30 text-sm font-medium"
                      >
                        {min} min
                      </motion.button>
                    ))}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => startTimer(90)}
                      className="py-2 bg-neonCyan/10 text-neonCyan/80 rounded border border-neonCyan/30 hover:bg-neonCyan/20 text-sm font-medium"
                    >
                      90 min
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => startTimer(120)}
                      className="py-2 bg-neonCyan/10 text-neonCyan/80 rounded border border-neonCyan/30 hover:bg-neonCyan/20 text-sm font-medium"
                    >
                      2 hr
                    </motion.button>
                  </div>
                )}
              </div>
            )}

            {mode === "stopwatch" && (
              <div>
                <div className="text-3xl font-mono text-center mb-3 text-neonMagenta">
                  {formatStopwatchTime(stopwatchDisplaySeconds)}
                </div>

                {stopwatchState.status === "running" ? (
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={pauseStopwatch}
                      className="flex-1 py-2 bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/50 hover:bg-yellow-500/30 text-sm font-medium"
                    >
                      ⏸️ Pause
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetStopwatch}
                      className="flex-1 py-2 bg-red-500/20 text-red-400 rounded border border-red-500/50 hover:bg-red-500/30 text-sm font-medium"
                    >
                      ⏹️ Reset
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={stopwatchState.status === "paused" ? resumeStopwatch : startStopwatch}
                      className="flex-1 py-2 bg-neonLime/20 text-neonLime rounded border border-neonLime/50 hover:bg-neonLime/30 text-sm font-medium"
                    >
                      {stopwatchState.status === "paused" ? "▶️ Resume" : "▶️ Start"}
                    </motion.button>
                    {stopwatchDisplaySeconds > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={resetStopwatch}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded border border-red-500/50 hover:bg-red-500/30 text-sm font-medium"
                      >
                        ⏹️
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
