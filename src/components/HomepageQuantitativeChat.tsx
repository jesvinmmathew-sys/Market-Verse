/**
 * @file HomepageQuantitativeChat.tsx
 * @author Jesvin M Mathew
 * @description In-landing chat terminal displaying simulated quantitative intelligence responses.
 */
import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, ArrowRight, RefreshCw, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { marketVerseAnalytics } from "../services/marketVerseAnalytics";
import { QuantitativeLogo } from "./QuantitativeLogo";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
}

export const HomepageQuantitativeChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-1",
      role: "model",
      text: `### Welcome to NOVA AI Workspace
I am **NOVA**, your intelligent Indian stock market analyst. 

I have direct, real-time context on live NSE/BSE indexes, sector averages, stock prices, technical metrics (RSI, Moving Averages), and financial news sentiment.

**How can I assist you today?** Ask me to analyze any stock, compare assets, find momentum breakouts, or fetch today's top performance metrics.`
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "Who am I?",
    "Analyze Reliance Industries",
    "Which stocks are bullish today?",
    "Why is the market moving today?",
    "Compare two stocks"
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userStored = localStorage.getItem("supabase_user");
    if (!userStored) {
      const storedCount = parseInt(localStorage.getItem("marketverse_trial_prompts") || "0");
      if (storedCount >= 2) {
        window.dispatchEvent(new CustomEvent("marketverse_trigger_gate"));
        return;
      }
      localStorage.setItem("marketverse_trial_prompts", String(storedCount + 1));
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      text: textToSend.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Map message structure to what the server expects: { role, text }
      const serverHistory = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const responseText = await marketVerseAnalytics.chatWithMarketAI(textToSend.trim(), serverHistory);
      
      const aiMsg: Message = {
        id: `msg-${Date.now()}-model`,
        role: "model",
        text: responseText
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      const errMsg = error?.message || "";
      const text = errMsg.includes("Gemini API Key Missing") || errMsg.includes("Gemini API Error") || errMsg.includes("Gemini Connection Failed") || errMsg.includes("Direct Gemini API failed")
        ? errMsg
        : `âš ï¸ **System Interruption**: I encountered an error connecting to my server-side AI pipelines. 

Please verify that your API key is active in settings. 

*Heuristic fallbacks are available if the rate limits persist.*`;

      const errorMsg: Message = {
        id: `msg-${Date.now()}-error`,
        role: "model",
        text
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "initial-1",
        role: "model",
        text: `### Welcome to NOVA AI Workspace
I am **NOVA**, your intelligent Indian stock market analyst. 

I have direct, real-time context on live NSE/BSE indexes, sector averages, stock prices, technical metrics (RSI, Moving Averages), and financial news sentiment.

**How can I assist you today?** Ask me to analyze any stock, compare assets, find momentum breakouts, or fetch today's top performance metrics.`
      }
    ]);
  };

  // Helper to parse custom markdown headers and tables for display
  const formatText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Table Header row detector
      if (line.trim().startsWith("|") && idx < lines.length - 1 && lines[idx + 1].trim().includes("| :---")) {
        return null; // Skip rendering here and combine table
      }
      if (line.trim().includes("| :---")) return null; // Skip table separator row

      // Standard Table Row detector
      if (line.trim().startsWith("|")) {
        const cols = line.split("|").map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
        const isHeader = idx > 0 && lines[idx - 1].trim().includes("| :---");
        return (
          <div key={idx} className="grid grid-cols-3 gap-1 sm:gap-2 py-1 px-1.5 sm:px-3 border-b border-white/5 bg-white/[0.01] text-[9px] sm:text-[11px] font-mono break-words">
            {cols.map((col, cIdx) => (
              <span key={cIdx} className={cIdx === 0 ? "font-bold text-cyan-300 break-words" : "text-white/80 text-right break-words"}>
                {col.replace(/\*\*/g, "")}
              </span>
            ))}
          </div>
        );
      }

      // Headers
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider mt-4 mb-2">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} className="text-sm font-bold text-white font-mono mt-4 mb-2">{line.replace("## ", "")}</h3>;
      }
      if (line.startsWith("- ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-[11px] text-white/80 leading-relaxed mb-1">
            {line.replace("- ", "")}
          </li>
        );
      }
      if (line.startsWith("1. ")) {
        return (
          <li key={idx} className="ml-4 list-decimal text-[11px] text-white/80 leading-relaxed mb-1">
            {line.replace(/^\d+\.\s+/, "")}
          </li>
        );
      }

      // Default line
      if (line.trim() === "") return <div key={idx} className="h-2" />;

      // Bold replacements
      let content = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="text-cyan-300 font-semibold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      return <p key={idx} className="text-[11px] text-white/80 leading-relaxed mb-1.5">{parts.length > 0 ? parts : content}</p>;
    });
  };

  return (
    <div className="liquid-glass rounded-2xl border border-white/10 bg-[#0d0f14]/85 shadow-2xl overflow-hidden flex flex-col h-[520px] relative" id="homepage-ai-chat-container">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[90px] pointer-events-none" />
      
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#0a0c10]/70 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-[#0B2551] flex items-center justify-center text-cyan-200 shadow-lg">
            <QuantitativeLogo className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide font-mono uppercase">NOVA AI Workspace</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[8px] font-mono tracking-widest uppercase">ACTIVE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[9px] text-white/40 font-mono uppercase tracking-wider flex items-center gap-1">
                <Database className="w-2.5 h-2.5" /> Real-time India context
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleResetChat}
          className="p-1.5 rounded-md hover:bg-white/5 text-white/40 hover:text-white/80 transition-all font-mono text-[10px] flex items-center gap-1 cursor-pointer"
          title="Reset Conversation"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Messages area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent text-left relative z-10"
        id="chat-messages-scroller"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[92%] sm:max-w-[85%] rounded-xl p-3 sm:p-4 text-xs shadow-inner relative overflow-hidden ${
                  msg.role === "user"
                    ? "bg-[#3D81E3]/25 border border-[#3D81E3]/35 text-white"
                    : "bg-[#151922] border border-white/5 text-white/90"
                }`}
              >
                {msg.role === "model" && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/[0.01] blur-2xl pointer-events-none" />
                )}
                <div className="prose prose-invert prose-xs font-sans max-w-none break-words">
                  {formatText(msg.text)}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#151922] border border-white/5 rounded-xl p-4 text-xs text-white/40 flex items-center gap-2.5 font-mono">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Agent is calculating technical coordinates...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Footer inside chat */}
      <div className="px-5 py-2 border-t border-white/5 bg-[#090b0e]/40 relative z-10 text-left overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 rounded-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-cyan-500/30 text-[10px] text-white/65 hover:text-white transition-all cursor-pointer font-sans"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputValue);
        }}
        className="p-4 border-t border-white/5 bg-[#080a0d]/90 relative z-10"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask NOVA anything about Indian markets..."
            className="w-full pl-4 pr-12 py-3 bg-[#11141c]/90 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 font-sans transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`absolute right-2 p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              inputValue.trim() && !isLoading
                ? "bg-cyan-500 hover:bg-cyan-600 text-black shadow-lg shadow-cyan-500/20"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
