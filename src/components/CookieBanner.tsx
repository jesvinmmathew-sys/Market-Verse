import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cookie, X } from "lucide-react";

interface CookieBannerProps {
  onCustomize: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onCustomize }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("marketverse_cookie_consent");
    if (!consent) {
      // Small delay to make entrance elegant
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("marketverse_cookie_consent", "accepted");
    localStorage.setItem("marketverse_analytics_cookies", "enabled");
    setIsVisible(false);
  };

  const handleDeclineNonEssential = () => {
    localStorage.setItem("marketverse_cookie_consent", "declined");
    localStorage.setItem("marketverse_analytics_cookies", "disabled");
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("marketverse_cookie_consent", "essential");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="fixed bottom-6 right-6 md:right-8 z-50 max-w-sm w-full p-5 rounded-2xl liquid-glass-card border border-white/10 backdrop-blur-xl shadow-2xl text-left space-y-4"
        id="cookie-consent-banner"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Cookie className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">Cookie Preferences</h4>
            <p className="text-[10px] text-white/50 leading-relaxed font-sans">
              MarketVerse uses essential cookies and local storage to persist your terminal theme, glassmorphism levels, and simulated paper trading session.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1 font-sans">
          <button
            onClick={handleAcceptAll}
            className="w-full py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center cursor-pointer"
          >
            Accept All & Continue
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onCustomize}
              className="py-1.5 px-3 border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-white/70 hover:text-white text-[9.5px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center"
            >
              Customize
            </button>
            <button
              onClick={handleDeclineNonEssential}
              className="py-1.5 px-3 border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-white/70 hover:text-white text-[9.5px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center"
            >
              Decline
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="absolute top-1.5 right-1.5 p-1 text-white/30 hover:text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5 transition-all cursor-pointer"
          aria-label="Close Banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
