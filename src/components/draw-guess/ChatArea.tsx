"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/draw-guess/types";

interface ChatAreaProps {
  messages: ChatMessage[];
  myPlayerId?: string;
}

export function ChatArea({ messages, myPlayerId }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-[var(--color-foreground-muted)]">
        暂无消息
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`text-sm px-2 py-1 rounded-lg ${
            msg.isCorrect
              ? "bg-green-500/20 text-[var(--color-success)]"
              : msg.playerId === myPlayerId
              ? "bg-blue-500/10 text-[var(--color-accent)]"
              : "text-[var(--color-foreground)]"
          }`}
        >
          <span className="font-medium text-xs opacity-70 mr-1.5">
            {msg.playerName}:
          </span>
          {msg.isCorrect ? (
            <span className="font-semibold">{msg.text} ✓ 猜对了!</span>
          ) : (
            <span>{msg.text}</span>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
