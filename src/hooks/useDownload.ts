"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DownloadTask, VideoMetadata, DownloadFileInfo } from "@/types";

export function useDownload() {
  const [activeTask, setActiveTask] = useState<DownloadTask | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [files, setFiles] = useState<DownloadFileInfo[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [availableBrowsers, setAvailableBrowsers] = useState<string[]>([]);
  const [selectedBrowser, setSelectedBrowser] = useState("");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failCountRef = useRef(0);

  const isProcessing =
    activeTask !== null &&
    (activeTask.status === "running" || activeTask.status === "pending");

  // --- Polling ---

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPolling(false);
  }, []);

  const startPolling = useCallback(
    (taskId: string) => {
      stopPolling();
      failCountRef.current = 0;
      setPolling(true);

      const tick = async () => {
        try {
          const res = await fetch(`/api/download/${taskId}`);
          if (!res.ok) {
            if (res.status === 404) {
              // Server may have restarted — retry up to 8s for hot-reload
              failCountRef.current++;
              if (failCountRef.current <= 8) return; // wait for next tick

              // Exhausted — check if file actually completed despite state loss
              stopPolling();
              try {
                const fileRes = await fetch("/api/download/files");
                const fileData = await fileRes.json();
                const fileList = (fileData.files as DownloadFileInfo[]) || [];
                if (fileList.length > 0) {
                  // File exists — download likely completed during restart
                  setActiveTask((prev) =>
                    prev
                      ? {
                          ...prev,
                          status: "completed",
                          progress: 100,
                          completedAt: Date.now(),
                        }
                      : prev
                  );
                } else {
                  setError("任务状态已丢失，但下载可能已完成，请检查「已下载」列表");
                }
              } catch {
                setError("任务状态已丢失，请检查「已下载」列表");
              }
              return;
            }
            throw new Error(`HTTP ${res.status}`);
          }
          const data = await res.json();
          const task = data.task as DownloadTask;
          setActiveTask(task);
          failCountRef.current = 0;

          if (
            task.status === "completed" ||
            task.status === "failed" ||
            task.status === "cancelled"
          ) {
            stopPolling();
            // Refresh file list when task completes
            if (task.status === "completed") {
              refreshFiles();
            }
          }
        } catch {
          failCountRef.current++;
          if (failCountRef.current >= 5) {
            stopPolling();
            setError("无法获取任务状态，请检查网络连接");
          }
        }
      };

      tick();
      pollRef.current = setInterval(tick, 1000);
    },
    [stopPolling]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [stopPolling]);

  // --- Parse URL ---

  const parseUrl = useCallback(async (url: string, cookiesFile = "", browser = ""): Promise<VideoMetadata> => {
    setParseError(null);
    setIsParsing(true);
    setMetadata(null);

    try {
      const res = await fetch("/api/download/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), cookiesFile, browser }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "解析失败");

      const meta = data.metadata as VideoMetadata;
      setMetadata(meta);
      return meta;
    } catch (err) {
      const message = err instanceof Error ? err.message : "解析失败";
      setParseError(message);
      throw err;
    } finally {
      setIsParsing(false);
    }
  }, []);

  // --- Start Download ---

  const startDownload = useCallback(
    async (params: {
      url: string;
      formatId: string;
      format: "video" | "audio" | "subtitle" | "cover";
      title?: string;
      platform?: string;
      cookiesFile?: string;
      browser?: string;
    }): Promise<DownloadTask> => {
      setError(null);

      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: params.url.trim(),
          formatId: params.formatId,
          format: params.format,
          title: params.title || "未命名",
          platform: params.platform || "unknown",
          cookiesFile: params.cookiesFile || "",
          browser: params.browser || selectedBrowser || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "任务创建失败");

      const task = data.task as DownloadTask;
      setActiveTask(task);
      startPolling(task.id);
      return task;
    },
    [startPolling, selectedBrowser]
  );

  // --- Cancel ---

  const cancelDownload = useCallback(async () => {
    if (!activeTask) return;
    setError(null);

    try {
      await fetch(`/api/download/${activeTask.id}`, { method: "DELETE" });
    } catch {
      // best-effort
    }

    stopPolling();
    setActiveTask((prev) =>
      prev ? { ...prev, status: "cancelled", completedAt: Date.now() } : prev
    );
  }, [activeTask, stopPolling]);

  // --- Clear Task ---

  const clearTask = useCallback(() => {
    setActiveTask(null);
    setError(null);
    stopPolling();
  }, [stopPolling]);

  const clearMetadata = useCallback(() => {
    setMetadata(null);
    setParseError(null);
  }, []);

  // --- Browser Detection ---

  const detectBrowsers = useCallback(async (): Promise<string[]> => {
    try {
      const res = await fetch("/api/download/cookies/browsers");
      const data = await res.json();
      const list = (data.browsers as string[]) || [];
      setAvailableBrowsers(list);
      return list;
    } catch {
      return [];
    }
  }, []);

  // --- Cookies ---

  const restoreCookies = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/download/cookies");
      const data = await res.json();
      return (data.filename as string) || null;
    } catch {
      return null;
    }
  }, []);

  const uploadCookies = useCallback(async (file: File): Promise<{ filename: string; warning?: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/download/cookies", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "上传失败");
    return { filename: data.filename as string, warning: data.warning as string | undefined };
  }, []);

  // --- File Management ---

  const refreshFiles = useCallback(async () => {
    setFilesLoading(true);
    try {
      const res = await fetch("/api/download/files");
      const data = await res.json();
      setFiles((data.files as DownloadFileInfo[]) || []);
    } catch {
      // silent failure — files state stays stale
    } finally {
      setFilesLoading(false);
    }
  }, []);

  const deleteFile = useCallback(
    async (filename: string) => {
      const res = await fetch(
        `/api/download/files/${encodeURIComponent(filename)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        await refreshFiles();
      }
    },
    [refreshFiles]
  );

  const cleanupAll = useCallback(async () => {
    const res = await fetch("/api/download/files?all=true", { method: "DELETE" });
    if (res.ok) {
      setFiles([]);
    }
  }, []);

  const getDownloadUrl = useCallback((filename: string) => {
    return `/api/download/files/${encodeURIComponent(filename)}`;
  }, []);

  // Load files on mount
  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  return {
    // State
    activeTask,
    isProcessing,
    polling,
    error,
    metadata,
    isParsing,
    parseError,
    files,
    filesLoading,
    availableBrowsers,
    selectedBrowser,

    // Actions
    parseUrl,
    startDownload,
    cancelDownload,
    clearTask,
    clearMetadata,
    restoreCookies,
    uploadCookies,
    refreshFiles,
    deleteFile,
    cleanupAll,
    getDownloadUrl,
    detectBrowsers,
    setSelectedBrowser,

    // Setters
    setError,
  };
}
