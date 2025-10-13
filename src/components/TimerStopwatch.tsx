"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TimerStopwatchProps {
  onTimerUpdate?: (minutes: number | null, startedAt: number | null) => void;
  onStopwatchUpdate?: (startedAt: number | null, elapsed: number) => void;
  initialTimerMinutes?: number;
  initialTimerStartedAt?: number;
  initialStopwatchStartedAt?: number;
  initialStopwatchElapsed?: number;
}

export default function TimerStopwatch({
  onTimerUpdate,
  onStopwatchUpdate,
  initialTimerMinutes,
  initialTimerStartedAt,
  initialStopwatchStartedAt,
  initialStopwatchElapsed = 0,
}: TimerStopwatchProps) {
  const [mode, setMode] = useState<"timer" | "stopwatch">("stopwatch");
  const [isOpen, setIsOpen] = useState(false);
  
  // Timer state
  const [timerMinutes, setTimerMinutes] = useState<number | null>(initialTimerMinutes || null);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(initialTimerStartedAt || null);
  const [timerRemaining, setTimerRemaining] = useState(0);
  
  // Stopwatch state
  const [stopwatchStartedAt, setStopwatchStartedAt] = useState<number | null>(initialStopwatchStartedAt || null);
  const [stopwatchElapsed, setStopwatchElapsed] = useState(initialStopwatchElapsed);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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

  // Timer logic
  useEffect(() => {
    if (mode === "timer" && timerStartedAt && timerMinutes) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - timerStartedAt) / 1000);
        const remaining = timerMinutes * 60 - elapsed;

        if (remaining <= 0) {
          setTimerRemaining(0);
          setTimerStartedAt(null);
          if (intervalRef.current) clearInterval(intervalRef.current);
          alert("⏰ Time's up!");
        } else {
          setTimerRemaining(remaining);
        }
      }, 100);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mode, timerStartedAt, timerMinutes]);

  // Stopwatch logic
  useEffect(() => {
    if (mode === "stopwatch" && stopwatchStartedAt) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - stopwatchStartedAt) / 1000) + stopwatchElapsed;
        setStopwatchElapsed(elapsed);
        onStopwatchUpdate?.(stopwatchStartedAt, elapsed);
      }, 100);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mode, stopwatchStartedAt, stopwatchElapsed, onStopwatchUpdate]);

  const startTimer = (minutes: number) => {
    const now = Date.now();
    setTimerMinutes(minutes);
    setTimerStartedAt(now);
    setTimerRemaining(minutes * 60);
    onTimerUpdate?.(minutes, now);
    setIsOpen(false);
  };

  const stopTimer = () => {
    setTimerStartedAt(null);
    onTimerUpdate?.(timerMinutes, null);
  };

  const resetTimer = () => {
    setTimerStartedAt(null);
    setTimerMinutes(null);
    setTimerRemaining(0);
    onTimerUpdate?.(null, null);
  };

  const startStopwatch = () => {
    const now = Date.now();
    setStopwatchStartedAt(now);
    onStopwatchUpdate?.(now, stopwatchElapsed);
  };

  const stopStopwatch = () => {
    if (stopwatchStartedAt) {
      const now = Date.now();
      const newElapsed = Math.floor((now - stopwatchStartedAt) / 1000) + stopwatchElapsed;
      setStopwatchElapsed(newElapsed);
      setStopwatchStartedAt(null);
      onStopwatchUpdate?.(null, newElapsed);
    }
  };

  const resetStopwatch = () => {
    setStopwatchStartedAt(null);
    setStopwatchElapsed(0);
    onStopwatchUpdate?.(null, 0);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentTime = mode === "timer" 
    ? timerRemaining 
    : stopwatchElapsed + (stopwatchStartedAt ? Math.floor((Date.now() - stopwatchStartedAt) / 1000) : 0);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Compact Display Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-lg border transition-all font-mono text-sm flex items-center gap-2 ${
          mode === "timer" && timerRemaining > 0 && timerRemaining <= 60
            ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse"
            : mode === "stopwatch"
            ? "bg-neonMagenta/20 border-neonMagenta/50 text-neonMagenta"
            : "bg-neonCyan/20 border-neonCyan/50 text-neonCyan"
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
        <span>{formatTime(currentTime)}</span>
        <svg className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-72 glass-panel p-4 z-50 border border-neonCyan/30"
          >
            {/* Mode Toggle */}
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

            {/* Timer Mode */}
            {mode === "timer" && (
              <div>
                <div
                  className={`text-3xl font-mono text-center mb-3 ${
                    timerRemaining > 0 && timerRemaining <= 60
                      ? "text-brightRed animate-pulse"
                      : "text-neonCyan"
                  }`}
                >
                  {formatTime(timerRemaining)}
                </div>

                {!timerStartedAt ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[5, 15, 30, 60].map((min) => (
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
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={stopTimer}
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
                )}
              </div>
            )}

            {/* Stopwatch Mode */}
            {mode === "stopwatch" && (
              <div>
                <div className="text-3xl font-mono text-center mb-3 text-neonMagenta">
                  {formatTime(stopwatchElapsed + (stopwatchStartedAt ? Math.floor((Date.now() - stopwatchStartedAt) / 1000) : 0))}
                </div>

                <div className="flex gap-2">
                  {!stopwatchStartedAt ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startStopwatch}
                        className="flex-1 py-2 bg-neonLime/20 text-neonLime rounded border border-neonLime/50 hover:bg-neonLime/30 text-sm font-medium"
                      >
                        ▶️ Start
                      </motion.button>
                      {stopwatchElapsed > 0 && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={resetStopwatch}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded border border-red-500/50 hover:bg-red-500/30 text-sm font-medium"
                        >
                          ⏹️
                        </motion.button>
                      )}
                    </>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={stopStopwatch}
                        className="flex-1 py-2 bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/50 hover:bg-yellow-500/30 text-sm font-medium"
                      >
                        ⏸️ Pause
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={resetStopwatch}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded border border-red-500/50 hover:bg-red-500/30 text-sm font-medium"
                      >
                        ⏹️
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
