"use client";

import type { ChatMember } from "@/lib/chat/types";

interface Props {
  members: ChatMember[];
  myMemberId: string;
  typingMembers: string[];
}

export function MemberList({ members, myMemberId, typingMembers }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs text-[var(--color-text-secondary)] font-medium uppercase tracking-wider">
        成员 ({members.length})
      </h3>
      <div className="space-y-1">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <span className={m.id === myMemberId ? "text-[var(--color-accent)]" : ""}>
              {m.name}
              {m.id === myMemberId && " (你)"}
            </span>
            {typingMembers.includes(m.id) && (
              <span className="text-xs text-[var(--color-text-secondary)] italic ml-auto">
                输入中...
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
