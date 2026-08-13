import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogoMark } from "./AuraLanding";
import { Mail, Lock, Loader2, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react";

interface AuthPageProps {
  onNavigate: (path: string) => void;
  onAuthSuccess: (user: any) => void;
}

export function AuthPage({ onNavigate, onAuthSuccess }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (isSignUp) {
        setSuccessMsg(data.message || "Registration successful! You can now log in.");
        setTimeout(() => {
          setIsSignUp(false);
          setSuccessMsg(null);
          setPassword("");
        }, 3000);
      } else {
        if (data.session) {
          localStorage.setItem("supabase_session", JSON.stringify(data.session));
        }
        if (data.user) {
          localStorage.setItem("supabase_user", JSON.stringify(data.user));
        }
        
        onAuthSuccess(data.user);
        onNavigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#060608] relative" id="auth-page-container">
      {/* LEFT COLUMN: Cinematic background video */}
      <div className="w-full md:w-1/2 h-[40vh] md:h-screen relative flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-white/10" id="auth-left-cinematic">
        {/* Background Loop Video */}
        <div className="absolute inset-0 w-full h-full z-0 opacity-40">
          <video
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Subtle Dark Overlay */}
          <div className="absolute inset-0 bg-black/60 z-10" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-md select-none">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-3.5 mb-3"
          >
            <LogoMark className="w-12 h-12 text-cyan-400" />
            <span className="text-3xl font-black tracking-widest text-white uppercase font-sans">MarketVerse</span>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-xs text-white tracking-wider uppercase font-mono"
          >
            Quantum Trading Terminal
          </motion.p>
        </div>
      </div>

      {/* RIGHT COLUMN: Light & Minimalist Form UI */}
      <div className="w-full md:w-1/2 h-[60vh] md:h-screen bg-slate-50 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-20 relative text-left" id="auth-right-minimal">
        {/* Back navigation button */}
        <button
          onClick={() => onNavigate("/")}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-2 px-3 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing</span>
        </button>

        {/* Inner centered form container */}
        <div className="w-full max-w-md flex flex-col justify-center py-6">
          <div className="mb-8">
            <motion.h2 
              key={isSignUp ? "signup-title" : "login-title"}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-extrabold text-slate-850 tracking-tight font-sans"
            >
              {isSignUp ? "Enter the MarketVerse." : "Welcome back."}
            </motion.h2>
            <motion.p 
              key={isSignUp ? "signup-sub" : "login-sub"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              className="text-sm text-slate-600 mt-2 font-medium leading-relaxed"
            >
              {isSignUp 
                ? "Command your capital with next-generation analytics. Your journey starts here."
                : "The markets are moving. Your portfolio is ready."}
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Status alerts inside the card */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200/50 text-rose-700 text-xs font-medium"
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
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200/50 text-emerald-700 text-xs font-medium"
                >
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email input field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block" htmlFor="email-input">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email-input"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all font-sans placeholder-slate-400"
                />
              </div>
            </div>

            {/* Password input field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block" htmlFor="password-input">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all font-sans placeholder-slate-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-850 text-white text-sm font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-slate-900/10 cursor-pointer disabled:opacity-50 hover:shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isSignUp ? "Register" : "Sign In"}</span>
              )}
            </button>
          </form>

          {/* Toggle Login/Signup Trigger */}
          <div className="mt-8 text-center text-xs">
            <span className="text-slate-500 font-medium">
              {isSignUp ? "Already have an account?" : "New to MarketVerse?"}
            </span>{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMsg(null);
              }}
              className="font-bold text-[#3D81E3] hover:text-[#336ec4] transition-colors cursor-pointer ml-1"
            >
              {isSignUp ? "Sign In" : "Create Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
