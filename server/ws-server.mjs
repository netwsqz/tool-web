/**
 * 万能工具箱 — 统一 WebSocket 服务器
 * 提供 你画我猜 游戏 + 群聊 + P2P 信令 服务
 * Usage: node server/ws-server.mjs [port]
 * Default port: 3001
 *
 * WebSocket 路径:
 *   /draw-guess   你画我猜游戏
 *   /chat         群聊
 *   /p2p          P2P 文件传输信令
 */

import { createServer } from "http";
import { createRequire } from "module";
import { URL, fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const { WebSocketServer, WebSocket } = require("ws");

// ──────────────────────────────────────────────────────────────
//  Shared helpers
// ──────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// 安全发送：捕获 send 异常防止整个进程崩溃
function safeSend(ws, data) {
  try {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(typeof data === "string" ? data : JSON.stringify(data));
    }
  } catch {
    // 连接可能在检查和发送之间关闭 — 静默忽略
  }
}

// ──────────────────────────────────────────────────────────────
//  Shared Ping/Pong (keep-alive)
// ──────────────────────────────────────────────────────────────

const PING_INTERVAL = 30000; // 30s

function setupPingPong(ws) {
  let isAlive = true;
  ws.isAlive = true;

  ws.on("pong", () => {
    isAlive = true;
    ws.isAlive = true;
  });

  ws.on("close", () => {
    isAlive = false;
    ws.isAlive = false;
  });

  return ws;
}

// 定期发送 ping 保活所有 WebSocket 连接
const pingTimer = setInterval(() => {
  for (const sock of p2pSockets) {
    if (sock.readyState === WebSocket.OPEN) {
      sock.ping();
    }
  }
  // 游戏/群聊的连接在各 handler 内通过 setupPingPong 管理
}, PING_INTERVAL);

// ──────────────────────────────────────────────────────────────
//  你画我猜 — State & Logic
// ──────────────────────────────────────────────────────────────

const DRAW_TIME = 80;
const TOTAL_ROUNDS = 3;

const WORDS = [
  { word: "苹果", hint: "水果", diff: 0 },
  { word: "香蕉", hint: "水果", diff: 0 },
  { word: "西瓜", hint: "水果", diff: 0 },
  { word: "草莓", hint: "水果", diff: 0 },
  { word: "葡萄", hint: "水果", diff: 0 },
  { word: "猫", hint: "动物", diff: 0 },
  { word: "狗", hint: "动物", diff: 0 },
  { word: "兔子", hint: "动物", diff: 0 },
  { word: "熊猫", hint: "动物", diff: 0 },
  { word: "大象", hint: "动物", diff: 0 },
  { word: "老虎", hint: "动物", diff: 0 },
  { word: "狮子", hint: "动物", diff: 0 },
  { word: "猴子", hint: "动物", diff: 0 },
  { word: "企鹅", hint: "动物", diff: 0 },
  { word: "蝴蝶", hint: "动物", diff: 0 },
  { word: "鱼", hint: "动物", diff: 0 },
  { word: "鸟", hint: "动物", diff: 0 },
  { word: "太阳", hint: "自然", diff: 0 },
  { word: "月亮", hint: "自然", diff: 0 },
  { word: "星星", hint: "自然", diff: 0 },
  { word: "彩虹", hint: "自然", diff: 0 },
  { word: "山", hint: "自然", diff: 0 },
  { word: "花", hint: "植物", diff: 0 },
  { word: "树", hint: "植物", diff: 0 },
  { word: "房子", hint: "建筑", diff: 0 },
  { word: "城堡", hint: "建筑", diff: 0 },
  { word: "桥", hint: "建筑", diff: 0 },
  { word: "汽车", hint: "交通工具", diff: 0 },
  { word: "自行车", hint: "交通工具", diff: 0 },
  { word: "飞机", hint: "交通工具", diff: 0 },
  { word: "船", hint: "交通工具", diff: 0 },
  { word: "火车", hint: "交通工具", diff: 0 },
  { word: "火箭", hint: "交通工具", diff: 0 },
  { word: "蛋糕", hint: "食物", diff: 0 },
  { word: "冰淇淋", hint: "食物", diff: 0 },
  { word: "汉堡", hint: "食物", diff: 0 },
  { word: "披萨", hint: "食物", diff: 0 },
  { word: "咖啡", hint: "饮品", diff: 0 },
  { word: "书", hint: "物品", diff: 0 },
  { word: "雨伞", hint: "物品", diff: 0 },
  { word: "眼镜", hint: "物品", diff: 0 },
  { word: "手机", hint: "电子产品", diff: 0 },
  { word: "电脑", hint: "电子产品", diff: 0 },
  { word: "台灯", hint: "家具", diff: 0 },
  { word: "椅子", hint: "家具", diff: 0 },
  { word: "足球", hint: "运动", diff: 0 },
  { word: "篮球", hint: "运动", diff: 0 },
  { word: "心", hint: "符号", diff: 0 },
  { word: "气球", hint: "物品", diff: 0 },
  { word: "礼物", hint: "物品", diff: 0 },
  { word: "剪刀", hint: "工具", diff: 0 },
  { word: "锤子", hint: "工具", diff: 0 },
  { word: "帽子", hint: "服饰", diff: 0 },
  { word: "鞋子", hint: "服饰", diff: 0 },
  { word: "戒指", hint: "饰品", diff: 0 },
  { word: "跑步", hint: "动作", diff: 1 },
  { word: "跳舞", hint: "动作", diff: 1 },
  { word: "唱歌", hint: "动作", diff: 1 },
  { word: "钓鱼", hint: "活动", diff: 1 },
  { word: "露营", hint: "活动", diff: 1 },
  { word: "滑雪", hint: "运动", diff: 1 },
  { word: "冲浪", hint: "运动", diff: 1 },
  { word: "秋千", hint: "游乐设施", diff: 1 },
  { word: "滑梯", hint: "游乐设施", diff: 1 },
  { word: "摩天轮", hint: "游乐设施", diff: 1 },
  { word: "过山车", hint: "游乐设施", diff: 1 },
  { word: "圣诞树", hint: "节日", diff: 1 },
  { word: "蜡烛", hint: "物品", diff: 1 },
  { word: "风筝", hint: "玩具", diff: 1 },
  { word: "拼图", hint: "玩具", diff: 1 },
  { word: "雪人", hint: "冬季", diff: 1 },
  { word: "沙滩", hint: "场景", diff: 1 },
  { word: "火山", hint: "自然", diff: 1 },
  { word: "瀑布", hint: "自然", diff: 1 },
  { word: "沙漠", hint: "自然", diff: 1 },
  { word: "岛屿", hint: "自然", diff: 1 },
  { word: "森林", hint: "自然", diff: 1 },
  { word: "闪电", hint: "天气", diff: 1 },
  { word: "雪花", hint: "天气", diff: 1 },
  { word: "日出", hint: "自然现象", diff: 1 },
  { word: "日落", hint: "自然现象", diff: 1 },
  { word: "指南针", hint: "工具", diff: 1 },
  { word: "望远镜", hint: "工具", diff: 1 },
  { word: "机器人", hint: "科技", diff: 1 },
  { word: "金字塔", hint: "建筑", diff: 1 },
  { word: "风车", hint: "建筑", diff: 1 },
  { word: "灯塔", hint: "建筑", diff: 1 },
  { word: "帐篷", hint: "建筑", diff: 1 },
  { word: "热气球", hint: "交通工具", diff: 1 },
  { word: "潜水艇", hint: "交通工具", diff: 1 },
  { word: "直升机", hint: "交通工具", diff: 1 },
  { word: "救护车", hint: "交通工具", diff: 1 },
  { word: "消防车", hint: "交通工具", diff: 1 },
  { word: "钢琴", hint: "乐器", diff: 1 },
  { word: "吉他", hint: "乐器", diff: 1 },
  { word: "小提琴", hint: "乐器", diff: 1 },
  { word: "鼓", hint: "乐器", diff: 1 },
  { word: "麦克风", hint: "设备", diff: 1 },
  { word: "耳机", hint: "设备", diff: 1 },
  { word: "鼠标", hint: "电脑外设", diff: 1 },
  { word: "键盘", hint: "电脑外设", diff: 1 },
  { word: "地铁", hint: "交通", diff: 1 },
  { word: "红绿灯", hint: "交通", diff: 1 },
  { word: "画蛇添足", hint: "成语", diff: 2 },
  { word: "守株待兔", hint: "成语", diff: 2 },
  { word: "掩耳盗铃", hint: "成语", diff: 2 },
  { word: "刻舟求剑", hint: "成语", diff: 2 },
  { word: "井底之蛙", hint: "成语", diff: 2 },
  { word: "对牛弹琴", hint: "成语", diff: 2 },
  { word: "狐假虎威", hint: "成语", diff: 2 },
  { word: "亡羊补牢", hint: "成语", diff: 2 },
  { word: "外星人", hint: "科幻", diff: 2 },
  { word: "美人鱼", hint: "神话", diff: 2 },
  { word: "独角兽", hint: "神话", diff: 2 },
  { word: "龙", hint: "神话", diff: 2 },
  { word: "凤凰", hint: "神话", diff: 2 },
  { word: "天使", hint: "神话", diff: 2 },
  { word: "木乃伊", hint: "神话", diff: 2 },
  { word: "吸血鬼", hint: "神话", diff: 2 },
  { word: "海盗", hint: "角色", diff: 2 },
  { word: "忍者", hint: "角色", diff: 2 },
  { word: "骑士", hint: "角色", diff: 2 },
  { word: "宇航员", hint: "职业", diff: 2 },
  { word: "魔术师", hint: "职业", diff: 2 },
  { word: "旋转木马", hint: "游乐设施", diff: 2 },
  { word: "自由女神像", hint: "地标", diff: 2 },
  { word: "万里长城", hint: "地标", diff: 2 },
  { word: "埃菲尔铁塔", hint: "地标", diff: 2 },
  { word: "自拍杆", hint: "科技", diff: 2 },
  { word: "无人机", hint: "科技", diff: 2 },
  { word: "二维码", hint: "科技", diff: 2 },
  { word: "不倒翁", hint: "玩具", diff: 2 },
  { word: "指挥家", hint: "职业", diff: 2 },
  { word: "拳击", hint: "运动", diff: 2 },
  { word: "击剑", hint: "运动", diff: 2 },
  { word: "射箭", hint: "运动", diff: 2 },
  { word: "花样滑冰", hint: "运动", diff: 2 },
  { word: "跳伞", hint: "运动", diff: 2 },
  { word: "攀岩", hint: "运动", diff: 2 },
  { word: "橄榄球", hint: "运动", diff: 2 },
  { word: "高尔夫", hint: "运动", diff: 2 },
  { word: "保龄球", hint: "运动", diff: 2 },
  { word: "乒乓球", hint: "运动", diff: 2 },
  { word: "帆船", hint: "运动", diff: 2 },
  { word: "磁悬浮", hint: "科技", diff: 2 },
  { word: "沙漏", hint: "计时器", diff: 2 },
  { word: "日晷", hint: "计时器", diff: 2 },
  { word: "八音盒", hint: "音乐盒", diff: 2 },
  { word: "投影仪", hint: "设备", diff: 2 },
  { word: "自动售货机", hint: "设备", diff: 2 },
];

function pickWords(count) {
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 100; attempt++) {
    let code = "";
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    if (!gameRooms.has(code)) return code;
  }
  return "GAME";
}

// Game state
const gameRooms = new Map(); // roomCode -> { players, game }
const gamePlayerSockets = new Map(); // playerId -> ws

function sendTo(playerId, msg) {
  const ws = gamePlayerSockets.get(playerId);
  safeSend(ws, msg);
}

function broadcastGame(room, msg) {
  for (const p of room.players) sendTo(p.id, msg);
}

function broadcastGameExcept(room, exceptPlayerId, msg) {
  for (const p of room.players) {
    if (p.id !== exceptPlayerId) sendTo(p.id, msg);
  }
}

// Game logic functions — unchanged from original
function createGame(room) {
  return {
    phase: "lobby",
    currentRound: 0,
    totalRounds: TOTAL_ROUNDS,
    words: pickWords(TOTAL_ROUNDS * room.players.length),
    drawerIndex: 0,
    drawerId: null,
    currentWord: null,
    currentHint: null,
    timeLeft: 0,
    timer: null,
    correctGuessers: new Set(),
    scores: {},
  };
}

function startRound(room) {
  const game = room.game;
  const players = room.players;
  if (game.currentRound >= game.totalRounds * players.length) return endGame(room);

  const drawer = players[game.drawerIndex % players.length];
  const wordEntry = game.words[game.currentRound];

  game.phase = "drawing";
  game.drawerId = drawer.id;
  game.currentWord = wordEntry.word;
  game.currentHint = wordEntry.hint;
  game.timeLeft = DRAW_TIME;
  game.correctGuessers = new Set();

  broadcastGame(room, { type: "clear", playerId: "server" });

  for (const p of players) {
    const isDrawer = p.id === drawer.id;
    sendTo(p.id, {
      type: "round-start",
      round: game.currentRound + 1,
      totalRounds: game.totalRounds * players.length,
      word: isDrawer ? game.currentWord : null,
      hint: game.currentHint,
      drawerId: drawer.id,
      drawerName: drawer.name,
      timeLeft: game.timeLeft,
    });
  }

  if (game.timer) clearInterval(game.timer);
  game.timer = setInterval(() => {
    game.timeLeft--;
    broadcastGame(room, { type: "time-left", timeLeft: game.timeLeft });
    if (game.timeLeft <= 0) {
      clearInterval(game.timer);
      game.timer = null;
      endRound(room);
    }
  }, 1000);

  game.currentRound++;
  game.drawerIndex = (game.drawerIndex + 1) % players.length;
}

function endRound(room) {
  const game = room.game;
  if (game.timer) { clearInterval(game.timer); game.timer = null; }

  const drawerId = game.drawerId;
  const players = room.players;
  const scores = { ...game.scores };
  const correctCount = game.correctGuessers.size;
  const speedRatio = game.timeLeft / DRAW_TIME;
  const drawerBonus = Math.max(0, Math.floor(speedRatio * 50));
  scores[drawerId] = (scores[drawerId] || 0) + correctCount * 50 + drawerBonus;
  for (const guesserId of game.correctGuessers) {
    const speedBonus = Math.max(0, Math.floor(speedRatio * 100));
    scores[guesserId] = (scores[guesserId] || 0) + 100 + speedBonus;
  }
  game.scores = scores;
  for (const p of players) p.score = scores[p.id] || 0;
  game.phase = "round-end";

  broadcastGame(room, {
    type: "round-end", word: game.currentWord, scores,
    players: players.map((p) => ({ id: p.id, name: p.name, score: p.score })),
  });

  setTimeout(() => {
    try {
      if (room.game && room.game.phase !== "game-over") startRound(room);
    } catch {
      // 房间可能在超时期间被删除或状态已变更
    }
  }, 4000);
}

function endGame(room) {
  const game = room.game;
  if (game.timer) { clearInterval(game.timer); game.timer = null; }
  game.phase = "game-over";
  let winner = null, maxScore = -1;
  for (const [id, score] of Object.entries(game.scores)) {
    if (score > maxScore) { maxScore = score; winner = id; }
  }
  const winnerName = room.players.find((p) => p.id === winner)?.name || "";
  broadcastGame(room, { type: "game-over", scores: game.scores, winner, winnerName, players: room.players.map((p) => ({ id: p.id, name: p.name, score: p.score })) });
}

function checkGuess(room, playerId, text) {
  const game = room.game;
  if (game.phase !== "drawing") return { correct: false };
  if (playerId === game.drawerId) return { correct: false };
  if (game.correctGuessers.has(playerId)) return { correct: false };
  const guess = text.trim().toLowerCase();
  const word = game.currentWord.toLowerCase();
  const isCorrect = guess === word || guess.includes(word) || word.includes(guess);
  if (isCorrect) game.correctGuessers.add(playerId);
  return { correct: isCorrect };
}

function leaveGameRoom(playerId) {
  if (!playerId) return;
  for (const [, room] of gameRooms) {
    const idx = room.players.findIndex((p) => p.id === playerId);
    if (idx === -1) continue;
    const player = room.players[idx];
    room.players.splice(idx, 1);
    gamePlayerSockets.delete(playerId);

    if (room.players.length === 0) {
      if (room.game && room.game.timer) clearInterval(room.game.timer);
      gameRooms.delete(room.code);
      return;
    }
    if (room.game && room.game.phase === "drawing" && room.game.drawerId === playerId) {
      if (room.game.timer) { clearInterval(room.game.timer); room.game.timer = null; }
      endRound(room);
    }
    broadcastGame(room, { type: "players", players: room.players.map((p) => ({ id: p.id, name: p.name, score: p.score, isDrawer: room.game?.drawerId === p.id })) });
    return;
  }
}

// ──────────────────────────────────────────────────────────────
//  群聊 — State & Logic
// ──────────────────────────────────────────────────────────────

const CHAT_MAX_MESSAGES = 200;
const CHAT_CLEANUP_DELAY = 5 * 60 * 1000;

const chatRooms = new Map(); // roomId -> { id, name, members[], messages[], createdAt }
const chatMemberSockets = new Map(); // memberId -> ws
const chatCleanupTimers = new Map(); // roomId -> setTimeout

function createChatRoom(name) {
  const room = { id: generateId(), name, members: [], messages: [], createdAt: Date.now() };
  chatRooms.set(room.id, room);
  return room;
}

function deleteChatRoom(roomId) {
  chatRooms.delete(roomId);
  const t = chatCleanupTimers.get(roomId);
  if (t) clearTimeout(t);
  chatCleanupTimers.delete(roomId);
}

function scheduleChatCleanup(roomId) {
  const existing = chatCleanupTimers.get(roomId);
  if (existing) clearTimeout(existing);
  chatCleanupTimers.set(roomId, setTimeout(() => {
    const room = chatRooms.get(roomId);
    if (room && room.members.length === 0) deleteChatRoom(roomId);
  }, CHAT_CLEANUP_DELAY));
}

function addChatMessage(roomId, msg) {
  const room = chatRooms.get(roomId);
  if (!room) return;
  room.messages.push(msg);
  if (room.messages.length > CHAT_MAX_MESSAGES) {
    room.messages = room.messages.slice(-CHAT_MAX_MESSAGES);
  }
}

function sendToChat(memberId, msg) {
  const ws = chatMemberSockets.get(memberId);
  safeSend(ws, msg);
}

function broadcastChat(roomId, msg, excludeId) {
  const room = chatRooms.get(roomId);
  if (!room) return;
  for (const m of room.members) {
    if (m.id !== excludeId) sendToChat(m.id, msg);
  }
}

function broadcastChatRoomList() {
  const list = [];
  for (const [, room] of chatRooms) {
    list.push({ id: room.id, name: room.name, memberCount: room.members.length });
  }
  for (const [, room] of chatRooms) {
    for (const m of room.members) sendToChat(m.id, { type: "room-list", rooms: list });
  }
}

function leaveChatRoom(memberId, currentRoomId) {
  if (!memberId || !currentRoomId) return;
  const room = chatRooms.get(currentRoomId);
  if (room) {
    const idx = room.members.findIndex((m) => m.id === memberId);
    if (idx !== -1) {
      const [member] = room.members.splice(idx, 1);
      broadcastChat(currentRoomId, { type: "member-left", memberId, memberName: member.name }, memberId);
      if (room.members.length === 0) scheduleChatCleanup(currentRoomId);
    }
  }
  // 让离开者在 socket 关闭前收到更新的 room-list
  const list = [];
  for (const [, r] of chatRooms) {
    list.push({ id: r.id, name: r.name, memberCount: r.members.length });
  }
  sendToChat(memberId, { type: "room-list", rooms: list });
  chatMemberSockets.delete(memberId);
  broadcastChatRoomList();
}

function handleChatConnection(ws) {
  let memberId = null;
  let currentRoomId = null;
  let memberName = "";

  ws.on("message", (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    try {
    switch (msg.type) {
      case "get-rooms":
        const list = [];
        for (const [, r] of chatRooms) list.push({ id: r.id, name: r.name, memberCount: r.members.length });
        ws.send(JSON.stringify({ type: "room-list", rooms: list }));
        break;

      case "join-room": {
        const { roomId, nickname } = msg;
        if (!roomId || !nickname) { ws.send(JSON.stringify({ type: "error", message: "缺少房间号或昵称" })); return; }
        if (nickname.length > 20) { ws.send(JSON.stringify({ type: "error", message: "昵称过长" })); return; }
        const room = chatRooms.get(roomId);
        if (!room) { ws.send(JSON.stringify({ type: "error", message: "房间不存在" })); return; }

        const collision = room.members.find((m) => m.name === nickname);
        if (collision) {
          const oldWs = chatMemberSockets.get(collision.id);
          if (oldWs && oldWs.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "error", message: "该昵称已被使用" })); return;
          }
          const idx = room.members.findIndex((m) => m.id === collision.id);
          if (idx !== -1) room.members.splice(idx, 1);
          chatMemberSockets.delete(collision.id);
        }
        if (memberId && currentRoomId) leaveChatRoom(memberId, currentRoomId);

        memberId = generateId(); memberName = nickname; currentRoomId = roomId;
        chatMemberSockets.set(memberId, ws);
        room.members.push({ id: memberId, name: nickname });

        ws.send(JSON.stringify({ type: "room-joined", roomId: room.id, roomName: room.name, members: room.members.map((m) => ({ id: m.id, name: m.name })), messages: room.messages, yourId: memberId }));
        broadcastChat(roomId, { type: "member-joined", member: { id: memberId, name: nickname } }, memberId);
        broadcastChatRoomList();
        break;
      }

      case "create-room": {
        const { roomName, nickname } = msg;
        if (!roomName || !nickname) { ws.send(JSON.stringify({ type: "error", message: "缺少房间名或昵称" })); return; }
        if (roomName.length > 50) { ws.send(JSON.stringify({ type: "error", message: "房间名过长" })); return; }
        if (memberId && currentRoomId) leaveChatRoom(memberId, currentRoomId);

        memberId = generateId(); memberName = nickname;
        chatMemberSockets.set(memberId, ws);
        const room = createChatRoom(roomName.trim());
        currentRoomId = room.id;
        room.members.push({ id: memberId, name: nickname });

        ws.send(JSON.stringify({ type: "room-created", roomId: room.id, roomName: room.name, members: room.members.map((m) => ({ id: m.id, name: m.name })), yourId: memberId }));
        broadcastChatRoomList();
        break;
      }

      case "leave-room":
        leaveChatRoom(memberId, currentRoomId);
        currentRoomId = null; memberId = null;
        break;

      case "message": {
        if (!memberId || !currentRoomId) return;
        const { text, clientMsgId } = msg;
        if (!text || !text.trim()) return;
        const chatMsg = { id: generateId(), type: "text", senderId: memberId, senderName: memberName, text: text.trim(), timestamp: Date.now(), clientMsgId };
        addChatMessage(currentRoomId, chatMsg);
        broadcastChat(currentRoomId, { ...chatMsg, type: "message" });
        break;
      }

      case "file-shared": {
        if (!memberId || !currentRoomId) return;
        const { fileName, fileSize, url, clientMsgId } = msg;
        if (!fileName || !url) return;
        try {
          const parsed = new URL(url);
          if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
        } catch { return; }
        const chatMsg = { id: generateId(), type: "file", senderId: memberId, senderName: memberName, fileName, fileSize: fileSize || 0, url, timestamp: Date.now(), clientMsgId };
        addChatMessage(currentRoomId, chatMsg);
        broadcastChat(currentRoomId, { ...chatMsg, type: "file-shared" });
        break;
      }

      case "typing": {
        if (!memberId || !currentRoomId) return;
        broadcastChat(currentRoomId, { type: "typing", senderId: memberId, isTyping: !!msg.isTyping }, memberId);
        break;
      }
    }
    } catch {
      safeSend(ws, { type: "error", message: "服务器内部错误" });
    }
  });

  ws.on("close", () => leaveChatRoom(memberId, currentRoomId));
  ws.on("error", () => leaveChatRoom(memberId, currentRoomId));
}

// ──────────────────────────────────────────────────────────────
//  HTTP Server + WebSocket Setup
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
//  P2P 文件传输信令 — State & Handlers
// ──────────────────────────────────────────────────────────────

const p2pRooms = new Map(); // roomCode -> { peers: [{id, ws, name}] }
const p2pSockets = new Set(); // all connected P2P WS (for broadcasting room list)
const P2P_ROOM_TTL = 5 * 60 * 1000; // 5 minutes
const p2pCleanupTimers = new Map(); // roomCode -> cleanup timer

function generateRoomCodeShort() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 100; attempt++) {
    let code = "";
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    if (!p2pRooms.has(code)) return code;
  }
  return "FILE";
}

function broadcastP2PRoomList() {
  const available = [];
  for (const [code, room] of p2pRooms) {
    if (room.peers.length < 2) {
      available.push({
        roomCode: code,
        peerName: room.peers[0]?.name || "未知",
        createdAt: room.createdAt || Date.now(),
      });
    }
  }
  for (const sock of p2pSockets) {
    safeSend(sock, { type: "room-list", rooms: available });
  }
}

function scheduleP2PRoomCleanup(roomCode) {
  cancelP2PRoomCleanup(roomCode);
  p2pCleanupTimers.set(roomCode, setTimeout(() => {
    p2pCleanupTimers.delete(roomCode);
    if (p2pRooms.has(roomCode)) {
      const room = p2pRooms.get(roomCode);
      if (room && room.peers.length < 2) {
        p2pRooms.delete(roomCode);
        broadcastP2PRoomList();
      }
    }
  }, P2P_ROOM_TTL));
}

function cancelP2PRoomCleanup(roomCode) {
  const existing = p2pCleanupTimers.get(roomCode);
  if (existing) {
    clearTimeout(existing);
    p2pCleanupTimers.delete(roomCode);
  }
}

function handleP2PConnection(ws) {
  let peerId = null;
  let currentRoom = null;
  setupPingPong(ws);
  p2pSockets.add(ws);

  const sendToPeer = (targetPeerId, msg) => {
    const peer = currentRoom?.peers.find((p) => p.id === targetPeerId);
    safeSend(peer?.ws, msg);
  };

  ws.on("message", (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    try {
    switch (msg.type) {
      case "create-room": {
        if (peerId && currentRoom) leaveP2PRoom(peerId);
        peerId = generateId();
        const roomCode = generateRoomCodeShort();
        currentRoom = { code: roomCode, createdAt: Date.now(), peers: [{ id: peerId, ws, name: msg.name || "Peer" }] };
        p2pRooms.set(roomCode, currentRoom);
        scheduleP2PRoomCleanup(roomCode);
        broadcastP2PRoomList();
        ws.send(JSON.stringify({ type: "room-created", roomCode, peerId }));
        break;
      }

      case "join-room": {
        const { roomCode, name } = msg;
        if (!roomCode) { ws.send(JSON.stringify({ type: "error", message: "缺少房间号" })); return; }
        const room = p2pRooms.get(roomCode);
        if (!room) { ws.send(JSON.stringify({ type: "error", message: "房间不存在" })); return; }
        if (room.peers.length >= 2) { ws.send(JSON.stringify({ type: "error", message: "房间已满" })); return; }

        if (peerId && currentRoom) leaveP2PRoom(peerId);
        peerId = generateId();
        room.peers.push({ id: peerId, ws, name: name || "Peer" });
        currentRoom = room;

        // Notify joiner
        ws.send(JSON.stringify({
          type: "room-joined", roomCode, peerId,
          remotePeer: { id: room.peers[0].id, name: room.peers[0].name },
        }));

        // Notify existing peer that someone joined
        const joiner = room.peers[1];
        sendToPeer(room.peers[0].id, {
          type: "peer-joined",
          peerId: joiner.id,
          name: joiner.name,
        });

        // Room is now full — cancel TTL and broadcast updated list
        if (room.peers.length >= 2) {
          cancelP2PRoomCleanup(roomCode);
        }
        broadcastP2PRoomList();
        break;
      }

      case "offer": {
        if (!currentRoom || !msg.sdp) return;
        const other = currentRoom.peers.find((p) => p.id !== peerId);
        if (other) sendToPeer(other.id, { type: "offer", sdp: msg.sdp, peerId });
        break;
      }

      case "answer": {
        if (!currentRoom || !msg.sdp) return;
        const other = currentRoom.peers.find((p) => p.id !== peerId);
        if (other) sendToPeer(other.id, { type: "answer", sdp: msg.sdp, peerId });
        break;
      }

      case "ice-candidate": {
        if (!currentRoom || !msg.candidate) return;
        const other = currentRoom.peers.find((p) => p.id !== peerId);
        if (other) sendToPeer(other.id, { type: "ice-candidate", candidate: msg.candidate, peerId });
        break;
      }

      case "list-rooms": {
        const available = [];
        for (const [code, room] of p2pRooms) {
          if (room.peers.length < 2) {
            available.push({ roomCode: code, peerName: room.peers[0]?.name || "未知" });
          }
        }
        ws.send(JSON.stringify({ type: "room-list", rooms: available }));
        break;
      }

      case "leave":
        leaveP2PRoom(peerId);
        break;
    }
    } catch {
      safeSend(ws, { type: "error", message: "服务器内部错误" });
    }
  });

  ws.on("close", () => { p2pSockets.delete(ws); leaveP2PRoom(peerId); });
  ws.on("error", () => { p2pSockets.delete(ws); leaveP2PRoom(peerId); });
}

function leaveP2PRoom(peerId) {
  if (!peerId) return;
  for (const [, room] of p2pRooms) {
    const idx = room.peers.findIndex((p) => p.id === peerId);
    if (idx === -1) continue;
    const [leaver] = room.peers.splice(idx, 1);
    // Notify remaining peer
    for (const peer of room.peers) {
      if (peer.ws.readyState === WebSocket.OPEN) {
        peer.ws.send(JSON.stringify({ type: "peer-left", peerId }));
      }
    }
    if (room.peers.length === 0) {
      cancelP2PRoomCleanup(room.code);
      p2pRooms.delete(room.code);
    } else if (room.peers.length < 2) {
      // Room has 1 peer left waiting — start TTL
      scheduleP2PRoomCleanup(room.code);
    }
    broadcastP2PRoomList();
    return;
  }
}

// ──────────────────────────────────────────────────────────────
//  Exported: attach WebSocket handlers to any HTTP server
// ──────────────────────────────────────────────────────────────

export function attachWebSocket(httpServer) {
  const wssGame = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 }); // 1MB max
  const wssChat = new WebSocketServer({ noServer: true, maxPayload: 256 * 1024 }); // 256KB max
  const wssP2P = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 }); // 64KB max

  // Upgrade routing by URL path
  httpServer.on("upgrade", (request, socket, head) => {
    let pathname;
    try {
      pathname = new URL(request.url, "http://localhost").pathname;
    } catch {
      socket.destroy();
      return;
    }

    switch (pathname) {
      case "/ws/draw-guess":
        wssGame.handleUpgrade(request, socket, head, (ws) => {
          wssGame.emit("connection", ws, request);
        });
        break;
      case "/ws/chat":
        wssChat.handleUpgrade(request, socket, head, (ws) => {
          wssChat.emit("connection", ws, request);
        });
        break;
      case "/ws/p2p":
        wssP2P.handleUpgrade(request, socket, head, (ws) => {
          wssP2P.emit("connection", ws, request);
        });
        break;
      default:
        socket.destroy();
    }
  });

  // ── Game connection handler ──
  wssGame.on("connection", (ws) => {
    let playerId = null;
    let currentRoom = null;

    ws.on("message", (data) => {
      let msg;
      try { msg = JSON.parse(data.toString()); } catch { return; }

      try {
      switch (msg.type) {
        case "join": {
          const { room: roomCode, name } = msg;
          if (!roomCode || !name) {
            ws.send(JSON.stringify({ type: "error", message: "缺少房间号或昵称" })); return;
          }
          let room = gameRooms.get(roomCode);
          if (!room) {
            room = { code: roomCode, players: [], game: null };
            gameRooms.set(roomCode, room);
          }
          if (room.players.length >= 8) { ws.send(JSON.stringify({ type: "error", message: "房间已满" })); return; }
          if (room.players.some((p) => p.name === name)) { ws.send(JSON.stringify({ type: "error", message: "昵称已被使用" })); return; }

          if (playerId) leaveGameRoom(playerId);
          playerId = generateId();
          gamePlayerSockets.set(playerId, ws);
          room.players.push({ id: playerId, name, score: 0 });
          currentRoom = room;

          ws.send(JSON.stringify({ type: "joined", playerId, room: roomCode, players: room.players.map((p) => ({ id: p.id, name: p.name, score: p.score, isDrawer: room.game?.drawerId === p.id })), game: room.game ? { phase: room.game.phase, currentRound: room.game.currentRound, totalRounds: room.game.totalRounds, timeLeft: room.game.timeLeft } : null }));
          broadcastGameExcept(room, playerId, { type: "players", players: room.players.map((p) => ({ id: p.id, name: p.name, score: p.score, isDrawer: room.game?.drawerId === p.id })) });
          break;
        }

        case "start-game": {
          if (!currentRoom) return;
          if (currentRoom.players.length < 2) { ws.send(JSON.stringify({ type: "error", message: "至少需要2名玩家" })); return; }
          if (currentRoom.game?.phase === "drawing") return;
          for (const p of currentRoom.players) p.score = 0;
          currentRoom.game = createGame(currentRoom);
          startRound(currentRoom);
          break;
        }

        case "draw": {
          if (!currentRoom?.game || currentRoom.game.drawerId !== playerId) return;
          broadcastGameExcept(currentRoom, playerId, { type: "draw", stroke: msg.stroke, playerId });
          break;
        }
        case "undo": {
          if (!currentRoom?.game || currentRoom.game.drawerId !== playerId) return;
          broadcastGameExcept(currentRoom, playerId, { type: "undo", playerId });
          break;
        }
        case "clear": {
          if (!currentRoom?.game || currentRoom.game.drawerId !== playerId) return;
          broadcastGameExcept(currentRoom, playerId, { type: "clear", playerId });
          break;
        }

        case "guess": {
          if (!currentRoom?.game) return;
          const { correct } = checkGuess(currentRoom, playerId, msg.text);
          const player = currentRoom.players.find((p) => p.id === playerId);
          broadcastGame(currentRoom, { type: "guess", playerId, playerName: player?.name || "?", text: msg.text, isCorrect: correct });
          if (correct) {
            const nonDrawers = currentRoom.players.filter((p) => p.id !== currentRoom.game.drawerId);
            if (nonDrawers.length > 0 && nonDrawers.every((p) => currentRoom.game.correctGuessers.has(p.id))) {
              if (currentRoom.game.timer) { clearInterval(currentRoom.game.timer); currentRoom.game.timer = null; }
              setTimeout(() => endRound(currentRoom), 1000);
            }
          }
          break;
        }

        case "leave": leaveGameRoom(playerId); break;
      }
      } catch (err) {
        // 防止消息处理异常导致进程崩溃
        safeSend(ws, { type: "error", message: "服务器内部错误" });
      }
    });

    ws.on("close", () => { leaveGameRoom(playerId); gamePlayerSockets.delete(playerId); });
    ws.on("error", () => { leaveGameRoom(playerId); gamePlayerSockets.delete(playerId); });
  });

  // ── Chat connection handler ──
  wssChat.on("connection", (ws) => {
    handleChatConnection(ws);
  });

  // ── P2P connection handler ──
  wssP2P.on("connection", (ws) => {
    handleP2PConnection(ws);
  });
}

// ── Init default chat rooms ──
createChatRoom("大厅");

// ── Standalone entry ──
const thisFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (thisFile && fileURLToPath(import.meta.url) === thisFile) {
  const httpServer = createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, gameRooms: gameRooms.size, chatRooms: chatRooms.size, p2pRooms: p2pRooms.size }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  attachWebSocket(httpServer);

  const PORT = parseInt(process.argv[2], 10) || 3001;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 统一 WebSocket 服务器运行在 ws://0.0.0.0:${PORT}`);
    console.log(`   健康检查: http://0.0.0.0:${PORT}/health`);
    console.log(`   游戏服务: ws://0.0.0.0:${PORT}/ws/draw-guess`);
    console.log(`   群聊服务: ws://0.0.0.0:${PORT}/ws/chat`);
    console.log(`   P2P 信令: ws://0.0.0.0:${PORT}/ws/p2p`);
  });
}
