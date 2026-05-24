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
