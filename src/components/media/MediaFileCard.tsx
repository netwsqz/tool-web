"use client";

import type { MediaFileInfo } from "@/types";
import { formatSize } from "@/lib/format";

const FILE_ICONS: Record<string, string> = {
  mp4: "🎬",
  avi: "🎬",
  mov: "🎬",
  mkv: "🎬",
  webm: "🎬",
  mp3: "🎵",
  wav: "🎵",
  m4a: "🎵",
  ogg: "🎵",
  srt: "📄",
  ass: "📄",
};

function getIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return FILE_ICONS[ext] || "📁";
}

export function MediaFileCard({
  file,
  onRemove,
  disabled,
}: {
  file: MediaFileInfo;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 text-sm group">
      <span className="text-base">{getIcon(file.filename)}</span>
      <span className="flex-1 truncate text-[var(--color-text-primary)]">
        {file.filename}
      </span>
      <span className="text-xs text-[var(--color-text-secondary)] flex-shrink-0">
        {formatSize(file.size)}
      </span>
      {onRemove && (
        <button
          onClick={onRemove}
          disabled={disabled}
          className={`flex-shrink-0 px-1.5 py-0.5 rounded-lg text-xs transition-colors
            ${
              disabled
                ? "text-[var(--color-text-secondary)] opacity-40 cursor-not-allowed"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-destructive)] hover:bg-black/10"
            }`}
        >
          ×
        </button>
      )}
    </div>
  );
}
