"use client";

import { useState } from "react";

interface GuessInputProps {
  onGuess: (text: string) => void;
  disabled?: boolean;
}

export function GuessInput({ onGuess, disabled = false }: GuessInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onGuess(trimmed);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder="输入你的猜测..."
        aria-label="输入猜测"
        className="flex-1 px-3 py-2 rounded-xl bg-black/5 border border-black/10
          text-sm text-[var(--color-foreground)] placeholder-[var(--color-text-secondary)]
          focus:outline-none focus:border-[var(--color-accent)] transition-colors
          disabled:opacity-40 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="px-4 py-2 rounded-xl text-sm font-medium
          bg-[var(--color-accent)] text-white
          hover:opacity-90 transition-opacity
          disabled:opacity-30 disabled:cursor-not-allowed"
      >
        猜
      </button>
    </form>
  );
}
