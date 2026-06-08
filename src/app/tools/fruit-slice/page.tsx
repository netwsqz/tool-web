// src/app/tools/fruit-slice/page.tsx
"use client";

import { useFruitSlice } from "@/hooks/useFruitSlice";
import { GameCanvas } from "@/components/fruit-slice/GameCanvas";
import { HUD } from "@/components/fruit-slice/HUD";
import { GameOverOverlay } from "@/components/fruit-slice/GameOverOverlay";

export default function FruitSlicePage() {
  const game = useFruitSlice();

  return (
    <div className="relative w-full h-dvh">
      {/* Canvas always mounted */}
      <GameCanvas
        ref={game.canvasRef}
        onPointerDown={game.handlePointerDown}
        onPointerMove={game.handlePointerMove}
        onPointerUp={game.handlePointerUp}
        onTouchStart={game.handleTouchStart}
      />

      {/* HUD overlay */}
      {game.ui.phase === "playing" && <HUD state={game.ui} />}

      {/* Idle / start screen */}
      {game.ui.phase === "idle" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center glass-low">
          <div className="glass-high rounded-3xl p-8 text-center max-w-sm mx-4 animate-scale-in">
            <div className="text-4xl mb-3"> </div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
              切水果
            </h1>
            <p className="text-sm text-[var(--color-foreground-muted)] mb-6 leading-relaxed">
              滑动手指切开飞起的水果<br />
              小心不要切到炸弹！
            </p>

            {game.ui.bestScore > 0 && (
              <div className="glass rounded-xl px-4 py-2 mb-6 inline-block">
                <span className="text-xs text-[var(--color-foreground-muted)]">最高分 </span>
                <span className="text-lg font-bold text-[var(--color-accent)] tabular-nums">
                  {game.ui.bestScore}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2 text-xs text-[var(--color-foreground-subtle)] mb-6">
              <span>  每切一个水果得分递增</span>
              <span>⚡ 连击越长得分越高</span>
              <span>  切中炸弹立即结束</span>
              <span>❤️ 漏切水果扣一条命</span>
            </div>

            <button
              type="button"
              onClick={game.start}
              className="w-full py-3 rounded-xl font-medium text-white
                bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
                transition-all duration-200 active:scale-95 cursor-pointer"
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
  );
}
