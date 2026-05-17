# Everything File Manager — Design Spec

**Date:** 2026-05-15
**Status:** Draft
**Tool ID:** `everything-files`

## Overview

基于 Everything (voidtools) HTTP 服务器的本地文件浏览工具。浏览器中搜索、浏览、下载本地文件。

Everything HTTP Server 提供只读 JSON API，Next.js API Routes 作为代理层转发请求解决 CORS。

## Feature Scope

### Core
- **文件搜索**: 支持 Everything 完整搜索语法（布尔运算、通配符、正则、ext:/size:/dm: 等过滤器）
- **目录浏览**: 点击文件夹进入，面包屑导航，通过 `parent:"path"` 查询模拟列目录
- **文件下载**: API 代理流式传输到浏览器触发下载

### Enhanced
- **收藏夹/快速访问**: localStorage 持久化路径列表，点击一键跳转
- **目录树导航**: 左侧可展开的文件夹树，节点按需加载（展开时才请求子目录）

### Out of Scope
- 文件预览（图片缩略图、文本预览等）
- 文件上传/修改/删除（Everything HTTP 只读）

## Architecture

```
Browser (useEverything hook)
    │  fetch()
    ▼
Next.js API Routes (/api/everything)
    │  http.get(EVERYTHING_HTTP_URL)
    ▼
Everything HTTP Server (default localhost:8080)
```

- **EVERYTHING_HTTP_URL** 环境变量配置 Everything HTTP 地址，如 `http://localhost:8080`
- API 路由负责：FILETIME → ISO 8601 日期转换、路径安全校验、错误处理

## Layout

搜索优先布局，三区域：

```
┌──────────────────────────────────────────┐
│  SearchBar (搜索栏 + 语法提示)             │
├────────┬─────────────────────────────────┤
│ Sidebar│  PathBar (面包屑)                │
│ ·磁盘  │  ToolBar (排序/统计)              │
│ ·收藏  │  FileList                        │
│ ·目录树│  · FileRow × N                   │
│        │  · 图标 + 名称 + 大小 + 日期 + ↓  │
├────────┴─────────────────────────────────┤
│  StatusBar (N 个结果 · 用时 Xs · 分页)     │
└──────────────────────────────────────────┘
```

## Component Tree

```
EverythingPage (page.tsx, "use client")
├── SearchBar          — 搜索输入框 + Everything 语法占位提示
├── Sidebar            — 左侧面板容器
│   ├── DriveList      — 磁盘列表 (C:\, D:\, ...)
│   ├── Favorites      — 收藏夹，+ 添加 / × 删除
│   └── DirectoryTree  — 按需加载的树形目录
├── PathBar            — 面包屑 C: > Users > netws > Desktop
├── ToolBar            — 排序切换 (名称/大小/日期 · 升降序)
├── FileList           — 文件/文件夹列表
│   └── FileRow × N    — 单行：图标 名称 大小 日期 [下载]
└── StatusBar          — "共 N 个结果 · 用时 0.02s · 第 1/5 页"
```

## API Routes

### `GET /api/everything`

转发搜索/浏览请求到 Everything HTTP。

| Query Param | Type | Description |
|---|---|---|
| `search` | string | Everything 搜索语法，空则默认 `*` |
| `path` | string | 浏览指定目录（转换为 `parent:"path"` 查询） |
| `offset` | number | 分页偏移，默认 0 |
| `count` | number | 每页条数，默认 50 |
| `sort` | string | 排序字段: name / size / date_modified，默认 name |
| `ascending` | 0/1 | 升序/降序，默认 1 |

**Response:**
```json
{
  "results": [
    {
      "name": "report.pdf",
      "path": "C:\\Users\\netws\\Desktop",
      "fullPath": "C:\\Users\\netws\\Desktop\\report.pdf",
      "size": 245760,
      "dateModified": "2026-05-15T10:30:00.000Z",
      "isFolder": false
    }
  ],
  "totalResults": 247,
  "query": "report ext:pdf",
  "elapsed": 0.02
}
```

服务端处理：FILETIME (100ns intervals since 1601-01-01) → JavaScript Date → ISO 8601 字符串。

### `GET /api/everything/download`

代理文件下载。

| Query Param | Type | Description |
|---|---|---|
| `filepath` | string | 文件完整路径 (URL 编码) |

Response: `application/octet-stream` 流式传输，`Content-Disposition: attachment`。

### `GET /api/everything/drives`

获取可用磁盘列表。查询 `*` 并提取 `path` 字段的根目录字母去重。备选：使用 Node.js `os` 模块或 Everything `root:` 搜索。

## Hook: `useEverything`

```typescript
function useEverything() {
  // State
  results: FileResult[]       // 当前文件列表
  totalResults: number        // 总结果数
  currentPath: string | null  // 当前浏览路径（null = 搜索模式）
  searchQuery: string         // 搜索关键词
  loading: boolean
  error: string | null
  elapsed: number             // 查询用时

  // Actions
  search(query: string)       // 执行搜索
  browse(path: string)        // 浏览目录
  setSort(field, ascending)   // 切换排序
  setPage(offset)             // 分页

  // Favorites (localStorage backed)
  favorites: string[]
  addFavorite(path: string)
  removeFavorite(path: string)
}
```

搜索 debounce 300ms。API 调用 3 次失败后停止并显示错误。

## File I/O (Server-Side)

### `src/lib/everything/everything-client.ts`

Server-only module:
- `searchFiles(params)` — 构造 Everything HTTP 请求 URL，发送 GET，解析 JSON
- `convertFiletime(ft)` — Windows FILETIME → JS Date
- `listDirectory(path)` — 拼接 `parent:"path"` 搜索
- `getDrives()` — 获取磁盘根目录列表
- `resolveEverythingUrl()` — 从 `process.env.EVERYTHING_HTTP_URL` 读取配置

## Files to Create / Modify

| # | File | Action |
|---|---|---|
| 1 | `src/lib/tools.ts` | Add everything-files entry |
| 2 | `src/app/tools/everything-files/page.tsx` | Create page |
| 3 | `src/components/everything-files/SearchBar.tsx` | Create |
| 4 | `src/components/everything-files/Sidebar.tsx` | Create |
| 5 | `src/components/everything-files/DriveList.tsx` | Create |
| 6 | `src/components/everything-files/Favorites.tsx` | Create |
| 7 | `src/components/everything-files/DirectoryTree.tsx` | Create |
| 8 | `src/components/everything-files/FileList.tsx` | Create |
| 9 | `src/components/everything-files/FileRow.tsx` | Create |
| 10 | `src/components/everything-files/PathBar.tsx` | Create |
| 11 | `src/components/everything-files/ToolBar.tsx` | Create |
| 12 | `src/components/everything-files/StatusBar.tsx` | Create |
| 13 | `src/hooks/useEverything.ts` | Create |
| 14 | `src/app/api/everything/route.ts` | Create (GET search/browse) |
| 15 | `src/app/api/everything/download/route.ts` | Create (GET download) |
| 16 | `src/app/api/everything/drives/route.ts` | Create (GET drives) |
| 17 | `src/lib/everything/everything-client.ts` | Create (server-side HTTP client) |
| 18 | `src/types/everything.ts` | Create (types) |
| 19 | `src/types/index.ts` | Add re-export |
| 20 | `.env.local` | Add `EVERYTHING_HTTP_URL=` |

## UI States

Each component handles:
- **Loading**: 骨架屏/旋转指示器
- **Empty**: "无结果" 提示
- **Error**: Everything HTTP 连接失败提示（检查 Everything 是否运行、HTTP 服务器是否开启）
- **Normal**: 数据展示

## Verification

1. `npx tsc --noEmit` — type check passes
2. `npm run dev` — dev server starts, navigate to `/tools/everything-files`
3. With Everything HTTP server enabled (Tools → Options → HTTP Server → Enable):
   - Search for files, verify results appear
   - Click a folder, verify directory browsing works
   - Click download, verify file downloads
   - Add/remove favorites, verify localStorage persistence
   - Navigate directory tree, verify lazy loading
4. Without Everything running: verify error state shows connection failure message
