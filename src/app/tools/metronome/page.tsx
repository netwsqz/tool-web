"use client";

import { Timer } from "lucide-react";
import { ToolLayout } from "@/components/ui/ToolLayout";
import { useMetronome } from "@/hooks/useMetronome";
import { PlayButton } from "@/components/metronome/PlayButton";
import { BpmControl } from "@/components/metronome/BpmControl";
import { BeatIndicator } from "@/components/metronome/BeatIndicator";
import { TapTempo } from "@/components/metronome/TapTempo";

export default function MetronomePage() {
  const { isPlaying, bpm, currentBeat, tapBpm, toggle, setBpm, tap } =
    useMetronome(120);

  return (
    <ToolLayout
      title="节拍器"
      description="4/4 拍 · Web Audio 引擎"
      icon={Timer}
      maxWidth="sm"
    >
      <div className="glass rounded-3xl p-8 space-y-8">
        <BpmControl bpm={bpm} onBpmChange={setBpm} />
        <BeatIndicator currentBeat={currentBeat} isPlaying={isPlaying} />
        <div className="flex items-center justify-center gap-8 pt-2">
          <TapTempo onTap={tap} tapBpm={tapBpm} />
          <PlayButton isPlaying={isPlaying} onToggle={toggle} />
        </div>
      </div>
    </ToolLayout>
  );
}
