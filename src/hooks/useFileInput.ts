"use client";

import { useCallback, useRef } from "react";

type UseFileInputOptions = {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
};

export function useFileInput({ accept, multiple = true, onFiles }: UseFileInputOptions) {
  const ref = useRef<HTMLInputElement>(null);

  const openFilePicker = useCallback(() => {
    ref.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFiles(Array.from(files));
      }
      e.target.value = "";
    },
    [onFiles],
  );

  return { fileInputRef: ref, openFilePicker, handleFileChange, accept, multiple };
}
