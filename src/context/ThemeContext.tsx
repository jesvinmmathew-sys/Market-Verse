import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeType = 
  | "obsidian" 
  | "cyber-emerald" 
  | "bloomberg-amber" 
  | "midnight-slate" 
  | "tokyo-crimson";

export type GlowIntensity = "subtle" | "high" | "off";
export type BlurStrength = "medium" | "high" | "none";

interface ThemeContextProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  glowIntensity: GlowIntensity;
  setGlowIntensity: (glow: GlowIntensity) => void;
  blurStrength: BlurStrength;
  setBlurStrength: (blur: BlurStrength) => void;
  transparencyLevel: number;
  setTransparencyLevel: (level: number) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("marketverse_theme");
      if (
        stored === "obsidian" || 
        stored === "cyber-emerald" || 
        stored === "bloomberg-amber" || 
        stored === "midnight-slate" || 
        stored === "tokyo-crimson"
      ) {
        return stored as ThemeType;
      }
    }
    return "obsidian";
  });

  const [glowIntensity, setGlowIntensityState] = useState<GlowIntensity>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("marketverse_glow");
      if (stored === "subtle" || stored === "high" || stored === "off") {
        return stored as GlowIntensity;
      }
    }
    return "subtle";
  });

  const [blurStrength, setBlurStrengthState] = useState<BlurStrength>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("marketverse_blur");
      if (stored === "medium" || stored === "high" || stored === "none") {
        return stored as BlurStrength;
      }
    }
    return "high";
  });

  const [transparencyLevel, setTransparencyLevelState] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("marketverse_transparency");
      if (stored) {
        const val = parseInt(stored);
        if (val >= 1 && val <= 10) return val;
      }
    }
    return 5;
  });

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("marketverse_theme", newTheme);
    } catch (e) {
      console.warn("Failed to save theme setting", e);
    }
  };

  const setGlowIntensity = (intensity: GlowIntensity) => {
    setGlowIntensityState(intensity);
    try {
      localStorage.setItem("marketverse_glow", intensity);
    } catch (e) {
      console.warn("Failed to save glow setting", e);
    }
  };

  const setBlurStrength = (strength: BlurStrength) => {
    setBlurStrengthState(strength);
    try {
      localStorage.setItem("marketverse_blur", strength);
    } catch (e) {
      console.warn("Failed to save blur setting", e);
    }
  };

  const applyTransparency = (level: number, currentTheme: ThemeType) => {
    if (typeof document !== "undefined") {
      const alpha = (0.95 - ((level - 1) / 9) * 0.93).toFixed(2);
      const blurPx = level === 1 ? 0 : Math.max(2, Math.round(12 - (level - 5) * 1.5));

      document.documentElement.style.setProperty('--glass-alpha', alpha);
      document.documentElement.style.setProperty('--glass-blur', `${blurPx}px`);

      const themeRgbMap: Record<ThemeType, string> = {
        "obsidian": "10, 14, 23",
        "cyber-emerald": "4, 26, 14",
        "bloomberg-amber": "16, 20, 30",
        "midnight-slate": "30, 41, 59",
        "tokyo-crimson": "23, 16, 30"
      };
      const surfaceRgb = themeRgbMap[currentTheme] || "10, 14, 23";
      document.documentElement.style.setProperty('--bg-surface-rgb', surfaceRgb);
    }
    try {
      localStorage.setItem('marketverse_transparency', String(level));
    } catch (e) {
      console.warn("Failed to save transparency setting", e);
    }
  };

  const setTransparencyLevel = (level: number) => {
    setTransparencyLevelState(level);
    applyTransparency(level, theme);
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.setAttribute("data-glow", glowIntensity);
      document.documentElement.setAttribute("data-blur", blurStrength);
      applyTransparency(transparencyLevel, theme);
    }
  }, [theme, glowIntensity, blurStrength, transparencyLevel]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      glowIntensity, 
      setGlowIntensity, 
      blurStrength, 
      setBlurStrength,
      transparencyLevel,
      setTransparencyLevel
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
