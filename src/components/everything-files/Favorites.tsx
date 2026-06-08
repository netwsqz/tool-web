"use client";

import { useState } from "react";

interface Props {
  favorites: string[];
  currentPath: string | null;
  onBrowse: (path: string) => void;
  onAdd: (path: string) => void;
  onRemove: (path: string) => void;
}

export function Favorites({ favorites, currentPath, onBrowse, onAdd, onRemove }: Props) {
  const [adding, setAdding] = useState(false);

  const handleAddCurrent = () => {
    if (currentPath) {
      onAdd(currentPath);
      setAdding(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-medium text-[var(--color-text-secondary)]">收藏夹</h3>
        <div className="flex items-center gap-1">
          {currentPath && (
            <button
              onClick={() => setAdding(!adding)}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]
                transition-colors"
              title="添加当前目录到收藏夹"
            >
              {adding ? "取消" : "+"}
            </button>
          )}
        </div>
      </div>

      {adding && (
        <div className="mb-2 px-1">
          <button
            onClick={handleAddCurrent}
            className="text-xs text-[var(--color-accent)] hover:underline truncate block w-full text-left"
          >
            + 收藏当前目录: {currentPath}
          </button>
        </div>
      )}

      <div className="space-y-0.5">
        {favorites.length === 0 && !adding ? (
          <p className="px-1 text-xs text-[var(--color-text-secondary)] opacity-50">
            暂无收藏，浏览目录时可点击 + 添加
          </p>
        ) : (
          favorites.map((fav) => (
            <div key={fav} className="flex items-center group px-1 rounded-lg hover:bg-[var(--color-bg-card)]">
              <button
                onClick={() => onBrowse(fav)}
                className="flex-1 text-left py-1.5 text-sm text-[var(--color-text-secondary)]
                  hover:text-[var(--color-text-primary)] transition-colors truncate"
              >
                ⭐ {fav.split("\\").pop() || fav}
                <span className="block text-xs opacity-50 truncate">{fav}</span>
              </button>
              <button
                onClick={() => onRemove(fav)}
                className="opacity-0 group-hover:opacity-100 text-xs text-[var(--color-destructive)]
                  hover:text-[var(--color-destructive)] px-1 transition-opacity"
                title="移除收藏"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
