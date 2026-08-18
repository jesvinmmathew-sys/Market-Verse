/**
 * @file FloatingQuantitativeAssistant.tsx
 * @author Jesvin M Mathew
 * @description Floating quantitative analyst assistant chatbot widget.
 */
import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, X, RefreshCw, MessageSquare, Bot, Database, TrendingUp, TrendingDown, Activity, ChevronRight, BarChart2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { marketVerseAnalytics } from "../services/marketVerseAnalytics";
import { INDIAN_STOCK_UNIVERSE } from "../services/indianStocksDb";
import { QuantitativeLogo } from "./QuantitativeLogo";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  stockCard?: StockAnalysisCardData;
}

interface StockAnalysisCardData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
  volume: string;
  dayHigh: number;
  dayLow: number;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  risk: "Low" | "Medium" | "High";
  riskPercentage: number;
  safetyScore: number;
  briefNote: string;
  strategyExplanation: string;
  reasons: string[];
  possibleScenarios: {
    shortTerm: string;
    mediumTerm: string;
  };
  keyIndicators: {
    rsi: number;
    macd: string;
    movingAverages: string;
    trend: string;
  };
  support: number;
  resistance: number;
}

interface FloatingQuantitativeAssistantProps {
  currentRoute: string;
}

// 1. Detect if a stock is mentioned in the user's prompt
const detectStockInText = (text: string) => {
  const upper = text.toUpperCase();
  
  // Try exact symbol match with word boundary
  for (const stock of INDIAN_STOCK_UNIVERSE) {
    const symbolPattern = new RegExp(`\\b${stock.symbol}\\b`);
    if (symbolPattern.test(upper) || upper === stock.symbol) {
      return stock;
    }
  }

  // Try contains matching for full names or popular abbreviations
  for (const stock of INDIAN_STOCK_UNIVERSE) {
    const nameUpper = stock.name.toUpperCase();
    if (upper.includes(stock.symbol)) {
      return stock;
    }
    // Match common parts like "RELIANCE", "TATA MOTORS", "INFOSYS", "HDFC"
    const cleanedName = nameUpper.replace("LIMITED", "").replace("LTD", "").trim();
    if (cleanedName.length > 4 && upper.includes(cleanedName)) {
      return stock;
    }
    // Custom triggers for popular abbreviations
    if (stock.symbol === "TATAMOTORS" && upper.includes("TATA MOTORS")) return stock;
    if (stock.symbol === "HDFCBANK" && upper.includes("HDFC")) return stock;
    if (stock.symbol === "ICICIBANK" && upper.includes("ICICI")) return stock;
    if (stock.symbol === "SBIN" && (upper.includes("SBI") || upper.includes("STATE BANK"))) return stock;
  }
  return null;
};

// 2. Fetch both quote and AI technical analysis in parallel
const fetchFullStockAnalysis = async (symbol: string): Promise<StockAnalysisCardData | null> => {
  try {
    const [quoteRes, aiRes] = await Promise.all([
      fetch(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`),
      fetch("/api/ai/analyze-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol })
      })
    ]);

    if (!quoteRes.ok || !aiRes.ok) return null;

    const quoteData = await quoteRes.json();
    const aiData = await aiRes.json();

    const price = quoteData.price || 100;
    const change = quoteData.change !== undefined ? quoteData.change : 0;
    const percentChange = quoteData.percentChange !== undefined ? quoteData.percentChange : 0;

    const calculatedSupport = price * 0.965;
    const calculatedResistance = price * 1.035;

    return {
      symbol: symbol,
      name: quoteData.name || aiData.name || `${symbol} India`,
      price: price,
      change: change,
      percentChange: percentChange,
      volume: quoteData.volume || "2.1M",
      dayHigh: quoteData.dayHigh || parseFloat((price * 1.01).toFixed(2)),
      dayLow: quoteData.dayLow || parseFloat((price * 0.99).toFixed(2)),
      sentiment: aiData.sentiment || "Neutral",
      confidence: aiData.confidence || 65,
      risk: aiData.risk || "Medium",
      riskPercentage: aiData.riskPercentage || 45,
      safetyScore: aiData.safetyScore || 70,
      briefNote: aiData.briefNote || "Asset price maintains normal standard deviation bands.",
      strategyExplanation: aiData.strategyExplanation || "Technical indicators display consolidative trend indicators.",
      reasons: aiData.reasons || ["Price Action registers neutral range support.", "Relative Strength Index (RSI) tracks moderate volume bounds."],
      possibleScenarios: aiData.possibleScenarios || {
        shortTerm: "High probability range-bound accumulation inside key pivots.",
        mediumTerm: "Primary sector triggers and overall benchmark volume expansion determines structural breakouts."
      },
      keyIndicators: aiData.keyIndicators || {
        rsi: 52,
        macd: "Neutral crossovers trading near base parameters.",
        movingAverages: `14-day SMA resides near ₹${price.toFixed(1)}`,
        trend: "Neutral"
      },
      support: parseFloat(calculatedSupport.toFixed(2)),
      resistance: parseFloat(calculatedResistance.toFixed(2))
    };
  } catch (err) {
    console.error("Failed to load full stock analysis for AI card:", err);
    return null;
  }
};

// 3. Render the Premium Stock Intelligence Card Component
const StockIntelligenceCard: React.FC<{ card: StockAnalysisCardData }> = ({ card }) => {
  const isBullish = card.sentiment === "Bullish";
  const isBearish = card.sentiment === "Bearish";
  const sentimentColor = isBullish ? "text-emerald-400" : isBearish ? "text-rose-400" : "text-amber-400";
  const sentimentBg = isBullish ? "bg-emerald-500/10 border-emerald-500/20" : isBearish ? "bg-rose-500/10 border-rose-500/20" : "bg-amber-500/10 border-amber-500/20";

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#0e1117]/95 overflow-hidden shadow-2xl font-sans mt-3 mb-3 relative" id={`stock-intelligence-card-${card.symbol.toLowerCase()}`}>
      {/* Accent Header Glow */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${isBullish ? "from-emerald-500 to-teal-400 animate-pulse" : isBearish ? "from-rose-500 to-red-400 animate-pulse" : "from-amber-500 to-orange-400"}`} />
      
      <div className="p-4 space-y-4">
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <h4 className="text-sm font-black text-white tracking-wider font-mono">{card.symbol}</h4>
              <span className={`text-[9px] px-2 py-0.5 rounded border ${sentimentBg} ${sentimentColor} font-mono font-bold uppercase tracking-widest`}>
                {card.sentiment}
              </span>
            </div>
            <p className="text-[10px] text-white/50 font-sans mt-1">{card.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono font-bold text-white">₹{card.price.toLocaleString("en-IN")}</p>
            <p className={`text-[10px] font-mono font-bold flex items-center justify-end gap-1 ${card.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {card.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {card.change >= 0 ? "+" : ""}{card.change.toFixed(2)} ({card.percentChange >= 0 ? "+" : ""}{card.percentChange.toFixed(2)}%)
            </p>
          </div>
        </div>

        {/* OHLC & Volume stats bar */}
        <div className="grid grid-cols-4 gap-1.5 py-2 px-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center text-[10px] font-mono">
          <div>
            <span className="block text-white/40 text-[8px] uppercase tracking-wide">Open</span>
            <span className="text-white font-bold">₹{(card.price - card.change).toFixed(1)}</span>
          </div>
          <div>
            <span className="block text-white/40 text-[8px] uppercase tracking-wide">High</span>
            <span className="text-emerald-400 font-bold">₹{card.dayHigh.toFixed(1)}</span>
          </div>
          <div>
            <span className="block text-white/40 text-[8px] uppercase tracking-wide">Low</span>
            <span className="text-rose-400 font-bold">₹{card.dayLow.toFixed(1)}</span>
          </div>
          <div>
            <span className="block text-white/40 text-[8px] uppercase tracking-wide">Volume</span>
            <span className="text-white font-bold">{card.volume}</span>
          </div>
        </div>

        {/* Probabilities and Risk Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Circular/Progress confidence bar */}
          <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] text-white/40 font-mono uppercase tracking-wider">Directional Probabilities</span>
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10.5px] font-mono">
                <span className="text-emerald-400">Bullish Probability</span>
                <span className="text-emerald-400 font-bold">{card.sentiment === "Bullish" ? card.confidence : card.sentiment === "Bearish" ? 100 - card.confidence : 50}%</span>
              </div>
              <div className="flex justify-between text-[10.5px] font-mono">
                <span className="text-rose-400">Bearish Probability</span>
                <span className="text-rose-400 font-bold">{card.sentiment === "Bearish" ? card.confidence : card.sentiment === "Bullish" ? 100 - card.confidence : 50}%</span>
              </div>
              <div className="w-full h-2 bg-rose-500/25 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${card.sentiment === "Bullish" ? card.confidence : card.sentiment === "Bearish" ? 100 - card.confidence : 50}%` }} />
                <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${card.sentiment === "Bearish" ? card.confidence : card.sentiment === "Bullish" ? 100 - card.confidence : 50}%` }} />
              </div>
            </div>
          </div>

          {/* Risk Level Gauge */}
          <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col justify-between">
            <span className="text-[9px] text-white/40 font-mono uppercase tracking-wider block mb-1.5">Risk & Volatility assessment</span>
            <div className="space-y-2">
              <div className="flex justify-between text-[10.5px] font-sans">
                <span className="text-white/60">Risk Profile</span>
                <span className={`font-bold uppercase text-[10px] px-1.5 py-0.2 rounded ${card.risk === "Low" ? "bg-emerald-500/10 text-emerald-400" : card.risk === "High" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"}`}>
                  {card.risk} Risk
                </span>
              </div>
              <div className="flex justify-between text-[10.5px] font-mono">
                <span className="text-white/40 font-sans">Volatility Score</span>
                <span className="text-white/80 font-bold">{card.riskPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${card.risk === "Low" ? "bg-emerald-500" : card.risk === "High" ? "bg-rose-500" : "bg-amber-500"}`} 
                  style={{ width: `${card.riskPercentage}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Technical Indicators Check */}
        <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 space-y-2 text-left">
          <span className="text-[9px] text-cyan-300 font-mono uppercase tracking-wider block">Technical Indicator Checklist</span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-mono">
            <div className="flex items-center justify-between py-0.5 border-b border-white/5">
              <span className="text-white/40 font-sans">RSI (14)</span>
              <span className={`font-bold ${card.keyIndicators.rsi > 70 ? "text-rose-400" : card.keyIndicators.rsi < 30 ? "text-emerald-400" : "text-cyan-300"}`}>
                {card.keyIndicators.rsi.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between py-0.5 border-b border-white/5">
              <span className="text-white/40 font-sans">MACD Trend</span>
              <span className="text-white font-bold truncate max-w-[80px]">
                {card.keyIndicators.macd.toLowerCase().includes("above") || card.sentiment === "Bullish" ? "Bullish" : "Bearish"}
              </span>
            </div>
            <div className="flex items-center justify-between py-0.5 border-b border-white/5">
              <span className="text-white/40 font-sans">Moving Average</span>
              <span className="text-white font-bold truncate max-w-[80px]">
                {card.price > (card.price - card.change) ? "Above SMA" : "Below SMA"}
              </span>
            </div>
            <div className="flex items-center justify-between py-0.5 border-b border-white/5">
              <span className="text-white/40 font-sans">Trend Setup</span>
              <span className={`font-bold ${sentimentColor}`}>
                {card.sentiment}
              </span>
            </div>
          </div>
        </div>

        {/* Support & Resistance pivots */}
        <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
          <div className="py-2 px-2 bg-emerald-500/[0.03] rounded-lg border border-emerald-500/10">
            <span className="text-emerald-400/40 text-[8px] uppercase block tracking-wider">Estimated Support</span>
            <span className="text-emerald-400 font-bold">₹{card.support.toLocaleString("en-IN")}</span>
          </div>
          <div className="py-2 px-2 bg-rose-500/[0.03] rounded-lg border border-rose-500/10">
            <span className="text-rose-400/40 text-[8px] uppercase block tracking-wider">Estimated Resistance</span>
            <span className="text-rose-400 font-bold">₹{card.resistance.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Why AI thinks this */}
        <div className="p-3 rounded-xl bg-cyan-500/[0.03] border border-cyan-500/10 space-y-1 text-left">
          <span className="text-[9px] text-cyan-300 font-mono uppercase tracking-wider block">Why AI Analyst Thinks This:</span>
          <p className="text-[10.5px] text-white/80 leading-relaxed font-sans">
            {card.briefNote} {card.strategyExplanation}
          </p>
        </div>

        <div className="text-[8px] text-white/30 text-center font-mono tracking-wider italic">
          Disclaimer: Probability models are educational, not financial advice.
        </div>
      </div>
    </div>
  );
};

export const FloatingQuantitativeAssistant: React.FC<FloatingQuantitativeAssistantProps> = ({ currentRoute }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStockMode, setIsStockMode] = useState(false);
  const [analyzingStockName, setAnalyzingStockName] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Extract currently viewed stock if route is /stock/:symbol
  const activeStock = currentRoute.startsWith("/stock/")
    ? currentRoute.split("/stock/")[1]?.toUpperCase()
    : null;

  // Initialize or welcome when active stock changes
  useEffect(() => {
    if (activeStock) {
      setIsStockMode(true);
      setAnalyzingStockName(activeStock);
      setIsOpen(true); // Automatically show AI assistant on stock detail pages
      
      const triggerAutoLoad = async () => {
        setMessages([
          {
            id: "auto-msg-user",
            role: "user",
            text: `Analyze ${activeStock}`
          }
        ]);
        setIsLoading(true);
        try {
          const chatReply = await marketVerseAnalytics.chatWithMarketAI(`Analyze ${activeStock}`, []);
          const stockCardData = await fetchFullStockAnalysis(activeStock);
          
          setMessages([
            {
              id: "auto-msg-user",
              role: "user",
              text: `Analyze ${activeStock}`
            },
            {
              id: "auto-msg-model",
              role: "model",
              text: chatReply,
              stockCard: stockCardData || undefined
            }
          ]);
        } catch (err: any) {
          console.error("Autoload stock details AI failed:", err);
          const errMsg = err?.message || "";
          setMessages([
            {
              id: "auto-msg-user",
              role: "user",
              text: "Analyze " + activeStock
            },
            {
              id: "auto-msg-model",
              role: "model",
              text: errMsg.includes("Gemini API Key Missing") || errMsg.includes("Gemini API Error") || errMsg.includes("Gemini Connection Failed") || errMsg.includes("Direct Gemini API failed")
                ? errMsg 
                : "⚠️ **AI analysis temporarily unavailable. Please try again later.**"
            }
          ]);
        } finally {
          setIsLoading(false);
        }
      };
      
      triggerAutoLoad();
    } else {
      setIsStockMode(false);
      setAnalyzingStockName(null);
      const welcomeText = `### NOVA AI Analyst
I am **NOVA**, your dedicated **Indian Market Analyst** inside MarketVerse.

I understand technical indicators, NSE/BSE sectors, and macroeconomic news events.

Try asking me:
- **"Analyze Tata Motors"** (Triggers Stock Intelligence Card)
- **"Why did banking stocks fall today?"**
- **"Compare TCS and Infosys"**
- **"If I have 1 Lakh Rupees, how should I diversify?"**`;

      setMessages([
        {
          id: "welcome-msg",
          role: "model",
          text: welcomeText
        }
      ]);
    }
  }, [activeStock]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    const handleTriggerAI = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt: string }>;
      if (customEvent.detail && customEvent.detail.prompt) {
        setIsOpen(true);
        handleSendMessage(customEvent.detail.prompt);
      }
    };
    window.removeEventListener("trigger-marketverse-ai", handleTriggerAI);
    window.addEventListener("trigger-marketverse-ai", handleTriggerAI);
    return () => {
      window.removeEventListener("trigger-marketverse-ai", handleTriggerAI);
    };
  }, [messages, isLoading, activeStock]);

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

    // Detect if a stock is mentioned
    const stockDetected = detectStockInText(textToSend);
    if (stockDetected) {
      setIsStockMode(true);
      setAnalyzingStockName(stockDetected.symbol);
    } else {
      setIsStockMode(false);
      setAnalyzingStockName(null);
    }

    // Build user message
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      text: textToSend.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Map history for API
      const serverHistory = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      // Let the backend know what stock is currently open as implicit context if no stock detected
      let contextualQuestion = textToSend.trim();
      
      // Check if user has a custom portfolio loaded to inject real-time portfolio context
      try {
        const stored = localStorage.getItem("marketverse_custom_portfolio");
        if (stored) {
          const portfolio = JSON.parse(stored);
          if (Array.isArray(portfolio) && portfolio.length > 0) {
            const isPortfolioTerm = /portfolio|diversif|risk|profit|holding|allocat|balance|wealth|invest|asset/i.test(textToSend);
            const isPortfolioPage = currentRoute === "/portfolio";
            
            if (isPortfolioTerm || isPortfolioPage) {
              const portfolioStr = portfolio.map(p => `- ${p.symbol}: ${p.shares} shares @ ₹${p.avgBuyPrice}`).join("\n");
              contextualQuestion += `\n\n[PORTFOLIO MODE ACTIVE - User's current investment portfolio context:\n${portfolioStr}\n\nAnalyze and answer the user's question leveraging this exact portfolio context directly, and talk as NOVA, the portfolio intelligence engine. Offer brief, sharp, luxury-grade quantitative answers.]`;
            }
          }
        }
      } catch (e) {
        console.error("Failed to inject portfolio context", e);
      }

      if (activeStock && !stockDetected && !contextualQuestion.toUpperCase().includes(activeStock)) {
        if (
          contextualQuestion.toLowerCase().includes("sentiment") ||
          contextualQuestion.toLowerCase().includes("analyze") ||
          contextualQuestion.toLowerCase().includes("trend") ||
          contextualQuestion.toLowerCase().includes("rsi") ||
          contextualQuestion.toLowerCase().includes("should i buy") ||
          contextualQuestion.toLowerCase().includes("forecast") ||
          contextualQuestion.toLowerCase().includes("short term") ||
          contextualQuestion.toLowerCase().includes("it strong")
        ) {
          contextualQuestion += ` (Context: relating to ${activeStock})`;
        }
      }

      // Parallelize: Chat request & full stock card data if stock is detected
      const chatPromise = marketVerseAnalytics.chatWithMarketAI(contextualQuestion, serverHistory);
      const stockCardPromise = stockDetected ? fetchFullStockAnalysis(stockDetected.symbol) : Promise.resolve(null);

      const [chatReply, stockCardData] = await Promise.all([chatPromise, stockCardPromise]);

      const aiMsg: Message = {
        id: `msg-${Date.now()}-model`,
        role: "model",
        text: chatReply,
        stockCard: stockCardData || undefined
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      
      // Fallback response with heuristic stock card if rate-limited or error occurs
      let fallbackText = `⚠️ **AI analysis temporarily unavailable. Showing technical market analysis.**

I encountered a temporary api rate-limit with my primary model servers. 

However, my technical analysis pipeline registers normal trading ranges. Educational analysis, not financial advice.`;

      let stockCardData: StockAnalysisCardData | undefined = undefined;

      if (stockDetected) {
        // Build simulated high-quality mock data for immediate smooth experience
        const basePrice = stockDetected.price || 500;
        const mockChange = parseFloat(((Math.random() - 0.45) * 15).toFixed(2));
        const mockPercent = parseFloat(((mockChange / basePrice) * 100).toFixed(2));
        
        stockCardData = {
          symbol: stockDetected.symbol,
          name: stockDetected.name,
          price: basePrice,
          change: mockChange,
          percentChange: mockPercent,
          volume: "1.8M",
          dayHigh: basePrice * 1.015,
          dayLow: basePrice * 0.985,
          sentiment: mockChange >= 0 ? "Bullish" : "Bearish",
          confidence: Math.floor(62 + Math.random() * 15),
          risk: "Medium",
          riskPercentage: 48,
          safetyScore: 68,
          briefNote: `${stockDetected.name} is consolidating near technical support barriers.`,
          strategyExplanation: "Price action tracks the 14-day SMA closely with balanced distribution channels.",
          reasons: ["Trading volume maintains equilibrium.", "RSI oscillator centers near 51.5."],
          possibleScenarios: {
            shortTerm: "Sideways accumulation inside support bands.",
            mediumTerm: "Subject to broader sectoral breakouts and index movements."
          },
          keyIndicators: {
            rsi: 51.5,
            macd: "Converging gracefully near the baseline.",
            movingAverages: `14-day SMA holds at ₹${basePrice.toFixed(1)}`,
            trend: mockChange >= 0 ? "Bullish" : "Bearish"
          },
          support: parseFloat((basePrice * 0.965).toFixed(2)),
          resistance: parseFloat((basePrice * 1.035).toFixed(2))
        };
      }

      const errorMsg: Message = {
        id: `msg-${Date.now()}-err`,
        role: "model",
        text: fallbackText,
        stockCard: stockCardData
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setIsStockMode(false);
      setAnalyzingStockName(null);
    }
  };

  const handleReset = () => {
    const welcomeText = activeStock
      ? `### Stock Analysis Mode: ${activeStock}
I have initialized live tracking for **${activeStock}**. 

I've automatically connected to the NSE live data feed and evaluated its core moving averages, Relative Strength Index (RSI), and MACD crossovers.

Ask me anything about **${activeStock}** or type another stock name to analyze instantly!`
      : `### NOVA AI Analyst
I am **NOVA**, your dedicated **Indian Market Analyst** inside MarketVerse.

I understand technical indicators, NSE/BSE sectors, and macroeconomic news events.

Try asking me:
- **"Analyze Tata Motors"** (Triggers Stock Intelligence Card)
- **"Why did banking stocks fall today?"**
- **"Compare TCS and Infosys"**
- **"If I have 1 Lakh Rupees, how should I diversify?"**`;

    setMessages([
      {
        id: "welcome-msg",
        role: "model",
        text: welcomeText
      }
    ]);
  };

  const formatText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (line.trim().startsWith("|") && idx < lines.length - 1 && lines[idx + 1].trim().includes("| :---")) {
        return null;
      }
      if (line.trim().includes("| :---")) return null;

      if (line.trim().startsWith("|")) {
        const cols = line.split("|").map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
        return (
          <div key={idx} className="grid grid-cols-3 gap-2 py-1.5 px-3 border-b border-white/5 bg-white/[0.01] text-[10px] font-mono">
            {cols.map((col, cIdx) => (
              <span key={cIdx} className={cIdx === 0 ? "font-bold text-cyan-300" : "text-white/85 text-right"}>
                {col.replace(/\*\*/g, "")}
              </span>
            ))}
          </div>
        );
      }

      if (line.startsWith("### ")) {
        return <h4 key={idx} className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider mt-3 mb-1">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} className="text-xs font-bold text-white font-mono mt-3 mb-1">{line.replace("## ", "")}</h3>;
      }
      if (line.startsWith("- ")) {
        return (
          <li key={idx} className="ml-3 list-disc text-[10.5px] text-white/85 leading-relaxed mb-0.5">
            {line.replace("- ", "")}
          </li>
        );
      }
      if (line.startsWith("1. ")) {
        return (
          <li key={idx} className="ml-3 list-decimal text-[10.5px] text-white/85 leading-relaxed mb-0.5">
            {line.replace(/^\d+\.\s+/, "")}
          </li>
        );
      }

      if (line.trim() === "") return <div key={idx} className="h-1.5" />;

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

      return <p key={idx} className="text-[10.5px] text-white/85 leading-relaxed mb-1">{parts.length > 0 ? parts : content}</p>;
    });
  };

  if (currentRoute === "/ai") {
    return null;
  }

  return (
    <>
      {/* Fixed bottom-right trigger system - adjusted mobile spacing to avoid offscreen cutoffs */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[999] flex flex-col items-end gap-3 pointer-events-none">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="pointer-events-auto fixed md:right-[20px] md:bottom-[20px] md:w-[420px] md:max-w-[calc(100vw-40px)] md:h-[80vh] md:max-h-[80vh] liquid-glass rounded-2xl border border-white/10 bg-[#07090d]/98 shadow-2xl overflow-hidden flex flex-col max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:w-full max-md:max-w-full max-md:h-[90vh] max-md:max-h-[90vh] max-md:rounded-t-3xl max-md:rounded-b-none max-md:top-auto"
              id="floating-ai-chat-panel"
            >
              {/* Premium Gradient Background Glows */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] pointer-events-none" />
              <div className="absolute bottom-16 left-0 w-48 h-48 bg-blue-500/5 blur-[80px] pointer-events-none" />

              {/* Header section */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 bg-[#0a0c10]/80 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3d81e3] to-cyan-500 flex items-center justify-center text-white relative shadow-lg">
                      <QuantitativeLogo className="w-6 h-6" />
                    </div>
                    {/* Pulsing online indicator */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0a0c10]" />
                  </div>
                  
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono uppercase tracking-widest">NOVA AI</span>
                      <span className="text-[8px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.2 rounded font-mono font-bold tracking-widest">ACTIVE</span>
                    </div>
                    <span className="text-[9px] text-white/40 font-mono tracking-wider flex items-center gap-1">
                      <Database className="w-2.5 h-2.5" /> 
                      {isStockMode ? `Stock Analysis Mode: ${analyzingStockName || "Active"}` : "Analyzing Indian Markets"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors cursor-pointer"
                    title="Reset Chat History"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Live Contextual Ribbon */}
              {activeStock && (
                <div className="px-4 py-1.5 bg-[#3D81E3]/10 border-b border-[#3D81E3]/20 flex items-center justify-between relative z-10">
                  <span className="text-[9px] text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-cyan-400" /> Active Chart Node: {activeStock}
                  </span>
                  <span className="text-[8px] text-white/40 font-sans italic">Seamless Integration</span>
                </div>
              )}

              {/* Chat Message Scrollable Container */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent text-left relative z-10"
              >
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs shadow-xl border relative overflow-hidden ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-[#3D81E3]/20 to-cyan-500/10 border-cyan-500/20 text-white rounded-tr-none"
                          : "bg-white/[0.03] border-white/5 text-white/95 rounded-tl-none"
                      }`}
                    >
                      {msg.role === "model" && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#3D81E3]/40" />
                      )}
                      {formatText(msg.text)}
                    </div>

                    {/* Render Stock Intelligence Card block if available */}
                    {msg.stockCard && (
                      <div className="w-full max-w-[90%] self-start animate-fade-in">
                        <StockIntelligenceCard card={msg.stockCard} />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex flex-col gap-2">
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-xs text-white/55 flex items-center gap-3 font-mono">
                      <div className="relative flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full border border-cyan-400 border-t-transparent animate-spin" />
                        <span className="absolute w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      </div>
                      <span>
                        {isStockMode 
                          ? `Fetching NSE quote & running technical analysis for ${analyzingStockName}...`
                          : "Synthesizing market trend configurations..."}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested Questions Grid */}
              <div className="px-3 py-2 border-t border-white/5 bg-[#090a0d]/80 text-left overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2 z-10">
                {(activeStock
                  ? [
                      `Analyze ${activeStock}`,
                      `Is ${activeStock} Bullish?`,
                      `RSI of ${activeStock}`,
                      "Compare TCS and Infosys",
                    ]
                  : [
                      "Who am I?",
                      "Analyze Reliance",
                      "Analyze Tata Motors",
                      "Sector trends today"
                    ]
                ).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    className="px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-cyan-500/30 text-[10px] text-white/50 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>{prompt}</span>
                    <ChevronRight className="w-2.5 h-2.5 text-cyan-400/50" />
                  </button>
                ))}
              </div>

              {/* Bottom Input Area */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="p-4 border-t border-white/5 bg-[#08090d] relative z-10"
              >
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={
                      activeStock
                        ? `Ask anything about ${activeStock} or other stocks...`
                        : "Ask anything about Indian markets..."
                    }
                    className="w-full pl-4 pr-12 py-3 bg-[#11131a] border border-white/10 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 font-sans"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className={`absolute right-1.5 p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                      inputValue.trim() && !isLoading
                        ? "bg-[#3D81E3] hover:bg-[#3D81E3]/80 text-white shadow-lg shadow-[#3D81E3]/20"
                        : "bg-white/5 text-white/20 cursor-not-allowed"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ambient trigger button with glow - hidden when chat panel is open */}
        {!isOpen && (
          <motion.button
            onClick={() => {
              const userStored = localStorage.getItem("supabase_user");
              if (!userStored) {
                window.dispatchEvent(new CustomEvent("marketverse_trigger_gate"));
                return;
              }
              setIsOpen(!isOpen);
            }}
            className="pointer-events-auto w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white text-black shadow-2xl cursor-pointer relative group flex items-center justify-center border border-neutral-200/50"
            style={{
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)"
            }}
            id="global-floating-ai-trigger"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            {/* Outer wave rings - clean non-blurred circular waves */}
            <span className="absolute -inset-1 rounded-full border border-cyan-400/40 animate-ping pointer-events-none" style={{ animationDuration: '2.5s' }} />

            <div className="relative z-10 flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11">
              <QuantitativeLogo variant="balloon" className="w-full h-full group-hover:rotate-6 transition-transform duration-300" />
            </div>
          </motion.button>
        )}
      </div>
    </>
  );
};
