"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  P2PConnectionStatus,
  P2PPeer,
  P2PTransferItem,
  P2PFileInfoMessage,
} from "@/types/p2p";

const CHUNK_SIZE = 16384; // 16KB per DataChannel message
const SPEED_WINDOW = 2000; // sliding window for speed calculation (ms)
const BUFFER_THRESHOLD = 1024 * 1024; // 1MB backpressure threshold
const STUN_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

interface SpeedSample {
  time: number;
  bytes: number;
}

export interface UseP2PTransferReturn {
  connStatus: P2PConnectionStatus;
  roomCode: string;
  peerName: string;
  localName: string;
  setLocalName: (v: string) => void;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  disconnect: () => void;
  sendFiles: (files: File[]) => void;
  cancelTransfer: (transferId: string) => void;
  clearCompleted: () => void;
  transfers: P2PTransferItem[];
  availableRooms: { roomCode: string; peerName: string; createdAt?: number }[];
  isSearching: boolean;
  searchRooms: () => void;
  error: string;
  clearError: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function useP2PTransfer(): UseP2PTransferReturn {
  // ── Connection state ──
  const [connStatus, setConnStatus] = useState<P2PConnectionStatus>("idle");
  const [roomCode, setRoomCode] = useState("");
  const [peerName, setPeerName] = useState("");
  const [localName, setLocalName] = useState("");
  const [error, setError] = useState("");

  // ── Transfer state ──
  const [transfers, setTransfers] = useState<P2PTransferItem[]>([]);

  // ── Room discovery state ──
  const [availableRooms, setAvailableRooms] = useState<{ roomCode: string; peerName: string; createdAt?: number }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ── Refs (stable across renders) ──
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const peerIdRef = useRef<string>("");
  const connectedRef = useRef(false);
  const speedSamplesRef = useRef<SpeedSample[]>([]);
  const pendingFilesRef = useRef<File[]>([]); // queue of files to send
  const currentTransferRef = useRef<P2PTransferItem | null>(null);
  const receivingBufferRef = useRef<ArrayBuffer[]>([]);
  const receivingFileInfoRef = useRef<P2PFileInfoMessage | null>(null);
  // 轮询检测 WebSocket 就绪状态的间隔引用，确保卸载时清理
  const checkReadyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 房间列表自动刷新间隔
  const searchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs for send-chunk loop (to avoid stale closure)
  const sendingFileRef = useRef<{ file: File; fileId: string; totalChunks: number; currentChunk: number } | null>(null);
  const sendingPausedRef = useRef(false);

  const clearError = useCallback(() => setError(""), []);

  const clearCompleted = useCallback(() => {
    setTransfers((prev) => prev.filter((t) => t.status === "transferring" || t.status === "pending"));
  }, []);

  // ── Update transfer helper ──
  const updateTransfer = useCallback((id: string, patch: Partial<P2PTransferItem>) => {
    setTransfers((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }, []);

  const addTransfer = useCallback((item: P2PTransferItem) => {
    setTransfers((prev) => [item, ...prev]);
  }, []);

  // ── Speed calculation ──
  const recordBytes = useCallback((bytes: number) => {
    const now = Date.now();
    speedSamplesRef.current.push({ time: now, bytes });
    // Prune samples outside window
    speedSamplesRef.current = speedSamplesRef.current.filter((s) => now - s.time < SPEED_WINDOW);
  }, []);

  const getSpeed = useCallback((): number => {
    const samples = speedSamplesRef.current;
    if (samples.length < 2) return 0;
    const oldest = samples[0];
    const now = Date.now();
    const elapsed = (now - oldest.time) / 1000;
    if (elapsed <= 0) return 0;
    const totalBytes = samples.reduce((sum, s) => sum + s.bytes, 0);
    return totalBytes / elapsed;
  }, []);

  // ── DataChannel setup ──
  const setupDataChannel = useCallback((dc: RTCDataChannel) => {
    dc.binaryType = "arraybuffer";
    dc.bufferedAmountLowThreshold = BUFFER_THRESHOLD;

    dc.onopen = () => {
      connectedRef.current = true;
      setConnStatus("connected");
      // Process queued files
      const queue = pendingFilesRef.current;
      pendingFilesRef.current = [];
      for (const file of queue) {
        startSendingFile(file, dc);
      }
    };

    dc.onclose = () => {
      connectedRef.current = false;
      handleDisconnect();
    };

    dc.onerror = () => {
      connectedRef.current = false;
      handleDisconnect();
    };

    dc.onmessage = (e: MessageEvent) => {
      if (typeof e.data === "string") {
        handleDataMessage(JSON.parse(e.data), dc);
      } else if (e.data instanceof ArrayBuffer) {
        handleBinaryMessage(e.data);
      }
    };

    // Handle backpressure for sending
    dc.onbufferedamountlow = () => {
      sendingPausedRef.current = false;
      sendNextChunk();
    };

    dcRef.current = dc;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── File sending (one at a time) ──
  const startSendingFile = useCallback((file: File, dc: RTCDataChannel) => {
    if (!dc || dc.readyState !== "open") {
      // Queue for later
      pendingFilesRef.current = [...pendingFilesRef.current, file];
      return;
    }

    const fileId = generateId();
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const transfer: P2PTransferItem = {
      id: fileId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      direction: "send",
      progress: 0,
      speed: 0,
      eta: 0,
      status: "transferring",
    };
    addTransfer(transfer);
    currentTransferRef.current = transfer;
    speedSamplesRef.current = [];

    // Send file info
    const info: P2PFileInfoMessage = {
      type: "file-info",
      fileId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      totalChunks,
    };
    dc.send(JSON.stringify(info));

    // Start sending chunks
    sendingFileRef.current = { file, fileId, totalChunks, currentChunk: 0 };
    sendNextChunk();
  }, [addTransfer]);

  const sendNextChunk = useCallback(() => {
    const state = sendingFileRef.current;
    const dc = dcRef.current;
    if (!state || !dc || dc.readyState !== "open") return;
    if (sendingPausedRef.current) return;

    const { file, fileId, totalChunks } = state;
    let { currentChunk } = state;

    // Check backpressure
    if (dc.bufferedAmount > BUFFER_THRESHOLD) {
      sendingPausedRef.current = true;
      return;
    }

    const slice = file.slice(currentChunk * CHUNK_SIZE, (currentChunk + 1) * CHUNK_SIZE);
    const reader = new FileReader();
    reader.onload = (e) => {
      const buf = e.target?.result as ArrayBuffer;
      if (!buf) return;

      // Prepend chunk index as Uint32 (4 bytes)
      const header = new ArrayBuffer(4);
      const view = new DataView(header);
      view.setUint32(0, currentChunk, false); // big-endian

      const combined = new Uint8Array(header.byteLength + buf.byteLength);
      combined.set(new Uint8Array(header), 0);
      combined.set(new Uint8Array(buf), header.byteLength);

      dc.send(combined.buffer);

      // Update progress
      state.currentChunk = currentChunk + 1;
      recordBytes(buf.byteLength);
      const speed = getSpeed();
      const remaining = file.size - ((currentChunk + 1) * CHUNK_SIZE);
      const eta = speed > 0 ? Math.max(remaining, 0) / speed : 0;

      updateTransfer(fileId, {
        progress: Math.round(((currentChunk + 1) / totalChunks) * 100),
        speed,
        eta,
      });

      // Schedule next chunk (use setTimeout to avoid stack overflow)
      if (state.currentChunk < totalChunks) {
        setTimeout(() => sendNextChunk(), 0);
      } else {
        // All chunks sent — send completion signal and finalize
        dc.send(JSON.stringify({ type: "file-complete", fileId }));
        updateTransfer(fileId, { status: "completed", progress: 100, speed: 0, eta: 0 });
        currentTransferRef.current = null;
        sendingFileRef.current = null;
        // Process next file in queue if any
        const queue = pendingFilesRef.current;
        if (queue.length > 0) {
          const next = queue.shift()!;
          startSendingFile(next, dc);
        }
      }
    };
    reader.readAsArrayBuffer(slice);
  }, [getSpeed, recordBytes, updateTransfer, startSendingFile]);

  // ── Binary message handler (receiver) ──
  const handleBinaryMessage = useCallback((data: ArrayBuffer) => {
    const info = receivingFileInfoRef.current;
    if (!info) return;

    // First 4 bytes = chunkIndex
    const view = new DataView(data);
    const chunkIndex = view.getUint32(0, false);
    const chunkData = data.slice(4);

    // Place chunk at correct index (DataChannel is ordered, but be defensive)
    receivingBufferRef.current[chunkIndex] = chunkData;
    const receivedBytes = receivingBufferRef.current.reduce((sum, b) => sum + b.byteLength, 0);
    const progress = Math.round((receivedBytes / info.fileSize) * 100);

    recordBytes(chunkData.byteLength);
    const speed = getSpeed();
    const remaining = info.fileSize - receivedBytes;
    const eta = speed > 0 ? remaining / speed : 0;

    updateTransfer(info.fileId, {
      status: "transferring",
      progress,
      speed,
      eta,
    });
  }, [getSpeed, recordBytes, updateTransfer]);

  // ── Data channel JSON message handler ──
  const handleDataMessage = useCallback((msg: any, dc: RTCDataChannel) => {
    switch (msg.type) {
      case "file-info": {
        const info = msg as P2PFileInfoMessage;
        receivingFileInfoRef.current = info;
        receivingBufferRef.current = [];
        const transfer: P2PTransferItem = {
          id: info.fileId,
          fileName: info.fileName,
          fileSize: info.fileSize,
          mimeType: info.mimeType,
          direction: "receive",
          progress: 0,
          speed: 0,
          eta: 0,
          status: "pending",
        };
        addTransfer(transfer);
        currentTransferRef.current = transfer;
        speedSamplesRef.current = [];
        break;
      }

      case "file-complete": {
        const { fileId } = msg;
        const info = receivingFileInfoRef.current;
        if (!info || info.fileId !== fileId) return;

        // Assemble blob
        const blob = new Blob(receivingBufferRef.current, { type: info.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = info.fileName;
        a.click();
        URL.revokeObjectURL(url);

        updateTransfer(fileId, { status: "completed", progress: 100, speed: 0, eta: 0 });
        receivingFileInfoRef.current = null;
        receivingBufferRef.current = [];
        currentTransferRef.current = null;
        break;
      }

      case "file-cancel": {
        const { fileId, reason } = msg;
        updateTransfer(fileId, { status: "cancelled", error: reason });
        receivingFileInfoRef.current = null;
        receivingBufferRef.current = [];
        currentTransferRef.current = null;
        break;
      }
    }
  }, [addTransfer, updateTransfer]);

  // ── Disconnect cleanup ──
  const handleDisconnect = useCallback(() => {
    // Cancel any active transfer
    if (currentTransferRef.current) {
      updateTransfer(currentTransferRef.current.id, {
        status: "cancelled",
        error: "连接已断开",
      });
    }
    sendingFileRef.current = null;
    receivingFileInfoRef.current = null;
    receivingBufferRef.current = [];
    currentTransferRef.current = null;
    speedSamplesRef.current = [];

    if (dcRef.current) {
      dcRef.current.onopen = null;
      dcRef.current.onclose = null;
      dcRef.current.onmessage = null;
      dcRef.current.onerror = null;
      dcRef.current.onbufferedamountlow = null;
      dcRef.current.close();
      dcRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.ondatachannel = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    connectedRef.current = false;
    peerIdRef.current = "";
    setConnStatus("disconnected");
    setRoomCode("");
    setPeerName("");
    setAvailableRooms([]);
    setIsSearching(false);
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }
  }, [updateTransfer]);

  // ── WebSocket signaling ──
  const connectSignaling = useCallback(() => {
    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = new WebSocket(`ws://${window.location.host}/ws/p2p`);

    ws.onopen = () => {
      /* ready */
    };

    ws.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      switch (msg.type) {
        case "room-created": {
          setRoomCode(msg.roomCode);
          peerIdRef.current = msg.peerId;
          setConnStatus("waiting-peer");
          break;
        }

        case "room-joined": {
          setRoomCode(msg.roomCode);
          peerIdRef.current = msg.peerId;
          setPeerName(msg.remotePeer?.name || "");
          setConnStatus("connecting");
          // Joiner creates the offer
          createOffer(ws).catch(() => setError("无法创建连接"));
          break;
        }

        case "peer-joined": {
          setPeerName(msg.name || "");
          setConnStatus("connecting");
          // Room creator (already waiting) creates the offer
          // Actually, let's have the newer peer (joiner) always be the offerer
          // Room creator waits for an offer instead
          break;
        }

        case "offer": {
          handleOffer(ws, msg.sdp).catch(() => setError("无法处理连接请求"));
          break;
        }

        case "answer": {
          handleAnswer(msg.sdp).catch(() => setError("无法建立连接"));
          break;
        }

        case "ice-candidate": {
          if (pcRef.current && msg.candidate) {
            pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {});
          }
          break;
        }

        case "peer-left": {
          setError("对方已断开连接");
          handleDisconnect();
          break;
        }

        case "error": {
          setError(msg.message);
          setConnStatus("disconnected");
          break;
        }

        case "room-list": {
          setAvailableRooms(msg.rooms || []);
          setIsSearching(false);
          // Auto-refresh room list every 10s
          if (searchIntervalRef.current) {
            clearInterval(searchIntervalRef.current);
          }
          searchIntervalRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: "list-rooms" }));
            }
          }, 10000);
          break;
        }
      }
    };

    ws.onclose = () => {
      // Only handle if we haven't already cleaned up
      if (wsRef.current) {
        handleDisconnect();
      }
    };

    ws.onerror = () => {
      setError("无法连接到信令服务器，请确认服务器已启动 (npm run dev)");
    };

    wsRef.current = ws;
  }, [handleDisconnect]);

  // ── WebRTC helpers ──
  const createOffer = async (ws: WebSocket) => {
    const pc = new RTCPeerConnection(STUN_SERVERS);
    pcRef.current = pc;

    const dc = pc.createDataChannel("p2p-file");
    setupDataChannel(dc);

    pc.onicecandidate = (e) => {
      if (e.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ice-candidate", candidate: e.candidate.toJSON() }));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        handleDisconnect();
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({ type: "offer", sdp: offer }));
  };

  const handleOffer = async (ws: WebSocket, sdp: any) => {
    const pc = new RTCPeerConnection(STUN_SERVERS);
    pcRef.current = pc;

    pc.ondatachannel = (e) => {
      setupDataChannel(e.channel);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ice-candidate", candidate: e.candidate.toJSON() }));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        handleDisconnect();
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    ws.send(JSON.stringify({ type: "answer", sdp: answer }));
  };

  const handleAnswer = async (sdp: any) => {
    if (pcRef.current) {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  };

  // ── Public actions ──
  const createRoom = useCallback(() => {
    setError("");
    setConnStatus("creating-room");
    // Stop auto-refresh when creating own room
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }
    connectSignaling();
    // Send create-room once connected
    if (checkReadyIntervalRef.current) clearInterval(checkReadyIntervalRef.current);
    const checkReady = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        clearInterval(checkReady);
        checkReadyIntervalRef.current = null;
        wsRef.current!.send(JSON.stringify({ type: "create-room", name: localName.trim() || "我" }));
      } else if (wsRef.current?.readyState === WebSocket.CLOSED) {
        clearInterval(checkReady);
        checkReadyIntervalRef.current = null;
        setError("无法连接到信令服务器");
      }
    }, 100);
    checkReadyIntervalRef.current = checkReady;
    // Timeout after 10s
    setTimeout(() => {
      if (checkReadyIntervalRef.current === checkReady) {
        clearInterval(checkReady);
        checkReadyIntervalRef.current = null;
      }
    }, 10000);
  }, [connectSignaling, localName]);

  const joinRoom = useCallback((code: string) => {
    if (!code.trim()) { setError("请输入房间号"); return; }
    setError("");
    setConnStatus("joining-room");
    // Stop auto-refresh when joining a room
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }
    connectSignaling();
    if (checkReadyIntervalRef.current) clearInterval(checkReadyIntervalRef.current);
    const checkReady = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        clearInterval(checkReady);
        checkReadyIntervalRef.current = null;
        wsRef.current!.send(JSON.stringify({ type: "join-room", roomCode: code.trim().toUpperCase(), name: localName.trim() || "我" }));
      } else if (wsRef.current?.readyState === WebSocket.CLOSED) {
        clearInterval(checkReady);
        checkReadyIntervalRef.current = null;
        setError("无法连接到信令服务器");
      }
    }, 100);
    checkReadyIntervalRef.current = checkReady;
    setTimeout(() => {
      if (checkReadyIntervalRef.current === checkReady) {
        clearInterval(checkReady);
        checkReadyIntervalRef.current = null;
      }
    }, 10000);
  }, [connectSignaling, localName]);

  const disconnect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "leave" }));
    }
    handleDisconnect();
  }, [handleDisconnect]);

  // ── Room discovery ──
  const searchRooms = useCallback(() => {
    setError("");
    setAvailableRooms([]);

    const doSearch = (ws: WebSocket) => {
      setIsSearching(true);
      ws.send(JSON.stringify({ type: "list-rooms" }));
      // Search timeout: stop spinner after 10s if no response
      setTimeout(() => {
        setIsSearching((prev) => (prev ? false : prev));
      }, 10000);
    };

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectSignaling();
      if (checkReadyIntervalRef.current) clearInterval(checkReadyIntervalRef.current);
      const checkReady = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          clearInterval(checkReady);
          checkReadyIntervalRef.current = null;
          doSearch(wsRef.current!);
        } else if (wsRef.current?.readyState === WebSocket.CLOSED) {
          clearInterval(checkReady);
          checkReadyIntervalRef.current = null;
          setError("无法连接到信令服务器");
        }
      }, 100);
      checkReadyIntervalRef.current = checkReady;
      setTimeout(() => {
        if (checkReadyIntervalRef.current === checkReady) {
          clearInterval(checkReady);
          checkReadyIntervalRef.current = null;
        }
      }, 10000);
      return;
    }

    doSearch(wsRef.current);
  }, [connectSignaling]);

  const sendFiles = useCallback((files: File[]) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") {
      setError("未连接，无法发送文件");
      return;
    }
    for (const file of files) {
      startSendingFile(file, dc);
    }
  }, [startSendingFile]);

  const cancelTransfer = useCallback((transferId: string) => {
    // If it's the current transfer being sent, cancel it
    const sending = sendingFileRef.current;
    if (sending && sending.fileId === transferId) {
      sendingFileRef.current = null;
      if (dcRef.current?.readyState === "open") {
        dcRef.current.send(JSON.stringify({ type: "file-cancel", fileId: transferId, reason: "用户取消" }));
      }
    }
    updateTransfer(transferId, { status: "cancelled" });
    // Check if cancelled transfer was receive-side
    if (receivingFileInfoRef.current?.fileId === transferId) {
      receivingFileInfoRef.current = null;
      receivingBufferRef.current = [];
    }
    currentTransferRef.current = null;
  }, [updateTransfer]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (checkReadyIntervalRef.current) {
        clearInterval(checkReadyIntervalRef.current);
        checkReadyIntervalRef.current = null;
      }
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
        searchIntervalRef.current = null;
      }
      handleDisconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    connStatus,
    roomCode,
    peerName,
    localName,
    setLocalName,
    createRoom,
    joinRoom,
    disconnect,
    sendFiles,
    cancelTransfer,
    clearCompleted,
    transfers,
    availableRooms,
    isSearching,
    searchRooms,
    error,
    clearError,
  };
}
