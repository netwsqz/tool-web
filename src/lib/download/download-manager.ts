import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import type { DownloadFormatType, DownloadTask } from "@/types";
import { requireYtdlp, buildDownloadArgs, runDownload } from "./ytdlp";
import {
  getDownloadsDir,
  sanitizeFilename,
  renameDownload,
  saveDownloadMeta,
} from "./download-storage";

const tasks = new Map<string, DownloadTask>();
const activeProcesses = new Map<string, ReturnType<typeof runDownload>["process"]>();

const MAX_LOG_LINES = 200;

export function createDownloadTask(
  url: string,
  formatId: string,
  format: DownloadFormatType,
  title: string,
  platform: string,
  cookiesFile = "",
  browser = ""
): DownloadTask {
  // Check yt-dlp exists
  requireYtdlp();

  // No concurrent downloads
  for (const task of tasks.values()) {
    if (task.status === "running" || task.status === "pending") {
      throw new Error("已有任务正在运行，请等待当前任务完成");
    }
  }

  const taskId = randomUUID().slice(0, 8);
  const outputTemplate = path.join(getDownloadsDir(), `${taskId}.%(ext)s`);

  const task: DownloadTask = {
    id: taskId,
    status: "pending",
    progress: 0,
    speed: "",
    eta: "",
    totalSize: 0,
    downloadedSize: 0,
    outputFile: "",
    format,
    platform,
    url,
    title,
    logs: [],
    startedAt: Date.now(),
  };

  tasks.set(taskId, task);

  // Build args and run
  let args: string[];
  try {
    args = buildDownloadArgs({
      formatId,
      formatType: format,
      outputTemplate,
      url,
      cookiesFile,
      browser: browser || undefined,
    });
  } catch (err) {
    task.status = "failed";
    task.error = err instanceof Error ? err.message : "参数构建失败";
    task.completedAt = Date.now();
    return { ...task, logs: [...task.logs] };
  }

  task.status = "running";

  let proc: ReturnType<typeof runDownload>["process"];
  let promise: Promise<void>;
  try {
    const result = runDownload(args, {
      onLog: (line) => {
        task.logs.push(line);
        if (task.logs.length > MAX_LOG_LINES) {
          task.logs = task.logs.slice(-MAX_LOG_LINES);
        }

        // Detect output filename from yt-dlp log
        const destMatch = line.match(/\[download\]\s+Destination:\s+(.+)/i);
        if (destMatch) {
          task.outputFile = path.basename(destMatch[1].trim());
        }
      },
      onProgress: (progress) => {
        task.progress = progress.percent;
        task.speed = progress.speed;
        task.eta = progress.eta;
        task.downloadedSize = progress.downloadedBytes;
        if (progress.percent > 0) {
          task.totalSize = Math.round(
            progress.downloadedBytes / (progress.percent / 100)
          );
        }
      },
    });
    proc = result.process;
    promise = result.promise;
  } catch (err) {
    task.status = "failed";
    task.error = err instanceof Error ? err.message : "下载进程启动失败";
    task.completedAt = Date.now();
    return { ...task, logs: [...task.logs] };
  }

  activeProcesses.set(taskId, proc);

  promise
    .then(() => {
      task.status = "completed";
      task.progress = 100;
      task.speed = "";
      task.eta = "";
      task.completedAt = Date.now();

      // Rename to a human-friendly filename
      if (task.outputFile) {
        const ext = path.extname(task.outputFile) || ".mp4";
        const safeTitle = sanitizeFilename(title).slice(0, 80) || `video_${taskId}`;
        const newName = `${safeTitle}_${taskId}${ext}`;
        const oldPath = path.join(getDownloadsDir(), task.outputFile);
        if (fs.existsSync(oldPath)) {
          try {
            task.outputFile = renameDownload(oldPath, newName);
            // Persist metadata alongside the renamed file
            saveDownloadMeta(task.outputFile, {
              title,
              platform,
              url,
            });
          } catch {
            // best-effort rename, keep original name
          }
        }
      }

      activeProcesses.delete(taskId);
    })
    .catch((err: Error) => {
      task.status = "failed";
      task.error = err.message;
      task.completedAt = Date.now();
      activeProcesses.delete(taskId);
    });

  return { ...task, logs: [...task.logs] };
}

export function getDownloadTask(taskId: string): DownloadTask | null {
  const task = tasks.get(taskId);
  return task ? { ...task, logs: [...task.logs] } : null;
}

export function getActiveDownloadTask(): DownloadTask | null {
  for (const task of tasks.values()) {
    if (task.status === "running" || task.status === "pending") {
      return { ...task, logs: [...task.logs] };
    }
  }
  return null;
}

export function cancelDownloadTask(taskId: string): boolean {
  const task = tasks.get(taskId);
  if (!task) return false;

  if (task.status === "running") {
    const proc = activeProcesses.get(taskId);
    if (proc) {
      try {
        proc.kill("SIGTERM");
      } catch {
        try {
          proc.kill();
        } catch {
          // process already dead
        }
      }
    }
  }

  if (task.status === "running" || task.status === "pending") {
    task.status = "cancelled";
    task.completedAt = Date.now();
  }

  activeProcesses.delete(taskId);

  // Clean up partial files
  if (task.outputFile) {
    try {
      const fp = path.join(getDownloadsDir(), task.outputFile);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    } catch {
      // best-effort
    }
  }

  return true;
}

export function listDownloadTasks(): DownloadTask[] {
  return Array.from(tasks.values())
    .map((t) => ({ ...t, logs: [...t.logs] }))
    .sort((a, b) => b.startedAt - a.startedAt);
}
