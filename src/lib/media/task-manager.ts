import { randomUUID } from "crypto";
import path from "path";
import type { MediaTask, MediaTaskConfig, TaskStatus } from "@/types";
import { buildArgs, detectFfmpeg, detectFfprobe, runFfmpeg, parseDuration } from "./ffmpeg";
import {
  getInputPath,
  generateOutputFilename,
  getTempPath,
  cleanupTaskFiles,
  saveOutput,
} from "./media-storage";

const tasks = new Map<string, MediaTask>();
const activeProcesses = new Map<string, ReturnType<typeof runFfmpeg>["process"]>();
const durationCache = new Map<string, number>();

const MAX_LOG_LINES = 200;

function createTaskRecord(
  id: string,
  config: MediaTaskConfig,
  outputFile: string
): MediaTask {
  return {
    id,
    type: config.type,
    status: "pending",
    progress: 0,
    fps: 0,
    speed: 0,
    time: "00:00:00.00",
    inputFiles: Object.values(config.inputs),
    outputFile,
    logs: [],
    startedAt: Date.now(),
  };
}

export function createTask(config: MediaTaskConfig): MediaTask {
  // Check ffmpeg exists
  if (!detectFfmpeg()) {
    throw new Error(
      "未检测到 FFmpeg。将 ffmpeg.exe 放入项目 bin/ 目录后重试，\n" +
      "或安装 FFmpeg 并确保在系统 PATH 中"
    );
  }

  // No concurrent tasks
  for (const task of tasks.values()) {
    if (task.status === "running" || task.status === "pending") {
      throw new Error("已有任务正在运行，请等待当前任务完成");
    }
  }

  const taskId = randomUUID().slice(0, 8);
  const inputVideo = config.inputs.video || config.inputs.audio || "";
  const ext = path.extname(inputVideo || "output.mp4") || ".mp4";
  const outputFilename = generateOutputFilename(taskId, ext);
  const outputPath = getTempPath(outputFilename);

  // Resolve input paths
  const resolvedInputs: Record<string, string> = {};
  for (const [key, filename] of Object.entries(config.inputs)) {
    const resolved = getInputPath(filename);
    if (!resolved) {
      throw new Error(`输入文件不存在: ${filename}`);
    }
    resolvedInputs[key] = resolved;
  }

  const task = createTaskRecord(taskId, config, outputFilename);
  tasks.set(taskId, task);

  // Get total duration for progress calculation (best-effort)
  let totalDuration = 0;
  try {
    const ffprobePath = detectFfprobe() || "ffprobe";
    const videoPath = resolvedInputs.video || resolvedInputs.audio || "";
    if (videoPath) {
      const { execSync } = require("child_process");
      const result = execSync(
        `"${ffprobePath}" -v error -show_entries format=duration -of csv=p=0 "${videoPath}"`,
        { encoding: "utf8", timeout: 5000 }
      );
      totalDuration = parseFloat(result.trim()) || 0;
      durationCache.set(taskId, totalDuration);
    }
  } catch {
    // ffprobe unavailable — progress will show without percentage
  }

  // Build args and run
  const args = buildArgs(config.type, resolvedInputs, config.options, outputPath);

  task.status = "running";

  const { process: proc, promise } = runFfmpeg(args, {
    totalDuration,
    onProgress: (progress) => {
      task.fps = progress.fps;
      task.speed = progress.speed;
      task.time = progress.time;
      task.progress = progress.percent;
    },
    onLog: (line) => {
      task.logs.push(line);
      if (task.logs.length > MAX_LOG_LINES) {
        task.logs = task.logs.slice(-MAX_LOG_LINES);
      }
    },
  });

  activeProcesses.set(taskId, proc);

  promise
    .then(() => {
      task.status = "completed";
      task.progress = 100;

      try {
        saveOutput(outputPath, outputFilename);
      } catch {
        task.error = "输出文件保存失败";
      }

      // Cleanup
      cleanupTaskFiles(Object.values(config.inputs));
      try {
        const fs = require("fs");
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch {
        // best-effort cleanup
      }

      task.completedAt = Date.now();
      activeProcesses.delete(taskId);
      durationCache.delete(taskId);
    })
    .catch((err: Error) => {
      task.status = "failed";
      task.error = err.message;
      task.completedAt = Date.now();
      activeProcesses.delete(taskId);
      durationCache.delete(taskId);
    });

  return { ...task };
}

export function getTask(taskId: string): MediaTask | null {
  const task = tasks.get(taskId);
  return task ? { ...task, logs: [...task.logs] } : null;
}

export function getActiveTask(): MediaTask | null {
  for (const task of tasks.values()) {
    if (task.status === "running" || task.status === "pending") {
      return { ...task, logs: [...task.logs] };
    }
  }
  return null;
}

export function cancelTask(taskId: string): boolean {
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
    task.status = "cancelled" as TaskStatus;
    task.completedAt = Date.now();
  }

  activeProcesses.delete(taskId);
  durationCache.delete(taskId);
  return true;
}

export function listTasks(): MediaTask[] {
  return Array.from(tasks.values())
    .map((t) => ({ ...t, logs: [...t.logs] }))
    .sort((a, b) => b.startedAt - a.startedAt);
}
