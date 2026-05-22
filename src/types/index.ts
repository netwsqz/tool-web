export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  icon: string;       // Lucide icon name (e.g. "FolderOpen")
  path: string;
  status: "active" | "coming-soon";
  category: "file" | "media" | "creative" | "system";
}

export interface FileInfo {
  name: string;
  size: number;
  uploadedAt: string;
}

export interface ObsidianFile {
  name: string;
  path: string;
  title: string;
  size: number;
  updatedAt: string;
}

export interface ObsidianSearchResult {
  file: ObsidianFile;
  matches: string[];
}

export type {
  MediaTaskType,
  TaskStatus,
  MediaTask,
  FfmpegProgress,
  MediaFileInfo,
  MediaTaskConfig,
  MediaMetadata,
} from "./media";

export type {
  DownloadStatus,
  DownloadFormatType,
  DownloadTask,
  VideoFormat,
  SubtitleInfo,
  VideoMetadata,
  ParseRequest,
  ParseResponse,
  DownloadStartRequest,
  DownloadStartResponse,
  TaskStatusResponse,
  DownloadFileInfo,
} from "./download";

export type {
  EverythingRawResult,
  EverythingRawResponse,
  EverythingFileResult,
  EverythingSearchResponse,
  EverythingSortField,
  EverythingSearchParams,
} from "./everything";

export type {
  P2PConnectionStatus,
  P2PPeer,
  P2PTransferItem,
  P2PFileInfoMessage,
  P2PFileCompleteMessage,
  P2PFileCancelMessage,
  P2PDataMessage,
  P2PSignalingMessage,
} from "./p2p";

export type { TodoItem, TodoTag } from "./todo";

export type { QRGeneratorType, WifiConfig, VCardConfig, QRGeneratorState, QRScannerState } from "./qr";
