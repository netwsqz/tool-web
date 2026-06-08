import { NextRequest, NextResponse } from "next/server";
import { getFilePath } from "@/lib/storage";
import fs from "fs";
import path from "path";

// GET /api/files/[filename]/content — 读取文本文件内容（用于预览）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const decoded = decodeURIComponent(filename);
  const filePath = getFilePath(decoded);

  if (!filePath) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  const ext = path.extname(decoded).toLowerCase();
  const textExtensions = new Set([
    ".txt", ".md", ".json", ".js", ".ts", ".jsx", ".tsx",
    ".css", ".scss", ".html", ".xml", ".yaml", ".yml",
    ".sh", ".bat", ".ps1", ".env", ".cfg", ".ini", ".log",
    ".py", ".rb", ".java", ".go", ".rs", ".c", ".cpp", ".h",
    ".sql", ".php", ".swift", ".kt", ".dart", ".toml",
  ]);

  if (!textExtensions.has(ext)) {
    return NextResponse.json({ error: "不支持预览该文件类型" }, { status: 400 });
  }

  const content = fs.readFileSync(filePath, "utf-8");

  return NextResponse.json({ content });
}
