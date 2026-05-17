import fs from "fs";
import path from "path";
import type { MediaFileInfo } from "@/types";

const BASE_DIR = path.join(process.cwd(), "public", "uploads", "media");
const INPUTS_DIR = path.join(BASE_DIR, "inputs");
const OUTPUTS_DIR = path.join(BASE_DIR, "outputs");
const TEMP_DIR = path.join(BASE_DIR, "temp");

export function ensureDirectories() {
  for (const dir of [INPUTS_DIR, OUTPUTS_DIR, TEMP_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

function resolveSafe(baseDir: string, filename: string): string | null {
  const resolved = path.resolve(baseDir, filename);
  if (!resolved.startsWith(baseDir + path.sep) && resolved !== baseDir) {
    return null;
  }
  return resolved;
}

function sanitizeFilename(name: string): string {
  let safe = name.replace(/[<>:"/\\|?*]/g, "_");
  safe = safe.replace(/\s+/g, "_");
  if (safe.length > 200) {
    const ext = path.extname(safe);
    safe = safe.slice(0, 200 - ext.length) + ext;
  }
  return safe;
}

// --- Input ---

export function saveInput(buffer: Buffer, filename: string): MediaFileInfo {
  ensureDirectories();
  const safe = sanitizeFilename(filename);
  const filePath = resolveSafe(INPUTS_DIR, safe);
  if (!filePath) throw new Error("非法文件名");

  fs.writeFileSync(filePath, buffer);
  const stat = fs.statSync(filePath);
  return {
    filename: safe,
    size: stat.size,
    uploadedAt: stat.mtime.toISOString(),
  };
}

export function listInputs(): MediaFileInfo[] {
  ensureDirectories();
  return fs
    .readdirSync(INPUTS_DIR)
    .filter((f) => fs.statSync(path.join(INPUTS_DIR, f)).isFile())
    .map((f) => {
      const stat = fs.statSync(path.join(INPUTS_DIR, f));
      return { filename: f, size: stat.size, uploadedAt: stat.mtime.toISOString() };
    });
}

export function getInputPath(filename: string): string | null {
  ensureDirectories();
  const safePath = resolveSafe(INPUTS_DIR, filename);
  if (!safePath || !fs.existsSync(safePath)) return null;
  return safePath;
}

export function removeInput(filename: string): void {
  const safePath = resolveSafe(INPUTS_DIR, filename);
  if (safePath && fs.existsSync(safePath)) {
    fs.unlinkSync(safePath);
  }
}

// --- Output ---

export function generateOutputFilename(taskId: string, ext: string): string {
  return `${taskId}_${Date.now()}.${ext.replace(/^\./, "")}`;
}

export function saveOutput(
  sourcePath: string,
  filename: string
): MediaFileInfo {
  ensureDirectories();
  const safe = sanitizeFilename(filename);
  const destPath = resolveSafe(OUTPUTS_DIR, safe);
  if (!destPath) throw new Error("非法文件名");

  fs.copyFileSync(sourcePath, destPath);
  const stat = fs.statSync(destPath);
  return {
    filename: safe,
    size: stat.size,
    uploadedAt: stat.mtime.toISOString(),
  };
}

export function listOutputs(): MediaFileInfo[] {
  ensureDirectories();
  return fs
    .readdirSync(OUTPUTS_DIR)
    .filter((f) => fs.statSync(path.join(OUTPUTS_DIR, f)).isFile())
    .map((f) => {
      const stat = fs.statSync(path.join(OUTPUTS_DIR, f));
      return { filename: f, size: stat.size, uploadedAt: stat.mtime.toISOString() };
    });
}

export function getOutputFileStats(
  filename: string
): { path: string; size: number } | null {
  ensureDirectories();
  const safePath = resolveSafe(OUTPUTS_DIR, filename);
  if (!safePath || !fs.existsSync(safePath)) return null;
  const stat = fs.statSync(safePath);
  return { path: safePath, size: stat.size };
}

// --- Temp ---

export function getTempPath(filename: string): string {
  ensureDirectories();
  const safe = sanitizeFilename(filename);
  return path.join(TEMP_DIR, safe);
}

export function cleanupTemp(): void {
  ensureDirectories();
  for (const f of fs.readdirSync(TEMP_DIR)) {
    const fp = path.join(TEMP_DIR, f);
    if (fs.statSync(fp).isFile()) fs.unlinkSync(fp);
  }
}

// --- Cleanup ---

export function cleanupTaskFiles(inputFilenames: string[]): void {
  for (const f of inputFilenames) {
    removeInput(f);
  }
  cleanupTemp();
}
