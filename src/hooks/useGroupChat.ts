"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  ChatMember,
  ChatRoomInfo,
  ChatMessage,
  ChatPageView,
} from "@/lib/chat/types";

type ConnStatus = "disconnected" | "connecting" | "connected";

export interface UseGroupChatReturn {
  connStatus: ConnStatus;
  nickname: string;
  setNickname: (v: string) => void;
  serverAddress: string;
  setServerAddress: (v: string) => void;
  view: ChatPageView;
  rooms: ChatRoomInfo[];
  currentRoomId: string;
  currentRoomName: string;
  members: ChatMember[];
  messages: ChatMessage[];
  typingMembers: string[];
  error: string;
  myMemberId: string;
  connect: (hostname?: string) => void;
  disconnect: () => void;
  createRoom: (name: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendMessage: (text: string) => void;
  shareFile: (fileName: string, fileSize: number, url: string) => void;
  setTyping: (isTyping: boolean) => void;
  clearError: () => void;
  setError: (msg: string) => void;
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

let clientMsgCounter = 0;
function nextClientMsgId(): string {
  return `${Date.now()}-${++clientMsgCounter}`;
}

export function useGroupChat(): UseGroupChatReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [connStatus, setConnStatus] = useState<ConnStatus>("disconnected");
  const [nickname, setNickname] = useState("");
  const [serverAddress, setServerAddress] = useState("");
  const [view, setView] = useState<ChatPageView>("connect");
  const [rooms, setRooms] = useState<ChatRoomInfo[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [currentRoomName, setCurrentRoomName] = useState("");
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingMembers, setTypingMembers] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [myMemberId, setMyMemberId] = useState("");
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenMsgIdsRef = useRef<Set<string>>(new Set());

  const clearError = useCallback(() => setError(""), []);

  // Restore saved values on client mount only
  useEffect(() => {
    const savedNickname = getCookie("chat_nickname");
    const savedServer = getCookie("chat_server");
    if (savedNickname) setNickname(savedNickname);
    if (savedServer) setServerAddress(savedServer);
  }, []);

  useEffect(() => {
    if (nickname) setCookie("chat_nickname", nickname, 365);
  }, [nickname]);

  useEffect(() => {
    if (serverAddress) setCookie("chat_server", serverAddress, 365);
  }, [serverAddress]);

  const addMessages = useCallback((newMsgs: ChatMessage[]) => {
    const seen = seenMsgIdsRef.current;
    const deduped = newMsgs.filter((m) => {
      if (!m.id) return true;
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
    if (deduped.length === 0) return;
    setMessages((prev) => {
      const combined = [...prev, ...deduped];
      combined.sort((a, b) => a.timestamp - b.timestamp);
      return combined;
    });
  }, []);

  const handleWsMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case "room-list":
        setRooms(msg.rooms || []);
        break;

      case "room-joined":
        setCurrentRoomId(msg.roomId);
        setCurrentRoomName(msg.roomName);
        setMembers(msg.members || []);
        seenMsgIdsRef.current = new Set();
        setMessages(msg.messages || []);
        setTypingMembers([]);
        setMyMemberId(msg.yourId || "");
        setView("chat");
        break;

      case "room-created":
        setCurrentRoomId(msg.roomId);
        setCurrentRoomName(msg.roomName);
        setMembers(msg.members || []);
        seenMsgIdsRef.current = new Set();
        setMessages([]);
        setTypingMembers([]);
        setMyMemberId(msg.yourId || "");
        setView("chat");
        break;

      case "member-joined":
        setMembers((prev) => {
          if (prev.some((m) => m.id === msg.member.id)) return prev;
          return [...prev, msg.member];
        });
        break;

      case "member-left":
        setMembers((prev) => prev.filter((m) => m.id !== msg.memberId));
        break;

      case "message": {
        // Server broadcasts with type "message" as protocol discriminator;
        // stored messages use type "text" for rendering
        const normalized = { ...msg, type: "text" as const, status: "sent" as const };
        if (msg.clientMsgId) {
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.clientMsgId === msg.clientMsgId);
            if (idx !== -1) {
              const next = [...prev];
              next[idx] = normalized;
              return next;
            }
            return [...prev, normalized];
          });
        } else {
          addMessages([normalized]);
        }
        break;
      }

      case "file-shared":
        addMessages([msg]);
        break;

      case "typing":
        setTypingMembers((prev) => {
          if (msg.isTyping) {
            if (prev.includes(msg.senderId)) return prev;
            return [...prev, msg.senderId];
          }
          return prev.filter((id) => id !== msg.senderId);
        });
        break;

      case "error":
        setError(msg.message);
        break;
    }
  }, [addMessages]);

  const currentTypingRef = useRef(false);

  const connect = useCallback((hostname?: string) => {
    if (!nickname.trim()) {
      setError("请输入昵称");
      return;
    }
    setError("");
    setConnStatus("connecting");

    // 关闭已有的连接，防止泄漏
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    const host = hostname || window.location.host;
    const url = `ws://${host}/ws/chat`;

    const ws = new WebSocket(url);
    let initialRoomListReceived = false;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "get-rooms" }));
    };
    ws.onmessage = (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (msg.type === "room-list") {
        if (!initialRoomListReceived) {
          initialRoomListReceived = true;
          setView("rooms");
        }
        setConnStatus("connected");
      }
      if (msg.type === "room-joined") {
        setConnStatus("connected");
      }
      handleWsMessage(msg);
    };
    ws.onclose = () => {
      setConnStatus("disconnected");
      setView("connect");
      setMyMemberId("");
    };
    ws.onerror = () => {
      setError("无法连接到聊天服务器，请确认服务器已启动");
      setConnStatus("disconnected");
    };
    wsRef.current = ws;
  }, [nickname, handleWsMessage]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnStatus("disconnected");
    setView("connect");
    setRooms([]);
    setCurrentRoomId("");
    setCurrentRoomName("");
    setMembers([]);
    setMessages([]);
    setTypingMembers([]);
    setMyMemberId("");
  }, []);

  const createRoom = useCallback((name: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "create-room", roomName: name, nickname: nickname.trim() }));
    }
  }, [nickname]);

  const joinRoom = useCallback((roomId: string) => {
    setError("");
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "join-room", roomId, nickname: nickname.trim() }));
    }
  }, [nickname]);

  const leaveRoom = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "leave-room" }));
    }
    setCurrentRoomId("");
    setCurrentRoomName("");
    setMembers([]);
    setMessages([]);
    setTypingMembers([]);
    setMyMemberId("");
    setView("rooms");
  }, []);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;

    const clientMsgId = nextClientMsgId();

    wsRef.current.send(JSON.stringify({ type: "message", text: trimmed, clientMsgId }));

    const pending: ChatMessage = {
      id: clientMsgId,
      type: "text",
      senderId: myMemberId,
      senderName: nickname.trim(),
      text: trimmed,
      timestamp: Date.now(),
      clientMsgId,
      status: "pending",
    };
    setMessages((prev) => [...prev, pending]);
  }, [myMemberId, nickname]);

  const shareFile = useCallback((fileName: string, fileSize: number, url: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "file-shared", fileName, fileSize, url }));
    }
  }, []);

  const setTyping = useCallback((isTyping: boolean) => {
    if (currentTypingRef.current === isTyping) return;
    currentTypingRef.current = isTyping;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "typing", isTyping }));
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    if (isTyping) {
      typingTimerRef.current = setTimeout(() => {
        currentTypingRef.current = false;
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "typing", isTyping: false }));
        }
      }, 3000);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  return {
    connStatus, nickname, setNickname,
    serverAddress, setServerAddress,
    view, rooms,
    currentRoomId, currentRoomName,
    members, messages, typingMembers, error,
    myMemberId,
    connect, disconnect, createRoom, joinRoom, leaveRoom,
    sendMessage, shareFile, setTyping, clearError, setError,
  };
}
