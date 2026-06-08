"use client";

import { useEffect, useRef } from "react";
import { useMusicPlayerContext } from "./MusicPlayerContext";

type SpectrumAnalyzerProps = {
  barCount?: number;
};

export function SpectrumAnalyzer({ barCount = 64 }: SpectrumAnalyzerProps) {
  const ctx = useMusicPlayerContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let rafId: number;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      context.clearRect(0, 0, w, h);

      // Resolve CSS variable value from computed style
      const computed = getComputedStyle(document.documentElement);
      const accent = computed.getPropertyValue("--color-accent").trim() || "#5e6ad2";
      const accentHover = computed.getPropertyValue("--color-accent-hover").trim() || "#7c86e0";

      const isActive = ctx.playerState === "playing";

      if (isActive) {
        const data = ctx.freqRef.current;
        if (data && data.length > 0) {
          const step = Math.floor(data.length / barCount);
          const barW = Math.max(2, (w - (barCount - 1) * 2) / barCount);
          const gap = 2;

          for (let i = 0; i < barCount; i++) {
            const value = data[i * step] / 255;
            const barH = Math.max(1, value * h);
            const x = i * (barW + gap);
            const y = h - barH;

            const ratio = i / barCount;
            const mixPct = Math.round(20 + ratio * 60);
            context.fillStyle = `color-mix(in srgb, ${accent} ${mixPct}%, ${accentHover})`;
            const radius = Math.min(barW / 2, 2);
            context.beginPath();
            context.moveTo(x, h);
            context.lineTo(x, y + radius);
            context.quadraticCurveTo(x, y, x + radius, y);
            context.lineTo(x + barW - radius, y);
            context.quadraticCurveTo(x + barW, y, x + barW, y + radius);
            context.lineTo(x + barW, h);
            context.closePath();
            context.fill();
          }
        }
      } else {
        const barW = Math.max(2, (w - (barCount - 1) * 2) / barCount);
        const gap = 2;
        for (let i = 0; i < barCount; i++) {
          const ratio = i / barCount;
          const peak = 0.08 + 0.1 * (1 - Math.abs(ratio - 0.5) * 2);
          const barH = Math.max(1, peak * h);
          const x = i * (barW + gap);
          const y = h - barH;
          context.fillStyle = `color-mix(in srgb, ${accent} ${Math.round(4 + ratio * 6)}%, transparent)`;
          const radius = Math.min(barW / 2, 1.5);
          context.beginPath();
          context.moveTo(x, h);
          context.lineTo(x, y + radius);
          context.quadraticCurveTo(x, y, x + radius, y);
          context.lineTo(x + barW - radius, y);
          context.quadraticCurveTo(x + barW, y, x + barW, y + radius);
          context.lineTo(x + barW, h);
          context.closePath();
          context.fill();
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [ctx.freqRef, ctx.playerState, barCount]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="音频频谱"
      role="img"
      className="w-full h-10 rounded-lg"
      style={{ willChange: "transform" }}
    />
  );
}
