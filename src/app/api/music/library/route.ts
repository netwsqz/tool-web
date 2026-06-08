import { NextRequest, NextResponse } from "next/server";
import { getLibrary, deleteTrack } from "@/lib/music/music-storage";

export async function GET() {
  const library = await getLibrary();
  return NextResponse.json(library);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "缺少 id 参数" }, { status: 400 });
  }

  const deleted = await deleteTrack(id);
  if (!deleted) {
    return NextResponse.json({ error: "未找到该曲目" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
