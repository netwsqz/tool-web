import { spawn, execSync } from "child_process";
import path from "path";
import os from "os";
import type { FfmpegProgress, MediaTaskType } from "@/types";

let cachedFfmpegPath: string | null | undefined = undefined;

export function detectFfmpeg(): string | null {
  if (cachedFfmpegPath !== undefined) return cachedFfmpegPath;

  // 1. Try bundled binary in bin/ directory
  const bundledPath = path.join(
    process.cwd(),
    "bin",
    os.platform() === "win32" ? "ffmpeg.exe" : "ffmpeg"
  );
  try {
    execSync(`"${bundledPath}" -version`, { stdio: "ignore" });
    cachedFfmpegPath = bundledPath;
    return bundledPath;
  } catch {
    // not bundled — fall through
  }

  // 2. Try PATH resolution
  try {
    const cmd = os.platform() === "win32" ? "where ffmpeg" : "which ffmpeg";
    const result = execSync(cmd, { encoding: "utf8", stdio: "pipe" })
      .toString()
      .trim()
      .split("\n")[0];
    if (result) {
      cachedFfmpegPath = result;
      return result;
    }
  } catch {
    // not in PATH
  }

  // Common install locations
  const candidates: string[] = [];
  if (os.platform() === "win32") {
    const localAppData = process.env.LOCALAPPDATA || "";
    const userProfile = process.env.USERPROFILE || "";
    const programFiles = process.env["PROGRAMFILES"] || "C:\\Program Files";
    const programFilesX86 =
      process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";

    candidates.push(
      path.join(programFiles, "ffmpeg", "bin", "ffmpeg.exe"),
      path.join(programFilesX86, "ffmpeg", "bin", "ffmpeg.exe"),
      path.join(userProfile, "scoop", "apps", "ffmpeg", "current", "bin", "ffmpeg.exe"),
      path.join(localAppData, "Microsoft", "WinGet", "Packages", "ffmpeg", "ffmpeg.exe"),
      "C:\\ffmpeg\\bin\\ffmpeg.exe"
    );
  } else {
    candidates.push("/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg");
  }

  for (const candidate of candidates) {
    try {
      execSync(`"${candidate}" -version`, { stdio: "ignore" });
      cachedFfmpegPath = candidate;
      return candidate;
    } catch {
      continue;
    }
  }

  cachedFfmpegPath = null;
  return null;
}

let cachedFfprobePath: string | null | undefined = undefined;

export function detectFfprobe(): string | null {
  if (cachedFfprobePath !== undefined) return cachedFfprobePath;

  // 1. Try alongside detected ffmpeg (bundled or system)
  const ffmpegPath = detectFfmpeg();
  if (ffmpegPath) {
    const dir = path.dirname(ffmpegPath);
    const basename = path.basename(ffmpegPath);
    const ffprobeBasename = basename.replace("ffmpeg", "ffprobe");
    if (ffprobeBasename !== basename) {
      const ffprobeCandidate = path.join(dir, ffprobeBasename);
      try {
        execSync(`"${ffprobeCandidate}" -version`, { stdio: "ignore" });
        cachedFfprobePath = ffprobeCandidate;
        return ffprobeCandidate;
      } catch {
        // ffprobe not alongside ffmpeg
      }
    }
  }

  // 2. Try system PATH
  try {
    const cmd = os.platform() === "win32" ? "where ffprobe" : "which ffprobe";
    const result = execSync(cmd, { encoding: "utf8", stdio: "pipe" })
      .toString()
      .trim()
      .split("\n")[0];
    if (result) {
      cachedFfprobePath = result;
      return result;
    }
  } catch {
    // not in PATH
  }

  cachedFfprobePath = null;
  return null;
}

export function buildArgs(
  type: MediaTaskType,
  inputs: Record<string, string>,
  options: Record<string, unknown>,
  outputPath: string
): string[] {
  // Normalize paths to forward slashes for ffmpeg filter compatibility
  const normalize = (p: string) => p.replace(/\\/g, "/");

  switch (type) {
    case "video-audio-merge": {
      const video = normalize(inputs.video || "");
      const audio = normalize(inputs.audio || "");
      return [
        "-i",
        video,
        "-i",
        audio,
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-shortest",
        "-y",
        normalize(outputPath),
      ];
    }

    case "subtitle-merge": {
      const video = normalize(inputs.video || "");
      const subtitle = normalize(inputs.subtitle || "");
      const mode = (options.mode as string) || "burn";
      if (mode === "burn") {
        return [
          "-i",
          video,
          "-vf",
          `subtitles=${subtitle}`,
          "-c:a",
          "copy",
          "-y",
          normalize(outputPath),
        ];
      }
      // soft embed
      return [
        "-i",
        video,
        "-i",
        subtitle,
        "-c:v",
        "copy",
        "-c:a",
        "copy",
        "-c:s",
        "mov_text",
        "-map",
        "0",
        "-map",
        "1",
        "-y",
        normalize(outputPath),
      ];
    }

    case "volume-adjust": {
      const video = normalize(inputs.video || "");
      const factor = String(options.volume ?? 1);
      return [
        "-i",
        video,
        "-af",
        `volume=${factor}`,
        "-c:v",
        "copy",
        "-y",
        normalize(outputPath),
      ];
    }

    case "crop": {
      const video = normalize(inputs.video || "");
      const w = String(options.width || 640);
      const h = String(options.height || 480);
      const x = String(options.x || 0);
      const y = String(options.y || 0);
      return [
        "-i",
        video,
        "-vf",
        `crop=${w}:${h}:${x}:${y}`,
        "-c:a",
        "copy",
        "-y",
        normalize(outputPath),
      ];
    }

    case "transcode": {
      const video = normalize(inputs.video || "");
      return [
        "-i",
        video,
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-y",
        normalize(outputPath),
      ];
    }

    case "extract-audio": {
      const video = normalize(inputs.video || "");
      const codec = (options.codec as string) || "libmp3lame";
      return [
        "-i",
        video,
        "-vn",
        "-c:a",
        codec,
        "-q:a",
        "2",
        "-y",
        normalize(outputPath),
      ];
    }

    default:
      throw new Error(`未知的任务类型: ${type}`);
  }
}

const PROGRESS_RE =
  /frame=\s*(\d+)\s+fps=\s*([\d.]+)\s+speed=\s*([\d.]+)x\s+time=\s*(\d+:\d+:\d+\.\d+)/;

export function parseProgressLine(line: string): FfmpegProgress | null {
  const m = line.match(PROGRESS_RE);
  if (!m) return null;
  return {
    frame: parseInt(m[1], 10),
    fps: parseFloat(m[2]),
    speed: parseFloat(m[3]),
    time: m[4],
    percent: 0,
  };
}

export function parseDuration(timeStr: string): number {
  const parts = timeStr.split(":").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

export function runFfmpeg(
  args: string[],
  callbacks?: {
    onProgress?: (p: FfmpegProgress) => void;
    onLog?: (line: string) => void;
    totalDuration?: number;
  }
): { process: ReturnType<typeof spawn>; promise: Promise<void> } {
  const ffmpegPath = detectFfmpeg() || "ffmpeg";

  const proc = spawn(ffmpegPath, args, {
    windowsHide: true,
    stdio: ["ignore", "ignore", "pipe"],
  });

  let stderrBuf = "";
  const promise = new Promise<void>((resolve, reject) => {
    proc.stderr?.on("data", (chunk: Buffer) => {
      stderrBuf += chunk.toString("utf8");
      const lines = stderrBuf.split("\n");
      stderrBuf = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        callbacks?.onLog?.(trimmed);

        const progress = parseProgressLine(trimmed);
        if (progress && callbacks?.onProgress) {
          if (callbacks.totalDuration && callbacks.totalDuration > 0) {
            const secs = parseDuration(progress.time);
            progress.percent = Math.min(
              98,
              Math.round((secs / callbacks.totalDuration) * 100)
            );
          }
          callbacks.onProgress(progress);
        }
      }
    });

    proc.on("close", (code) => {
      // Flush remaining buffer
      if (stderrBuf.trim()) {
        callbacks?.onLog?.(stderrBuf.trim());
      }
      if (code === 0) {
        resolve();
      } else {
        const lastLines = stderrBuf.split("\n").slice(-10).join("\n");
        reject(
          new Error(
            `FFmpeg 退出码 ${code}\n${lastLines || "请检查 FFmpeg 是否安装正确"}`
          )
        );
      }
    });

    proc.on("error", (err) => {
      const msg =
        (err as NodeJS.ErrnoException).code === "ENOENT"
          ? "未检测到 FFmpeg，请先安装 FFmpeg 并确保在 PATH 中"
          : `FFmpeg 启动失败: ${err.message}`;
      reject(new Error(msg));
    });
  });

  return { process: proc, promise };
}
