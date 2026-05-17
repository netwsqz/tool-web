import { NextRequest, NextResponse } from "next/server";
import {
  getDownloadTask,
  cancelDownloadTask,
} from "@/lib/download/download-manager";

// GET /api/download/[taskId] — poll task status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const task = getDownloadTask(taskId);

  if (!task) {
    return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  }

  return NextResponse.json({ task });
}

// DELETE /api/download/[taskId] — cancel a running task
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const cancelled = cancelDownloadTask(taskId);

  if (!cancelled) {
    return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "任务已取消" });
}
