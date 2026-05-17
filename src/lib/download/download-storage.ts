import fs from "fs";
import path from "path";
import type { DownloadFileInfo } from "@/types";

const DOWNLOADS_DIR = path.join(process.cwd(), "public", "downloads");
const COOKIES_DIR = path.join(process.cwd(), "data", "cookies");

export function ensureDirectories() {
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  }
}

function resolveSafe(baseDir: string, filename: string): string | null {
  const resolved = path.resolve(baseDir, filename);
  if (!resolved.startsWith(baseDir + path.sep) && resolved !== baseDir) {
    return null;
  }
  return resolved;
}

export function sanitizeFilename(name: string): string {
  let safe = name.replace(/[<>:"/\\|?*]/g, "_");
  safe = safe.replace(/\s+/g, "_");
  if (safe.length > 200) {
    const ext = path.extname(safe);
    safe = safe.slice(0, 200 - ext.length) + ext;
  }
  return safe;
}

export function getDownloadsDir(): string {
  ensureDirectories();
  return DOWNLOADS_DIR;
}

export function getDownloadPath(filename: string): string {
  ensureDirectories();
  return path.join(DOWNLOADS_DIR, sanitizeFilename(filename));
}

export function renameDownload(
  oldPath: string,
  newFilename: string
): string {
  ensureDirectories();
  const safe = sanitizeFilename(newFilename);
  const destPath = path.join(DOWNLOADS_DIR, safe);
  if (fs.existsSync(destPath)) {
    const ext = path.extname(safe);
    const base = path.basename(safe, ext);
    const renamed = `${base}_${Date.now()}${ext}`;
    const renamedPath = path.join(DOWNLOADS_DIR, renamed);
    fs.renameSync(oldPath, renamedPath);
    return renamed;
  }
  fs.renameSync(oldPath, destPath);
  return safe;
}

export function listDownloadedFiles(): DownloadFileInfo[] {
  ensureDirectories();
  return fs
    .readdirSync(DOWNLOADS_DIR)
    .filter((f) => {
      const fp = path.join(DOWNLOADS_DIR, f);
      return fs.statSync(fp).isFile();
    })
    .map((f) => {
      const fp = path.join(DOWNLOADS_DIR, f);
      const stat = fs.statSync(fp);
      const meta = getDownloadMeta(f);
      return {
        filename: f,
        size: stat.size,
        downloadedAt: stat.mtime.toISOString(),
        platform: meta?.platform || "",
        url: meta?.url || "",
        title: meta?.title || "",
      };
    })
    .sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime());
}

export function getDownloadFileStats(
  filename: string
): { path: string; size: number } | null {
  ensureDirectories();
  const safePath = resolveSafe(DOWNLOADS_DIR, filename);
  if (!safePath || !fs.existsSync(safePath)) return null;
  const stat = fs.statSync(safePath);
  return { path: safePath, size: stat.size };
}

// --- Metadata persistence ---

const METADATA_DIR = path.join(DOWNLOADS_DIR, ".meta");

function ensureMetaDir() {
  if (!fs.existsSync(METADATA_DIR)) {
    fs.mkdirSync(METADATA_DIR, { recursive: true });
  }
}

export function saveDownloadMeta(
  filename: string,
  meta: { title: string; platform: string; url: string }
): void {
  ensureMetaDir();
  const metaPath = path.join(METADATA_DIR, `${filename}.json`);
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");
}

export function getDownloadMeta(
  filename: string
): { title: string; platform: string; url: string } | null {
  ensureMetaDir();
  const metaPath = path.join(METADATA_DIR, `${filename}.json`);
  if (!fs.existsSync(metaPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  } catch {
    return null;
  }
}

export function removeDownloadFile(filename: string): boolean {
  ensureDirectories();
  const safePath = resolveSafe(DOWNLOADS_DIR, filename);
  if (!safePath || !fs.existsSync(safePath)) return false;
  fs.unlinkSync(safePath);

  // Clean up associated metadata
  const metaPath = path.join(METADATA_DIR, `${filename}.json`);
  if (fs.existsSync(metaPath)) {
    try { fs.unlinkSync(metaPath); } catch { /* best-effort */ }
  }

  return true;
}

export function cleanupAllDownloads(): number {
  ensureDirectories();
  let count = 0;
  for (const f of fs.readdirSync(DOWNLOADS_DIR)) {
    if (f === ".meta") continue;
    const fp = path.join(DOWNLOADS_DIR, f);
    if (fs.statSync(fp).isFile()) {
      fs.unlinkSync(fp);
      count++;
    }
  }
  // Clean metadata directory
  if (fs.existsSync(METADATA_DIR)) {
    for (const f of fs.readdirSync(METADATA_DIR)) {
      try { fs.unlinkSync(path.join(METADATA_DIR, f)); } catch { /* best-effort */ }
    }
  }
  return count;
}

// --- Cookies ---

export function ensureCookiesDir() {
  if (!fs.existsSync(COOKIES_DIR)) {
    fs.mkdirSync(COOKIES_DIR, { recursive: true });
  }
}

export function saveCookiesFile(buffer: Buffer, filename: string): string {
  ensureCookiesDir();
  const safe = sanitizeFilename(filename);

  // Filter and validate cookies: keep only Bilibili-related lines, skip malformed ones
  const raw = buffer.toString("utf-8");
  const lines = raw.split(/\r?\n/);
  const filtered: string[] = [];
  let keptHeader = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Keep header lines
    if (trimmed.startsWith("#") || trimmed.startsWith("//")) {
      if (!keptHeader) {
        filtered.push(trimmed);
        keptHeader = true;
      }
      continue;
    }

    if (!trimmed) continue;

    // Filter: only keep bilibili-related domains
    if (
      !trimmed.includes("bilibili.com") &&
      !trimmed.includes("bilibili") &&
      !trimmed.includes("bilivideo.com") &&
      !trimmed.includes("biligame.com")
    ) {
      continue;
    }

    // Validate Netscape format: 7 tab-separated fields
    const fields = trimmed.split("\t");
    if (fields.length < 7) continue; // skip malformed lines
    if (!fields[0] || !fields[5]) continue; // need domain and name

    // Fix domain_flag (2nd field): Python 3.13+ http.cookiejar asserts
    // domain_specified == initial_dot. If domain starts with '.', flag must be TRUE.
    const initialDot = fields[0].startsWith(".");
    fields[1] = initialDot ? "TRUE" : "FALSE";

    filtered.push(fields.join("\t"));
  }

  // Only keep the latest cookie file
  const existing = fs.readdirSync(COOKIES_DIR).filter((f) => f.endsWith(".txt"));
  for (const f of existing) {
    try { fs.unlinkSync(path.join(COOKIES_DIR, f)); } catch { /* best-effort */ }
  }

  // If no bilibili cookies found, warn via returned filename
  if (filtered.length <= 1) {
    const filePath = path.join(COOKIES_DIR, safe);
    fs.writeFileSync(filePath, buffer);
    return safe + ":no-bilibili-cookies";
  }

  const filePath = path.join(COOKIES_DIR, safe);
  fs.writeFileSync(filePath, filtered.join("\n"), "utf-8");
  return safe;
}

export function getCookiesPath(filename: string): string | null {
  ensureCookiesDir();
  const filePath = path.join(COOKIES_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  return filePath;
}

export function getStoredCookiesFile(): string | null {
  ensureCookiesDir();
  const files = fs.readdirSync(COOKIES_DIR).filter((f) => f.endsWith(".txt"));
  return files.length > 0 ? files[0] : null;
}
