"use client";

import { Download } from "lucide-react";
import { ToolLayout } from "@/components/ui/ToolLayout";
import { DownloadLayout } from "@/components/download/DownloadLayout";

export default function BilibiliDownloadPage() {
  return (
    <ToolLayout
      title="视频下载"
      description="视频解析下载 · yt-dlp 引擎"
      icon={Download}
      maxWidth="lg"
    >
      <DownloadLayout />
    </ToolLayout>
  );
}
