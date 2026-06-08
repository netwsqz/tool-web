"use client";

import { GripVertical, Trash2, Music } from "lucide-react";
import type { MusicTrack } from "@/types/music-player";
import { formatTime } from "@/lib/format";

type PlaylistItemProps = {
  track: MusicTrack;
  isCurrent: boolean;
  isPlaying: boolean;
  index: number;
  onSelect: () => void;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
};

function EqIndicator({ isPlaying }: { isPlaying: boolean }) {
  return (
    <span className="inline-flex items-end gap-[1.5px] h-3">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[2px] rounded-full"
          style={{
            height: isPlaying ? "40%" : "30%",
            background: "var(--color-accent)",
            animation: isPlaying
              ? `amp-eq-bar ${0.35 + i * 0.1}s ease-in-out infinite`
              : "none",
            animationDelay: `${i * 0.12}s`,
            opacity: isPlaying ? 1 : 0.4,
          }}
        />
      ))}
    </span>
  );
}

export function PlaylistItem({
  track,
  isCurrent,
  isPlaying,
  index,
  onSelect,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: PlaylistItemProps) {
  return (
    <div
      draggable
      role="button"
      tabIndex={0}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer
        transition-all duration-200
        ${isCurrent
          ? `bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]`
          : `hover:bg-[var(--color-surface-hover)]`
        }`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Drag handle */}
      <div
        className="shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 text-[var(--color-foreground-subtle)] transition-all duration-150"
      >
        <GripVertical className="size-3.5" />
      </div>

      {/* Track number / playing indicator */}
      <div className="shrink-0 w-6 text-center flex items-center justify-center">
        {isCurrent ? (
          <EqIndicator isPlaying={isPlaying} />
        ) : (
          <span
            className="text-xs tabular-nums text-[var(--color-foreground-subtle)]"
          >
            {index + 1}
          </span>
        )}
      </div>

      {/* Mini cover */}
      <div
        className="size-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
        style={{
          background: track.coverUrl
            ? `url(${track.coverUrl}) center/cover`
            : "var(--color-surface)",
        }}
      >
        {!track.coverUrl && (
          <Music
            className="size-4 text-[var(--color-foreground-subtle)]"
          />
        )}
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm truncate
            ${isCurrent
              ? `text-[var(--color-accent)] font-medium`
              : `text-[var(--color-foreground)] font-normal`
            }`}
        >
          {track.title}
        </p>
        <p
          className="text-xs truncate text-[var(--color-foreground-muted)]"
        >
          {track.artist}
        </p>
      </div>

      {/* Duration */}
      <span
        className="text-xs tabular-nums shrink-0 text-[var(--color-foreground-subtle)]"
      >
        {formatTime(track.duration)}
      </span>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100
          text-[var(--color-foreground-subtle)]
          transition-all duration-150
          hover:text-[var(--color-destructive)] hover:bg-[color-mix(in_srgb,var(--color-destructive)_8%,transparent)]"
        aria-label="删除"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
