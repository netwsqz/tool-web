"use client";

import { DriveList } from "./DriveList";
import { Favorites } from "./Favorites";
import { DirectoryTree } from "./DirectoryTree";

interface Props {
  drives: string[];
  drivesLoading: boolean;
  favorites: string[];
  currentPath: string | null;
  onBrowse: (path: string) => void;
  onAddFavorite: (path: string) => void;
  onRemoveFavorite: (path: string) => void;
}

export function Sidebar({
  drives,
  drivesLoading,
  favorites,
  currentPath,
  onBrowse,
  onAddFavorite,
  onRemoveFavorite,
}: Props) {
  return (
    <aside className="w-56 flex-shrink-0 space-y-6 overflow-y-auto">
      <DriveList drives={drives} loading={drivesLoading} onBrowse={onBrowse} />
      <Favorites
        favorites={favorites}
        currentPath={currentPath}
        onBrowse={onBrowse}
        onAdd={onAddFavorite}
        onRemove={onRemoveFavorite}
      />
      <DirectoryTree onBrowse={onBrowse} />
    </aside>
  );
}
