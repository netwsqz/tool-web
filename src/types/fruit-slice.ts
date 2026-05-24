// src/types/fruit-slice.ts

export type FruitType = "watermelon" | "orange" | "apple" | "banana" | "kiwi" | "strawberry" | "mango" | "pineapple";

export interface Point {
  x: number;
  y: number;
}

export interface Fruit {
  id: number;
  type: FruitType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  active: boolean;
  sliced: boolean;
  /** Timestamp when slicing occurred, for half-fruit animation */
  sliceTime: number;
}

export interface Bomb {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  active: boolean;
  hit: boolean;
}

export interface JuiceParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

export interface SlashPoint {
  x: number;
  y: number;
  time: number;
}

export interface ComboPopup {
  text: string;
  x: number;
  y: number;
  alpha: number;
  scale: number;
  createdAt: number;
}

export type GamePhase = "idle" | "playing" | "game-over";

export interface FruitSliceState {
  phase: GamePhase;
  score: number;
  bestScore: number;
  lives: number;
  combo: number;
  maxCombo: number;
  /** Screen dimensions for scaling */
  width: number;
  height: number;
}

export const FRUIT_COLORS: Record<FruitType, { body: string; flesh: string; seeds: string }> = {
  watermelon: { body: "#2d6b2d", flesh: "#ff3b3b", seeds: "#1a1a1a" },
  orange:     { body: "#ff8c00", flesh: "#ffa500", seeds: "#fff5e0" },
  apple:      { body: "#cc2233", flesh: "#ffe0e0", seeds: "#5a3e28" },
  banana:     { body: "#ffe135", flesh: "#fffacd", seeds: "#8b7d3c" },
  kiwi:      { body: "#7b6b3a", flesh: "#8cc63f", seeds: "#1a1a1a" },
  strawberry: { body: "#cc2255", flesh: "#ff6b81", seeds: "#ffd700" },
  mango:      { body: "#ff9800", flesh: "#ffcc02", seeds: "#8b6914" },
  pineapple:  { body: "#b8860b", flesh: "#ffe066", seeds: "#5a4000" },
};

export const FRUIT_SLICE_STORAGE_KEY = "fruit-slice-best-score";
