"use client";

import { useCallback, useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { ToolLayout } from "@/components/ui/ToolLayout";
import { FileDropZone } from "@/components/file-transfer/FileDropZone";
import { FileList } from "@/components/file-transfer/FileList";
import type { FileInfo } from "@/lib/storage";

export default function FileTransferPage() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    const res = await fetch("/api/files");
    if (res.ok) {
      setFiles(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return (
    <ToolLayout
      title="文件快传"
      description="上传文件到本地 · 局域网设备可访问"
      icon={Upload}
      maxWidth="md"
    >
      <div className="mb-8">
        <FileDropZone onUploaded={fetchFiles} />
      </div>
      <FileList files={files} loading={loading} />
    </ToolLayout>
  );
}
