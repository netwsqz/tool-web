import { NextRequest, NextResponse } from "next/server";
import { parseMetadata } from "@/lib/download/ytdlp";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    url?: string;
    cookiesFile?: string;
    browser?: string;
  };

  if (!body.url || !body.url.trim()) {
    return NextResponse.json({ error: "请输入视频链接" }, { status: 400 });
  }

  try {
    const metadata = await parseMetadata(
      body.url.trim(),
      body.cookiesFile || "",
      body.browser || ""
    );
    return NextResponse.json({ metadata });
  } catch (err) {
    const message = err instanceof Error ? err.message : "视频解析失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
