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
