"use client";

import { ArrowLeftRight } from "lucide-react";
import { ToolLayout } from "@/components/ui/ToolLayout";
import { useP2PTransfer } from "@/hooks/useP2PTransfer";
import { PeerConnect } from "@/components/p2p-transfer/PeerConnect";
import { FileDropZone } from "@/components/p2p-transfer/FileDropZone";
import { TransferTable } from "@/components/p2p-transfer/TransferTable";

export default function P2PTransferPage() {
  const p2p = useP2PTransfer();

  return (
    <ToolLayout
      title="P2P 快传"
      description="局域网点对点直连 · 不限文件大小 · 数据不经服务器"
      icon={ArrowLeftRight}
      maxWidth="lg"
    >
      {/* Error */}
      {p2p.error && (
        <div className="mb-4 px-4 py-2 rounded-xl bg-[var(--color-destructive)]/20 text-[var(--color-destructive)] text-sm flex items-center justify-between">
          <span>{p2p.error}</span>
          <button
            type="button"
            className="text-red-300 hover:text-red-200 ml-2"
            onClick={p2p.clearError}
          >
            ✕
          </button>
        </div>
      )}

      {/* Connection panel */}
      <div className="mb-6">
        <PeerConnect
          connStatus={p2p.connStatus}
          roomCode={p2p.roomCode}
          peerName={p2p.peerName}
          localName={p2p.localName}
          onLocalNameChange={p2p.setLocalName}
          onCreateRoom={p2p.createRoom}
          onJoinRoom={p2p.joinRoom}
          onDisconnect={p2p.disconnect}
          availableRooms={p2p.availableRooms}
          isSearching={p2p.isSearching}
          onSearchRooms={p2p.searchRooms}
        />
      </div>

      {/* File drop zone (only when connected) */}
      {p2p.connStatus === "connected" && (
        <div className="mb-6">
          <FileDropZone onFilesSelected={p2p.sendFiles} />
        </div>
      )}

      {/* Transfer list */}
      <TransferTable
        transfers={p2p.transfers}
        onCancel={p2p.cancelTransfer}
        onClearCompleted={p2p.clearCompleted}
      />

      {/* Instructions when idle */}
      {p2p.connStatus === "idle" && p2p.transfers.length === 0 && (
        <div className="glass rounded-3xl p-6 text-center">
          <div className="size-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-3">
            <ArrowLeftRight className="size-5 text-[var(--color-accent)]" />
          </div>
          <p className="text-sm text-[var(--color-foreground-muted)] mb-2">
            WebRTC 点对点直连，文件传输不经过服务器
          </p>
          <p className="text-xs text-[var(--color-foreground-subtle)]">
            双方在同一局域网内，一人创建房间，另一人输入房间号加入即可互传文件。
            <br />
            支持任意大小文件，传输速度取决于局域网带宽。
          </p>
        </div>
      )}
    </ToolLayout>
  );
}
