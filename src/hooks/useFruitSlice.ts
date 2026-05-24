// src/hooks/useFruitSlice.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FruitSliceState, SlashPoint } from "@/types/fruit-slice";
import {
  createInitialState, tick, snapshot, type EngineState,
} from "@/lib/fruit-slice/game-engine";
import { addSlashPoint, updateTrail } from "@/lib/fruit-slice/particles";
import { renderFrame } from "@/lib/fruit-slice/canvas-renderer";
import { playSlash, playCombo, playBomb, playMiss, playGameOver, vibrate } from "@/lib/fruit-slice/sound-engine";

export function useFruitSlice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<EngineState | null>(null);
  const rafRef = useRef<number>(0);
  const [ui, setUi] = useState<FruitSliceState>({
    phase: "idle",
    score: 0,
    bestScore: 0,
    lives: 3,
    combo: 0,
    maxCombo: 0,
    width: 0,
    height: 0,
  });

  // ── Resize ──
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    if (engineRef.current) {
      engineRef.current.width = rect.width;
      engineRef.current.height = rect.height;
    }
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  // ── Game loop ──
  const gameLoop = useCallback(() => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;

    const now = performance.now();
    updateTrail(engine.trail);
    tick(engine, now, {
      onSlice: () => {
        playSlash();
        vibrate(20);
      },
      onCombo: (c) => playCombo(c),
      onBomb: () => {
        playBomb();
        vibrate(100);
      },
      onMiss: () => playMiss(),
      onGameOver: () => playGameOver(),
    });

    const ctx = canvas.getContext("2d");
    if (ctx) {
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.scale(dpr, dpr);
      renderFrame(ctx, engine);
      ctx.restore();
    }

    setUi(snapshot(engine));
    rafRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // ── Start game ──
  const start = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const engine = createInitialState(rect.width, rect.height);
    engine.phase = "playing";
    engineRef.current = engine;
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  // ── Stop loop on unmount ──
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Idle animation when not playing ──
  useEffect(() => {
    if (ui.phase !== "idle" && ui.phase !== "game-over") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw static background
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.save();
    ctx.scale(dpr, dpr);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0a0a1a");
    bg.addColorStop(1, "#1a0a2e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }, [ui.phase]);

  // ── Pointer events for slashing ──
  const isSlashing = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (ui.phase !== "playing") return;
    isSlashing.current = true;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (engineRef.current) {
      addSlashPoint(engineRef.current.trail, x, y);
    }
  }, [ui.phase]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isSlashing.current || ui.phase !== "playing") return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (engineRef.current) {
      addSlashPoint(engineRef.current.trail, x, y);
    }
  }, [ui.phase]);

  const handlePointerUp = useCallback(() => {
    isSlashing.current = false;
  }, []);

  // ── Touch support: prevent scroll ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
  }, []);

  return {
    canvasRef,
    ui,
    start,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTouchStart,
  };
}
