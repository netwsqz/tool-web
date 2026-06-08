"use client";

import { formatSize } from "@/lib/format";
import type { MediaTask } from "@/types";
import { TaskLogs } from "./TaskLogs";

export function TaskProgress({
  task,
  onCancel,
  onDownload,
  onClear,
}: {
  task: MediaTask | null;
  onCancel: () => void;
  onDownload: () => string;
  onClear: () => void;
}) {
  if (!task) return null;

  const statusLabel: Record<string, string> = {
    pending: "准备中…",
    running: "处理中",
    completed: "处理完成",
    failed: "处理失败",
    cancelled: "任务已取消",
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.status === "running" && (
            <span className="w-3 h-3 rounded-full bg-[var(--color-accent)] animate-pulse" />
          )}
          {task.status === "completed" && (
            <span className="text-green-400 text-lg">✓</span>
          )}
          {task.status === "failed" && <span className="text-[var(--color-destructive)] text-lg">✗</span>}
          {task.status === "cancelled" && (
            <span className="text-yellow-400 text-lg">⚠</span>
          )}
          {task.status === "pending" && (
            <span className="w-3 h-3 rounded-full border border-[var(--color-accent)] border-t-transparent animate-spin" />
          )}
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {statusLabel[task.status] || task.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {task.status === "running" && (
            <button
              onClick={onCancel}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-destructive)]/30 text-[var(--color-destructive)]
                hover:bg-[var(--color-destructive)]/10 transition-colors"
            >
              取消
            </button>
          )}
          {(task.status === "completed" ||
            task.status === "failed" ||
            task.status === "cancelled") && (
            <button
              onClick={onClear}
              className="text-xs px-3 py-1.5 rounded-lg border border-black/10 text-[var(--color-text-secondary)]
                hover:bg-black/5 transition-colors"
            >
              重新开始
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(task.status === "running" || task.status === "pending") && (
        <div className="w-full h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] rounded-full
              transition-all duration-500 ease-out"
            role="progressbar"
            aria-valuenow={Math.round(task.progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="处理进度"
            style={{ width: `${Math.max(task.progress, 2)}%` }}
          />
        </div>
      )}

      {/* Stats */}
      {task.status === "running" && (
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
          <span>进度 {task.progress}%</span>
          <span>时间 {task.time}</span>
          {task.fps > 0 && <span>FPS {task.fps}</span>}
          {task.speed > 0 && <span>速度 {task.speed}x</span>}
        </div>
      )}

      {/* Completed: download */}
      {task.status === "completed" && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-secondary)]">
            输出文件
          </span>
          <a
            href={onDownload()}
            download
            className="text-xs px-4 py-2 rounded-xl bg-[var(--color-accent)] text-white
              hover:opacity-90 transition-opacity font-medium"
          >
            下载文件
          </a>
        </div>
      )}

      {/* Failed: error message */}
      {task.status === "failed" && task.error && (
        <div className="text-xs text-[var(--color-destructive)] bg-[var(--color-destructive)]/10 px-3 py-2 rounded-xl">
          {task.error}
        </div>
      )}

      {/* FFmpeg logs */}
      <TaskLogs logs={task.logs} expanded={task.status === "failed"} />
    </div>
  );
}
