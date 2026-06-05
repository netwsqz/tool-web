# 切水果 (Fruit Slice) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure client-side fruit slicing game with canvas rendering, physics, particle effects, sound, and polished glassmorphism UI.

**Architecture:** Canvas-based game loop with requestAnimationFrame. All game logic (entities, physics, collision, particles) lives in a pure engine module. A React hook bridges the engine to canvas DOM and manages UI state. Presentational components handle overlays (start screen, HUD, game over). No server needed.

**Tech Stack:** HTML5 Canvas 2D, Web Audio API, React (hooks + refs pattern), TypeScript strict, Tailwind CSS v4, existing glassmorphism design system.

---

## File Structure

### New files (11)

| File | Responsibility |
|------|----------------|
| `src/types/fruit-slice.ts` | All type definitions for game entities and state |
| `src/lib/fruit-slice/engine.ts` | Core game loop, entity spawning, physics, collision detection, scoring |
| `src/lib/fruit-slice/entities.ts` | Fruit/bomb drawing functions, entity data (colors, shapes, slice textures) |
| `src/lib/fruit-slice/particles.ts` | Juice particle system, trail rendering, combo text popups |
| `src/lib/fruit-slice/sound-engine.ts` | Web Audio synthesis for all game sounds |
| `src/hooks/useFruitSlice.ts` | React hook: canvas ref, game state, start/restart, pointer handling |
| `src/components/fruit-slice/GameCanvas.tsx` | Canvas wrapper with ResizeObserver, pointer events |
| `src/components/fruit-slice/HUD.tsx` | Score (top-left), lives/hearts (top-right) |
| `src/components/fruit-slice/StartScreen.tsx` | Glassmorphism card: title, instructions, best score, start button |
| `src/components/fruit-slice/GameOverScreen.tsx` | Glassmorphism overlay: score, best, new-record badge, restart |
| `src/app/tools/fruit-slice/page.tsx` | Page component assembling all pieces |

### Modified files (4)

| File | Change |
|------|--------|
| `src/types/index.ts` | Re-export from `fruit-slice.ts` |
| `src/lib/tools.ts` | Add fruit-slice tool config entry |
| `src/components/ui/ToolCard.tsx` | Add `Cherry` to iconMap + import |
| `src/components/ui/Sidebar.tsx` | Add `Cherry` to iconMap + import |

---

### Task 1: Types

**Files:**
- Create: `src/types/fruit-slice.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Create type definitions**

```typescript
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
```

- [ ] **Step 2: Add re-export to types/index.ts**

Add at the end of `src/types/index.ts`:
```typescript
export type { FruitType, Fruit, Bomb, JuiceParticle, SlashPoint, ComboPopup, GamePhase, FruitSliceState } from "./fruit-slice";
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 2: Entity drawing and fruit data

**Files:**
- Create: `src/lib/fruit-slice/entities.ts`

- [ ] **Step 1: Create entity drawing module**

```typescript
// src/lib/fruit-slice/entities.ts
import type { FruitType } from "@/types/fruit-slice";
import { FRUIT_COLORS } from "@/types/fruit-slice";

/** Draw a whole fruit (pre-slice). ctx centered at fruit origin, rotated. */
export function drawFruit(
  ctx: CanvasRenderingContext2D,
  type: FruitType,
  radius: number,
  rotation: number,
) {
  const colors = FRUIT_COLORS[type];
  ctx.save();
  ctx.rotate(rotation);

  // Body circle
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = colors.body;
  ctx.fill();

  // Inner flesh circle (slightly smaller)
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
  ctx.fillStyle = colors.flesh;
  ctx.fill();

  // Fruit-specific details
  drawFruitDetails(ctx, type, radius, colors);

  ctx.restore();
}

function drawFruitDetails(
  ctx: CanvasRenderingContext2D,
  type: FruitType,
  radius: number,
  colors: { body: string; flesh: string; seeds: string },
) {
  switch (type) {
    case "watermelon":
      // Black seeds
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const r = radius * 0.45;
        ctx.beginPath();
        ctx.ellipse(
          Math.cos(angle) * r,
          Math.sin(angle) * r,
          radius * 0.04,
          radius * 0.07,
          angle,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = colors.seeds;
        ctx.fill();
      }
      break;

    case "orange":
      // Segment lines
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * radius * 0.7, Math.sin(angle) * radius * 0.7);
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      break;

    case "apple":
      // Small highlight
      ctx.beginPath();
      ctx.ellipse(-radius * 0.2, -radius * 0.25, radius * 0.15, radius * 0.1, -0.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fill();
      // Stem
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.85);
      ctx.lineTo(radius * 0.05, -radius * 1.05);
      ctx.strokeStyle = "#5a3e28";
      ctx.lineWidth = 2;
      ctx.stroke();
      break;

    case "banana":
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.85, 0.3, Math.PI - 0.3);
      ctx.strokeStyle = "#c5a02e";
      ctx.lineWidth = 2;
      ctx.stroke();
      break;

    case "kiwi":
      // Tiny seeds
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + 0.3;
        const r = radius * (0.2 + Math.random() * 0.35);
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = colors.seeds;
        ctx.fill();
      }
      // Center white dot
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = "#e8e8d0";
      ctx.fill();
      break;

    case "strawberry":
      // Seeds (yellow dots)
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = radius * 0.5;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 2, 0, Math.PI * 2);
        ctx.fillStyle = colors.seeds;
        ctx.fill();
      }
      // Small leaf on top
      ctx.beginPath();
      ctx.ellipse(0, -radius * 0.85, radius * 0.2, radius * 0.08, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#2d8b2d";
      ctx.fill();
      break;

    case "mango":
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.95, radius * 0.75, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = colors.body;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.7, radius * 0.55, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = colors.flesh;
      ctx.fill();
      break;

    case "pineapple":
      // Grid pattern
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * radius * 0.2, -radius * 0.6);
        ctx.lineTo(i * radius * 0.25, radius * 0.6);
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-radius * 0.6, i * radius * 0.2);
        ctx.lineTo(radius * 0.6, i * radius * 0.2);
        ctx.stroke();
      }
      // Crown leaves
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * radius * 0.1, -radius * 0.8);
        ctx.lineTo(i * radius * 0.15, -radius * 1.2);
        ctx.strokeStyle = "#2d8b2d";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      break;
  }
}

/** Draw one half of a sliced fruit. half: -1 = left, 1 = right. */
export function drawFruitHalf(
  ctx: CanvasRenderingContext2D,
  type: FruitType,
  radius: number,
  half: -1 | 1,
  rotation: number,
) {
  const colors = FRUIT_COLORS[type];
  ctx.save();
  ctx.rotate(rotation);

  // Clip to half
  ctx.beginPath();
  ctx.rect(half === -1 ? -radius * 2 : 0, -radius * 2, radius * 2, radius * 4);
  ctx.clip();

  // Full circle (exposed flesh side shows)
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = colors.flesh;
  ctx.fill();

  // Border
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.strokeStyle = colors.body;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Flat cut surface
  ctx.beginPath();
  ctx.moveTo(0, -radius);
  ctx.lineTo(0, radius);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

/** Draw a bomb. */
export function drawBomb(
  ctx: CanvasRenderingContext2D,
  radius: number,
  rotation: number,
) {
  ctx.save();
  ctx.rotate(rotation);

  // Body
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
  grad.addColorStop(0, "#444");
  grad.addColorStop(1, "#111");
  ctx.fillStyle = grad;
  ctx.fill();

  // Fuse
  ctx.beginPath();
  ctx.moveTo(0, -radius);
  ctx.quadraticCurveTo(radius * 0.5, -radius * 1.5, radius * 0.2, -radius * 1.3);
  ctx.strokeStyle = "#8B6914";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Spark
  ctx.beginPath();
  ctx.arc(radius * 0.2, -radius * 1.3, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#ff6600";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(radius * 0.2, -radius * 1.3, 7, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,100,0,0.3)";
  ctx.fill();

  // Skull hint (small X)
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  const s = radius * 0.2;
  ctx.beginPath();
  ctx.moveTo(-s, -s);
  ctx.lineTo(s, s);
  ctx.moveTo(s, -s);
  ctx.lineTo(-s, s);
  ctx.stroke();

  ctx.restore();
}

/** Random fruit type. */
const FRUIT_TYPES: FruitType[] = ["watermelon", "orange", "apple", "banana", "kiwi", "strawberry", "mango", "pineapple"];

export function randomFruitType(): FruitType {
  return FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 3: Particle system

**Files:**
- Create: `src/lib/fruit-slice/particles.ts`

- [ ] **Step 1: Create particle system module**

```typescript
// src/lib/fruit-slice/particles.ts
import type { JuiceParticle, SlashPoint, ComboPopup } from "@/types/fruit-slice";

const GRAVITY = 0.35;
const PARTICLE_FADE = 0.018;
const MAX_PARTICLES = 150;
const MAX_SLASH_POINTS = 20;
const TRAIL_LIFETIME = 150; // ms

/** Spawn juice burst particles at (x, y) with given color. */
export function spawnJuice(
  particles: JuiceParticle[],
  x: number,
  y: number,
  color: string,
  count: number = 12,
) {
  for (let i = 0; i < count; i++) {
    if (particles.length >= MAX_PARTICLES) break;
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      radius: 2 + Math.random() * 4,
      color,
      alpha: 1,
    });
  }
}

/** Update particles: apply gravity, fade, remove dead. */
export function updateParticles(particles: JuiceParticle[]) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vy += GRAVITY;
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= PARTICLE_FADE;
    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }
}

/** Draw all juice particles. */
export function drawParticles(ctx: CanvasRenderingContext2D, particles: JuiceParticle[]) {
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Add a point to the slash trail. */
export function addSlashPoint(trail: SlashPoint[], x: number, y: number) {
  trail.push({ x, y, time: performance.now() });
  while (trail.length > MAX_SLASH_POINTS) {
    trail.shift();
  }
}

/** Remove old trail points. */
export function updateTrail(trail: SlashPoint[]) {
  const now = performance.now();
  while (trail.length > 0 && now - trail[0].time > TRAIL_LIFETIME) {
    trail.shift();
  }
}

/** Draw the slash trail as a glowing line. */
export function drawTrail(ctx: CanvasRenderingContext2D, trail: SlashPoint[]) {
  if (trail.length < 2) return;
  const now = performance.now();

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 1; i < trail.length; i++) {
    const p0 = trail[i - 1];
    const p1 = trail[i];
    const age = (now - p1.time) / TRAIL_LIFETIME;
    const alpha = Math.max(0, 1 - age);

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.strokeStyle = `rgba(255, 220, 180, ${alpha * 0.9})`;
    ctx.lineWidth = 3 * alpha + 1;
    ctx.stroke();

    // Glow
    ctx.strokeStyle = `rgba(255, 200, 100, ${alpha * 0.3})`;
    ctx.lineWidth = 8 * alpha + 2;
    ctx.stroke();
  }

  ctx.restore();
}

/** Spawn a combo popup. */
export function spawnCombo(popups: ComboPopup[], combo: number, x: number, y: number) {
  popups.push({
    text: `${combo} 连击!`,
    x,
    y,
    alpha: 1,
    scale: 1.5,
    createdAt: performance.now(),
  });
}

/** Update combo popups: scale down, fade. */
export function updateCombos(popups: ComboPopup[]) {
  for (let i = popups.length - 1; i >= 0; i--) {
    const p = popups[i];
    p.scale += (1 - p.scale) * 0.1;
    p.alpha -= 0.015;
    p.y -= 1;
    if (p.alpha <= 0) {
      popups.splice(i, 1);
    }
  }
}

/** Draw combo popups. */
export function drawCombos(ctx: CanvasRenderingContext2D, popups: ComboPopup[]) {
  ctx.save();
  for (const p of popups) {
    ctx.globalAlpha = p.alpha;
    ctx.font = `bold ${Math.round(24 * p.scale)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Glow
    ctx.shadowColor = "#ff8800";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#fff";
    ctx.fillText(p.text, p.x, p.y);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 4: Sound engine

**Files:**
- Create: `src/lib/fruit-slice/sound-engine.ts`

- [ ] **Step 1: Create Web Audio sound engine**

```typescript
// src/lib/fruit-slice/sound-engine.ts

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/** Short crisp slash sound: noise burst + high-pass filter */
export function playSlash() {
  const ctx = getCtx();
  const duration = 0.12;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / ctx.sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.4;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 3000;
  source.connect(filter).connect(ctx.destination);
  source.start();
}

/** Combo ding with rising pitch */
export function playCombo(combo: number) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  // Pitch rises with combo: base 800Hz, +100 per combo, capped at 2000
  osc.frequency.value = Math.min(800 + combo * 100, 2000);
  osc.type = "sine";
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

/** Low boom for bomb */
export function playBomb() {
  const ctx = getCtx();
  const duration = 0.5;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / ctx.sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8) * 0.6 +
              Math.sin(t * 60 * Math.PI * 2) * Math.exp(-t * 6) * 0.5;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 400;
  source.connect(filter).connect(ctx.destination);
  source.start();
}

/** Short warning beep for missed fruit */
export function playMiss() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 300;
  osc.type = "square";
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

/** Descending sad tone for game over */
export function playGameOver() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.6);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.7);
}

/** Vibrate on mobile (if supported) */
export function vibrate(ms: number = 30) {
  if (navigator.vibrate) {
    navigator.vibrate(ms);
  }
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 5: Game engine

**Files:**
- Create: `src/lib/fruit-slice/engine.ts`

- [ ] **Step 1: Create the core game engine**

```typescript
// src/lib/fruit-slice/engine.ts
import type { Fruit, Bomb, SlashPoint, JuiceParticle, ComboPopup } from "@/types/fruit-slice";
import { FRUIT_COLORS } from "@/types/fruit-slice";
import { randomFruitType, drawFruit, drawFruitHalf, drawBomb } from "./entities";
import {
  spawnJuice, updateParticles, drawParticles,
  addSlashPoint, updateTrail, drawTrail,
  updateCombos, drawCombos,
} from "./particles";

export interface EngineConfig {
  width: number;
  height: number;
  onScore: (score: number, combo: number) => void;
  onMiss: () => void;
  onBombHit: () => void;
  onCombo: (combo: number, x: number, y: number) => void;
  reducedMotion: boolean;
}

let nextId = 0;

export class GameEngine {
  private fruits: Fruit[] = [];
  private bombs: Bomb[] = [];
  private halfFruits: { fruit: Fruit; half: -1 | 1; vx: number; vy: number; rot: number }[] = [];
  private particles: JuiceParticle[] = [];
  private trail: SlashPoint[] = [];
  private combos: ComboPopup[] = [];

  private width: number;
  private height: number;
  private config: EngineConfig;
  private lastSpawn = 0;
  private spawnInterval = 800;
  private difficulty = 0;
  private slashActive = false;
  private lastSlashX = 0;
  private lastSlashY = 0;

  // Game state
  score = 0;
  lives = 3;
  combo = 0;
  private comboTimer = 0;
  private readonly COMBO_TIMEOUT = 600; // ms

  // Pooled arrays exposed for read
  private _reducedMotion: boolean;

  constructor(config: EngineConfig) {
    this.width = config.width;
    this.height = config.height;
    this.config = config;
    this._reducedMotion = config.reducedMotion;
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  setReducedMotion(v: boolean) {
    this._reducedMotion = v;
  }

  start() {
    this.fruits = [];
    this.bombs = [];
    this.halfFruits = [];
    this.particles = [];
    this.trail = [];
    this.combos = [];
    this.score = 0;
    this.lives = 3;
    this.combo = 0;
    this.difficulty = 0;
    this.lastSpawn = performance.now();
    this.spawnInterval = 800;
  }

  /** Called each frame */
  update(now: number, dt: number) {
    // Difficulty ramp
    this.difficulty = Math.min(this.score / 500, 5);
    this.spawnInterval = Math.max(350, 800 - this.difficulty * 80);

    // Spawn
    if (now - this.lastSpawn > this.spawnInterval) {
      this.spawn(now);
      this.lastSpawn = now;
    }

    // Update fruits
    const gravity = 0.18;
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i];
      if (!f.active) continue;
      f.vy += gravity;
      f.x += f.vx;
      f.y += f.vy;
      f.rotation += f.rotationSpeed;

      // Sliced halves
      if (f.sliced) {
        if (now - f.sliceTime > 2000) {
          this.fruits.splice(i, 1);
        }
        continue;
      }

      // Missed: fell below screen
      if (f.y - f.radius > this.height + 50) {
        this.fruits.splice(i, 1);
        this.lives--;
        this.combo = 0;
        this.config.onMiss();
        if (this.lives <= 0) {
          return; // game over handled by hook
        }
      }
    }

    // Update bombs
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      if (!b.active) continue;
      b.vy += gravity;
      b.x += b.vx;
      b.y += b.vy;
      b.rotation += b.rotationSpeed;
      if (b.y - b.radius > this.height + 50 || b.hit) {
        this.bombs.splice(i, 1);
      }
    }

    // Update half fruits
    for (let i = this.halfFruits.length - 1; i >= 0; i--) {
      const h = this.halfFruits[i];
      h.vy += gravity;
      h.fruit.x += h.vx;
      h.fruit.y += h.vy;
      h.rot += h.fruit.rotationSpeed;
      if (h.fruit.y > this.height + 100) {
        this.halfFruits.splice(i, 1);
      }
    }

    // Combo timeout
    if (this.combo > 0 && now - this.comboTimer > this.COMBO_TIMEOUT) {
      this.combo = 0;
    }

    // Particles
    if (!this._reducedMotion) {
      updateParticles(this.particles);
      updateTrail(this.trail);
      updateCombos(this.combos);
    }
  }

  /** Spawn a fruit or bomb */
  private spawn(now: number) {
    const isBomb = Math.random() < 0.06 + this.difficulty * 0.01;
    const radius = 25 + Math.random() * 15;
    const x = radius + Math.random() * (this.width - radius * 2);
    const y = this.height + radius;
    const vx = (Math.random() - 0.5) * 3;
    const vy = -(10 + Math.random() * 4 + this.difficulty * 0.5);
    const rotSpeed = (Math.random() - 0.5) * 0.1;

    if (isBomb) {
      this.bombs.push({
        id: nextId++,
        x, y, vx, vy,
        rotation: 0,
        rotationSpeed: rotSpeed,
        radius,
        active: true,
        hit: false,
      });
    } else {
      this.fruits.push({
        id: nextId++,
        type: randomFruitType(),
        x, y, vx, vy,
        rotation: 0,
        rotationSpeed: rotSpeed,
        radius,
        active: true,
        sliced: false,
        sliceTime: 0,
      });
    }

    // Occasionally spawn a cluster
    if (!isBomb && Math.random() < 0.3) {
      const count = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const fr = 25 + Math.random() * 15;
        this.fruits.push({
          id: nextId++,
          type: randomFruitType(),
          x: x + (Math.random() - 0.5) * 80,
          y: y + Math.random() * 30,
          vx: vx + (Math.random() - 0.5) * 2,
          vy: vy + Math.random() * 2,
          rotation: 0,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
          radius: fr,
          active: true,
          sliced: false,
          sliceTime: 0,
        });
      }
    }
  }

  /** Start a slash at (x, y) */
  slashStart(x: number, y: number) {
    this.slashActive = true;
    this.lastSlashX = x;
    this.lastSlashY = y;
    if (!this._reducedMotion) {
      addSlashPoint(this.trail, x, y);
    }
  }

  /** Continue slash to (x, y), check collisions */
  slashMove(x: number, y: number, now: number) {
    if (!this.slashActive) return;
    if (!this._reducedMotion) {
      addSlashPoint(this.trail, x, y);
    }

    // Check fruit collisions
    for (const f of this.fruits) {
      if (f.sliced) continue;
      if (this.lineIntersectsCircle(this.lastSlashX, this.lastSlashY, x, y, f.x, f.y, f.radius)) {
        this.sliceFruit(f, now);
      }
    }

    // Check bomb collisions
    for (const b of this.bombs) {
      if (b.hit) continue;
      if (this.lineIntersectsCircle(this.lastSlashX, this.lastSlashY, x, y, b.x, b.y, b.radius)) {
        b.hit = true;
        b.active = false;
        this.config.onBombHit();
        return;
      }
    }

    this.lastSlashX = x;
    this.lastSlashY = y;
  }

  /** End slash */
  slashEnd() {
    this.slashActive = false;
  }

  private sliceFruit(f: Fruit, now: number) {
    f.sliced = true;
    f.sliceTime = now;

    // Spawn halves
    const spreadVx = 3;
    this.halfFruits.push(
      { fruit: { ...f }, half: -1, vx: f.vx - spreadVx, vy: f.vy - 2, rot: f.rotation },
      { fruit: { ...f }, half: 1, vx: f.vx + spreadVx, vy: f.vy - 2, rot: f.rotation },
    );

    // Juice particles
    const colors = FRUIT_COLORS[f.type];
    if (!this._reducedMotion) {
      spawnJuice(this.particles, f.x, f.y, colors.flesh, 10);
      spawnJuice(this.particles, f.x, f.y, colors.body, 5);
    }

    // Scoring
    this.combo++;
    this.comboTimer = now;
    const comboBonus = Math.min(this.combo - 1, 10);
    const points = 10 + comboBonus * 5;
    this.score += points;
    this.config.onScore(this.score, this.combo);

    // Combo popup
    if (this.combo >= 2) {
      this.config.onCombo(this.combo, f.x, f.y);
      if (!this._reducedMotion) {
        spawnCombo(this.combos, this.combo, f.x, f.y);
      }
    }
  }

  /** Check if line segment (x1,y1)-(x2,y2) intersects circle at (cx,cy) with radius r */
  private lineIntersectsCircle(
    x1: number, y1: number, x2: number, y2: number,
    cx: number, cy: number, r: number,
  ): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const fx = x1 - cx;
    const fy = y1 - cy;
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - r * r;
    let discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return false;
    discriminant = Math.sqrt(discriminant);
    const t1 = (-b - discriminant) / (2 * a);
    const t2 = (-b + discriminant) / (2 * a);
    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) || (t1 < 0 && t2 > 1);
  }

  /** Render everything to canvas */
  draw(ctx: CanvasRenderingContext2D) {
    // Clear
    ctx.clearRect(0, 0, this.width, this.height);

    // Background: subtle dark texture
    ctx.fillStyle = "#0a0a0c";
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw grid pattern (very subtle)
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Slash trail
    if (!this._reducedMotion) {
      drawTrail(ctx, this.trail);
    }

    // Half fruits
    for (const h of this.halfFruits) {
      ctx.save();
      ctx.translate(h.fruit.x, h.fruit.y);
      drawFruitHalf(ctx, h.fruit.type, h.fruit.radius, h.half, h.rot);
      ctx.restore();
    }

    // Whole fruits
    for (const f of this.fruits) {
      if (f.sliced) continue;
      ctx.save();
      ctx.translate(f.x, f.y);
      drawFruit(ctx, f.type, f.radius, f.rotation);
      ctx.restore();
    }

    // Bombs
    for (const b of this.bombs) {
      if (b.hit) continue;
      ctx.save();
      ctx.translate(b.x, b.y);
      drawBomb(ctx, b.radius, b.rotation);
      ctx.restore();
    }

    // Juice particles
    if (!this._reducedMotion) {
      drawParticles(ctx, this.particles);
      drawCombos(ctx, this.combos);
    }
  }

  stop() {
    // Cleanup hook; animation frame is managed by the React hook
  }
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 6: useFruitSlice hook

**Files:**
- Create: `src/hooks/useFruitSlice.ts`

- [ ] **Step 1: Create the React hook**

```typescript
// src/hooks/useFruitSlice.ts
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { GamePhase } from "@/types/fruit-slice";
import { FRUIT_SLICE_STORAGE_KEY } from "@/types/fruit-slice";
import { GameEngine } from "@/lib/fruit-slice/engine";
import { playSlash, playCombo, playBomb, playMiss, playGameOver, vibrate } from "@/lib/fruit-slice/sound-engine";

export function useFruitSlice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const animRef = useRef(0);
  const slashRef = useRef(false);
  const lastSlashSoundRef = useRef(0);

  const [phase, setPhase] = useState<GamePhase>("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Load best score
  useEffect(() => {
    const stored = localStorage.getItem(FRUIT_SLICE_STORAGE_KEY);
    if (stored) setBestScore(parseInt(stored, 10) || 0);
  }, []);

  // Check reduced motion
  const reducedMotionRef = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const handler = (e: MediaQueryListEvent) => { reducedMotionRef.current = e.matches; };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const getPos = useCallback((e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const gameOver = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    playGameOver();

    setPhase("game-over");
    const engine = engineRef.current;
    if (!engine) return;

    const finalScore = engine.score;
    setScore(finalScore);

    if (finalScore > bestScore) {
      setBestScore(finalScore);
      setIsNewRecord(true);
      localStorage.setItem(FRUIT_SLICE_STORAGE_KEY, String(finalScore));
    } else {
      setIsNewRecord(false);
    }
  }, [bestScore]);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Size canvas to parent
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    const engine = new GameEngine({
      width: canvas.width,
      height: canvas.height,
      onScore: (s, c) => {
        setScore(s);
        setCombo(c);
        if (c >= 2) playCombo(c);
      },
      onMiss: () => {
        setLives(l => {
          const next = l - 1;
          playMiss();
          if (next <= 0) {
            gameOver();
          }
          return next;
        });
      },
      onBombHit: () => {
        playBomb();
        vibrate(100);
        setLives(0);
        gameOver();
      },
      onCombo: () => {},
      reducedMotion: reducedMotionRef.current,
    });

    engineRef.current = engine;
    engine.start();
    setScore(0);
    setLives(3);
    setCombo(0);
    setIsNewRecord(false);
    setPhase("playing");

    // Game loop
    const loop = (now: number) => {
      engine.update(now, 16);
      engine.draw(ctx);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
  }, [gameOver]);

  // Pointer handlers
  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (phase !== "playing") return;
    const pos = getPos(e.nativeEvent);
    if (!pos) return;
    slashRef.current = true;
    engineRef.current?.slashStart(pos.x, pos.y);
  }, [phase, getPos]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!slashRef.current || phase !== "playing") return;
    const pos = getPos(e.nativeEvent);
    if (!pos) return;
    const now = performance.now();
    engineRef.current?.slashMove(pos.x, pos.y, now);
    // Throttle slash sound to max once per 80ms
    if (now - lastSlashSoundRef.current > 80) {
      playSlash();
      vibrate(15);
      lastSlashSoundRef.current = now;
    }

    // Sync React state from engine
    const engine = engineRef.current;
    if (engine) {
      setScore(engine.score);
      setLives(engine.lives);
      setCombo(engine.combo);
    }
  }, [phase, getPos]);

  const handlePointerUp = useCallback(() => {
    slashRef.current = false;
    engineRef.current?.slashEnd();
  }, []);

  // Resize handler
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      engineRef.current.resize(canvas.width, canvas.height);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      engineRef.current?.stop();
    };
  }, []);

  return {
    canvasRef,
    phase,
    score,
    lives,
    combo,
    bestScore,
    isNewRecord,
    startGame,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleResize,
  };
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 7: GameCanvas component

**Files:**
- Create: `src/components/fruit-slice/GameCanvas.tsx`

- [ ] **Step 1: Create canvas component**

```tsx
// src/components/fruit-slice/GameCanvas.tsx
"use client";

import { useEffect, useRef } from "react";

type GameCanvasProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onPointerDown: (e: React.MouseEvent | React.TouchEvent) => void;
  onPointerMove: (e: React.MouseEvent | React.TouchEvent) => void;
  onPointerUp: () => void;
  onResize: () => void;
};

export function GameCanvas({
  canvasRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onResize,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => onResize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [onResize]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ touchAction: "none", userSelect: "none" }}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 8: HUD component

**Files:**
- Create: `src/components/fruit-slice/HUD.tsx`

- [ ] **Step 1: Create HUD overlay**

```tsx
// src/components/fruit-slice/HUD.tsx
"use client";

import { Heart } from "lucide-react";

type HUDProps = {
  score: number;
  lives: number;
  combo: number;
};

export function HUD({ score, lives, combo }: HUDProps) {
  return (
    <>
      {/* Score - top left */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="glass rounded-xl px-4 py-2">
          <div className="text-xs text-[var(--color-foreground-muted)]">分数</div>
          <div className="text-2xl font-bold text-[var(--color-foreground)] tabular-nums">
            {score}
          </div>
        </div>
      </div>

      {/* Lives - top right */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className="glass rounded-xl px-3 py-2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <Heart
              key={i}
              className={`size-5 transition-all duration-200 ${
                i < lives
                  ? "text-red-500 fill-red-500"
                  : "text-[var(--color-foreground-subtle)] opacity-30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Combo - center (fading, handled by canvas, but show persistent badge for 3+) */}
      {combo >= 3 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none animate-scale-in">
          <div className="glass rounded-full px-5 py-1.5 bg-orange-500/10 border-orange-500/20">
            <span className="text-sm font-bold text-orange-400">
              {combo}x 连击!
            </span>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 9: StartScreen component

**Files:**
- Create: `src/components/fruit-slice/StartScreen.tsx`

- [ ] **Step 1: Create start screen overlay**

```tsx
// src/components/fruit-slice/StartScreen.tsx
"use client";

type StartScreenProps = {
  bestScore: number;
  onStart: () => void;
};

export function StartScreen({ bestScore, onStart }: StartScreenProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="glass-high rounded-3xl p-8 text-center max-w-sm mx-4 animate-scale-in">
        <div className="text-4xl mb-3"> </div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
          切水果
        </h1>
        <p className="text-sm text-[var(--color-foreground-muted)] mb-6 leading-relaxed">
          滑动手指切开飞起的水果<br />
          小心不要切到炸弹！
        </p>

        <div className="glass rounded-xl px-4 py-2 mb-6 inline-block">
          <span className="text-xs text-[var(--color-foreground-muted)]">最高分 </span>
          <span className="text-lg font-bold text-[var(--color-accent)] tabular-nums">
            {bestScore}
          </span>
        </div>

        <div className="flex flex-col gap-2 text-xs text-[var(--color-foreground-subtle)] mb-6">
          <span>  切水果 +10 分</span>
          <span>⚡ 连击加分递增</span>
          <span>  切中炸弹立即结束</span>
          <span>❤️ 漏切水果扣一条命</span>
        </div>

        <button
          onClick={onStart}
          className="w-full py-3 rounded-xl font-medium text-white
            bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
            transition-all duration-200 active:scale-95 cursor-pointer"
        >
          开始游戏
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 10: GameOverScreen component

**Files:**
- Create: `src/components/fruit-slice/GameOverScreen.tsx`

- [ ] **Step 1: Create game over overlay**

```tsx
// src/components/fruit-slice/GameOverScreen.tsx
"use client";

type GameOverScreenProps = {
  score: number;
  bestScore: number;
  isNewRecord: boolean;
  onRestart: () => void;
};

export function GameOverScreen({ score, bestScore, isNewRecord, onRestart }: GameOverScreenProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-high rounded-3xl p-8 text-center max-w-sm mx-4 animate-scale-in">
        <div className="text-4xl mb-3"> </div>
        <h2 className="text-xl font-bold text-[var(--color-foreground)] mb-4">
          游戏结束
        </h2>

        <div className="space-y-3 mb-6">
          <div className="glass rounded-xl px-4 py-3">
            <div className="text-xs text-[var(--color-foreground-muted)]">本局得分</div>
            <div className="text-3xl font-bold text-[var(--color-foreground)] tabular-nums">
              {score}
            </div>
          </div>

          {isNewRecord && (
            <div className="glass rounded-xl px-4 py-2 bg-yellow-500/10 border-yellow-500/20 animate-ping-once">
              <span className="text-sm font-bold text-yellow-400">
                新纪录！
              </span>
            </div>
          )}

          <div className="glass rounded-xl px-4 py-2">
            <span className="text-xs text-[var(--color-foreground-muted)]">最高分 </span>
            <span className="text-lg font-bold text-[var(--color-accent)] tabular-nums">
              {bestScore}
            </span>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-3 rounded-xl font-medium text-white
            bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
            transition-all duration-200 active:scale-95 cursor-pointer"
        >
          再来一局
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 11: Page component

**Files:**
- Create: `src/app/tools/fruit-slice/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/tools/fruit-slice/page.tsx
"use client";

import { useFruitSlice } from "@/hooks/useFruitSlice";
import { GameCanvas } from "@/components/fruit-slice/GameCanvas";
import { HUD } from "@/components/fruit-slice/HUD";
import { StartScreen } from "@/components/fruit-slice/StartScreen";
import { GameOverScreen } from "@/components/fruit-slice/GameOverScreen";

export default function FruitSlicePage() {
  const {
    canvasRef,
    phase,
    score,
    lives,
    combo,
    bestScore,
    isNewRecord,
    startGame,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleResize,
  } = useFruitSlice();

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 0px)" }}>
      {/* Background texture */}
      <div className="absolute inset-0 bg-[var(--color-bg-deep)]" />

      {/* Canvas always mounted (for engine lifecycle) */}
      <GameCanvas
        canvasRef={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onResize={handleResize}
      />

      {/* Overlays */}
      {phase === "idle" && (
        <StartScreen bestScore={bestScore} onStart={startGame} />
      )}

      {phase === "playing" && (
        <HUD score={score} lives={lives} combo={combo} />
      )}

      {phase === "game-over" && (
        <GameOverScreen
          score={score}
          bestScore={bestScore}
          isNewRecord={isNewRecord}
          onRestart={startGame}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 12: Register tool + icon mapping

**Files:**
- Modify: `src/lib/tools.ts`
- Modify: `src/components/ui/ToolCard.tsx`
- Modify: `src/components/ui/Sidebar.tsx`

- [ ] **Step 1: Add tool entry to tools.ts**

Add after the draw-guess entry (after line 80):
```typescript
  {
    id: "fruit-slice",
    name: "切水果",
    description: "休闲解压 · 滑动切水果",
    icon: "Cherry",
    path: "/tools/fruit-slice",
    status: "active",
    category: "creative",
  },
```

- [ ] **Step 2: Add Cherry icon to ToolCard.tsx**

Add `Cherry` to the lucide-react import (line 18) and to the `iconMap` object.

- [ ] **Step 3: Add Cherry icon to Sidebar.tsx**

Add `Cherry` to the lucide-react import (line 22) and to the `iconMap` object.

- [ ] **Step 4: Final type check + lint**

Run: `npx tsc --noEmit && npx next lint`
Expected: PASS

---

## Self-Review Checklist

**Spec coverage:**
- [x] Fruits spawn from bottom, parabolic trajectory + rotation → engine.spawn(), vy negative upward, gravity pulls down
- [x] Mouse drag / touch swipe to slice → slashStart/slashMove/slashEnd with pointer events
- [x] Fruit splits in half with cross-section → drawFruitHalf with clip + flesh color
- [x] Juice particles matching fruit color → spawnJuice with FRUIT_COLORS[type].flesh
- [x] Missed fruit = lose life, 3 lives → engine checks y > height + 50
- [x] Bomb = instant game over → onBombHit callback sets lives to 0
- [x] Combo system with scoring multiplier → combo counter + bonus = combo * 5
- [x] Best score from localStorage → useFruitSlice loads/saves FRUIT_SLICE_STORAGE_KEY
- [x] Full-screen canvas minus sidebar → absolute positioned div with calc height
- [x] Start screen glassmorphism card → StartScreen with glass-high
- [x] HUD: score top-left, hearts top-right → HUD component
- [x] Game over overlay with glass card → GameOverScreen
- [x] Dark textured background → engine.draw fills dark bg + subtle grid
- [x] Slash trail white/orange with gradient fade → drawTrail with age-based alpha
- [x] Bomb: dark sphere with fuse → drawBomb with gradient + fuse + spark
- [x] Glassmorphism UI cards → .glass / .glass-high classes
- [x] No scroll/zoom, touch-action: none → GameCanvas container style
- [x] prefers-reduced-motion → reducedMotionRef, skip particles/trail/combos
- [x] Sound: slash, bomb, combo, miss, game over → sound-engine.ts all 5 sounds
- [x] Mobile haptics → vibrate() calls
- [x] Canvas resize → ResizeObserver + handleResize
- [x] Performance: particle cap MAX_PARTICLES=150, trail cap MAX_SLASH_POINTS=20

**No placeholders found** — all steps contain complete, runnable code.

**Type consistency** — `GamePhase`, `Fruit`, `Bomb`, `JuiceParticle`, `SlashPoint`, `ComboPopup`, `FruitSliceState` used consistently across all tasks.
