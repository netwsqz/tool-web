import { NextRequest, NextResponse } from "next/server";
import { saveTrack } from "@/lib/music/music-storage";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_STRING_LENGTH = 500;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const audioFile = formData.get("audio") as File | null;
  const metadataStr = formData.get("metadata") as string | null;

  if (!audioFile || !metadataStr) {
    return NextResponse.json({ error: "缺少音频文件或元数据" }, { status: 400 });
  }

  // Validate audio file
  if (audioFile.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "音频文件过大，最大 100MB" }, { status: 400 });
  }
  if (!audioFile.type.startsWith("audio/")) {
    return NextResponse.json({ error: "不支持的文件类型，请上传音频文件" }, { status: 400 });
  }

  let metadata: {
    id: string;
    title: string;
    artist: string;
    album: string;
    format: string;
    duration: number;
    lyrics?: Array<{ time: number; text: string; translation?: string }>;
  };
  try {
    metadata = JSON.parse(metadataStr);
  } catch {
    return NextResponse.json({ error: "元数据格式无效" }, { status: 400 });
  }

  // Validate metadata fields
  if (typeof metadata.id !== "string" || metadata.id.length === 0) {
    return NextResponse.json({ error: "缺少曲目 ID" }, { status: 400 });
  }
  if (typeof metadata.title !== "string" || metadata.title.length > MAX_STRING_LENGTH) {
    return NextResponse.json({ error: "标题无效或过长" }, { status: 400 });
  }
  if (typeof metadata.artist !== "string" || metadata.artist.length > MAX_STRING_LENGTH) {
    return NextResponse.json({ error: "艺术家名称无效或过长" }, { status: 400 });
  }
  if (typeof metadata.album !== "string" || metadata.album.length > MAX_STRING_LENGTH) {
    return NextResponse.json({ error: "专辑名称无效或过长" }, { status: 400 });
  }
  if (typeof metadata.format !== "string" || metadata.format.length > 10) {
    return NextResponse.json({ error: "格式无效" }, { status: 400 });
  }
  if (typeof metadata.duration !== "number" || metadata.duration < 0) {
    return NextResponse.json({ error: "时长无效" }, { status: 400 });
  }
  if (metadata.lyrics !== undefined && !Array.isArray(metadata.lyrics)) {
    return NextResponse.json({ error: "歌词格式无效" }, { status: 400 });
  }

  const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

  let coverBuffer: Buffer | null = null;
  const coverFile = formData.get("cover") as File | null;
  if (coverFile) {
    coverBuffer = Buffer.from(await coverFile.arrayBuffer());
  }

  const saved = await saveTrack(
    metadata.id,
    audioBuffer,
    coverBuffer,
    {
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album,
      format: metadata.format,
      duration: metadata.duration,
    },
    metadata.lyrics ?? [],
  );

  return NextResponse.json({ success: true, track: saved });
}
