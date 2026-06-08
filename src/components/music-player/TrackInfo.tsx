"use client";

import { useMusicPlayerContext } from "./MusicPlayerContext";

function EqBars({ isPlaying }: { isPlaying: boolean }) {
  return (
    <span className="inline-flex items-end gap-[2px] h-3 mr-1.5 align-middle">
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-[2px] rounded-full"
          style={{
            height: "60%",
            background: "var(--color-accent)",
            animation: isPlaying
              ? `amp-eq-bar ${0.4 + i * 0.12}s ease-in-out infinite`
              : "none",
            animationDelay: `${i * 0.1}s`,
            opacity: isPlaying ? 1 : 0.2,
          }}
        />
      ))}
    </span>
  );
}

export function TrackInfo() {
  const ctx = useMusicPlayerContext();
  const currentTrack =
    ctx.currentTrackIndex >= 0 && ctx.currentTrackIndex < ctx.tracks.length
      ? ctx.tracks[ctx.currentTrackIndex]
      : null;

  const title = currentTrack?.title ?? "未选择歌曲";
  const artist = currentTrack?.artist ?? "";
  const album = currentTrack?.album ?? "";
  const format = currentTrack?.format;
  const isPlaying = ctx.playerState === "playing";

  return (
    <div className="text-center min-w-0 max-w-xs sm:max-w-sm mx-auto">
      <h3
        className="text-xl sm:text-2xl lg:text-3xl font-semibold truncate flex items-center justify-center gap-1 text-[var(--color-foreground)]"
        title={title}
      >
        {isPlaying && <EqBars isPlaying={isPlaying} />}
        <span>{title}</span>
      </h3>

      <p className="text-sm mt-1.5 truncate text-[var(--color-foreground-muted)]">
        {artist && artist !== "Unknown Artist" && artist !== "未知艺术家" ? (
          <span>{artist}</span>
        ) : null}
        {album && album !== "Unknown Album" && album !== "未知专辑" && (
          <span>
            {artist && artist !== "Unknown Artist" && artist !== "未知艺术家" ? " · " : ""}
            {album}
          </span>
        )}
        {format && (
          <span
            className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] text-[var(--color-accent)] border border-[color-mix(in_srgb,var(--color-accent)_20%,transparent)]"
          >
            {format}
          </span>
        )}
      </p>
    </div>
  );
}
