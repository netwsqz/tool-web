import { NextRequest, NextResponse } from "next/server";
import { listDownloadedFiles, cleanupAllDownloads } from "@/lib/download/download-storage";

// GET /api/download/files — list downloaded files
export async function GET() {
  const files = listDownloadedFiles();
  return NextResponse.json({ files });
}

// DELETE /api/download/files — bulk cleanup (all files)
export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const all = searchParams.get("all");

  if (all === "true") {
    const count = cleanupAllDownloads();
    return NextResponse.json({ success: true, message: `已清理 ${count} 个文件` });
  }

  return NextResponse.json({ error: "请确认清理操作" }, { status: 400 });
}
