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
