import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  DollarSign, 
  Activity, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  HelpCircle,
  Globe,
  Award,
  Loader2
} from "lucide-react";

interface SummaryMetrics {
  totalInvestment: number;
  currentPortfolioValue: number;
  todaysGainLoss: number;
  unrealizedProfit: number;
  overallReturnPct: number;
  healthScore: number;
  holdingsCount: number;
  diversificationRating: string;
  riskRating: string;
  outlookRating: string;
}

interface QuickInsightItem {
  text: string;
  status: "success" | "warning" | "danger";
  info: string;
}

interface FullReportData {
  executiveSummary: string;
  strengths: string[];
  weaknesses: string[];
  riskFactors: string[];
  recommendations: string[];
  actionPlan: string[];
}

interface PortfolioMetricsProps {
  summaryMetrics: SummaryMetrics;
  quickInsights: QuickInsightItem[];
  fullReportData: FullReportData | null;
  isAIReportLoading?: boolean;
}

// Custom Eased Count-Up Component using RequestAnimationFrame
const CountUpNum = ({ value, prefix = "", suffix = "", decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  React.useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1500;
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
      {prefix}
      {displayValue.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}
      {suffix}
    </span>
  );
};

export function PortfolioMetrics({ summaryMetrics, quickInsights, fullReportData, isAIReportLoading = false }: PortfolioMetricsProps) {
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Stagger configurations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  const getStatusIcon = (status: "success" | "warning" | "danger") => {
    switch (status) {
      case "success": return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case "danger": return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
    }
  };

  const getStatusBg = (status: "success" | "warning" | "danger") => {
    switch (status) {
      case "success": return "bg-emerald-500/5 border-emerald-500/20 text-emerald-300";
      case "warning": return "bg-amber-500/5 border-amber-500/20 text-amber-300";
      case "danger": return "bg-rose-500/5 border-rose-500/20 text-rose-300";
    }
  };

  return (
    <div className="space-y-8 select-none">
      
      {/* 4. EXECUTIVE SUMMARY - Bento Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5" 
        id="executive-summary-grid"
      >
        {/* Card 1: Portfolio Health */}
        <motion.div 
          variants={itemVariants}
          className="liquid-glass border border-white/5 bg-black/35 rounded-2xl p-5 relative overflow-hidden group lg:col-span-2 text-left flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/[0.02] rounded-full blur-2xl group-hover:bg-cyan-500/[0.05] transition-all duration-500" />
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-widest font-mono text-white/40 block">Demat Portfolio Health</span>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                <CountUpNum value={summaryMetrics.healthScore} />
              </h2>
              <span className="text-xs text-white/30">/100</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-[10px] text-white/50 bg-white/[0.02] border border-white/5 rounded-lg p-2 font-mono">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Rating: <strong className="text-white uppercase">{summaryMetrics.diversificationRating}</strong></span>
          </div>
        </motion.div>

        {/* Card 2: Market Mood */}
        <motion.div 
          variants={itemVariants}
          className="liquid-glass border border-white/5 bg-black/35 rounded-2xl p-5 relative overflow-hidden group lg:col-span-2 text-left flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.01] rounded-full blur-2xl group-hover:bg-emerald-500/[0.03] transition-all duration-500" />
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-widest font-mono text-white/40 block">Current Market Mood</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <h2 className="text-xl font-bold font-mono tracking-wide text-emerald-400 uppercase">
                Highly Bullish
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-[10px] text-white/50 bg-white/[0.02] border border-white/5 rounded-lg p-2 font-mono">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>FII & DII Inflows: <strong className="text-white">Active Support</strong></span>
          </div>
        </motion.div>

        {/* Card 3: Today's Performance */}
        <motion.div 
          variants={itemVariants}
          className="liquid-glass border border-white/5 bg-black/35 rounded-2xl p-5 relative overflow-hidden group lg:col-span-2 text-left flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.01] rounded-full blur-2xl group-hover:bg-emerald-500/[0.03] transition-all duration-500" />
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-widest font-mono text-white/40 block">Today's Returns</span>
            <div className={`text-xl sm:text-2xl font-mono font-black flex items-center gap-1 ${summaryMetrics.todaysGainLoss >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {summaryMetrics.todaysGainLoss >= 0 ? <TrendingUp className="w-4 h-4 shrink-0" /> : <TrendingDown className="w-4 h-4 shrink-0" />}
              <h2 className="leading-none">
                <CountUpNum value={Math.abs(summaryMetrics.todaysGainLoss)} prefix={summaryMetrics.todaysGainLoss >= 0 ? "+" : "-"} />
              </h2>
            </div>
          </div>
          <span className="text-[9px] font-mono text-white/35 mt-4 block border-t border-white/5 pt-2.5">
            Live ticking with Indian NSE Index
          </span>
        </motion.div>

        {/* Card 4: Overall Returns */}
        <motion.div 
          variants={itemVariants}
          className="liquid-glass border border-white/5 bg-black/35 rounded-2xl p-5 relative overflow-hidden group lg:col-span-2 text-left flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/[0.01] rounded-full blur-2xl group-hover:bg-violet-500/[0.03] transition-all duration-500" />
          <div className="space-y-2.5">
            <span className="text-[10px] uppercase tracking-widest font-mono text-white/40 block">Unrealized Gain</span>
            <div className={`text-xl font-mono font-black ${summaryMetrics.unrealizedProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              <CountUpNum value={summaryMetrics.unrealizedProfit} prefix={summaryMetrics.unrealizedProfit >= 0 ? "+" : ""} decimals={1} />
            </div>
          </div>
          <div className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold ${summaryMetrics.overallReturnPct >= 0 ? "text-emerald-400" : "text-rose-400"} mt-4`}>
            <CountUpNum value={summaryMetrics.overallReturnPct} prefix={summaryMetrics.overallReturnPct >= 0 ? "+" : ""} suffix="%" decimals={2} />
            <span className="text-white/30 font-normal">ROI</span>
          </div>
        </motion.div>

        {/* Card 5: AI Confidence */}
        <motion.div 
          variants={itemVariants}
          className="liquid-glass border border-white/5 bg-black/35 rounded-2xl p-5 relative overflow-hidden group lg:col-span-2 text-left flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/[0.02] rounded-full blur-2xl" />
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-widest font-mono text-white/40 block">AI Engine Confidence</span>
            <h2 className="text-xl sm:text-2xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
              <CountUpNum value={94} suffix="%" />
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-4 text-[10px] text-white/50 bg-white/[0.02] border border-white/5 rounded-lg p-2 font-mono">
            <Award className="w-3.5 h-3.5 text-violet-400" />
            <span>Auditor: <strong className="text-white uppercase">NOVA Engine</strong></span>
          </div>
        </motion.div>

        {/* Card 6: Diversification */}
        <motion.div 
          variants={itemVariants}
          className="liquid-glass border border-white/5 bg-black/35 rounded-2xl p-5 relative overflow-hidden group lg:col-span-2 text-left flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.01] rounded-full blur-2xl" />
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-widest font-mono text-white/40 block">Asset Allocation Level</span>
            <h2 className="text-xl sm:text-2xl font-mono font-black text-white uppercase">
              {summaryMetrics.diversificationRating}
            </h2>
          </div>
          <div className="text-[10px] text-white/50 mt-4 font-mono">
            Mapped over <strong className="text-white">{summaryMetrics.holdingsCount}</strong> active positions
          </div>
        </motion.div>
      </motion.div>

      {/* 5. NOVA QUICK INSIGHTS - Compact dynamic list */}
      <div className="space-y-4 text-left" id="nova-insights-panel">
        <h3 className="text-xs uppercase font-mono tracking-widest text-cyan-400/80 font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>NOVA Real-Time Portfolio Insights</span>
        </h3>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {quickInsights.map((insight, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -3, scale: 1.01 }}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 h-full transition-all duration-300 backdrop-blur-md shadow-lg ${getStatusBg(insight.status)}`}
              style={{
                boxShadow: insight.status === "success" 
                  ? "0 4px 15px rgba(16,185,129,0.03)" 
                  : insight.status === "warning"
                  ? "0 4px 15px rgba(245,158,11,0.03)"
                  : "0 4px 15px rgba(239,68,68,0.03)"
              }}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-mono font-bold leading-tight">{insight.text}</span>
                {getStatusIcon(insight.status)}
              </div>
              <p className="text-[10px] text-white/55 font-sans leading-normal">
                {insight.info}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* 6. VIEW FULL AI REPORT - Smoothly Expanding Dashboard */}
      <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/40 text-left" id="full-ai-report-accordion">
        <button
          onClick={() => {
            if (!isAIReportLoading && fullReportData) {
              setIsReportOpen(!isReportOpen);
            }
          }}
          className={`w-full flex items-center justify-between p-5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors border-b border-transparent font-mono ${(isAIReportLoading || !fullReportData) ? "cursor-wait opacity-70" : "cursor-pointer"}`}
          style={{ borderBottomColor: isReportOpen ? "rgba(255,255,255,0.05)" : "transparent" }}
        >
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            {isAIReportLoading || !fullReportData ? (
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 text-cyan-400" />
            )}
            <span>Interactive Portfolio Executive Intelligence Report</span>
            {(isAIReportLoading || !fullReportData) && (
              <span className="text-[10px] text-white/45 normal-case font-normal font-sans ml-2 animate-pulse">
                (NOVA AI is formulating deep report...)
              </span>
            )}
          </div>
          {!(isAIReportLoading || !fullReportData) && (
            <div className="flex items-center gap-2 text-white/40 text-[10px] font-mono uppercase tracking-wider">
              <span>{isReportOpen ? "Collapse" : "Expand Report"}</span>
              {isReportOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          )}
        </button>

        <AnimatePresence initial={false}>
          {(isReportOpen || isAIReportLoading || !fullReportData) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {(isAIReportLoading || !fullReportData) ? (
                /* Dynamic Sleek Skeletons for Loading State */
                <div className="p-6 space-y-6 animate-pulse">
                  <div className="space-y-3">
                    <div className="h-3.5 w-1/4 bg-cyan-500/10 rounded-full" />
                    <div className="h-4 w-full bg-white/5 rounded-full" />
                    <div className="h-4 w-5/6 bg-white/5 rounded-full" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    <div className="h-24 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                      <div className="h-3 w-1/3 bg-emerald-500/10 rounded-full" />
                      <div className="h-2 w-full bg-white/5 rounded-full" />
                      <div className="h-2 w-4/5 bg-white/5 rounded-full" />
                    </div>
                    <div className="h-24 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                      <div className="h-3 w-1/3 bg-amber-500/10 rounded-full" />
                      <div className="h-2 w-full bg-white/5 rounded-full" />
                      <div className="h-2 w-4/5 bg-white/5 rounded-full" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  
                  {/* Executive Summary Narrative */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] uppercase font-mono tracking-wider text-cyan-400/80 font-bold">1. Executive Quantitative Narrative</h4>
                    <p className="text-xs text-white/70 leading-relaxed font-sans border-l-2 border-cyan-400/40 pl-3.5 bg-cyan-500/[0.01] py-3 rounded-r-xl">
                      {fullReportData.executiveSummary}
                    </p>
                  </div>

                  {/* SWOT & Risk Split */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    
                    {/* Strengths */}
                    <div className="p-4 rounded-xl bg-emerald-500/[0.01] border border-emerald-500/10 space-y-2.5">
                      <h5 className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Structural Strengths</span>
                      </h5>
                      <ul className="text-xs text-white/60 space-y-1.5 font-sans pl-4 list-disc">
                        {fullReportData.strengths.map((str, idx) => (
                          <li key={idx}>{str}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="p-4 rounded-xl bg-amber-500/[0.01] border border-amber-500/10 space-y-2.5">
                      <h5 className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Technical Vulnerabilities</span>
                      </h5>
                      <ul className="text-xs text-white/60 space-y-1.5 font-sans pl-4 list-disc">
                        {fullReportData.weaknesses.map((wk, idx) => (
                          <li key={idx}>{wk}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Risk Factors */}
                    <div className="p-4 rounded-xl bg-rose-500/[0.01] border border-rose-500/10 space-y-2.5">
                      <h5 className="text-[10px] uppercase font-mono tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Systemic Risk Factors</span>
                      </h5>
                      <ul className="text-xs text-white/60 space-y-1.5 font-sans pl-4 list-disc">
                        {fullReportData.riskFactors.map((risk, idx) => (
                          <li key={idx}>{risk}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Plan */}
                    <div className="p-4 rounded-xl bg-violet-500/[0.01] border border-violet-500/10 space-y-2.5">
                      <h5 className="text-[10px] uppercase font-mono tracking-wider text-violet-400 font-bold flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-violet-400" />
                        <span>Quantum Action Plan</span>
                      </h5>
                      <ul className="text-xs text-white/60 space-y-1.5 font-sans pl-4 list-disc">
                        {fullReportData.actionPlan.map((act, idx) => (
                          <li key={idx}>{act}</li>
                        ))}
                      </ul>
                    </div>

                  </div>

                  {/* Recommendations */}
                  <div className="pt-2 border-t border-white/5 space-y-2.5">
                    <h4 className="text-[10px] uppercase font-mono tracking-wider text-cyan-400/80 font-bold">2. Specific Rebalancing Recommendations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {fullReportData.recommendations.map((rec, idx) => (
                        <div key={idx} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl font-mono text-[10.5px] text-white/70 leading-normal">
                          <span className="text-cyan-400 font-bold mr-1.5">#{idx + 1}</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
