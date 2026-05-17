# 一键启动脚本设计

## 概述

在项目根目录创建 `start.bat`，用户双击即可同时启动三个服务：Next.js 开发服务器、WebSocket 游戏服务器、WebSocket 聊天服务器。

## 具体行为

1. **启动前检查**：检测 `node_modules` 是否存在，不存在则运行 `npm install`
2. **并行启动**：用 `start /B` 将 ws-server 和 chat-server 后台化到同一终端窗口；Next.js 开发服务器前台运行
3. **统一退出**：前台 Next.js 进程被 Ctrl+C 中断后，通过 `taskkill //T //F` 清理所有后台进程

## 涉及的服务

| 服务 | 命令 | 端口 |
|---|---|---|
| Next.js 开发服务器 | `next dev -H 0.0.0.0` | 3000 |
| WebSocket 游戏服务器 | `node server/ws-server.mjs` | 3001 |
| WebSocket 聊天服务器 | `node server/chat-server.mjs` | 3002 |

## 文件

- `start.bat` — 一键启动批处理文件
