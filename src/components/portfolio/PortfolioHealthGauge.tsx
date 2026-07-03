import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Gauge, Shield, Zap, Layers, Compass } from "lucide-react";

interface PortfolioHealthGaugeProps {
  score: number;
  diversification: string;
  risk: string;
  outlook: string;
}

const AnimatedNumber = ({ value, decimals = 0 }: { value: number; decimals?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1500; // 1.5s
    const startValue = 0;
    const endValue = value;
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = progress * (2 - progress); // easeOutQuad
      setDisplayValue(startValue + easedProgress * (endValue - startValue));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [value]);
  
  return (
    <span>
      {displayValue.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}
    </span>
  );
};

export function PortfolioHealthGauge({ score, diversification, risk, outlook }: PortfolioHealthGaugeProps) {
  const [circumference] = useState(2 * Math.PI * 66); // r=66 -> ~414.69
  const [dashOffset, setDashOffset] = useState(circumference);

  useEffect(() => {
    // Fill effect from 0 to score
    const timer = setTimeout(() => {
      const offset = circumference - (circumference * score) / 100;
      setDashOffset(offset);
    }, 100);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  // Determine colors based on status
  const getRiskColor = (r: string) => {
    if (r.toUpperCase().includes("LOW")) return "text-emerald-400";
    if (r.toUpperCase().includes("MEDIUM")) return "text-amber-400";
    return "text-rose-400";
  };

  const getDiversificationColor = (d: string) => {
    if (d.toUpperCase().includes("EXCELLENT")) return "text-emerald-400";
    if (d.toUpperCase().includes("GOOD")) return "text-cyan-400";
    return "text-rose-400";
  };

  return (
    <div className="liquid-glass border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-5 relative overflow-hidden h-full">
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.01] to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between w-full border-b border-white/5 pb-3">
        <h3 className="text-xs uppercase font-mono tracking-widest text-white/50 font-bold flex items-center gap-1.5">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span>Portfolio Diagnostic</span>
        </h3>
        <span className="text-[9px] font-mono bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
          Active
        </span>
      </div>
      
      {/* Circle Gauge Container */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        {/* Soft backlighting glow */}
        <div className="absolute inset-6 rounded-full bg-cyan-500/5 blur-xl animate-pulse" />
        
        {/* Background Grey Circular Track */}
        <div className="absolute inset-2 rounded-full border-4 border-white/5" />
        
        {/* Animated Gauge Layer */}
        <svg className="w-full h-full transform -rotate-90 overflow-visible">
          <circle 
            cx="88" 
            cy="88" 
            r="66" 
            stroke="url(#healthGradient)" 
            strokeWidth="5" 
            fill="transparent" 
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-1500 ease-out"
            style={{
              filter: "drop-shadow(0px 0px 6px rgba(6, 182, 212, 0.4))"
            }}
          />
          <defs>
            <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating Text Center */}
        <div className="absolute flex flex-col items-center justify-center space-y-0.5">
          <span className="text-4xl font-mono font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400">
            <AnimatedNumber value={score} />
          </span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-400/80 font-bold">
            Health Index
          </span>
        </div>
      </div>

      {/* Metric Parameter Rows around circular gauge */}
      <div className="grid grid-cols-2 gap-3.5 w-full pt-1.5">
        {/* Diversification */}
        <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 space-y-1 text-left">
          <div className="flex items-center gap-1.5 text-white/40 font-mono text-[9px] uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Diversification</span>
          </div>
          <span className={`text-[11px] font-mono font-black uppercase ${getDiversificationColor(diversification)}`}>
            {diversification}
          </span>
        </div>

        {/* Risk */}
        <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 space-y-1 text-left">
          <div className="flex items-center gap-1.5 text-white/40 font-mono text-[9px] uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-violet-400" />
            <span>Risk Profile</span>
          </div>
          <span className={`text-[11px] font-mono font-black uppercase ${getRiskColor(risk)}`}>
            {risk}
          </span>
        </div>

        {/* Momentum */}
        <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 space-y-1 text-left col-span-1">
          <div className="flex items-center gap-1.5 text-white/40 font-mono text-[9px] uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Momentum</span>
          </div>
          <span className="text-[11px] font-mono font-black uppercase text-emerald-400">
            Highly Bullish
          </span>
        </div>

        {/* Outlook */}
        <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 space-y-1 text-left col-span-1">
          <div className="flex items-center gap-1.5 text-white/40 font-mono text-[9px] uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Outlook</span>
          </div>
          <span className="text-[11px] font-mono font-black uppercase text-white/80">
            {outlook}
          </span>
        </div>
      </div>
    </div>
  );
}
