"use client";

import { Monitor } from "lucide-react";
import { ToolLayout, ErrorState, LoadingState } from "@/components/ui/ToolLayout";
import { useSystemStats } from "@/hooks/useSystemStats";
import { SystemInfoCard } from "@/components/system/SystemInfoCard";
import { CpuCard } from "@/components/system/CpuCard";
import { MemoryCard } from "@/components/system/MemoryCard";
import { DiskCard } from "@/components/system/DiskCard";

export default function SystemMonitorPage() {
  const { stats, loading, error } = useSystemStats();

  return (
    <ToolLayout
      title="系统监控"
      description="实时系统资源监控 · 每 5 秒刷新"
      icon={Monitor}
      maxWidth="xl"
    >
      {error && <ErrorState message={error} />}

      {loading && !stats && <LoadingState />}

      {stats && (
        <>
          <SystemInfoCard system={stats.system} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <CpuCard cpu={stats.cpu} />
            <MemoryCard memory={stats.memory} />
            <DiskCard disk={stats.disk} />
          </div>
        </>
      )}
    </ToolLayout>
  );
}
