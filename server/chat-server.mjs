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

function leaveRoom(memberId, currentRoomId) {
  if (!memberId || !currentRoomId) return;
  const room = rooms.get(currentRoomId);
  if (room) {
    const { members } = room;
    const idx = members.findIndex((m) => m.id === memberId);
    if (idx !== -1) {
      const [member] = members.splice(idx, 1);
      broadcast(currentRoomId, { type: "member-left", memberId, memberName: member.name }, memberId);
      console.log(`[-] ${member.name} left ${room.name} (${room.members.length} members)`);
      if (room.members.length === 0) {
        scheduleCleanup(currentRoomId);
      }
    }
  }
  // Send room list to leaving member before deleting socket
  send(memberId, { type: "room-list", rooms: roomList() });
  memberSockets.delete(memberId);
  broadcastRoomList();
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
      case "get-rooms": {
        ws.send(JSON.stringify({ type: "room-list", rooms: roomList() }));
        break;
      }

      case "join-room": {
        const { roomId, nickname } = msg;
        if (!roomId || !nickname) {
          ws.send(JSON.stringify({ type: "error", message: "缺少房间号或昵称" }));
          return;
        }

        if (nickname.length > 20) {
          ws.send(JSON.stringify({ type: "error", message: "昵称过长，最多20个字符" }));
          return;
        }

        const room = rooms.get(roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: "error", message: "房间不存在" }));
          return;
        }

        // Check name uniqueness — allow reconnecting if old socket is dead
        const nameCollision = room.members.find((m) => m.name === nickname);
        if (nameCollision) {
          const oldWs = memberSockets.get(nameCollision.id);
          if (oldWs && oldWs.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "error", message: "该昵称已被使用" }));
            return;
          }
          // Stale member — remove them
          const idx = room.members.findIndex((m) => m.id === nameCollision.id);
          if (idx !== -1) room.members.splice(idx, 1);
          memberSockets.delete(nameCollision.id);
          broadcast(roomId, { type: "member-left", memberId: nameCollision.id, memberName: nickname });
        }

        // Leave previous room
        if (memberId && currentRoomId) {
          leaveRoom(memberId, currentRoomId);
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

        if (roomName.length > 50) {
          ws.send(JSON.stringify({ type: "error", message: "房间名过长，最多50个字符" }));
          return;
        }

        if (nickname.length > 20) {
          ws.send(JSON.stringify({ type: "error", message: "昵称过长，最多20个字符" }));
          return;
        }

        if (memberId && currentRoomId) {
          leaveRoom(memberId, currentRoomId);
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
        leaveRoom(memberId, currentRoomId);
        currentRoomId = null;
        memberId = null;
        break;
      }

      case "message": {
        if (!memberId || !currentRoomId) return;
        const { text, clientMsgId } = msg;
        if (!text || !text.trim()) return;
        if (text.length > 10000) {
          ws.send(JSON.stringify({ type: "error", message: "消息过长，最多10000个字符" }));
          return;
        }

        const chatMsg = {
          id: generateId(),
          type: "text",
          senderId: memberId,
          senderName: memberName,
          text: text.trim(),
          timestamp: Date.now(),
          clientMsgId,
        };
        addMessage(currentRoomId, chatMsg);
        broadcast(currentRoomId, { ...chatMsg, type: "message" });
        break;
      }

      case "file-shared": {
        if (!memberId || !currentRoomId) return;
        const { fileName, fileSize, url, clientMsgId } = msg;
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
          clientMsgId,
        };
        addMessage(currentRoomId, chatMsg);
        broadcast(currentRoomId, { ...chatMsg, type: "file-shared" });
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

  ws.on("close", () => {
    leaveRoom(memberId, currentRoomId);
  });

  ws.on("error", () => {
    leaveRoom(memberId, currentRoomId);
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`💬 群聊 WebSocket 服务器运行在 ws://0.0.0.0:${PORT}`);
  console.log(`   健康检查: http://0.0.0.0:${PORT}/health`);
  console.log(`   默认房间: 大厅`);
});
