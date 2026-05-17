# 系统监控 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增系统监控工具，首页注册，实时展示 CPU/内存/磁盘/网络/进程指标

**Architecture:** Next.js API 路由 2s 轮询，服务端用 `os` 模块 + `wmic`/PowerShell 采集 Windows 指标，客户端 hook 驱动 6 个展示组件

**Tech Stack:** Node.js `os` module, `child_process`, React hooks, CSS progress bars

---

### Task 1: 服务端指标采集模块

**Files:**
- Create: `src/lib/system/system-monitor.ts`

- [ ] **Step 1: Create system-monitor.ts**

```typescript
import os from "os";
import { execSync } from "child_process";

export interface SystemStats {
  system: { hostname: string; platform: string; uptime: string };
  cpu: { usage: number; cores: { load: number }[] };
  memory: { used: number; total: number; swapUsed: number; swapTotal: number };
  disk: { mount: string; used: number; total: number }[];
  network: { rxSpeed: number; txSpeed: number };
  processes: { pid: number; name: string; cpu: number; memory: number }[];
}

// Module-level cache for CPU delta sampling
let previousCpu: { idle: number; total: number }[] | null = null;
// Module-level cache for network delta sampling
let previousNet: { rx: number; tx: number; ts: number } | null = null;

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} 天`);
  if (h > 0) parts.push(`${h} 小时`);
  if (m > 0 || parts.length === 0) parts.push(`${m} 分`);
  return parts.join(" ");
}

function getCpuUsage(): { usage: number; cores: { load: number }[] } {
  const cpus = os.cpus();
  const current = cpus.map((c) => {
    const total = Object.values(c.times).reduce((a, b) => a + b, 0);
    return { idle: c.times.idle, total };
  });

  let usage = 0;
  let cores: { load: number }[] = [];

  if (previousCpu && previousCpu.length === current.length) {
    cores = current.map((curr, i) => {
      const prev = previousCpu[i];
      const totalDelta = curr.total - prev.total;
      const idleDelta = curr.idle - prev.idle;
      const load = totalDelta > 0 ? Math.round((1 - idleDelta / totalDelta) * 100) : 0;
      return { load };
    });
    usage = Math.round(cores.reduce((a, b) => a + b.load, 0) / cores.length);
  } else {
    cores = current.map(() => ({ load: 0 }));
  }

  previousCpu = current;
  return { usage, cores };
}

function getMemory(): { used: number; total: number; swapUsed: number; swapTotal: number } {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;

  let swapTotal = 0;
  let swapUsed = 0;
  try {
    const out = execSync(
      'wmic pagefile get AllocatedBaseSize,CurrentUsage /format:csv',
      { encoding: "utf8", timeout: 3000 }
    );
    const lines = out.trim().split("\n").filter((l) => l.includes(","));
    for (const line of lines) {
      const parts = line.trim().split(",");
      if (parts.length >= 3) {
        const usage = parseInt(parts[1], 10);
        const totalMB = parseInt(parts[2], 10);
        swapTotal += totalMB * 1024 * 1024;
        swapUsed += usage * 1024 * 1024;
      }
    }
  } catch {
    // Swap info not available
  }

  return { used, total, swapUsed, swapTotal };
}

function getDisks(): { mount: string; used: number; total: number }[] {
  const disks: { mount: string; used: number; total: number }[] = [];
  try {
    const out = execSync(
      'wmic logicaldisk get size,freespace,caption /format:csv',
      { encoding: "utf8", timeout: 3000 }
    );
    const lines = out.trim().split("\n").filter((l) => l.includes(","));
    for (const line of lines) {
      const parts = line.trim().split(",");
      if (parts.length >= 3) {
        const mount = parts[1]?.replace(":", "") || "";
        const free = parseInt(parts[2], 10);
        const total = parseInt(parts[3], 10);
        if (!isNaN(total) && total > 0) {
          disks.push({ mount: mount + ":\\", used: total - free, total });
        }
      }
    }
  } catch {
    // Disk info not available
  }
  return disks;
}

function getNetwork(): { rxSpeed: number; txSpeed: number } {
  let rx = 0;
  let tx = 0;
  try {
    const out = execSync(
      'powershell -Command "Get-NetAdapterStatistics | Where-Object {$_.State -eq \'Enabled\'} | Select-Object -ExpandProperty BytesReceived | Measure-Object -Sum | Select-Object -ExpandProperty Sum"',
      { encoding: "utf8", timeout: 5000 }
    );
    const rxStr = out.trim();
    if (rxStr && !isNaN(Number(rxStr))) rx = Number(rxStr);

    const out2 = execSync(
      'powershell -Command "Get-NetAdapterStatistics | Where-Object {$_.State -eq \'Enabled\'} | Select-Object -ExpandProperty BytesSent | Measure-Object -Sum | Select-Object -ExpandProperty Sum"',
      { encoding: "utf8", timeout: 5000 }
    );
    const txStr = out2.trim();
    if (txStr && !isNaN(Number(txStr))) tx = Number(txStr);
  } catch {
    return { rxSpeed: 0, txSpeed: 0 };
  }

  let rxSpeed = 0;
  let txSpeed = 0;
  const now = Date.now();

  if (previousNet) {
    const dt = (now - previousNet.ts) / 1000;
    if (dt > 0) {
      rxSpeed = Math.round(((rx - previousNet.rx) / dt) / 1024);
      txSpeed = Math.round(((tx - previousNet.tx) / dt) / 1024);
    }
  }

  previousNet = { rx, tx, ts: now };
  return { rxSpeed: Math.max(0, rxSpeed), txSpeed: Math.max(0, txSpeed) };
}

function getProcesses(): { pid: number; name: string; cpu: number; memory: number }[] {
  try {
    const out = execSync(
      'powershell -Command "Get-Process | Sort-Object CPU -Descending | Select-Object -First 3 Id, ProcessName, CPU, WorkingSet64 | ConvertTo-Json -Compress"',
      { encoding: "utf8", timeout: 5000 }
    );
    const raw = out.trim();
    if (!raw || raw === "null") return [];

    let items: any[] = [];
    if (raw.startsWith("[")) {
      items = JSON.parse(raw);
    } else if (raw.startsWith("{")) {
      items = [JSON.parse(raw)];
    }

    return items.map((p: any) => ({
      pid: p.Id || 0,
      name: p.ProcessName || "",
      cpu: Math.round((p.CPU || 0) * 10) / 10,
      memory: p.WorkingSet64 || 0,
    }));
  } catch {
    return [];
  }
}

export function getSystemStats(): SystemStats {
  const cpu = getCpuUsage();
  const memory = getMemory();
  const disk = getDisks();
  const network = getNetwork();
  const processes = getProcesses();

  return {
    system: {
      hostname: os.hostname(),
      platform: os.platform() === "win32" ? "Windows" : os.platform(),
      uptime: formatUptime(os.uptime()),
    },
    cpu,
    memory,
    disk,
    network,
    processes,
  };
}
```

### Task 2: API 路由

**Files:**
- Create: `src/app/api/system/stats/route.ts`

- [ ] **Step 1: Create the GET route**

```typescript
import { NextResponse } from "next/server";
import { getSystemStats } from "@/lib/system/system-monitor";

export async function GET() {
  try {
    const stats = getSystemStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error("System stats error:", err);
    return NextResponse.json(
      { error: "获取系统信息失败" },
      { status: 500 }
    );
  }
}
```

### Task 3: 客户端轮询 Hook

**Files:**
- Create: `src/hooks/useSystemStats.ts`

- [ ] **Step 1: Create the hook**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";

interface SystemStats {
  system: { hostname: string; platform: string; uptime: string };
  cpu: { usage: number; cores: { load: number }[] };
  memory: { used: number; total: number; swapUsed: number; swapTotal: number };
  disk: { mount: string; used: number; total: number }[];
  network: { rxSpeed: number; txSpeed: number };
  processes: { pid: number; name: string; cpu: number; memory: number }[];
}

export function useSystemStats() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/system/stats");
      if (!res.ok) throw new Error("获取系统信息失败");
      const data: SystemStats = await res.json();
      setStats(data);
      setLoading(false);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, error };
}
```

### Task 4: UI 组件

**Files:**
- Create: `src/components/system/SystemInfoCard.tsx`
- Create: `src/components/system/CpuCard.tsx`
- Create: `src/components/system/MemoryCard.tsx`
- Create: `src/components/system/DiskCard.tsx`
- Create: `src/components/system/NetworkCard.tsx`
- Create: `src/components/system/ProcessTable.tsx`

- [ ] **Step 1: SystemInfoCard**

```tsx
"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";

interface Props {
  system: { hostname: string; platform: string; uptime: string };
}

export function SystemInfoCard({ system }: Props) {
  return (
    <GlassPanel className="mb-4">
      <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div>
          <span className="text-[var(--color-text-secondary)]">主机名 </span>
          <span className="text-[var(--color-text-primary)]">{system.hostname}</span>
        </div>
        <div>
          <span className="text-[var(--color-text-secondary)]">系统 </span>
          <span className="text-[var(--color-text-primary)]">{system.platform}</span>
        </div>
        <div>
          <span className="text-[var(--color-text-secondary)]">运行时间 </span>
          <span className="text-[var(--color-text-primary)]">{system.uptime}</span>
        </div>
      </div>
    </GlassPanel>
  );
}
```

- [ ] **Step 2: CpuCard**

```tsx
"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";

interface Props {
  cpu: { usage: number; cores: { load: number }[] };
}

export function CpuCard({ cpu }: Props) {
  return (
    <GlassPanel>
      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">CPU</h3>
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-[var(--color-text-primary)]">总体使用率</span>
          <span className="text-[var(--color-accent)] font-mono">{cpu.usage}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-700"
            style={{ width: `${cpu.usage}%` }}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {cpu.cores.map((core, i) => (
          <div key={i} className="flex-1 min-w-[20px]">
            <div className="text-[10px] text-[var(--color-text-secondary)] text-center mb-0.5">
              {i + 1}
            </div>
            <div className="h-10 bg-white/5 rounded-sm overflow-hidden relative">
              <div
                className="absolute bottom-0 w-full bg-[var(--color-accent)] rounded-sm transition-all duration-700"
                style={{ height: `${core.load}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
```

- [ ] **Step 3: MemoryCard**

```tsx
"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { formatSize } from "@/lib/format";

interface Props {
  memory: {
    used: number;
    total: number;
    swapUsed: number;
    swapTotal: number;
  };
}

export function MemoryCard({ memory }: Props) {
  const memPercent = memory.total > 0 ? Math.round((memory.used / memory.total) * 100) : 0;
  const swapPercent = memory.swapTotal > 0 ? Math.round((memory.swapUsed / memory.swapTotal) * 100) : 0;

  return (
    <GlassPanel>
      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">内存</h3>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-[var(--color-text-primary)]">
            {formatSize(memory.used)} / {formatSize(memory.total)}
          </span>
          <span className="font-mono text-sm">{memPercent}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-700"
            style={{ width: `${memPercent}%` }}
          />
        </div>
      </div>

      {memory.swapTotal > 0 && (
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[var(--color-text-secondary)]">Swap</span>
            <span className="font-mono text-sm text-[var(--color-text-secondary)]">
              {swapPercent}%
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-text-secondary)] rounded-full transition-all duration-700"
              style={{ width: `${swapPercent}%` }}
            />
          </div>
          <div className="text-xs text-[var(--color-text-secondary)] mt-1">
            {formatSize(memory.swapUsed)} / {formatSize(memory.swapTotal)}
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
```

- [ ] **Step 4: DiskCard**

```tsx
"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { formatSize } from "@/lib/format";

interface DiskInfo {
  mount: string;
  used: number;
  total: number;
}

interface Props {
  disk: DiskInfo[];
}

export function DiskCard({ disk }: Props) {
  return (
    <GlassPanel>
      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">磁盘</h3>
      {disk.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">无法获取磁盘信息</p>
      ) : (
        <div className="space-y-3">
          {disk.map((d) => {
            const percent = d.total > 0 ? Math.round((d.used / d.total) * 100) : 0;
            return (
              <div key={d.mount}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--color-text-primary)]">{d.mount}</span>
                  <span className="font-mono text-sm">{percent}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-700"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {formatSize(d.used)} / {formatSize(d.total)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassPanel>
  );
}
```

- [ ] **Step 5: NetworkCard**

```tsx
"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";

interface Props {
  network: { rxSpeed: number; txSpeed: number };
}

function formatSpeed(kbps: number): string {
  if (kbps >= 1024) return (kbps / 1024).toFixed(1) + " MB/s";
  return kbps + " KB/s";
}

export function NetworkCard({ network }: Props) {
  return (
    <GlassPanel>
      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">网络</h3>

      {/* First call heuristic: both 0 means no data yet */}
      {network.rxSpeed === 0 && network.txSpeed === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">等待数据...</p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-lg">↓</span>
            <span className="font-mono text-sm text-[var(--color-text-primary)]">
              {formatSpeed(network.rxSpeed)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange-400 text-lg">↑</span>
            <span className="font-mono text-sm text-[var(--color-text-primary)]">
              {formatSpeed(network.txSpeed)}
            </span>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
```

- [ ] **Step 6: ProcessTable**

```tsx
"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { formatSize } from "@/lib/format";

interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
}

interface Props {
  processes: ProcessInfo[];
}

export function ProcessTable({ processes }: Props) {
  return (
    <GlassPanel className="mt-4">
      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
        进程 (CPU 排序)
      </h3>
      {processes.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">无法获取进程信息</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--color-text-secondary)] border-b border-white/5">
                <th className="text-left py-2 pr-4 font-medium">PID</th>
                <th className="text-left py-2 pr-4 font-medium">名称</th>
                <th className="text-right py-2 pr-4 font-medium">CPU (秒)</th>
                <th className="text-right py-2 font-medium">内存</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p) => (
                <tr
                  key={p.pid}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                >
                  <td className="py-2 pr-4 text-[var(--color-text-secondary)] font-mono text-xs">
                    {p.pid}
                  </td>
                  <td className="py-2 pr-4 text-[var(--color-text-primary)]">{p.name}</td>
                  <td className="py-2 pr-4 text-right font-mono text-xs text-[var(--color-text-primary)]">
                    {p.cpu}
                  </td>
                  <td className="py-2 text-right font-mono text-xs text-[var(--color-text-primary)]">
                    {formatSize(p.memory)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassPanel>
  );
}
```

### Task 5: 工具页面 + 注册

**Files:**
- Create: `src/app/tools/system/page.tsx`
- Modify: `src/lib/tools.ts`

- [ ] **Step 1: Create tool page**

```tsx
"use client";

import Link from "next/link";
import { useSystemStats } from "@/hooks/useSystemStats";
import { SystemInfoCard } from "@/components/system/SystemInfoCard";
import { CpuCard } from "@/components/system/CpuCard";
import { MemoryCard } from "@/components/system/MemoryCard";
import { DiskCard } from "@/components/system/DiskCard";
import { NetworkCard } from "@/components/system/NetworkCard";
import { ProcessTable } from "@/components/system/ProcessTable";

export default function SystemMonitorPage() {
  const { stats, loading, error } = useSystemStats();

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <header className="mb-8">
        <Link
          href="/"
          className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
        >
          ← 返回首页
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-2">
          系统监控
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          实时系统资源监控 · 每 2 秒刷新
        </p>
      </header>

      {/* Error banner */}
      {error && (
        <div className="glass rounded-2xl p-4 mb-6 text-red-400 text-sm">{error}</div>
      )}

      {/* Loading state */}
      {loading && !stats && (
        <div className="text-center py-20 text-[var(--color-text-secondary)]">
          加载中...
        </div>
      )}

      {/* Content */}
      {stats && (
        <>
          <SystemInfoCard system={stats.system} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <CpuCard cpu={stats.cpu} />
            <MemoryCard memory={stats.memory} />
            <DiskCard disk={stats.disk} />
            <NetworkCard network={stats.network} />
          </div>
          <ProcessTable processes={stats.processes} />
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Register in tools.ts**

Edit `src/lib/tools.ts`, replace the "系统监控" coming-soon entry with:

```typescript
  {
    id: "system",
    name: "系统监控",
    description: "CPU · 内存 · 磁盘 · 网络 · 进程",
    icon: "📊",
    path: "/tools/system",
    status: "active",
  },
```
