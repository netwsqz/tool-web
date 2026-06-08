"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FileInfo } from "@/lib/storage";

export function useFileTransfer() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/files");
      if (res.ok) {
        setFiles(await res.json());
      } else {
        setError("获取文件列表失败");
      }
    } catch {
      setError("网络连接失败，无法获取文件列表");
    } finally {
      setLoading(false);
    }
  }, []);

  const openPreview = useCallback((file: FileInfo) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
    // 等待退出动画结束后再清除文件数据
    previewTimeoutRef.current = setTimeout(() => setPreviewFile(null), 300);
  }, []);

  useEffect(() => () => clearTimeout(previewTimeoutRef.current), []);

  return {
    files,
    loading,
    error,
    fetchFiles,
    previewFile,
    isPreviewOpen,
    openPreview,
    closePreview,
  };
}
