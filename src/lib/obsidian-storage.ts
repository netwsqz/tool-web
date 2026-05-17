import fs from "fs";
import path from "path";
import type { ObsidianFile, ObsidianSearchResult } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data", "obsidian");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function resolveSafe(relativePath: string): string | null {
  const resolved = path.resolve(DATA_DIR, relativePath);
  if (!resolved.startsWith(DATA_DIR + path.sep) && resolved !== DATA_DIR) {
    return null;
  }
  return resolved;
}

export function listFiles(): ObsidianFile[] {
  ensureDir();
  const entries = fs.readdirSync(DATA_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => {
      const filePath = path.join(DATA_DIR, e.name);
      const stat = fs.statSync(filePath);
      return {
        name: e.name,
        path: e.name,
        title: e.name.replace(/\.md$/, ""),
        size: stat.size,
        updatedAt: stat.mtime.toISOString(),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

export function readFile(
  relativePath: string
): { content: string; file: ObsidianFile } | null {
  ensureDir();
  const safePath = resolveSafe(relativePath);
  if (!safePath || !fs.existsSync(safePath)) return null;

  const content = fs.readFileSync(safePath, "utf-8");
  const stat = fs.statSync(safePath);
  return {
    content,
    file: {
      name: path.basename(safePath),
      path: relativePath,
      title: path.basename(safePath).replace(/\.md$/, ""),
      size: stat.size,
      updatedAt: stat.mtime.toISOString(),
    },
  };
}

export function writeFile(relativePath: string, content: string): ObsidianFile {
  ensureDir();
  const safePath = resolveSafe(relativePath);
  if (!safePath) throw new Error("非法文件路径");

  fs.writeFileSync(safePath, content, "utf-8");
  const stat = fs.statSync(safePath);
  return {
    name: path.basename(safePath),
    path: relativePath,
    title: path.basename(safePath).replace(/\.md$/, ""),
    size: stat.size,
    updatedAt: stat.mtime.toISOString(),
  };
}

export function createFile(name: string): ObsidianFile {
  const sanitized = name.replace(/[<>:"/\\|?*]/g, "").trim();
  if (!sanitized) throw new Error("文件名无效");

  const filename = sanitized.endsWith(".md") ? sanitized : `${sanitized}.md`;

  ensureDir();
  const safePath = resolveSafe(filename);
  if (!safePath) throw new Error("非法文件名");

  if (fs.existsSync(safePath)) throw new Error("文件已存在");

  const title = filename.replace(/\.md$/, "");
  const initialContent = `# ${title}\n\n`;
  fs.writeFileSync(safePath, initialContent, "utf-8");

  const stat = fs.statSync(safePath);
  return {
    name: filename,
    path: filename,
    title,
    size: stat.size,
    updatedAt: stat.mtime.toISOString(),
  };
}

export function deleteFile(relativePath: string): void {
  ensureDir();
  const safePath = resolveSafe(relativePath);
  if (!safePath || !fs.existsSync(safePath)) throw new Error("文件不存在");

  fs.unlinkSync(safePath);
}

export function searchFiles(query: string): ObsidianSearchResult[] {
  ensureDir();
  const files = listFiles();
  const q = query.toLowerCase();
  const results: ObsidianSearchResult[] = [];

  for (const file of files) {
    const safePath = resolveSafe(file.path);
    if (!safePath) continue;

    const content = fs.readFileSync(safePath, "utf-8");
    const lines = content.split("\n");
    const matches: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(q)) {
        matches.push(lines[i].trim().slice(0, 200));
        if (matches.length >= 3) break;
      }
    }

    if (matches.length > 0) {
      results.push({ file, matches });
    }
  }

  return results;
}
