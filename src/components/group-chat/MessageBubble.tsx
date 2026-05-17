"use client";

import type { ChatMessage } from "@/lib/chat/types";
import { FileCard } from "./FileCard";

interface Props {
  message: ChatMessage;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: Props) {
  const time = new Date(message.timestamp).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} mb-3`}>
      {!isOwn && (
        <span className="text-xs text-[var(--color-text-secondary)] mb-1 ml-1">
          {message.senderName}
        </span>
      )}
      {message.type === "text" ? (
        <div
          className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
            isOwn
              ? "bg-[var(--color-accent)] text-white rounded-br-md"
              : "bg-white/10 text-[var(--color-text-primary)] rounded-bl-md"
          }`}
        >
          {message.text}
          <div className={`text-[10px] mt-1 ${isOwn ? "text-white/60" : "text-[var(--color-text-secondary)]"}`}>
            {time}
          </div>
        </div>
      ) : (
        <div className={`max-w-[80%] ${isOwn ? "items-end" : "items-start"}`}>
          <FileCard
            fileName={message.fileName || ""}
            fileSize={message.fileSize || 0}
            url={message.url || ""}
          />
          <div className="text-[10px] text-[var(--color-text-secondary)] mt-1 text-right">
            {time}
          </div>
        </div>
      )}
    </div>
  );
}
