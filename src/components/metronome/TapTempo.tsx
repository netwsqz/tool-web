"use client";

export function TapTempo({
  onTap,
  tapBpm,
}: {
  onTap: () => void;
  tapBpm: number | null;
}) {
  return (
    <div className="text-center space-y-1">
      <button
        onClick={onTap}
        className="px-5 py-2 rounded-xl text-sm font-medium
          bg-black/5 hover:bg-black/10 border border-black/10
          text-[var(--color-text-primary)]
          transition-all duration-150 active:scale-95 active:bg-[var(--color-accent)]/20"
      >
        TAP
      </button>
      {tapBpm !== null && (
        <p className="text-xs text-[var(--color-text-secondary)]">
          {tapBpm} BPM
        </p>
      )}
    </div>
  );
}
