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
              <span className="text-xs font-black tracking-widest text-white uppercase font-sans">Legal & Privacy</span>
            </div>

            <nav className="space-y-1" id="legal-nav">
              {[
                { id: "terms", label: "Terms of Service", icon: FileText },
                { id: "sebi", label: "Financial Risk Notice", icon: ShieldAlert },
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
            UPDATED 5 OCTOBER 2026
          </div>
        </div>

        {/* Right Content View */}
        <div className="flex-1 flex flex-col h-full bg-[#080B12]/30" id="legal-content">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {activeTab === "terms" && "Terms of Service & Platform Agreement"}
              {activeTab === "sebi" && "Financial risk & educational-use notice"}
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
                    MarketVerse India is an educational, research, and trading-simulation project. We do not handle real trading funds, accept capital deposits, or execute brokerage orders. Virtual portfolios, balances (including the default ₹10,00,000 paper account), and simulated fills do not establish real asset ownership or future trading performance.
                  </p>
                  <p>
                    The platform is provided as available, without guaranteed uptime, continued access, data accuracy, or uninterrupted provider integrations. Simulated prices and fills may differ from exchange execution. Features and service availability may change or stop; revisions to these terms will update the date shown here and the repository Terms of Use.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">2. Account Responsibility & Terminal Usage</h4>
                  <p>
                    Protect your account credentials. Do not attempt unauthorized access, bypass access restrictions, distribute malicious content, or use automated requests or scraping that disrupt the demo or exhaust provider capacity. Use only data you are authorized to submit. Access may be limited or withdrawn to prevent abuse or service degradation. Authentication on the current public deployment is intentionally restricted to the project owner's authorized account; external visitors are not currently provided account access. This is a demo limitation, not an indication that login is broken.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">3. Intellectual Property & Creator Attribution</h4>
                  <p>
                    MarketVerse India is maintained by Jesvin M Mathew. The repository's MIT license permits use, copying, modification, and redistribution of covered software, including commercial use, subject to its copyright and license notice requirements. These application-use terms do not remove those permissions.
                  </p>
                  <p>
                    Third-party packages, market data, embedded charts, authentication providers, and AI services retain their own licenses and terms. The MIT license does not grant rights over their content. External links and integrations are not endorsements or guarantees of content, availability, or security. See the repository LICENSE for source-code permissions and TERMS.md for application-use conditions.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">4. Limitation of Liability</h4>
                  <p>
                    To the extent permitted by applicable law, the application and its content are provided without warranties of accuracy, fitness for a particular purpose, or uninterrupted availability. MarketVerse and its maintainer are not responsible for losses from reliance on simulation data, indicators, AI content, or third-party services, including real trading losses, fees, or taxes. Users remain responsible for their financial decisions. Nothing here excludes liability or rights that applicable law does not permit to be excluded.
                  </p>
                </section>
              </div>
            )}

            {/* SEBI & Market Risk Disclosure */}
            {activeTab === "sebi" && (
              <div className="space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-mono text-[10px] uppercase leading-relaxed space-y-1">
                  <span className="font-bold block text-xs">⚠️ Financial Risk Warning:</span>
                  <p>
                    Real-money trading, particularly leveraged and derivatives trading, can cause substantial losses. Simulated success does not guarantee real-world results. MarketVerse provides no financial advice, buy/sell recommendations, guaranteed returns, or guaranteed predictions.
                  </p>
                </div>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">SEBI Non-Registered Entity Declaration</h4>
                  <p>
                    MarketVerse India is not a SEBI-registered investment adviser, research analyst, portfolio manager, or stock broker, and does not act as an exchange or financial institution. The platform is for educational, research, and trading-simulation purposes only. Use creates no investment advisory relationship. These disclosures do not establish regulatory approval or security certification.
                  </p>
                  <p>
                    Market views, indicators, and NOVA summaries may use third-party, delayed, cached, simulated, seeded, or fallback/demo data. They must never be interpreted as buy/sell recommendations or investment advisory guidance. Displayed timestamps describe when information was produced or updated, not guaranteed exchange freshness. Consult a qualified, registered financial adviser before making real financial decisions.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Algorithmic & Technical Analysis Disclosures</h4>
                  <p>
                    Indicators, rankings, and health/risk scores include heuristics and simplified calculations, not calibrated probabilities or independently validated forecasts. NOVA uses Google Gemini on supported routes and may return templates or heuristic responses when inference is unavailable. Structured analysis and general chat follow different context paths. AI output can be incorrect or incomplete, including when it sounds certain. MarketVerse has not built its own foundation model.
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
                    Authentication uses Supabase and, when selected, Google sign-in. Account information can include your email address, display name, and avatar to support sign-in and your profile. This application does not request access to private Google contacts or files. Portfolio and trading state are browser-local rather than a cloud brokerage ledger.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">2. Strictly Zero-Resale Data Policy</h4>
                  <p>
                    MarketVerse India does not sell, rent, lease, or distribute your email address, portfolio history, or NOVA conversation records to advertisers, market makers, or stock brokers. This does not exclude processing by authentication, hosting, or AI service providers needed to operate the application. Their applicable terms govern that processing; no security certification is claimed.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">3. Gemini API Data Transmission</h4>
                  <p>
                    NOVA requests are sent through the MarketVerse server, which may forward prompts and relevant conversation/context to Google Gemini. Google's applicable service terms and deployment configuration govern processing; paid and unpaid services have different data-use conditions. We do not promise that every plan excludes model improvement or human review. Do not submit credentials or sensitive, confidential, or personal information to NOVA. See <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">Google's Gemini API terms</a> for current conditions.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">4. Local Storage & Preferences Cache</h4>
                  <p>
                    Browser storage retains authentication/session information, interface preferences, and local account state such as simulated holdings and chat history. Signed-in portfolio/trading state uses account-scoped local storage; guest state uses session storage. Clearing browser storage may remove local records. This is not guaranteed backup or cross-device portfolio storage.
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
                    MarketVerse uses browser storage for sign-in sessions, interface preferences, simulated holdings, and saved preference choices. Embedded third-party services may use their own cookies or storage under their own policies; these controls do not manage those services.
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
                          Browser storage supports sign-in and local preferences. You can clear or block storage in your browser, but doing so may sign you out, reset preferences, or remove locally stored records.
                        </p>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold">Used by app</span>
                    </div>

                    {/* Non-essential Toggle */}
                    <div className="flex items-start justify-between bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-white block">Analytics Preference (Optional)</span>
                        <p className="text-[9.5px] text-white/40 leading-normal">
                          This control saves your analytics preference in this browser. The current application does not connect it to an analytics collection service. It does not control third-party embeds or provider processing.
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
