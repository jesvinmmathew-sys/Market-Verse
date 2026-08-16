import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme, ThemeType, GlowIntensity, BlurStrength } from "../context/ThemeContext";
import { 
  X, 
  Settings, 
  Palette, 
  ShieldAlert, 
  Info, 
  Check, 
  User, 
  Camera, 
  Trash2,
  Loader2,
  Mail
} from "lucide-react";
import { supabase } from "../supabaseClient";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onAuthSuccess: (user: any) => void;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  initialTab?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user: propUser,
  onAuthSuccess,
  onLogout,
  onNavigate,
  initialTab = "appearance"
}) => {
  const { 
    theme, 
    setTheme, 
    glowIntensity, 
    setGlowIntensity, 
    blurStrength, 
    setBlurStrength,
    transparencyLevel,
    setTransparencyLevel
  } = useTheme();

  // Normalize initialTab since we only support: general, appearance, about
  const normalizedTab = initialTab === "trading" || initialTab === "api" ? "appearance" : initialTab;
  const [activeTab, setActiveTab] = useState<string>(normalizedTab);

  // Sync tab choice when reopened
  useEffect(() => {
    if (isOpen) {
      const normalized = initialTab === "trading" || initialTab === "api" ? "appearance" : initialTab;
      setActiveTab(normalized);
    }
  }, [isOpen, initialTab]);

  // User metadata states
  const [user, setUser] = useState<any>(propUser);
  const [fullName, setFullName] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile Picture Upload states
  const [customPfp, setCustomPfp] = useState<string | null>(() => {
    return localStorage.getItem("marketverse_user_pfp");
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync user state
  useEffect(() => {
    if (propUser) {
      setUser(propUser);
      setFullName(propUser.user_metadata?.full_name || "");
    }
  }, [propUser]);

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

  // Handle local Base64 profile upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size must be smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCustomPfp(base64);
        localStorage.setItem("marketverse_user_pfp", base64);
        window.dispatchEvent(new Event("marketverse_pfp_updated"));
        setSuccessMsg("Custom profile avatar loaded successfully.");
        setTimeout(() => setSuccessMsg(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetPfp = () => {
    setError(null);
    setCustomPfp(null);
    localStorage.removeItem("marketverse_user_pfp");
    window.dispatchEvent(new Event("marketverse_pfp_updated"));
    setSuccessMsg("Profile avatar reset to initials.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const getInitials = () => {
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return fullName.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "TR";
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (!user) {
        setError("You must be logged in to update your profile.");
        setSaveLoading(false);
        return;
      }

      // We update full name to Supabase
      const { data, error: updateErr } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim()
        }
      });

      if (updateErr) throw updateErr;

      if (data.user) {
        localStorage.setItem("supabase_user", JSON.stringify(data.user));
        onAuthSuccess(data.user);
        setSuccessMsg("Account profile details updated successfully.");
        window.dispatchEvent(new Event("aura_profile_updated"));
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An error occurred while saving your changes.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" 
      onClick={onClose}
      id="settings-modal-overlay"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="liquid-glass rounded-2xl max-w-4xl w-full border border-white/10 bg-[#0B0F19] flex flex-col md:flex-row h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        id="settings-modal-box"
      >
        {/* Left Sidebar navigation */}
        <div className="w-full md:w-64 border-r border-white/5 bg-[#06080F]/40 flex flex-col justify-between shrink-0" id="settings-sidebar">
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 px-2 py-1">
              <Settings className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-black tracking-widest text-white uppercase font-sans">Settings Panel</span>
            </div>

            <nav className="space-y-1" id="settings-nav">
              {[
                { id: "general", label: "Profile & Account", icon: User },
                { id: "appearance", label: "Appearance & Glass", icon: Palette },
                { id: "about", label: "About MarketVerse", icon: Info }
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className={`w-full text-left text-[11px] font-bold uppercase tracking-wider px-3 py-2.5 rounded-lg transition-all flex items-center gap-2.5 cursor-pointer ${
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

          <div className="p-4 border-t border-white/5 flex flex-col gap-2 bg-[#06080F]/20">
            {user ? (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                  onNavigate("/");
                }}
                className="w-full py-2 px-3 border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Logout Session</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onNavigate("/auth");
                }}
                className="w-full py-2 px-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Access Terminal</span>
              </button>
            )}
            <p className="text-[8px] text-white/20 text-center font-mono">MarketVerse v2.4 · NSE Live Feed</p>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 flex flex-col h-full bg-[#080B12]/30" id="settings-content">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {activeTab === "general" && "Profile & Account Management"}
              {activeTab === "appearance" && "Appearance & Glassmorphism Customizer"}
              {activeTab === "about" && "About MarketVerse India"}
            </h2>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all cursor-pointer border border-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Success & Error alerts */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium animate-fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium animate-fade-in">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Profile & Account Tab */}
            {activeTab === "general" && (
              <form onSubmit={handleSaveProfile} className="space-y-6 text-left">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  
                  {/* Custom Profile Picture Upload Section */}
                  <div className="space-y-3 shrink-0 w-full sm:w-44 flex flex-col items-center">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block text-center">Profile Image</label>
                    
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-full border border-white/10 overflow-hidden bg-[#06080F] flex items-center justify-center text-white text-2xl font-bold shadow-inner relative group cursor-pointer hover:border-cyan-400 transition-all"
                    >
                      {customPfp ? (
                        <img src={customPfp} alt="Avatar" className="w-full h-full object-cover" />
                      ) : user?.user_metadata?.avatar_url && !user.user_metadata.avatar_url.startsWith("linear-gradient") ? (
                        <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center font-bold text-white text-lg">
                          {getInitials()}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex flex-col gap-1.5 w-full">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-1.5 border border-cyan-500/20 hover:border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Upload Avatar</span>
                      </button>
                      {customPfp && (
                        <button
                          type="button"
                          onClick={handleResetPfp}
                          className="w-full py-1 border border-white/5 hover:border-white/10 bg-white/[0.02] text-white/40 hover:text-white text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Reset to Default</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Fields */}
                  <div className="flex-1 w-full space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Email Address (Verified)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/25">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          disabled
                          value={user?.email || ""}
                          className="block w-full pl-9 pr-3 py-2 text-xs bg-white/[0.02] border border-white/5 text-white/40 rounded-xl outline-none cursor-not-allowed select-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block" htmlFor="settings-fullname-input">Display Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                          <User className="w-4 h-4 text-cyan-400" />
                        </div>
                        <input
                          id="settings-fullname-input"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="block w-full pl-9 pr-3 py-2.5 text-xs bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all font-sans"
                          placeholder="Enter display name"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Account Tier</span>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Active Trader · Professional Tier</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={saveLoading}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/10 cursor-pointer disabled:opacity-50"
                    >
                      {saveLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Profile...</span>
                        </>
                      ) : (
                        <span>Save Account Changes</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="space-y-6 text-left">
                {/* 5 Dark Presets Swatches Grid */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider block">Terminal UI Presets</h3>
                    <p className="text-[10px] text-white/40 mt-0.5">Switch between 5 polished dark institutional-grade color palettes.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {[
                      {
                        id: "obsidian",
                        name: "Obsidian Space",
                        bg: "#06080F",
                        card: "rgba(15, 23, 42, 0.65)",
                        accent: "#10b981",
                        description: "Deep Onyx Default"
                      },
                      {
                        id: "cyber-emerald",
                        name: "Matrix Neon",
                        bg: "#020b05",
                        card: "rgba(6, 35, 19, 0.7)",
                        accent: "#00ff88",
                        description: "Electric Neon Green"
                      },
                      {
                        id: "bloomberg-amber",
                        name: "Bloomberg",
                        bg: "#0a0d14",
                        card: "rgba(20, 26, 38, 0.75)",
                        accent: "#f59e0b",
                        description: "Institutional Amber"
                      },
                      {
                        id: "midnight-slate",
                        name: "Midnight Slate",
                        bg: "#0f172a",
                        card: "rgba(30, 41, 59, 0.7)",
                        accent: "#38bdf8",
                        description: "Icy Blue Slate"
                      },
                      {
                        id: "tokyo-crimson",
                        name: "Tokyo Crimson",
                        bg: "#0e0a12",
                        card: "rgba(32, 20, 43, 0.75)",
                        accent: "#e11d48",
                        description: "Neon Cyberpunk Ruby"
                      }
                    ].map((t) => {
                      const isSelected = theme === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id as ThemeType)}
                          className={`group relative text-left rounded-xl p-3 border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between h-28 ${
                            isSelected 
                              ? "border-cyan-400 ring-2 ring-cyan-400/20 bg-white/[0.04]" 
                              : "border-white/5 hover:border-white/15 bg-white/[0.01]"
                          }`}
                        >
                          {/* Mini Terminal PreviewSwatch Mockup */}
                          <div className="w-full h-10 rounded-lg flex flex-col gap-1 p-1 mb-2 overflow-hidden border border-white/5" style={{ backgroundColor: t.bg }}>
                            <div className="flex justify-between items-center text-[5px] font-mono opacity-55">
                              <span>NIFTY</span>
                              <span style={{ color: t.accent }}>+1.4%</span>
                            </div>
                            <div className="w-full h-3 rounded flex gap-0.5 p-0.5" style={{ backgroundColor: t.card }}>
                              <div className="w-1/2 h-full rounded-[1px] bg-emerald-500/20" />
                              <div className="w-1/2 h-full rounded-[1px]" style={{ backgroundColor: t.accent }} />
                            </div>
                          </div>

                          <div>
                            <div className="text-[9px] font-black tracking-wide truncate" style={{ color: isSelected ? '#22d3ee' : '#f8fafc' }}>
                              {t.name}
                            </div>
                            <div className="text-[7px] opacity-40 truncate mt-0.5 leading-none">{t.description}</div>
                          </div>

                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-md">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1-to-10 Glassmorphism Transparency Slider */}
                <div className="space-y-4 border-t border-white/5 pt-4">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider block">Liquid Glass Transparency</h3>
                    <p className="text-[10px] text-white/40 mt-0.5">Control the background opacity and translucent sheer of terminal cards.</p>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    {/* Left side: Custom Range Slider + Context Labels */}
                    <div className="flex-1 w-full space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="px-2.5 py-1 rounded-full bg-white/[0.02] border border-white/5 text-cyan-400 font-mono text-[9px] font-bold">
                          Level {transparencyLevel} / 10 • {
                            transparencyLevel === 1 ? "Solid Opaque" :
                            transparencyLevel <= 4 ? "Dense Sheer" :
                            transparencyLevel <= 7 ? "Balanced Glass" :
                            transparencyLevel <= 9 ? "Clear Crystal" : "Pure Glass"
                          }
                        </div>
                      </div>

                      {/* Custom Range Slider Container */}
                      <div className="relative py-4 select-none">
                        {/* Interactive Invisible HTML range input overlaid */}
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          value={transparencyLevel}
                          onChange={(e) => setTransparencyLevel(parseInt(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />

                        {/* Track Background */}
                        <div className="h-1.5 bg-white/5 rounded-full w-full relative z-0">
                          {/* Filled track gradient */}
                          <div 
                            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-emerald-500/30 to-[#10B981] transition-all duration-150"
                            style={{ width: `${((transparencyLevel - 1) / 9) * 100}%` }}
                          />
                          
                          {/* Custom metallic/glass thumb */}
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full border border-white/40 bg-slate-900 flex items-center justify-center shadow-lg transition-all duration-150 relative z-10 hover:border-emerald-400"
                            style={{ 
                              left: `${((transparencyLevel - 1) / 9) * 100}%`,
                              boxShadow: `0 0 10px rgba(16, 185, 129, ${((transparencyLevel - 1) / 9) * 0.4})`
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
                          </div>
                        </div>

                        {/* Step Tick indicators & click selectors */}
                        <div className="absolute inset-x-0 -bottom-3 flex justify-between px-0.5 z-10 pointer-events-none">
                          {Array.from({ length: 10 }).map((_, i) => {
                            const val = i + 1;
                            const isActive = transparencyLevel === val;
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setTransparencyLevel(val)}
                                className="flex flex-col items-center gap-1 cursor-pointer pointer-events-auto"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full transition-all ${
                                  isActive 
                                    ? "bg-emerald-400 scale-125 shadow-[0_0_8px_#10B981]" 
                                    : "bg-white/20 hover:bg-white/45"
                                }`} />
                                <span className={`text-[8px] font-mono font-bold transition-all ${
                                  isActive ? "text-emerald-400" : "text-white/20"
                                }`}>{val}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Real-time Live Preview Chip */}
                    <div className="w-full md:w-56 h-28 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center bg-black/45">
                      {/* Simulated background mesh grid */}
                      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                      <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-cyan-500/10 filter blur-md pointer-events-none" />
                      <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-violet-500/10 filter blur-md pointer-events-none" />

                      {/* Floating preview chip using card variables */}
                      <div 
                        className="w-40 p-3 rounded-lg border text-center shadow-lg relative z-10 transition-all duration-200"
                        style={{
                          backgroundColor: `rgba(15, 23, 42, ${0.95 - ((transparencyLevel - 1) / 9) * 0.93})`,
                          backdropFilter: `blur(${transparencyLevel === 1 ? 0 : Math.max(3, Math.round(12 - (transparencyLevel - 5) * 1.6))}px)`,
                          WebkitBackdropFilter: `blur(${transparencyLevel === 1 ? 0 : Math.max(3, Math.round(12 - (transparencyLevel - 5) * 1.6))}px)`,
                          borderColor: `rgba(255, 255, 255, 0.08)`,
                          boxShadow: `0 4px 24px -1px rgba(0, 0, 0, 0.25)`
                        }}
                      >
                        <div className="text-[10px] font-bold text-white uppercase tracking-wider">Live Preview</div>
                        <div className="text-[8px] text-white/50 mt-1 font-mono leading-tight">
                          Opacity: {Math.round((0.95 - ((transparencyLevel - 1) / 9) * 0.93) * 100)}%<br />
                          Blur: {transparencyLevel === 1 ? 0 : Math.max(3, Math.round(12 - (transparencyLevel - 5) * 1.6))}px
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-controls: Glow Intensity and Blur Strength */}
                <div className="space-y-4 border-t border-white/5 pt-4">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider block">Terminal Glow & Glassmorphism</h3>
                    <p className="text-[10px] text-white/40 mt-0.5">Toggle ambient glow intensities and backdrop blur levels.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Glow intensity selector */}
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">
                          Ambient Glow Intensity
                        </label>
                        <p className="text-[9px] text-white/30">Active indicator border glowing effects.</p>
                      </div>
                      <div className="flex bg-white/[0.02] p-1 rounded-xl border border-white/5 gap-1">
                        {[
                          { id: "off", label: "Off" },
                          { id: "subtle", label: "Subtle" },
                          { id: "high", label: "High Contrast" }
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setGlowIntensity(opt.id as GlowIntensity)}
                            className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                              glowIntensity === opt.id
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-md"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Blur strength selector */}
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">
                          Glass Backdrop Blur
                        </label>
                        <p className="text-[9px] text-white/30">Transparency filter blur strength.</p>
                      </div>
                      <div className="flex bg-white/[0.02] p-1 rounded-xl border border-white/5 gap-1">
                        {[
                          { id: "none", label: "Solid/Flat" },
                          { id: "medium", label: "Medium" },
                          { id: "high", label: "High Blur" }
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setBlurStrength(opt.id as BlurStrength)}
                            className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                              blurStrength === opt.id
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-md"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === "about" && (
              <div className="space-y-5 text-left font-sans leading-relaxed text-xs text-white/70">
                <div className="space-y-2 border-b border-white/5 pb-4">
                  <h3 className="text-sm font-bold text-white">MarketVerse India trading terminal</h3>
                  <p className="text-[10.5px]">
                    Built for quantitative, institutional, and derivatives traders in Indian financial markets (NSE/BSE). Provides real-time scans, portfolio beta risk reports, virtual account ledgers, and NOVA's deep quantitative stock intelligence.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10.5px]">
                  <div>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider block">Founder & Lead Architect</span>
                    <span className="text-white font-bold block mt-0.5">Jesvin M Mathew</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider block">Terminal Version</span>
                    <span className="text-white font-mono block mt-0.5">2.4.0 (Stable Release)</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider block">NSE Feed Server</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Connected (0ms delay)</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider block">Core Framework</span>
                    <span className="text-white block mt-0.5">React v19 + Tailwind v4 + Vite</span>
                  </div>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] leading-relaxed">
                  <span className="font-bold text-white">Advisory Disclaimer:</span> Simulated Paper Trading on MarketVerse does not involve real currency. All recommendations, signals, indicators, and setups provided by NOVA AI are strictly for simulated educational purposes and must not be treated as official financial advice.
                </div>
              </div>
            )}

          </div>
        </div>
      </motion.div>
    </div>
  );
};
