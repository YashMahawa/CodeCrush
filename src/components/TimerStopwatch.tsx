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

const formatTime = (seconds: number) => {
  const clamped = Math.max(seconds, 0);
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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

  // ... (Keep existing interval logic, it is purely functional) ...
  // Re-implementing simplified interval logic for brevity in this rewrite, assuming logic remains valid if copied
  // NOTE: For full safety, I will implement standard intervals again to ensure no regression.

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, [isOpen]);

  // Timer Tick
  useEffect(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (timerState.status !== "running" || !timerState.startedAt) return;

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - timerState.startedAt!) / 1000);
      const remaining = Math.max(timerState.remainingSeconds - elapsed, 0);
      if (remaining === 0) {
        onTimerStateChange({ ...timerState, remainingSeconds: 0, status: "finished", startedAt: null });
        onTimerFinished?.();
        clearInterval(timerIntervalRef.current!);
      } else {
        onTimerStateChange({ ...timerState, remainingSeconds: remaining, status: "running", startedAt: now });
      }
    }, 1000);
    return () => clearInterval(timerIntervalRef.current!);
  }, [timerState, onTimerStateChange]);

  // Stopwatch Tick
  useEffect(() => {
    if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    if (stopwatchState.status !== "running" || !stopwatchState.startedAt) return;

    stopwatchIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const additional = Math.floor((now - stopwatchState.startedAt!) / 1000);
      if (additional > 0) {
        onStopwatchStateChange({ ...stopwatchState, elapsedSeconds: stopwatchState.elapsedSeconds + additional, startedAt: now });
      }
    }, 1000);
    return () => clearInterval(stopwatchIntervalRef.current!);
  }, [stopwatchState, onStopwatchStateChange]);


  // Actions
  const toggleTimer = () => {
    if (timerState.status === "running") {
      // Pause
      onTimerStateChange({ ...timerState, status: "paused", startedAt: null });
    } else {
      // Start/Resume
      const total = timerState.totalSeconds || 300; // Default 5m if 0
      onTimerStateChange({
        totalSeconds: total,
        remainingSeconds: timerState.remainingSeconds || total,
        status: "running",
        startedAt: Date.now()
      });
    }
  };

  const toggleStopwatch = () => {
    if (stopwatchState.status === "running") {
      onStopwatchStateChange({ ...stopwatchState, status: "paused", startedAt: null });
    } else {
      onStopwatchStateChange({ ...stopwatchState, status: "running", startedAt: Date.now() });
    }
  };

  const reset = () => {
    if (mode === "timer") onTimerStateChange({ totalSeconds: 0, remainingSeconds: 0, status: "idle", startedAt: null });
    else onStopwatchStateChange({ elapsedSeconds: 0, status: "idle", startedAt: null });
  };

  const setTimerPreset = (mins: number) => {
    const secs = mins * 60;
    onTimerStateChange({ totalSeconds: secs, remainingSeconds: secs, status: "running", startedAt: Date.now() });
    setIsOpen(false);
  };

  // Display Vars
  const timerDisplay = formatTime(timerState.remainingSeconds);
  const stopwatchDisplay = formatTime(stopwatchState.elapsedSeconds);
  const isRunning = timerState.status === "running" || stopwatchState.status === "running";
  const displayTime = mode === "timer" ? timerDisplay : stopwatchDisplay;

  return (
    <div className="relative z-40" ref={dropdownRef}>
      {/* Kinetic Capsule Trigger */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ borderColor: "rgba(255, 255, 255, 0.3)" }}
        whileTap={{ scale: 0.98 }}
        className={`h-[40px] px-4 flex items-center gap-3 bg-black/60 backdrop-blur-2xl border transition-all rounded-[12px] group relative overflow-hidden ${isRunning ? "border-[#FF5500] shadow-[0_0_15px_rgba(255,85,0,0.2)]" : "border-white/5"
          }`}
      >
        <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-[#FF5500] animate-pulse" : "bg-white/20"}`} />
        <span className={`font-mono font-bold text-sm tracking-widest ${isRunning ? "text-[#FF5500]" : "text-white"}`}>
          {displayTime}
        </span>
      </motion.button>

      {/* Kinetic Matte Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-3 w-[260px] bg-black/80 backdrop-blur-xl border border-white/5 rounded-xl shadow-2xl p-4 flex flex-col gap-4"
          >
            {/* Tabs */}
            <div className="flex bg-white/5 p-1 rounded-lg">
              {(["timer", "stopwatch"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${mode === m ? "bg-[#FF5500] text-black shadow-md" : "text-white/40 hover:text-white"
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Main Display */}
            <div className="text-center py-2 border-b border-white/5">
              <div className="text-4xl font-mono font-bold text-white tracking-tighter">
                {displayTime}
              </div>
              <div className="text-[10px] text-[#FF5500] font-bold uppercase tracking-[0.2em] mt-1">
                {mode === "timer" && timerState.status}
                {mode === "stopwatch" && stopwatchState.status}
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={mode === "timer" ? toggleTimer : toggleStopwatch}
                className={`flex-1 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${isRunning
                  ? "bg-transparent border-[#FF5500] text-[#FF5500] hover:bg-[#FF5500]/10"
                  : "bg-white text-black border-white hover:bg-neutral-200"
                  }`}
              >
                {isRunning ? "Pause" : "Start"}
              </button>
              <button
                onClick={reset}
                className="px-4 border border-white/10 text-white/40 hover:text-white hover:border-white rounded-lg transition-all"
              >
                Reset
              </button>
            </div>

            {/* Presets */}
            {mode === "timer" && (
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5">
                {TIMER_PRESETS.map(min => (
                  <button
                    key={min}
                    onClick={() => setTimerPreset(min)}
                    className="aspect-square rounded bg-white/5 text-white/60 hover:bg-[#FF5500] hover:text-black font-bold text-xs transition-colors"
                  >
                    {min}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
