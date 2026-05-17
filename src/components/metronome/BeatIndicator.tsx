"use client";

export function BeatIndicator({
  currentBeat,
  beatsPerMeasure = 4,
  isPlaying,
}: {
  currentBeat: number;
  beatsPerMeasure?: number;
  isPlaying: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: beatsPerMeasure }).map((_, i) => {
        const isActive = isPlaying && i === currentBeat;
        const isAccent = i === 0;

        return (
          <div
            key={i}
            className="relative flex items-center justify-center"
          >
            {/* 脉冲环 */}
            {isActive && (
              <div
                className="absolute inset-0 rounded-full bg-[var(--color-accent)]/30
                  animate-ping-once"
                style={{
                  width: isAccent ? 32 : 24,
                  height: isAccent ? 32 : 24,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}

            {/* 节拍圆点 */}
            <div
              className={`rounded-full transition-all duration-100
                ${isAccent ? "w-8 h-8" : "w-6 h-6"}
                ${
                  isActive
                    ? "bg-[var(--color-accent)] shadow-lg shadow-[var(--color-accent)]/40 scale-100"
                    : "bg-white/15 scale-90"
                }
              `}
            />
          </div>
        );
      })}
    </div>
  );
}
