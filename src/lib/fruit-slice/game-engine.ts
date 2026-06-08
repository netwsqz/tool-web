// src/lib/fruit-slice/game-engine.ts
import type {
  Fruit, Bomb, HalfFruit, JuiceParticle, SlashPoint, ComboPopup,
  FruitSliceState, GamePhase, Point,
} from "@/types/fruit-slice";
import { FRUIT_COLORS } from "@/types/fruit-slice";
import { randomFruitType } from "./entities";
import { spawnJuice, updateParticles, spawnCombo, updateCombos } from "./particles";

// Physics constants — all in pixels/second units
const GRAVITY = 700;          // px/s² — pulls fruits down
const FRUIT_RADIUS = 34;
const BOMB_RADIUS = 28;
const SPAWN_INTERVAL = 900;   // ms between spawns
const BOMB_CHANCE = 0.12;
const MAX_LIVES = 3;
const COMBO_WINDOW = 1200;    // ms to maintain combo
const INITIAL_VY_MIN = -900;  // px/s (upward)
const INITIAL_VY_MAX = -700;  // px/s
const HALF_DRIFT = 150;       // px/s horizontal drift for sliced halves
const HALF_VY_KICK = -120;    // px/s upward kick when sliced

let nextId = 0;

export interface EngineState {
  phase: GamePhase;
  score: number;
  bestScore: number;
  lives: number;
  combo: number;
  maxCombo: number;
  width: number;
  height: number;
  fruits: Fruit[];
  halves: HalfFruit[];
  bombs: Bomb[];
  particles: JuiceParticle[];
  trail: SlashPoint[];
  popups: ComboPopup[];
  lastSpawn: number;
  lastSliceTime: number;
  lastTick: number;
  animFrame: number;
}

export function createInitialState(width: number, height: number): EngineState {
  const best = typeof localStorage !== "undefined"
    ? parseInt(localStorage.getItem("fruit-slice-best-score") || "0", 10)
    : 0;
  return {
    phase: "idle",
    score: 0,
    bestScore: best,
    lives: MAX_LIVES,
    combo: 0,
    maxCombo: 0,
    width,
    height,
    fruits: [],
    halves: [],
    bombs: [],
    particles: [],
    trail: [],
    popups: [],
    lastSpawn: 0,
    lastSliceTime: 0,
    lastTick: 0,
    animFrame: 0,
  };
}

/** Spawn a fruit or bomb from the bottom, arcing upward. */
function spawnEntity(state: EngineState) {
  const { width, height } = state;
  const x = FRUIT_RADIUS + Math.random() * (width - FRUIT_RADIUS * 2);
  const y = height + FRUIT_RADIUS;
  const vx = (width / 2 - x) * (0.04 + Math.random() * 0.04) + (Math.random() - 0.5) * 200;
  const vy = INITIAL_VY_MIN + Math.random() * (INITIAL_VY_MAX - INITIAL_VY_MIN);
  const rotationSpeed = (Math.random() - 0.5) * 4;

  if (Math.random() < BOMB_CHANCE) {
    state.bombs.push({
      id: nextId++, x, y, vx, vy,
      rotation: 0, rotationSpeed,
      radius: BOMB_RADIUS,
      active: true,
      hit: false,
    });
  } else {
    state.fruits.push({
      id: nextId++,
      type: randomFruitType(),
      x, y, vx, vy,
      rotation: 0, rotationSpeed,
      radius: FRUIT_RADIUS,
      active: true,
      sliced: false,
      sliceTime: 0,
    });
  }
}

/** Check if a line segment (p1→p2) intersects a circle. */
function lineCircleDist(p1: Point, p2: Point, cx: number, cy: number, r: number): boolean {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p1.x - cx, p1.y - cy) < r;

  let t = ((cx - p1.x) * dx + (cy - p1.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const closestX = p1.x + t * dx;
  const closestY = p1.y + t * dy;
  return Math.hypot(closestX - cx, closestY - cy) < r;
}

/** Process slash trail against fruits and bombs. Returns events. */
function checkCollisions(state: EngineState): { slicedFruits: Fruit[]; hitBomb: boolean } {
  const { trail, fruits, bombs } = state;
  const result: { slicedFruits: Fruit[]; hitBomb: boolean } = { slicedFruits: [], hitBomb: false };

  if (trail.length < 2) return result;

  // Check last two trail points against all active entities
  const p1 = trail[trail.length - 2];
  const p2 = trail[trail.length - 1];

  for (const fruit of fruits) {
    if (!fruit.active || fruit.sliced) continue;
    if (lineCircleDist(p1, p2, fruit.x, fruit.y, fruit.radius * 1.1)) {
      fruit.sliced = true;
      fruit.sliceTime = performance.now();
      result.slicedFruits.push(fruit);
    }
  }

  for (const bomb of bombs) {
    if (!bomb.active || bomb.hit) continue;
    if (lineCircleDist(p1, p2, bomb.x, bomb.y, bomb.radius * 1.2)) {
      bomb.hit = true;
      result.hitBomb = true;
    }
  }

  return result;
}

/** Full tick: spawn, physics, collisions, cleanup. Mutates state. */
export function tick(state: EngineState, now: number, callbacks?: {
  onSlice?: (fruit: Fruit) => void;
  onBomb?: () => void;
  onMiss?: () => void;
  onCombo?: (combo: number) => void;
  onGameOver?: () => void;
}) {
  if (state.phase !== "playing") return;

  // Delta time in seconds, capped to avoid spiral of death
  const dt = state.lastTick > 0
    ? Math.min((now - state.lastTick) / 1000, 0.05)
    : 1 / 60;
  state.lastTick = now;

  // Spawn
  if (now - state.lastSpawn > SPAWN_INTERVAL) {
    spawnEntity(state);
    state.lastSpawn = now;
  }

  // Physics - fruits (dt-based)
  for (const f of state.fruits) {
    if (!f.active) continue;
    f.vy += GRAVITY * dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.rotation += f.rotationSpeed * dt;
    // Missed fruit (went below screen unsliced)
    if (f.y > state.height + 40) {
      f.active = false;
      state.lives -= 1;
      state.combo = 0;
      callbacks?.onMiss?.();
      if (state.lives <= 0) {
        state.phase = "game-over";
        if (state.score > state.bestScore) {
          state.bestScore = state.score;
          if (typeof localStorage !== "undefined") {
            localStorage.setItem("fruit-slice-best-score", String(state.score));
          }
        }
        callbacks?.onGameOver?.();
        return;
      }
    }
  }

  // Physics - half fruits
  for (let i = state.halves.length - 1; i >= 0; i--) {
    const h = state.halves[i];
    h.vy += GRAVITY * dt;
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    h.rotation += h.rotationSpeed * dt;
    h.alpha -= dt * 0.8;
    if (h.y > state.height + 60 || h.alpha <= 0) {
      state.halves.splice(i, 1);
    }
  }

  // Physics - bombs
  for (const b of state.bombs) {
    if (!b.active) continue;
    b.vy += GRAVITY * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.rotation += b.rotationSpeed * dt;
    if (b.y > state.height + 60) b.active = false;
  }

  // Collisions
  const { slicedFruits, hitBomb } = checkCollisions(state);

  for (const f of slicedFruits) {
    const colors = FRUIT_COLORS[f.type];
    spawnJuice(state.particles, f.x, f.y, colors.flesh, 14);
    // Deactivate the whole fruit
    f.active = false;
    // Spawn two halves that drift apart
    const baseVx = f.vx;
    state.halves.push(
      {
        type: f.type, x: f.x, y: f.y,
        vx: baseVx - HALF_DRIFT, vy: HALF_VY_KICK,
        rotation: f.rotation, rotationSpeed: -3,
        radius: f.radius, side: -1, alpha: 1,
      },
      {
        type: f.type, x: f.x, y: f.y,
        vx: baseVx + HALF_DRIFT, vy: HALF_VY_KICK,
        rotation: f.rotation, rotationSpeed: 3,
        radius: f.radius, side: 1, alpha: 1,
      },
    );

    // Combo
    if (now - state.lastSliceTime < COMBO_WINDOW) {
      state.combo += 1;
    } else {
      state.combo = 1;
    }
    state.lastSliceTime = now;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.score += state.combo;

    callbacks?.onSlice?.(f);
    if (state.combo >= 3) {
      callbacks?.onCombo?.(state.combo);
      spawnCombo(state.popups, state.combo, f.x, f.y);
    }
  }

  if (hitBomb) {
    state.phase = "game-over";
    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("fruit-slice-best-score", String(state.score));
      }
    }
    callbacks?.onBomb?.();
    callbacks?.onGameOver?.();
    return;
  }

  // Update particles & popups (dt-based for half fruits fade above, but particles use frame-based — acceptable since they're cosmetic)
  updateParticles(state.particles);
  updateCombos(state.popups);

  // Cleanup
  state.fruits = state.fruits.filter((f) => f.active);
  state.bombs = state.bombs.filter((b) => b.active);
}

/** Snapshot for React state. */
export function snapshot(state: EngineState): FruitSliceState {
  return {
    phase: state.phase,
    score: state.score,
    bestScore: state.bestScore,
    lives: state.lives,
    combo: state.combo,
    maxCombo: state.maxCombo,
    width: state.width,
    height: state.height,
  };
}
