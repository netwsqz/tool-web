"use client";

import { useState } from "react";
import type { VideoFormat } from "@/types";

function getCodecBadge(vcodec: string): { label: string; color: string } | null {
  const lower = vcodec.toLowerCase();
  if (lower.includes("hevc") || lower.includes("h265")) return { label: "HEVC", color: "text-purple-400 bg-purple-400/10" };
  if (lower.includes("avc") || lower.includes("h264")) return { label: "AVC", color: "text-blue-400 bg-blue-400/10" };
  if (lower.includes("av1")) return { label: "AV1", color: "text-green-400 bg-green-400/10" };
  return null;
}

export function FormatSelector({
  formats,
  onStart,
  disabled,
}: {
  formats: VideoFormat[];
  onStart: (formatId: string) => void;
  disabled: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  if (formats.length === 0) return null;

  const videoFormats = formats.filter((f) => f.vcodec !== "none");
  const audioFormats = formats.filter((f) => f.vcodec === "none");

  const handleStart = async () => {
    if (!selectedId || disabled || starting) return;
    setStarting(true);
    try {
      await onStart(selectedId);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-[var(--color-text-primary)]">
        选择画质
      </p>

      {/* Video formats */}
      {videoFormats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {videoFormats.map((fmt) => {
            const badge = getCodecBadge(fmt.vcodec);
            return (
              <button
                key={fmt.formatId}
                onClick={() => setSelectedId(fmt.formatId)}
                disabled={disabled}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedId === fmt.formatId
                    ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10"
                    : "border-black/10 bg-black/5 hover:bg-black/8"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {fmt.height ? `${fmt.height}P` : fmt.formatNote}
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[10px] text-[var(--color-text-secondary)]">
                    {fmt.resolution}
                  </span>
                  {badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.color}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                  {fmt.filesizeText}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Audio only */}
      {audioFormats.length > 0 && (
        <>
          <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
            <span className="h-px flex-1 bg-black/10" />
            <span>音频</span>
            <span className="h-px flex-1 bg-black/10" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {audioFormats.map((fmt) => (
              <button
                key={fmt.formatId}
                onClick={() => setSelectedId(fmt.formatId)}
                disabled={disabled}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedId === fmt.formatId
                    ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10"
                    : "border-black/10 bg-black/5 hover:bg-black/8"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <div className="text-sm font-medium text-[var(--color-text-primary)]">
                  {fmt.formatNote}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  {fmt.filesizeText}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Download button */}
      <button
        onClick={handleStart}
        disabled={!selectedId || disabled || starting}
        className="w-full py-3 rounded-xl bg-[var(--color-accent)] text-white text-sm font-medium
          hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center justify-center gap-2"
      >
        {starting ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-white animate-spin" />
            准备中…
          </>
        ) : selectedId ? (
          "开始下载"
        ) : (
          "请选择清晰度"
        )}
      </button>
    </div>
  );
}
