import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MarketVerseLanding, LogoMark } from "./components/AuraLanding";
import { MarketTerminal } from "./components/MarketTerminal";
import { StockDetail } from "./components/StockDetail";
import { FloatingAIAssistant } from "./components/FloatingAIAssistant";
import { FullScreenAIWorkspace } from "./components/FullScreenAIWorkspace";
import { MarketRadar } from "./components/MarketRadar";
import { CustomCursor } from "./components/CustomCursor";

export default function App() {
  const [route, setRoute] = useState<string>(() => {
    return window.location.pathname || "/";
  });

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("marketverse_watchlist");
      return stored ? JSON.parse(stored) : ["RELIANCE", "TATAMOTORS", "HDFCBANK"];
    } catch {
      return ["RELIANCE", "TATAMOTORS", "HDFCBANK"];
    }
  });

  useEffect(() => {
    localStorage.setItem("marketverse_watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname || "/");
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const navigate = (path: string) => {
    window.history.pushState(null, "", path);
    setRoute(path);
    // Smoothly scroll back to top of terminal on page transitions
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleWatchlist = (symbol: string) => {
    const sym = symbol.toUpperCase();
    setWatchlist((prev) => 
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  // Determine active view from current pathname
  const isAuraRoute = route === "/" || route === "/aura";
  const isAIRoute = route === "/ai";
  const isBullishRoute = route === "/market/bullish";
  const isBearishRoute = route === "/market/bearish";
  const isStockRoute = route.startsWith("/stock/");

  return (
    <div className="min-h-screen bg-[#060608] text-white flex flex-col">
      {!isAuraRoute && (
        <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo and branding identical to the landing page */}
            <div 
              className="flex items-center gap-3 cursor-pointer transition-all duration-300 hover:scale-[1.05] hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" 
              onClick={() => navigate("/")} 
              id="global-header-brand"
            >
              <LogoMark className="w-6 h-6 text-[#22d3ee] hover:text-[#22d3ee]/80 transition-colors" />
              <span className="text-md font-black tracking-widest bg-gradient-to-r from-white via-[#3D81E3] to-white/70 bg-clip-text text-transparent font-sans">
                MARKETVERSE INDIA
              </span>
            </div>

            {/* Center navigation links on non-aura routes */}
            <div className="hidden md:flex items-center gap-6" id="global-header-nav-links">
              {[
                { name: 'Dashboard', path: '/dashboard' },
                { name: 'Indian Market', path: '/stocks' },
                { name: 'NOVA AI', path: '/ai' },
                { name: 'News', path: '/news' },
                { name: 'Learn', path: '/learn' }
              ].map((item) => {
                const isActive = route === item.path || (item.path === "/stocks" && (route === "/stocks" || route.startsWith("/stock/")));
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.path)}
                    className={`text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer bg-transparent border-none outline-none ${
                      isActive ? "text-[#22d3ee] font-black" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>

            {/* Premium live status indicator in place of old cash displays */}
            {(() => {
              const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
              return (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                  isWeekend 
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isWeekend ? "bg-amber-500" : "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  }`} />
                  <span className="text-[10px] font-mono tracking-widest font-bold uppercase">
                    {isWeekend ? "MARKET CLOSED (WEEKEND)" : "LIVE TERMINAL FEED ACTIVE"}
                  </span>
                </div>
              );
            })()}
          </div>
        </header>
      )}

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full h-full"
          >
            {isAuraRoute ? (
              <MarketVerseLanding onLaunchTerminal={() => navigate("/dashboard")} onNavigate={navigate} />
            ) : isAIRoute ? (
              <FullScreenAIWorkspace onNavigate={navigate} />
            ) : isBullishRoute ? (
              <MarketRadar mode="bullish" onNavigate={navigate} />
            ) : isBearishRoute ? (
              <MarketRadar mode="bearish" onNavigate={navigate} />
            ) : isStockRoute ? (
              <div className="max-w-6xl mx-auto px-6 py-10">
                <StockDetail 
                  symbol={route.split("/stock/")[1]?.toUpperCase() || "RELIANCE"} 
                  onBack={() => navigate("/dashboard")}
                  onToggleWatchlist={handleToggleWatchlist}
                  isInWatchlist={watchlist.includes(route.split("/stock/")[1]?.toUpperCase() || "")}
                />
              </div>
            ) : (
              <MarketTerminal 
                currentRoute={route} 
                onNavigate={navigate} 
                watchlist={watchlist} 
                onToggleWatchlist={handleToggleWatchlist} 
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <FloatingAIAssistant currentRoute={route} />
      <CustomCursor />
    </div>
  );
}
