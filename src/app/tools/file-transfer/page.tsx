"use client";

import { useEffect } from "react";
import { Upload } from "lucide-react";
import { ToolLayout } from "@/components/ui/ToolLayout";
import { FileDropZone } from "@/components/file-transfer/FileDropZone";
import { FileList } from "@/components/file-transfer/FileList";
import { FilePreviewDrawer } from "@/components/file-transfer/FilePreviewDrawer";
import { useFileTransfer } from "@/hooks/useFileTransfer";

export default function FileTransferPage() {
  const {
    files,
    loading,
    fetchFiles,
    previewFile,
    isPreviewOpen,
    openPreview,
    closePreview,
  } = useFileTransfer();

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
      <FileList files={files} loading={loading} onPreview={openPreview} />
      <FilePreviewDrawer
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={closePreview}
      />
    </ToolLayout>
  );
}
