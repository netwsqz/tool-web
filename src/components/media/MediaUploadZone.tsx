"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import type { MediaFileInfo } from "@/types";
import { MediaFileCard } from "./MediaFileCard";

export function MediaUploadZone({
  accept,
  label,
  onUpload,
  onRemove,
  uploaded,
  disabled,
}: {
  accept: string;
  label: string;
  onUpload: (file: File) => Promise<MediaFileInfo>;
  onRemove?: (filename: string) => void;
  uploaded: MediaFileInfo[];
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        await onUpload(file);
      } catch (e) {
        setError(e instanceof Error ? e.message : "上传失败");
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled || uploading) return;
      const file = e.dataTransfer.files[0];
      if (file) upload(file);
    },
    [disabled, uploading, upload]
  );

  const handleClick = () => fileInputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  const hasFiles = uploaded.length > 0;

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--color-text-secondary)] font-medium">
        {label}
      </p>

      {hasFiles && (
        <div className="space-y-1.5 mb-2">
          {uploaded.map((f) => (
            <MediaFileCard
              key={f.filename}
              file={f}
              onRemove={onRemove ? () => onRemove(f.filename) : undefined}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`点击或拖放${label}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            handleClick();
          }
        }}
        onClick={disabled ? undefined : handleClick}
        className={`glass rounded-2xl p-6 text-center transition-all duration-200
          ${
            disabled
              ? "opacity-40 cursor-not-allowed"
              : "cursor-pointer hover:bg-black/8"
          }
          ${dragging ? "scale-[1.02] bg-black/10 border-[var(--color-accent)]" : ""}
          ${uploading ? "pointer-events-none" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
        />

        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full border border-[var(--color-accent)] border-t-transparent animate-spin" />
            <span className="text-sm text-[var(--color-text-secondary)]">
              上传中…
            </span>
          </div>
        ) : disabled ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            等待当前任务完成
          </p>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-[var(--color-text-secondary)]">
              拖拽或点击添加{label}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] opacity-60">
              支持 {accept} 格式
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-[var(--color-destructive)] bg-[var(--color-destructive)]/10 px-3 py-1.5 rounded-lg">
          {error}
        </p>
      )}
    </div>
  );
}
