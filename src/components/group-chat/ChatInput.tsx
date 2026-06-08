"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface Props {
  onSend: (text: string) => void;
  onFileShare: (fileName: string, fileSize: number, url: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, onFileShare, onTyping, disabled }: Props) {
  const [text, setText] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const wasEmptyRef = useRef(true);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
    wasEmptyRef.current = true;
    onTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const nowEmpty = val.trim().length === 0;
    if (wasEmptyRef.current && !nowEmpty) {
      onTyping(true);
    } else if (!wasEmptyRef.current && nowEmpty) {
      onTyping(false);
    }
    wasEmptyRef.current = nowEmpty;
    setText(val);
  };

  useEffect(() => {
    return () => {
      onTyping(false);
    };
  }, [onTyping]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/chat/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        onFileShare(data.fileName, data.fileSize, data.url);
      } else {
        setUploadError("文件上传失败，请重试");
      }
    } catch {
      setUploadError("文件上传失败，请重试");
    }

    if (fileRef.current) fileRef.current.value = "";
  }, [onFileShare]);

  return (
    <div>
      {uploadError && (
        <p className="text-xs text-[var(--color-destructive)] mb-2" role="alert">{uploadError}</p>
      )}
      <div className="flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
      />
      <button
        type="button"
        disabled={disabled}
        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl
          bg-black/5 hover:bg-black/10 transition-colors
          disabled:opacity-30 disabled:cursor-not-allowed text-lg"
        onClick={() => fileRef.current?.click()}
        title="发送文件"
        aria-label="发送文件"
      >
        📎
      </button>
      <input
        type="text"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="输入消息..."
        aria-label="消息内容"
        disabled={disabled}
        maxLength={500}
        className="flex-1 px-4 py-2 rounded-xl bg-black/5 border border-black/10
          text-sm text-[var(--color-foreground)] placeholder-[var(--color-text-secondary)]
          focus:outline-none focus:border-[var(--color-accent)] transition-colors
          disabled:opacity-30 disabled:cursor-not-allowed"
      />
      <button
        type="button"
        disabled={disabled || !text.trim()}
        className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium
          bg-[var(--color-accent)] text-white
          hover:opacity-90 transition-opacity
          disabled:opacity-30 disabled:cursor-not-allowed"
        onClick={handleSend}
      >
        发送
      </button>
    </div>
    </div>
  );
}
