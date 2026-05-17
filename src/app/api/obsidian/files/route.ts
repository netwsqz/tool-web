import { NextRequest, NextResponse } from "next/server";
import {
  listFiles,
  readFile,
  writeFile,
  createFile,
  deleteFile,
} from "@/lib/obsidian-storage";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (path) {
    const result = readFile(path);
    if (!result) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }
    return NextResponse.json(result);
  }

  const files = listFiles();
  return NextResponse.json(files);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "请提供文件名" }, { status: 400 });
  }

  try {
    const file = createFile(name);
    return NextResponse.json(file, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "创建失败";
    const status = message === "文件已存在" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { path: filePath, content } = body;

  if (!filePath || content === undefined) {
    return NextResponse.json(
      { error: "缺少 path 或 content" },
      { status: 400 }
    );
  }

  try {
    const file = writeFile(filePath, content);
    return NextResponse.json(file);
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "请提供文件路径" }, { status: 400 });
  }

  try {
    deleteFile(path);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
