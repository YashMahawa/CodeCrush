"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [isHovered, setIsHovered] = useState(false);
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
    <div
      className="relative group my-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {lang && (
        <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-black/80 text-neonCyan text-xs font-mono border border-neonCyan/30 rounded">
          {lang}
        </div>
      )}
      <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className="px-3 py-1.5 bg-neonCyan/20 text-neonCyan rounded border border-neonCyan/50 
                     hover:bg-neonCyan/30 text-xs font-medium flex items-center gap-1 shadow-lg"
        >
          {copied ? (
            <>
              <span>✓</span> Copied
            </>
          ) : (
            <>
              <span>📋</span> Copy
            </>
          )}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReplace}
          className="px-3 py-1.5 bg-neonMagenta/20 text-neonMagenta rounded border border-neonMagenta/50 
                     hover:bg-neonMagenta/30 text-xs font-medium flex items-center gap-1 shadow-lg"
        >
          <span>🔄</span> Replace
        </motion.button>
      </div>
      <SyntaxHighlighter
        language={lang || "text"}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: "0.5rem",
          background: "#000000",
          border: "1px solid rgba(0, 255, 255, 0.3)",
          padding: "1rem",
          paddingTop: lang ? "2.5rem" : "1rem",
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
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>(chatHistory);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(chatHistory);
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
          model: selectedModel, // Pass the selected model
        }),
      });

      const data = await response.json();

      if (data.error) {
        const errorMsg = data.suggestion 
          ? `${data.error}\n\n💡 ${data.suggestion}`
          : data.error;
        throw new Error(errorMsg);
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
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      onUpdateChatHistory(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHintRequest = () => {
    sendMessage(
      "I'm stuck on this problem. Can you give me a hint to help me figure out the solution without giving away the answer? Focus on the approach or algorithm I should consider.",
      true
    );
  };

  const handleSolutionRequest = () => {
    sendMessage(
      "I need help with the solution. Can you show me the correct approach and explain the key concepts? Please provide a working solution with detailed explanations.",
      true
    );
  };

  const clearChat = () => {
    if (confirm("Clear all chat history?")) {
      setMessages([]);
      onUpdateChatHistory([]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Quick Action Buttons */}
      <div className="flex gap-2 p-3 border-b border-neonCyan/20 bg-black/20">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleHintRequest}
          disabled={isLoading || !code.trim() || !problemText.trim()}
          className="flex-1 py-2 bg-neonMagenta/20 text-neonMagenta rounded border border-neonMagenta/50 
                     hover:bg-neonMagenta/30 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
        >
          🤔 Ask for Hint
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSolutionRequest}
          disabled={isLoading || !code.trim() || !problemText.trim()}
          className="flex-1 py-2 bg-neonMagenta/20 text-neonMagenta rounded border border-neonMagenta/50 
                     hover:bg-neonMagenta/30 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
        >
          💡 Get Solution
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={clearChat}
          disabled={messages.length === 0}
          className="px-3 py-2 bg-red-500/20 text-red-400 rounded border border-red-500/50 
                     hover:bg-red-500/30 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
        >
          🗑️
        </motion.button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-4xl mb-2">💬</p>
            <p className="text-lg font-semibold">AI Assistant</p>
            <p className="text-sm mt-2">Ask for hints, solutions, or any coding help!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-neonCyan/20 border border-neonCyan/50 text-white"
                      : "bg-neonMagenta/20 border border-neonMagenta/50 text-white"
                  }`}
                >
                  <div className="text-xs text-gray-400 mb-1">
                    {message.role === "user" ? "You" : "AI Assistant"}
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          if (inline) {
                            return (
                              <code className="bg-black/50 px-1.5 py-0.5 rounded text-neonCyan text-sm" {...props}>
                                {children}
                              </code>
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
                <div className="bg-neonMagenta/20 border border-neonMagenta/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-neonMagenta rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-neonMagenta rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-neonMagenta rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-neonCyan/20 bg-black/20">
        <div className="flex gap-2">
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
            placeholder="Ask anything about your code..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-black/30 text-white rounded border border-gray-700 
                       focus:border-neonCyan/50 focus:outline-none text-sm disabled:opacity-50"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-neonCyan/20 text-neonCyan rounded border border-neonCyan/50 
                       hover:bg-neonCyan/30 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Send
          </motion.button>
        </div>
      </div>
    </div>
  );
}
