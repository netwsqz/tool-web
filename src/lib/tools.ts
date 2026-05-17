import type { ToolConfig } from "@/types";

export const tools: ToolConfig[] = [
  // ── 文件工具 ──
  {
    id: "file-transfer",
    name: "文件快传",
    description: "拖拽上传 · 局域网共享",
    icon: "Upload",
    path: "/tools/file-transfer",
    status: "active",
    category: "file",
  },
  {
    id: "everything-files",
    name: "文件管理",
    description: "本地文件搜索浏览 · Everything 引擎",
    icon: "FolderOpen",
    path: "/tools/everything-files",
    status: "active",
    category: "file",
  },

  // ── 媒体工具 ──
  {
    id: "media",
    name: "媒体工具",
    description: "视频音频处理 · FFmpeg 引擎",
    icon: "Clapperboard",
    path: "/tools/media",
    status: "active",
    category: "media",
  },
  {
    id: "bilibili-download",
    name: "视频下载",
    description: "视频解析下载 · yt-dlp 引擎",
    icon: "Download",
    path: "/tools/bilibili-download",
    status: "active",
    category: "media",
  },
  {
    id: "piano",
    name: "在线钢琴",
    description: "交互式钢琴 · Web Audio 引擎",
    icon: "Piano",
    path: "/tools/piano",
    status: "active",
    category: "media",
  },

  // ── 创意工具 ──
  {
    id: "obsidian",
    name: "Obsidian Lite",
    description: "Markdown 知识库 · 本地文件系统",
    icon: "FileText",
    path: "/tools/obsidian",
    status: "active",
    category: "creative",
  },
  {
    id: "draw-guess",
    name: "你画我猜",
    description: "绘图板 · 局域网联机猜词",
    icon: "Palette",
    path: "/tools/draw-guess",
    status: "active",
    category: "creative",
  },

  // ── 系统工具 ──
  {
    id: "system",
    name: "系统监控",
    description: "CPU · 内存 · 磁盘",
    icon: "Monitor",
    path: "/tools/system",
    status: "active",
    category: "system",
  },
  {
    id: "metronome",
    name: "节拍器",
    description: "在线节拍器 · Web Audio",
    icon: "Timer",
    path: "/tools/metronome",
    status: "active",
    category: "system",
  },
  {
    id: "group-chat",
    name: "群聊",
    description: "局域网多房间聊天 · 文件分享",
    icon: "MessageCircle",
    path: "/tools/group-chat",
    status: "active",
    category: "system",
  },
  {
    id: "ai",
    name: "AI 工具",
    description: "智能助手 · 即将推出",
    icon: "Sparkles",
    path: "",
    status: "coming-soon",
    category: "system",
  },
];
