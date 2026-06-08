"use client";

import { useState, useCallback, useRef } from "react";
import { Upload } from "lucide-react";

interface Props {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function FileDropZone({ onFilesSelected, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFilesSelected(files);
    },
    [disabled, onFilesSelected]
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) onFilesSelected(files);
      e.target.value = "";
    },
    [onFilesSelected]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      className={`
        glass rounded-3xl p-8 sm:p-12 text-center cursor-pointer
        transition-all duration-200 ease-[var(--ease-smooth)]
        ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-[var(--color-accent)]/30"}
        ${dragging ? "border-[var(--color-accent)] scale-[1.01]" : ""}
        border-2 border-dashed border-[var(--color-border)]
      `}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="size-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-3">
        <Upload className="size-5 text-[var(--color-accent)]" />
      </div>
      <p className="text-sm font-medium text-[var(--color-foreground)] mb-1">
        {dragging ? "松开以发送文件" : "拖拽文件到此处"}
      </p>
      <p className="text-xs text-[var(--color-foreground-muted)]">
        或点击选择文件 · 不限大小 · 直连传输
      </p>
    </div>
  );
}
