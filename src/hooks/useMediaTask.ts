"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaFileInfo, MediaTask, MediaTaskConfig } from "@/types";

export function useMediaTask() {
  const [activeTask, setActiveTask] = useState<MediaTask | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          const res = await fetch(`/api/media/${taskId}`);
          if (!res.ok) {
            if (res.status === 404) {
              stopPolling();
              setError("任务状态已丢失（服务器可能已重启）");
              return;
            }
            throw new Error(`HTTP ${res.status}`);
          }
          const data = await res.json();
          const task = data.task as MediaTask;
          setActiveTask(task);
          failCountRef.current = 0;

          if (
            task.status === "completed" ||
            task.status === "failed" ||
            task.status === "cancelled"
          ) {
            stopPolling();
          }
        } catch {
          failCountRef.current++;
          if (failCountRef.current >= 3) {
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

  // --- Upload ---

  const uploadFile = useCallback(
    async (file: File): Promise<MediaFileInfo> => {
      setError(null);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");
      return data.file as MediaFileInfo;
    },
    []
  );

  // --- Start Task ---

  const startTask = useCallback(
    async (config: MediaTaskConfig): Promise<MediaTask> => {
      setError(null);

      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "任务创建失败");

      const task = data.task as MediaTask;
      setActiveTask(task);
      startPolling(task.id);
      return task;
    },
    [startPolling]
  );

  // --- Cancel ---

  const cancelTask = useCallback(async () => {
    if (!activeTask) return;
    setError(null);

    try {
      await fetch(`/api/media/${activeTask.id}`, { method: "DELETE" });
    } catch {
      // best-effort
    }

    stopPolling();
    setActiveTask((prev) =>
      prev ? { ...prev, status: "cancelled" as const, completedAt: Date.now() } : prev
    );
  }, [activeTask, stopPolling]);

  // --- Clear ---

  const clearTask = useCallback(() => {
    setActiveTask(null);
    setError(null);
    stopPolling();
  }, [stopPolling]);

  return {
    activeTask,
    isProcessing,
    polling,
    error,
    uploadFile,
    startTask,
    cancelTask,
    clearTask,
    setError,
  };
}
