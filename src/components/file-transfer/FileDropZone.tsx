"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";

export function FileDropZone({ onUploaded }: { onUploaded: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedName, setUploadedName] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    (file: File) => {
      setUploadError(null);
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/files");

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        setUploading(false);
        setProgress(0);
        if (xhr.status === 200) {
          setUploadedName("");
          onUploaded();
        } else {
          setUploadError("上传失败，请重试");
        }
      });

      xhr.addEventListener("error", () => {
        setUploading(false);
        setProgress(0);
        setUploadError("上传失败，请重试");
      });

      setUploading(true);
      setUploadedName(file.name);
      setProgress(0);
      xhr.send(formData);
    },
    [onUploaded]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) uploadFile(files[0]);
    },
    [uploadFile]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // 重置 input 以便重复选择同名文件
    e.target.value = "";
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="点击或拖放文件到此处上传"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`glass rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 border-2 border-dashed
          ${dragging ? "scale-[1.02] border-[var(--color-accent)] bg-[var(--color-accent)]/5" : "border-[var(--color-border)]"}
          ${uploading ? "pointer-events-none" : "hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)]"}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          aria-label="选择要上传的文件"
          onChange={handleFileChange}
        />

        {uploading ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-foreground-muted)]">
              正在上传 {uploadedName}
            </p>
            <div className="w-full max-w-xs mx-auto h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="上传进度"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-[var(--color-foreground-muted)]">
              {progress}%
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl" aria-hidden="true">📁</div>
            <p className="text-sm text-[var(--color-foreground)]">
              拖拽文件到此处上传
            </p>
            <p className="text-xs text-[var(--color-foreground-muted)]">
              或点击选择文件 · 支持大文件
            </p>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-[var(--color-destructive)] mt-2 text-center" role="alert">
          {uploadError}
        </p>
      )}
    </div>
  );
}
