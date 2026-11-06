// WebAudio-synthesised SFX (SPEC §8.3): no audio files. Every call is best-effort; with no
// AudioContext (not unlocked yet, or unsupported) nothing plays and nothing breaks.
import { getAudioContext } from './unlock';

const SFX_VOLUME = 0.7 * 0.8; // SFX × master defaults (SPEC §8.3)
const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0];

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number, endFreq?: number): void {
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain * SFX_VOLUME, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  /** Pitch walks a pentatonic ladder by running count, resetting every 10. */
  place(n: number): void {
    tone(PENTATONIC[(Math.max(1, n) - 1) % 10]!, 0, 0.12, 'sine', 0.5);
  },
  remove(): void {
    tone(520, 0, 0.12, 'sine', 0.35, 300);
  },
  bell(): void {
    tone(1318, 0, 1.2, 'triangle', 0.45);
    tone(2637, 0, 0.8, 'triangle', 0.15);
  },
  correct(): void {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.18, 'sine', 0.35));
  },
  /** Two-note descending soft sine; never a buzzer (SPEC §3.4). */
  hm(): void {
    tone(440, 0, 0.18, 'sine', 0.3);
    tone(370, 0.2, 0.25, 'sine', 0.3);
  },
  wobble(): void {
    tone(330, 0, 0.08, 'sine', 0.15);
  },
};
