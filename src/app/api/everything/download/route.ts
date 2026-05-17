import { NextResponse } from "next/server";
import { fetchFileStream } from "@/lib/everything/everything-client";
import path from "node:path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filepath = searchParams.get("filepath");
    if (!filepath) {
      return NextResponse.json({ error: "缺少 filepath 参数" }, { status: 400 });
    }

    const upstream = await fetchFileStream(filepath);

    if (!upstream.body) {
      return NextResponse.json({ error: "文件内容为空" }, { status: 500 });
    }

    const filename = path.basename(filepath);
    const contentLength = upstream.headers.get("content-length");

    const headers: Record<string, string> = {
      "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    };
    if (contentLength) {
      headers["Content-Length"] = contentLength;
    }

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (err) {
    console.error("Everything download error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "下载失败" },
      { status: 500 }
    );
  }
}
