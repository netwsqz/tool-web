import { NextResponse } from "next/server";
import { getSystemStats } from "@/lib/system/system-monitor";

export async function GET() {
  try {
    const stats = getSystemStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error("System stats error:", err);
    return NextResponse.json(
      { error: "获取系统信息失败" },
      { status: 500 }
    );
  }
}
