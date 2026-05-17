import { NextRequest, NextResponse } from "next/server";
import { createTask } from "@/lib/media/task-manager";
import { listOutputs } from "@/lib/media/media-storage";
import type { MediaTaskConfig, MediaTaskType } from "@/types";

const VALID_TYPES: MediaTaskType[] = [
  "video-audio-merge",
  "subtitle-merge",
  "volume-adjust",
  "crop",
  "transcode",
  "extract-audio",
];

const REQUIRED_INPUTS: Record<MediaTaskType, string[]> = {
  "video-audio-merge": ["video", "audio"],
  "subtitle-merge": ["video", "subtitle"],
  "volume-adjust": ["video"],
  crop: ["video"],
  transcode: ["video"],
  "extract-audio": ["video"],
};

// POST /api/media — start a processing task
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Partial<MediaTaskConfig>;

  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: "无效的任务类型" }, { status: 400 });
  }

  const type = body.type;
  const required = REQUIRED_INPUTS[type];
  const missing = required.filter((k) => !body.inputs?.[k]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `缺少输入文件: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const task = createTask({
      type,
      inputs: body.inputs || {},
      options: body.options || {},
    });
    return NextResponse.json({ success: true, task });
  } catch (err) {
    const message = err instanceof Error ? err.message : "任务创建失败";
    const status = message.includes("正在运行") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// GET /api/media — list output files
export async function GET() {
  const outputs = listOutputs();
  return NextResponse.json({ outputs });
}
