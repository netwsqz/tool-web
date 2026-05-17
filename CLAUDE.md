# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Dev server (Next.js, binds `0.0.0.0`)
- `npm run build` — Production build
- `npm run start` — Production server
- `npm run ws-server` — WebSocket game server (你画我猜)
- `npm run dev-all` — Start both Next.js dev server + WebSocket server
- `npx tsc --noEmit` — TypeScript check only (no build)
- `npx next lint` — Lint check

No test framework currently configured.

## Project Overview

**万能工具箱** — local-first personal toolbox website. Dark glassmorphism theme, zh-CN i18n, modular architecture. Each tool is self-contained with its own components, hooks, API routes, and lib modules. No database, no authentication, no external API dependencies.

## Architecture

### Stack

- **Framework:** Next.js 15 App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 with `@theme` custom properties
- **Markdown:** `marked` v18 + `marked-highlight` + `highlight.js`
- **Media:** Node.js `child_process` spawning ffmpeg (system-installed)
- **Path alias:** `@/*` → `./src/*`

### Tool Registry

All tools registered in `src/lib/tools.ts`. Array of `ToolConfig` objects:

```typescript
interface ToolConfig {
  id: string;             // unique identifier
  name: string;           // display name (zh-CN)
  description: string;    // short description
  icon: string;           // emoji
  path: string;           // relative URL path (empty string = coming-soon)
  status: "active" | "coming-soon";
}
```

Homepage iterates `tools` array and renders `ToolCard` for each. Active tools with a `path` get clickable `<Link>` cards. Coming-soon tools render disabled.

### Current Tools

| Tool | Route | Key Files |
|---|---|---|
| **文件快传** | `/tools/file-transfer` | `src/app/api/files/*`, `src/components/file-transfer/*`, `src/lib/storage.ts` |
| **Obsidian Lite** | `/tools/obsidian` | `src/app/api/obsidian/*`, `src/components/obsidian/*`, `src/lib/obsidian-storage.ts`, `src/lib/markdown.ts` |
| **节拍器** | `/tools/metronome` | `src/components/metronome/*`, `src/hooks/useMetronome.ts`, `src/lib/audio/*` |
| **媒体工具** | `/tools/media` | `src/app/api/media/*`, `src/components/media/*`, `src/lib/media/*`, `src/hooks/useMediaTask.ts` |
| **你画我猜** | `/tools/draw-guess` | `server/ws-server.mjs`, `src/hooks/useDrawing.ts`, `src/components/draw-guess/*`, `src/lib/draw-guess/*` |

### Complete Directory Structure

```
src/
├── app/
│   ├── layout.tsx              Root layout (zh-CN, dark body)
│   ├── page.tsx                Homepage: tool grid from registry
│   ├── globals.css             Tailwind v4 @theme + .glass + preview styles
│   ├── api/
│   │   ├── files/              File-transfer: upload/download
│   │   ├── obsidian/           Obsidian Lite: file CRUD + search
│   │   └── media/              Media tools: upload / process / status / download
│   └── tools/
│       ├── draw-guess/         你画我猜: canvas + canvas UI
│       ├── file-transfer/      Drag-drop file upload page
│       ├── metronome/           Web Audio metronome page
│       ├── obsidian/            3-panel markdown editor page
│       ├── bilibili-download/   yt-dlp video download page
│       ├── media/               Tabbed ffmpeg processing page
│   ├── ui/                     GlassPanel, ToolCard (shared primitives)
│   ├── draw-guess/            DrawingCanvas, ToolBar, ColorPicker, WordDisplay,
│   │                            GuessInput, ChatArea, PlayerList
│   ├── file-transfer/          FileDropZone, FileList
│   ├── metronome/              PlayButton, BpmControl, BeatIndicator, TapTempo
│   ├── obsidian/               FileSidebar, FileTree, MarkdownEditor, MarkdownPreview, SearchBar, ObsidianLayout
│   └── media/                  MediaLayout, MediaUploadZone, MediaFileCard, MediaTabButton,
│                                TaskProgress, TaskLogs, VideoAudioMerge, SubtitleMerge, VideoProcessing
├── hooks/
│   ├── useDrawing.ts           Canvas drawing engine (ref-based, incremental render)
│   ├── useMetronome.ts         Metronome state + engine bridge
│   ├── useObsidian.ts          File CRUD, auto-save, search, keyboard shortcuts
│   └── useMediaTask.ts         Task lifecycle: upload, start, 1s polling, cancel
├── lib/
│   ├── tools.ts                Central tool registry
│   ├── format.ts               formatSize(bytes) — browser+Node safe
│   ├── storage.ts              File-transfer: file I/O for public/uploads/
│   ├── obsidian-storage.ts     Obsidian: file I/O for data/obsidian/
│   ├── markdown.ts             Marked singleton + highlight.js integration
│   ├── draw-guess/
│   │   ├── types.ts              DrawingStroke, GameState, WS protocol types
│   │   ├── words.ts              270+ Chinese words (easy/medium/hard)
│   │   └── game-engine.ts         Score calculation, round management
│   ├── audio/
│   │   ├── engine.ts           MetronomeEngine: scheduler loop (25ms look-ahead)
│   │   └── sounds.ts           AudioContext singleton, square-wave click synth
│   └── media/
│       ├── ffmpeg.ts           FFmpeg service: detect, buildArgs, spawn, progress parse
│       ├── task-manager.ts     In-memory task lifecycle (no persistence)
│       └── media-storage.ts    File I/O for public/uploads/media/{inputs,outputs,temp}
└── types/
    ├── index.ts                ToolConfig, FileInfo, ObsidianFile, + media re-exports
    └── media.ts                MediaTask, MediaTaskConfig, FfmpegProgress, MediaMetadata
```

## Key Architecture Patterns

### 1. Server-Only Modules

Modules using `fs`/`path`/`child_process` MUST never be imported from client code. They're used by API routes only:

- `src/lib/storage.ts`
- `src/lib/obsidian-storage.ts`
- `src/lib/media/media-storage.ts`
- `src/lib/media/ffmpeg.ts`
- `src/lib/media/task-manager.ts`

Client modules import them indirectly via `fetch()` to API routes.

### 2. File I/O Pattern

Every storage module follows the same pattern:
- **Base directory** defined as module-level constant
- **`ensureDir()`** called at start of every operation
- **`resolveSafe()`** — path traversal protection via `path.resolve` + prefix check
- **`sanitizeFilename()`** — strips special chars, replaces spaces with underscores

Storage locations:
- File-transfer: `public/uploads/` (static-served)
- Obsidian: `data/obsidian/` (not in public — API-only access)
- Media inputs: `public/uploads/media/inputs/`
- Media outputs: `public/uploads/media/outputs/`
- Media temp: `public/uploads/media/temp/`

### 3. API Route Pattern

API routes follow Next.js App Router conventions. Route groups:
- File routes use `formData` for uploads
- Obsidian routes use JSON for both read and write
- Media routes use `formData` for upload, JSON for task config

### 4. FFmpeg Service (`src/lib/media/ffmpeg.ts`)

Single file owning ALL ffmpeg interaction. Key exports:
- `detectFfmpeg()` — caches result after first call. Scans PATH, then common Windows install paths (Program Files, Scoop, WinGet, C:\ffmpeg)
- `buildArgs(type, inputs, options, outputPath)` — one `switch` case per `MediaTaskType`. Path normalization to forward slashes for Windows filter compatibility
- `parseProgressLine(line)` — regex parse of ffmpeg stderr: `frame= fps= speed= time=`
- `runFfmpeg(args, callbacks)` — `spawn` with `windowsHide: true`, stderr streaming, progress callbacks. Returns `{ process, promise }`
- `parseDuration(timeStr)` — `"HH:MM:SS.ms"` to seconds

**Adding a new task type:** Add to `MediaTaskType` union → add `case` in `buildArgs` → add tab form component → add validation in API route.

### 5. Task Manager (`src/lib/media/task-manager.ts`)

In-memory singleton (module-level `Map`). No persistence — lost on server restart.
- Concurrent task guard: only one `running` or `pending` task allowed
- Progress: ffprobe reads total duration → `timeSeconds / totalDuration * 100`
- Logs: last 200 lines kept per task
- On completion: auto-cleanup input files + temp files
- On cancel: `SIGTERM` → fallback to `process.kill()`

### 6. Markdown Rendering (`src/lib/markdown.ts`)

Singleton-pattern `Marked` instance. `markedHighlight` extension for code syntax highlighting via highlight.js. GFM enabled. Called synchronously.

### 7. Central Hook Pattern

Each tool's state management lives in a single custom hook:
- `useMetronome.ts` — engine instance ref, BPM state, tap tempo, play/pause
- `useObsidian.ts` — file list, content, auto-save (2s debounce), Ctrl+S, search (300ms debounce)
- `useMediaTask.ts` — task polling (1s interval), upload, start, cancel, 3-retry on error
- `useDrawing.ts` — canvas state, ref-based pointer handlers (no stale closures), incremental draw

These hooks own ALL state. Components are pure/dumb — they receive props and call callbacks. No context providers (prop drilling through layout components).

### 8. UI Component States

All interactive components handle at minimum:
- **Normal** (default state)
- **Empty** (no data — placeholder text/icon)
- **Loading** (skeleton or spinner)
- **Error** (inline error message with dismiss)
- **Disabled** (during operations)

### 9. Auto-Save Pattern (Obsidian)

```
edit → useEffect(content, isDirty) → 2s setTimeout → PUT /api/obsidian/files
Ctrl+S → keydown handler → e.preventDefault() → immediate saveFile()
```

### 10. Task Polling Pattern (Media)

```
startTask → POST /api/media → get taskId → setInterval(1s) GET /api/media/[taskId]
  → completed/failed/cancelled → clearInterval
  → 3 consecutive errors → stop polling + show error message
```

### 11. WebSocket Game Server Pattern (你画我猜)

```
server/ws-server.mjs (Node.js, ws library)
  → room management (join/leave, 8 player limit)
  → game logic (word selection, timer, scoring, guess checking)
  → broadcasts drawing strokes, guesses, game state to all players

Client → Server:
  join, start-game, draw, undo, clear, guess, leave

Server → Client:
  joined, players, round-start, time-left, round-end, game-over
  draw, undo, clear (broadcast), guess (with isCorrect flag)
```

Server runs as a separate process (`npm run ws-server` or `npm run dev-all`). The `/tools/draw-guess` page connects via WebSocket for multiplayer; free-draw mode works offline with no server.

### 12. Canvas Drawing Pattern (`useDrawing.ts`)

```
State via refs (not useState): isDrawingRef, toolRef, colorRef, brushSizeRef
  → pointer handlers never go stale during rapid mousedown→mousemove

handlePointerDown: create currentStroke → push first point
handlePointerMove: drawSegment(lastPoint, newPoint) — incremental, no full redraw
handlePointerUp: finalize stroke → push to strokesRef → broadcast via onStroke

undo/clear/resize → redraw() — full canvas clear + replay all strokes
  Resize: snapshot ImageData before resize, restore after (avoids blank canvas)

Remote sync (multiplayer):
  addRemoteStroke → push to remoteStrokesRef → redraw()
  remoteClear → clears BOTH strokesRef + remoteStrokesRef
```

## Type System

### `src/types/index.ts`
- `ToolConfig` — tool registry shape
- `FileInfo` — basic file metadata (reused across modules)
- `ObsidianFile` — `.md` file with path/title
- `ObsidianSearchResult` — file + matching lines
- Re-exports all media types from `./media`

### `src/lib/draw-guess/types.ts`
- `DrawingStroke` — array of points + color/width/tool
- `DrawingTool` — `"pen" | "eraser"`
- `GameState` — full game state (phase, players, round, word, timer)
- `GameWord` — word entry with hint and difficulty
- `WsClientMessage` / `WsServerMessage` — WebSocket protocol types

### `src/types/media.ts`
- `MediaTaskType` — 6 task types union
- `TaskStatus` — pending/running/completed/failed/cancelled
- `MediaTask` — full task state (id, status, progress, fps, logs, etc.)
- `FfmpegProgress` — parsed from stderr line
- `MediaFileInfo` — uploaded file metadata
- `MediaTaskConfig` — client sends this to create a task
- `MediaMetadata` — ffprobe output for duration/streams

## Styling

- **Theme vars** defined in `src/app/globals.css` `@theme`: `--color-bg-primary`, `--color-bg-card`, `--color-border-card`, `--color-text-primary`, `--color-text-secondary`, `--color-accent`
- **`.glass` utility**: `background: var(--color-bg-card)` + `backdrop-filter: blur(24px)` + `border: 1px solid var(--color-border-card)`
- **Custom scrollbar**: 6px thin, transparent track, white/10 thumb
- **Markdown preview**: `.markdown-preview` class with full typography spec (h1-h6, p, code, pre, blockquote, table, img, checkbox, hr)
- **highlight.js theme**: `github-dark.css` imported in `MarkdownPreview.tsx`

## Future Extension Points

- **New tool:** Add entry to `src/lib/tools.ts`, create page at `src/app/tools/<id>/page.tsx`, follow existing modular structure
- **New media task type:** Add to `MediaTaskType` → `buildArgs` case → form component → API validation
- **Queue system:** Replace the single-task guard in `task-manager.ts` with a pending queue
- **Multi-workspace (Obsidian):** `obsidian-storage.ts` data dir becomes configurable
- **Wiki-links/tags:** `markdown.ts` singleton allows adding a custom `marked` extension
- **WebDAV sync:** `obsidian-storage.ts` functions can delegate to a sync layer under the same interface
- **GPU transcode:** Add option to `VideoProcessing.tsx`, pass to `buildArgs` for `h264_nvenc`
- **Tests:** No test infrastructure yet — vitest or jest can be added alongside the modular lib

## Conventions

- zh-CN for all UI text and API error messages
- Tool pages: back link → title → description → content
- Feature-organized components: `src/components/<feature>/`
- Pure/dumb components with typed props interfaces
- CSS custom properties over Tailwind arbitrary values for theme colors
- No database, no Redux, no large frameworks — prefer Node.js built-ins
