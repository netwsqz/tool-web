"use client";

import type { DrawGuessPlayer } from "@/lib/draw-guess/types";

interface PlayerListProps {
  players: DrawGuessPlayer[];
  drawerId?: string;
  myPlayerId?: string;
}

export function PlayerList({
  players,
  drawerId,
  myPlayerId,
}: PlayerListProps) {
  if (players.length === 0) {
    return (
      <div className="text-sm text-[var(--color-text-secondary)] text-center py-4">
        暂无玩家
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {players.map((p) => {
        const isDrawer = p.id === drawerId;
        const isMe = p.id === myPlayerId;
        return (
          <div
            key={p.id}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm
              ${isDrawer ? "bg-yellow-500/10" : "bg-black/5"}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate">
                {p.name}
                {isMe && (
                  <span className="text-xs text-[var(--color-text-secondary)] ml-1">
                    (你)
                  </span>
                )}
              </span>
              {isDrawer && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 shrink-0">
                  画手
                </span>
              )}
            </div>
            <span className="text-[var(--color-accent)] font-medium ml-2 shrink-0">
              {p.score}分
            </span>
          </div>
        );
      })}
    </div>
  );
}
