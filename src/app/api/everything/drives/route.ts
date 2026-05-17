import { NextResponse } from "next/server";
import { getDrives } from "@/lib/everything/everything-client";

export async function GET() {
  try {
    const data = await getDrives();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Everything drives error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "获取磁盘列表失败" },
      { status: 500 }
    );
  }
}
