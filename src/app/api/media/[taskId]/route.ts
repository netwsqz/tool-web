import { NextRequest, NextResponse } from "next/server";
import { getTask, cancelTask } from "@/lib/media/task-manager";

// GET /api/media/[taskId] — get task status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const task = getTask(taskId);

  if (!task) {
    return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  }

  return NextResponse.json({ task });
}

// DELETE /api/media/[taskId] — cancel a running task
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const cancelled = cancelTask(taskId);

  if (!cancelled) {
    return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "任务已取消" });
}
