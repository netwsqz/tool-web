import { spawn, execSync, type ChildProcess } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import type { VideoMetadata, VideoFormat, SubtitleInfo } from "@/types";
import { getCookiesPath } from "./download-storage";

// --- Detection ---

let cachedYtdlpPath: string | null | undefined = undefined;

export function detectYtdlp(): string | null {
  if (cachedYtdlpPath !== undefined) return cachedYtdlpPath;

  // 1. Try bundled binary in bin/ directory
  const bundledPath = path.join(
    process.cwd(),
    "bin",
    os.platform() === "win32" ? "yt-dlp.exe" : "yt-dlp"
  );
  try {
    execSync(`"${bundledPath}" --version`, { stdio: "ignore" });
    cachedYtdlpPath = bundledPath;
    return bundledPath;
  } catch {
    // not bundled — fall through
  }

  // 2. Try system PATH
  try {
    const cmd = os.platform() === "win32" ? "where yt-dlp" : "which yt-dlp";
    const result = execSync(cmd, { encoding: "utf8", stdio: "pipe" })
      .toString()
      .trim()
      .split("\n")[0];
    if (result) {
      cachedYtdlpPath = result;
      return result;
    }
  } catch {
    // not in PATH
  }

  // 3. Common install locations (Windows)
  if (os.platform() === "win32") {
    const userProfile = process.env.USERPROFILE || "";
    const localAppData = process.env.LOCALAPPDATA || "";
    const programFiles = process.env["PROGRAMFILES"] || "C:\\Program Files";

    const candidates = [
      path.join(userProfile, "scoop", "apps", "yt-dlp", "current", "yt-dlp.exe"),
      path.join(localAppData, "Microsoft", "WinGet", "Packages", "yt-dlp", "yt-dlp.exe"),
      path.join(programFiles, "yt-dlp", "yt-dlp.exe"),
      path.join(userProfile, "AppData", "Local", "Programs", "Python", "Scripts", "yt-dlp.exe"),
    ];

    for (const candidate of candidates) {
      try {
        execSync(`"${candidate}" --version`, { stdio: "ignore" });
        cachedYtdlpPath = candidate;
        return candidate;
      } catch {
        continue;
      }
    }
  }

  cachedYtdlpPath = null;
  return null;
}

// --- Browser Detection for --cookies-from-browser ---

function getBrowserCookiePaths(): Record<string, string[]> {
  const localAppData = process.env.LOCALAPPDATA || "";
  const appData = process.env.APPDATA || "";

  return {
    chrome: [
      path.join(localAppData, "Google", "Chrome", "User Data", "Default", "Cookies"),
      path.join(localAppData, "Google", "Chrome", "User Data", "Default", "Network", "Cookies"),
    ],
    edge: [
      path.join(localAppData, "Microsoft", "Edge", "User Data", "Default", "Cookies"),
      path.join(localAppData, "Microsoft", "Edge", "User Data", "Default", "Network", "Cookies"),
    ],
    firefox: [
      path.join(appData, "Mozilla", "Firefox", "Profiles"),
    ],
    brave: [
      path.join(localAppData, "BraveSoftware", "Brave-Browser", "User Data", "Default", "Cookies"),
    ],
    opera: [
      path.join(appData, "Opera Software", "Opera Stable", "Cookies"),
    ],
    chromium: [
      path.join(localAppData, "Chromium", "User Data", "Default", "Cookies"),
    ],
  };
}

export function detectAvailableBrowsers(): string[] {
  const available: string[] = [];
  const browserPaths = getBrowserCookiePaths();

  for (const [id, paths] of Object.entries(browserPaths)) {
    // For Firefox, check if profiles directory has any entries
    if (id === "firefox") {
      const profilesDir = paths[0];
      if (fs.existsSync(profilesDir)) {
        try {
          const entries = fs.readdirSync(profilesDir);
          if (entries.some((e) => e.endsWith(".default-release") || e.endsWith(".default"))) {
            available.push(id);
          }
        } catch {
          // skip
        }
      }
      continue;
    }

    // For Chromium-based browsers, check cookie DB file exists
    if (paths.some((p) => fs.existsSync(p))) {
      available.push(id);
    }
  }

  return available;
}

export function requireYtdlp(): string {
  const detected = detectYtdlp();
  if (!detected) {
    throw new Error(
      "未检测到 yt-dlp。请将 yt-dlp.exe 放入项目 bin/ 目录后重试，\n" +
      "或通过 winget install yt-dlp / scoop install yt-dlp 安装"
    );
  }
  return detected;
}

// --- Metadata Parsing ---

interface YtdlpFormat {
  format_id: string;
  ext: string;
  width?: number;
  height?: number;
  filesize?: number;
  filesize_approx?: number;
  tbr?: number;
  vcodec: string;
  acodec: string;
  format_note?: string;
  resolution?: string;
}

interface YtdlpSubtitle {
  ext: string;
  url: string;
  name?: string;
}

interface YtdlpJson {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  uploader?: string;
  uploader_url?: string;
  view_count?: number;
  like_count?: number;
  formats?: YtdlpFormat[];
  subtitles?: Record<string, YtdlpSubtitle[]>;
  ext?: string;
  url?: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "未知大小";
  const units = ["B", "KiB", "MiB", "GiB"];
  let size = bytes;
  let unitIdx = 0;
  while (size >= 1024 && unitIdx < units.length - 1) {
    size /= 1024;
    unitIdx++;
  }
  return `${size.toFixed(unitIdx > 0 ? 2 : 0)} ${units[unitIdx]}`;
}

function getFormatLabel(height: number | undefined, formatNote?: string): string {
  if (formatNote) {
    // Some platforms provide useful format notes
    return formatNote;
  }
  // Derive label from height
  if (!height) return "未知";
  if (height >= 2160) return "4K";
  if (height >= 1440) return "2K";
  if (height >= 1080) return "1080P";
  if (height >= 720) return "720P";
  if (height >= 480) return "480P";
  if (height >= 360) return "360P";
  return `${height}P`;
}

function getResolutionString(
  width: number | undefined,
  height: number | undefined
): string {
  if (width && height) return `${width}x${height}`;
  if (height) return `0x${height}`;
  return "音频仅";
}

function getCodecLabel(vcodec: string): string {
  if (!vcodec || vcodec === "none") return "";
  const lower = vcodec.toLowerCase();
  if (lower.includes("hevc") || lower.includes("h265") || lower.includes("h.265")) return "HEVC";
  if (lower.includes("avc") || lower.includes("h264") || lower.includes("h.264")) return "AVC";
  if (lower.includes("av1")) return "AV1";
  return vcodec.slice(0, 8);
}

export function parseMetadataJson(raw: string, platform: string): VideoMetadata {
  const data: YtdlpJson = JSON.parse(raw);

  const formats: VideoFormat[] = [];

  // Collect all video-capable formats (both pure-video and combined),
  // sort globally by height descending
  const videoCandidates: YtdlpFormat[] = [];

  for (const f of data.formats || []) {
    const hasVideo = f.vcodec && f.vcodec !== "none";
    if (hasVideo) videoCandidates.push(f);
  }

  videoCandidates.sort((a, b) => (b.height || 0) - (a.height || 0));

  // Deduplicate by height: keep the one with audio when available at same height
  const seenHeights = new Set<number>();
  for (const f of videoCandidates) {
    const h = f.height || 0;
    const hasAudio = f.acodec && f.acodec !== "none";

    if (seenHeights.has(h)) continue;
    if (h > 0) seenHeights.add(h);

    const filesize = f.filesize || f.filesize_approx || 0;
    const codecLabel = getCodecLabel(f.vcodec);
    const label = [getFormatLabel(f.height, f.format_note), codecLabel]
      .filter(Boolean)
      .join(" · ");

    // Video-only formats need +ba/best to merge audio; combined formats use directly
    const formatId = hasAudio ? f.format_id : `${f.format_id}+ba/best`;

    formats.push({
      formatId,
      ext: f.ext || "mp4",
      resolution: getResolutionString(f.width, f.height),
      width: f.width,
      height: f.height,
      filesize,
      filesizeText: filesize > 0 ? formatFileSize(filesize) : "未知大小",
      formatNote: label,
      vcodec: f.vcodec || "",
      acodec: f.acodec || "",
      tbr: f.tbr || 0,
    });
  }

  // Add audio-only option — detect actual best audio codec
  const audioFormats = (data.formats || []).filter(
    (f) => (!f.vcodec || f.vcodec === "none") && f.acodec && f.acodec !== "none"
  );
  const bestAudio = audioFormats.sort((a, b) => (b.tbr || 0) - (a.tbr || 0))[0];

  formats.push({
    formatId: "ba",
    ext: "mp3",
    resolution: "音频仅",
    filesize: 0,
    filesizeText: "提取后确定",
    formatNote: "仅音频",
    vcodec: "none",
    acodec: bestAudio?.acodec || "",
    tbr: bestAudio?.tbr || 0,
  });

  // Process subtitles
  const subtitles: Record<string, SubtitleInfo[]> = {};
  for (const [lang, subs] of Object.entries(data.subtitles || {})) {
    subtitles[lang] = subs.map((s) => ({
      ext: s.ext,
      url: s.url,
      name: s.name || lang,
    }));
  }

  return {
    id: data.id,
    title: data.title || "未知标题",
    description: data.description || "",
    thumbnail: data.thumbnail || "",
    duration: data.duration || 0,
    durationString: formatDuration(data.duration || 0),
    uploader: data.uploader || "未知",
    uploaderUrl: data.uploader_url,
    viewCount: data.view_count,
    likeCount: data.like_count,
    formats,
    subtitles,
    platform,
  };
}

// --- Cookie detection from yt-dlp stderr ---

const COOKIE_OK_RE = /\[cookies\]\s+(?:loading|loaded).*from\s+browser/i;
const COOKIE_FAIL_RE =
  /(?:WARNING|ERROR):.*(?:cookies?).*(?:not\s+(?:found|import|support)|unable|cannot|could\s+not|decrypt|unavailable)/i;
const COOKIE_LOADED_RE = /\[cookies\]\s+loaded\s+\d+\s+cookies?\s+from/i;

function detectCookieStatus(
  stderr: string,
  browser?: string
): { cookieStatus: "ok" | "none" | "failed"; cookieWarning?: string } {
  if (!browser) return { cookieStatus: "none" };

  // Check stderr for cookie loading result
  const lines = stderr.split("\n").filter((l) => l.trim());

  let loadedCount = 0;
  let failReason = "";

  for (const line of lines) {
    // Check if cookies were actually loaded with a count
    const loadedMatch = line.match(COOKIE_LOADED_RE);
    if (loadedMatch) {
      const countMatch = line.match(/(\d+)\s+cookies?/i);
      if (countMatch) loadedCount = parseInt(countMatch[1], 10);
    }

    // Check for failure warnings
    if (COOKIE_FAIL_RE.test(line)) {
      // Extract the actual warning text
      const clean = line.replace(/^(WARNING|ERROR):\s*/i, "").trim();
      if (!failReason) failReason = clean;
    }
  }

  if (loadedCount > 0) return { cookieStatus: "ok" };
  if (failReason) return { cookieStatus: "failed", cookieWarning: failReason };

  // If we see [cookies] loading but no explicit loaded/count, assume ok
  if (COOKIE_OK_RE.test(stderr)) return { cookieStatus: "ok" };

  // No cookie-related output at all — treat as failure if browser was requested
  const isChromium = ["chrome", "edge", "brave", "chromium", "opera"].includes(browser);
  const browserName = browser.charAt(0).toUpperCase() + browser.slice(1);
  return {
    cookieStatus: "failed",
    cookieWarning: isChromium
      ? `未能从 ${browserName} 读取到 Cookie。Chrome 运行时会锁定 Cookie 文件，可关闭后再试；如仍是此提示，说明新版 Chrome 加密无法兼容，建议改用 Firefox 或「导入 cookies.txt」方式`
      : `未能从 ${browserName} 读取到 Cookie。请确认已在浏览器中登录 Bilibili`,
  };
}

export async function parseMetadata(
  url: string,
  cookiesFile = "",
  browser = ""
): Promise<VideoMetadata> {
  const ytdlpPath = requireYtdlp();

  // Determine platform from URL (for future extensibility)
  const platform = url.includes("bilibili.com") ? "bilibili" : "unknown";

  return new Promise((resolve, reject) => {
    const args = [
      "--dump-json",
      "--no-warnings",
      "--no-playlist",
      "--no-check-certificate",
    ];

    if (browser) {
      args.push("--cookies-from-browser", browser);
    } else if (cookiesFile) {
      const cp = getCookiesPath(cookiesFile);
      if (cp) args.push("--cookies", cp);
    }

    args.push(url);

    const proc = spawn(ytdlpPath, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("close", (code) => {
      if (code === 0 && stdout) {
        try {
          const metadata = parseMetadataJson(stdout, platform);
          const cookieInfo = detectCookieStatus(stderr, browser || undefined);
          resolve({ ...metadata, ...cookieInfo });
        } catch (e) {
          reject(new Error(`解析视频信息失败: ${(e as Error).message}`));
        }
      } else {
        let msg = stderr.split("\n").filter((l) => l.trim()).slice(-3).join("; ");

        // Detect common cookie errors and provide user-friendly advice
        if (/could not copy (chrome|edge|brave|chromium) cookie/i.test(msg)) {
          msg += "\n💡 Cookie 数据库被浏览器锁定。关闭浏览器后 Cookie 仍在磁盘上，yt-dlp 即可读取。如关闭后仍失败，请改用 Firefox 或「导入 cookies.txt」方式";
        } else if (/cannot decrypt.*cookies/.test(msg)) {
          msg += "\n💡 新版 Chrome/Edge 加密无法兼容。请改用 Firefox（无需关闭）或「导入 cookies.txt」方式";
        }

        reject(new Error(msg || `视频解析失败，请检查链接是否正确`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`启动 yt-dlp 失败: ${err.message}`));
    });
  });
}

// --- Progress Parsing ---

export interface DownloadProgress {
  percent: number;
  speed: string;
  eta: string;
  downloadedBytes: number;
}

const DL_PROGRESS_RE =
  /\[download\]\s+([\d.]+)%\s+of\s+~?([\d.]+[KMGTPE]?i?B)\s+at\s+([\d.]+\s*[KMGTPE]?i?B\/s)\s+ETA\s+(\S+)/;

function parseHumanSize(sizeStr: string): number {
  const units: Record<string, number> = {
    B: 1,
    KiB: 1024,
    MiB: 1024 * 1024,
    GiB: 1024 * 1024 * 1024,
    TiB: 1024 * 1024 * 1024 * 1024,
  };
  const match = sizeStr.match(/^([\d.]+)\s*([KMGTPE]?i?B)$/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = match[2];
  return Math.round(num * (units[unit] || 1));
}

export function parseProgressLine(line: string): DownloadProgress | null {
  const match = line.match(DL_PROGRESS_RE);
  if (!match) return null;

  const percent = parseFloat(match[1]);
  const totalStr = match[2];
  const speed = match[3].trim();
  const eta = match[4];

  const totalBytes = parseHumanSize(totalStr);
  const downloadedBytes = Math.round((percent / 100) * totalBytes);

  return { percent, speed, eta, downloadedBytes };
}

// --- Download Arguments ---

export interface DownloadOptions {
  formatId: string;
  formatType: "video" | "audio" | "subtitle" | "cover";
  outputTemplate: string;
  url: string;
  cookiesFile?: string;
  browser?: string;
}

export function buildDownloadArgs(options: DownloadOptions): string[] {
  const args: string[] = [];

  switch (options.formatType) {
    case "video":
      args.push(
        "-f", options.formatId,
        "--merge-output-format", "mp4"
      );
      break;
    case "audio":
      args.push(
        "-f", "ba",
        "-x",
        "--audio-format", "mp3",
        "--audio-quality", "0"
      );
      break;
    case "subtitle":
      args.push(
        "--write-subs",
        "--sub-langs", "all",
        "--skip-download"
      );
      break;
    case "cover":
      args.push(
        "--write-thumbnail",
        "--skip-download"
      );
      break;
  }

  if (options.browser) {
    args.push("--cookies-from-browser", options.browser);
  } else if (options.cookiesFile) {
    const cp = getCookiesPath(options.cookiesFile);
    if (cp) args.push("--cookies", cp);
  }

  args.push(
    "-o", options.outputTemplate,
    "--no-playlist",
    "--newline",
    "--no-colors",
    "--no-part",
    "--restrict-filenames",
    "--no-check-certificate",
    options.url
  );

  return args;
}

// --- Download Execution ---

export interface DownloadCallbacks {
  onProgress?: (progress: DownloadProgress) => void;
  onLog?: (line: string) => void;
}

export function runDownload(
  args: string[],
  callbacks?: DownloadCallbacks
): { process: ChildProcess; promise: Promise<void> } {
  const ytdlpPath = requireYtdlp();

  const proc = spawn(ytdlpPath, args, {
    windowsHide: true,
    stdio: ["ignore", "ignore", "pipe"],
  });

  let cookieWarningFired = false;

  let stderrBuf = "";

  const promise = new Promise<void>((resolve, reject) => {
    let lastLines: string[] = [];

    proc.stderr?.on("data", (chunk: Buffer) => {
      stderrBuf += chunk.toString("utf8");
      const lines = stderrBuf.split(/\r?\n/);
      stderrBuf = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        lastLines.push(line);
        if (lastLines.length > 50) {
          lastLines = lastLines.slice(-50);
        }

        // Detect cookie loading failures during download
        if (!cookieWarningFired && COOKIE_FAIL_RE.test(line)) {
          const clean = line.replace(/^(WARNING|ERROR):\s*/i, "").trim();
          callbacks?.onLog?.(
            `⚠ Cookie 警告: ${clean}。如无法登录，请改用 "导入 cookies.txt" 方式`
          );
          cookieWarningFired = true;
        }

        callbacks?.onLog?.(line);

        const progress = parseProgressLine(line);
        if (progress) {
          callbacks?.onProgress?.(progress);
        }
      }
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        const errorLines = lastLines
          .filter((l) => l.includes("ERROR:") || l.includes("Error:"))
          .slice(-3);
        const msg = errorLines.length > 0
          ? errorLines.join("; ")
          : `下载失败，退出码 ${code}`;
        reject(new Error(msg));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`启动 yt-dlp 失败: ${err.message}`));
    });
  });

  return { process: proc, promise };
}
