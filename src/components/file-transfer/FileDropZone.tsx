"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";

export function FileDropZone({ onUploaded }: { onUploaded: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedName, setUploadedName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    (file: File) => {
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
        }
      });

      xhr.addEventListener("error", () => {
        setUploading(false);
        setProgress(0);
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

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // 重置 input 以便重复选择同名文件
    e.target.value = "";
  };

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`glass rounded-3xl p-10 text-center cursor-pointer transition-all duration-200
          ${dragging ? "scale-[1.02] bg-white/10 border-[var(--color-accent)]" : ""}
          ${uploading ? "pointer-events-none" : "hover:bg-white/8"}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        {uploading ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-text-secondary)]">
              正在上传 {uploadedName}
            </p>
            <div className="w-full max-w-xs mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {progress}%
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📁</div>
            <p className="text-sm text-[var(--color-text-primary)]">
              拖拽文件到此处上传
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              或点击选择文件 · 支持大文件
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
