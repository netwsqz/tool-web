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
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      break;

    case "apple":
      // Small highlight
      ctx.beginPath();
      ctx.ellipse(-radius * 0.2, -radius * 0.25, radius * 0.15, radius * 0.1, -0.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
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
      // Tiny seeds — deterministic positions using golden angle
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + 0.3;
        const r = radius * (0.2 + ((i * 0.618) % 1) * 0.35);
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
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
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
