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
