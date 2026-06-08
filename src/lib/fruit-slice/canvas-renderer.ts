// src/lib/fruit-slice/canvas-renderer.ts
import type { EngineState } from "./game-engine";
import { drawFruit, drawFruitHalf, drawBomb } from "./entities";
import { drawParticles, drawTrail, drawCombos } from "./particles";

/** Render one frame of the game onto a canvas. */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  state: EngineState,
) {
  const { width, height } = state;

  // Clear
  ctx.clearRect(0, 0, width, height);

  // Background gradient — light sky
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#e8f4fd");
  bg.addColorStop(1, "#dceef8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Draw whole fruits
  for (const f of state.fruits) {
    if (!f.active) continue;
    ctx.save();
    ctx.translate(f.x, f.y);
    drawFruit(ctx, f.type, f.radius, f.rotation);
    ctx.restore();
  }

  // Draw half fruits
  for (const h of state.halves) {
    ctx.save();
    ctx.globalAlpha = h.alpha;
    ctx.translate(h.x, h.y);
    drawFruitHalf(ctx, h.type, h.radius, h.side, h.rotation);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // Draw bombs
  for (const b of state.bombs) {
    if (!b.active) continue;
    ctx.save();
    ctx.translate(b.x, b.y);
    drawBomb(ctx, b.radius, b.rotation);
    ctx.restore();
  }

  // Particles
  drawParticles(ctx, state.particles);

  // Trail
  drawTrail(ctx, state.trail);

  // Combo popups
  drawCombos(ctx, state.popups);
}
