# 系统监控 — 设计文档

## 概述

新增「系统监控」工具，在万能工具箱首页注册，用于实时展示本地系统运行状态。

## 指标范围

- **系统信息** — 主机名、操作系统、运行时间
- **CPU** — 总体使用率 + 每个核心负载（delta 采样）
- **内存** — 物理内存使用量/总量 + Swap 使用量/总量
- **磁盘** — 各分区使用量/总量（缓存 30 秒）

## 架构

### 服务端

```
src/lib/system/system-monitor.ts   — os 模块 + wmic 获取指标
src/app/api/system/stats/route.ts  — GET 接口返回 SystemStats JSON
```

`system-monitor.ts` 导出 `getSystemStats()`，内部使用：
- `os` 模块: `cpus()`, `totalmem()`, `freemem()`, `hostname()`, `platform()`, `uptime()`
- CPU: `os.cpus().times` delta 采样，模块级缓存前一次数据计算瞬时使用率
- 内存: `os.totalmem()` - `os.freemem()`
- Swap: `wmic pagefile get AllocatedBaseSize,CurrentUsage /format:csv`
- 磁盘: `wmic logicaldisk get size,freespace,caption /format:csv`（缓存 30 秒，与 Swap 共享刷新周期）

### 客户端

```
src/hooks/useSystemStats.ts        — 5s 轮询 fetch /api/system/stats
src/components/system/
  ├── SystemInfoCard.tsx            — 系统信息卡片
  ├── CpuCard.tsx                   — CPU 使用率 + 核心条
  ├── MemoryCard.tsx                — 内存 + Swap 进度条
  └── DiskCard.tsx                  — 分区进度条列表
src/app/tools/system/page.tsx      — 页面布局组装
```

`useSystemStats` 与 `useMediaTask.ts` 同构，用 `useEffect` + `setInterval` 5s 轮询。

## 数据流

```
[os / wmic] → getSystemStats() → API Route → JSON → useSystemStats hook → 各组件
```

## 数据格式

```typescript
interface SystemStats {
  system: { hostname: string; platform: string; uptime: string };
  cpu: { usage: number; cores: { load: number }[] };
  memory: { used: number; total: number; swapUsed: number; swapTotal: number };
  disk: { mount: string; used: number; total: number }[];
}
```

- `cpu.usage`: 0-100，delta 采样（首次调用为 0）
- `memory.*`: 单位 bytes
- `disk[*].used/total`: 单位 bytes

## 性能策略

- 轮询间隔 5 秒，减少 child process 开销
- CPU 使用 `os.cpus()`（纯内存操作，无子进程）
- 内存使用 `os` 模块（纯内存操作，无子进程）
- 磁盘/Swap 使用 `wmic` 但缓存 30 秒，不随每次轮询刷新
- `wmic` 替代 PowerShell（启动速度快数倍）

## UI

- 使用 `.glass` 毛玻璃卡片，3 列卡片布局（CPU / 内存 / 磁盘）
- 系统信息卡片置于顶部
- 纯 CSS 进度条展示百分比，数值用 formatSize 格式化显示（GB/MB）
- 所有组件处理加载/错误/空状态
- 主题色使用 `--color-accent` (#4da3ff)

## 未涉及的 scope

- 历史数据/折线图（后续可引入 recharts）
- 网络监控（`netstat -e` 备选实现已移除）
- 进程列表
- 告警/阈值通知
- 远程监控
