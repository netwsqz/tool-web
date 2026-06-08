"use client";

import { formatSize } from "@/lib/format";
import type { FileInfo } from "@/lib/storage";

export function FileList({
  files,
  loading,
  onPreview,
}: {
  files: FileInfo[];
  loading: boolean;
  onPreview?: (file: FileInfo) => void;
}) {
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="glass rounded-3xl p-6 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">加载中…</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">
          还没有上传任何文件
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-black/5 text-xs text-[var(--color-text-secondary)] flex items-center">
        <span className="flex-1">文件名</span>
        <span className="w-20 text-right">大小</span>
        <span className="w-16 text-right">时间</span>
        <span className="w-24" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-black/5">
        {files.map((file) => (
          <div
            key={file.name}
            className="px-5 py-3 flex items-center text-sm hover:bg-black/[0.02] transition-colors"
          >
            <span className="flex-1 truncate pr-3 text-[var(--color-text-primary)]">
              {file.name}
            </span>
            <span className="w-20 text-right text-xs text-[var(--color-text-secondary)]">
              {formatSize(file.size)}
            </span>
            <span className="w-16 text-right text-xs text-[var(--color-text-secondary)]">
              {formatTime(file.uploadedAt)}
            </span>
            <span className="w-24 flex justify-end gap-1">
              {onPreview && (
                <button
                  onClick={() => onPreview(file)}
                  className="text-xs px-2 py-1 rounded-lg bg-black/[0.04] hover:bg-black/15 text-[var(--color-text-primary)] transition-colors"
                >
                  预览
                </button>
              )}
              <a
                href={`/api/files/${encodeURIComponent(file.name)}`}
                download
                className="text-xs px-2 py-1 rounded-lg bg-black/10 hover:bg-black/20 text-[var(--color-text-primary)] transition-colors"
              >
                ⬇
              </a>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
