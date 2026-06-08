"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LyricLine } from "@/types/music-player";
import { useMusicPlayerContext } from "./MusicPlayerContext";

function isTimed(lyrics: LyricLine[]) {
  if (lyrics.length <= 1) return false;
  return lyrics.some((l) => l.time > 0);
}

function TimedView({ lyrics, currentTime }: { lyrics: LyricLine[]; currentTime: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);
  const autoScrollingRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, forceUpdate] = useState(0);

  const currentIndex = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= currentTime) idx = i;
      else break;
    }
    return idx;
  }, [lyrics, currentTime]);

  useEffect(() => {
    if (currentIndex < 0 || !containerRef.current) return;
    if (userScrolledRef.current) return;
    autoScrollingRef.current = true;
    const el = containerRef.current.children[currentIndex] as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // Use a longer debounce to account for smooth scroll duration (300-500ms)
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      autoScrollingRef.current = false;
    }, 500);
  }, [currentIndex]);

  // Cleanup scroll timer on unmount
  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const handleScroll = useCallback(() => {
    if (autoScrollingRef.current) return;
    userScrolledRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      userScrolledRef.current = false;
      forceUpdate((n) => n + 1);
    }, 3000);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto scrollbar-none py-[30vh] select-none"
    >
      {lyrics.map((line, i) => {
        const isCurrent = i === currentIndex;
        const isPast = i < currentIndex;
        return (
          <div
            key={i}
            className="text-center px-4 relative"
            style={{
              transition: "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              paddingTop: isCurrent ? "1rem" : "0.35rem",
              paddingBottom: isCurrent ? "1rem" : "0.35rem",
            }}
          >
            {/* Accent glow behind current line */}
            {isCurrent && (
              <div
                className="absolute inset-x-8 inset-y-0 rounded-xl pointer-events-none"
                style={{
                  background:
                    "color-mix(in srgb, var(--color-accent) 6%, transparent)",
                  filter: "blur(8px)",
                  transition: "opacity 0.5s ease",
                }}
              />
            )}

            <p
              className="leading-relaxed relative"
              style={{
                fontSize: isCurrent ? "1.125rem" : "0.875rem",
                fontWeight: isCurrent ? 500 : 400,
                color: isCurrent
                  ? "var(--color-accent)"
                  : isPast
                    ? "color-mix(in srgb, var(--color-foreground-muted), transparent 75%)"
                    : "color-mix(in srgb, var(--color-foreground-muted), transparent 55%)",
                transition: "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }}
            >
              {line.text}
            </p>
            {line.translation && (
              <p
                className="leading-relaxed mt-0.5 relative"
                style={{
                  fontSize: isCurrent ? "0.875rem" : "0.75rem",
                  color: isCurrent
                    ? "color-mix(in srgb, var(--color-foreground-muted), transparent 30%)"
                    : "color-mix(in srgb, var(--color-foreground-muted), transparent 80%)",
                  transition: "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                }}
              >
                {line.translation}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function UntimedView({ lyrics }: { lyrics: LyricLine[] }) {
  const text =
    lyrics.length === 1
      ? lyrics[0].text
      : lyrics.map((l) => l.text).join("\n");
  return (
    <div
      className="h-full overflow-y-auto scrollbar-none py-[30vh] px-4 select-text whitespace-pre-line text-center leading-relaxed"
      style={{
        fontSize: "0.875rem",
        color: "color-mix(in srgb, var(--color-foreground-muted), transparent 40%)",
      }}
    >
      {text}
    </div>
  );
}

export function LyricsView() {
  const ctx = useMusicPlayerContext();
  const currentTrack =
    ctx.currentTrackIndex >= 0 && ctx.currentTrackIndex < ctx.tracks.length
      ? ctx.tracks[ctx.currentTrackIndex]
      : null;
  const lyrics = currentTrack?.lyrics ?? [];
  const timed = isTimed(lyrics);
  const hasLyrics = lyrics.length > 0;
  if (!hasLyrics) {
    return (
      <div className="relative h-full flex items-center justify-center">
        <p
          className="text-sm select-none tracking-wide"
          style={{ color: "color-mix(in srgb, var(--color-foreground-muted), transparent 65%)" }}
        >
          暂无歌词
        </p>
      </div>
    );
  }
  return (
    <div className="relative h-full min-h-0">
      {timed ? (
        <TimedView lyrics={lyrics} currentTime={ctx.currentTime} />
      ) : (
        <UntimedView lyrics={lyrics} />
      )}
    </div>
  );
}
