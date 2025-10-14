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
    
    // Listen for storage changes from other tabs
    const handleStorageChange = () => {
      loadSessions();
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Refresh sessions when currentSessionId changes
  useEffect(() => {
    loadSessions();
  }, [currentSessionId, refreshKey]);

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm("Delete this session? This cannot be undone.")) {
      deleteSession(sessionId);
      loadSessions();
      
      // If deleted current session, create new one
      if (sessionId === currentSessionId) {
        onNewSession();
      }
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2.5 bg-neonCyan/20 text-neonCyan rounded-lg border border-neonCyan/50 hover:bg-neonCyan/30 transition-colors"
        title="Sessions"
        aria-label="Toggle Sessions"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-darkBg border-r border-neonCyan/20 z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 pt-4 pb-0 border-b border-neonCyan/20 bg-black/30">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-neonCyan ml-24">History</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* New Session Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onNewSession();
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 mb-4 bg-neonCyan/20 text-neonCyan rounded-lg border border-neonCyan/50 hover:bg-neonCyan/30 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <span className="text-xl">+</span>
                  New Problem
                </motion.button>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-2">
                {sessions.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8 px-4">
                    <p className="text-4xl mb-2">📝</p>
                    <p>No sessions yet</p>
                    <p className="text-sm mt-1">Click “New Problem” to start</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <motion.div
                        key={session.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          session.id === currentSessionId
                            ? "bg-neonCyan/20 border-neonCyan/50"
                            : "bg-black/20 border-gray-700 hover:border-neonCyan/30"
                        }`}
                        onClick={() => {
                          onSelectSession(session.id);
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate text-sm">
                              {session.name || "Untitled Problem"}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">
                                {formatDate(session.updatedAt)}
                              </span>
                              {session.testCases.length > 0 && (
                                <span className="text-xs text-neonMagenta">
                                  {session.testCases.length} tests
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDelete(e, session.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors p-1"
                            title="Delete session"
                          >
                            🗑️
                          </button>
                        </div>

                        {session.lastEvaluation && (
                          <div className="mt-2 text-xs">
                            <span
                              className={`${
                                session.lastEvaluation.summary.percentage === 100
                                  ? "text-neonLime"
                                  : "text-yellow-400"
                              }`}
                            >
                              {session.lastEvaluation.summary.passed}/
                              {session.lastEvaluation.summary.total} passed (
                              {session.lastEvaluation.summary.percentage}%)
                            </span>
                          </div>
                        )}
                      </motion.div>
                    ))}
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
