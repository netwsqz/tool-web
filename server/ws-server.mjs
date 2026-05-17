/**
 * 你画我猜 — WebSocket 游戏服务器
 * Usage: node server/ws-server.mjs [port]
 * Default port: 3001
 */

import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { WebSocketServer, WebSocket } = require("ws");

// ─── Word bank ──────────────────────────────────────────────
const WORDS = [
  // Easy
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

  // Medium
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

  // Hard
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

// ─── Game config ────────────────────────────────────────────
const DRAW_TIME = 80; // seconds
const TOTAL_ROUNDS = 3;

// ─── State ──────────────────────────────────────────────────
const rooms = new Map(); // roomCode -> { players, game }
const playerSockets = new Map(); // playerId -> ws

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 100; attempt++) {
    let code = "";
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    if (!rooms.has(code)) return code;
  }
  return "GAME";
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// ─── Game Logic ─────────────────────────────────────────────
function createGame(room) {
  return {
    phase: "lobby", // lobby | drawing | round-end | game-over
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

  if (game.currentRound >= game.totalRounds * players.length) {
    endGame(room);
    return;
  }

  const drawer = players[game.drawerIndex % players.length];
  const wordEntry = game.words[game.currentRound];

  game.phase = "drawing";
  game.drawerId = drawer.id;
  game.currentWord = wordEntry.word;
  game.currentHint = wordEntry.hint;
  game.timeLeft = DRAW_TIME;
  game.correctGuessers = new Set();

  // Clear canvas for new round
  broadcast(room, { type: "clear", playerId: "server" });

  // Notify all — drawer gets word, guessers get hint only
  for (const p of players) {
    const isDrawer = p.id === drawer.id;
    send(p.id, {
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

  // Start countdown
  if (game.timer) clearInterval(game.timer);
  game.timer = setInterval(() => {
    game.timeLeft--;
    broadcast(room, { type: "time-left", timeLeft: game.timeLeft });

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
  if (game.timer) {
    clearInterval(game.timer);
    game.timer = null;
  }

  // Calculate scores
  const drawerId = game.drawerId;
  const players = room.players;
  const scores = { ...game.scores };

  // Drawer gets points per correct guess + speed bonus
  const correctCount = game.correctGuessers.size;
  const speedRatio = game.timeLeft / DRAW_TIME;
  const drawerBonus = Math.max(0, Math.floor(speedRatio * 50));
  scores[drawerId] = (scores[drawerId] || 0) + correctCount * 50 + drawerBonus;

  // Guessers get points for correct answer
  for (const guesserId of game.correctGuessers) {
    const speedBonus = Math.max(0, Math.floor(speedRatio * 100));
    scores[guesserId] = (scores[guesserId] || 0) + 100 + speedBonus;
  }

  game.scores = scores;

  // Update player scores
  for (const p of players) {
    p.score = scores[p.id] || 0;
  }

  game.phase = "round-end";

  broadcast(room, {
    type: "round-end",
    word: game.currentWord,
    scores,
    players: players.map((p) => ({ id: p.id, name: p.name, score: p.score })),
  });

  // Next round after delay
  setTimeout(() => {
    if (room.game && room.game.phase !== "game-over") {
      startRound(room);
    }
  }, 4000);
}

function endGame(room) {
  const game = room.game;
  if (game.timer) {
    clearInterval(game.timer);
    game.timer = null;
  }

  game.phase = "game-over";
  const scores = game.scores;
  let winner = null;
  let maxScore = -1;
  for (const [id, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      winner = id;
    }
  }
  const winnerName = room.players.find((p) => p.id === winner)?.name || "";

  broadcast(room, {
    type: "game-over",
    scores,
    winner,
    winnerName,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
    })),
  });
}

function checkGuess(room, playerId, text) {
  const game = room.game;
  if (game.phase !== "drawing") return { correct: false };
  if (playerId === game.drawerId) return { correct: false };
  if (game.correctGuessers.has(playerId)) return { correct: false };

  // Check if guess contains the word
  const guess = text.trim().toLowerCase();
  const word = game.currentWord.toLowerCase();
  const isCorrect = guess === word || guess.includes(word) || word.includes(guess);

  if (isCorrect) {
    game.correctGuessers.add(playerId);
  }

  return { correct: isCorrect };
}

// ─── WebSocket helpers ──────────────────────────────────────
function send(playerId, msg) {
  const ws = playerSockets.get(playerId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(room, msg) {
  for (const p of room.players) {
    send(p.id, msg);
  }
}

function broadcastExcept(room, exceptPlayerId, msg) {
  for (const p of room.players) {
    if (p.id !== exceptPlayerId) {
      send(p.id, msg);
    }
  }
}

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
const PORT = parseInt(process.argv[2], 10) || 3001;
const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws) => {
  let playerId = null;
  let currentRoom = null;

  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case "join": {
        const { room: roomCode, name } = msg;
        if (!roomCode || !name) {
          ws.send(JSON.stringify({ type: "error", message: "缺少房间号或昵称" }));
          return;
        }

        // Create or find room
        let room = rooms.get(roomCode);
        if (!room) {
          room = { code: roomCode, players: [], game: null };
          rooms.set(roomCode, room);
        }

        if (room.players.length >= 8) {
          ws.send(JSON.stringify({ type: "error", message: "房间已满 (最多8人)" }));
          return;
        }

        // Check if name is taken
        if (room.players.some((p) => p.name === name)) {
          ws.send(JSON.stringify({ type: "error", message: "昵称已被使用" }));
          return;
        }

        // Leave previous room if any
        if (playerId) {
          leaveRoom(playerId);
        }

        playerId = generateId();
        playerSockets.set(playerId, ws);

        const player = { id: playerId, name, score: 0 };
        room.players.push(player);
        currentRoom = room;

        ws.send(
          JSON.stringify({
            type: "joined",
            playerId,
            room: roomCode,
            players: room.players.map((p) => ({
              id: p.id,
              name: p.name,
              score: p.score,
              isDrawer: room.game?.drawerId === p.id,
            })),
            game: room.game
              ? {
                  phase: room.game.phase,
                  currentRound: room.game.currentRound,
                  totalRounds: room.game.totalRounds,
                  timeLeft: room.game.timeLeft,
                }
              : null,
          })
        );

        broadcastExcept(room, playerId, {
          type: "players",
          players: room.players.map((p) => ({
            id: p.id,
            name: p.name,
            score: p.score,
            isDrawer: room.game?.drawerId === p.id,
          })),
        });

        console.log(`[+] ${name} joined ${roomCode} (${room.players.length} players)`);
        break;
      }

      case "start-game": {
        if (!currentRoom) return;
        const room = currentRoom;
        if (room.players.length < 2) {
          ws.send(
            JSON.stringify({ type: "error", message: "至少需要2名玩家" })
          );
          return;
        }
        if (room.game && room.game.phase === "drawing") return;

        // Reset scores
        for (const p of room.players) p.score = 0;

        room.game = createGame(room);
        console.log(`[+] Game started in ${room.code}`);
        startRound(room);
        break;
      }

      case "draw": {
        if (!currentRoom || !currentRoom.game) return;
        const room = currentRoom;
        if (room.game.drawerId !== playerId) return;
        broadcastExcept(room, playerId, {
          type: "draw",
          stroke: msg.stroke,
          playerId,
        });
        break;
      }

      case "undo": {
        if (!currentRoom || !currentRoom.game) return;
        const room = currentRoom;
        if (room.game.drawerId !== playerId) return;
        broadcastExcept(room, playerId, {
          type: "undo",
          playerId,
        });
        break;
      }

      case "clear": {
        if (!currentRoom || !currentRoom.game) return;
        const room = currentRoom;
        if (room.game.drawerId !== playerId) return;
        broadcastExcept(room, playerId, {
          type: "clear",
          playerId,
        });
        break;
      }

      case "guess": {
        if (!currentRoom || !currentRoom.game) return;
        const room = currentRoom;
        const { correct } = checkGuess(room, playerId, msg.text);
        const player = room.players.find((p) => p.id === playerId);

        broadcast(room, {
          type: "guess",
          playerId,
          playerName: player?.name || "?",
          text: msg.text,
          isCorrect: correct,
        });

        // Check if all non-drawer players have guessed correctly
        if (correct) {
          const nonDrawers = room.players.filter(
            (p) => p.id !== room.game.drawerId
          );
          if (
            nonDrawers.length > 0 &&
            nonDrawers.every((p) => room.game.correctGuessers.has(p.id))
          ) {
            // Everyone got it — end round early
            if (room.game.timer) {
              clearInterval(room.game.timer);
              room.game.timer = null;
            }
            setTimeout(() => endRound(room), 1000);
          }
        }
        break;
      }

      case "leave": {
        leaveRoom(playerId);
        break;
      }
    }
  });

  ws.on("close", () => {
    leaveRoom(playerId);
    playerSockets.delete(playerId);
  });

  ws.on("error", () => {
    leaveRoom(playerId);
    playerSockets.delete(playerId);
  });
});

function leaveRoom(playerId) {
  if (!playerId) return;
  // Find room containing this player
  for (const [, room] of rooms) {
    const idx = room.players.findIndex((p) => p.id === playerId);
    if (idx === -1) continue;

    const player = room.players[idx];
    room.players.splice(idx, 1);
    playerSockets.delete(playerId);

    console.log(`[-] ${player.name} left ${room.code} (${room.players.length} players)`);

    if (room.players.length === 0) {
      // Clean up empty room
      if (room.game && room.game.timer) {
        clearInterval(room.game.timer);
      }
      rooms.delete(room.code);
      console.log(`[x] Room ${room.code} deleted`);
      return;
    }

    // If game was in progress, handle drawer leaving
    if (room.game && room.game.phase === "drawing") {
      if (room.game.drawerId === playerId) {
        // Drawer left — end current round
        if (room.game.timer) {
          clearInterval(room.game.timer);
          room.game.timer = null;
        }
        endRound(room);
      }
    }

    // Notify remaining players
    broadcast(room, {
      type: "players",
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        isDrawer: room.game?.drawerId === p.id,
      })),
    });
    return;
  }
}

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🎨 你画我猜 WebSocket 服务器运行在 ws://0.0.0.0:${PORT}`);
  console.log(`   健康检查: http://0.0.0.0:${PORT}/health`);
});
