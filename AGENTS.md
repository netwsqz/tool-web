# AGENTS.md

万能工具箱 — local-first personal toolbox. 浅色 Liquid Glass (iOS 26 风格), zh-CN, modular.

## Commands

- `npm run dev` — dev server (Next.js + WebSocket, unified port)
- `npm run build` / `npm run start` — production
- `npm run ws-server` — standalone WS server (fallback)
- `npm run dev-next` — legacy: Next.js only
- `npx next lint` — lint

## Stack

Next.js 15 App Router, TypeScript strict, Tailwind CSS v4, **GSAP 3.12+**, `ws`, `marked`, `highlight.js`. System deps: ffmpeg, yt-dlp. Everything HTTP server (Windows). Path alias `@/*` → `./src/*`.

## 模块索引

### 工具 → Hook → 组件 → 后端

| 工具 | hook | components/ | API/WS |
|------|------|-------------|--------|
| bilibili-download | useDownload | download/ | `POST /api/download/parse`, `POST /api/download`, `GET /api/download/[taskId]` |
| draw-guess | useDrawing | draw-guess/ | WS `/ws/draw-guess` |
| everything-files | useEverything | everything-files/ | `GET /api/everything` (search/browse), `/content`, `/preview`, `/download` |
| file-transfer | useFileTransfer | file-transfer/ | `GET/POST /api/files`, `GET /api/files/[filename]` |
| fruit-slice | useFruitSlice | fruit-slice/ | 纯客户端 (Canvas 2D) |
| group-chat | useGroupChat | group-chat/ | WS `/ws/chat`, `POST /api/chat/upload` |
| media | useMediaTask | media/ | `POST /api/media`, `GET /api/media/[taskId]`, upload/download |
| metronome | useMetronome | metronome/ | 纯客户端 |
| music-player | useMusicPlayer | music-player/ | `POST /api/music/upload`, `GET/DELETE /api/music/library` |
| obsidian | useObsidian | obsidian/ | `/api/obsidian/files` (CRUD), `/api/obsidian/search` |
| p2p-transfer | useP2PTransfer | p2p-transfer/ | WS `/ws/p2p` + WebRTC |
| piano | usePiano | piano/ | 纯客户端 |
| qr-code | useQR | qr/ | 纯客户端 (`qrcode` + `qr-scanner`) |
| system | useSystemStats | system/ | `GET /api/system/stats` |
| todo | useTodo | todo/ | 纯客户端 (localStorage) |

### 服务端模块 (勿 import 到客户端)

| 模块 | 路径 | 功能 |
|------|------|------|
| 下载管理 | `src/lib/download/download-manager.ts` | 任务编排/轮询/取消 |
| yt-dlp | `src/lib/download/ytdlp.ts` | 视频解析/下载 |
| 下载存储 | `src/lib/download/download-storage.ts` | 文件系统管理 |
| FFmpeg | `src/lib/media/ffmpeg.ts` | 8种任务类型参数构建 |
| 媒体任务 | `src/lib/media/task-manager.ts` | 单并发任务编排 |
| 媒体存储 | `src/lib/media/media-storage.ts` | 输入/输出目录 |
| Everything | `src/lib/everything/everything-client.ts` | HTTP API 客户端 |
| 系统监控 | `src/lib/system/system-monitor.ts` | os+wmic 数据采集 |
| Obsidian 存储 | `src/lib/obsidian/obsidian-storage.ts` | md 文件 CRUD/搜索 |
| 文件存储 | `src/lib/storage.ts` | public/uploads/ 文件管理 |
| 聊天存储 | `src/lib/chat/storage.ts` | 聊天附件存储 |
| WS 服务器 | `server/ws-server.mjs` | 统一 WS (画板/聊天/P2P) |
| 音乐存储 | `src/lib/music/music-storage.ts` | public/uploads/music/ 音频+封面持久化 |
| 开发服务器 | `server/dev.mjs` | Next.js+WS 统一端口 |

### 音频引擎 (纯客户端)

| 引擎 | 路径 | 用途 |
|------|------|------|
| MetronomeEngine | `src/lib/audio/engine.ts` | Web Audio 节拍调度 |
| PianoEngine | `src/lib/audio/piano-engine.ts` | 3种乐器合成器 |
| PlayerEngine | `src/lib/audio/player-engine.ts` | 音乐播放+频谱分析 |

### 动画引擎

| 模块 | 路径 | 导出 |
|------|------|------|
| GSAP helpers | `src/lib/animations/index.ts` | `animateIn`, `animateScaleIn`, `staggerIn`, `scrollStagger`, `pageEnter`, `pageExit`, `hoverLift`, `hoverReset`, `pressScale`, `releaseScale`, `drawerOpen`, `drawerClose`, `pulseRing`, `killScrollTriggers` |
| React hooks | `src/lib/animations/hooks.ts` | `useGSAP(scopeFn, deps)` — gsap.context + 自动 cleanup |

所有动画 helper 内置 `prefers-reduced-motion` 检测 → 直接跳过。已注册插件: `ScrollTrigger`, `Flip`, `SplitText`。

### 类型定义

`src/types/index.ts` 重导出所有子模块: `download.ts`, `everything.ts`, `fruit-slice.ts`, `media.ts`, `music-player.ts`, `p2p.ts`, `piano.ts`, `qr.ts`, `todo.ts`

### 游戏逻辑

- 画板猜词: `src/lib/draw-guess/` — `game-engine.ts`(状态/计分), `words.ts`(200+中文词), `types.ts`(共享类型)
- 水果忍者: `src/lib/fruit-slice/` — `game-engine.ts`(Canvas 循环/碰撞), `entities.ts`(8种水果+炸弹绘制), `particles.ts`(粒子), `canvas-renderer.ts`(合成), `sound-engine.ts`(Web Audio)

## 架构

- **入口:** `src/lib/tools.ts` → `ToolConfig[]` → 首页 `ToolCard` + 侧边栏
- **Hook 模式:** 每工具一个 hook (`src/hooks/use<Feature>.ts`) 总揽全局状态, 组件纯 props
- **UI 规范:** 所有交互组件处理 normal/empty/loading/error/disabled; hook 初始 `loading: true`
- **文件预览:** `createPortal` 渲染到 `document.body`(避免层叠上下文), 右侧抽屉, 按扩展名分流(image/audio/video/text/markdown/pdf)
- **动画:** `src/lib/animations/` GSAP helpers 统一管理; `PageTransition` 包裹页面路由切换; `prefers-reduced-motion` → 零时长
- **图标:** `src/components/ui/iconMap.ts` 集中注册 Lucide 图标, 工具通过 `tool.icon` 字符串查找
- **WS 架构:** 单服务器 3 路径复用, 内存状态, 无数据库

### 主题变量 (CSS)

`globals.css` 中 `@theme` 块定义，所有组件用 `var(--color-*)` 引用：

| 分类 | 变量 | 值 |
|------|------|------|
| 背景 | `--color-bg-deep/base/elevated` | `#f5f5f7` / `#ffffff` / `#fafafa` |
| 表面 | `--color-surface/hover/active` | `rgb(255 255 255 / 0.72)` + `backdrop-filter` 磨砂 |
| 前景 | `--color-foreground/muted/subtle` | `#1d1d1f` / `#6e6e73` / `#aeaeb2` |
| 强调 | `--color-accent/hover/glow/grad` | Apple System Blue `#007AFF`, 渐变 `→#5856D6` |
| 语义 | `--color-success/warning/destructive` | 绿/黄/红 |
| 边框 | `--color-border/hover` | `rgb(0 0 0 / 0.06)` |
| 阴影 | `--elevation-1/2/3` | 3 级阴影 token |

### 公共组件 (`src/components/ui/`)

| 组件 | 用途 |
|------|------|
| `ToolLayout` | 工具页面外壳: 标题+描述+内容区, `maxWidth` 控制宽 (named export) |
| `ToolCard` | 首页工具卡片, icon 从 `iconMap` 查找 |
| `iconMap` | Lucide 图标注册表, PascalCase 键 + kebab-case 别名 |
| `Sidebar` | 左侧导航, sticky 固定, 按 category 分组, GSAP 活跃指示器 |
| `GlassPanel` | Liquid Glass 容器 (CSS Module), 彩虹描边+顶部高光+折射模糊 |
| `PageTransition` | 页面切换 GSAP 动画, 包在 page 组件外层 |
| `AppShell` | 整体布局: Sidebar + 主内容区 |

### 路径作用域规则

`.Codex/rules/` 下的规则按模块拆分，仅操作匹配路径时加载：

`everything-files.md` · `file-transfer.md` · `group-chat.md` · `media.md` · `music-player.md` · `p2p-transfer.md` · `download.md`

### 扩展指南

**新工具:**
1. `src/lib/tools.ts` 注册 `ToolConfig` (icon 用 PascalCase Lucide 名)
2. `src/app/tools/<id>/page.tsx` 建页面
3. `src/components/ui/iconMap.ts` 注册图标 (PascalCase + kebab-case 别名)

**新媒体任务:** `MediaTaskType` 加枚举 → `buildArgs` 加 case → 表单 → API 校验

### Token 优化

见 `@RTK.md` — hook 自动代理所有命令。RTK 输出被过滤, `npx tsc --noEmit` 只显示失败行。
