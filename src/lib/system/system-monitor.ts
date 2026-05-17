import os from "os";
import { execSync } from "child_process";

export interface SystemStats {
  system: { hostname: string; platform: string; uptime: string };
  cpu: { usage: number; cores: { load: number }[] };
  memory: { used: number; total: number; swapUsed: number; swapTotal: number };
  disk: { mount: string; used: number; total: number }[];
}

// Module-level cache for CPU delta sampling
let previousCpu: { idle: number; total: number }[] | null = null;
// Module-level cache for slow-changing data (disk, swap)
let slowCache: { disk: { mount: string; used: number; total: number }[]; swapTotal: number; swapUsed: number } | null = null;
let lastSlowRefresh = 0;
const SLOW_REFRESH_MS = 30000; // refresh disk/swap every 30s

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
    const prevCpu = previousCpu;
    cores = current.map((curr, i) => {
      const prev = prevCpu[i];
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

  // Refresh slow-changing data (swap, disk) every 30s
  const now = Date.now();
  if (!slowCache || now - lastSlowRefresh > SLOW_REFRESH_MS) {
    slowCache = {
      disk: getDisksImpl(),
      swapTotal: 0,
      swapUsed: 0,
    };
    try {
      const out = execSync(
        'wmic pagefile get AllocatedBaseSize,CurrentUsage /format:csv',
        { encoding: "utf8", timeout: 3000 }
      );
      const lines = out.trim().split("\n").filter((l) => l.includes(","));
      for (const line of lines) {
        const parts = line.trim().split(",");
        if (parts.length >= 3) {
          const allocatedMB = parseInt(parts[1], 10);
          const usageMB = parseInt(parts[2], 10);
          if (isNaN(allocatedMB) || isNaN(usageMB)) continue;
          slowCache.swapTotal += allocatedMB * 1024 * 1024;
          slowCache.swapUsed += usageMB * 1024 * 1024;
        }
      }
    } catch {
      // Swap info not available
    }
    lastSlowRefresh = now;
  }

  return { used, total, swapUsed: slowCache.swapUsed, swapTotal: slowCache.swapTotal };
}

function getDisksImpl(): { mount: string; used: number; total: number }[] {
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

function getDisks(): { mount: string; used: number; total: number }[] {
  // Force cache refresh if needed (getMemory already does this, but be safe)
  const now = Date.now();
  if (!slowCache || now - lastSlowRefresh > SLOW_REFRESH_MS) {
    getMemory(); // triggers cache refresh
  }
  return slowCache?.disk ?? [];
}

export function getSystemStats(): SystemStats {
  const cpu = getCpuUsage();
  const memory = getMemory();
  const disk = getDisks();

  return {
    system: {
      hostname: os.hostname(),
      platform: os.platform() === "win32" ? "Windows" : os.platform(),
      uptime: formatUptime(os.uptime()),
    },
    cpu,
    memory,
    disk,
  };
}
