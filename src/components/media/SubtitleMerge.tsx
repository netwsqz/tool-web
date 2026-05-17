"use client";

import { useCallback, useState } from "react";
import type { MediaFileInfo, MediaTaskConfig } from "@/types";
import { MediaUploadZone } from "./MediaUploadZone";

export function SubtitleMerge({
  onStart,
  onUpload,
  disabled,
}: {
  onStart: (config: MediaTaskConfig) => void;
  onUpload: (file: File) => Promise<MediaFileInfo>;
  disabled: boolean;
}) {
  const [video, setVideo] = useState<MediaFileInfo | null>(null);
  const [subtitle, setSubtitle] = useState<MediaFileInfo | null>(null);
  const [mode, setMode] = useState<"burn" | "embed">("burn");

  const canStart = !!video && !!subtitle && !disabled;

  const handleVideoUpload = useCallback(
    async (file: File) => {
      const info = await onUpload(file);
      setVideo(info);
      return info;
    },
    [onUpload]
  );

  const handleSubtitleUpload = useCallback(
    async (file: File) => {
      const info = await onUpload(file);
      setSubtitle(info);
      return info;
    },
    [onUpload]
  );

  const handleStart = () => {
    if (!canStart) return;
    onStart({
      type: "subtitle-merge",
      inputs: { video: video!.filename, subtitle: subtitle!.filename },
      options: { mode },
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--color-text-secondary)]">
        将字幕文件嵌入到视频中
      </p>

      <MediaUploadZone
        accept=".mp4,.avi,.mov,.mkv,.webm"
        label="视频文件"
        onUpload={handleVideoUpload}
        onRemove={() => setVideo(null)}
        uploaded={video ? [video] : []}
        disabled={disabled}
      />

      <MediaUploadZone
        accept=".srt,.ass"
        label="字幕文件 (.srt / .ass)"
        onUpload={handleSubtitleUpload}
        onRemove={() => setSubtitle(null)}
        uploaded={subtitle ? [subtitle] : []}
        disabled={disabled}
      />

      {/* Mode selector */}
      <div className="space-y-2">
        <p className="text-xs text-[var(--color-text-secondary)] font-medium">
          嵌入方式
        </p>
        <div className="flex gap-3">
          <label
            className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-colors
              ${
                mode === "burn"
                  ? "bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30"
                  : "bg-white/5 border border-white/5 hover:bg-white/8"
              }`}
          >
            <input
              type="radio"
              name="sub-mode"
              value="burn"
              checked={mode === "burn"}
              onChange={() => setMode("burn")}
              className="accent-[var(--color-accent)]"
            />
            <div>
              <p className="text-sm text-[var(--color-text-primary)]">硬嵌入</p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                字幕烧录到视频画面
              </p>
            </div>
          </label>

          <label
            className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-colors
              ${
                mode === "embed"
                  ? "bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30"
                  : "bg-white/5 border border-white/5 hover:bg-white/8"
              }`}
          >
            <input
              type="radio"
              name="sub-mode"
              value="embed"
              checked={mode === "embed"}
              onChange={() => setMode("embed")}
              className="accent-[var(--color-accent)]"
            />
            <div>
              <p className="text-sm text-[var(--color-text-primary)]">软嵌入</p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                字幕作为独立轨道封装
              </p>
            </div>
          </label>
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!canStart}
        className={`w-full py-3 rounded-2xl text-sm font-medium transition-all duration-200
          ${
            canStart
              ? "bg-[var(--color-accent)] text-white hover:opacity-90"
              : "bg-white/5 text-[var(--color-text-secondary)] cursor-not-allowed"
          }`}
      >
        {disabled
          ? "处理中…"
          : !video
          ? "请选择视频文件"
          : !subtitle
          ? "请选择字幕文件"
          : "开始处理"}
      </button>
    </div>
  );
}
