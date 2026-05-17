import { NextRequest, NextResponse } from "next/server";
import { saveChatFile } from "@/lib/chat/storage";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "请选择文件" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = saveChatFile(buffer, file.name);

  return NextResponse.json({
    success: true,
    url,
    fileName: file.name,
    fileSize: file.size,
  });
}
