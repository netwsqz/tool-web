import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import {
  getDownloadFileStats,
  removeDownloadFile,
} from "@/lib/download/download-storage";

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".srt": "text/plain",
  ".ass": "text/plain",
  ".vtt": "text/vtt",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

// GET /api/download/files/[filename] — download a file
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const decoded = decodeURIComponent(filename);
  const stats = getDownloadFileStats(decoded);

  if (!stats) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  const ext = "." + decoded.split(".").pop()?.toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  const fileBuffer = fs.readFileSync(stats.path);
  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(decoded)}`,
      "Content-Length": String(stats.size),
    },
  });
}

// DELETE /api/download/files/[filename] — delete a single file
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const decoded = decodeURIComponent(filename);
  const removed = removeDownloadFile(decoded);

  if (!removed) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "文件已删除" });
}
