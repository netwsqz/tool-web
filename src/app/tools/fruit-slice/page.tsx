// src/app/tools/fruit-slice/page.tsx
"use client";

import { Swords } from "lucide-react";
import { ToolLayout } from "@/components/ui/ToolLayout";
import { useFruitSlice } from "@/hooks/useFruitSlice";
import { GameCanvas } from "@/components/fruit-slice/GameCanvas";
import { HUD } from "@/components/fruit-slice/HUD";
import { GameOverOverlay } from "@/components/fruit-slice/GameOverOverlay";

export default function FruitSlicePage() {
  const game = useFruitSlice();

  return (
    <ToolLayout
      title="水果忍者"
      description="切水果 · 避炸弹 · 挑战高分"
      icon={Swords}
      maxWidth="xl"
    >
      <div className="glass rounded-3xl overflow-hidden relative">
        {/* Game area with fixed aspect ratio */}
        <div className="relative w-full" style={{ aspectRatio: "3 / 4", maxHeight: "75vh" }}>
          {/* HUD overlay */}
          {game.ui.phase === "playing" && <HUD state={game.ui} />}

          {/* Canvas */}
          <GameCanvas
            ref={game.canvasRef}
            onPointerDown={game.handlePointerDown}
            onPointerMove={game.handlePointerMove}
            onPointerUp={game.handlePointerUp}
            onTouchStart={game.handleTouchStart}
          />

          {/* Idle overlay */}
          {game.ui.phase === "idle" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <div className="text-center space-y-5">
                <div className="space-y-2">
                  <Swords className="size-12 mx-auto text-[var(--color-accent)] opacity-80" />
                  <h2 className="text-xl font-bold text-white">水果忍者</h2>
                  <p className="text-sm text-[var(--color-foreground-muted)]">
                    滑动切水果 · 避开炸弹 · 3次失误即结束
                  </p>
                </div>
                {game.ui.bestScore > 0 && (
                  <p className="text-xs text-[var(--color-foreground-subtle)]">
                    历史最高: {game.ui.bestScore}
                  </p>
                )}
                <button
                  type="button"
                  onClick={game.start}
                  className="px-8 py-3 rounded-xl text-sm font-medium bg-[var(--color-accent)] text-white
                    hover:opacity-90 transition-all duration-200 active:scale-[0.97]"
                >
                  开始游戏
                </button>
              </div>
            </div>
          )}

          {/* Game over overlay */}
          {game.ui.phase === "game-over" && (
            <GameOverOverlay state={game.ui} onRestart={game.start} />
          )}
        </div>
      </div>

      {/* Tips */}
      <p className="text-xs text-center text-[var(--color-foreground-subtle)] mt-4">
        支持鼠标和触屏操作 · 连击可获得额外分数
      </p>
    </ToolLayout>
  );
}
