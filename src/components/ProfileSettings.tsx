import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogoMark } from "./AuraLanding";
import { supabase } from "../supabaseClient";
import { useTheme, ThemeType, GlowIntensity, BlurStrength } from "../context/ThemeContext";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  UploadCloud, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  LogOut,
  Camera,
  Trash2,
  Check
} from "lucide-react";

interface ProfileSettingsProps {
  onNavigate: (path: string) => void;
  onAuthSuccess: (user: any) => void;
  onLogout: () => void;
  user?: any;
}

const AVATAR_PRESETS = [
  "https://api.dicebear.com/9.x/bottts/svg?seed=Market1",
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Alpha",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Trader",
  "https://api.dicebear.com/9.x/glass/svg?seed=Verse",
  "https://api.dicebear.com/9.x/planets/svg?seed=Nova"
];

export default function ProfileSettings({ onNavigate, onAuthSuccess, onLogout, user: propUser }: ProfileSettingsProps) {
  const { 
    theme, 
    setTheme, 
    glowIntensity, 
    setGlowIntensity, 
    blurStrength, 
    setBlurStrength 
  } = useTheme();
  const [user, setUser] = useState<any>(() => {
    if (propUser) return propUser;
    try {
      const stored = localStorage.getItem("supabase_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state if user changes
  useEffect(() => {
    if (propUser) {
      setUser(propUser);
      setFullName(propUser.user_metadata?.full_name || "");
      setAvatarUrl(propUser.user_metadata?.avatar_url || "");
    }
  }, [propUser]);

  // Load session and subscribe to auth state changes using getSession and onAuthStateChange
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        
        const activeUser = authUser || session?.user;
        if (activeUser) {
          setUser(activeUser);
          setFullName(activeUser.user_metadata?.full_name || "");
          setAvatarUrl(activeUser.user_metadata?.avatar_url || "");
          localStorage.setItem("supabase_user", JSON.stringify(activeUser));
          if (session) {
            localStorage.setItem("supabase_session", JSON.stringify(session));
          }
        }
      } catch (err) {
        console.error("Error retrieving active session", err);
      }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setFullName(session.user.user_metadata?.full_name || "");
        setAvatarUrl(session.user.user_metadata?.avatar_url || "");
        localStorage.setItem("supabase_user", JSON.stringify(session.user));
        localStorage.setItem("supabase_session", JSON.stringify(session));
      } else {
        setUser(null);
        setFullName("");
        setAvatarUrl("");
        localStorage.removeItem("supabase_user");
        localStorage.removeItem("supabase_session");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("File size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      // Dynamically fetch current user and check session health
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

      if (!currentUser || userError) {
        setError("No active auth session found. Please re-login.");
        return;
      }

      // Update user metadata directly via supabase auth
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: avatarUrl
        }
      });

      if (updateError) {
        throw updateError;
      }

      // Update local states & storage
      const updatedUser = data.user;
      if (updatedUser) {
        localStorage.setItem("supabase_user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        onAuthSuccess(updatedUser);
      }

      setSuccessMsg("Profile updated successfully!");

      // Dispatch event for UI updates
      window.dispatchEvent(new Event("aura_profile_updated"));

      // Auto-close / redirect back to Dashboard after 600ms
      setTimeout(() => {
        onNavigate("/dashboard");
      }, 600);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (preset: string) => {
    setAvatarUrl(preset);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
  };

  const isGradient = (url: string) => url.startsWith("linear-gradient");

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 relative" id="profile-settings-page">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="liquid-glass w-full max-w-3xl bg-[#080a0f]/90 rounded-2xl border border-white/10 p-6 md:p-10 relative overflow-hidden"
      >
        {/* Back navigation button */}
        <button
          onClick={() => onNavigate("/dashboard")}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Back to Dashboard</span>
        </button>

        <div className="mt-8 flex flex-col md:flex-row gap-8 md:gap-12">
          {/* LEFT: Avatar Upload Panel */}
          <div className="flex flex-col items-center shrink-0 w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 pb-8 md:pb-0 md:pr-10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6 w-full text-center md:text-left">
              Avatar Image
            </h3>

            {/* Avatar Preview circle */}
            <div className="relative group w-32 h-32 mb-6">
              <div 
                className="w-full h-full rounded-full border border-white/10 flex items-center justify-center text-3xl font-black shadow-lg overflow-hidden"
                style={{ 
                  background: avatarUrl && isGradient(avatarUrl) ? avatarUrl : "transparent",
                  backgroundColor: avatarUrl && !isGradient(avatarUrl) ? "transparent" : "#111827"
                }}
              >
                {avatarUrl && !isGradient(avatarUrl) ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : !avatarUrl ? (
                  <span className="text-white/40">{fullName ? fullName[0].toUpperCase() : user?.email?.[0].toUpperCase()}</span>
                ) : null}
              </div>

              {/* Upload overlay */}
              <label 
                htmlFor="avatar-file-input"
                className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs gap-1 font-bold"
              >
                <Camera className="w-5 h-5 text-cyan-400" />
                <span>Change Photo</span>
              </label>
              <input 
                id="avatar-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Presets / Remove Avatar Actions */}
            <div className="space-y-4 w-full">
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2.5 text-center md:text-left">
                  Preset 3D Avatars
                </p>
                <div className="flex items-center justify-center md:justify-start gap-2.5">
                  {AVATAR_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={`w-9 h-9 rounded-full border transition-all cursor-pointer overflow-hidden bg-slate-900 ${
                        avatarUrl === preset ? "border-cyan-400 scale-110 ring-2 ring-cyan-400/20" : "border-white/10 hover:border-white/40 hover:scale-105"
                      }`}
                      title={`Select preset avatar ${i + 1}`}
                    >
                      <img src={preset} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>

              {avatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  className="w-full py-1.5 border border-red-500/20 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/10 rounded-lg text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Avatar</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Profile Settings fields */}
          <div className="flex-1 text-left">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white tracking-wide uppercase font-sans">
                Profile Settings
              </h2>
              <p className="text-xs text-white/50 mt-1">
                Customize your account details and visual preferences.
              </p>
            </div>

            {/* Status alerts */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-5"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-200/50 text-emerald-400 text-xs font-medium mb-5"
                >
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Email Address (Read-only) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">
                  Email Address (Verified)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/30">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="block w-full pl-9 pr-3 py-2.5 text-sm bg-white/[0.02] border border-white/5 text-white/40 rounded-xl outline-none cursor-not-allowed font-sans select-none"
                  />
                </div>
              </div>

              {/* Full Name field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block" htmlFor="fullname-input">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                    <User className="w-4 h-4 text-cyan-400" />
                  </div>
                  <input
                    id="fullname-input"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 text-sm bg-white/5 border border-white/15 text-white rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all font-sans"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Appearance & Theme (1-click selector with swatch mini UI previews) */}
              <div className="space-y-4 border-t border-white/5 pt-4">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider block">
                    Appearance & Theme
                  </h3>
                  <p className="text-[10px] text-white/40 mt-0.5">Choose your institutional dark terminal layout.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: "obsidian",
                      name: "Obsidian Space",
                      bg: "#06080F",
                      card: "rgba(15, 23, 42, 0.65)",
                      accent: "#10b981",
                      description: "Deep Onyx & Emerald"
                    },
                    {
                      id: "cyber-emerald",
                      name: "Matrix Neon",
                      bg: "#020b05",
                      card: "rgba(6, 35, 19, 0.7)",
                      accent: "#00ff88",
                      description: "Sharp Matrix Green"
                    },
                    {
                      id: "bloomberg-amber",
                      name: "Bloomberg",
                      bg: "#0a0d14",
                      card: "rgba(20, 26, 38, 0.75)",
                      accent: "#f59e0b",
                      description: "Terminal Amber"
                    },
                    {
                      id: "midnight-slate",
                      name: "Midnight Slate",
                      bg: "#0f172a",
                      card: "rgba(30, 41, 59, 0.7)",
                      accent: "#38bdf8",
                      description: "Nordic Slate & Blue"
                    },
                    {
                      id: "tokyo-crimson",
                      name: "Tokyo Crimson",
                      bg: "#0e0a12",
                      card: "rgba(32, 20, 43, 0.75)",
                      accent: "#f43f5e",
                      description: "Vaporwave Ruby"
                    }
                  ].map((t) => {
                    const isSelected = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id as ThemeType)}
                        className={`group relative text-left rounded-xl p-3 border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between h-24 ${
                          isSelected 
                            ? "border-cyan-400 ring-2 ring-cyan-400/20 bg-white/[0.04]" 
                            : "border-white/5 hover:border-white/15 bg-white/[0.01]"
                        }`}
                      >
                        {/* Swatch Swatch */}
                        <div className="w-full h-8 rounded-lg flex gap-1 p-1 mb-2 overflow-hidden border border-white/5" style={{ backgroundColor: t.bg }}>
                          <div className="w-3/5 h-full rounded border border-white/5" style={{ backgroundColor: t.card }} />
                          <div className="w-2/5 h-full rounded border border-white/5 flex flex-col justify-between p-0.5">
                            <div className="w-full h-1 rounded" style={{ backgroundColor: t.accent }} />
                            <div className="w-full h-1 rounded bg-white/10" />
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold tracking-wide truncate" style={{ color: isSelected ? '#22d3ee' : '#f8fafc' }}>
                            {t.name}
                          </div>
                          <div className="text-[8px] opacity-40 font-medium truncate mt-0.5">{t.description}</div>
                        </div>

                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400 p-0.5 shadow-md">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-controls: Glow Intensity and Blur Strength */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3">
                  {/* Glow intensity selector */}
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">
                        Ambient Border Glow
                      </label>
                      <p className="text-[9px] text-white/30">Set intensity for active indicator glows.</p>
                    </div>
                    <div className="flex bg-white/[0.02] p-1 rounded-xl border border-white/5 gap-1">
                      {[
                        { id: "off", label: "Off" },
                        { id: "subtle", label: "Subtle" },
                        { id: "high", label: "High" }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setGlowIntensity(opt.id as GlowIntensity)}
                          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
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
                        Glassmorphism Blur
                      </label>
                      <p className="text-[9px] text-white/30">Adjust transparency filter strength.</p>
                    </div>
                    <div className="flex bg-white/[0.02] p-1 rounded-xl border border-white/5 gap-1">
                      {[
                        { id: "none", label: "Solid" },
                        { id: "medium", label: "Medium" },
                        { id: "high", label: "High" }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setBlurStrength(opt.id as BlurStrength)}
                          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
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

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/10 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onNavigate("/");
                  }}
                  className="sm:w-32 py-2.5 px-4 border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
