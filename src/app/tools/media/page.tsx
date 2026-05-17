"use client";

import { Clapperboard } from "lucide-react";
import { ToolLayout } from "@/components/ui/ToolLayout";
import { MediaLayout } from "@/components/media/MediaLayout";

export default function MediaPage() {
  return (
    <ToolLayout
      title="媒体工具"
      description="视频音频处理 · 基于 FFmpeg · 本地运行"
      icon={Clapperboard}
      maxWidth="full"
    >
      <MediaLayout />
    </ToolLayout>
  );
}
