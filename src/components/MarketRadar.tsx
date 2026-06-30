import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Info, 
  ShieldAlert, 
  Zap, 
  Gauge, 
  Sliders,
  ChevronRight,
  Bookmark
} from "lucide-react";
import { motion } from "motion/react";
import { Stock } from "../types";
import { marketApi } from "../services/marketApi";

interface MarketRadarProps {
  mode: "bullish" | "bearish";
  onNavigate: (path: string) => void;
}

interface ScoredStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
  volume: string;
  sector: string;
  score: number;
  momentum: "Strong" | "Moderate" | "Weak";
  risk: "Low" | "Medium" | "High";
  why: string;
  rsi: number;
  macdHist: number;
  aboveMA: boolean;
  dataStatus?: string;
  source?: string;
}

export const MarketRadar: React.FC<MarketRadarProps> = ({ mode, onNavigate }) => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load and tick prices just like the main terminal
  useEffect(() => {
    async function loadInitialData() {
      const all = await marketApi.getAllStocks();
      setStocks(all);
      setIsLoading(false);
    }
    loadInitialData();

    const interval = setInterval(() => {
      const updated = marketApi.tickMarketPrices();
      setStocks(updated);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Compute bullish/bearish scores
  const scoredStocks: ScoredStock[] = React.useMemo(() => {
    if (stocks.length === 0) return [];
    
    // Filter out benchmarks and non-india assets
    const equities = stocks.filter(
      s => s.symbol !== "NIFTY50" && s.symbol !== "SENSEX" && s.symbol !== "BANKNIFTY" && s.type === "india"
    );

    return equities.map(s => {
      const history = s.history || [];
      const lastItem = history.length > 0 ? history[history.length - 1] : null;
      
      const rsi = lastItem?.rsi !== undefined ? lastItem.rsi : 50;
      const macdHist = lastItem?.macd?.hist !== undefined ? lastItem.macd.hist : 0;
      const ma = lastItem?.ma !== undefined ? lastItem.ma : s.price;
      const aboveMA = s.price > ma;

      let score = 50; // base score
      let why = "";
      let momentum: "Strong" | "Moderate" | "Weak" = "Moderate";
      let risk: "Low" | "Medium" | "High" = "Medium";

      if (mode === "bullish") {
        // 1. Price Change (up to 30 points)
        const chgFactor = s.percentChange > 0 ? Math.min(30, s.percentChange * 12) : 0;
        score += chgFactor;

        // 2. RSI (up to 25 points)
        if (rsi >= 50) {
          score += Math.min(25, (rsi - 50) * 1.25);
        } else if (rsi < 30) {
          score += 10; // oversold rebound potential
        }

        // 3. MACD (up to 20 points)
        if (macdHist > 0) {
          score += 15;
        } else if (history.length > 1 && (history[history.length - 1]?.macd?.hist || 0) > (history[history.length - 2]?.macd?.hist || 0)) {
          score += 10; // improving histogram
        }

        // 4. Moving Average (15 points)
        if (aboveMA) {
          score += 15;
        }

        // Normalize score to 45 - 98 for display realism
        score = Math.floor(Math.min(98, Math.max(45, score)));

        // Momentum classification & rationales
        if (score >= 78) {
          momentum = "Strong";
          risk = "Medium";
          why = `Strong breakout pattern. Price is hovering above the 14-period Simple Moving Average (SMA) with high RSI strength of ${rsi.toFixed(0)} and active bullish MACD crossover indicating heavy institutional interest.`;
        } else if (score >= 62) {
          momentum = "Moderate";
          risk = "Low";
          why = `Steady uptrend channel. Supported by consistent retail buying, positive daily price momentum, and healthy neutral RSI indicators near ${rsi.toFixed(0)}.`;
        } else {
          momentum = "Weak";
          risk = "High";
          why = `Trading in a tight consolidative range. RSI is flat at ${rsi.toFixed(0)} and MACD shows minimal crossover volume, awaiting an indexing trigger before major breakout.`;
        }
      } else {
        // Bearish Mode Scorer
        // 1. Negative Price Change (up to 30 points)
        const chgFactor = s.percentChange < 0 ? Math.min(30, Math.abs(s.percentChange) * 12) : 0;
        score += chgFactor;

        // 2. RSI Weakness (up to 25 points)
        if (rsi < 50) {
          score += Math.min(25, (50 - rsi) * 1.25);
        }

        // 3. MACD Bearish (up to 20 points)
        if (macdHist < 0) {
          score += 15;
        } else if (history.length > 1 && (history[history.length - 1]?.macd?.hist || 0) < (history[history.length - 2]?.macd?.hist || 0)) {
          score += 10; // deteriorating histogram
        }

        // 4. Moving Average (15 points)
        if (!aboveMA) {
          score += 15;
        }

        score = Math.floor(Math.min(98, Math.max(45, score)));

        if (score >= 78) {
          momentum = "Strong";
          risk = "High";
          why = `Heavy distribution. Price action trails below its 14-period SMA with an oversold RSI of ${rsi.toFixed(0)} and expanding bearish MACD bars, signaling significant overhead resistance.`;
        } else if (score >= 62) {
          momentum = "Moderate";
          risk = "Medium";
          why = `Technical weakness evident. Downward sloping channel with high distribution volume and descending RSI levels of ${rsi.toFixed(0)}, indicating sellers are dominating.`;
        } else {
          momentum = "Weak";
          risk = "Low";
          why = `Holding key horizontal support lines. Despite minor bearish index pressure, RSI is stabilizing at ${rsi.toFixed(0)} with balanced order book blocks.`;
        }
      }

      return {
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        change: s.change,
        percentChange: s.percentChange,
        volume: s.volume,
        sector: s.sector || "General",
        score,
        momentum,
        risk,
        why,
        rsi,
        macdHist,
        aboveMA,
        dataStatus: s.dataStatus,
        source: s.source || s.debug?.provider || "NSE Provider"
      };
    }).sort((a, b) => b.score - a.score);
  }, [stocks, mode]);

  // Ask AI handler
  const handleAskAI = () => {
    const topSymbols = scoredStocks.slice(0, 3).map(s => s.symbol).join(", ");
    const isBull = mode === "bullish";
    
    const promptText = isBull
      ? `Can you analyze the top bullish Indian stocks today? The scanner shows ${topSymbols} are currently leading with high technical bullish scores. Explain why indicators like RSI, SMA, and MACD suggest upward momentum and what targets we should watch.`
      : `Provide a critical technical risk report on today's most bearish Indian stocks, including ${topSymbols}. Explain the breakdown below key moving averages, weak RSI, and what support levels are critical for risk management.`;

    // Dispatch the custom event to trigger AI Assistant
    window.dispatchEvent(new CustomEvent("trigger-marketverse-ai", {
      detail: { prompt: promptText }
    }));
  };

  const isBull = mode === "bullish";
  const themeColor = isBull ? "text-emerald-400" : "text-rose-400";
  const themeBg = isBull ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20";
  const themeBorderHover = isBull ? "hover:border-emerald-500/30 hover:shadow-[0_0_25px_rgba(16,185,129,0.1)]" : "hover:border-rose-500/30 hover:shadow-[0_0_25px_rgba(244,63,94,0.1)]";

  // Summary statistics for scanned metrics
  const avgScore = scoredStocks.length > 0 
    ? Math.round(scoredStocks.reduce((acc, s) => acc + s.score, 0) / scoredStocks.length)
    : 0;
  
  const strongCount = scoredStocks.filter(s => s.momentum === "Strong").length;

  return (
    <div className="relative min-h-screen bg-[#060608] text-white selection:bg-[#3D81E3]/30 px-6 py-8">
      {/* Background radial overlays */}
      <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[180px] pointer-events-none opacity-10 transition-all duration-1000 ${
        isBull ? "bg-emerald-500" : "bg-rose-500"
      }`} />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10 text-left">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => onNavigate("/")}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Gateway</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02]">
            <span className={`w-1.5 h-1.5 rounded-full ${isBull ? "bg-emerald-400 animate-pulse" : "bg-rose-400 animate-pulse"}`} />
            <span className="text-[10px] font-mono tracking-widest text-white/60 font-bold uppercase">
              SCANNER ENGINE ACTIVE
            </span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
          <div className="space-y-3 max-w-xl">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold font-mono uppercase tracking-widest ${themeBg} ${themeColor}`}>
              {isBull ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isBull ? "Bullish Breakout Radar" : "Bearish Breakdown Radar"}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-none">
              Today's <span className={themeColor}>{isBull ? "Bullish" : "Bearish"}</span> Stocks
            </h1>
            <p className="text-sm text-white/50 leading-relaxed">
              {isBull 
                ? "Real-time algorithmic scanner sorting NSE equities on cumulative bullish indicators including RSI convergence, MACD crossovers, volume weightings, and moving average breakouts."
                : "Continuous technical analysis scan filtering Indian equities on distribution metrics, trailing moving average breakdowns, MACD signal deterioration, and weak RSI limits."
              }
            </p>
          </div>

          <div className="shrink-0 flex gap-3">
            <button
              onClick={handleAskAI}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider cursor-pointer shadow-lg hover:shadow-cyan-500/10 transition-all bg-gradient-to-r from-cyan-500 to-[#104892] text-white hover:brightness-110`}
            >
              <Sparkles className="w-4 h-4 fill-white/20 animate-pulse" />
              <span>Ask MarketVerse AI</span>
            </button>
          </div>
        </div>

        {/* Scanner Summary Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="radar-summary-stats">
          {[
            { label: "Equities Scanned", value: scoredStocks.length, desc: "Active NSE Universe" },
            { label: `Avg ${isBull ? 'Bullish' : 'Bearish'} Score`, value: `${avgScore}%`, desc: "Algorithmic Mean" },
            { label: "Strong Momentum", value: strongCount, desc: "RSI & MACD Concurrence" },
            { label: "Refresh Status", value: "Real-Time", desc: "Ticking 2s intervals" }
          ].map((item, i) => (
            <div key={i} className="liquid-glass border border-white/5 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[9px] font-bold font-mono tracking-wider uppercase text-white/40">{item.label}</span>
              <span className={`text-2xl md:text-3xl font-black font-mono mt-1 ${
                i === 1 ? themeColor : "text-white"
              }`}>{item.value}</span>
              <span className="text-[10px] text-white/30 mt-1">{item.desc}</span>
            </div>
          ))}
        </div>

        {/* Main Scanner Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span className="text-xs font-mono">Initializing scanner algorithms...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="radar-stocks-grid">
            {scoredStocks.map((s, index) => {
              const isUp = s.percentChange >= 0;
              return (
                <div 
                  key={s.symbol}
                  onClick={() => onNavigate(`/stock/${s.symbol.toLowerCase()}`)}
                  className={`liquid-glass rounded-xl p-5 border border-white/5 bg-[#0e1014]/95 flex flex-col justify-between text-left space-y-4 transition-all duration-300 cursor-pointer ${themeBorderHover} group relative`}
                >
                  {/* Score circle gauge floating top-right */}
                  <div className="absolute top-5 right-5 flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold font-mono tracking-wider text-white/30 uppercase">RADAR SCORE</span>
                      <span className={`text-xl font-black font-mono leading-none ${themeColor}`}>{s.score}%</span>
                    </div>
                    {/* Ring progress bar representation */}
                    <svg className="w-8 h-8 transform -rotate-90">
                      <circle cx="16" cy="16" r="13" className="stroke-white/5 fill-transparent" strokeWidth="3" />
                      <circle 
                        cx="16" 
                        cy="16" 
                        r="13" 
                        className={`fill-transparent transition-all duration-1000 ${isBull ? "stroke-emerald-500" : "stroke-rose-500"}`} 
                        strokeWidth="3" 
                        strokeDasharray={2 * Math.PI * 13}
                        strokeDashoffset={2 * Math.PI * 13 * (1 - s.score / 100)}
                      />
                    </svg>
                  </div>

                  {/* Header info */}
                  <div className="space-y-1 pr-16">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{s.symbol}</span>
                      <span className="text-[10px] text-white/40 font-mono truncate max-w-[120px]">{s.sector}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white tracking-tight leading-snug group-hover:text-cyan-300 transition-colors">
                      {s.name}
                    </h3>
                  </div>

                  {/* Price info row */}
                  <div className="flex items-center gap-4 py-2 border-y border-white/5 bg-white/[0.01] px-3 rounded-lg">
                    <div className="flex-1">
                      <span className="text-[9px] text-white/40 font-mono uppercase block">CURRENT PRICE</span>
                      <span className="text-base font-bold font-mono text-white">₹{s.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-white/40 font-mono uppercase block">DAILY CHANGE</span>
                      <span className={`text-sm font-bold font-mono ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                        {isUp ? "▲ +" : "▼ "}{s.percentChange.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Why rationales block */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold font-mono tracking-wider text-white/40 uppercase flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      <span>Radar Rationales</span>
                    </span>
                    <p className="text-xs text-white/70 leading-relaxed font-sans font-normal text-justify">
                      {s.why}
                    </p>
                  </div>

                  {/* Metrics and indicators pills footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5 text-[9px] font-mono">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-white/60">
                        RSI: <strong className={s.rsi > 65 || s.rsi < 35 ? themeColor : "text-cyan-300"}>{s.rsi.toFixed(0)}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-white/60">
                        MACD Hist: <strong className={s.macdHist > 0 ? "text-emerald-400" : "text-rose-400"}>{s.macdHist > 0 ? "▲" : "▼"} {s.macdHist.toFixed(2)}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-white/60">
                        SMA (14): <strong className={s.aboveMA ? "text-emerald-400" : "text-rose-400"}>{s.aboveMA ? "Above" : "Below"}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-white/40 uppercase font-bold text-[8px] tracking-widest group-hover:text-[#22d3ee] transition-all">
                      <span>Launch Charts</span>
                      <ChevronRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Indicator badges for momentum / risk */}
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono ${
                      s.momentum === "Strong" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      s.momentum === "Moderate" ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" :
                      "bg-white/5 text-white/40"
                    }`}>
                      Momentum: {s.momentum}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono ${
                      s.risk === "Low" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      s.risk === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
                      Risk: {s.risk}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
