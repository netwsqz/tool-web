export interface ChatMember {
  id: string;
  name: string;
}

export interface ChatRoomInfo {
  id: string;
  name: string;
  memberCount: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  members: ChatMember[];
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  type: "text" | "file";
  senderId: string;
  senderName: string;
  text?: string;
  fileName?: string;
  fileSize?: number;
  url?: string;
  timestamp: number;
  clientMsgId?: string;
  status?: "pending" | "sent";
}

export type ChatPageView = "connect" | "rooms" | "chat";
