import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getOutputFileStats } from "@/lib/media/media-storage";

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".avi": "video/x-msvideo",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".srt": "text/plain",
  ".ass": "text/plain",
};

// GET /api/media/output/[filename] — download output file
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const decoded = decodeURIComponent(filename);
  const stats = getOutputFileStats(decoded);

  if (!stats) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  const ext = path.extname(decoded).toLowerCase();
  const fileBuffer = fs.readFileSync(stats.path);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(decoded)}`,
      "Content-Length": String(stats.size),
    },
  });
}
