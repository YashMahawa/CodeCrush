"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const models = [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Fast Execution" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "High Reasoning" },
    { value: "deepseek/deepseek-r1:free", label: "DeepSeek R1", desc: "Deep Thinker (Free)" },
    { value: "google/gemini-2.0-flash-thinking-exp:free", label: "Gemini Flash Think", desc: "Thinking Model (Free)" },
  ];

  const currentLabel = models.find(m => m.value === selectedModel)?.label || selectedModel;

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, [isOpen]);

  return (
    <div className="relative z-30" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-[40px] px-4 bg-black/60 backdrop-blur-2xl border border-white/5 rounded-[12px] flex items-center gap-3 hover:border-white/20 transition-all group"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[#FF5500] shadow-[0_0_8px_#FF5500]" />
        <span className="text-xs font-bold tracking-wider text-white uppercase">{currentLabel.replace("Gemini", "G")}</span>
        <svg className="w-3 h-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 mt-2 w-56 bg-black/80 backdrop-blur-xl border border-white/5 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1"
          >
            {models.map((model) => {
              const isActive = model.value === selectedModel;
              return (
                <button
                  key={model.value}
                  onClick={() => {
                    onModelChange(model.value);
                    setIsOpen(false);
                  }}
                  className={`text-left px-3 py-3 rounded-lg transition-all group relative overflow-hidden flex items-center justify-between ${isActive ? "bg-white/5" : "hover:bg-white/5"
                    }`}
                >
                  <div className="relative z-10">
                    <div className={`text-xs font-bold uppercase tracking-wider ${isActive ? "text-[#FF5500]" : "text-white"}`}>
                      {model.label}
                    </div>
                    <div className="text-[10px] text-white/40 font-mono mt-0.5">{model.desc}</div>
                  </div>

                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
