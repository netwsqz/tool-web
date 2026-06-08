"use client";

import { useCallback, useState } from "react";
import type { MediaFileInfo, MediaTaskConfig, MediaTaskType } from "@/types";
import { MediaUploadZone } from "./MediaUploadZone";

type ProcessMode = "volume" | "crop" | "transcode" | "extract-audio";

const MODES: { id: ProcessMode; label: string }[] = [
  { id: "volume", label: "调整音量" },
  { id: "crop", label: "裁剪画面" },
  { id: "transcode", label: "转码为 MP4" },
  { id: "extract-audio", label: "提取音频" },
];

const MODE_LABELS: Record<ProcessMode, string> = {
  volume: "视频文件",
  crop: "视频文件",
  transcode: "视频文件",
  "extract-audio": "视频文件",
};

const MODE_ACCEPT: Record<ProcessMode, string> = {
  volume: ".mp4,.avi,.mov,.mkv,.webm",
  crop: ".mp4,.avi,.mov,.mkv,.webm",
  transcode: ".mp4,.avi,.mov,.mkv,.webm",
  "extract-audio": ".mp4,.avi,.mov,.mkv,.webm,.mp3,.m4a",
};

const MODE_DESC: Record<ProcessMode, string> = {
  volume: "调整视频音量大小",
  crop: "裁剪视频画面尺寸",
  transcode: "转码为 H.264 + AAC 格式",
  "extract-audio": "从视频中提取音频文件",
};

export function VideoProcessing({
  onStart,
  onUpload,
  disabled,
}: {
  onStart: (config: MediaTaskConfig) => void;
  onUpload: (file: File) => Promise<MediaFileInfo>;
  disabled: boolean;
}) {
  const [mode, setMode] = useState<ProcessMode>("volume");
  const [video, setVideo] = useState<MediaFileInfo | null>(null);

  // Volume
  const [volume, setVolume] = useState(1);

  // Crop
  const [cropW, setCropW] = useState(640);
  const [cropH, setCropH] = useState(480);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);

  // Extract audio
  const [audioFormat, setAudioFormat] = useState<"mp3" | "wav">("mp3");

  const canStart = !!video && !disabled;

  const handleUpload = useCallback(
    async (file: File) => {
      const info = await onUpload(file);
      setVideo(info);
      return info;
    },
    [onUpload]
  );

  const getTaskType = useCallback((): MediaTaskType => {
    switch (mode) {
      case "volume":
        return "volume-adjust";
      case "crop":
        return "crop";
      case "transcode":
        return "transcode";
      case "extract-audio":
        return "extract-audio";
    }
  }, [mode]);

  const getOptions = useCallback((): Record<string, unknown> => {
    switch (mode) {
      case "volume":
        return { volume };
      case "crop":
        return { width: cropW, height: cropH, x: cropX, y: cropY };
      case "extract-audio":
        return { codec: audioFormat === "mp3" ? "libmp3lame" : "pcm_s16le" };
      default:
        return {};
    }
  }, [mode, volume, cropW, cropH, cropX, cropY, audioFormat]);

  const handleStart = () => {
    if (!canStart) return;
    onStart({
      type: getTaskType(),
      inputs: { video: video!.filename },
      options: getOptions(),
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--color-text-secondary)]">
        {MODE_DESC[mode]}
      </p>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200
              ${
                mode === m.id
                  ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-black/5 border border-transparent"
              }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Upload zone */}
      <MediaUploadZone
        accept={MODE_ACCEPT[mode]}
        label={MODE_LABELS[mode]}
        onUpload={handleUpload}
        onRemove={() => setVideo(null)}
        uploaded={video ? [video] : []}
        disabled={disabled}
      />

      {/* Mode-specific controls */}
      {mode === "volume" && video && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-secondary)]">音量</span>
            <span className="text-sm text-[var(--color-text-primary)] font-mono">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            aria-label="音量"
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer
              bg-black/10
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-[var(--color-accent)]
              [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
            <span>静音</span>
            <span>原始</span>
            <span>200%</span>
          </div>
        </div>
      )}

      {mode === "crop" && video && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "宽度", value: cropW, set: setCropW },
            { label: "高度", value: cropH, set: setCropH },
            { label: "X 偏移", value: cropX, set: setCropX },
            { label: "Y 偏移", value: cropY, set: setCropY },
          ].map((field) => (
            <div key={field.label} className="space-y-1">
              <label className="text-xs text-[var(--color-text-secondary)]">
                {field.label}
              </label>
              <input
                type="number"
                min={0}
                value={field.value}
                onChange={(e) => field.set(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl bg-black/5 border border-black/5
                  text-sm text-[var(--color-text-primary)] outline-none
                  focus:border-[var(--color-accent)]/40 transition-colors
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                  [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          ))}
          <p className="col-span-2 text-xs text-yellow-400/60">
            建议宽高为偶数，否则 ffmpeg 会自动调整
          </p>
        </div>
      )}

      {mode === "transcode" && video && (
        <div className="text-xs text-[var(--color-text-secondary)] bg-black/5 rounded-2xl p-4">
          将视频转码为 H.264 视频编码 + AAC 音频编码的 MP4 文件。
          适合兼容性最好的播放格式。
        </div>
      )}

      {mode === "extract-audio" && video && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-text-secondary)] font-medium">
            输出格式
          </p>
          <div className="flex gap-3">
            {(["mp3", "wav"] as const).map((fmt) => (
              <label
                key={fmt}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl
                  cursor-pointer transition-colors
                  ${
                    audioFormat === fmt
                      ? "bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30"
                      : "bg-black/5 border border-black/5 hover:bg-black/8"
                  }`}
              >
                <input
                  type="radio"
                  name="audio-format"
                  value={fmt}
                  checked={audioFormat === fmt}
                  onChange={() => setAudioFormat(fmt)}
                  className="accent-[var(--color-accent)]"
                />
                <span className="text-sm text-[var(--color-text-primary)] uppercase">
                  {fmt}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={!canStart}
        className={`w-full py-3 rounded-2xl text-sm font-medium transition-all duration-200
          ${
            canStart
              ? "bg-[var(--color-accent)] text-white hover:opacity-90"
              : "bg-black/5 text-[var(--color-text-secondary)] cursor-not-allowed"
          }`}
      >
        {disabled ? "处理中…" : !video ? "请选择视频文件" : "开始处理"}
      </button>
    </div>
  );
}
