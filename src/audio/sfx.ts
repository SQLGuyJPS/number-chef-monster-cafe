// WebAudio-synthesised SFX (SPEC §8.3): no audio files. Every call is best-effort; with no
// AudioContext (not unlocked yet, or unsupported) nothing plays and nothing breaks.
import { audioStats, getAudioContext } from './unlock';

const SFX_VOLUME = 0.7 * 0.8; // SFX × master defaults (SPEC §8.3)
const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0];

/** A tone that waits longer than this for the context to resume is dropped: late is worse than silent. */
const RESUME_GRACE_MS = 250;
/**
 * Tones start this far ahead of the audio clock (D87). Scheduled at `currentTime` exactly, a
 * context that has just resumed or been rebuilt cuts off the attack, which sounded clipped.
 */
const START_LEAD_S = 0.03;

/**
 * Runs `play` now if the context is running, else right after it resumes (D86). iOS pauses
 * WebAudio while speech plays ("interrupted"); the pointerdown resume is async, so a tone asked
 * for in the same tap used to find the context not yet running and was skipped.
 */
function whenRunning(play: (ctx: AudioContext) => void): void {
  const ctx = getAudioContext();
  const skip = () => void audioStats.tonesSkipped++;
  const run = (c: AudioContext) => {
    audioStats.tonesPlayed++;
    play(c);
  };
  if (!ctx || ctx.state === 'closed') return skip();
  if (ctx.state === 'running') return run(ctx);
  const asked = performance.now();
  void ctx
    .resume()
    .then(() => {
      if (ctx.state === 'running' && performance.now() - asked <= RESUME_GRACE_MS) run(ctx);
      else skip();
    })
    .catch(skip);
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number, endFreq?: number): void {
  whenRunning((ctx) => playTone(ctx, freq, start, dur, type, gain, endFreq));
}

function playTone(
  ctx: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  gain: number,
  endFreq?: number,
): void {
  const t0 = ctx.currentTime + START_LEAD_S + start;
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

/** Band-passed noise burst (munch). */
function noise(start: number, dur: number, freq: number, gain: number): void {
  whenRunning((ctx) => {
    const t0 = ctx.currentTime + START_LEAD_S + start;
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    // A fixed pseudo-random fill: deterministic, and no Math.random needed for a crunch.
    let x = 12345;
    for (let i = 0; i < len; i++) {
      x = (x * 1103515245 + 12345) & 0x7fffffff;
      data[i] = (x / 0x7fffffff) * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain * SFX_VOLUME, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  });
}

export const sfx = {
  /** Pitch walks a pentatonic ladder by running count, resetting every 10. */
  place(n: number): void {
    tone(PENTATONIC[(Math.max(1, n) - 1) % 10]!, 0, 0.16, 'sine', 0.5);
  },
  remove(): void {
    tone(520, 0, 0.16, 'sine', 0.35, 300);
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
  /** Three crunchy bites, in time with the three chews (SPEC §5.6). */
  munch(): void {
    [0, 0.35, 0.7].forEach((t) => noise(t, 0.12, 900, 0.5));
  },
  /** Chompers' reaction: a short low glide down. */
  burp(): void {
    tone(160, 0.05, 0.35, 'sawtooth', 0.18, 70);
  },
  /** Two-tone "ting" as a coin lands in the jar (SPEC §9). */
  coin(): void {
    tone(1568, 0, 0.09, 'sine', 0.3);
    tone(2093, 0.07, 0.22, 'sine', 0.3);
  },
  /** Rubber "boing" as a monster arrives. */
  arrive(): void {
    tone(180, 0, 0.32, 'sine', 0.35, 420);
  },
  /** Shop purchase (M4): three coins and a rising chime. */
  buy(): void {
    [0, 0.12, 0.24].forEach((t) => {
      tone(1568, t, 0.09, 'sine', 0.25);
      tone(2093, t + 0.05, 0.15, 'sine', 0.25);
    });
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.4 + i * 0.08, 0.25, 'triangle', 0.25));
  },
};
