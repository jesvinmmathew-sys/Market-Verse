import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MarketVerseLanding, LogoMark } from "./components/AuraLanding";
import { MarketTerminal } from "./components/MarketTerminal";
import { StockDetail } from "./components/StockDetail";
import { FloatingAIAssistant } from "./components/FloatingAIAssistant";
import { FullScreenAIWorkspace } from "./components/FullScreenAIWorkspace";
import { MarketRadar } from "./components/MarketRadar";
import { CustomCursor } from "./components/CustomCursor";
import PortfolioAnalyzer from "./components/PortfolioAnalyzer";
import { AuthPage } from "./components/AuthPage";
import ProfileSettings from "./components/ProfileSettings";
import { SettingsModal } from "./components/SettingsModal";
import { LogoutConfirmModal } from "./components/LogoutConfirmModal";
import { supabase } from "./supabaseClient";
import { useTheme, ThemeType } from "./context/ThemeContext";
import { 
  Menu, 
  X, 
  ChevronDown, 
  ChevronRight, 
  Info, 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  BookOpen, 
  TrendingUp, 
  Activity,
  LogOut,
  User,
  UploadCloud,
  Palette,
  Check,
  Settings,
  Sliders,
  Key
} from "lucide-react";

export default function App() {
  const [route, setRoute] = useState<string>(() => {
    return window.location.pathname || "/";
  });

  const [user, setUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem("supabase_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  // Removed isAuthModalOpen modal state in favor of dedicated /auth page
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const avatarDropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<string>("appearance");
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const [customPfp, setCustomPfp] = useState<string | null>(null);

  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      const parts = user.user_metadata.full_name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return user.user_metadata.full_name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "TR";
  };

  useEffect(() => {
    setCustomPfp(localStorage.getItem("marketverse_user_pfp"));
    const handlePfpUpdate = () => {
      setCustomPfp(localStorage.getItem("marketverse_user_pfp"));
    };
    window.addEventListener("marketverse_pfp_updated", handlePfpUpdate);
    return () => window.removeEventListener("marketverse_pfp_updated", handlePfpUpdate);
  }, []);

  const openSettingsWithTab = (tab: string) => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Supabase signOut error", err);
    }
    localStorage.removeItem("supabase_session");
    localStorage.removeItem("supabase_user");
    setUser(null);
  };

  // Load session and subscribe to auth state changes using getSession and onAuthStateChange
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          localStorage.setItem("supabase_user", JSON.stringify(session.user));
          localStorage.setItem("supabase_session", JSON.stringify(session));
        } else {
          setUser(null);
          localStorage.removeItem("supabase_user");
          localStorage.removeItem("supabase_session");
        }
      } catch (err) {
        console.error("Error retrieving active session", err);
      }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        localStorage.setItem("supabase_user", JSON.stringify(session.user));
        localStorage.setItem("supabase_session", JSON.stringify(session));
      } else {
        setUser(null);
        localStorage.removeItem("supabase_user");
        localStorage.removeItem("supabase_session");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync profile metadata updates from custom events
  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const stored = localStorage.getItem("supabase_user");
        if (stored) setUser(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse user on update", err);
      }
    };
    window.addEventListener("aura_profile_updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("aura_profile_updated", handleProfileUpdate);
    };
  }, []);

  // Redirect logged-in users away from landing page
  useEffect(() => {
    if (user && (route === "/" || route === "/aura")) {
      navigate("/dashboard");
    }
  }, [user, route]);

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("marketverse_watchlist");
      return stored ? JSON.parse(stored) : ["RELIANCE", "TATAMOTORS", "HDFCBANK"];
    } catch {
      return ["RELIANCE", "TATAMOTORS", "HDFCBANK"];
    }
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
      if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(event.target as Node)) {
        setIsAvatarDropdownOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setIsThemeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    setIsMobileMenuOpen(false);
    setIsMoreOpen(false);
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
  const isAuthRoute = route === "/auth";
  const isAIRoute = route === "/ai";
  const isPortfolioRoute = route === "/portfolio";
  const isProfileRoute = route === "/profile";
  const isBullishRoute = route === "/market/bullish";
  const isBearishRoute = route === "/market/bearish";
  const isStockRoute = route.startsWith("/stock/");

  const mainNavItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Markets', path: '/stocks' },
    { name: 'Portfolio', path: '/portfolio' },
    { name: 'NOVA AI', path: '/ai' },
  ];

  const moreNavItems = [
    { name: 'News', path: '/news' },
    { name: 'Learn', path: '/learn' },
  ];

  return (
    <div className="min-h-screen bg-bg-app text-text-main flex flex-col">
      {!isAuraRoute && !isAuthRoute && (
        <header className="border-b border-white/5 bg-black/45 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-0 min-h-16 flex flex-wrap items-center justify-between gap-3 md:gap-4">
            {/* Top row elements (Branding + Mobile Indicator/Toggle) grouped for optimal spacing */}
            <div className="flex items-center justify-between w-full md:w-auto gap-4 shrink-0">
              <div 
                className="flex items-center gap-2.5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] shrink-0" 
                onClick={() => {
                  if (user) {
                    navigate("/dashboard");
                  } else {
                    navigate("/");
                  }
                }} 
                id="global-header-brand"
              >
                <LogoMark className="w-5.5 h-5.5 text-[#22d3ee] hover:text-[#22d3ee]/80 transition-colors" />
                <span className="text-xs sm:text-sm font-black tracking-widest bg-gradient-to-r from-white via-[#3D81E3] to-white/70 bg-clip-text text-transparent font-sans">
                  MARKETVERSE INDIA
                </span>
              </div>

              {/* Right side group for mobile (Live Status + Mobile Menu Toggle Button) */}
              <div className="flex md:hidden items-center gap-3 shrink-0">
                {(() => {
                  const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
                  return (
                    <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] ${
                      isWeekend 
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${
                        isWeekend ? "bg-amber-500" : "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      }`} />
                      <span className="font-mono tracking-widest font-bold uppercase">
                        {isWeekend ? "CLOSED" : "LIVE"}
                      </span>
                    </div>
                  );
                })()}

                {/* Mobile Menu Toggle Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer border border-white/5"
                  aria-label="Toggle mobile menu"
                  id="mobile-drawer-toggle"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5 text-cyan-400" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Desktop Navigation links using flex-wrap and responsive gaps to scale fluidly on smaller desktop screens */}
            <div className="hidden md:flex flex-wrap items-center justify-center gap-1 md:gap-1.5 lg:gap-3 xl:gap-4.5" id="global-header-nav-links">
              {mainNavItems.map((item) => {
                const isActive = route === item.path || (item.path === "/stocks" && (route === "/stocks" || route.startsWith("/stock/")));
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.path)}
                    className={`text-[9px] md:text-[10px] lg:text-[11px] xl:text-[12px] font-bold uppercase tracking-wider transition-all cursor-pointer bg-transparent border-none outline-none px-1.5 py-1 md:px-2 md:py-1.5 lg:px-3 lg:py-2 rounded-lg hover:bg-white/5 ${
                      isActive ? "text-[#22d3ee] font-extrabold bg-[#22d3ee]/5 border border-[#22d3ee]/10" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}

              {/* Responsive "More" Dropdown Group */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className={`text-[9px] md:text-[10px] lg:text-[11px] xl:text-[12px] font-bold uppercase tracking-wider transition-all cursor-pointer bg-transparent border-none outline-none px-1.5 py-1 md:px-2 md:py-1.5 lg:px-3 lg:py-2 rounded-lg hover:bg-white/5 flex items-center gap-1 ${
                    isMoreOpen || moreNavItems.some(item => route === item.path) ? "text-[#22d3ee]" : "text-white/60 hover:text-white"
                  }`}
                >
                  <span>More</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isMoreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-[#0c0e12]/95 backdrop-blur-xl p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50 text-left"
                    >
                      {moreNavItems.map((item) => {
                        const isSubActive = route === item.path;
                        return (
                          <button
                            key={item.name}
                            onClick={() => navigate(item.path)}
                            className={`w-full text-left text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-all ${
                              isSubActive ? "text-[#22d3ee] bg-[#22d3ee]/5 font-black" : "text-white/60 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            {item.name}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => {
                          setIsAboutOpen(true);
                          setIsMoreOpen(false);
                        }}
                        className="w-full text-left text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-1.5"
                      >
                        <Info className="w-3.5 h-3.5 text-cyan-400" />
                        <span>About</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Desktop-only status indicator */}
            <div className="hidden md:flex items-center gap-2.5 shrink-0">
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
                    <span className="text-[9px] font-mono tracking-widest font-bold uppercase">
                      {isWeekend ? "IST (UTC+5:30) • NSE Closed" : "IST (UTC+5:30) • NSE Live Feed"}
                    </span>
                  </div>
                );
              })()}

              {/* Quick Theme Switcher Dropdown */}
              <div className="relative shrink-0" ref={themeDropdownRef}>
                <button
                  onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                  className="p-1.5 text-text-sub hover:text-text-main hover:bg-white/5 rounded-lg transition-all cursor-pointer border border-border-subtle flex items-center justify-center"
                  title="Switch theme"
                  id="navbar-theme-switcher"
                >
                  <Palette className="w-4 h-4 text-cyan-400" />
                </button>

                <AnimatePresence>
                  {isThemeDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 rounded-xl border border-border-subtle bg-surface/95 backdrop-blur-xl p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50 text-left"
                    >
                      <div className="px-3 py-1.5 border-b border-border-subtle mb-1 select-none">
                        <p className="text-[8px] text-text-dim font-bold uppercase tracking-wider">Active Terminal Theme</p>
                      </div>
                      {[
                        { id: "obsidian", name: "Obsidian Space", color: "#10b981" },
                        { id: "cyber-emerald", name: "Matrix Neon", color: "#00ff88" },
                        { id: "bloomberg-amber", name: "Bloomberg Amber", color: "#f59e0b" },
                        { id: "midnight-slate", name: "Midnight Slate", color: "#38bdf8" },
                        { id: "tokyo-crimson", name: "Tokyo Crimson", color: "#e11d48" }
                      ].map((t) => {
                        const isSelected = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              setTheme(t.id as ThemeType);
                              setIsThemeDropdownOpen(false);
                            }}
                            className={`w-full text-left text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-all flex items-center justify-between ${
                              isSelected ? "text-cyan-400 bg-white/5 font-extrabold" : "text-text-sub hover:text-text-main hover:bg-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: t.color }} />
                              <span>{t.name}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Authentication Trigger */}
              {user ? (
                <div className="relative" ref={avatarDropdownRef}>
                  <button
                    onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs cursor-pointer shadow-md hover:scale-[1.05] transition-all border border-cyan-500/20 overflow-hidden relative"
                  >
                    {customPfp ? (
                      <img src={customPfp} alt="Avatar" className="w-full h-full object-cover" />
                    ) : user.user_metadata?.avatar_url && !user.user_metadata.avatar_url.startsWith("linear-gradient") ? (
                      <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                        {getInitials()}
                      </div>
                    )}
                  </button>                  <AnimatePresence>
                    {isAvatarDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-60 rounded-2xl border border-border-subtle bg-surface/95 backdrop-blur-xl p-3 shadow-[0_15px_40px_rgba(0,0,0,0.6)] z-50 text-left space-y-3"
                      >
                        {/* User Header */}
                        <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border border-cyan-500/20 overflow-hidden shrink-0 relative">
                            {customPfp ? (
                              <img src={customPfp} alt="Avatar" className="w-full h-full object-cover" />
                            ) : user.user_metadata?.avatar_url && !user.user_metadata.avatar_url.startsWith("linear-gradient") ? (
                              <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                                {getInitials()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-white truncate font-sans">
                              {user.user_metadata?.full_name || "Active Trader"}
                            </p>
                            <p className="text-[9px] text-white/40 truncate font-mono mt-0.5">{user.email}</p>
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[8px] font-bold uppercase tracking-wider mt-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>Active Trader</span>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="space-y-0.5" id="profile-dropdown-menu">
                          <button
                            onClick={() => {
                              setIsAvatarDropdownOpen(false);
                              openSettingsWithTab("general");
                            }}
                            className="w-full text-left text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-2 rounded-lg text-text-sub hover:text-text-main hover:bg-white/5 transition-all flex items-center gap-2.5 cursor-pointer"
                          >
                            <Settings className="w-4 h-4 text-cyan-400" />
                            <span>Settings</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsAvatarDropdownOpen(false);
                              openSettingsWithTab("appearance");
                            }}
                            className="w-full text-left text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-2 rounded-lg text-text-sub hover:text-text-main hover:bg-white/5 transition-all flex items-center gap-2.5 cursor-pointer"
                          >
                            <Palette className="w-4 h-4 text-cyan-400" />
                            <span>Appearance & Themes</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsAvatarDropdownOpen(false);
                              setIsAboutOpen(true);
                            }}
                            className="w-full text-left text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-2 rounded-lg text-text-sub hover:text-text-main hover:bg-white/5 transition-all flex items-center gap-2.5 cursor-pointer"
                          >
                            <Info className="w-4 h-4 text-cyan-400" />
                            <span>About MarketVerse</span>
                          </button>

                          <div className="border-t border-white/5 my-2 pt-1.5" />

                          <button
                            onClick={() => {
                              setIsAvatarDropdownOpen(false);
                              setIsLogoutConfirmOpen(true);
                            }}
                            className="w-full text-left text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-2.5 rounded-lg text-red-400 hover:text-red-350 hover:bg-red-500/5 transition-all flex items-center gap-2.5 cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/auth")}
                  className="text-[9px] md:text-[10px] lg:text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border border-cyan-400/20 hover:border-cyan-400/40 px-4 py-1.5 rounded-lg flex items-center gap-1.5 text-white shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                >
                  <span>Get Started</span>
                </button>
              )}
            </div>
          </div>

          {/* Premium Mobile Menu Slide-down Drawer */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="md:hidden border-t border-white/5 bg-[#090b0e]/95 backdrop-blur-xl overflow-hidden relative z-50 text-left"
              >
                <div className="px-5 py-4 flex flex-col gap-2.5">
                  {[...mainNavItems, ...moreNavItems].map((item) => {
                    const isActive = route === item.path || (item.path === "/stocks" && (route === "/stocks" || route.startsWith("/stock/")));
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigate(item.path);
                        }}
                        className={`w-full text-left text-xs font-bold uppercase tracking-wider py-2.5 px-3 rounded-lg border flex items-center justify-between transition-all ${
                          isActive 
                            ? "text-[#22d3ee] bg-[#22d3ee]/5 border-[#22d3ee]/20 font-extrabold" 
                            : "text-white/60 hover:text-white bg-transparent border-transparent"
                        }`}
                      >
                        <span>{item.name}</span>
                        <ChevronRight className="w-4 h-4 text-white/20" />
                      </button>
                    );
                  })}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAboutOpen(true);
                    }}
                    className="w-full text-left text-xs font-bold uppercase tracking-wider py-2.5 px-3 rounded-lg border border-transparent text-white/60 hover:text-white flex items-center justify-between transition-all mb-1"
                  >
                    <span className="flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-cyan-400" />
                      <span>About Platform</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/20" />
                  </button>

                  {user ? (
                    <>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsSettingsOpen(true);
                        }}
                        className="w-full text-left text-xs font-bold uppercase tracking-wider py-2.5 px-3 rounded-lg border border-border-subtle bg-white/5 text-text-sub hover:text-text-main flex items-center justify-between transition-all mb-2"
                      >
                        <span className="flex items-center gap-1.5">
                          <Settings className="w-4 h-4 text-cyan-400" />
                          <span>Terminal Settings</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-white/20" />
                      </button>

                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleSignOut();
                        }}
                        className="w-full text-left text-xs font-bold uppercase tracking-wider py-2.5 px-3 rounded-lg border border-red-500/10 bg-red-500/5 text-red-400 hover:text-red-300 flex items-center justify-between transition-all"
                      >
                        <span className="flex items-center gap-1.5">
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-white/20" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate("/auth");
                      }}
                      className="w-full py-3 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold uppercase tracking-wider text-center transition-all shadow-md shadow-cyan-500/20"
                    >
                      <span>Get Started</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
              <MarketVerseLanding 
                onLaunchTerminal={() => navigate("/dashboard")} 
                onNavigate={navigate} 
                onOpenAbout={() => setIsAboutOpen(true)}
              />
            ) : isAuthRoute ? (
              <AuthPage onNavigate={navigate} onAuthSuccess={setUser} />
            ) : isProfileRoute ? (
              <ProfileSettings onNavigate={navigate} onAuthSuccess={setUser} onLogout={handleSignOut} user={user} />
            ) : isAIRoute ? (
              <FullScreenAIWorkspace onNavigate={navigate} />
            ) : isPortfolioRoute ? (
              <div className="max-w-7xl mx-auto px-6 py-10">
                <PortfolioAnalyzer onNavigate={navigate} />
              </div>
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
                user={user}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {route !== "/ai" && route !== "/auth" && <FloatingAIAssistant currentRoute={route} />}
      <CustomCursor />

      {/* ========================================================= */}
      {/* PREMIUM GLASS ABOUT OVERLAY MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isAboutOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" id="about-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="liquid-glass border border-white/10 bg-[#080a0f]/95 rounded-2xl p-6 max-w-lg w-full text-left space-y-5 relative overflow-hidden"
              id="about-modal-box"
            >
              {/* Decorative glows */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/[0.03] rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/[0.03] rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2.5">
                  <LogoMark className="w-6 h-6 text-[#22d3ee] fill-[#22d3ee]/10" />
                  <div>
                    <h3 className="text-sm font-black text-white font-sans uppercase tracking-wider">MarketVerse India</h3>
                    <p className="text-[10px] text-[#22d3ee] font-mono uppercase tracking-widest font-bold">Quantum Core v2.4</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAboutOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center cursor-pointer border border-white/5 transition-all"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-white/70">
                <p className="font-sans">
                  MarketVerse is a premium institutional-grade simulation and analytics platform. Built for sophisticated quantitative analysis, the system links server-side AI analyst pipelines with a real-time market data feed.
                </p>

                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold border-b border-white/5 pb-1">Architecture Specifications</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[10px] text-white/60">
                    <div className="bg-white/[0.01] border border-white/5 rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                        <Cpu className="w-3.5 h-3.5" />
                        <span>NOVA AI PIPELINE</span>
                      </div>
                      <p className="text-[9px] text-white/45 font-sans">Multi-layered technical scoring, SWOT metrics, and rebalancing recommendations.</p>
                    </div>

                    <div className="bg-white/[0.01] border border-white/5 rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <Activity className="w-3.5 h-3.5" />
                        <span>LIVE QUANT INDEX</span>
                      </div>
                      <p className="text-[9px] text-white/45 font-sans">Simulated market price ticking at 2000ms, incorporating volatility indices.</p>
                    </div>

                    <div className="bg-white/[0.01] border border-white/5 rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-violet-400 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>DEMAT LEDGER</span>
                      </div>
                      <p className="text-[9px] text-white/45 font-sans">Real-time mock trade routing with fractional shares and portfolio value checks.</p>
                    </div>

                    <div className="bg-white/[0.01] border border-white/5 rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>QUANT ACADEMY</span>
                      </div>
                      <p className="text-[9px] text-white/45 font-sans">Interactive strategy guides, technical indicators, and charting indicators.</p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/10 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-[10px] font-sans text-cyan-200/80 leading-normal">
                    This platform operates entirely in-memory with local storage persistence. All prices are for simulated training and testing purposes only. Secure server-side telemetry is active.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/35 font-mono">
                <span>© 2026 MarketVerse Network</span>
                <span className="text-cyan-400 font-bold">ONLINE · SECURITIES LABS</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* INSTITUTIONAL SETTINGS MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            user={user}
            onAuthSuccess={setUser}
            onLogout={handleSignOut}
            onNavigate={navigate}
            initialTab={settingsTab}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLogoutConfirmOpen && (
          <LogoutConfirmModal
            isOpen={isLogoutConfirmOpen}
            onClose={() => setIsLogoutConfirmOpen(false)}
            onConfirm={handleSignOut}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
