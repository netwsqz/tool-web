"use client";

interface WordDisplayProps {
  word: string;
  showWord: boolean;
  hint?: string;
}

export function WordDisplay({ word, showWord, hint }: WordDisplayProps) {
  if (!showWord) {
    return (
      <div className="text-center">
        <p className="text-sm text-[var(--color-text-secondary)] mb-1">词语</p>
        <p className="text-lg font-semibold tracking-widest">
          {"?".repeat(word.length)}
        </p>
        {hint && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            提示：{hint}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-sm text-[var(--color-text-secondary)] mb-1">
        你要画这个词
      </p>
      <p className="text-2xl font-bold text-[var(--color-accent)] tracking-wider">
        {word}
      </p>
      {hint && (
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          提示：{hint}
        </p>
      )}
    </div>
  );
}
