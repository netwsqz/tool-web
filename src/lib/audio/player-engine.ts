export class PlayerEngine {
  private ctx: AudioContext | null = null;
  private audio: HTMLAudioElement | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private gain: GainNode | null = null;
  private rafId: number | null = null;
  readonly freqData = new Uint8Array(128);

  onTimeUpdate: ((time: number) => void) | null = null;
  onEnded: (() => void) | null = null;
  onLoaded: ((duration: number) => void) | null = null;
  onFrequencyData: (() => void) | null = null;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  load(url: string): Promise<void> {
    this.unload();

    const ctx = this.getContext();

    return new Promise((resolve, reject) => {
      const audio = new Audio();

      audio.addEventListener(
        "loadedmetadata",
        () => {
          try {
            const source = ctx.createMediaElementSource(audio);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;

            const gain = ctx.createGain();
            gain.gain.value = 0.7;

            source.connect(analyser);
            analyser.connect(gain);
            gain.connect(ctx.destination);

            this.audio = audio;
            this.source = source;
            this.analyser = analyser;
            this.gain = gain;

            this.onLoaded?.(audio.duration);
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        { once: true },
      );

      audio.addEventListener("error", () => {
        reject(new Error("无法加载音频文件"));
      });

      audio.addEventListener("timeupdate", () => {
        this.onTimeUpdate?.(audio.currentTime);
      });

      audio.addEventListener("ended", () => {
        this.onEnded?.();
      });

      audio.src = url;
      audio.load();
    });
  }

  play(): void {
    if (!this.audio) return;
    const ctx = this.getContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    this.audio.play().catch(() => {
      // 自动播放策略阻止 — 用户需要先交互
    });
    this.startAnalyzer();
  }

  pause(): void {
    this.audio?.pause();
    this.stopAnalyzer();
  }

  seek(time: number): void {
    if (this.audio) {
      this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || 0));
    }
  }

  setVolume(v: number): void {
    if (this.gain) {
      this.gain.gain.value = Math.max(0, Math.min(1, v));
    }
  }

  get currentTime(): number {
    return this.audio?.currentTime ?? 0;
  }

  get duration(): number {
    return this.audio?.duration ?? 0;
  }

  private startAnalyzer(): void {
    // 防止重复启动 — 如果已有循环在运行则跳过
    if (this.rafId !== null) return;
    const loop = () => {
      if (this.analyser) {
        this.analyser.getByteFrequencyData(this.freqData);
        this.onFrequencyData?.();
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopAnalyzer(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private unload(): void {
    this.stopAnalyzer();
    if (this.source) {
      try {
        this.source.disconnect();
      } catch { /* empty */ }
      this.source = null;
    }
    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch { /* empty */ }
      this.analyser = null;
    }
    if (this.gain) {
      try {
        this.gain.disconnect();
      } catch { /* empty */ }
      this.gain = null;
    }
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio.load();
      this.audio = null;
    }
  }

  destroy(): void {
    this.unload();
    this.onTimeUpdate = null;
    this.onEnded = null;
    this.onLoaded = null;
    this.onFrequencyData = null;
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
