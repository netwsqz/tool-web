import { NextRequest, NextResponse } from "next/server";
import { listFiles, saveFile } from "@/lib/storage";

// GET /api/files — 列出所有文件
export async function GET() {
  const files = listFiles();
  return NextResponse.json(files);
}

// POST /api/files — 上传文件
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "请选择文件" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = file.name || "unnamed";

  saveFile(buffer, filename);

  return NextResponse.json({ success: true, filename });
}
