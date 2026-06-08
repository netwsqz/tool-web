"use client";

import { MusicPlayerProvider, useMusicPlayerContext } from "@/components/music-player/MusicPlayerContext";
import { ImmersiveLayout } from "@/components/music-player/ImmersiveLayout";
import { PlaylistDrawer } from "@/components/music-player/PlaylistDrawer";
import { FileDropZone } from "@/components/music-player/FileDropZone";
import { UploadErrorToast } from "@/components/music-player/UploadErrorToast";

function MusicPlayerContent() {
  const ctx = useMusicPlayerContext();
  const hasTracks = ctx.tracks.length > 0;
  const isUploading = ctx.loading && hasTracks;

  if (!hasTracks) {
    return (
      <div className="h-dvh w-full overflow-hidden flex items-center justify-center"
        style={{ background: "var(--color-bg-deep)" }}
      >
        {ctx.loading ? (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="relative">
              <div
                className="size-10 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
              />
              <div
                className="absolute inset-0 size-10 rounded-full animate-pulse"
                style={{ border: "2px solid color-mix(in srgb, var(--color-accent) 12%, transparent)" }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                正在加载音乐库…
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-foreground-subtle)" }}>
                读取已保存的音乐文件
              </p>
            </div>
          </div>
        ) : ctx.error ? (
          <div className="text-center animate-fade-in">
            <p className="text-sm mb-3" style={{ color: "var(--color-destructive)" }}>
              {ctx.error}
            </p>
            <button
              onClick={() => { ctx.clearError(); ctx.loadLibrary(); }}
              className="px-4 py-2 rounded-xl text-sm transition-all hover:opacity-90"
              style={{
                background: "color-mix(in srgb, var(--color-accent) 10%, transparent)",
                color: "var(--color-accent)",
                border: "1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)",
              }}
            >
              重试
            </button>
          </div>
        ) : (
          <div className="animate-fade-in w-full max-w-md px-4">
            <FileDropZone onAddFiles={ctx.addFiles} />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <ImmersiveLayout />

      {isUploading && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full text-xs shadow-lg animate-fade-in"
          style={{
            background: "var(--color-bg-elevated)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            color: "var(--color-foreground-muted)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            className="size-3 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
          />
          正在解析音乐文件…
        </div>
      )}

      <PlaylistDrawer />
      <UploadErrorToast errors={ctx.uploadErrors} onDismiss={ctx.dismissUploadError} />
    </>
  );
}

export default function MusicPlayerPage() {
  return (
    <MusicPlayerProvider>
      <MusicPlayerContent />
    </MusicPlayerProvider>
  );
}