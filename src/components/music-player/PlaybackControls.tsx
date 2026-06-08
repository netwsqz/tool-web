"use client";

import { SkipBack, Play, Pause, SkipForward } from "lucide-react";
import { PlayModeButton } from "./PlayModeButton";
import { useMusicPlayerContext } from "./MusicPlayerContext";

export function PlaybackControls() {
  const ctx = useMusicPlayerContext();
  const isPlaying = ctx.playerState === "playing";
  const currentTrack =
    ctx.currentTrackIndex >= 0 && ctx.currentTrackIndex < ctx.tracks.length
      ? ctx.tracks[ctx.currentTrackIndex]
      : null;
  const disabled = currentTrack === null;

  return (
    <div className="flex items-center justify-center gap-6">
      <PlayModeButton playMode={ctx.playMode} onToggle={ctx.togglePlayMode} />

      <button
        onClick={ctx.prevTrack}
        disabled={disabled}
        className="p-1.5 rounded-lg transition-all duration-200
          disabled:opacity-40 disabled:cursor-not-allowed
          text-[var(--color-foreground-muted)]
          hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)]"
        aria-label="上一首"
      >
        <SkipBack className="size-5" />
      </button>

      {/* Play/Pause button with pulse ring */}
      <div className="relative flex items-center justify-center">
        {/* Pulse ring when playing */}
        {isPlaying && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: "2px solid color-mix(in srgb, var(--color-accent) 15%, transparent)",
              animation: "amp-pulse-ring 2s ease-out infinite",
            }}
          />
        )}
        <button
          onClick={(e) => {
            console.log("[PlayBtn] click!", { disabled, isPlaying, playerState: ctx.playerState });
            ctx.togglePlay();
          }}
          onPointerDown={(e) => {
            console.log("[PlayBtn] pointerdown", e.target, e.currentTarget);
          }}
          disabled={disabled}
          className={`size-12 rounded-full flex items-center justify-center
            active:scale-[0.92] transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
            ${isPlaying
              ? `bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] shadow-[0_0_16px_var(--color-accent-glow)]`
              : `bg-[linear-gradient(135deg,var(--color-accent),color-mix(in_srgb,var(--color-accent)_80%,var(--color-bg-deep)))] shadow-[0_4px_16px_var(--color-accent-glow)] hover:shadow-[0_4px_24px_color-mix(in_srgb,var(--color-accent)_40%,transparent)]`
            }`}
          aria-label={isPlaying ? "暂停" : "播放"}
        >
          {isPlaying ? (
            <Pause className="size-5 text-[var(--color-accent)]" />
          ) : (
            <Play className="size-5 ml-0.5 text-[var(--color-foreground)]" />
          )}
        </button>
      </div>

      <button
        onClick={ctx.nextTrack}
        disabled={disabled}
        className="p-1.5 rounded-lg transition-all duration-200
          disabled:opacity-40 disabled:cursor-not-allowed
          text-[var(--color-foreground-muted)]
          hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)]"
        aria-label="下一首"
      >
        <SkipForward className="size-5" />
      </button>
    </div>
  );
}
