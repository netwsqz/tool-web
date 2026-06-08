"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/chat/types";
import { MessageBubble } from "./MessageBubble";

interface Props {
  messages: ChatMessage[];
  myMemberId: string;
  typingMembers: string[];
  memberNames: Record<string, string>;
  loading?: boolean;
}

export function ChatArea({ messages, myMemberId, typingMembers, memberNames, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[var(--color-text-secondary)]">加载中...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[var(--color-text-secondary)]">
          暂无消息，发送第一条消息吧
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-1 py-2" role="log" aria-live="polite">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isOwn={msg.senderId === myMemberId}
        />
      ))}
      {typingMembers.length > 0 && (
        <div className="text-xs text-[var(--color-text-secondary)] italic mb-2">
          {typingMembers.map((id) => memberNames[id]).filter(Boolean).join("、")}
          {" 正在输入..."}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
