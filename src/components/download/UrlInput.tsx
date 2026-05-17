"use client";

import { useState } from "react";

export function UrlInput({
  onParse,
  isParsing,
  disabled,
}: {
  onParse: (url: string) => void;
  isParsing: boolean;
  disabled: boolean;
}) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isParsing && !disabled) {
      onParse(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="flex-1 relative">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="粘贴视频链接…"
          disabled={disabled || isParsing}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm
            text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]
            focus:outline-none focus:border-[var(--color-accent)]/50 transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>
      <button
        type="submit"
        disabled={!url.trim() || isParsing || disabled}
        className="px-5 py-3 rounded-xl bg-[var(--color-accent)] text-white text-sm font-medium
          hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center gap-2 shrink-0"
      >
        {isParsing ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            解析中
          </>
        ) : (
          "解析"
        )}
      </button>
    </form>
  );
}
