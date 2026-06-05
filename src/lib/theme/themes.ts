// src/lib/theme/themes.ts

export type ThemeId = "blue" | "amber" | "emerald" | "rose" | "custom";

export interface ThemeVars {
  accent: string;
  accentHover: string;
  accentGlow: string;
  accentGrad: string;
}

export const THEMES: Record<Exclude<ThemeId, "custom">, ThemeVars> = {
  blue: {
    accent: "#5e6ad2",
    accentHover: "#7c86e0",
    accentGlow: "rgba(94,106,210,0.18)",
    accentGrad: "linear-gradient(135deg, #5e6ad2, #8b5cf6)",
  },
  amber: {
    accent: "#d4a04a",
    accentHover: "#e8b86a",
    accentGlow: "rgba(212,160,74,0.18)",
    accentGrad: "linear-gradient(135deg, #d4a04a, #cd7f32)",
  },
  emerald: {
    accent: "#34d399",
    accentHover: "#6ee7b7",
    accentGlow: "rgba(52,211,153,0.18)",
    accentGrad: "linear-gradient(135deg, #34d399, #0891b2)",
  },
  rose: {
    accent: "#f43f5e",
    accentHover: "#fb7185",
    accentGlow: "rgba(244,63,94,0.18)",
    accentGrad: "linear-gradient(135deg, #f43f5e, #e11d48)",
  },
};

function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

export function applyThemeVars(vars: ThemeVars) {
  const root = document.documentElement;
  root.style.setProperty("--color-accent", vars.accent);
  root.style.setProperty("--color-accent-hover", vars.accentHover);
  root.style.setProperty("--color-accent-glow", vars.accentGlow);
  root.style.setProperty("--color-accent-grad", vars.accentGrad);
}

export function deriveGlowFromAccent(hex: string): string {
  if (!isValidHex(hex)) return "rgba(94,106,210,0.18)"; // fallback to blue
  // Convert hex to rgba with 0.18 alpha for glow
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.18)`;
}

export function lightenHex(hex: string, amount = 30): string {
  if (!isValidHex(hex)) return "#7c86e0"; // fallback to blue hover
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function buildAccentGrad(hex: string): string {
  const lightened = lightenHex(hex, 40);
  return `linear-gradient(135deg, ${hex}, ${lightened})`;
}
