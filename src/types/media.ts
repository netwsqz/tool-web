export type MediaTaskType =
  | "video-audio-merge"
  | "subtitle-merge"
  | "volume-adjust"
  | "crop"
  | "transcode"
  | "extract-audio";

export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface MediaTask {
  id: string;
  type: MediaTaskType;
  status: TaskStatus;
  progress: number;
  fps: number;
  speed: number;
  time: string;
  inputFiles: string[];
  outputFile: string;
  logs: string[];
  error?: string;
  startedAt: number;
  completedAt?: number;
}

export interface FfmpegProgress {
  frame: number;
  fps: number;
  speed: number;
  time: string;
  percent: number;
}

export interface MediaFileInfo {
  filename: string;
  size: number;
  uploadedAt: string;
}

export interface MediaTaskConfig {
  type: MediaTaskType;
  inputs: Record<string, string>;
  options: Record<string, unknown>;
}

export interface MediaMetadata {
  duration: number;
  width?: number;
  height?: number;
  hasVideo: boolean;
  hasAudio: boolean;
  streams: Array<{
    index: number;
    codec_type: string;
    codec_name: string;
    width?: number;
    height?: number;
  }>;
}
