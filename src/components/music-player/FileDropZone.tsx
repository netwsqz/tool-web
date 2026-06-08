"use client";

import { useCallback, useRef, useState } from "react";
import { Music, Upload } from "lucide-react";

type FileDropZoneProps = {
  onAddFiles: (files: File[]) => void;
};

export function FileDropZone({ onAddFiles }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onAddFiles(files);
    },
    [onAddFiles],
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onAddFiles(Array.from(files));
      }
      e.target.value = "";
    },
    [onAddFiles],
  );

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 animate-fade-in">
      <div
        className="size-16 rounded-full flex items-center justify-center"
        style={{ background: "color-mix(in srgb, var(--color-accent) 10%, transparent)" }}
      >
        <Music className="size-8" style={{ color: "var(--color-accent)" }} />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-semibold" style={{ color: "var(--color-foreground)" }}>
          音乐播放器
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-foreground-muted)" }}>
          支持 mp3 / flac / wav / ogg 格式
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="点击或拖放音频文件到此处"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="w-full max-w-md p-12 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-200"
        style={{
          borderColor: isDragOver
            ? "var(--color-accent)"
            : "var(--color-border)",
          background: isDragOver
            ? "color-mix(in srgb, var(--color-accent) 5%, transparent)"
            : "transparent",
          transform: isDragOver ? "scale(1.02)" : "scale(1)",
        }}
      >
        <Upload
          className="size-8 mx-auto mb-3 transition-colors"
          style={{
            color: isDragOver ? "var(--color-accent)" : "var(--color-foreground-muted)",
          }}
        />
        <p
          className="text-sm transition-colors"
          style={{
            color: isDragOver ? "var(--color-accent)" : "var(--color-foreground-muted)",
          }}
        >
          {isDragOver ? "释放以添加文件" : "拖拽音乐文件到此处"}
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: "var(--color-foreground-subtle)" }}
        >
          或点击选择文件
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.flac,.wav,.ogg,.m4a,.aac"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
