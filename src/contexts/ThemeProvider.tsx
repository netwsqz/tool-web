"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { THEMES, applyThemeVars, deriveGlowFromAccent, lightenHex, buildAccentGrad, type ThemeId, type ThemeVars } from "@/lib/theme/themes";
import { loadThemePref, saveThemePref, loadCustomAccent, saveCustomAccent, removeCustomAccent } from "@/lib/theme/storage";

type ThemeContextValue = {
  themeId: ThemeId;
  customAccent: string | null;
  setTheme: (id: ThemeId) => void;
  setCustomAccent: (hex: string) => void;
  resetAccent: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>("blue");
  const [customAccent, setCustomAccentState] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const savedTheme = loadThemePref();
    const savedAccent = loadCustomAccent();
    setThemeId(savedTheme);
    setCustomAccentState(savedAccent);
    setMounted(true);
  }, []);

  // Apply CSS variables whenever theme or custom accent changes
  const apply = useCallback((id: ThemeId, accent: string | null) => {
    let vars: ThemeVars;
    if (id === "custom" && accent) {
      vars = {
        accent,
        accentHover: lightenHex(accent),
        accentGlow: deriveGlowFromAccent(accent),
        accentGrad: buildAccentGrad(accent),
      };
    } else {
      vars = { ...THEMES[id as Exclude<ThemeId, "custom">] };
    }
    applyThemeVars(vars);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    apply(themeId, customAccent);
  }, [themeId, customAccent, mounted, apply]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    saveThemePref(id);
    if (id !== "custom") {
      setCustomAccentState(null);
    }
  }, []);

  const setCustomAccent = useCallback((hex: string) => {
    setThemeId("custom");
    setCustomAccentState(hex);
    saveCustomAccent(hex);
    saveThemePref("custom");
  }, []);

  const resetAccent = useCallback(() => {
    setThemeId("blue");
    setCustomAccentState(null);
    saveThemePref("blue");
    removeCustomAccent();
  }, []);

  return (
    <ThemeContext.Provider value={{ themeId, customAccent, setTheme, setCustomAccent, resetAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}
