"use client";

import { useState } from "react";
import type { VideoMetadata } from "@/types";

export function VideoInfoPanel({
  metadata,
}: {
  metadata: VideoMetadata | null;
}) {
  const [descOpen, setDescOpen] = useState(false);

  if (!metadata) return null;

  return (
    <div className="glass rounded-2xl p-5 flex gap-5">
      {/* Cover */}
      <div className="shrink-0">
        {metadata.thumbnail ? (
          <img
            src={`/api/download/thumbnail?url=${encodeURIComponent(metadata.thumbnail)}`}
            alt={metadata.title}
            className="w-40 aspect-[16/10] object-cover rounded-xl"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-40 aspect-[16/10] rounded-xl bg-white/5 flex items-center justify-center
            text-2xl text-[var(--color-text-secondary)]">
            🎬
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-2">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]
          truncate" title={metadata.title}>
          {metadata.title}
        </h2>

        <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
          <span>UP 主: {metadata.uploader}</span>
          <span>时长: {metadata.durationString}</span>
          {metadata.viewCount !== undefined && (
            <span>{metadata.viewCount.toLocaleString()} 次观看</span>
          )}
        </div>

        {/* Description */}
        {metadata.description && (
          <div>
            <button
              onClick={() => setDescOpen(!descOpen)}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]
                transition-colors"
            >
              {descOpen ? "收起简介" : "展开简介"}
            </button>
            {descOpen && (
              <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed
                line-clamp-6">
                {metadata.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
