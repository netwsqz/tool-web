"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/format";
import { useMusicPlayerContext } from "./MusicPlayerContext";

export function ProgressBar() {
  const ctx = useMusicPlayerContext();
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);

  const ratio = ctx.duration > 0 ? ctx.currentTime / ctx.duration : 0;
  const displayRatio = isDragging && hoverRatio !== null ? hoverRatio : ratio;

  const calcTimeFromEvent = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      const bar = barRef.current;
      if (!bar || ctx.duration <= 0) return 0;
      const rect = bar.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      return (x / rect.width) * ctx.duration;
    },
    [ctx.duration],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const time = calcTimeFromEvent(e);
      setHoverRatio(time / ctx.duration);

      const handleMove = (ev: MouseEvent) => {
        const t = calcTimeFromEvent(ev);
        setHoverRatio(t / ctx.duration);
      };

      const handleUp = (ev: MouseEvent) => {
        const t = calcTimeFromEvent(ev);
        ctx.seek(t);
        setIsDragging(false);
        setHoverRatio(null);
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
    [calcTimeFromEvent, ctx.duration, ctx.seek],
  );

  const handleHover = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return;
      if (ctx.duration <= 0) return;
      const bar = barRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setHoverRatio(x / rect.width);
    },
    [isDragging, ctx.duration],
  );

  const handleLeave = useCallback(() => {
    if (!isDragging) setHoverRatio(null);
  }, [isDragging]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  return (
    <div className="w-full flex items-center gap-3">
      <span className="text-xs tabular-nums w-10 text-right shrink-0 text-[var(--color-foreground-muted)]">
        {formatTime(
          isDragging && hoverRatio !== null
            ? hoverRatio * ctx.duration
            : ctx.currentTime,
        )}
      </span>

      <div
        ref={barRef}
        className="relative flex-1 h-2 group cursor-pointer"
        role="slider"
        aria-label="播放进度"
        aria-valuemin={0}
        aria-valuemax={ctx.duration}
        aria-valuenow={ctx.currentTime}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            ctx.seek(Math.min(ctx.duration, ctx.currentTime + 5));
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            ctx.seek(Math.max(0, ctx.currentTime - 5));
          }
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleHover}
        onMouseLeave={handleLeave}
      >
        {/* Track background */}
        <div className="absolute inset-y-0 left-0 right-0 rounded-full my-auto h-1.5 group-hover:h-2 transition-all duration-150 bg-[var(--color-surface)]"
        >
          {/* Filled portion */}
          <div
            className="h-full rounded-full relative"
            style={{
              width: `${Math.min(100, Math.max(0, displayRatio * 100))}%`,
              background:
                "linear-gradient(90deg, var(--color-accent), var(--color-accent-hover))",
              transition: isDragging ? "none" : "width 0.1s linear",
            }}
          >
            {/* Glow at the leading edge */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--color-accent-glow))",
                filter: "blur(4px)",
              }}
            />

            {/* Drag handle */}
            <div
              className={`absolute right-0 top-1/2 -translate-y-1/2 size-3 rounded-full
                shadow-lg transition-all duration-150
                ${isDragging ? "scale-150" : "scale-0 group-hover:scale-100"}
              `}
              style={{
                background:
                  "linear-gradient(135deg, var(--color-accent-hover), var(--color-accent))",
                boxShadow: isDragging
                  ? "0 0 12px var(--color-accent-glow)"
                  : "0 0 8px var(--color-accent-glow)",
              }}
            />
          </div>
        </div>
      </div>

      <span className="text-xs tabular-nums w-10 shrink-0 text-[var(--color-foreground-muted)]">
        {formatTime(ctx.duration)}
      </span>
    </div>
  );
}
