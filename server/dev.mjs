/**
 * 万能工具箱 — 统一开发服务器
 * 将 Next.js + WebSocket 运行在同一端口 (3000)
 * Usage: node server/dev.mjs
 */

import { createServer } from "http";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const next = require("next");
const { attachWebSocket } = await import("./ws-server.mjs");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname: "0.0.0.0", port: 3000 });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  attachWebSocket(server);

  server.listen(3000, "0.0.0.0", () => {
    console.log(`🌐 统一开发服务器运行在 http://0.0.0.0:3000`);
    console.log(`   Next.js + WebSocket (游戏/群聊/P2P 信令)`);
  });
});
