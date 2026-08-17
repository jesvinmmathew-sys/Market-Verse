import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShieldAlert, FileText, Lock, Cookie, Scale } from "lucide-react";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "terms" | "sebi" | "privacy" | "cookies";
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = "terms"
}) => {
  const [activeTab, setActiveTab] = useState<"terms" | "sebi" | "privacy" | "cookies">(initialTab);

  // Manage non-essential analytical cookies state
  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean>(() => {
    return localStorage.getItem("marketverse_analytics_cookies") !== "disabled";
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Escape key close listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleAnalytics = (enabled: boolean) => {
    setAnalyticsEnabled(enabled);
    localStorage.setItem("marketverse_analytics_cookies", enabled ? "enabled" : "disabled");
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" 
      onClick={onClose}
      id="legal-modal-overlay"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="liquid-glass rounded-2xl max-w-3xl w-full border border-white/10 bg-[#0B0F19] flex flex-col md:flex-row h-[75vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        id="legal-modal-box"
      >
        {/* Left Sidebar Tabs */}
        <div className="w-full md:w-56 border-r border-white/5 bg-[#06080F]/40 flex flex-col justify-between shrink-0" id="legal-sidebar">
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 px-2 py-1">
              <Scale className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-black tracking-widest text-white uppercase font-sans">Compliance Hub</span>
            </div>

            <nav className="space-y-1" id="legal-nav">
              {[
                { id: "terms", label: "Terms of Service", icon: FileText },
                { id: "sebi", label: "SEBI & Risk Notice", icon: ShieldAlert },
                { id: "privacy", label: "Privacy Policy", icon: Lock },
                { id: "cookies", label: "Cookie Policy", icon: Cookie }
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full text-left text-[10.5px] font-bold uppercase tracking-wider px-3 py-2.5 rounded-lg transition-all flex items-center gap-2.5 cursor-pointer ${
                      isActive 
                        ? "text-cyan-400 bg-white/[0.04] border-l-2 border-cyan-400 pl-2" 
                        : "text-white/40 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                    }`}
                  >
                    <TabIcon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-white/40"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="p-4 border-t border-white/5 bg-[#06080F]/20 text-[9px] text-white/30 font-mono text-center">
            LEGAL ARCHIVE V1.2
          </div>
        </div>

        {/* Right Content View */}
        <div className="flex-1 flex flex-col h-full bg-[#080B12]/30" id="legal-content">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {activeTab === "terms" && "Terms of Service & Platform Agreement"}
              {activeTab === "sebi" && "SEBI risk disclosures & market risk warning"}
              {activeTab === "privacy" && "Privacy Policy & Data Transparency"}
              {activeTab === "cookies" && "Cookie & Preference Settings"}
            </h2>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all cursor-pointer border border-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-white/70 leading-relaxed text-left font-sans">
            
            {/* Terms of Service */}
            {activeTab === "terms" && (
              <div className="space-y-4">
                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">1. Simulated Paper Trading Disclaimer</h4>
                  <p>
                    MarketVerse India operates exclusively as a simulated financial analytics and educational paper trading terminal. We do **not** handle real money, capital deposits, or execute actual orders in Indian equity, commodity, or derivatives markets. MarketVerse is **not** a SEBI-registered investment advisor, portfolio manager, or stock broker. All virtual portfolios, demo balances, and execution telemetry are entirely simulated for training purposes.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">2. Intellectual Property & Ownership</h4>
                  <p>
                    The MarketVerse India ecosystem, including the Nova AI intelligence framework, quantitative chart analytics models, custom indicators, and overall interface architecture is the sole proprietary property of and was built from the ground up by founder and lead architect **Jesvin M Mathew**. Unauthorized duplication, reverse engineering, or commercial redistribution of these assets is strictly prohibited.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">3. Account Responsibility & Security</h4>
                  <p>
                    Users are solely responsible for securing their terminal credentials. By accessing the terminal, you agree not to deploy automated malicious scripts, scraping algorithms, or high-frequency automated telemetry queries that might degrade server bandwidth or active API keys.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">4. Limitation of Liability</h4>
                  <p>
                    Under no circumstances shall MarketVerse India, its founder Jesvin M Mathew, or its affiliates be held liable for any real financial losses, gains, or taxes incurred by users practicing on the simulated trading desk or applying recommendations generated by the Nova AI model in external live trading accounts.
                  </p>
                </section>
              </div>
            )}

            {/* SEBI & Market Risk Disclosure */}
            {activeTab === "sebi" && (
              <div className="space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-mono text-[10px] uppercase leading-relaxed space-y-1">
                  <span className="font-bold block text-xs">⚠️ Statutory SEBI Warning Notice:</span>
                  <p>
                    9 out of 10 retail traders in equity Futures & Options (F&O) segment incur net financial losses. On average, loss-makers registered a net trading loss of approximately ₹50,000. Over and above these transaction expenses, loss-makers incurred an additional 15% in transaction costs.
                  </p>
                </div>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Educational Analytics Purpose</h4>
                  <p>
                    All quantitative signals, candlestick scoring meters, SWOT parameters, option chain Greeks calculations, and Nova AI summaries are purely theoretical indicators calculated from live market feeds. They must **never** be interpreted as buy/sell recommendations or official investment advisory guidance. Consult a registered financial planner before committing real capital to Dalal Street.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Volatility & Execution Risk</h4>
                  <p>
                    Indian stock markets are subject to high volatility, liquidity risks, gaps, and technical connectivity issues. Simulated execution on the demat ledger may not precisely capture slippage, brokerage charges, tax margins, STT, or actual order book depth.
                  </p>
                </section>
              </div>
            )}

            {/* Privacy Policy */}
            {activeTab === "privacy" && (
              <div className="space-y-4">
                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Data Privacy Guarantee</h4>
                  <p>
                    We protect your personal data with institutional-grade protocols. MarketVerse India does **not** sell, rent, or lease your account details, email addresses, simulated portfolio holdings, or transaction logs to third-party advertisers or brokers.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Gemini API Data Transmission</h4>
                  <p>
                    When queries are sent to Nova AI, raw prompt inputs and historical messages are encrypted and securely sent directly to Google Gemini API servers. These transmissions are executed over enterprise API keys and are subject to Google's strict corporate privacy terms (which state that prompt queries sent via API endpoints are not used to train generative AI foundation models).
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Telemetry Collection</h4>
                  <p>
                    We collect minimal anonymized crash logs and system loading parameters solely to maintain high availability and optimize charting canvas performance on low-spec hardware.
                  </p>
                </section>
              </div>
            )}

            {/* Cookie & Telemetry Preference Settings */}
            {activeTab === "cookies" && (
              <div className="space-y-5">
                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">How MarketVerse Uses Cookies</h4>
                  <p>
                    MarketVerse uses local cookies and browser local storage cache items to keep you signed in, persist custom layout styles, and retain terminal theme, glassmorphism transparency settings, and mock portfolio ledgers.
                  </p>
                </section>

                <div className="space-y-4 border-t border-white/5 pt-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Cookie Control Settings</h4>
                  
                  <div className="space-y-3">
                    {/* Essential Cookies Info */}
                    <div className="flex items-start justify-between bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-white block">Essential Session Storage (Required)</span>
                        <p className="text-[9.5px] text-white/40 leading-normal">
                          Required for core authentication states, theme choices (`marketverse_theme`), and custom glassmorphism levels (`marketverse_transparency`). Cannot be disabled.
                        </p>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold">Always Active</span>
                    </div>

                    {/* Non-essential Toggle */}
                    <div className="flex items-start justify-between bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-white block">Analytical Performance Telemetry (Optional)</span>
                        <p className="text-[9.5px] text-white/40 leading-normal">
                          Permits the terminal to record system loading performance, chart latency values, and general platform metrics. No personal data is stored.
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 rounded-lg border border-white/5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleAnalytics(true)}
                          className={`px-2 py-1 text-[9px] font-mono font-bold uppercase rounded transition-all cursor-pointer ${
                            analyticsEnabled 
                              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25" 
                              : "text-white/30 hover:text-white"
                          }`}
                        >
                          Enable
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAnalytics(false)}
                          className={`px-2 py-1 text-[9px] font-mono font-bold uppercase rounded transition-all cursor-pointer ${
                            !analyticsEnabled 
                              ? "bg-red-500/10 text-red-400 border border-red-500/25" 
                              : "text-white/30 hover:text-white"
                          }`}
                        >
                          Disable
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </motion.div>
    </div>
  );
};
