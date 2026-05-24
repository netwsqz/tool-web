// src/components/fruit-slice/GameOverOverlay.tsx
"use client";

import { RotateCcw } from "lucide-react";
import type { FruitSliceState } from "@/types/fruit-slice";

interface GameOverOverlayProps {
  state: FruitSliceState;
  onRestart: () => void;
}

export function GameOverOverlay({ state, onRestart }: GameOverOverlayProps) {
  const isNewBest = state.score >= state.bestScore && state.score > 0;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-3xl p-8 text-center max-w-xs w-full mx-4 space-y-5">
        <h2 className="text-xl font-bold text-white">游戏结束</h2>

        <div className="space-y-2">
          <div>
            <p className="text-xs text-[var(--color-foreground-muted)] uppercase tracking-wider">最终得分</p>
            <p className="text-4xl font-bold text-white tabular-nums">{state.score}</p>
          </div>

          {isNewBest && (
            <p className="text-sm text-yellow-400 font-medium animate-pulse">
              新纪录!
            </p>
          )}

          <div className="flex justify-center gap-6 pt-2">
            <div>
              <p className="text-xs text-[var(--color-foreground-muted)]">最高连击</p>
              <p className="text-lg font-semibold text-orange-400">{state.maxCombo}x</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-foreground-muted)]">历史最高</p>
              <p className="text-lg font-semibold text-[var(--color-accent)]">{state.bestScore}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRestart}
          className="w-full px-5 py-3 rounded-xl text-sm font-medium bg-[var(--color-accent)] text-white
            hover:opacity-90 transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2"
        >
          <RotateCcw className="size-4" />
          再来一局
        </button>
      </div>
    </div>
  );
}
