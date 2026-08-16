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

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.setAttribute("data-glow", glowIntensity);
      document.documentElement.setAttribute("data-blur", blurStrength);
    }
  }, [theme, glowIntensity, blurStrength]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      glowIntensity, 
      setGlowIntensity, 
      blurStrength, 
      setBlurStrength 
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
