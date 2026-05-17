"use client";

import { useState, useEffect, useCallback } from "react";

export interface SystemStats {
  system: { hostname: string; platform: string; uptime: string };
  cpu: { usage: number; cores: { load: number }[] };
  memory: { used: number; total: number; swapUsed: number; swapTotal: number };
  disk: { mount: string; used: number; total: number }[];
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
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, error };
}
