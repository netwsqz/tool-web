"use client";

import type { EverythingFileResult } from "@/types";
import { FileRow } from "./FileRow";

interface Props {
  results: EverythingFileResult[];
  loading: boolean;
  error: string | null;
  onOpenFolder: (path: string) => void;
  onRefresh: () => void;
  onPreview?: (file: EverythingFileResult) => void;
}

export function FileList({ results, loading, error, onOpenFolder, onRefresh, onPreview }: Props) {
  // Empty state
  if (!loading && !error && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-secondary)]">
        <span className="text-4xl mb-4">📂</span>
        <p className="text-sm">无结果</p>
        <p className="text-xs mt-1">尝试其他搜索词或检查 Everything 是否正常运行</p>
      </div>
    );
  }

  // Error state
  if (error && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--color-destructive)]">
        <span className="text-4xl mb-4">⚠️</span>
        <p className="text-sm">{error}</p>
        <button
          onClick={onRefresh}
          className="mt-3 text-xs text-[var(--color-accent)] hover:underline"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border-card)]">
        <span className="w-7 flex-shrink-0" />
        <span className="flex-1">名称</span>
        <span className="w-20 text-right flex-shrink-0">大小</span>
        <span className="w-36 text-right flex-shrink-0 hidden sm:block">修改日期</span>
        <span className="w-20 flex-shrink-0 text-center">操作</span>
      </div>

      {/* Rows */}
      <div className="min-h-[200px]">
        {results.map((file, i) => (
          <FileRow
            key={`${file.fullPath}-${i}`}
            file={file}
            onClick={() => onOpenFolder(file.fullPath)}
            onPreview={onPreview ? () => onPreview(file) : undefined}
          />
        ))}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-[var(--color-bg-primary)]/50 flex items-center justify-center animate-fade-in">
          <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
