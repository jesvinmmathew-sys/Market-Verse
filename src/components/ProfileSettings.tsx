import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogoMark } from "./AuraLanding";
import { supabase } from "../config/supabaseClient";
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
  Trash2
} from "lucide-react";

interface ProfileSettingsProps {
  onNavigate: (path: string) => void;
  onAuthSuccess: (user: any) => void;
  onLogout: () => void;
}

const AVATAR_PRESETS = [
  "https://api.dicebear.com/9.x/bottts/svg?seed=Market1",
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Alpha",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Trader",
  "https://api.dicebear.com/9.x/glass/svg?seed=Verse",
  "https://api.dicebear.com/9.x/planets/svg?seed=Nova"
];

export default function ProfileSettings({ onNavigate, onAuthSuccess, onLogout }: ProfileSettingsProps) {
  const [user, setUser] = useState<any>(() => {
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
    if (user) {
      setFullName(user.user_metadata?.full_name || "");
      setAvatarUrl(user.user_metadata?.avatar_url || "");
    }
  }, [user]);

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
