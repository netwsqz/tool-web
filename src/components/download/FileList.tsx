"use client";

import { useState } from "react";
import { formatSize } from "@/lib/format";
import type { DownloadFileInfo } from "@/types";

const FILE_ICONS: Record<string, string> = {
  mp4: "🎬",
  mkv: "🎬",
  webm: "🎬",
  mp3: "🎵",
  m4a: "🎵",
  wav: "🎵",
  srt: "📄",
  ass: "📄",
  vtt: "📄",
  jpg: "🖼",
  jpeg: "🖼",
  png: "🖼",
  webp: "🖼",
};

function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return FILE_ICONS[ext] || "📄";
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function FileList({
  files,
  loading,
  onDownload,
  onDelete,
  onRefresh,
  onCleanup,
}: {
  files: DownloadFileInfo[];
  loading: boolean;
  onDownload: (filename: string) => string;
  onDelete: (filename: string) => void;
  onRefresh: () => void;
  onCleanup: () => void;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmCleanup, setConfirmCleanup] = useState(false);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass rounded-2xl p-4 animate-pulse"
          >
            <div className="h-4 bg-white/10 rounded w-2/3" />
            <div className="h-3 bg-white/5 rounded w-1/3 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-3xl mb-2">📥</p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          暂无下载文件
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1 opacity-60">
          完成下载后文件将出现在这里
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-secondary)]">
          共 {files.length} 个文件
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10
              text-[var(--color-text-secondary)] hover:bg-white/5 transition-colors"
          >
            刷新
          </button>
          {confirmCleanup ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onCleanup();
                  setConfirmCleanup(false);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400
                  hover:bg-red-400/20 transition-colors"
              >
                确认清理
              </button>
              <button
                onClick={() => setConfirmCleanup(false)}
                className="text-xs px-3 py-1.5 rounded-lg border border-white/10
                  text-[var(--color-text-secondary)] hover:bg-white/5 transition-colors"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmCleanup(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-400/20 text-red-400
                hover:bg-red-400/10 transition-colors"
            >
              清理全部
            </button>
          )}
        </div>
      </div>

      {/* File list */}
      {files.map((file) => (
        <div
          key={file.filename}
          className="glass rounded-2xl p-4 flex items-center gap-4"
        >
          <span className="text-xl">{getFileIcon(file.filename)}</span>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm text-[var(--color-text-primary)] truncate"
              title={file.title || file.filename}
            >
              {file.title || file.filename}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {formatSize(file.size)} · {formatDate(file.downloadedAt)}
              {file.platform && ` · ${file.platform}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={onDownload(file.filename)}
              download
              className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white
                hover:opacity-90 transition-opacity"
            >
              下载
            </a>
            <button
              onClick={async () => {
                setDeleting(file.filename);
                await onDelete(file.filename);
                setDeleting(null);
              }}
              disabled={deleting === file.filename}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-400/20 text-red-400
                hover:bg-red-400/10 transition-colors disabled:opacity-40"
            >
              {deleting === file.filename ? "…" : "删除"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
