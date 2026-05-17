import { NextRequest, NextResponse } from "next/server";
import { saveInput } from "@/lib/media/media-storage";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "请选择文件" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "文件为空" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const info = saveInput(buffer, file.name);
    return NextResponse.json({ success: true, file: info });
  } catch {
    return NextResponse.json({ error: "文件上传失败" }, { status: 500 });
  }
}
