// src/lib/theme/storage.ts
import type { ThemeId } from "./themes";

const PREF_KEY = "theme-pref";
const ACCENT_KEY = "theme-accent";
const VALID_IDS: ThemeId[] = ["blue", "amber", "emerald", "rose", "custom"];

export function loadThemePref(): ThemeId {
  if (typeof window === "undefined") return "blue";
  const raw = localStorage.getItem(PREF_KEY);
  if (raw && VALID_IDS.includes(raw as ThemeId)) return raw as ThemeId;
  return "blue";
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

export function removeCustomAccent() {
  localStorage.removeItem(ACCENT_KEY);
}
