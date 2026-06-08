"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Plus } from "lucide-react";
import { PlaylistItem } from "./PlaylistItem";
import { useMusicPlayerContext } from "./MusicPlayerContext";
import { useFileInput } from "@/hooks/useFileInput";

export function PlaylistDrawer() {
  const ctx = useMusicPlayerContext();
  const [visible, setVisible] = useState(false);
  const dragIndexRef = useRef<number | null>(null);

  const { fileInputRef, openFilePicker, handleFileChange, accept, multiple } = useFileInput({
    accept: ".mp3,.flac,.wav,.ogg,.m4a,.aac",
    multiple: true,
    onFiles: ctx.addFiles,
  });

  useEffect(() => {
    if (ctx.isDrawerOpen) setVisible(true);
  }, [ctx.isDrawerOpen]);
  useEffect(() => {
    if (!ctx.isDrawerOpen && visible) {
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [ctx.isDrawerOpen, visible]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      dragIndexRef.current = index;
      e.dataTransfer.effectAllowed = "move";
    },
    [],
  );
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      const from = dragIndexRef.current;
      if (from !== null && from !== toIndex) ctx.reorderTracks(from, toIndex);
      dragIndexRef.current = null;
    },
    [ctx.reorderTracks],
  );

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="关闭播放列表"
        className={`fixed inset-0 z-40 cursor-default transition-opacity duration-300 ${!ctx.isDrawerOpen ? "pointer-events-none" : ""}`}
        style={{ opacity: ctx.isDrawerOpen ? 1 : 0 }}
        onClick={ctx.toggleDrawer}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm flex flex-col transition-transform duration-300
          rounded-l-3xl border-l border-[var(--color-border)]`}
        style={{
          transform: ctx.isDrawerOpen ? "translateX(0%)" : "translateX(100%)",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform",
          background: "linear-gradient(180deg, var(--color-bg-elevated), var(--color-bg-base))",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 shrink-0 border-b border-[var(--color-border)]"
        >
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
            播放列表
            <span className="font-normal ml-1.5 text-[var(--color-foreground-muted)]">
              ({ctx.tracks.length})
            </span>
          </h3>
          <button
            onClick={ctx.toggleDrawer}
            className="p-1.5 rounded-lg text-[var(--color-foreground-muted)] hover:bg-[var(--color-surface-hover)] transition-all duration-150"
            aria-label="关闭播放列表"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Add button */}
        <div className="px-3 pt-3 shrink-0">
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
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed text-sm
              text-[var(--color-accent)]
              border-[color-mix(in_srgb,var(--color-accent)_20%,transparent)]
              transition-all duration-200
              hover:bg-[color-mix(in_srgb,var(--color-accent)_6%,transparent)] hover:border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)]"
          >
            <Plus className="size-4" /> 添加歌曲
          </button>
        </div>

        {/* Track list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-none">
          {ctx.tracks.length === 0 ? (
            <p
              className="text-sm text-center py-8"
              style={{ color: "var(--color-foreground-subtle)" }}
            >
              暂无歌曲
            </p>
          ) : (
            ctx.tracks.map((track, index) => (
              <div
                key={track.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <PlaylistItem
                  track={track}
                  isCurrent={index === ctx.currentTrackIndex}
                  isPlaying={ctx.playerState === "playing"}
                  index={index}
                  onSelect={() => ctx.playTrack(index)}
                  onRemove={() => ctx.removeTrack(track.id)}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={() => {
                    dragIndexRef.current = null;
                  }}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
