"use client";

import { useRef } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";

interface Props {
  connStatus: string;
  roomCode: string;
  peerName: string;
  localName: string;
  onLocalNameChange: (v: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onDisconnect: () => void;
  availableRooms: { roomCode: string; peerName: string; createdAt?: number }[];
  isSearching: boolean;
  onSearchRooms: () => void;
}

export function PeerConnect({
  connStatus,
  roomCode,
  peerName,
  localName,
  onLocalNameChange,
  onCreateRoom,
  onJoinRoom,
  onDisconnect,
  availableRooms,
  isSearching,
  onSearchRooms,
}: Props) {
  const joinInputRef = useRef<HTMLInputElement>(null);

  if (connStatus === "connected") {
    return (
      <GlassPanel className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="size-2 rounded-full bg-[var(--color-success)] animate-pulse" aria-hidden="true" />
          <span className="text-sm text-[var(--color-success)] font-medium">已连接</span>
        </div>
        <p className="text-xs text-[var(--color-foreground-muted)]">
          房间 {roomCode} · 对端: {peerName || "未知"}
        </p>
        <button
          type="button"
          onClick={onDisconnect}
          className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-[var(--color-destructive)]/15 text-[var(--color-destructive)]
            hover:bg-[var(--color-destructive)]/25 transition-all active:scale-[0.96]"
        >
          断开连接
        </button>
      </GlassPanel>
    );
  }

  const isWaiting =
    connStatus === "creating-room" || connStatus === "joining-room" || connStatus === "waiting-peer" || connStatus === "connecting";

  if (isWaiting) {
    return (
      <GlassPanel className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="size-4 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
          <span className="text-sm text-[var(--color-foreground-muted)]">
            {connStatus === "creating-room" && "正在连接信令服务器..."}
            {connStatus === "joining-room" && "正在加入房间..."}
            {connStatus === "waiting-peer" && (
              <>等待对方加入... 房间号: <span className="text-[var(--color-accent)] font-mono tracking-widest text-base">{roomCode}</span></>
            )}
            {connStatus === "connecting" && "正在建立直连..."}
          </span>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel>
      <div className="space-y-3">
        <div>
          <label htmlFor="p2p-nickname" className="block text-xs text-[var(--color-foreground-muted)] mb-1">你的昵称</label>
          <input
            type="text"
            id="p2p-nickname"
            value={localName}
            onChange={(e) => onLocalNameChange(e.target.value)}
            placeholder="选填"
            maxLength={10}
            className="w-full px-3 py-2 rounded-xl bg-black/5 border border-black/10 text-sm text-[var(--color-foreground)]
              placeholder-[var(--color-foreground-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCreateRoom}
            disabled={isWaiting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
              bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            创建房间
          </button>
        </div>

        <div className="relative py-2">
          <div className="border-t border-black/10" />
          <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs text-[var(--color-foreground-muted)] bg-[var(--color-bg-deep)]">
            或者加入房间
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            ref={joinInputRef}
            placeholder="输入房间号"
            maxLength={4}
            className="flex-1 px-3 py-2.5 rounded-xl bg-[var(--color-surface-active)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)]
              placeholder-[var(--color-foreground-muted)] tracking-widest text-center font-mono uppercase
              focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onJoinRoom((e.target as HTMLInputElement).value);
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              const val = joinInputRef.current?.value ?? "";
              onJoinRoom(val);
            }}
            disabled={isWaiting}
            className="px-5 py-2.5 rounded-xl text-sm font-medium
              bg-black/10 text-[var(--color-foreground)] hover:bg-black/15 transition-colors
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            加入
          </button>
        </div>

        {/* ── LAN room discovery ── */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onSearchRooms}
            disabled={isSearching}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium
              border border-dashed border-[var(--color-border)]
              text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]
              hover:border-[var(--color-accent)]/30 transition-all"
          >
            {isSearching ? (
              <span className="flex items-center justify-center gap-2">
                <div className="size-3 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
                搜索中...
              </span>
            ) : "搜索局域网房间"}
          </button>

          {!isSearching && availableRooms.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-[var(--color-foreground-muted)] px-1">可加入的房间:</p>
              {availableRooms.map((room) => (
                <div
                  key={room.roomCode}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono tracking-widest text-[var(--color-foreground)]">
                      {room.roomCode}
                    </span>
                    <span className="text-xs text-[var(--color-foreground-muted)]">
                      {room.peerName}
                    </span>
                    {room.createdAt && (
                      <span className="text-[10px] text-[var(--color-foreground-subtle)]">
                        {Math.floor((Date.now() - room.createdAt) / 1000) < 60
                          ? `${Math.floor((Date.now() - room.createdAt) / 1000)}秒前`
                          : `${Math.floor((Date.now() - room.createdAt) / 60000)}分钟前`}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onJoinRoom(room.roomCode)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium
                      bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity"
                  >
                    加入
                  </button>
                </div>
              ))}
            </div>
          )}

          {!isSearching && availableRooms.length === 0 && (
            <p className="mt-2 text-xs text-center text-[var(--color-foreground-subtle)]">
              未找到可用房间
            </p>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
