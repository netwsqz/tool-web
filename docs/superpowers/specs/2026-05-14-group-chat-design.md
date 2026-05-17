# 局域网群聊模块设计

## 概述

为万能工具箱添加一个基于 WebSocket 的局域网群聊模块，支持多房间、文字聊天和文件分享。复用现有的 WebSocket 基础设施和文件上传模式。

## 架构

```
┌──────────────┐   HTTP (页面)    ┌──────────────┐
│ 浏览器 A:3000  │ ──────────────→ │  Next.js 服务  │
│              │                  │  (npm run dev) │
│ 浏览器 B:3000  │                  └──────────────┘
│              │
│ 浏览器 C:3000  │   WS ws://hostname:3002
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│  Chat WS Server  │  :3002
│  rooms[]         │  多房间 · 内存状态 · 无持久化
└─────────────────┘
```

### 自动发现

- Chat Server 运行在 `:3002`
- 客户端通过 `window.location.hostname` 推断 WS 地址（同机部署）
- 连接后自动获取房间列表，无需手动输入房间号
- 提供备选手动地址输入，支持跨机连接

## WebSocket 协议

### 客户端 → 服务端

| type | payload | 说明 |
|------|---------|------|
| `create-room` | `{ roomName, nickname }` | 创建房间并加入 |
| `join-room` | `{ roomId }` | 加入已有房间 |
| `leave-room` | — | 离开当前房间 |
| `message` | `{ text }` | 发送文字消息 |
| `file-shared` | `{ fileName, fileSize, url }` | 分享文件链接 |
| `typing` | `{ isTyping }` | 正在输入状态 |

### 服务端 → 客户端

| type | payload | 说明 |
|------|---------|------|
| `connected` | `{ rooms, yourId }` | 初始连接成功 |
| `room-list` | `{ rooms }` | 房间列表更新 |
| `room-created` | `{ roomId, roomName, members }` | 成功创建房间 |
| `room-joined` | `{ roomId, roomName, members, messages[] }` | 成功加入房间 |
| `member-joined` | `{ member }` | 成员加入 |
| `member-left` | `{ memberId, memberName }` | 成员离开 |
| `message` | `{ id, senderId, senderName, text, timestamp }` | 文字消息 |
| `file-shared` | `{ id, senderId, senderName, fileName, fileSize, url, timestamp }` | 文件消息 |
| `typing` | `{ senderId, isTyping }` | 输入状态变化 |
| `error` | `{ message }` | 错误提示 |

## 页面 UI

### 连接页

自动连接尝试 `ws://hostname:3002`，失败时显示手动输入地址和昵称。

### 房间列表页

左侧栏展示所有可用房间（房间名 + 在线人数），右侧展示当前内容。提供"创建新房间"按钮。

### 聊天室页（三栏布局）

- **左侧**：房间列表（可折叠）
- **中间**：消息列表（底部对齐，自动滚动）+ 输入栏（文本输入 + emoji 按钮 + 文件按钮 + 发送按钮）
- **右侧**：成员列表（在线状态 + 正在输入提示）

### 消息列表

- 每条消息显示：头像（首字）、昵称、时间、正文
- 文件消息渲染为文件卡片（文件名 + 大小 + 下载按钮）
- 消息气泡样式，自己的消息在右，其他人的在左
- 滚动到底部加载最新消息

### 文件分享流程

1. 用户点击 📎 → 选择文件
2. `fetch POST /api/chat/upload` → 返回访问 URL
3. WebSocket 广播 `file-shared` 消息
4. 所有成员收到，渲染文件卡片
5. 文件存储于 `public/uploads/chat/`

### 移动端适配

窄屏时左右栏隐藏，通过汉堡菜单切换房间列表和成员列表。

## 组件结构

```
src/
├── server/
│   └── chat-server.mjs           # WS 聊天服务器 (:3002)
├── src/
│   ├── app/
│   │   ├── api/chat/
│   │   │   └── upload/
│   │   │       └── route.ts       # 文件上传 API
│   │   └── tools/group-chat/
│   │       └── page.tsx           # 聊天页面
│   ├── components/group-chat/
│   │   ├── RoomList.tsx           # 房间列表侧栏
│   │   ├── ChatArea.tsx           # 消息列表区域
│   │   ├── MessageBubble.tsx      # 单条消息气泡
│   │   ├── FileCard.tsx           # 文件分享卡片
│   │   ├── ChatInput.tsx          # 输入栏 (文本 + 文件 + 发送)
│   │   ├── MemberList.tsx         # 成员列表侧栏
│   │   └── JoinScreen.tsx         # 连接/加入界面
│   ├── hooks/
│   │   └── useGroupChat.ts        # 聊天状态管理 Hook
│   └── lib/
│       └── chat/
│           ├── types.ts           # 类型定义
│           └── storage.ts         # 文件存储 (复用 storage.ts 模式)
├── package.json                   # 添加 chat-server 脚本
└── src/lib/tools.ts               # 注册新工具
```

## 数据模型

```typescript
interface ChatMember {
  id: string;
  name: string;
  isTyping: boolean;
}

interface ChatRoom {
  id: string;
  name: string;
  members: ChatMember[];
  messages: ChatMessage[];
  createdAt: number;
}

interface ChatMessage {
  id: string;
  type: "text" | "file";
  senderId: string;
  senderName: string;
  text?: string;
  fileName?: string;
  fileSize?: number;
  url?: string;
  timestamp: number;
}
```

## 关键实现细节

- **消息上限**：每个房间保留最近 200 条消息，超出时丢弃最早的
- **空房间清理**：所有成员离开后 5 分钟删除房间
- **默认房间**：服务器启动时自动创建"大厅"房间
- **昵称唯一性**：同一房间内昵称不可重复
- **文件清理**：文件随消息存在，服务器重启后文件仍保留在磁盘但不再出现在聊天中

## 启动方式

- `npm run chat-server` — 启动聊天 WS 服务器
- `npm run dev-all` — 同时启动 Next.js + WS 游戏 + WS 聊天
- Chat Server 默认端口 3002，可通过环境变量 `CHAT_PORT` 覆盖

## 非功能需求

- 暗色玻璃态风格，与现有主题一致
- 中文界面
- 所有交互组件覆盖：正常、空态、加载、错误、禁用状态
