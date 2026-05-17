"use client";

export function PlayButton({
  isPlaying,
  onToggle,
}: {
  isPlaying: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-16 h-16 rounded-full flex items-center justify-center
        bg-white/10 hover:bg-white/20 border border-white/10
        transition-all duration-200 active:scale-95"
      aria-label={isPlaying ? "暂停" : "播放"}
    >
      {isPlaying ? (
        // 暂停图标
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <rect x="5" y="4" width="5" height="16" rx="1" />
          <rect x="14" y="4" width="5" height="16" rx="1" />
        </svg>
      ) : (
        // 播放图标
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <polygon points="6,3 20,12 6,21" />
        </svg>
      )}
    </button>
  );
}
