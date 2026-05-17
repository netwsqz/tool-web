import { NextRequest, NextResponse } from "next/server";
import { createDownloadTask } from "@/lib/download/download-manager";
import { listDownloadedFiles } from "@/lib/download/download-storage";

// POST /api/download — start a download task
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    url?: string;
    formatId?: string;
    format?: string;
    title?: string;
    platform?: string;
    cookiesFile?: string;
    browser?: string;
  };

  if (!body.url || !body.formatId || !body.format) {
    return NextResponse.json({ error: "缺少必要的参数" }, { status: 400 });
  }

  // Only basic format type validation
  const validFormats = ["video", "audio", "subtitle", "cover"];
  if (!validFormats.includes(body.format)) {
    return NextResponse.json({ error: "无效的下载格式" }, { status: 400 });
  }

  // browser and cookiesFile are mutually exclusive
  if (body.browser && body.cookiesFile) {
    body.cookiesFile = "";
  }

  try {
    const task = createDownloadTask(
      body.url.trim(),
      body.formatId,
      body.format as "video" | "audio" | "subtitle" | "cover",
      body.title || "未命名",
      body.platform || "unknown",
      body.cookiesFile || "",
      body.browser || ""
    );
    return NextResponse.json({ success: true, task });
  } catch (err) {
    const message = err instanceof Error ? err.message : "任务创建失败";
    const status = message.includes("正在运行") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// GET /api/download — list downloaded files
export async function GET() {
  const files = listDownloadedFiles();
  return NextResponse.json({ files });
}
