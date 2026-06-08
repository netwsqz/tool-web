"use client";

import { useState } from "react";
import { useMediaTask } from "@/hooks/useMediaTask";
import { MediaTabButton } from "./MediaTabButton";
import { VideoAudioMerge } from "./VideoAudioMerge";
import { SubtitleMerge } from "./SubtitleMerge";
import { VideoProcessing } from "./VideoProcessing";
import { TaskProgress } from "./TaskProgress";

const TABS = [
  { id: "merge", label: "音视频合并" },
  { id: "subtitle", label: "字幕合并" },
  { id: "process", label: "视频处理" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function MediaLayout() {
  const [activeTab, setActiveTab] = useState<TabId>("merge");
  const { activeTask, isProcessing, error, uploadFile, startTask, cancelTask, clearTask, setError } =
    useMediaTask();

  const getDownloadUrl = () => {
    if (activeTask?.outputFile) {
      return `/api/media/output/${encodeURIComponent(activeTask.outputFile)}`;
    }
    return "#";
  };

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div role="alert" className="glass rounded-2xl p-4 border border-[var(--color-destructive)]/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-destructive)]">{error}</span>
            <button
              onClick={() => setError(null)}
              aria-label="关闭错误"
              className="text-[var(--color-destructive)]/60 hover:text-[var(--color-destructive)] text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2" role="tablist">
        {TABS.map((tab) => (
          <MediaTabButton
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </MediaTabButton>
        ))}
      </div>

      {/* Task progress (shown above form when task exists) */}
      {activeTask && (
        <TaskProgress
          task={activeTask}
          onCancel={cancelTask}
          onDownload={getDownloadUrl}
          onClear={clearTask}
        />
      )}

      {/* Tab content */}
      <div className="glass rounded-3xl p-6">
        {activeTab === "merge" && (
          <VideoAudioMerge
            onStart={startTask}
            onUpload={uploadFile}
            disabled={isProcessing}
          />
        )}
        {activeTab === "subtitle" && (
          <SubtitleMerge
            onStart={startTask}
            onUpload={uploadFile}
            disabled={isProcessing}
          />
        )}
        {activeTab === "process" && (
          <VideoProcessing
            onStart={startTask}
            onUpload={uploadFile}
            disabled={isProcessing}
          />
        )}
      </div>
    </div>
  );
}
