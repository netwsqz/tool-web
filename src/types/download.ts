export type DownloadStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type DownloadFormatType = "video" | "audio" | "subtitle" | "cover";

export interface DownloadTask {
  id: string;
  status: DownloadStatus;
  progress: number;
  speed: string;
  eta: string;
  totalSize: number;
  downloadedSize: number;
  outputFile: string;
  format: DownloadFormatType;
  platform: string;
  url: string;
  title: string;
  logs: string[];
  error?: string;
  startedAt: number;
  completedAt?: number;
}

export interface VideoFormat {
  formatId: string;
  ext: string;
  resolution: string;
  width?: number;
  height?: number;
  filesize: number;
  filesizeText: string;
  formatNote: string;
  vcodec: string;
  acodec: string;
  tbr: number;
}

export interface SubtitleInfo {
  ext: string;
  url: string;
  name?: string;
}

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  durationString: string;
  uploader: string;
  uploaderUrl?: string;
  viewCount?: number;
  likeCount?: number;
  formats: VideoFormat[];
  subtitles: Record<string, SubtitleInfo[]>;
  platform: string;
  cookieStatus?: "ok" | "none" | "failed";
  cookieWarning?: string;
}

export interface ParseRequest {
  url: string;
}

export interface ParseResponse {
  metadata: VideoMetadata;
}

export interface DownloadStartRequest {
  url: string;
  formatId: string;
  format: DownloadFormatType;
}

export interface DownloadStartResponse {
  task: DownloadTask;
}

export interface TaskStatusResponse {
  task: DownloadTask;
}

export interface DownloadFileInfo {
  filename: string;
  size: number;
  downloadedAt: string;
  platform: string;
  url: string;
  title: string;
}
