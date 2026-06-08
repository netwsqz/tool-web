export type P2PConnectionStatus =
  | "idle"
  | "creating-room"
  | "joining-room"
  | "waiting-peer"
  | "connecting"
  | "connected"
  | "disconnected";

export interface P2PPeer {
  id: string;
  name: string;
}

export interface P2PTransferItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  direction: "send" | "receive";
  progress: number; // 0–100
  speed: number; // bytes/sec
  eta: number; // seconds remaining
  status: "pending" | "transferring" | "completed" | "failed" | "cancelled";
  error?: string;
}

// DataChannel protocol types (JSON control messages)
export interface P2PFileInfoMessage {
  type: "file-info";
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  totalChunks: number;
}

export interface P2PFileCompleteMessage {
  type: "file-complete";
  fileId: string;
}

export interface P2PFileCancelMessage {
  type: "file-cancel";
  fileId: string;
  reason?: string;
}

export type P2PDataMessage =
  | P2PFileInfoMessage
  | P2PFileCompleteMessage
  | P2PFileCancelMessage;

// Signaling protocol
export interface P2PSignalingMessage {
  type: string;
  [key: string]: unknown;
}
