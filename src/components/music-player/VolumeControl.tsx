"use client";

import { Volume1, Volume2, VolumeX } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useMusicPlayerContext } from "./MusicPlayerContext";

export function VolumeControl() {
  const ctx = useMusicPlayerContext();
  const [savedVolume, setSavedVolume] = useState(0.7);
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calcVolume = useCallback((e: MouseEvent | React.MouseEvent) => {
    const bar = barRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    return x / rect.width;
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const v = calcVolume(e);
      ctx.setVolume(v);

      const handleMove = (ev: MouseEvent) => {
        ctx.setVolume(calcVolume(ev));
      };
      const handleUp = () => {
        setIsDragging(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };

      document.body.style.cursor = "pointer";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [calcVolume, ctx.setVolume],
  );

  const toggleMute = useCallback(() => {
    if (ctx.volume > 0) {
      setSavedVolume(ctx.volume);
      ctx.setVolume(0);
    } else {
      ctx.setVolume(savedVolume);
    }
  }, [ctx.volume, savedVolume, ctx.setVolume]);

  const Icon = ctx.volume === 0 ? VolumeX : ctx.volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleMute}
        className={`transition-colors
          ${ctx.volume === 0
            ? `text-[var(--color-foreground-subtle)]`
            : `text-[var(--color-foreground-muted)]`
          } hover:text-[var(--color-foreground)]`}
          aria-label={ctx.volume > 0 ? "静音" : "取消静音"}
        >
        <Icon className="size-4" />
      </button>

      <div
        ref={barRef}
        className="relative w-20 h-2 cursor-pointer group"
        role="slider"
        aria-label="音量"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={ctx.volume}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            ctx.setVolume(Math.min(1, ctx.volume + 0.05));
          }
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            ctx.setVolume(Math.max(0, ctx.volume - 0.05));
          }
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="absolute inset-y-0 left-0 right-0 rounded-full my-auto h-1 bg-[var(--color-surface)]"
        >
          <div
            className="h-full rounded-full relative"
            style={{
              width: `${ctx.volume * 100}%`,
              background:
                "linear-gradient(90deg, var(--color-accent), var(--color-accent-hover))",
            }}
          >
            {/* Glow at leading edge */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--color-accent-glow))",
                filter: "blur(3px)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
