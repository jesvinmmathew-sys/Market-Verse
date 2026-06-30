import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Search, 
  ChevronRight, 
  Menu, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Globe, 
  BookOpen, 
  Layers, 
  PieChart, 
  ArrowUpRight, 
  Check, 
  HelpCircle, 
  DollarSign,
  ArrowRight,
  Shield,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FloatingFinancialParticles, 
  GlowingBullModel, 
  GlowingBearModel 
} from "./VisualAssets";
import { HomepageAIChat } from "./HomepageAIChat";
import { NovaLogo } from "./NovaLogo";

// Inlined Abstract Curve Mark (Logo)
export const LogoMark: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 256 256" fill="currentColor" className={className} id="logo-mark-svg">
    <path d="M 0 128 C 70.692 128 128 185.308 128 256 L 64 256 C 64 220.654 35.346 192 0 192 Z M 256 192 C 220.654 192 192 220.654 192 256 L 128 256 C 128 185.308 185.308 128 256 128 Z M 128 0 C 128 70.692 70.692 128 0 128 L 0 64 C 35.346 64 64 35.346 64 0 Z M 192 0 C 192 35.346 220.654 64 256 64 L 256 128 C 185.308 128 128 70.692 128 0 Z" />
  </svg>
);

// Section Header Eyebrow
export const SectionEyebrow: React.FC<{ label: string; tag?: string }> = ({ label, tag }) => (
  <div className="flex items-center gap-3" id={`eyebrow-${label.toLowerCase()}`}>
    <span className="text-xs font-semibold tracking-widest text-[#3D81E3] uppercase">{label}</span>
    {tag && (
      <span className="px-2 py-0.5 rounded-full border border-white/10 text-white/50 text-[10px] bg-white/[0.02] font-mono">
        {tag}
      </span>
    )}
  </div>
);

// Simulated Real-Time Stock Live Graph for Landing Page Visuals
const AnimatedHeroGraph: React.FC = () => {
  const [dataPoints, setDataPoints] = useState<number[]>([120, 122, 119, 123, 125, 124, 128, 127, 131, 130, 133, 135]);
  const [activeSymbol, setActiveSymbol] = useState<string>("RELIANCE");
  const [activeRate, setActiveRate] = useState<number>(2885.50);
  const [activeDiff, setActiveDiff] = useState<number>(0.64);

  const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;

  useEffect(() => {
    if (isWeekend) {
      // Freeze all ticking on weekends
      return;
    }

    const interval = setInterval(() => {
      setDataPoints(prev => {
        const last = prev[prev.length - 1];
        const change = (Math.random() - 0.48) * 3;
        const next = Math.max(80, Math.min(200, last + change));
        return [...prev.slice(1), next];
      });

      setActiveRate(prev => {
        const change = (Math.random() - 0.48) * 5;
        const next = prev + change;
        setActiveDiff(d => d + (change > 0 ? 0.02 : -0.01));
        return parseFloat(next.toFixed(2));
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isWeekend]);

  const maxValue = Math.max(...dataPoints);
  const minValue = Math.min(...dataPoints);
  const range = maxValue - minValue || 1;

  const pointsString = dataPoints
    .map((val, idx) => {
      const x = (idx / (dataPoints.length - 1)) * 340 + 10;
      const y = 140 - ((val - minValue) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="liquid-glass rounded-2xl p-5 w-full max-w-sm relative" id="hero-animated-graph">
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <span className={`w-2 h-2 rounded-full ${isWeekend ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
        <span className="text-[10px] font-mono font-bold uppercase tracking-wide">
          {isWeekend ? (
            <span className="text-amber-400">MARKET CLOSED</span>
          ) : (
            <span className="text-white/40">LIVE FEED</span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-white/5 text-cyan-400">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-wide">{activeSymbol}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800/30">EQ</span>
          </div>
          <div className="text-xs text-white/50 font-mono">NSE Stock Tracker</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-2xl font-black font-mono tracking-tight text-white">
          ₹{activeRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        <div className={`text-xs font-mono flex items-center gap-1 mt-0.5 ${activeDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {activeDiff >= 0 ? "▲ +" : "▼ "}
          {activeDiff.toFixed(2)}% (+₹{Math.abs(activeDiff * 15).toFixed(2)})
        </div>
      </div>

      {/* SVG Neon Graph Line */}
      <div className="h-32 w-full mt-2 relative">
        <svg viewBox="0 0 360 150" className="w-full h-full">
          <defs>
            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <line x1="10" y1="20" x2="350" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <line x1="10" y1="70" x2="350" y2="70" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <line x1="10" y1="120" x2="350" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

          {/* Fill Area */}
          <path
            d={`M 10,140 ${pointsString.substring(pointsString.indexOf(' ') + 1)} L 350,140 Z`}
            fill="url(#chartGlow)"
          />

          {/* Glow Line */}
          <polyline
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2.5"
            points={pointsString}
            style={{ filter: "drop-shadow(0px 0px 8px rgba(34, 211, 238, 0.5))" }}
          />

          {/* Pulsing endpoint dot */}
          {dataPoints.length > 0 && (
            <circle
              cx={350}
              cy={140 - ((dataPoints[dataPoints.length - 1] - minValue) / range) * 100}
              r="4.5"
              fill="#22d3ee"
              className="animate-pulse"
            />
          )}
        </svg>
      </div>

      {/* Interactive Symbol Toggles */}
      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        {["RELIANCE", "TATAMOTORS", "SENSEX"].map((sym) => (
          <button
            key={sym}
            onClick={() => {
              setActiveSymbol(sym);
              if (sym === "RELIANCE") {
                setActiveRate(2885.50);
                setDataPoints([120, 122, 119, 123, 125, 124, 128, 127, 131, 130, 133, 135]);
              } else if (sym === "TATAMOTORS") {
                setActiveRate(924.50);
                setDataPoints([150, 148, 142, 146, 149, 155, 152, 158, 164, 161, 167, 172]);
              } else {
                setActiveRate(79560.20);
                setDataPoints([100, 102, 105, 103, 107, 110, 112, 109, 115, 119, 122, 126]);
              }
            }}
            className={`text-[10px] font-bold py-1.5 rounded-lg border transition-all ${
              activeSymbol === sym 
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300" 
                : "border-white/5 bg-white/[0.01] hover:bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            {sym}
          </button>
        ))}
      </div>
    </div>
  );
};

export const MarketVerseLanding: React.FC<{ onLaunchTerminal: () => void; onNavigate: (path: string) => void }> = ({ onLaunchTerminal, onNavigate }) => {
  const [activeFeatureTab, setActiveFeatureTab] = useState<number>(0);

  const activeTabClass = "bg-white/10 text-white";
  const inactiveTabClass = "text-white/60 hover:bg-white/5";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#060608] text-white selection:bg-[#3D81E3]/30" id="marketverse-landing-root">
      
      {/* Inline styles for cinematic effects requested */}
      <style>{`
        /* Liquid Glass effect */
        .liquid-glass {
          background: rgba(255, 255, 255, 0.01);
          background-blend-mode: luminosity;
          backdrop-filter: blur(12px);
          border: none;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.08);
          position: relative; 
          overflow: hidden;
        }
        .liquid-glass::before {
          content: ''; 
          position: absolute; 
          inset: 0; 
          border-radius: inherit;
          padding: 1.4px;
          background: linear-gradient(180deg,
            rgba(255, 255, 255, 0.4) 0%, 
            rgba(255, 255, 255, 0.12) 20%,
            rgba(255, 255, 255, 0) 40%, 
            rgba(255, 255, 255, 0) 60%,
            rgba(255, 255, 255, 0.12) 80%, 
            rgba(255, 255, 255, 0.4) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; 
          mask-composite: exclude;
          pointer-events: none;
        }

        /* Shiny title animation */
        @keyframes shiny {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-shiny {
          animation: shiny 8s linear infinite;
        }
      `}</style>

      {/* Global Particle Background */}
      <FloatingFinancialParticles />

      {/* Global Background Loop Video - EXACTLY THE SAME AS PREVIOUS DESIGN */}
      <div className="fixed inset-0 w-full h-full object-cover z-0 opacity-25 pointer-events-none mix-blend-screen" id="ambient-video-background">
        <video 
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {/* Vertical Guides */}
      <div className="hidden lg:block fixed left-1/2 top-0 bottom-0 w-px bg-white/5 pointer-events-none -translate-x-[36rem] z-10" id="guide-left" />
      <div className="hidden lg:block fixed left-1/2 top-0 bottom-0 w-px bg-white/5 pointer-events-none translate-x-[36rem] z-10" id="guide-right" />

      {/* Global SVG Noise Filters */}
      <svg className="absolute w-0 h-0" id="svg-noise-definitions">
        <filter id="c3-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.12 0" />
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
      </svg>

      {/* Navigation Bar */}
      <motion.nav 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-30 border-b border-white/5 bg-black/20 backdrop-blur-md"
        id="marketverse-navbar"
      >
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} id="nav-brand-logo">
            <LogoMark className="w-8 h-8 text-[#22d3ee] hover:text-[#22d3ee]/80 transition-colors" />
            <span className="text-lg font-black tracking-widest bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent font-sans">MARKETVERSE</span>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-6" id="nav-links-container">
            {[
              { name: 'Dashboard', path: '/dashboard' },
              { name: 'Indian Market', path: '/stocks' },
              { name: 'NOVA AI', path: '/ai' },
              { name: 'News', path: '/news' },
              { name: 'Learn', path: '/learn' }
            ].map((item, i) => (
              <motion.button 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                key={item.name}
                onClick={() => onNavigate(item.path)}
                className="text-white/70 text-sm font-medium hover:text-white transition-colors cursor-pointer bg-transparent border-none outline-none"
                id={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.name}
              </motion.button>
            ))}
          </div>

          {/* Right Action: Launch Terminal */}
          <div className="flex items-center gap-4" id="nav-actions-container">
            <button 
              onClick={onLaunchTerminal}
              id="btn-nav-launch-terminal"
              className="px-5 py-2.5 rounded-full text-xs font-semibold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.15)] animate-pulse"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>LAUNCH TERMINAL</span>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-20 max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-14 text-center flex flex-col items-center" id="section-hero">
        {/* Announcement Tag */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs font-mono mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>MarketVerse India v2.5 with Twelve Data & Advanced AI is Live</span>
        </motion.div>

        {/* Cinematic Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl md:text-7xl font-bold tracking-tight leading-[1.05] max-w-5xl"
          id="hero-headline"
        >
          Understand Markets. <br />Predict Movements. <br />
          <span 
            className="animate-shiny inline-block font-black"
            style={{
              color: '#a0a0a0',
              filter: 'url(#c3-noise)'
            }}
          >
            Invest Smarter.
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-8 text-white/60 max-w-2xl text-base md:text-lg leading-[1.6]"
          id="hero-description"
        >
          MarketVerse India combines real-time market intelligence, AI analysis, and powerful analytics to help investors navigate every market condition.
        </motion.p>

        {/* Hero Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center"
          id="hero-ctas"
        >
          <button 
            onClick={onLaunchTerminal}
            id="btn-explore-markets"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-white text-black font-semibold text-sm px-6 py-3.5 transition-all hover:bg-white/90 active:scale-[0.98] cursor-pointer shadow-lg"
          >
            <span>Explore Markets</span>
            <ChevronRight className="w-4 h-4 text-black transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
          
          <button 
            onClick={onLaunchTerminal}
            id="btn-open-dashboard"
            className="group flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-semibold text-sm cursor-pointer transition-all shadow-[0_0_20px_rgba(34,211,238,0.1)]"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-4 h-4 text-cyan-300 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="w-full max-w-4xl mt-20 grid grid-cols-3 gap-6 text-center border-t border-white/5 pt-10"
          id="hero-stats-row"
        >
          {[
            { value: "1000+", label: "Stocks Indexed", desc: "All NSE & BSE Equities" },
            { value: "10K+", label: "Investors Unified", desc: "Strategic portfolio control" },
            { value: "AI Powered", label: "Market Intelligence", desc: "Dynamic sentiment models" }
          ].map((stat, i) => (
            <div key={i} className="space-y-1">
              <div className="text-2xl md:text-4xl font-black font-mono text-white tracking-tight">{stat.value}</div>
              <div className="text-xs font-semibold text-cyan-400">{stat.label}</div>
              <div className="text-[10px] text-white/40 hidden sm:block">{stat.desc}</div>
            </div>
          ))}
        </motion.div>

        {/* Introducing NOVA Area */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="w-full max-w-4xl mt-16 p-8 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-black via-slate-950/90 to-blue-950/20 relative overflow-hidden group shadow-[0_0_50px_rgba(34,211,238,0.15)] text-left"
          id="nova-premium-intro-card"
        >
          {/* Futuristic animated glow backdrops */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none animate-pulse" />
          
          <div className="grid md:grid-cols-12 gap-8 items-center relative z-10">
            {/* Logo area with futuristic glow */}
            <div className="md:col-span-4 flex flex-col items-center justify-center relative">
              <div className="absolute w-36 h-36 bg-cyan-400/10 rounded-full blur-2xl animate-ping" style={{ animationDuration: "4s" }} />
              <NovaLogo className="w-32 h-32" />
            </div>
            
            {/* Texts area */}
            <div className="md:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 text-[10px] font-mono font-bold tracking-widest uppercase">
                <span>Flagship AI Assistant</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-sans" id="introducing-nova-heading">
                Introducing NOVA
              </h2>
              
              <p className="text-white/85 text-sm md:text-base leading-relaxed font-sans">
                NOVA is your intelligent market analyst, helping you understand Indian stock markets through real-time insights, technical analysis, and smarter market intelligence.
              </p>
              
              <div className="text-cyan-300 text-xs font-semibold tracking-wide font-sans flex items-center gap-1.5 pt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>Your AI companion for smarter market decisions.</span>
              </div>
              
              <div className="pt-2">
                <button
                  onClick={() => onNavigate("/ai")}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-200 border border-cyan-400/30 hover:border-cyan-400/60 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all cursor-pointer inline-flex items-center gap-2 shadow-inner"
                >
                  <span>Consult NOVA AI Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Hero Visuals Section: 3D Bull + Live Chart + 3D Bear */}
      <section className="relative z-20 max-w-6xl mx-auto px-6 py-12" id="hero-models-visuals">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center justify-center">
          
          {/* Left: 3D Bull wireframe */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.85, x: -30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            whileHover={{ scale: 1.05, y: -4 }}
            onClick={() => onNavigate("/market/bullish")}
            className="md:col-span-3 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 cursor-pointer liquid-glass group"
          >
            <div className="text-xs font-bold text-emerald-400 tracking-widest uppercase mb-4 font-mono group-hover:text-emerald-300">BULLISH TRENDSCENE</div>
            <GlowingBullModel size={140} />
            <p className="text-[11px] text-white/40 text-center mt-4 group-hover:text-white/60 transition-colors">Simulating structural bullish support curves with active multi-asset indexing.</p>
            <div className="mt-4 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 font-mono tracking-wider group-hover:bg-emerald-500 group-hover:text-black transition-all">
              LAUNCH BULL RADAR
            </div>
          </motion.div>

          {/* Center: Live Ticking Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="md:col-span-6 flex justify-center"
          >
            <AnimatedHeroGraph />
          </motion.div>

          {/* Right: 3D Polar Bear wireframe */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.85, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            whileHover={{ scale: 1.05, y: -4 }}
            onClick={() => onNavigate("/market/bearish")}
            className="md:col-span-3 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 hover:border-rose-500/30 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] transition-all duration-300 cursor-pointer liquid-glass group"
          >
            <div className="text-xs font-bold text-rose-400 tracking-widest uppercase mb-4 font-mono group-hover:text-rose-300">BEARISH TRENDSCENE</div>
            <GlowingBearModel size={140} />
            <p className="text-[11px] text-white/40 text-center mt-4 group-hover:text-white/60 transition-colors">Real-time risk assessment calculating consolidation & negative volatility ratios.</p>
            <div className="mt-4 px-3 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-400 font-mono tracking-wider group-hover:bg-rose-500 group-hover:text-white transition-all">
              LAUNCH BEAR RADAR
            </div>
          </motion.div>

        </div>
      </section>

      {/* Feature Section: Interactive Live Stock/Forex Hub */}
      <section className="relative z-20 max-w-6xl mx-auto px-6 py-20 border-t border-white/5" id="section-markets">
        <div className="text-center max-w-xl mx-auto mb-16">
          <SectionEyebrow label="Fintech Architecture" tag="Live API Proxy" />
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white mt-4">
            Unified market control.
          </h2>
          <p className="text-sm text-white/50 mt-2">
            Seamless transitions between domestic securities and global foreign exchanges in a high-speed Bloomberg terminal view.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
          
          {/* Left: Triage List rebranded as Live Index Stream */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-6 text-left"
            id="markets-info-col"
          >
            <SectionEyebrow label="Multi-Markets" tag="Real-Time Data" />
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.05]">
              Track Indian Stocks <br />
              & Indices.
            </h2>
            <p className="text-white/60 text-base leading-[1.6] max-w-md">
              Access real-time stock listings across the Indian Stock Market (NSE/BSE) with advanced screening. Perform instant deep technical charting with a click.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {["Twelve Data Integration", "Interactive Candles", "RSI / MACD Indicators", "Bollinger Bands", "AI Trend Predictions"].map((chip) => (
                <span 
                  key={chip} 
                  className="text-xs text-[#22d3ee] px-3 py-1.5 rounded-full border border-cyan-500/10 bg-cyan-950/20 hover:bg-cyan-900/30 transition-colors cursor-default"
                >
                  {chip}
                </span>
              ))}
            </div>

            <button 
              onClick={onLaunchTerminal}
              className="mt-4 inline-flex items-center gap-2 text-sm text-white hover:text-cyan-300 font-semibold transition-all group"
            >
              <span>Explore dynamic trading terminal</span>
              <ArrowUpRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </motion.div>

          {/* Right: Live Ticker Panel Grid */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="liquid-glass rounded-2xl p-5 md:p-6 space-y-4 text-left"
            id="index-panel-col"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-xs font-semibold text-white/60 font-mono uppercase tracking-wide">Live Multi-Asset Indexes</span>
              <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            </div>

            {/* Simulated Live Index items */}
            {[
              { symbol: "NIFTY 50", price: "23,485.40", change: "+1.24%", isPositive: true, category: "INDIA SEC" },
              { symbol: "SENSEX", price: "77,120.50", change: "+1.10%", isPositive: true, category: "INDIA SEC" },
              { symbol: "USD / INR", price: "83.452", change: "-0.15%", isPositive: false, category: "FOREX CURR" },
              { symbol: "EUR / USD", price: "1.0854", change: "+0.32%", isPositive: true, category: "FOREX CURR" }
            ].map((idxObj, idx) => (
              <motion.div 
                whileHover={{ scale: 1.01, x: 2 }}
                onClick={onLaunchTerminal}
                key={idxObj.symbol}
                className="liquid-glass rounded-lg p-3 flex items-center justify-between gap-4 border border-white/5 cursor-pointer bg-white/[0.01] hover:bg-white/[0.03]"
                id={`market-index-card-${idx}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${idxObj.isPositive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <div>
                    <div className="text-xs font-bold text-white mb-0.5">{idxObj.symbol}</div>
                    <div className="text-[10px] text-white/40 font-mono tracking-wider">{idxObj.category}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-white">{idxObj.price}</div>
                  <div className={`text-[10px] font-mono font-semibold ${idxObj.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {idxObj.change}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Assistant section */}
      <section className="relative z-20 max-w-6xl mx-auto px-6 py-20 border-t border-white/5" id="section-ai">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Stateful Interactive AI Chat */}
          <div id="homepage-interactive-ai-chat">
            <HomepageAIChat />
          </div>

          {/* AI Info details */}
          <div className="text-left space-y-6">
            <SectionEyebrow label="Live NOVA AI Analyst" tag="Advanced-AI-Engine" />
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.05]">
              Real-time Indian Market Intelligence.
            </h2>
            <p className="text-white/60 text-base leading-[1.6]">
              Ask NOVA anything about Indian stock markets. Our system links advanced AI analyst pipelines server-side with live ticker databases to evaluate price action, RSI strengths, moving average overlaps, and news sentiment with institutional clarity.
            </p>

            <ul className="space-y-3">
              {[
                "Context-grounded natural language conversations",
                "Instant algorithmic sentiment and indicators analysis",
                "Dynamic support and resistance detection",
                "Comparison of Indian assets with live matrix tables"
              ].map((point) => (
                <li key={point} className="flex items-center gap-2.5 text-xs text-white/80">
                  <div className="w-5 h-5 rounded-full bg-cyan-950 flex items-center justify-center text-cyan-400 flex-shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={onLaunchTerminal}
              className="px-6 py-3 rounded-full text-xs font-bold bg-[#3D81E3] text-white hover:bg-[#3D81E3]/80 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-[#3D81E3]/20"
            >
              <span>Launch Market Terminal</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* Educational Academy section */}
      <section className="relative z-20 max-w-6xl mx-auto px-6 py-20 border-t border-white/5" id="section-learn">
        <div className="text-center max-w-xl mx-auto mb-16">
          <SectionEyebrow label="Learning Academy" tag="Investor Path" />
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white mt-4">
            Practical investing education.
          </h2>
          <p className="text-sm text-white/50 mt-2">
            Structured modules from technical candlestick foundations to quantitative algorithms.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6" id="academy-preview-grid">
          {[
            {
              level: "Beginner",
              title: "Market Fundamentals",
              desc: "Learn stock market basics, index operations (NSE/BSE), and basic risk management parameters.",
              icon: Globe,
              accent: "text-cyan-400"
            },
            {
              level: "Intermediate",
              title: "Technical Analysis",
              desc: "Master candlestick charts, support/resistance zones, trend indicators, and trading strategies.",
              icon: BookOpen,
              accent: "text-[#3D81E3]"
            },
            {
              level: "Advanced",
              title: "Quant & Psychology",
              desc: "Dive into quantitative portfolio allocations, risk scoring, and trading psychology templates.",
              icon: Layers,
              accent: "text-emerald-400"
            }
          ].map((course, idx) => (
            <motion.div 
              whileHover={{ y: -6 }}
              key={idx}
              onClick={onLaunchTerminal}
              className="liquid-glass rounded-2xl p-6 flex flex-col justify-between text-left cursor-pointer hover:border-cyan-500/30 transition-all duration-300 bg-white/[0.01]"
              id={`academy-course-card-${idx}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-white/5 text-white/50 uppercase tracking-widest">
                    {course.level}
                  </span>
                  <course.icon className={`w-5 h-5 ${course.accent}`} />
                </div>
                
                <h3 className="text-base font-bold text-white mb-2">{course.title}</h3>
                <p className="text-xs text-white/50 leading-[1.6]">{course.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-semibold text-cyan-400">
                <span>Start Learning Path</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>



      {/* Final Call To Action */}
      <section className="relative z-20 max-w-6xl mx-auto px-6 py-20 md:py-32" id="section-cta">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-16 md:py-24 text-center border border-white/5"
          id="final-cta-container"
        >
          {/* Glowing background gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_50%_0%,rgba(34,211,238,0.12),transparent_70%)] opacity-80 pointer-events-none" />

          <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.02]">
            Rule the charts. <br />
            Rule your portfolio.
          </h2>
          
          <p className="mt-6 text-white/60 max-w-lg mx-auto text-sm md:text-base leading-[1.6]">
            Join thousands of active investors who utilize MarketVerse India for live asset indexing, tech analyses, and server-side intelligence layers.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={onLaunchTerminal}
              className="rounded-full bg-white text-black font-semibold text-sm px-6 py-3.5 hover:bg-neutral-200 transition-all cursor-pointer shadow-lg"
            >
              Launch Dashboard Terminal
            </button>
            <button 
              onClick={onLaunchTerminal}
              id="btn-learn-academy-cta"
              className="rounded-full border border-white/15 text-white text-sm font-medium px-6 py-3.5 hover:bg-white/5 active:scale-95 cursor-pointer transition-all flex items-center gap-1"
            >
              <span>Explore Academy</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/5 py-8 text-center text-xs text-white/30 font-mono">
        <p>© 2026 MarketVerse India Intelligence Inc. All rights reserved.</p>
      </footer>
    </div>
  );
};
