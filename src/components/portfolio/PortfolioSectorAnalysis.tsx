import React from "react";
import { motion } from "motion/react";
import { Layers, Activity, TrendingUp, AlertTriangle } from "lucide-react";

interface SectorItem {
  name: string;
  value: number;
  percentage: number;
}

interface PortfolioSectorAnalysisProps {
  sectorData: SectorItem[];
}

export function PortfolioSectorAnalysis({ sectorData }: PortfolioSectorAnalysisProps) {
  
  // Custom Color Coding based on Sector or Index
  const getSectorStyle = (sectorName: string, idx: number) => {
    const name = sectorName.toUpperCase();
    if (name.includes("TECH") || name.includes("IT")) {
      return {
        themeClass: "border-cyan-500/20 bg-cyan-500/[0.01] text-cyan-400",
        barColor: "bg-cyan-500",
        momentum: "High Acc.",
        risk: "Low Risk",
        glow: "shadow-[0_0_15px_rgba(6,182,212,0.06)]"
      };
    }
    if (name.includes("FINANCE") || name.includes("BANK")) {
      return {
        themeClass: "border-amber-500/20 bg-amber-500/[0.01] text-amber-400",
        barColor: "bg-amber-500",
        momentum: "Rotation Peak",
        risk: "Medium",
        glow: "shadow-[0_0_15px_rgba(245,158,11,0.06)]"
      };
    }
    if (name.includes("PHARMA") || name.includes("HEALTH")) {
      return {
        themeClass: "border-purple-500/20 bg-purple-500/[0.01] text-purple-400",
        barColor: "bg-purple-500",
        momentum: "Steady Accumulation",
        risk: "Low Risk",
        glow: "shadow-[0_0_15px_rgba(139,92,246,0.06)]"
      };
    }
    if (name.includes("ENERGY") || name.includes("POWER")) {
      return {
        themeClass: "border-emerald-500/20 bg-emerald-500/[0.01] text-emerald-400",
        barColor: "bg-emerald-500",
        momentum: "Bullish Spike",
        risk: "Medium",
        glow: "shadow-[0_0_15px_rgba(16,185,129,0.06)]"
      };
    }
    if (name.includes("METAL")) {
      return {
        themeClass: "border-rose-500/20 bg-rose-500/[0.01] text-rose-400",
        barColor: "bg-rose-500",
        momentum: "Cyclical Drift",
        risk: "High Risk",
        glow: "shadow-[0_0_15px_rgba(244,63,94,0.06)]"
      };
    }
    
    // Cycle defaults
    const list = [
      { themeClass: "border-cyan-500/20 bg-cyan-500/[0.01] text-cyan-400", barColor: "bg-cyan-500", momentum: "Balanced", risk: "Medium", glow: "shadow-[0_0_15px_rgba(6,182,212,0.04)]" },
      { themeClass: "border-purple-500/20 bg-purple-500/[0.01] text-purple-400", barColor: "bg-purple-500", momentum: "Defensive Shift", risk: "Low Risk", glow: "shadow-[0_0_15px_rgba(139,92,246,0.04)]" },
      { themeClass: "border-amber-500/20 bg-amber-500/[0.01] text-amber-400", barColor: "bg-amber-500", momentum: "Neutral Hold", risk: "Medium", glow: "shadow-[0_0_15px_rgba(245,158,11,0.04)]" }
    ];
    return list[idx % list.length];
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { y: 12, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="liquid-glass border border-white/5 rounded-2xl p-5 space-y-4 text-left h-full flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h3 className="text-xs uppercase font-mono tracking-widest text-white/50 font-bold flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Sector Analysis Metrics</span>
        </h3>
        <span className="text-[9px] font-mono text-cyan-400 bg-cyan-400/5 px-2 py-0.5 rounded-full font-bold uppercase border border-cyan-500/25">
          Sectors Mapped: {sectorData.length}
        </span>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-h-[380px] overflow-y-auto pr-1 space-y-3 scrollbar-thin flex-1"
      >
        {sectorData.map((sec, index) => {
          const style = getSectorStyle(sec.name, index);
          const hash = sec.name.charCodeAt(0) + sec.name.length;
          const bullishScore = Math.floor(62 + (hash % 26));

          return (
            <motion.div
              key={sec.name}
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all backdrop-blur-md ${style.themeClass} ${style.glow}`}
            >
              <div className="flex items-center justify-between font-mono text-[11px]">
                <div className="min-w-0">
                  <span className="font-bold text-white text-xs block truncate leading-tight">
                    {sec.name}
                  </span>
                  <span className="text-[9px] text-white/40 font-sans block mt-0.5">
                    Total: ₹{sec.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-white font-black block text-sm">
                    {sec.percentage.toFixed(1)}%
                  </span>
                  <span className="text-[8.5px] text-white/30 block uppercase tracking-wider font-bold">
                    Portfolio Allocation
                  </span>
                </div>
              </div>

              {/* Progress bar of Allocation */}
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-0.5">
                <motion.div
                  className={`h-full ${style.barColor} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${sec.percentage}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>

              {/* Technical indicators row */}
              <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-white/50 border-t border-white/[0.02] pt-2 mt-0.5">
                <div>
                  <span className="text-white/30 block uppercase tracking-wider text-[7.5px]">Momentum</span>
                  <span className="text-white font-medium truncate block">{style.momentum}</span>
                </div>
                <div>
                  <span className="text-white/30 block uppercase tracking-wider text-[7.5px]">Risk</span>
                  <span className="text-white font-medium block">{style.risk}</span>
                </div>
                <div className="text-right">
                  <span className="text-white/30 block uppercase tracking-wider text-[7.5px]">Bullish</span>
                  <span className="text-cyan-400 font-bold block">{bullishScore}%</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
