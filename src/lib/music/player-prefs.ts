"use client";

import type { PlayMode } from "@/types/music-player";

const STORAGE_KEY = "music-player-prefs";

export type PlayerPrefs = {
  volume: number;
  playMode: PlayMode;
};

const DEFAULTS: PlayerPrefs = {
  volume: 0.7,
  playMode: "sequential",
};

export function loadPrefs(): PlayerPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      volume:
        typeof parsed.volume === "number"
          ? Math.max(0, Math.min(1, parsed.volume))
          : DEFAULTS.volume,
      playMode:
        parsed.playMode === "sequential" ||
        parsed.playMode === "shuffle" ||
        parsed.playMode === "single-repeat"
          ? parsed.playMode
          : DEFAULTS.playMode,
    };
  } catch {
    return DEFAULTS;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function savePrefs(prefs: Partial<PlayerPrefs>): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const current = loadPrefs();
      const merged = { ...current, ...prefs };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // localStorage unavailable — silently ignore
    }
  }, 200);
}
