// src/lib/theme/storage.ts
import type { ThemeId } from "./themes";

const PREF_KEY = "theme-pref";
const ACCENT_KEY = "theme-accent";

export function loadThemePref(): ThemeId {
  if (typeof window === "undefined") return "blue";
  return (localStorage.getItem(PREF_KEY) as ThemeId) || "blue";
}

export function saveThemePref(id: ThemeId) {
  localStorage.setItem(PREF_KEY, id);
}

export function loadCustomAccent(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCENT_KEY);
}

export function saveCustomAccent(hex: string) {
  localStorage.setItem(ACCENT_KEY, hex);
}
