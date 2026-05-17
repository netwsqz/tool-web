let cachedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!cachedCtx || cachedCtx.state === "closed") {
    cachedCtx = new AudioContext();
  }
  return cachedCtx;
}

/**
 * 在指定时间点播放一个短促 click 音。
 * @param time Web Audio 时间戳 (audioContext.currentTime + offset)
 * @param frequency Hz，强拍更高
 * @param gain 0~1 音量系数
 */
export function scheduleClick(time: number, frequency: number, gain: number) {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = "square";
  osc.frequency.value = frequency;

  // 短促包络：瞬间起音 → 30ms 内指数衰减到静音
  gainNode.gain.setValueAtTime(gain, time);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(time);
  osc.stop(time + 0.03);
}

/** 强拍音色 (每小节第一拍) */
export function scheduleAccent(time: number) {
  scheduleClick(time, 880, 0.6);
}

/** 弱拍音色 */
export function scheduleNormal(time: number) {
  scheduleClick(time, 440, 0.35);
}

/** 获取当前音频硬件时钟 */
export function getAudioNow(): number {
  return getAudioContext().currentTime;
}

/** 恢复 AudioContext (需要用户交互后调用，解决浏览器自动播放策略) */
export function resumeContext() {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume();
  }
}
