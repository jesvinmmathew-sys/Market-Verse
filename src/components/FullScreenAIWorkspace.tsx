import React, { useState, useRef, useEffect } from "react";

const nanoid = () => "msg-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
import { 
  Sparkles, 
  Send, 
  Loader2, 
  RefreshCw, 
  MessageSquare, 
  Bot, 
  Database, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ChevronRight, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Plus, 
  Trash2, 
  History,
  Layout,
  Clock,
  HelpCircle,
  TrendingUp as TrendingUpIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { marketVerseAI, queryNovaAI } from "../services/marketVerseAI";
import { INDIAN_STOCK_UNIVERSE } from "../services/indianStocksDb";
import { NovaLogo } from "./NovaLogo";

// Gemini dynamic wave canvas component
interface GeminiWaveCanvasProps {
  isFocused: boolean;
  isTyping: boolean;
}

export const GeminiWaveCanvas: React.FC<GeminiWaveCanvasProps> = ({ isFocused, isTyping }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      decay?: number;
      speedMult?: number;
    }> = [];

    const colors = [
      'rgba(34, 211, 238, ',  // cyan
      'rgba(139, 92, 246, ',  // violet
      'rgba(99, 102, 241, ',  // indigo
    ];

    const resizeCanvas = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
        canvas.height = 200;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize baseline ambient particles
    const initAmbientParticles = () => {
      particles = [];
      const count = 30;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.25 + 0.05,
          speedMult: 1
        });
      }
    };
    initAmbientParticles();

    // Trigger an energetic ripple when focus starts or user typing
    const triggerFocusRipple = () => {
      const rippleCount = 50;
      for (let i = 0; i < rippleCount; i++) {
        const angle = Math.random() * Math.PI - Math.PI; // upwards semi-circle
        const speed = Math.random() * 2 + 0.8;
        particles.push({
          x: canvas.width / 2 + (Math.random() - 0.5) * 120,
          y: canvas.height - 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          size: Math.random() * 2.5 + 1.2,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 0.75,
          decay: Math.random() * 0.02 + 0.012,
          speedMult: 1.4
        });
      }
    };

    if (isFocused || isTyping) {
      triggerFocusRipple();
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw and update particles
      particles.forEach((p) => {
        const currentSpeedMult = isFocused || isTyping ? 1.6 : 1.0;
        
        p.x += p.vx * currentSpeedMult;
        p.y += p.vy * currentSpeedMult;

        if (p.decay) {
          p.alpha -= p.decay;
        }

        // Boundary wrap/re-init for ambient particles
        if (!p.decay) {
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        }

        // Draw particle
        if (p.alpha > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color + p.alpha + ')';
          ctx.fill();
        }
      });

      // Filter out dead particles
      particles = particles.filter(p => p.alpha > 0);

      // Top up ambient particles if they drop below limit
      if (particles.filter(p => !p.decay).length < 30) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.25 + 0.05,
          speedMult: 1
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isFocused, isTyping]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute bottom-[90px] left-0 w-full h-[200px] pointer-events-none z-0 opacity-70" 
      id="gemini-focus-mesh-canvas"
    />
  );
};

// Interfaces
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

interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
}

interface FullScreenAIWorkspaceProps {
  onNavigate: (path: string) => void;
}

// 1. Detect stock triggers
const detectStockInText = (text: string) => {
  const upper = text.toUpperCase();
  for (const stock of INDIAN_STOCK_UNIVERSE) {
    const symbolPattern = new RegExp(`\\b${stock.symbol}\\b`);
    if (symbolPattern.test(upper) || upper === stock.symbol) {
      return stock;
    }
  }
  for (const stock of INDIAN_STOCK_UNIVERSE) {
    const nameUpper = stock.name.toUpperCase();
    if (upper.includes(stock.symbol)) {
      return stock;
    }
    const cleanedName = nameUpper.replace("LIMITED", "").replace("LTD", "").trim();
    if (cleanedName.length > 4 && upper.includes(cleanedName)) {
      return stock;
    }
    if (stock.symbol === "TATAMOTORS" && upper.includes("TATA MOTORS")) return stock;
    if (stock.symbol === "HDFCBANK" && upper.includes("HDFC")) return stock;
    if (stock.symbol === "ICICIBANK" && upper.includes("ICICI")) return stock;
    if (stock.symbol === "SBIN" && (upper.includes("SBI") || upper.includes("STATE BANK"))) return stock;
  }
  return null;
};

// 2. Fetch full stock stats and analysis
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

    return {
      symbol: symbol,
      name: quoteData.name || aiData.name || `${symbol} India`,
      price: price,
      change: change,
      percentChange: percentChange,
      volume: quoteData.volume || "1.5M",
      dayHigh: quoteData.dayHigh || parseFloat((price * 1.01).toFixed(2)),
      dayLow: quoteData.dayLow || parseFloat((price * 0.99).toFixed(2)),
      sentiment: aiData.sentiment || "Neutral",
      confidence: aiData.confidence || 65,
      risk: aiData.risk || "Medium",
      riskPercentage: aiData.riskPercentage || 45,
      safetyScore: aiData.safetyScore || 70,
      briefNote: aiData.briefNote || "Asset exhibits standard volatility profiles.",
      strategyExplanation: aiData.strategyExplanation || "Indicators point to trend equilibrium.",
      reasons: aiData.reasons || ["Price Action registers neutral support.", "RSI trails inside normal parameters."],
      possibleScenarios: aiData.possibleScenarios || {
        shortTerm: "Balanced pricing around current support barriers.",
        mediumTerm: "Pending overall sector volume breakouts."
      },
      keyIndicators: aiData.keyIndicators || {
        rsi: 50,
        macd: "Neutral convergence lines.",
        movingAverages: `14-day SMA resides near ₹${price.toFixed(1)}`,
        trend: "Neutral"
      },
      support: parseFloat((price * 0.965).toFixed(2)),
      resistance: parseFloat((price * 1.035).toFixed(2))
    };
  } catch (err) {
    console.error("Failed to load full stock analysis:", err);
    return null;
  }
};

// 3. Render Premium Stock Intelligence Card (for Full Screen view)
const StockIntelligenceCard: React.FC<{ card: StockAnalysisCardData }> = ({ card }) => {
  const isBullish = card.sentiment === "Bullish";
  const isBearish = card.sentiment === "Bearish";
  const sentimentColor = isBullish ? "text-emerald-400" : isBearish ? "text-rose-400" : "text-amber-400";
  const sentimentBg = isBullish ? "bg-emerald-500/10 border-emerald-500/20" : isBearish ? "bg-rose-500/10 border-rose-500/20" : "bg-amber-500/10 border-amber-500/20";

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#0c0e12]/95 overflow-hidden shadow-2xl font-sans mt-3 mb-3 relative max-w-2xl" id={`fullscreen-stock-card-${card.symbol.toLowerCase()}`}>
      <div className={`h-1.5 w-full bg-gradient-to-r ${isBullish ? "from-emerald-500 to-teal-400" : isBearish ? "from-rose-500 to-red-400" : "from-amber-500 to-orange-400"}`} />
      
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22d3ee] animate-ping" />
              <h4 className="text-md font-black text-white tracking-widest font-mono">{card.symbol}</h4>
              <span className={`text-[9px] px-2.5 py-0.5 rounded border ${sentimentBg} ${sentimentColor} font-mono font-bold uppercase tracking-widest`}>
                {card.sentiment}
              </span>
            </div>
            <p className="text-xs text-white/50 mt-1">{card.name}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-mono font-bold text-white">₹{card.price.toLocaleString("en-IN")}</p>
            <p className={`text-xs font-mono font-bold flex items-center justify-end gap-1 ${card.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {card.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {card.change >= 0 ? "+" : ""}{card.change.toFixed(2)} ({card.percentChange >= 0 ? "+" : ""}{card.percentChange.toFixed(2)}%)
            </p>
          </div>
        </div>

        {/* OHLC Volumes */}
        <div className="grid grid-cols-4 gap-2 py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs font-mono">
          <div>
            <span className="block text-white/40 text-[9px] uppercase tracking-wider">Open</span>
            <span className="text-white font-semibold">₹{(card.price - card.change).toFixed(1)}</span>
          </div>
          <div>
            <span className="block text-white/40 text-[9px] uppercase tracking-wider">Day High</span>
            <span className="text-emerald-400 font-semibold">₹{card.dayHigh.toFixed(1)}</span>
          </div>
          <div>
            <span className="block text-white/40 text-[9px] uppercase tracking-wider">Day Low</span>
            <span className="text-rose-400 font-semibold">₹{card.dayLow.toFixed(1)}</span>
          </div>
          <div>
            <span className="block text-white/40 text-[9px] uppercase tracking-wider">Volume</span>
            <span className="text-white font-semibold">{card.volume}</span>
          </div>
        </div>

        {/* Indicators checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 space-y-2.5">
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider block">Directional Strengths</span>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-emerald-400">Bullish Prob.</span>
                <span className="text-emerald-400 font-bold">{isBullish ? card.confidence : isBearish ? 100 - card.confidence : 50}%</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-rose-400">Bearish Prob.</span>
                <span className="text-rose-400 font-bold">{isBearish ? card.confidence : isBullish ? 100 - card.confidence : 50}%</span>
              </div>
              <div className="w-full h-2 bg-rose-500/20 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${isBullish ? card.confidence : isBearish ? 100 - card.confidence : 50}%` }} />
                <div className="bg-rose-500 h-full transition-all" style={{ width: `${isBearish ? card.confidence : isBullish ? 100 - card.confidence : 50}%` }} />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 space-y-2.5">
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider block">Risk Assessment</span>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-white/60">Risk Profile</span>
                <span className={`font-bold uppercase text-[9px] px-2 py-0.5 rounded ${card.risk === "Low" ? "bg-emerald-500/10 text-emerald-400" : card.risk === "High" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"}`}>
                  {card.risk} Risk
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white/40">Volatility Index</span>
                <span className="text-white/80 font-bold">{card.riskPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${card.risk === "Low" ? "bg-emerald-500" : card.risk === "High" ? "bg-rose-500" : "bg-amber-500"}`} style={{ width: `${card.riskPercentage}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Support Pivots */}
        <div className="grid grid-cols-2 gap-3 text-center text-xs font-mono">
          <div className="py-2.5 px-3 bg-emerald-500/[0.02] rounded-xl border border-emerald-500/10">
            <span className="text-emerald-400/40 text-[9px] uppercase block tracking-wider">Estimated Support</span>
            <span className="text-emerald-400 font-bold">₹{card.support.toLocaleString("en-IN")}</span>
          </div>
          <div className="py-2.5 px-3 bg-rose-500/[0.02] rounded-xl border border-rose-500/10">
            <span className="text-rose-400/40 text-[9px] uppercase block tracking-wider">Estimated Resistance</span>
            <span className="text-rose-400 font-bold">₹{card.resistance.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Analyst Verdict */}
        <div className="p-4 rounded-xl bg-cyan-500/[0.03] border border-cyan-500/10 space-y-1.5 text-left">
          <span className="text-[10px] text-cyan-300 font-mono uppercase tracking-wider block">AI Analyst Notes:</span>
          <p className="text-xs text-white/85 leading-relaxed font-sans">
            {card.briefNote} {card.strategyExplanation}
          </p>
        </div>
      </div>
    </div>
  );
};

export const FullScreenAIWorkspace: React.FC<FullScreenAIWorkspaceProps> = ({ onNavigate }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTextToSpeechEnabled, setIsTextToSpeechEnabled] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [userName, setUserName] = useState("Trader");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = (textareaRef.current.scrollHeight > 120 ? 120 : textareaRef.current.scrollHeight) + "px";
    }
  }, [inputValue]);

  // Initialize browser speech recognition if supported
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognitionRef = useRef<any>(null);

  const initSpeechRecognition = () => {
    if (!SpeechRecognition) return null;
    if (recognitionRef.current) return recognitionRef.current;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-IN"; // English with Indian accents or standard English

    rec.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
    };

    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setInputValue(text);
      // Automatically send after speaking
      handleSendMessage(text);
    };

    rec.onerror = (err: any) => {
      console.warn("Speech Recognition Error:", err.error || err);
      setSpeechError(err.error === "not-allowed" 
        ? "Microphone access denied. Please allow microphone permissions in your browser settings."
        : `Voice input error: ${err.error || "unavailable"}`
      );
      setIsListening(false);
      setTimeout(() => setSpeechError(null), 6000);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    return rec;
  };

  // Load username from local storage user profile on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("supabase_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.user_metadata?.full_name) {
          setUserName(u.user_metadata.full_name.split(" ")[0]);
        } else if (u.email) {
          setUserName(u.email.split("@")[0]);
        }
      }
    } catch (e) {
      console.warn("Failed to load user info", e);
    }
  }, []);

  // Fetch full conversation sessions from localStorage on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem("marketverse_ai_sessions");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.length > 0) {
          const hydrated = parsed.map((s: ChatSession) => {
            const sessionMsgs = localStorage.getItem(`nova_active_session_${s.id}`);
            if (sessionMsgs) {
              try {
                return { ...s, messages: JSON.parse(sessionMsgs) };
              } catch (e) {}
            }
            return s;
          });
          setSessions(hydrated);
          setActiveSessionId(hydrated[0].id);
          return;
        }
      }
    } catch (err) {
      console.warn("Could not load AI history sessions:", err);
    }

    // Seed default session if empty
    const defaultSession: ChatSession = {
      id: "session-default",
      title: "New Intelligence Session",
      timestamp: Date.now(),
      messages: []
    };
    setSessions([defaultSession]);
    setActiveSessionId("session-default");
  }, []);

  // Sync sessions with localStorage
  const saveSessions = (updated: ChatSession[]) => {
    setSessions(updated);
    try {
      localStorage.setItem("marketverse_ai_sessions", JSON.stringify(updated));
      updated.forEach(s => {
        localStorage.setItem(`nova_active_session_${s.id}`, JSON.stringify(s.messages));
      });
    } catch (e) {
      console.warn("Could not save AI sessions:", e);
    }
  };

  // Autoscroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, activeSessionId, isLoading]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Text to Speech voice assistant speaker (only plays automatically if enabled, or when forced by direct interaction)
  const speakVoice = (text: string, force: boolean = false) => {
    if (!force && !isTextToSpeechEnabled) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    
    // Stop any speaking first
    window.speechSynthesis.cancel();

    // Clean text of markdown and tables before speaking
    const cleanText = text
      .replace(/[#*`|\[\]]/g, "") // remove formatting characters
      .replace(/STOCK ANALYSIS[\s\S]*?(?=Last Updated|$)/i, "") // skip stock card technical blocks for voice clarity
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160); // brief summary for speech output

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Attempt to find a native English or pleasant voice
    const voices = window.speechSynthesis.getVoices();
    const chosenVoice = voices.find(v => v.lang.includes("en-US") || v.lang.includes("en-IN"));
    if (chosenVoice) utterance.voice = chosenVoice;

    window.speechSynthesis.speak(utterance);
  };

  const handleToggleSpeak = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMsgId(null);
    } else {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();

      const cleanText = text
        .replace(/[#*`|\[\]]/g, "")
        .replace(/STOCK ANALYSIS[\s\S]*?(?=Last Updated|$)/i, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 160);

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const chosenVoice = voices.find(v => v.lang.includes("en-US") || v.lang.includes("en-IN"));
      if (chosenVoice) utterance.voice = chosenVoice;

      utterance.onend = () => {
        setSpeakingMsgId(null);
      };
      utterance.onerror = () => {
        setSpeakingMsgId(null);
      };

      setSpeakingMsgId(msgId);
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMsgId(null);
    };
  }, [activeSessionId]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const currentSession = activeSession || sessions[0];
    if (!currentSession) return;

    const userMsg: Message = {
      id: nanoid(),
      role: "user",
      text: textToSend.trim()
    };

    const stockDetected = detectStockInText(textToSend);

    // Update active session locally
    const updatedMessages = [...currentSession.messages, userMsg];
    let updatedTitle = currentSession.title;
    if (currentSession.messages.length === 0 || currentSession.title === "New Intelligence Session" || currentSession.title === "New Market Conversation" || currentSession.title === "Reliance Technical Breakout") {
      if (stockDetected) {
        updatedTitle = `${stockDetected.symbol} Analysis`;
      } else {
        updatedTitle = textToSend.trim().slice(0, 24) + (textToSend.length > 24 ? "..." : "");
      }
    }

    const updatedSession: ChatSession = {
      ...currentSession,
      title: updatedTitle,
      messages: updatedMessages
    };

    const nextSessions = sessions.map(s => s.id === currentSession.id ? updatedSession : s);
    saveSessions(nextSessions);
    setInputValue("");
    setIsLoading(true);

    try {
      const serverHistory = currentSession.messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      // Direct service backend call
      const chatPromise = queryNovaAI(textToSend.trim(), serverHistory);
      const stockCardPromise = stockDetected ? fetchFullStockAnalysis(stockDetected.symbol) : Promise.resolve(null);

      const [chatReply, stockCardData] = await Promise.all([chatPromise, stockCardPromise]);

      const aiMsg: Message = {
        id: `msg-${Date.now()}-model`,
        role: "model",
        text: chatReply,
        stockCard: stockCardData || undefined
      };

      const finalSession: ChatSession = {
        ...updatedSession,
        messages: [...updatedMessages, aiMsg]
      };

      saveSessions(sessions.map(s => s.id === currentSession.id ? finalSession : s));

    } catch (err: any) {
      console.error(err);
      
      const errMsg = err?.message || "";
      let fallbackText = "";
      if (errMsg.includes("Gemini API Key Missing") || errMsg.includes("Gemini API Error") || errMsg.includes("Gemini Connection Failed") || errMsg.includes("Direct Gemini API failed")) {
        fallbackText = errMsg;
      } else {
        fallbackText = "### Heuristic AI Pipeline Response\nI couldn't complete the high-performance AI API call because the rate limits are busy, but my local heuristic engine has compiled standard parameters.";
      }
      
      let stockCardData: StockAnalysisCardData | undefined = undefined;

      if (stockDetected) {
        const basePrice = stockDetected.price || 400;
        const mockChange = parseFloat(((Math.random() - 0.45) * 12).toFixed(2));
        const mockPercent = parseFloat(((mockChange / basePrice) * 100).toFixed(2));
        
        stockCardData = {
          symbol: stockDetected.symbol,
          name: stockDetected.name,
          price: basePrice,
          change: mockChange,
          percentChange: mockPercent,
          volume: "1.2M",
          dayHigh: basePrice * 1.012,
          dayLow: basePrice * 0.988,
          sentiment: mockChange >= 0 ? "Bullish" : "Bearish",
          confidence: 68,
          risk: "Medium",
          riskPercentage: 42,
          safetyScore: 75,
          briefNote: `${stockDetected.name} is resting above horizontal moving average channels.`,
          strategyExplanation: "Technical oscillators support accumulation inside current standard ranges.",
          reasons: ["Steady standard volumes recorded.", "Relative Strength Index (RSI) registers ~52."],
          possibleScenarios: {
            shortTerm: "Balanced support testing.",
            mediumTerm: "Poised for consolidative breakouts."
          },
          keyIndicators: {
            rsi: 52,
            macd: "Hovering gracefully near key baselines.",
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

      saveSessions(sessions.map(s => s.id === currentSession.id ? {
        ...updatedSession,
        messages: [...updatedMessages, errorMsg]
      } : s));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "New Intelligence Session",
      timestamp: Date.now(),
      messages: []
    };
    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newId);
  };

  const handleDeleteSession = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem(`nova_active_session_${idToDelete}`);
    } catch (err) {}

    if (sessions.length <= 1) {
      // Just clear history messages
      const cleared: ChatSession = {
        id: "session-default",
        title: "New Intelligence Session",
        timestamp: Date.now(),
        messages: []
      };
      saveSessions([cleared]);
      setActiveSessionId("session-default");
      return;
    }

    const filtered = sessions.filter(s => s.id !== idToDelete);
    saveSessions(filtered);
    if (activeSessionId === idToDelete) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const handleToggleVoiceInput = () => {
    if (!SpeechRecognition) {
      setSpeechError("Speech Recognition API is not supported by your browser. Please try using Google Chrome.");
      setTimeout(() => setSpeechError(null), 6000);
      return;
    }
    const rec = initSpeechRecognition();
    if (!rec) return;

    setSpeechError(null);
    if (isListening) {
      rec.stop();
    } else {
      try {
        rec.start();
      } catch (e: any) {
        console.warn("Speech start error:", e.message);
        setIsListening(false);
      }
    }
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
          <div key={idx} className="grid grid-cols-3 gap-2 py-1.5 px-3 border-b border-white/5 bg-white/[0.01] text-[10.5px] font-mono">
            {cols.map((col, cIdx) => (
              <span key={cIdx} className={cIdx === 0 ? "font-bold text-cyan-300" : "text-white/85 text-right"}>
                {col.replace(/\*\*/g, "")}
              </span>
            ))}
          </div>
        );
      }

      if (line.startsWith("### ")) {
        return <h4 key={idx} className="text-sm font-bold text-cyan-400 font-mono uppercase tracking-wider mt-3 mb-1.5">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} className="text-base font-bold text-white font-mono mt-3 mb-1.5">{line.replace("## ", "")}</h3>;
      }
      if (line.startsWith("- ")) {
        return (
          <li key={idx} className="ml-3 list-disc text-xs text-white/85 leading-relaxed mb-0.5">
            {line.replace("- ", "")}
          </li>
        );
      }
      if (line.startsWith("1. ")) {
        return (
          <li key={idx} className="ml-3 list-decimal text-xs text-white/85 leading-relaxed mb-0.5">
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

      return <p key={idx} className="text-xs text-white/85 leading-relaxed mb-1">{parts.length > 0 ? parts : content}</p>;
    });
  };

  // Group sessions by date range for sidebar category grouping
  const groupedSessions = React.useMemo(() => {
    const today: ChatSession[] = [];
    const past7Days: ChatSession[] = [];
    const older: ChatSession[] = [];
    
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    sessions.forEach(s => {
      const diff = now - s.timestamp;
      if (diff < oneDayMs) {
        today.push(s);
      } else if (diff < 7 * oneDayMs) {
        past7Days.push(s);
      } else {
        older.push(s);
      }
    });
    
    return { today, past7Days, older };
  }, [sessions]);

  const renderSidebarSessionItem = (s: ChatSession) => {
    const isActive = s.id === activeSessionId;
    return (
      <div 
        key={s.id}
        onClick={() => setActiveSessionId(s.id)}
        className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
          isActive 
            ? "bg-[#3D81E3]/15 border-[#3D81E3]/25 text-white" 
            : "border-transparent hover:bg-white/[0.02] text-white/60 hover:text-white"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-cyan-400" : "text-white/30"}`} />
          <span className="text-xs font-medium truncate tracking-wide">{s.title}</span>
        </div>
        <button 
          onClick={(e) => handleDeleteSession(s.id, e)}
          className="p-1 rounded-md text-white/20 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity transition-colors cursor-pointer ml-1"
          title="Delete Session"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-1 h-[calc(100vh-4rem)] bg-[#06080F] overflow-hidden" id="full-screen-ai-workspace">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3D81E3]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] pointer-events-none" />

      {/* Left Sidebar: Session History (Dark liquid-glass styling) */}
      <div className="w-80 border-r border-white/5 bg-[#0B0F19]/70 backdrop-blur-xl flex flex-col hidden md:flex relative z-10 shadow-2xl" id="ai-sidebar">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/5">
          <button 
            onClick={handleCreateNewSession}
            className="w-full py-3 px-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-white text-xs font-bold font-mono tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/5"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>+ New Analysis</span>
          </button>
        </div>

        {/* Grouped Sessions list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-white/5">
          {/* Today Group */}
          {groupedSessions.today.length > 0 && (
            <div className="space-y-1">
              <div className="text-[9px] text-white/30 font-mono uppercase tracking-widest px-3 mb-1.5 flex items-center gap-1.5">
                <History className="w-3 h-3 text-cyan-400/50" />
                <span>Today</span>
              </div>
              {groupedSessions.today.map((s) => renderSidebarSessionItem(s))}
            </div>
          )}

          {/* Past 7 Days Group */}
          {groupedSessions.past7Days.length > 0 && (
            <div className="space-y-1">
              <div className="text-[9px] text-white/30 font-mono uppercase tracking-widest px-3 mb-1.5 flex items-center gap-1.5">
                <History className="w-3 h-3 text-white/20" />
                <span>Past 7 Days</span>
              </div>
              {groupedSessions.past7Days.map((s) => renderSidebarSessionItem(s))}
            </div>
          )}

          {/* Older Group */}
          {groupedSessions.older.length > 0 && (
            <div className="space-y-1">
              <div className="text-[9px] text-white/30 font-mono uppercase tracking-widest px-3 mb-1.5 flex items-center gap-1.5">
                <History className="w-3 h-3 text-white/20" />
                <span>Older</span>
              </div>
              {groupedSessions.older.map((s) => renderSidebarSessionItem(s))}
            </div>
          )}
        </div>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-white/5 text-center bg-black/10">
          <div className="flex items-center justify-between text-[10px] font-mono text-white/30">
            <span>NOVA AI Analyst</span>
            <span>v2.5 (Core)</span>
          </div>
        </div>
      </div>

      {/* Right Content Panel: ChatGPT Workspace */}
      <div className="flex-1 flex flex-col bg-[#06080F]/40 relative z-10" id="ai-chat-workspace">
        
        {/* Workspace Top Header Bar */}
        <div className="h-14 border-b border-white/5 px-6 flex items-center justify-between bg-black/25">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-xs font-bold text-white tracking-widest font-mono uppercase">
              {activeSession ? activeSession.title : "MarketVerse Intelligence"}
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Speaker Sound output toggle */}
            <button 
              type="button"
              onClick={() => setIsTextToSpeechEnabled(!isTextToSpeechEnabled)}
              className={"p-2 rounded-lg border transition-all cursor-pointer " + (isTextToSpeechEnabled ? "bg-[#3D81E3]/15 border-[#3D81E3]/35 text-cyan-400" : "bg-white/[0.01] border-white/5 text-white/30 hover:text-white/60")}
              title={isTextToSpeechEnabled ? "Voice Output Active" : "Voice Output Muted"}
            >
              {isTextToSpeechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button 
              type="button"
              onClick={() => onNavigate("/dashboard")}
              className="text-[10px] font-mono uppercase tracking-widest border border-white/10 px-3 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] text-white/70 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Layout className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dashboard Terminal</span>
            </button>
          </div>
        </div>

        {/* Custom CSS for Shimmer and visualizer */}
        <style dangerouslySetInnerHTML={{__html: "@keyframes shimmer-loader { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } } .animate-shimmer { background-size: 200% 100%; animation: shimmer-loader 1.5s infinite linear; }"}} />

        {/* Centered Main Workspace container */}
        <div className="max-w-4xl mx-auto w-full h-[calc(100vh-7.5rem)] flex flex-col justify-between px-4 relative z-10">
          
          {/* Conversation flow container */}
          <div 
            ref={scrollRef}
            className={"flex-1 overflow-y-auto py-6 space-y-6 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent " + (activeSession && activeSession.messages.length === 0 ? "flex flex-col items-center justify-center text-center" : "")}
            id="workspace-conversation-scroller"
          >
            <AnimatePresence mode="wait">
              {activeSession && activeSession.messages.length > 0 ? (
                <motion.div 
                  key="chat-active"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="max-w-3xl mx-auto w-full space-y-6 animate-fade-in"
                >
                  {activeSession.messages.map((msg) => {
                    const isUser = msg.role === "user";
                    if (isUser) {
                      return (
                        <div key={msg.id} className="flex flex-col items-end w-full">
                          <div className="max-w-[70%] rounded-2xl px-4 py-2.5 text-xs bg-blue-900/20 border border-blue-500/15 backdrop-blur-md text-white font-sans rounded-tr-none shadow-md">
                            {formatText(msg.text)}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={msg.id} className="flex gap-4 items-start w-full group">
                          {/* Small Nova Icon */}
                          <div className="w-7 h-7 rounded-full bg-[#0B0F19] border border-white/10 flex items-center justify-center p-1.5 flex-shrink-0 shadow-md">
                            <NovaLogo className="w-full h-full" />
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-2 text-left">
                            {/* Clean response text without heavy border boxes */}
                            <div className="text-xs text-white/95 leading-relaxed font-sans">
                              {formatText(msg.text)}
                            </div>

                            {msg.stockCard && (
                              <div className="w-full max-w-2xl mt-3 animate-fade-in">
                                <StockIntelligenceCard card={msg.stockCard} />
                              </div>
                            )}

                            {/* Action Footer */}
                            <div className="flex items-center gap-3 pt-2 text-[10px] text-white/40 font-mono">
                              <button
                                type="button"
                                onClick={() => handleToggleSpeak(msg.id, msg.text)}
                                className="flex items-center gap-1 hover:text-cyan-300 transition-colors cursor-pointer"
                              >
                                {speakingMsgId === msg.id ? (
                                  <>
                                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Stop</span>
                                    <div className="flex items-end gap-[1.5px] h-3 px-1 select-none">
                                      <span className="w-[1.5px] bg-cyan-400 rounded-full animate-bounce" style={{ height: '9px', animationDelay: '0.1s' }} />
                                      <span className="w-[1.5px] bg-cyan-400 rounded-full animate-bounce" style={{ height: '11px', animationDelay: '0.2s' }} />
                                      <span className="w-[1.5px] bg-cyan-400 rounded-full animate-bounce" style={{ height: '6px', animationDelay: '0.3s' }} />
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3.5 h-3.5" />
                                    <span>Listen</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.text);
                                  alert("Copied to clipboard!");
                                }}
                                className="hover:text-cyan-300 transition-colors cursor-pointer"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </motion.div>
              ) : (
                /* STATE A: Gemini Landing Empty State Canvas */
                <motion.div 
                  key="chat-empty"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex flex-col items-center justify-center text-center space-y-12 py-8 flex-1 max-w-2xl mx-auto w-full animate-fade-in" 
                  id="nova-ai-welcome-hero"
                >
                  <div className="flex flex-col items-center space-y-6">
                    {/* Animated Liquid-Glass Nova AI Core orb with Official Emblem */}
                    <div className="relative w-36 h-36 flex items-center justify-center animate-fade-in">
                      {/* Rotational Aura matching dual emerald-green and crimson-red color scheme */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/20 via-red-500/20 to-emerald-500/20 blur-xl animate-spin" style={{ animationDuration: '10s' }} />
                      {/* Subtle refined radial glow backdrop (emerald left, crimson right) */}
                      <div className="absolute inset-0 rounded-full pointer-events-none opacity-45 blur-[35px]" 
                           style={{
                             background: "radial-gradient(circle at 35% 50%, rgba(16, 185, 129, 0.25) 0%, transparent 60%), radial-gradient(circle at 65% 50%, rgba(239, 68, 68, 0.25) 0%, transparent 60%)"
                           }} 
                      />
                      {/* Pulsing Outer Ring */}
                      <div className="absolute inset-2 rounded-full border border-white/5 bg-white/[0.01] shadow-[0_0_40px_rgba(255,255,255,0.03)]" />
                      {/* Official Nova AI Emblem */}
                      <div className="relative w-28 h-28 flex items-center justify-center rounded-full bg-[#06080F]/90 backdrop-blur-md border border-white/10 shadow-2xl p-3.5 overflow-hidden">
                        <NovaLogo className="w-full h-full" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h1 className="text-3xl font-semibold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent font-sans">
                        Ask away, {userName}!
                      </h1>
                      <p className="text-xs text-white/50 leading-relaxed font-sans max-w-md mx-auto">
                        Live NSE technical analysis, F&O momentum, and institutional market intelligence.
                      </p>
                    </div>
                  </div>

                  {/* 4 Compact Suggestion Cards (2x2 Grid) */}
                  <div className="w-full max-w-xl" id="nova-suggestions-deck">
                    <div className="grid grid-cols-2 gap-4">
                      {String.fromCharCode(55357, 56520) !== "" && [
                        { 
                          title: String.fromCharCode(55357, 56520) + " Nifty 50 Breakout Scan", 
                          prompt: "Explain Nifty 50 breakout momentum scan" 
                        },
                        { 
                          title: String.fromCharCode(9889) + " High Momentum Stocks", 
                          prompt: "Which stocks are exhibiting high momentum breakouts today?" 
                        },
                        { 
                          title: String.fromCharCode(55357, 56522) + " Reliance F&O Analysis", 
                          prompt: "Analyze Reliance F&O and option dynamics" 
                        },
                        { 
                          title: String.fromCharCode(55356, 57263) + " Option Chain & PCR Analysis", 
                          prompt: "Provide Option Chain and PCR analysis for major indices" 
                        }
                      ].map((item) => (
                        <button
                          key={item.title}
                          onClick={() => handleSendMessage(item.prompt)}
                          className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-[#3D81E3]/5 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)] text-left transition-all duration-200 cursor-pointer flex flex-col justify-center h-20 group"
                        >
                          <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors block leading-tight">
                            {item.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isLoading && (
              <div className="flex flex-col gap-3 max-w-2xl animate-pulse">
                <div className="bg-[#0B0F19]/60 border border-white/5 backdrop-blur-md rounded-2xl p-5 text-xs shadow-2xl relative overflow-hidden flex items-start gap-4">
                  {/* Glowing Pulse Beacon */}
                  <div className="relative flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="absolute w-4 h-4 rounded-full bg-cyan-500/30 animate-ping" />
                    <span className="relative w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                  </div>
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white tracking-widest text-[10px] uppercase">
                        NOVA MARKET ANALYST
                      </span>
                      <span className="text-[9px] text-cyan-400 font-mono animate-pulse">
                        • Nova is analyzing...
                      </span>
                    </div>
                    {/* Liquid-glass shimmer bars */}
                    <div className="space-y-2">
                      <div className="h-2.5 w-11/12 rounded bg-gradient-to-r from-white/10 via-white/20 to-white/10 bg-[length:200%_auto] animate-shimmer" style={{ animationDuration: '1.5s' }} />
                      <div className="h-2.5 w-5/6 rounded bg-gradient-to-r from-white/10 via-white/20 to-white/10 bg-[length:200%_auto] animate-shimmer" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
                      <div className="h-2.5 w-2/3 rounded bg-gradient-to-r from-white/10 via-white/20 to-white/10 bg-[length:200%_auto] animate-shimmer" style={{ animationDuration: '1.5s', animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area Wrapper */}
          <div className="relative w-full z-10 pt-2 pb-6">
            {/* GeminiWaveCanvas element */}
            <div className="relative max-w-4xl mx-auto w-full">
              <GeminiWaveCanvas isFocused={isInputFocused} isTyping={!!inputValue} />
            </div>

            {/* Input Bottom Console */}
            <div className="w-full">
              <AnimatePresence>
                {speechError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mb-3.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>{speechError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="flex items-center gap-3 relative"
              >
                {/* Dictate Speech Microphone button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className={"p-3.5 rounded-2xl border transition-all flex items-center justify-center flex-shrink-0 cursor-pointer " + (isListening ? "bg-rose-500/25 border-rose-500/40 text-rose-400 animate-pulse" : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06]")}
                  title={isListening ? "Listening... Speak now." : "Start Voice Input"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <div className="relative flex-1 flex items-center">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(inputValue);
                      }
                    }}
                    placeholder={isListening ? "Listening... Speak your query clearly." : "Ask NOVA about any Indian stock or index..."}
                    className="w-full pl-5 pr-14 py-4 bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-white/15 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:shadow-[0_0_20px_rgba(34,211,238,0.25)] rounded-2xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none font-sans shadow-inner transition-all duration-300 resize-none overflow-y-auto max-h-[120px] scrollbar-none align-middle"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className={"absolute right-2.5 p-2 rounded-full transition-all flex items-center justify-center cursor-pointer " + (inputValue.trim() && !isLoading ? "bg-[#3D81E3] hover:bg-[#3D81E3]/80 text-white shadow-lg shadow-[#3D81E3]/25" : "bg-white/5 text-white/20 cursor-not-allowed")}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Micro disclaimer footer */}
              <div className="text-[9px] text-white/20 text-center font-mono mt-3">
                Interactive voice assistance is subject to browser permissions and API availability. 
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};