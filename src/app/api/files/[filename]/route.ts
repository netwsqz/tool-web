import { NextRequest, NextResponse } from "next/server";
import { getFilePath } from "@/lib/storage";
import fs from "fs";
import path from "path";

// GET /api/files/[filename] — 下载单个文件
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const filePath = getFilePath(decodeURIComponent(filename));

  if (!filePath) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filename).toLowerCase();

  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".mp4": "video/mp4",
    ".zip": "application/zip",
    ".txt": "text/plain",
    ".json": "application/json",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
  };

  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Length": String(stat.size),
    },
  });
}
