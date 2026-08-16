import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeType = 
  | "obsidian" 
  | "institutional-light" 
  | "cyber-emerald" 
  | "bloomberg-amber" 
  | "midnight-slate" 
  | "tokyo-crimson";

interface ThemeContextProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("marketverse_theme");
      if (
        stored === "obsidian" || 
        stored === "institutional-light" || 
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

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("marketverse_theme", newTheme);
    } catch (e) {
      console.warn("Failed to save theme setting", e);
    }
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
