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
