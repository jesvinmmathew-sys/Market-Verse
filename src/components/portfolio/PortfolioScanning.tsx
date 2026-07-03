import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Cpu, Shield, Loader2, Check, TrendingUp, Compass, Search } from "lucide-react";

interface PortfolioScanningProps {
  isAnalyzing: boolean;
  holdingsCount: number;
  onComplete: () => void;
}

const SCANNING_STEPS = [
  { label: "Uploading Portfolio...", icon: Compass },
  { label: "Reading Holdings...", icon: Search },
  { label: "Validating Symbols...", icon: Cpu },
  { label: "Fetching Live Market Prices...", icon: Loader2 },
  { label: "Downloading Technical Indicators...", icon: TrendingUp },
  { label: "Calculating Risk & Diversification...", icon: Shield },
  { label: "NOVA is Thinking...", icon: Sparkles },
  { label: "Generating Portfolio Intelligence...", icon: Sparkles },
  { label: "Analysis Complete", icon: Check }
];

const ROTATING_MESSAGES = [
  "🧠 Scanning {count} holdings...",
  "📊 Comparing against today's market...",
  "📈 Calculating portfolio diversification...",
  "⚡ Detecting hidden risks...",
  "📉 Measuring sector exposure...",
  "💡 Identifying growth opportunities...",
  "📡 Reading technical indicators...",
  "🤖 Generating personalized recommendations...",
  "✨ Building executive summary..."
];

export function PortfolioScanning({ isAnalyzing, holdingsCount, onComplete }: PortfolioScanningProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [scanningMsg, setScanningMsg] = useState("");
  const [showRevealScreen, setShowRevealScreen] = useState(false);

  useEffect(() => {
    if (!isAnalyzing) return;

    setCurrentStepIndex(0);
    setShowRevealScreen(false);

    // Dynamic step cycling (total time is ~3.5 to 4 seconds)
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      if (step < SCANNING_STEPS.length) {
        setCurrentStepIndex(step);
      } else {
        clearInterval(stepInterval);
        clearInterval(msgInterval);
        setShowRevealScreen(true);
        
        // Let the reveal screen display for 1.8s, then trigger final completion
        const timer = setTimeout(() => {
          onComplete();
        }, 1800);
        return () => clearTimeout(timer);
      }
    }, 420);

    // Rotate intelligence messages
    let msgIdx = 0;
    setScanningMsg(ROTATING_MESSAGES[0].replace("{count}", String(holdingsCount || 10)));
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % ROTATING_MESSAGES.length;
      setScanningMsg(ROTATING_MESSAGES[msgIdx].replace("{count}", String(holdingsCount || 10)));
    }, 650);

    return () => {
      clearInterval(stepInterval);
      clearInterval(msgInterval);
    };
  }, [isAnalyzing, holdingsCount, onComplete]);

  if (!isAnalyzing) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl select-none"
      >
        <div className="absolute inset-0 bg-radial-gradient from-cyan-900/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative w-full max-w-xl px-6 flex flex-col items-center">
          {!showRevealScreen ? (
            <div className="w-full space-y-8">
              {/* Spinning AI Core and floating particles */}
              <div className="relative flex flex-col items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="w-24 h-24 rounded-full border border-cyan-500/10 border-t-cyan-400/80 border-b-violet-500/80 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex items-center justify-center"
                />
                <div className="absolute inset-4 rounded-full bg-cyan-500/5 animate-pulse flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-cyan-400 animate-bounce" />
                </div>
                {/* Floating particle elements */}
                <span className="absolute w-2 h-2 rounded-full bg-cyan-400/40 animate-ping" style={{ top: -10, left: "35%" }} />
                <span className="absolute w-1.5 h-1.5 rounded-full bg-purple-400/40 animate-ping" style={{ bottom: -10, right: "30%" }} />
              </div>

              {/* Steps Progress Checklist */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-3.5 backdrop-blur-md shadow-2xl">
                <h3 className="text-xs uppercase tracking-widest font-mono text-cyan-400 flex items-center gap-2 border-b border-white/5 pb-3">
                  <Cpu className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>NOVA Portfolio Auditing Core</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-left">
                  {SCANNING_STEPS.map((stepItem, idx) => {
                    const isCompleted = idx < currentStepIndex;
                    const isActive = idx === currentStepIndex;
                    const StepIcon = stepItem.icon;

                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
                          isCompleted
                            ? "text-emerald-400 font-medium"
                            : isActive
                            ? "text-cyan-400 font-bold scale-102"
                            : "text-white/20"
                        }`}
                      >
                        <span className={`flex items-center justify-center w-5 h-5 rounded-full border text-[10px] ${
                          isCompleted
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : isActive
                            ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 animate-pulse"
                            : "bg-white/[0.01] border-white/5 text-white/15"
                        }`}>
                          {isCompleted ? <Check className="w-3 h-3" /> : (idx + 1)}
                        </span>
                        <span className="truncate font-sans">{stepItem.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Main Progress Bar */}
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-4">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                    animate={{ width: `${(currentStepIndex / (SCANNING_STEPS.length - 1)) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Dynamic rotating message */}
              <div className="text-center">
                <motion.p
                  key={scanningMsg}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-sm font-medium font-mono text-cyan-300"
                >
                  {scanningMsg}
                </motion.p>
                <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">
                  DO NOT REFRESH WORKSPACE • QUANT PIPELINE ACTIVE
                </p>
              </div>
            </div>
          ) : (
            /* Grand Reveal Success screen */
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6 bg-white/[0.02] border border-emerald-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] max-w-sm relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500" />
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto relative">
                <Check className="w-10 h-10 animate-bounce" />
                <span className="absolute -inset-2 border border-emerald-400/20 rounded-full animate-ping pointer-events-none" />
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-black tracking-wider uppercase font-mono text-emerald-400">
                  Portfolio Analyzed
                </h2>
                <p className="text-xs text-white/70 leading-relaxed font-sans">
                  ✨ NOVA has generated personalized insights, sector metrics, and technical correlation indexes successfully.
                </p>
              </div>

              <div className="text-[10px] text-cyan-400/80 font-mono flex items-center justify-center gap-1.5 animate-pulse">
                <span>Entering Terminal Interface...</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
