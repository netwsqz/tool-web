# 局域网群聊模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a LAN-based multi-room group chat with file sharing to the toolbox.

**Architecture:** Reuse existing WebSocket pattern (ws library), run a dedicated chat server on port 3002, client auto-connects via `window.location.hostname`. Files uploaded via Next.js API route, URLs shared via WS broadcast. No persistence.

**Tech Stack:** Next.js 15 App Router, TypeScript, ws library, Tailwind CSS v4

---

### Task 1: Chat Server (`server/chat-server.mjs`)

**Files:**
- Create: `server/chat-server.mjs`

Dedicated WS server port 3002. In-memory rooms, no persistence. Auto-creates "大厅" room on start. Each room holds up to 200 messages.

```javascript
/**
 * 局域网群聊 — WebSocket 聊天服务器
 * Usage: node server/chat-server.mjs [port]
 * Default port: 3002
 */

import { createServer } from "http";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { WebSocketServer, WebSocket } = require("ws");

const MAX_MESSAGES = 200;
const ROOM_CLEANUP_DELAY = 5 * 60 * 1000; // 5 min

// ─── State ──────────────────────────────────────────────────
const rooms = new Map(); // roomId -> { id, name, members[], messages[], createdAt }
const memberSockets = new Map(); // memberId -> ws
const roomCleanupTimers = new Map(); // roomId -> setTimeout

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// ─── Room management ───────────────────────────────────────
function createRoom(name) {
  const room = {
    id: generateId(),
    name,
    members: [],
    messages: [],
    createdAt: Date.now(),
  };
  rooms.set(room.id, room);
  return room;
}

function deleteRoom(roomId) {
  rooms.delete(roomId);
  const timer = roomCleanupTimers.get(roomId);
  if (timer) clearTimeout(timer);
  roomCleanupTimers.delete(roomId);
}

function scheduleCleanup(roomId) {
  const existing = roomCleanupTimers.get(roomId);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    const room = rooms.get(roomId);
    if (room && room.members.length === 0) {
      deleteRoom(roomId);
    }
  }, ROOM_CLEANUP_DELAY);
  roomCleanupTimers.set(roomId, timer);
}

function addMessage(roomId, msg) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.messages.push(msg);
  if (room.messages.length > MAX_MESSAGES) {
    room.messages = room.messages.slice(-MAX_MESSAGES);
  }
}

function roomList() {
  const list = [];
  for (const [, room] of rooms) {
    list.push({ id: room.id, name: room.name, memberCount: room.members.length });
  }
  return list;
}

// ─── WebSocket helpers ──────────────────────────────────────
function send(memberId, msg) {
  const ws = memberSockets.get(memberId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(roomId, msg, excludeMemberId) {
  const room = rooms.get(roomId);
  if (!room) return;
  for (const m of room.members) {
    if (m.id !== excludeMemberId) {
      send(m.id, msg);
    }
  }
}

function broadcastRoomList() {
  const list = roomList();
  for (const [, room] of rooms) {
    for (const m of room.members) {
      send(m.id, { type: "room-list", rooms: list });
    }
  }
}

// ─── Init default room ──────────────────────────────────────
createRoom("大厅");

// ─── HTTP health check ──────────────────────────────────────
const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
    return;
  }
  res.writeHead(404);
  res.end();
});

// ─── WebSocket Server ──────────────────────────────────────
const PORT = parseInt(process.argv[2], 10) || 3002;
const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws) => {
  let memberId = null;
  let currentRoomId = null;
  let memberName = "";

  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case "join-room": {
        const { roomId, nickname } = msg;
        if (!roomId || !nickname) {
          ws.send(JSON.stringify({ type: "error", message: "缺少房间号或昵称" }));
          return;
        }

        const room = rooms.get(roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: "error", message: "房间不存在" }));
          return;
        }

        // Check name uniqueness
        if (room.members.some((m) => m.name === nickname)) {
          ws.send(JSON.stringify({ type: "error", message: "该昵称已被使用" }));
          return;
        }

        // Leave previous room
        if (memberId && currentRoomId) {
          leaveCurrentRoom();
        }

        memberId = generateId();
        memberName = nickname;
        currentRoomId = roomId;
        memberSockets.set(memberId, ws);

        const member = { id: memberId, name: nickname };
        room.members.push(member);

        ws.send(JSON.stringify({
          type: "room-joined",
          roomId: room.id,
          roomName: room.name,
          members: room.members.map((m) => ({ id: m.id, name: m.name })),
          messages: room.messages,
          yourId: memberId,
        }));

        broadcast(roomId, { type: "member-joined", member: { id: memberId, name: nickname } }, memberId);
        broadcastRoomList();

        console.log(`[+] ${nickname} joined ${room.name} (${room.members.length} members)`);
        break;
      }

      case "create-room": {
        const { roomName, nickname } = msg;
        if (!roomName || !nickname) {
          ws.send(JSON.stringify({ type: "error", message: "缺少房间名或昵称" }));
          return;
        }

        if (memberId && currentRoomId) {
          leaveCurrentRoom();
        }

        memberId = generateId();
        memberName = nickname;
        memberSockets.set(memberId, ws);

        const room = createRoom(roomName.trim());
        currentRoomId = room.id;

        const member = { id: memberId, name: nickname };
        room.members.push(member);

        ws.send(JSON.stringify({
          type: "room-created",
          roomId: room.id,
          roomName: room.name,
          members: room.members.map((m) => ({ id: m.id, name: m.name })),
          yourId: memberId,
        }));

        broadcastRoomList();
        console.log(`[+] ${nickname} created room ${room.name}`);
        break;
      }

      case "leave-room": {
        leaveCurrentRoom();
        break;
      }

      case "message": {
        if (!memberId || !currentRoomId) return;
        const { text } = msg;
        if (!text || !text.trim()) return;

        const chatMsg = {
          id: generateId(),
          type: "text",
          senderId: memberId,
          senderName: memberName,
          text: text.trim(),
          timestamp: Date.now(),
        };
        addMessage(currentRoomId, chatMsg);
        broadcast(currentRoomId, { type: "message", ...chatMsg });
        break;
      }

      case "file-shared": {
        if (!memberId || !currentRoomId) return;
        const { fileName, fileSize, url } = msg;
        if (!fileName || !url) return;

        const chatMsg = {
          id: generateId(),
          type: "file",
          senderId: memberId,
          senderName: memberName,
          fileName,
          fileSize: fileSize || 0,
          url,
          timestamp: Date.now(),
        };
        addMessage(currentRoomId, chatMsg);
        broadcast(currentRoomId, { type: "file-shared", ...chatMsg });
        break;
      }

      case "typing": {
        if (!memberId || !currentRoomId) return;
        broadcast(currentRoomId, {
          type: "typing",
          senderId: memberId,
          isTyping: !!msg.isTyping,
        }, memberId);
        break;
      }
    }
  });

  function leaveCurrentRoom() {
    if (!memberId || !currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (room) {
      const idx = room.members.findIndex((m) => m.id === memberId);
      if (idx !== -1) {
        room.members.splice(idx, 1);
        broadcast(currentRoomId, { type: "member-left", memberId, memberName }, memberId);
        console.log(`[-] ${memberName} left ${room.name} (${room.members.length} members)`);
        if (room.members.length === 0) {
          scheduleCleanup(currentRoomId);
        }
      }
    }
    memberSockets.delete(memberId);
    broadcastRoomList();
    currentRoomId = null;
  }

  ws.on("close", () => {
    leaveCurrentRoom();
    memberSockets.delete(memberId);
  });

  ws.on("error", () => {
    leaveCurrentRoom();
    memberSockets.delete(memberId);
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`💬 群聊 WebSocket 服务器运行在 ws://0.0.0.0:${PORT}`);
  console.log(`   健康检查: http://0.0.0.0:${PORT}/health`);
  console.log(`   默认房间: 大厅`);
});
```

- [ ] **Step 1: Create `server/chat-server.mjs`** with the full content above.
- [ ] **Step 2: Quick smoke test**

Run: `node server/chat-server.mjs`
Expected: `💬 群聊 WebSocket 服务器运行在 ws://0.0.0.0:3002`

---

### Task 2: Chat Types (`src/lib/chat/types.ts`)

**Files:**
- Create: `src/lib/chat/types.ts`

```typescript
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
}

export type ChatPageView = "connect" | "rooms" | "chat";

export type { ChatRoomInfo };
```

- [ ] **Step 1: Create `src/lib/chat/types.ts`** with the above content.

---

### Task 3: File Storage (`src/lib/chat/storage.ts`)

**Files:**
- Create: `src/lib/chat/storage.ts`

```typescript
import fs from "fs";
import path from "path";

const CHAT_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "chat");

function ensureDir() {
  if (!fs.existsSync(CHAT_UPLOAD_DIR)) {
    fs.mkdirSync(CHAT_UPLOAD_DIR, { recursive: true });
  }
}

export function saveChatFile(buffer: Buffer, filename: string): string {
  ensureDir();
  const safeName = filename.replace(/[^a-zA-Z0-9._\-一-鿿]/g, "_");
  const filePath = path.join(CHAT_UPLOAD_DIR, safeName);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/chat/${safeName}`;
}
```

- [ ] **Step 1: Create `src/lib/chat/storage.ts`** with the above content.

---

### Task 4: Upload API Route

**Files:**
- Create: `src/app/api/chat/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { saveChatFile } from "@/lib/chat/storage";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "请选择文件" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = saveChatFile(buffer, file.name);

  return NextResponse.json({
    success: true,
    url,
    fileName: file.name,
    fileSize: file.size,
  });
}
```

- [ ] **Step 1: Create the directory `src/app/api/chat/upload/`** and the `route.ts` file.

---

### Task 5: useGroupChat Hook

**Files:**
- Create: `src/hooks/useGroupChat.ts`

Central state management hook for the chat page. Manages WebSocket lifecycle, connection state, rooms, current room messages, members, and typing indicators.

```typescript
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  ChatMember,
  ChatRoomInfo,
  ChatMessage,
  ChatPageView,
} from "@/lib/chat/types";

type ConnStatus = "disconnected" | "connecting" | "connected";

export interface UseGroupChatReturn {
  connStatus: ConnStatus;
  nickname: string;
  setNickname: (v: string) => void;
  serverAddress: string;
  setServerAddress: (v: string) => void;
  view: ChatPageView;
  rooms: ChatRoomInfo[];
  currentRoomId: string;
  currentRoomName: string;
  members: ChatMember[];
  messages: ChatMessage[];
  typingMembers: string[];
  error: string;
  myMemberId: string;
  connect: (hostname?: string) => void;
  disconnect: () => void;
  createRoom: (name: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendMessage: (text: string) => void;
  shareFile: (fileName: string, fileSize: number, url: string) => void;
  setTyping: (isTyping: boolean) => void;
  clearError: () => void;
  setError: (msg: string) => void;
}

export function useGroupChat(): UseGroupChatReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [connStatus, setConnStatus] = useState<ConnStatus>("disconnected");
  const [nickname, setNickname] = useState("");
  const [serverAddress, setServerAddress] = useState("");
  const [view, setView] = useState<ChatPageView>("connect");
  const [rooms, setRooms] = useState<ChatRoomInfo[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [currentRoomName, setCurrentRoomName] = useState("");
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingMembers, setTypingMembers] = useState<string[]>([]);
  const [error, setError] = useState("");
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearError = useCallback(() => setError(""), []);

  const handleWsMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case "room-list":
        setRooms(msg.rooms || []);
        break;

      case "room-joined":
        setCurrentRoomId(msg.roomId);
        setCurrentRoomName(msg.roomName);
        setMembers(msg.members || []);
        setMessages(msg.messages || []);
        setTypingMembers([]);
        setView("chat");
        break;

      case "room-created":
        setCurrentRoomId(msg.roomId);
        setCurrentRoomName(msg.roomName);
        setMembers(msg.members || []);
        setMessages([]);
        setTypingMembers([]);
        setView("chat");
        break;

      case "member-joined":
        setMembers((prev) => {
          if (prev.some((m) => m.id === msg.member.id)) return prev;
          return [...prev, msg.member];
        });
        break;

      case "member-left":
        setMembers((prev) => prev.filter((m) => m.id !== msg.memberId));
        break;

      case "message":
        setMessages((prev) => [...prev, msg]);
        break;

      case "file-shared":
        setMessages((prev) => [...prev, msg]);
        break;

      case "typing":
        setTypingMembers((prev) => {
          if (msg.isTyping) {
            if (prev.includes(msg.senderId)) return prev;
            return [...prev, msg.senderId];
          }
          return prev.filter((id) => id !== msg.senderId);
        });
        break;

      case "error":
        setError(msg.message);
        break;
    }
  }, []);

  const connect = useCallback((hostname?: string) => {
    if (!nickname.trim()) {
      setError("请输入昵称");
      return;
    }
    setError("");
    setConnStatus("connecting");

    const host = hostname || window.location.hostname;
    const url = `ws://${host}:3002`;

    const ws = new WebSocket(url);
    ws.onopen = () => {
      // Ask for rooms by joining with empty — server sends room list
      ws.send(JSON.stringify({ type: "join-room", roomId: "init", nickname: nickname.trim() }));
    };
    ws.onmessage = (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (msg.type === "error" && msg.message === "房间不存在") {
        // Initial join to "init" will fail — but means we're connected
        setConnStatus("connected");
        setView("rooms");
        // Ask for room list by trying to join
        return;
      }
      if (msg.type === "room-joined") {
        setConnStatus("connected");
      }
      handleWsMessage(msg);
    };
    ws.onclose = () => {
      setConnStatus("disconnected");
      setView("connect");
    };
    ws.onerror = () => {
      setError("无法连接到聊天服务器，请确认服务器已启动");
      setConnStatus("disconnected");
    };
    wsRef.current = ws;
  }, [nickname, handleWsMessage]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnStatus("disconnected");
    setView("connect");
    setRooms([]);
    setCurrentRoomId("");
    setCurrentRoomName("");
    setMembers([]);
    setMessages([]);
    setTypingMembers([]);
  }, []);

  const createRoom = useCallback((name: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "create-room", roomName: name, nickname: nickname.trim() }));
    }
  }, [nickname]);

  const joinRoom = useCallback((roomId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "join-room", roomId, nickname: nickname.trim() }));
    }
  }, [nickname]);

  const leaveRoom = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "leave-room" }));
    }
    setCurrentRoomId("");
    setCurrentRoomName("");
    setMembers([]);
    setMessages([]);
    setTypingMembers([]);
    setView("rooms");
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && text.trim()) {
      wsRef.current.send(JSON.stringify({ type: "message", text: text.trim() }));
    }
  }, []);

  const shareFile = useCallback((fileName: string, fileSize: number, url: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "file-shared", fileName, fileSize, url }));
    }
  }, []);

  const setTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "typing", isTyping }));
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    if (isTyping) {
      typingTimerRef.current = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "typing", isTyping: false }));
        }
      }, 3000);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  const myMemberId = members.find((m) => m.name === nickname)?.id || "";

  return {
    connStatus, nickname, setNickname,
    serverAddress, setServerAddress,
    view, rooms,
    currentRoomId, currentRoomName,
    members, messages, typingMembers, error,
    myMemberId,
    connect, disconnect, createRoom, joinRoom, leaveRoom,
    sendMessage, shareFile, setTyping, clearError, setError,
  };
}
```

- [ ] **Step 1: Create `src/hooks/useGroupChat.ts`** with the above content.

---

### Task 6: UI Components

**Files:**
- Create: `src/components/group-chat/JoinScreen.tsx`
- Create: `src/components/group-chat/RoomList.tsx`
- Create: `src/components/group-chat/ChatArea.tsx`
- Create: `src/components/group-chat/MessageBubble.tsx`
- Create: `src/components/group-chat/FileCard.tsx`
- Create: `src/components/group-chat/ChatInput.tsx`
- Create: `src/components/group-chat/MemberList.tsx`

- [ ] **Step 1: Create `JoinScreen.tsx`**

```typescript
"use client";

interface Props {
  nickname: string;
  onNicknameChange: (v: string) => void;
  serverAddress: string;
  onServerAddressChange: (v: string) => void;
  onConnect: (hostname?: string) => void;
  onError: () => void;
}

export function JoinScreen({
  nickname, onNicknameChange,
  serverAddress, onServerAddressChange,
  onConnect, onError,
}: Props) {
  const handleConnect = () => {
    if (!nickname.trim()) {
      onError();
      return;
    }
    if (serverAddress.trim()) {
      onConnect(serverAddress.trim());
    } else {
      onConnect();
    }
  };

  return (
    <div className="glass rounded-3xl p-6 sm:p-8 max-w-md mx-auto mt-8">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">💬</div>
        <h2 className="text-lg font-semibold mb-1">局域网群聊</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          同一局域网内实时沟通 · 文件分享
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
            你的昵称
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
            placeholder="输入昵称"
            maxLength={10}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10
              text-sm text-white placeholder-[var(--color-text-secondary)]
              focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
            服务器地址
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={serverAddress}
              onChange={(e) => onServerAddressChange(e.target.value)}
              placeholder="默认自动检测 (留空即可)"
              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10
                text-sm text-white placeholder-[var(--color-text-secondary)]
                focus:outline-none focus:border-[var(--color-accent)] transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            />
            <button
              type="button"
              disabled={!nickname.trim()}
              className="px-5 py-2 rounded-xl text-sm font-medium
                bg-[var(--color-accent)] text-white
                hover:opacity-90 transition-opacity
                disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              onClick={handleConnect}
            >
              连接
            </button>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--color-text-secondary)] text-center">
        请先启动聊天服务器: npm run chat-server
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create `RoomList.tsx`**

```typescript
"use client";

import type { ChatRoomInfo } from "@/lib/chat/types";
import { useState } from "react";

interface Props {
  rooms: ChatRoomInfo[];
  currentRoomId: string;
  onJoin: (roomId: string) => void;
  onCreate: (name: string) => void;
}

export function RoomList({ rooms, currentRoomId, onJoin, onCreate }: Props) {
  const [newRoomName, setNewRoomName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = () => {
    if (newRoomName.trim()) {
      onCreate(newRoomName.trim());
      setNewRoomName("");
      setShowCreate(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          可用聊天室
        </h2>
        <button
          type="button"
          className="text-xs text-[var(--color-accent)] hover:underline"
          onClick={() => setShowCreate(!showCreate)}
        >
          + 创建
        </button>
      </div>

      {showCreate && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="聊天室名称"
            maxLength={20}
            className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10
              text-sm text-white placeholder-[var(--color-text-secondary)]
              focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button
            type="button"
            disabled={!newRoomName.trim()}
            className="px-3 py-1.5 rounded-xl text-xs font-medium
              bg-[var(--color-accent)] text-white
              hover:opacity-90 transition-opacity
              disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={handleCreate}
          >
            创建
          </button>
        </div>
      )}

      {rooms.length === 0 && (
        <p className="text-sm text-[var(--color-text-secondary)] py-4 text-center">
          暂无聊天室
        </p>
      )}

      <div className="space-y-1">
        {rooms.map((room) => (
          <button
            key={room.id}
            type="button"
            onClick={() => onJoin(room.id)}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl
              text-sm transition-colors text-left
              ${room.id === currentRoomId
                ? "bg-[var(--color-accent)]/10 text-white"
                : "hover:bg-white/5 text-[var(--color-text-primary)]"
              }`}
          >
            <span className="font-medium">{room.name}</span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {room.memberCount} 人在线
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `MessageBubble.tsx`**

```typescript
"use client";

import type { ChatMessage } from "@/lib/chat/types";
import { FileCard } from "./FileCard";

interface Props {
  message: ChatMessage;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: Props) {
  const time = new Date(message.timestamp).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} mb-3`}>
      {!isOwn && (
        <span className="text-xs text-[var(--color-text-secondary)] mb-1 ml-1">
          {message.senderName}
        </span>
      )}
      {message.type === "text" ? (
        <div
          className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
            isOwn
              ? "bg-[var(--color-accent)] text-white rounded-br-md"
              : "bg-white/10 text-[var(--color-text-primary)] rounded-bl-md"
          }`}
        >
          {message.text}
          <div className={`text-[10px] mt-1 ${isOwn ? "text-white/60" : "text-[var(--color-text-secondary)]"}`}>
            {time}
          </div>
        </div>
      ) : (
        <div className={`max-w-[80%] ${isOwn ? "items-end" : "items-start"}`}>
          <FileCard
            fileName={message.fileName || ""}
            fileSize={message.fileSize || 0}
            url={message.url || ""}
          />
          <div className="text-[10px] text-[var(--color-text-secondary)] mt-1 text-right">
            {time}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `FileCard.tsx`**

```typescript
"use client";

interface Props {
  fileName: string;
  fileSize: number;
  url: string;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function FileCard({ fileName, fileSize, url }: Props) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);

  return (
    <div className="glass rounded-xl p-3 min-w-[200px]">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <div className="text-2xl shrink-0">
          {isImage ? "🖼️" : "📄"}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {formatSize(fileSize)}
          </p>
        </div>
      </a>
    </div>
  );
}
```

- [ ] **Step 5: Create `ChatArea.tsx`**

```typescript
"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/chat/types";
import { MessageBubble } from "./MessageBubble";

interface Props {
  messages: ChatMessage[];
  myMemberId: string;
  typingMembers: string[];
  memberNames: Record<string, string>;
  loading?: boolean;
}

export function ChatArea({ messages, myMemberId, typingMembers, memberNames, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[var(--color-text-secondary)]">加载中...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[var(--color-text-secondary)]">
          暂无消息，发送第一条消息吧
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-1 py-2">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isOwn={msg.senderId === myMemberId}
        />
      ))}
      {typingMembers.length > 0 && (
        <div className="text-xs text-[var(--color-text-secondary)] italic mb-2">
          {typingMembers.map((id) => memberNames[id]).filter(Boolean).join("、")}
          {typingMembers.length > 1 ? " 正在输入..." : " 正在输入..."}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
```

- [ ] **Step 6: Create `ChatInput.tsx`**

```typescript
"use client";

import { useState, useRef, useCallback } from "react";

interface Props {
  onSend: (text: string) => void;
  onFileShare: (fileName: string, fileSize: number, url: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, onFileShare, onTyping, disabled }: Props) {
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 3000);
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/chat/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        onFileShare(data.fileName, data.fileSize, data.url);
      }
    } catch {
      // Error handled silently
    }

    if (fileRef.current) fileRef.current.value = "";
  }, [onFileShare]);

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
      />
      <button
        type="button"
        disabled={disabled}
        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl
          bg-white/5 hover:bg-white/10 transition-colors
          disabled:opacity-30 disabled:cursor-not-allowed text-lg"
        onClick={() => fileRef.current?.click()}
        title="发送文件"
      >
        📎
      </button>
      <input
        type="text"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="输入消息..."
        disabled={disabled}
        maxLength={500}
        className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10
          text-sm text-white placeholder-[var(--color-text-secondary)]
          focus:outline-none focus:border-[var(--color-accent)] transition-colors
          disabled:opacity-30 disabled:cursor-not-allowed"
      />
      <button
        type="button"
        disabled={disabled || !text.trim()}
        className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium
          bg-[var(--color-accent)] text-white
          hover:opacity-90 transition-opacity
          disabled:opacity-30 disabled:cursor-not-allowed"
        onClick={handleSend}
      >
        发送
      </button>
    </div>
  );
}
```

- [ ] **Step 7: Create `MemberList.tsx`**

```typescript
"use client";

import type { ChatMember } from "@/lib/chat/types";

interface Props {
  members: ChatMember[];
  myMemberId: string;
  typingMembers: string[];
}

export function MemberList({ members, myMemberId, typingMembers }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs text-[var(--color-text-secondary)] font-medium uppercase tracking-wider">
        成员 ({members.length})
      </h3>
      <div className="space-y-1">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <span className={m.id === myMemberId ? "text-[var(--color-accent)]" : ""}>
              {m.name}
              {m.id === myMemberId && " (你)"}
            </span>
            {typingMembers.includes(m.id) && (
              <span className="text-xs text-[var(--color-text-secondary)] italic ml-auto">
                输入中...
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### Task 7: Group Chat Page

**Files:**
- Create: `src/app/tools/group-chat/page.tsx`

```typescript
"use client";

import { useGroupChat } from "@/hooks/useGroupChat";
import { JoinScreen } from "@/components/group-chat/JoinScreen";
import { RoomList } from "@/components/group-chat/RoomList";
import { ChatArea } from "@/components/group-chat/ChatArea";
import { ChatInput } from "@/components/group-chat/ChatInput";
import { MemberList } from "@/components/group-chat/MemberList";
import Link from "next/link";

export default function GroupChatPage() {
  const chat = useGroupChat();

  const memberNames: Record<string, string> = {};
  chat.members.forEach((m) => { memberNames[m.id] = m.name; });

  const [showMembers, setShowMembers] = useState(false);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)]
          hover:text-[var(--color-text-primary)] transition-colors mb-6"
      >
        ← 返回首页
      </Link>

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">群聊</h1>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        局域网多房间聊天 · 文件分享
      </p>

      {/* Error */}
      {chat.error && (
        <div className="mb-4 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{chat.error}</span>
          <button
            type="button"
            className="text-red-300 hover:text-red-200 ml-2"
            onClick={chat.clearError}
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── Connecting Screen ─── */}
      {chat.connStatus === "connecting" && (
        <div className="glass rounded-3xl p-8 max-w-md mx-auto mt-8 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            正在连接聊天服务器...
          </p>
        </div>
      )}

      {/* ─── Connect Screen ─── */}
      {chat.connStatus === "disconnected" && chat.view === "connect" && (
        <JoinScreen
          nickname={chat.nickname}
          onNicknameChange={chat.setNickname}
          serverAddress={chat.serverAddress}
          onServerAddressChange={chat.setServerAddress}
          onConnect={chat.connect}
          onError={() => chat.setError("请输入昵称")}
        />
      )}

      {/* ─── Room List ─── */}
      {chat.connStatus === "connected" && chat.view === "rooms" && (
        <div className="glass rounded-3xl p-6 max-w-lg mx-auto mt-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-[var(--color-text-secondary)]">
              已连接聊天服务器
            </span>
            <button
              type="button"
              className="text-xs text-red-400 hover:text-red-300"
              onClick={chat.disconnect}
            >
              断开连接
            </button>
          </div>
          <RoomList
            rooms={chat.rooms}
            currentRoomId={chat.currentRoomId}
            onJoin={chat.joinRoom}
            onCreate={chat.createRoom}
          />
        </div>
      )}

      {/* ─── Chat Room ─── */}
      {chat.connStatus === "connected" && chat.view === "chat" && (
        <div className="flex h-[65vh] gap-4">
          {/* Left sidebar — room list (desktop) */}
          <div className="hidden lg:flex lg:w-56 shrink-0 flex-col">
            <div className="glass rounded-3xl p-4 flex-1 overflow-y-auto">
              <RoomList
                rooms={chat.rooms}
                currentRoomId={chat.currentRoomId}
                onJoin={chat.joinRoom}
                onCreate={chat.createRoom}
              />
            </div>
          </div>

          {/* Center — chat area */}
          <div className="flex-1 flex flex-col glass rounded-3xl min-w-0">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  className="lg:hidden text-sm text-[var(--color-text-secondary)] hover:text-white"
                  onClick={chat.leaveRoom}
                >
                  ←
                </button>
                <h2 className="text-sm font-semibold truncate">{chat.currentRoomName}</h2>
                <span className="text-xs text-[var(--color-text-secondary)] shrink-0">
                  {chat.members.length} 人
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="lg:hidden text-xs text-[var(--color-text-secondary)] hover:text-white"
                  onClick={() => setShowMembers(!showMembers)}
                >
                  {showMembers ? "关闭" : "成员"}
                </button>
                <button
                  type="button"
                  className="text-xs text-red-400 hover:text-red-300"
                  onClick={chat.leaveRoom}
                >
                  离开
                </button>
              </div>
            </div>

            {/* Messages */}
            <ChatArea
              messages={chat.messages}
              myMemberId={chat.myMemberId}
              typingMembers={chat.typingMembers}
              memberNames={memberNames}
            />

            {/* Input */}
            <div className="shrink-0 px-4 py-3 border-t border-white/10">
              <ChatInput
                onSend={chat.sendMessage}
                onFileShare={chat.shareFile}
                onTyping={chat.setTyping}
              />
            </div>
          </div>

          {/* Right sidebar — member list (desktop, overlay on mobile) */}
          <div className={`lg:flex lg:w-48 shrink-0 flex-col ${showMembers ? "fixed inset-0 z-50 p-4 bg-black/60 flex" : "hidden"}`}>
            <div className="glass rounded-3xl p-4 flex-1 overflow-y-auto">
              <div className="lg:hidden flex justify-end mb-2">
                <button
                  type="button"
                  className="text-sm text-[var(--color-text-secondary)] hover:text-white"
                  onClick={() => setShowMembers(false)}
                >
                  关闭 ✕
                </button>
              </div>
              <MemberList
                members={chat.members}
                myMemberId={chat.myMemberId}
                typingMembers={chat.typingMembers}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 1: Create the directory `src/app/tools/group-chat/`** and the `page.tsx` file.
- [ ] **Step 2: Verify no TS errors**

Run: `npx tsc --noEmit`
Expected: No type errors

---

### Task 8: Registration

**Files:**
- Modify: `src/lib/tools.ts`
- Modify: `package.json`

- [ ] **Step 1: Add to tool registry**

Edit `src/lib/tools.ts` — add entry to the `tools` array (after the existing entries, before the closing `]`):

```typescript
  {
    id: "group-chat",
    name: "群聊",
    description: "局域网多房间聊天 · 文件分享",
    icon: "💬",
    path: "/tools/group-chat",
    status: "active",
  },
```

- [ ] **Step 2: Add script to package.json**

Edit the `scripts` section in `package.json` to add:
```json
    "chat-server": "node server/chat-server.mjs",
```

And update the `dev-all` script to also start the chat server:
```json
    "dev-all": "node server/ws-server.mjs & node server/chat-server.mjs & next dev -H 0.0.0.0"
```

---

### Task 9: Verification

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Start the chat server**

Run: `node server/chat-server.mjs`
Expected: `💬 群聊 WebSocket 服务器运行在 ws://0.0.0.0:3002`

- [ ] **Step 3: Start the dev server**

Run: `npm run dev`
Expected: Next.js starts normally

- [ ] **Step 4: Manual test flow**
  1. Open `http://localhost:3000/tools/group-chat`
  2. Enter nickname → click 连接
  3. Should see "大厅" room in list
  4. Click "大厅" → join the room
  5. Send a message → should appear in chat
  6. Open another browser tab → same page
  7. Enter different nickname → connect → join "大厅"
  8. Both tabs should see messages in real-time
  9. Test file upload: click 📎 → select file → file card appears
  10. Test room creation: create a new room → join → chat
