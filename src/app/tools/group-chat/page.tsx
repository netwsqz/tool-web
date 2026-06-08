"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { ToolLayout } from "@/components/ui/ToolLayout";
import { useGroupChat } from "@/hooks/useGroupChat";
import { JoinScreen } from "@/components/group-chat/JoinScreen";
import { RoomList } from "@/components/group-chat/RoomList";
import { ChatArea } from "@/components/group-chat/ChatArea";
import { ChatInput } from "@/components/group-chat/ChatInput";
import { MemberList } from "@/components/group-chat/MemberList";

export default function GroupChatPage() {
  const chat = useGroupChat();
  const [showMembers, setShowMembers] = useState(false);

  const memberNames: Record<string, string> = {};
  chat.members.forEach((m) => { memberNames[m.id] = m.name; });

  return (
    <ToolLayout
      title="群聊"
      description="局域网多房间聊天 · 文件分享"
      icon={MessageCircle}
      maxWidth="full"
    >
      {/* Error */}
      {chat.error && (
        <div className="mb-4 px-4 py-2 rounded-xl bg-[var(--color-destructive)]/20 text-[var(--color-destructive)] text-sm flex items-center justify-between">
          <span>{chat.error}</span>
          <button
            type="button"
            className="text-red-300 hover:text-red-200 ml-2"
            onClick={chat.clearError}
            aria-label="关闭错误"
          >
            ✕
          </button>
        </div>
      )}

      {/* Connecting Screen */}
      {chat.connStatus === "connecting" && (
        <div className="glass rounded-3xl p-8 max-w-md mx-auto mt-8 text-center">
          <p className="text-sm text-[var(--color-foreground-muted)]">
            正在连接聊天服务器...
          </p>
        </div>
      )}

      {/* Connect Screen */}
      {chat.connStatus === "disconnected" && chat.view === "connect" && (
        <JoinScreen
          nickname={chat.nickname}
          onNicknameChange={chat.setNickname}
          serverAddress={chat.serverAddress}
          onServerAddressChange={chat.setServerAddress}
          onConnect={chat.connect}
          onError={() => chat.setError("请输入昵称")}
        />
      )}

      {/* Room List */}
      {chat.connStatus === "connected" && chat.view === "rooms" && (
        <div className="glass rounded-3xl p-6 max-w-lg mx-auto mt-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-[var(--color-foreground-muted)]">
              已连接聊天服务器
            </span>
            <button
              type="button"
              className="text-xs text-[var(--color-destructive)] hover:text-[var(--color-destructive)]"
              onClick={chat.disconnect}
            >
              断开连接
            </button>
          </div>
          <RoomList
            rooms={chat.rooms}
            currentRoomId={chat.currentRoomId}
            onJoin={chat.joinRoom}
            onCreate={chat.createRoom}
          />
        </div>
      )}

      {/* Chat Room */}
      {chat.connStatus === "connected" && chat.view === "chat" && (
        <div className="flex h-[65vh] gap-4">
          {/* Left sidebar — room list (desktop) */}
          <div className="hidden lg:flex lg:w-56 shrink-0 flex-col">
            <div className="glass rounded-3xl p-4 flex-1 overflow-y-auto">
              <RoomList
                rooms={chat.rooms}
                currentRoomId={chat.currentRoomId}
                onJoin={chat.joinRoom}
                onCreate={chat.createRoom}
              />
            </div>
          </div>

          {/* Center — chat area */}
          <div className="flex-1 flex flex-col glass rounded-3xl min-w-0">
            <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  className="lg:hidden text-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
                  onClick={chat.leaveRoom}
                  aria-label="离开房间"
                >
                  ←
                </button>
                <h2 className="text-sm font-semibold truncate">{chat.currentRoomName}</h2>
                <span className="text-xs text-[var(--color-foreground-muted)] shrink-0">
                  {chat.members.length} 人
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="lg:hidden text-xs text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
                  onClick={() => setShowMembers(!showMembers)}
                >
                  {showMembers ? "关闭" : "成员"}
                </button>
                <button
                  type="button"
                  className="text-xs text-[var(--color-destructive)] hover:text-[var(--color-destructive)]"
                  onClick={chat.leaveRoom}
                >
                  离开
                </button>
              </div>
            </div>

            <ChatArea
              messages={chat.messages}
              myMemberId={chat.myMemberId}
              typingMembers={chat.typingMembers}
              memberNames={memberNames}
            />

            <div className="shrink-0 px-4 py-3 border-t border-[var(--color-border)]">
              <ChatInput
                onSend={chat.sendMessage}
                onFileShare={chat.shareFile}
                onTyping={chat.setTyping}
              />
            </div>
          </div>

          {/* Right sidebar — member list */}
          <div className={`lg:flex lg:w-48 shrink-0 flex-col ${showMembers ? "fixed inset-0 z-50 p-4 bg-black/60 flex" : "hidden"}`}>
            <div className="glass rounded-3xl p-4 flex-1 overflow-y-auto">
              <div className="lg:hidden flex justify-end mb-2">
                <button
                  type="button"
                  className="text-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
                  onClick={() => setShowMembers(false)}
                >
                  关闭 ✕
                </button>
              </div>
              <MemberList
                members={chat.members}
                myMemberId={chat.myMemberId}
                typingMembers={chat.typingMembers}
              />
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
