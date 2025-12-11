"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAllSessions,
  deleteSession,
  type Session,
} from "@/lib/sessionStorage";

interface SessionSidebarProps {
  currentSessionId: string;
  refreshKey: number;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
}

export default function SessionSidebar({
  currentSessionId,
  refreshKey,
  onSelectSession,
  onNewSession,
}: SessionSidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadSessions = () => {
    const allSessions = getAllSessions();
    setSessions(allSessions);
  };

  useEffect(() => {
    loadSessions();
    const handleStorageChange = () => loadSessions();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [currentSessionId, refreshKey]);

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm("Delete this session?")) {
      deleteSession(sessionId);
      loadSessions();
      if (sessionId === currentSessionId) {
        onNewSession();
      }
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Less than 24 hours
    if (diffMs < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // Less than 7 days
    if (diffMs < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* 
        Main Toggle Button - Z-Index 100 to ensure it's always clickable 
        Positioned fixed to viewport to avoid container interaction issues
      */}
      <motion.button
        initial={false}
        whileHover={{ scale: 1.05, borderColor: "rgba(255, 255, 255, 0.4)" }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-6 left-6 z-[100] w-12 h-12 flex items-center justify-center 
                   rounded-2xl border transition-all duration-300 shadow-2xl
                   ${isOpen
            ? "bg-white text-black border-white"
            : "bg-black/40 backdrop-blur-2xl border-white/10 text-white hover:bg-black/60"
          }`}
        title="Archives & History"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M4 6h16M4 12h10M4 18h16" strokeLinecap="square" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - Z-Index 98 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[98]"
            />

            {/* Panel - Z-Index 99 */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{
                x: 0,
                transition: { type: "spring", bounce: 0, duration: 0.4 }
              }}
              exit={{
                x: "-100%",
                transition: { type: "tween", ease: "circIn", duration: 0.3 }
              }}
              className="fixed top-0 left-0 h-[100dvh] w-[380px] z-[99] 
                         bg-[#050505]/95 backdrop-blur-3xl border-r border-white/5 
                         shadow-[50px_0_100px_rgba(0,0,0,0.5)] flex flex-col"
            >
              {/* Header */}
              <div className="h-24 flex items-end pb-6 px-8 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#FF5500] uppercase opacity-80">
                    System Protocol
                  </span>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Archives</h2>
                </div>
              </div>

              {/* New Session Action */}
              <div className="p-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onNewSession();
                    setIsOpen(false);
                  }}
                  className="w-full py-4 bg-[#FF5500] hover:bg-[#ff661a] text-black rounded-xl
                             font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 
                             shadow-[0_0_30px_rgba(255,85,0,0.3)] hover:shadow-[0_0_50px_rgba(255,85,0,0.5)]
                             transition-all duration-300 border border-[#FF5500]/50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="square" d="M12 4v16m8-8H4" />
                  </svg>
                  New Protocol
                </motion.button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2 custom-scrollbar">
                {sessions.length > 0 ? (
                  sessions.map((session, i) => {
                    const isActive = session.id === currentSessionId;
                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group relative"
                      >
                        <button
                          onClick={() => {
                            onSelectSession(session.id);
                            setIsOpen(false);
                          }}
                          className={`w-full p-4 rounded-xl text-left border transition-all duration-300
                                    ${isActive
                              ? "bg-white/10 border-[#FF5500]/50 shadow-[0_0_20px_rgba(255,85,0,0.1)]"
                              : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/5"
                            }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className={`font-medium text-sm truncate pr-4 ${isActive ? "text-white" : "text-white/60 group-hover:text-white"}`}>
                              {session.name || "Untitled Protocol"}
                            </h3>
                            {session.lastEvaluation?.summary.percentage === 100 && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] shadow-[0_0_10px_#00FF9D]" title="Perfect Score" />
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-white/20 uppercase tracking-wider group-hover:text-white/40 transition-colors">
                              {formatDate(session.updatedAt)}
                            </span>

                            <div
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 
                                         hover:bg-red-500/20 rounded-md cursor-pointer text-white/20 hover:text-red-400"
                              onClick={(e) => handleDelete(e, session.id)}
                              title="Delete Archive"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="square" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <span className="text-4xl mb-4 grayscale">📂</span>
                    <span className="text-xs font-mono uppercase tracking-widest">No Archives</span>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
