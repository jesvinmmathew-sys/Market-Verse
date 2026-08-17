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
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" 
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
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">1. Platform & Simulated Execution Agreement</h4>
                  <p>
                    MarketVerse India operates exclusively as a simulated financial analytics and educational paper trading terminal. We do **not** handle real money, capital deposits, or execute actual orders in Indian equity, commodity, or derivatives markets. All virtual portfolios, demo balances (including the default ₹10,00,000 demo paper account), and execution telemetry are entirely simulated for training and backtesting purposes. 
                  </p>
                  <p>
                    The platform does not guarantee continuous, uninterrupted system uptime. Simulated rates, order fills, and queue executions on the virtual ledger may experience latency deviations from live exchange feeds. Users acknowledge that simulated success does not correlate to future performance in real-money brokerages.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">2. Account Responsibility & Terminal Usage</h4>
                  <p>
                    Users are solely responsible for securing their terminal credentials. By accessing the terminal, you agree not to deploy automated malicious scripts, scraping algorithms, or high-frequency automated telemetry queries that might degrade server bandwidth or active API keys. MarketVerse reserves the right to gate, limit, or revoke terminal access to prevent systemic degradation.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">3. Intellectual Property & Creator Attribution</h4>
                  <p>
                    The MarketVerse India ecosystem, including the Nova AI intelligence framework, quantitative chart analytics models, custom indicators, and overall interface architecture is the sole proprietary property of and was built from the ground up by founder and lead architect **Jesvin M Mathew**. 
                  </p>
                  <p>
                    All rights are reserved globally. Any unauthorized duplication, reverse engineering, scraping of proprietary calculations, or commercial redistribution of these assets without the express written consent of Jesvin M Mathew is strictly prohibited and subject to legal prosecution.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">4. Limitation of Liability</h4>
                  <p>
                    Under no circumstances shall MarketVerse India, its founder Jesvin M Mathew, or its affiliates be held liable for any real financial losses, gains, brokerage fees, or taxes incurred by users practicing on the simulated trading desk or applying recommendations generated by the Nova AI model in external live trading accounts.
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
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">SEBI Non-Registered Entity Declaration</h4>
                  <p>
                    MarketVerse India is **not** a SEBI-registered investment advisor (RIA), research analyst, portfolio manager, or stock broker. The platform is designed solely for educational, research, and technical analysis training purposes. 
                  </p>
                  <p>
                    All quantitative signals, candlestick scoring meters, SWOT parameters, option chain Greeks calculations, and Nova AI summaries are purely theoretical indicators calculated from live market feeds. They must **never** be interpreted as buy/sell recommendations or official investment advisory guidance. Consult a registered financial planner before committing real capital to Dalal Street.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Algorithmic & Technical Analysis Disclosures</h4>
                  <p>
                    Any automated patterns, support/resistance lines, and intelligence scores generated by Nova AI are statistical assessments of historical and current market trends. Algorithmic outputs are subject to processing delays, errors in raw ticker feeds, and computational volatility.
                  </p>
                </section>
              </div>
            )}

            {/* Privacy Policy */}
            {activeTab === "privacy" && (
              <div className="space-y-4">
                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">1. Data Processing & Google OAuth Scope</h4>
                  <p>
                    When accessing the terminal using Google 1-Click OAuth, we collect and store only necessary identifier telemetry: email address, verified display name, and avatar profile picture. We use this scope solely to construct your personalized virtual trading profile and maintain your secure ledger state. We do **not** request or access your private Google contacts, files, or external account telemetry.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">2. Strictly Zero-Resale Data Policy</h4>
                  <p>
                    We protect your personal data with institutional-grade protocols. MarketVerse India does **not** sell, rent, lease, or distribute your email addresses, portfolio performance history, simulated F&O holdings, or conversation records with Nova AI to third-party advertisers, market makers, or stock brokers.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">3. Gemini API Data Transmission</h4>
                  <p>
                    When queries are sent to Nova AI, raw prompt inputs and historical messages are encrypted and securely sent directly to Google Gemini API servers. These transmissions are executed over enterprise API keys and are subject to Google's strict corporate privacy terms (which state that prompt queries sent via API endpoints are not used to train generative AI foundation models).
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">4. Local Storage & Preferences Cache</h4>
                  <p>
                    The platform caches essential interface states locally in your browser (theme selection `marketverse_theme`, and glassmorphism levels `marketverse_transparency`) to optimize visual rendering speeds and conserve bandwidth.
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
