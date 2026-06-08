/**
 * 万能工具箱 — 生产环境统一服务器
 * Next.js 生产构建 + WebSocket，单端口 (3000)
 * Usage: node server/prod.mjs
 */
import { createServer } from "http";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const next = require("next");
const { attachWebSocket } = await import("./ws-server.mjs");

const app = next({ dev: false, hostname: "0.0.0.0", port: 3000 });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  attachWebSocket(server);

  server.listen(3000, "0.0.0.0", () => {
    console.log(`🌐 生产服务器运行在 http://0.0.0.0:3000`);
    console.log(`   Next.js + WebSocket (游戏/群聊/P2P 信令)`);
  });
});
