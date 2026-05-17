import { scheduleAccent, scheduleNormal, resumeContext, getAudioNow } from "./sounds";

export class MetronomeEngine {
  private bpm: number;
  private beatsPerMeasure: number;
  private currentBeat = 0;
  private nextBeatTime = 0;
  private schedulerTimer: ReturnType<typeof setInterval> | null = null;
  private readonly lookAhead = 0.1;
  private readonly scheduleInterval = 25;
  private onBeat: ((beat: number) => void) | null = null;

  constructor(bpm = 120, beatsPerMeasure = 4) {
    this.bpm = bpm;
    this.beatsPerMeasure = beatsPerMeasure;
  }

  setOnBeat(callback: (beat: number) => void) {
    this.onBeat = callback;
  }

  start() {
    resumeContext();

    const now = getAudioNow();
    this.currentBeat = 0;
    const beatInterval = 60 / this.bpm;
    this.nextBeatTime = now + beatInterval;

    this.schedulerTimer = setInterval(() => this.tick(), this.scheduleInterval);
    this.tick();
  }

  stop() {
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  get isPlaying() {
    return this.schedulerTimer !== null;
  }

  setBpm(bpm: number) {
    this.bpm = Math.max(20, Math.min(300, bpm));
  }

  getBpm() {
    return this.bpm;
  }

  setBeatsPerMeasure(n: number) {
    this.beatsPerMeasure = n;
    this.currentBeat = 0;
  }

  /**
   * 计算 tap tempo 的 BPM。
   * @param taps 最近点击的毫秒级时间戳数组
   */
  static calculateTapBpm(taps: number[]): number | null {
    if (taps.length < 2) return null;
    const recent = taps.slice(-5);
    let totalInterval = 0;
    let count = 0;
    for (let i = 1; i < recent.length; i++) {
      totalInterval += recent[i] - recent[i - 1];
      count++;
    }
    if (count === 0) return null;
    const avgMs = totalInterval / count;
    const bpm = Math.round(60000 / avgMs);
    return Math.max(20, Math.min(300, bpm));
  }

  /** 调度循环 — 每 25ms 执行一次 */
  private tick() {
    const now = getAudioNow();
    const beatInterval = 60 / this.bpm;

    while (this.nextBeatTime < now + this.lookAhead) {
      if (this.currentBeat === 0) {
        scheduleAccent(this.nextBeatTime);
      } else {
        scheduleNormal(this.nextBeatTime);
      }

      // 通知 UI（用 setTimeout(0) 推入微任务，避免阻塞调度）
      const beat = this.currentBeat;
      setTimeout(() => this.onBeat?.(beat), 0);

      this.nextBeatTime += beatInterval;
      this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;

      // 防止死循环
      if (this.nextBeatTime > now + this.lookAhead + beatInterval) break;
    }
  }

  destroy() {
    this.stop();
    this.onBeat = null;
  }
}
