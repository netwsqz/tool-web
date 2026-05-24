// src/components/fruit-slice/HUD.tsx
"use client";

import { Heart } from "lucide-react";
import type { FruitSliceState } from "@/types/fruit-slice";

export function HUD({ state }: { state: FruitSliceState }) {
  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none z-10 flex items-start justify-between px-4 py-3">
      {/* Score */}
      <div className="flex flex-col items-start">
        <span className="text-xs text-[var(--color-foreground-muted)] font-medium uppercase tracking-wider">
          得分
        </span>
        <span className="text-2xl font-bold text-white tabular-nums drop-shadow-lg">
          {state.score}
        </span>
        {state.bestScore > 0 && (
          <span className="text-[10px] text-[var(--color-foreground-subtle)] mt-0.5">
            最高 {state.bestScore}
          </span>
        )}
      </div>

      {/* Combo */}
      {state.combo >= 2 && (
        <div className="flex flex-col items-center animate-fade-in">
          <span className="text-lg font-bold text-orange-400 drop-shadow-lg">
            {state.combo}x 连击!
          </span>
        </div>
      )}

      {/* Lives */}
      <div className="flex gap-1">
        {Array.from({ length: 3 }, (_, i) => (
          <Heart
            key={i}
            className={`size-5 transition-colors duration-200 ${
              i < state.lives
                ? "text-red-500 fill-red-500 drop-shadow-md"
                : "text-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
