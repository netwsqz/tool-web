"use client";

import type { ObsidianFile } from "@/types";

export function FileTree({
  files,
  activePath,
  onSelect,
  onDelete,
}: {
  files: ObsidianFile[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onDelete: (path: string) => void;
}) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="text-2xl mb-2">📄</span>
        <p className="text-sm text-[var(--color-text-secondary)]">
          还没有笔记
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          点击下方按钮创建
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {files.map((file) => {
        const isActive = file.path === activePath;
        return (
          <div
            key={file.path}
            className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer
              transition-colors text-sm
              ${
                isActive
                  ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                  : "text-[var(--color-text-primary)] hover:bg-black/5"
              }`}
            onClick={() => onSelect(file.path)}
          >
            <span className="text-xs">📄</span>
            <span className="flex-1 truncate">{file.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`确认删除「${file.title}」？`)) onDelete(file.path);
              }}
              className="opacity-0 group-hover:opacity-100 text-xs px-1.5 py-0.5
                rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-destructive)]
                hover:bg-black/10 transition-all"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
