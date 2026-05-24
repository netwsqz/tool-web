// src/components/fruit-slice/GameCanvas.tsx
"use client";

import { forwardRef } from "react";

interface GameCanvasProps {
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
}

export const GameCanvas = forwardRef<HTMLCanvasElement, GameCanvasProps>(
  function GameCanvas({ onPointerDown, onPointerMove, onPointerUp, onTouchStart }, ref) {
    return (
      <canvas
        ref={ref}
        className="w-full h-full cursor-crosshair touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onTouchStart={onTouchStart}
      />
    );
  },
);
