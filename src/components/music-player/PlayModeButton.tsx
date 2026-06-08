"use client";

import { Repeat, Shuffle, Repeat1 } from "lucide-react";
import type { PlayMode } from "@/types/music-player";

type PlayModeButtonProps = {
  playMode: PlayMode;
  onToggle: () => void;
};

const MODE_ICONS: Record<PlayMode, React.ComponentType<{ className?: string }>> = {
  sequential: Repeat,
  shuffle: Shuffle,
  "single-repeat": Repeat1,
};

const MODE_LABELS: Record<PlayMode, string> = {
  sequential: "顺序播放",
  shuffle: "随机播放",
  "single-repeat": "单曲循环",
};

export function PlayModeButton({ playMode, onToggle }: PlayModeButtonProps) {
  const Icon = MODE_ICONS[playMode];
  const isActive = playMode !== "sequential";

  return (
    <button
      onClick={onToggle}
      className={`p-1.5 rounded-lg transition-all duration-200
        ${isActive
          ? "text-[var(--color-accent)]"
          : "text-[var(--color-foreground-muted)]"
        } hover:bg-[var(--color-surface-hover)]`}
      title={MODE_LABELS[playMode]}
      aria-label={MODE_LABELS[playMode]}
    >
      <Icon className="size-4" />
    </button>
  );
}
