import { NextRequest, NextResponse } from "next/server";
import { saveCookiesFile, getStoredCookiesFile } from "@/lib/download/download-storage";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请选择 cookies.txt 文件" }, { status: 400 });
    }

    if (!file.name.endsWith(".txt")) {
      return NextResponse.json({ error: "仅支持 .txt 格式的 Cookie 文件" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0) {
      return NextResponse.json({ error: "文件为空" }, { status: 400 });
    }

    const result = saveCookiesFile(buffer, file.name);

    // Check for no-bilibili-cookies warning
    const hasWarning = result.endsWith(":no-bilibili-cookies");
    const filename = hasWarning ? result.replace(":no-bilibili-cookies", "") : result;

    if (hasWarning) {
      return NextResponse.json({
        success: true,
        filename,
        warning: "文件中未找到 Bilibili 相关 Cookie，请先在 Bilibili 登录后再导出",
      });
    }

    return NextResponse.json({ success: true, filename });
  } catch (err) {
    const message = err instanceof Error ? err.message : "上传失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const filename = getStoredCookiesFile();
  return NextResponse.json({ filename });
}
