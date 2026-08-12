import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  CheckCircle2, 
  Layers 
} from "lucide-react";

interface HoldingItem {
  symbol: string;
  name: string;
  shares: number;
  avgBuyPrice: number;
  currentPrice: number;
  percentChange: number;
  change: number;
  costValue: number;
  currentValue: number;
  profitLoss: number;
  profitLossPct: number;
  bullishPct: number;
  riskLevel: string;
  aiSummary: string;
}

interface PortfolioStockCardProps {
  holding: HoldingItem;
}

// Mini dynamic trend wave renderer
const MiniSparkline = ({ symbol, gain }: { symbol: string; gain: boolean }) => {
  const points = [];
  const hash = symbol.charCodeAt(0) + (symbol.charCodeAt(1) || 0) + symbol.length;
  const baseVal = 22;
  
  for (let i = 0; i < 8; i++) {
    const y = baseVal + Math.sin(hash + i) * 11 + Math.cos(hash * i * 0.5) * 6;
    points.push(`${i * 15},${y}`);
  }
  
  return (
    <svg className="w-24 h-11 overflow-visible" viewBox="0 0 110 40">
      <path
        d={`M ${points.join(" L ")}`}
        fill="none"
        stroke={gain ? "#10b981" : "#f43f5e"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M ${points.join(" L ")}`}
        fill="none"
        stroke={gain ? "#10b981" : "#f43f5e"}
        strokeWidth="5"
        strokeOpacity="0.12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const PortfolioStockCard: React.FC<PortfolioStockCardProps> = ({ holding }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isProfitable = holding.profitLoss >= 0;

  // Premium Status Badging system
  const getBadgeConfig = (bullishPct: number, riskLevel: string) => {
    if (bullishPct >= 78) {
      return {
        label: "Strong Buy Signal",
        glowClass: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)]",
        dot: "bg-emerald-400"
      };
    }
    if (bullishPct >= 62) {
      return {
        label: "Bullish Outlook",
        glowClass: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.12)]",
        dot: "bg-cyan-400"
      };
    }
    if (riskLevel.toUpperCase() === "HIGH") {
      return {
        label: "High Volatility",
        glowClass: "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.12)]",
        dot: "bg-rose-400"
      };
    }
    return {
      label: "Hold Position",
      glowClass: "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.12)]",
      dot: "bg-amber-400"
    };
  };

  const badge = getBadgeConfig(holding.bullishPct, holding.riskLevel);

  return (
    <motion.div
      layout="position"
      whileHover={{ y: -3, borderColor: "rgba(34,211,238,0.2)" }}
      className="liquid-glass border border-white/5 bg-[#0a0e16]/40 rounded-2xl p-5 text-left relative overflow-hidden transition-colors cursor-pointer group shadow-xl"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />
      
      {/* Dynamic Background glow on Hover */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/[0.01] rounded-full blur-2xl group-hover:bg-cyan-500/[0.03] transition-all duration-500 pointer-events-none" />

      {/* Header Row: Name / Symbol and Badge */}
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <h4 className="font-bold text-white font-sans text-xs sm:text-sm tracking-tight truncate leading-tight group-hover:text-cyan-300 transition-colors">
            {holding.name}
          </h4>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-black">
            {holding.symbol}
          </span>
        </div>

        {/* Soft Glowing Badge */}
        <span className={`text-[8.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 shrink-0 ${badge.glowClass}`}>
          <span className={`w-1 h-1 rounded-full ${badge.dot} animate-pulse`} />
          <span>{badge.label}</span>
        </span>
      </div>

      {/* Primary Financial Sizing parameters */}
      <div className="grid grid-cols-2 gap-y-3.5 text-xs font-mono border-t border-b border-white/5 py-4 my-4">
        {/* Cost Basis Sizing */}
        <div>
          <span className="text-white/30 block text-[8px] uppercase tracking-wider mb-0.5">Asset Allocation</span>
          <div className="space-y-0.5">
            <span className="text-white font-bold block text-xs sm:text-sm">
              ₹{holding.currentValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[9.5px] text-white/45 block">
              {holding.shares} shares @ ₹{holding.avgBuyPrice}
            </span>
          </div>
        </div>

        {/* Current Price and change */}
        <div className="text-right flex flex-col justify-between">
          <div>
            <span className="text-white/30 block text-[8px] uppercase tracking-wider mb-0.5">Live Valuation</span>
            <span className="text-white font-bold block text-xs sm:text-sm">
              ₹{holding.currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 1 })}
            </span>
          </div>
          <span className={`text-[9.5px] font-bold flex items-center gap-0.5 justify-end ${holding.percentChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {holding.percentChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{holding.percentChange >= 0 ? "+" : ""}{holding.percentChange.toFixed(2)}%</span>
          </span>
        </div>
      </div>

      {/* Sizing Performance Metric Sparkline and return */}
      <div className="flex justify-between items-center gap-3">
        <div>
          <span className="text-white/30 block text-[8px] uppercase tracking-wider mb-1 font-mono">Profit & Loss</span>
          <span className={`font-mono font-black text-[13px] sm:text-[14px] leading-tight block ${isProfitable ? "text-emerald-400" : "text-rose-400"}`}>
            {isProfitable ? "+" : ""}₹{holding.profitLoss.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
          </span>
          <span className={`text-[10px] font-mono font-bold block ${isProfitable ? "text-emerald-400/80" : "text-rose-400/80"}`}>
            {isProfitable ? "+" : ""}{holding.profitLossPct.toFixed(1)}% ROI
          </span>
        </div>

        {/* Sparkline Drawing */}
        <div className="opacity-80 group-hover:opacity-100 transition-opacity">
          <MiniSparkline symbol={holding.symbol} gain={isProfitable} />
        </div>
      </div>

      {/* Animated Expand Box: AI Technical report */}
      <div className="overflow-hidden">
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 14 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="border-t border-white/5 pt-3.5 space-y-2.5 text-left"
            >
              <div className="flex items-center gap-1.5 text-cyan-400/95 font-mono text-[9px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>NOVA Intelligence Core</span>
              </div>
              <p className="text-[10.5px] text-white/70 leading-relaxed font-sans pl-1 border-l border-cyan-500/25 italic">
                "{holding.aiSummary}"
              </p>
              
              <div className="flex items-center justify-between text-[9px] font-mono text-white/35 pt-1">
                <span>Volatility: <strong>{holding.riskLevel}</strong></span>
                <span>Bullish Strength: <strong className="text-cyan-400">{holding.bullishPct}%</strong></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Small Expand indicator footer */}
      <div className="flex items-center justify-center text-[8.5px] font-mono text-white/20 group-hover:text-cyan-400/50 mt-3.5 border-t border-white/[0.02] pt-2">
        <span className="mr-1 uppercase tracking-widest">{isExpanded ? "Collapse Audit" : "Expand Technical Audit"}</span>
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </div>

    </motion.div>
  );
}
