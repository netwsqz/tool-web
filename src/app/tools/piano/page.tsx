"use client";

import { Piano } from "lucide-react";
import { ToolLayout } from "@/components/ui/ToolLayout";
import { usePiano } from "@/hooks/usePiano";
import { PianoKeyboard } from "@/components/piano/PianoKeyboard";
import { PianoControlBar } from "@/components/piano/PianoControlBar";

export default function PianoPage() {
  const {
    activeNotes,
    volume,
    instrument,
    showLabels,
    recording,
    baseOctave,
    noteOn,
    noteOff,
    clearAllNotes,
    setInstrument,
    setVolume,
    toggleLabels,
    toggleRecording,
  } = usePiano();

  return (
    <ToolLayout
      title="在线钢琴"
      description="使用 Web Audio API 的交互式钢琴"
      icon={Piano}
      maxWidth="full"
    >
      <div className="glass rounded-3xl p-6 space-y-6">
        <PianoControlBar
          instrument={instrument}
          volume={volume}
          showLabels={showLabels}
          recording={recording}
          baseOctave={baseOctave}
          onInstrumentChange={setInstrument}
          onVolumeChange={setVolume}
          onToggleLabels={toggleLabels}
          onToggleRecording={toggleRecording}
          onClearAll={clearAllNotes}
        />

        <PianoKeyboard
          activeNotes={activeNotes}
          showLabels={showLabels}
          baseOctave={baseOctave}
          onNoteOn={noteOn}
          onNoteOff={noteOff}
        />

        <div className="text-center text-xs text-[var(--color-foreground-muted)] leading-relaxed">
          <p className="leading-relaxed">
            <span className="text-[var(--color-foreground-subtle)]">下排</span> Z S X D C V G B H N J M → C C# D D# E F F# G G# A A# B
            <br />
            <span className="text-[var(--color-foreground-subtle)]">上排</span> Q 2 W 3 E R 5 T 6 Y 7 U I → C C# D D# E F F# G G# A A# B C
            <span className="mx-2 text-[var(--color-foreground-subtle)]">·</span>
            ← → 切换八度
          </p>
        </div>
      </div>
    </ToolLayout>
  );
}
