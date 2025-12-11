"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// Custom CodeBlock component with copy and replace functionality
function CodeBlock({ children, className, onReplace }: any) {
  const [copied, setCopied] = useState(false);

  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";
  const codeString = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplace = () => {
    if (confirm("Replace your current code with this AI-generated code?")) {
      onReplace(codeString);
    }
  };

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-white/10 shadow-lg">
      {lang && (
        <div className="absolute top-0 left-0 right-0 px-4 py-2 bg-white/5 text-xs font-mono text-white/40 border-b border-white/5 uppercase tracking-wider flex justify-between items-center">
          <span>{lang}</span>
        </div>
      )}
      <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className="px-3 py-1.5 bg-black/60 backdrop-blur text-white/80 rounded-lg border border-white/10 
                     hover:bg-white/10 text-xs font-medium flex items-center gap-1 shadow-sm"
        >
          {copied ? "✓ Copied" : "📋 Copy"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReplace}
          className="px-3 py-1.5 bg-[#FF5500]/20 backdrop-blur text-[#FF5500] rounded-lg border border-[#FF5500]/30 
                     hover:bg-[#FF5500]/30 text-xs font-bold flex items-center gap-1 shadow-sm"
        >
          <span>⚡</span> Replace
        </motion.button>
      </div>
      <SyntaxHighlighter
        language={lang || "text"}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          background: "rgba(0, 0, 0, 0.4)",
          padding: "1.5rem",
          paddingTop: lang ? "2.5rem" : "1.5rem",
          fontSize: "13px",
          lineHeight: "1.6",
        }}
        showLineNumbers
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

interface AIChatProps {
  code: string;
  language: string;
  problemText: string;
  testResults?: any;
  chatHistory: Message[];
  onUpdateChatHistory: (messages: Message[]) => void;
  selectedModel: string;
  setCode: (code: string) => void;
  onClose: () => void;
}

export default function AIChat({
  code,
  language,
  problemText,
  testResults,
  chatHistory,
  onUpdateChatHistory,
  selectedModel,
  setCode,
  onClose,
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>(chatHistory);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync local messages with parent history only if length differs significantly or on mount
    if (chatHistory && chatHistory.length !== messages.length) {
      setMessages(chatHistory);
    }
  }, [chatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (prompt: string, isSystemPrompt = false) => {
    if (!prompt.trim() && !isSystemPrompt) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      role: "user",
      content: isSystemPrompt ? prompt : input,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          code,
          language,
          problemText,
          testResults,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.suggestion ? `${data.error}\n\n💡 ${data.suggestion}` : data.error);
      }

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_${Math.random()}`,
        role: "assistant",
        content: data.response,
        timestamp: Date.now(),
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      onUpdateChatHistory(updatedMessages);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: `msg_${Date.now()}_${Math.random()}`,
        role: "assistant",
        content: error.message || "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm("Clear all chat history?")) {
      setMessages([]);
      onUpdateChatHistory([]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-sm relative">
      {/* Header/Close visible on mobile or if needed */}
      <div className="absolute top-2 right-2 z-20 md:hidden">
        <button onClick={onClose} className="bg-white/10 p-2 rounded-full text-white">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-[#FF5500]/10 rounded-full flex items-center justify-center mb-6 border border-[#FF5500]/20 animate-pulse">
              <span className="text-4xl">🤖</span>
            </div>
            <h3 className="text-xl font-bold text-white/90 mb-2 tracking-wide">AI Companion</h3>
            <p className="text-white/40 max-w-xs text-sm leading-relaxed">
              Ask for hints, get code reviews, or discuss algorithms. I'm here to help you code better.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-5 shadow-lg backdrop-blur-md ${message.role === "user"
                    ? "bg-[#FF5500]/10 border border-[#FF5500]/30 text-white rounded-br-none"
                    : "bg-white/5 border border-white/10 text-white/90 rounded-bl-none"
                    }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2 opacity-40">
                    {message.role === "user" ? "You" : "CodeCrush AI"}
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                    <ReactMarkdown
                      components={{
                        code({ inline, className, children, ...props }: any) {
                          const codeContent = String(children).replace(/\n$/, "");
                          const hasLanguage = className && /language-/.test(className);

                          if (inline) {
                            return (
                              <code
                                className="bg-white/10 px-1.5 py-0.5 rounded text-[#FF5500] text-xs font-mono border border-white/5"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          }

                          if (!hasLanguage) {
                            return (
                              <div className="inline-block bg-black/30 border border-white/10 text-white/80 px-3 py-1 rounded-lg text-xs font-mono my-1">
                                {codeContent}
                              </div>
                            );
                          }

                          return (
                            <CodeBlock className={className} onReplace={setCode}>
                              {children}
                            </CodeBlock>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-none p-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#FF5500] rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-[#FF5500] rounded-full animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 bg-[#FF5500] rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Actions & Input */}
      <div className="p-4 border-t border-white/5 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-md">
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask anything about code..."
            disabled={isLoading}
            className="w-full px-5 py-3.5 bg-white/5 text-white rounded-xl border border-white/10 
                       focus:border-[#FF5500]/50 focus:bg-white/10 focus:outline-none text-sm transition-all
                       placeholder-white/30 shadow-inner"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-1.5 bg-[#FF5500] 
                       text-black rounded-lg opacity-80 hover:opacity-100 disabled:opacity-20 transition-all shadow-lg"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </div>

        {messages.length > 0 && <div className="mt-2 flex justify-end">
          <button onClick={clearChat} className="text-[10px] text-white/30 hover:text-red-400">Clear Chat</button>
        </div>}
      </div>
    </div>
  );
}
