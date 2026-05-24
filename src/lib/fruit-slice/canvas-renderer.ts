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

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#0a0a1a");
  bg.addColorStop(1, "#1a0a2e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Draw fruits
  for (const f of state.fruits) {
    if (!f.active) continue;
    ctx.save();
    ctx.translate(f.x, f.y);

    if (f.sliced) {
      // Draw two halves drifting apart
      drawFruitHalf(ctx, f.type, f.radius, -1, f.rotation);
      ctx.restore();
      ctx.save();
      ctx.translate(f.x, f.y);
      drawFruitHalf(ctx, f.type, f.radius, 1, f.rotation);
    } else {
      drawFruit(ctx, f.type, f.radius, f.rotation);
    }

    ctx.restore();
  }

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
