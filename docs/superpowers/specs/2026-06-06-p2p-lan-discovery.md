# P2P 局域网房间发现 + 快速连接优化

## 目标
两人在同一局域网时，A 创建房间 → B 点「搜索」即可看到房间并加入，无需手动输入房间号。

## 改动清单

### 1. 服务端 `server/ws-server.mjs` — P2P 新增 list-rooms 信令

在 `handleP2PConnection` 的 switch 中新增一个 case：

```js
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
```

- 只返回 `peers.length < 2` 的房间（即还有空位的）
- 包含创建者的昵称和房间号，方便用户识别

### 2. `src/hooks/useP2PTransfer.ts` — 新增 searchRooms + availableRooms

**新增返回值：**
```ts
availableRooms: { roomCode: string; peerName: string }[]
searchRooms: () => void
isSearching: boolean
```

**新增 state：**
```ts
const [availableRooms, setAvailableRooms] = useState<{ roomCode: string; peerName: string }[]>([]);
const [isSearching, setIsSearching] = useState(false);
```

**新增 action：**
```ts
const searchRooms = useCallback(() => {
  if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
    connectSignaling();
    // Wait for connection, then send
    waitForWsOpen(wsRef.current!).then(() => {
      setIsSearching(true);
      wsRef.current!.send(JSON.stringify({ type: "list-rooms" }));
    });
    return;
  }
  setIsSearching(true);
  wsRef.current!.send(JSON.stringify({ type: "list-rooms" }));
}, [connectSignaling]);
```

**WS message handler 新增：**
```js
case "room-list": {
  setAvailableRooms(msg.rooms || []);
  setIsSearching(false);
  break;
}
```

### 3. `src/components/p2p-transfer/PeerConnect.tsx` — 新增搜索面板

**新增 Props：**
```ts
availableRooms: { roomCode: string; peerName: string }[]
isSearching: boolean
onSearchRooms: () => void
```

**在 idle 状态下新增 UI：**
- 昵称输入框下方加一个「搜索局域网房间」按钮
- 点击后显示搜索中动画，完成后展示可用房间列表
- 每个房间显示创建者昵称 + 「加入」按钮
- 点击「加入」→ 调用 `onJoinRoom(roomCode)`

```tsx
{/* 搜索按钮 */}
<button
  type="button"
  onClick={onSearchRooms}
  disabled={isSearching}
  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium
    border border-dashed border-[var(--color-border)]
    text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]
    hover:border-[var(--color-accent)]/30 transition-all"
>
  {isSearching ? (
    <span className="flex items-center justify-center gap-2">
      <div className="size-3 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
      搜索中...
    </span>
  ) : "搜索局域网房间"}
</button>

{/* 房间列表 */}
{availableRooms.length > 0 && (
  <div className="space-y-2">
    {availableRooms.map((room) => (
      <div key={room.roomCode}
        className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]"
      >
        <div>
          <span className="text-sm font-mono tracking-widest">{room.roomCode}</span>
          <span className="text-xs text-[var(--color-foreground-muted)] ml-2">
            {room.peerName}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onJoinRoom(room.roomCode)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium
            bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity"
        >
          加入
        </button>
      </div>
    ))}
  </div>
)}
```

### 4. `src/app/tools/p2p-transfer/page.tsx` — 透传新 props

```tsx
<PeerConnect
  ...
  availableRooms={p2p.availableRooms}
  isSearching={p2p.isSearching}
  onSearchRooms={p2p.searchRooms}
/>
```

### 数据流

```
A 点击「创建房间」
  → WS 连接 → {type:"create-room"}
  → 服务端创建 room，存到 p2pRooms Map
  → 返回 {type:"room-created", roomCode:"ABCD"}

B 点击「搜索局域网房间」
  → WS 连接 → {type:"list-rooms"}
  → 服务端遍历 p2pRooms，返回 {type:"room-list", rooms: [{roomCode:"ABCD", peerName:"A"}]}
  → B 看到 A 的房间
  → B 点击「加入」
  → {type:"join-room", roomCode:"ABCD", name:"B"}
  → 后续标准 WebRTC 握手流程
```

### 多人场景安全性

| 场景 | 行为 |
|------|------|
| 3 人同时搜索 | 各看各的，互不干扰 |
| A 创建房间，B/C 同时加入 | 服务端 B 先到→成功，C→"房间已满" |
| A 的房间在搜索结果中，B 看到时 A 已关闭 | 加入时返回"房间不存在"→ 正常错误处理 |
| 无房间时搜索 | 返回空列表，显示"未找到可用房间" |

## 文件变更清单

| 文件 | 变更 |
|------|------|
| `server/ws-server.mjs` | P2P 新增 `list-rooms` 消息处理 |
| `src/hooks/useP2PTransfer.ts` | 新增 `searchRooms`、`availableRooms`、`isSearching` |
| `src/components/p2p-transfer/PeerConnect.tsx` | 新增搜索按钮 + 房间列表 UI |
| `src/app/tools/p2p-transfer/page.tsx` | 透传新 props |

## 不改动
- 传输协议（DataChannel 分片/背压/速率计算）
- 已有连接流程（createRoom/joinRoom/disconnect）
- 文件拖拽/传输列表 UI
- 不需要新增 npm 包
