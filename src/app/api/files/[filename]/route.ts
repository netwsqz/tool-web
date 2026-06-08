import { NextRequest, NextResponse } from "next/server";
import { getFilePath } from "@/lib/storage";
import fs from "fs";
import path from "path";

const mimeTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
  ".m4a": "audio/mp4",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".zip": "application/zip",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

// GET /api/files/[filename] — 下载或内联预览单个文件
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const decoded = decodeURIComponent(filename);
  const filePath = getFilePath(decoded);

  if (!filePath) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(decoded).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";

  // 根据 Accept 头或查询参数决定 disposition
  const disposition = request.nextUrl.searchParams.get("disposition") || "attachment";
  const safeName = encodeURIComponent(decoded);

  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${disposition}; filename*=UTF-8''${safeName}`,
      "Content-Length": String(stat.size),
    },
  });
}
