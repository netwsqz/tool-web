"use client";

import { useEffect, useRef, useState } from "react";
import { formatSize } from "@/lib/format";
import type { DownloadTask } from "@/types";

function TaskLogs({
  logs,
  expanded: defaultExpanded = false,
}: {
  logs: string[];
  expanded?: boolean;
}) {
  const [open, setOpen] = useState(defaultExpanded);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, open]);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]
          hover:text-[var(--color-text-primary)] transition-colors"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        下载日志
        {logs.length > 0 && (
          <span className="opacity-50">({logs.length} 行)</span>
        )}
      </button>

      {open && (
        <div
          ref={scrollRef}
          className="mt-2 max-h-48 overflow-y-auto bg-black/40 rounded-xl p-3 font-mono text-xs
            leading-relaxed"
        >
          {logs.length === 0 ? (
            <p className="text-[var(--color-text-secondary)] italic">
              等待日志…
            </p>
          ) : (
            logs.map((line, i) => (
              <div key={i} className="text-green-400/80">
                {line}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function DownloadTaskProgress({
  task,
  onCancel,
  onClear,
  downloadUrl,
}: {
  task: DownloadTask | null;
  onCancel: () => void;
  onClear: () => void;
  downloadUrl?: string;
}) {
  if (!task) return null;

  const statusLabel: Record<string, string> = {
    pending: "准备中…",
    running: "下载中",
    completed: "下载完成",
    failed: "下载失败",
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
          {task.status === "failed" && <span className="text-red-400 text-lg">✗</span>}
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
              className="text-xs px-3 py-1.5 rounded-lg border border-red-400/30 text-red-400
                hover:bg-red-400/10 transition-colors"
            >
              取消
            </button>
          )}
          {(task.status === "completed" ||
            task.status === "failed" ||
            task.status === "cancelled") && (
            <button
              onClick={onClear}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-[var(--color-text-secondary)]
                hover:bg-white/5 transition-colors"
            >
              重新开始
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      {task.title && (
        <div className="text-xs text-[var(--color-text-secondary)] truncate">
          {task.title}
        </div>
      )}

      {/* Progress bar */}
      {(task.status === "running" || task.status === "pending") && (
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--color-accent)] to-blue-400 rounded-full
              transition-all duration-500 ease-out"
            style={{ width: `${Math.max(task.progress, 2)}%` }}
          />
        </div>
      )}

      {/* Stats */}
      {task.status === "running" && (
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
          <span>进度 {task.progress.toFixed(1)}%</span>
          {task.speed && <span>速度 {task.speed}</span>}
          {task.eta && task.eta !== "---" && <span>剩余 {task.eta}</span>}
          {task.totalSize > 0 && (
            <span>
              {formatSize(task.downloadedSize)} / {formatSize(task.totalSize)}
            </span>
          )}
        </div>
      )}

      {/* Completed: download link */}
      {task.status === "completed" && downloadUrl && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-secondary)] truncate">
            {task.outputFile}
          </span>
          <a
            href={downloadUrl}
            download
            className="text-xs px-4 py-2 rounded-xl bg-[var(--color-accent)] text-white
              hover:opacity-90 transition-opacity font-medium shrink-0"
          >
            下载文件
          </a>
        </div>
      )}

      {/* Failed: error message */}
      {task.status === "failed" && task.error && (
        <div className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-xl">
          {task.error}
        </div>
      )}

      {/* Logs */}
      <TaskLogs logs={task.logs} expanded={task.status === "failed"} />
    </div>
  );
}
