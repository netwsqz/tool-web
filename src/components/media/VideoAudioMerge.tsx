"use client";

import { useCallback, useState } from "react";
import type { MediaFileInfo, MediaTaskConfig } from "@/types";
import { MediaUploadZone } from "./MediaUploadZone";

export function VideoAudioMerge({
  onStart,
  onUpload,
  disabled,
}: {
  onStart: (config: MediaTaskConfig) => void;
  onUpload: (file: File) => Promise<MediaFileInfo>;
  disabled: boolean;
}) {
  const [video, setVideo] = useState<MediaFileInfo | null>(null);
  const [audio, setAudio] = useState<MediaFileInfo | null>(null);

  const canStart = !!video && !!audio && !disabled;

  const handleVideoUpload = useCallback(
    async (file: File) => {
      const info = await onUpload(file);
      setVideo(info);
      return info;
    },
    [onUpload]
  );

  const handleAudioUpload = useCallback(
    async (file: File) => {
      const info = await onUpload(file);
      setAudio(info);
      return info;
    },
    [onUpload]
  );

  const handleStart = () => {
    if (!canStart) return;
    onStart({
      type: "video-audio-merge",
      inputs: { video: video!.filename, audio: audio!.filename },
      options: {},
    });
  };

  const handleRemoveVideo = useCallback(() => setVideo(null), []);
  const handleRemoveAudio = useCallback(() => setAudio(null), []);

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--color-text-secondary)]">
        将视频文件的音频替换为新的音频轨道
      </p>

      <MediaUploadZone
        accept=".mp4,.avi,.mov,.mkv,.webm"
        label="视频文件"
        onUpload={handleVideoUpload}
        onRemove={handleRemoveVideo}
        uploaded={video ? [video] : []}
        disabled={disabled}
      />

      <MediaUploadZone
        accept=".mp3,.wav,.m4a,.ogg,.flac"
        label="音频文件"
        onUpload={handleAudioUpload}
        onRemove={handleRemoveAudio}
        uploaded={audio ? [audio] : []}
        disabled={disabled}
      />

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
          : !audio
          ? "请选择音频文件"
          : "开始合并"}
      </button>
    </div>
  );
}
