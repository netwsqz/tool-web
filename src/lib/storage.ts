import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// 确保上传目录存在
function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export interface FileInfo {
  name: string;
  size: number;
  uploadedAt: string;
}

export function listFiles(): FileInfo[] {
  ensureUploadDir();
  const files = fs.readdirSync(UPLOAD_DIR, { withFileTypes: true });
  return files
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const filePath = path.join(UPLOAD_DIR, entry.name);
      const stat = fs.statSync(filePath);
      return {
        name: entry.name,
        size: stat.size,
        uploadedAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

export function saveFile(buffer: Buffer, filename: string): void {
  ensureUploadDir();
  // 安全检查：防止路径穿越
  const sanitized = path.basename(filename);
  if (!sanitized || sanitized !== filename) {
    throw new Error("文件名包含非法字符");
  }
  fs.writeFileSync(path.join(UPLOAD_DIR, sanitized), buffer);
}

export function getFilePath(filename: string): string | null {
  const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  // 安全检查：防止路径穿越
  const resolved = path.resolve(filePath);
  const resolvedBase = path.resolve(UPLOAD_DIR);
  if (!resolved.startsWith(resolvedBase)) return null;
  return filePath;
}

