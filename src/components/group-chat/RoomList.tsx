"use client";

import type { ChatRoomInfo } from "@/lib/chat/types";
import { useState } from "react";

interface Props {
  rooms: ChatRoomInfo[];
  currentRoomId: string;
  onJoin: (roomId: string) => void;
  onCreate: (name: string) => void;
}

export function RoomList({ rooms, currentRoomId, onJoin, onCreate }: Props) {
  const [newRoomName, setNewRoomName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = () => {
    if (newRoomName.trim()) {
      onCreate(newRoomName.trim());
      setNewRoomName("");
      setShowCreate(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          可用聊天室
        </h2>
        <button
          type="button"
          className="text-xs text-[var(--color-accent)] hover:underline"
          onClick={() => setShowCreate(!showCreate)}
        >
          + 创建
        </button>
      </div>

      {showCreate && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="聊天室名称"
            aria-label="聊天室名称"
            maxLength={20}
            className="flex-1 px-3 py-1.5 rounded-xl bg-black/5 border border-black/10
              text-sm text-[var(--color-foreground)] placeholder-[var(--color-text-secondary)]
              focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button
            type="button"
            disabled={!newRoomName.trim()}
            className="px-3 py-1.5 rounded-xl text-xs font-medium
              bg-[var(--color-accent)] text-white
              hover:opacity-90 transition-opacity
              disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={handleCreate}
          >
            创建
          </button>
        </div>
      )}

      {rooms.length === 0 && (
        <p className="text-sm text-[var(--color-text-secondary)] py-4 text-center">
          暂无聊天室
        </p>
      )}

      <div className="space-y-1">
        {rooms.map((room) => (
          <button
            key={room.id}
            type="button"
            onClick={() => onJoin(room.id)}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl
              text-sm transition-colors text-left
              ${room.id === currentRoomId
                ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                : "hover:bg-black/5 text-[var(--color-text-primary)]"
              }`}
          >
            <span className="font-medium">{room.name}</span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {room.memberCount} 人在线
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
