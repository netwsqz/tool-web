"use client";

import { ArrowLeft, ListMusic, Plus } from "lucide-react";
import Link from "next/link";
import { VinylDisc } from "./VinylDisc";
import { TrackInfo } from "./TrackInfo";
import { LyricsView } from "./LyricsView";
import { ProgressBar } from "./ProgressBar";
import { PlaybackControls } from "./PlaybackControls";
import { VolumeControl } from "./VolumeControl";
import { SpectrumAnalyzer } from "./SpectrumAnalyzer";
import { useMusicPlayerContext } from "./MusicPlayerContext";
import { useFileInput } from "@/hooks/useFileInput";

export function ImmersiveLayout() {
  const ctx = useMusicPlayerContext();
  const currentTrack =
    ctx.currentTrackIndex >= 0 && ctx.currentTrackIndex < ctx.tracks.length
      ? ctx.tracks[ctx.currentTrackIndex]
      : null;
  const hasTrack = currentTrack !== null;
  const isPlaying = ctx.playerState === "playing";
  const isActive = isPlaying || ctx.playerState === "paused";

  const { fileInputRef, openFilePicker, handleFileChange, accept, multiple } = useFileInput({
    accept: ".mp3,.flac,.wav,.ogg,.m4a,.aac",
    multiple: true,
    onFiles: ctx.addFiles,
  });

  return (
    <div
      className="w-full h-dvh overflow-hidden relative flex flex-col lg:flex-row p-5 lg:p-10 gap-4 lg:gap-8"
      style={{ background: "var(--color-bg-deep)" }}
    >
      {/* ===== Background layers (pseudo-elements via inline styles) ===== */}
      {currentTrack?.coverUrl && (
        <>
          <div
            className="absolute inset-0 scale-110 pointer-events-none"
            style={{
              backgroundImage: `url(${currentTrack.coverUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(70px) brightness(0.6)",
              opacity: 0.35,
              transition: "opacity 0.8s ease",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(160deg, color-mix(in srgb, var(--color-bg-deep) 70%, transparent) 0%, color-mix(in srgb, var(--color-bg-deep) 35%, transparent) 40%, color-mix(in srgb, var(--color-bg-deep) 50%, transparent) 100%)",
              backdropFilter: "blur(50px)",
              WebkitBackdropFilter: "blur(50px)",
            }}
          />
        </>
      )}

      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 text-sm group sm:hidden text-[var(--color-foreground-muted)]"
      >
        <ArrowLeft
          className="size-4 group-hover:-translate-x-0.5 transition-transform duration-150"
        />
        返回首页
      </Link>

      {/* ========== LEFT / TOP: Vinyl Section ========== */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 py-8 lg:py-0 lg:w-[45%] shrink-0">
        <VinylDisc
          coverUrl={currentTrack?.coverUrl}
          isActive={isActive}
        />

        <TrackInfo />
      </div>

      {/* ========== RIGHT / BOTTOM: Lyrics + Controls ========== */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        {/* Lyrics area */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none">
          {/* Mobile: label */}
          <div className="lg:hidden flex items-center justify-between px-1 pt-3 pb-1">
            <span
              className="text-xs [color:color-mix(in_srgb,var(--color-foreground-muted),transparent_60%)]"
            >
              歌词
            </span>
            <button
              onClick={ctx.toggleDrawer}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs
                text-[var(--color-foreground-muted)]
                hover:bg-[var(--color-surface-hover)]
                transition-all duration-150"
              aria-label="播放列表"
            >
              <ListMusic className="size-3.5" />
              {ctx.tracks.length}
            </button>
          </div>

          {currentTrack ? (
            <LyricsView />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p
                className="text-sm tracking-wide [color:color-mix(in_srgb,var(--color-foreground-muted),transparent_75%)]"
              >
                选择歌曲开始播放</p>
            </div>
          )}
        </div>

        {/* Control bar */}
        <div
          className={`glass shrink-0 rounded-2xl lg:rounded-3xl px-4 pb-3 pt-2.5 lg:px-5 lg:pb-3.5 lg:pt-3 mt-3 ${hasTrack ? "[border:1px_solid_color-mix(in_srgb,var(--color-accent)_12%,transparent)]" : ""}`}
        >
          {/* Spectrum */}
          <div className="hidden sm:block mb-2">
            <SpectrumAnalyzer barCount={48} />
          </div>

          {/* Progress */}
          <div className="mb-2.5">
            <ProgressBar />
          </div>

          {/* Main playback controls — centered */}
          <div className="flex items-center justify-center mb-2">
            <PlaybackControls />
          </div>

          {/* Secondary row: volume (left) | actions (right) */}
          <div className="flex items-center justify-between">
            <VolumeControl />

            <div className="flex items-center gap-1.5">
              {/* Upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={openFilePicker}
                className="p-1.5 rounded-lg text-[var(--color-foreground-muted)] hover:bg-[var(--color-surface-hover)] transition-all duration-150"
                aria-label="添加音乐文件"
              >
                <Plus className="size-4" />
              </button>

              <div className="w-px h-4 bg-[var(--color-border)]" />

              <button
                onClick={ctx.toggleDrawer}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--color-foreground-muted)] hover:bg-[var(--color-surface-hover)] transition-all duration-150"
                aria-label="播放列表"
              >
                <ListMusic className="size-4" />
                <span className="hidden sm:inline tabular-nums">
                  {ctx.tracks.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
