// Recorded voices (SPEC §8.4, D139–D141): plays a line from the owner's clips when every clip it
// needs exists for that voice, else the whole line through TTS (D139e). Keeps the speech contract
// of §8.1: every promise resolves on end or on a timeout, `interrupt` cancels what is playing,
// counting is latest-wins, and a recorded line counts as speech (busy) like a TTS line (D109).
import { lineClips, lineText, type Line } from '../engine/clips';
import { missingClips, parseManifest, clipPath, type VoiceManifest } from '../engine/voiceManifest';
import { getTimeScale } from '../app/runtime';
import { getAudioContext } from './unlock';
import {
  getVoiceVolume,
  hush as hushTts,
  speakText,
  speechBusy as ttsBusy,
  type SpeakOptions,
} from './speech';
import {
  ByteLru,
  DECODED_CAP_BYTES,
  decodedBytes,
  joinFades,
  recordedTimeoutMs,
  scheduleOffsets,
  trimBounds,
} from './voicePlan';

/**
 * Where the clips live. The e2e build serves a small WAV test set from its own folder (D141e,
 * D146); it is only ever emitted into the e2e build.
 */
const ROOT = import.meta.env.VITE_E2E ? 'audio-e2e/' : 'audio/';
/** Lead before the first clip, so a just-resumed context does not cut the attack (as for SFX, D87). */
const START_LEAD_S = 0.03;
/** Fetching and decoding a line's clips that takes longer than this gives the line to TTS instead. */
const LOAD_DEADLINE_MS = 1500;
/** A context that is not running after this long is not waited for: the line goes to TTS. */
const RESUME_WAIT_MS = 250;
/** One decode that never calls back (seen on old WebKit) must not hold up the queue for good. */
const DECODE_TIMEOUT_MS = 3000;
/**
 * iOS can report a context as running while its clock stands still (D87): nothing would be heard
 * until the timeout. A clock that has not moved this long after a line starts gives it to TTS.
 */
const STALL_CHECK_MS = 300;

/** Join crossfade (D141c: about 15 ms, tuned by ear on the ?debug Voice test). */
let crossfadeMs = 15;
export const getCrossfadeMs = (): number => crossfadeMs;
export function setCrossfadeMs(ms: number): void {
  crossfadeMs = Math.max(0, Math.min(40, ms));
}

// ---------- manifest ----------

let manifest: VoiceManifest | null = null;
let manifestLoad: Promise<VoiceManifest | null> | null = null;

/** Fetched once (precached by the service worker, so it works offline); null = everything is TTS. */
export function loadVoiceManifest(): Promise<VoiceManifest | null> {
  manifestLoad ??= fetch(`${ROOT}manifest.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((j: unknown) => (manifest = j ? parseManifest(j) : null))
    .catch(() => null);
  return manifestLoad;
}

export const getVoiceManifest = (): VoiceManifest | null => manifest;

/** The clips of `clips` that this voice has no recording for. */
export const missingFor = (voice: string, clips: readonly string[]): string[] =>
  missingClips(manifest, voice, clips);

// ---------- decoding ----------

interface Decoded {
  buffer: AudioBuffer;
  start: number;
  end: number;
}

const cache = new ByteLru<string, Decoded>(DECODED_CAP_BYTES);
const inflight = new Map<string, Promise<Decoded | null>>();
/** WebKit has crashed decoding many clips at once: one decode at a time (D141c). */
let decodeQueue: Promise<unknown> = Promise.resolve();

export const voiceCacheStats = () => ({ bytes: cache.bytes, clips: cache.size, cap: cache.cap });

function decode(ctx: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  const job = decodeQueue.then(
    () =>
      new Promise<AudioBuffer>((ok, err) => {
        const timer = window.setTimeout(() => err(new Error('decode timeout')), DECODE_TIMEOUT_MS);
        const done = (b: AudioBuffer) => (window.clearTimeout(timer), ok(b));
        const fail = (e: unknown) => (window.clearTimeout(timer), err(e));
        // The callback form also works on older WebKit, where the promise form was missing.
        const p = ctx.decodeAudioData(data, done, fail) as Promise<AudioBuffer> | undefined;
        p?.catch?.(fail);
      }),
  );
  decodeQueue = job.catch(() => undefined);
  return job;
}

function loadClip(ctx: AudioContext, voice: string, clip: string): Promise<Decoded | null> {
  const m = manifest;
  if (!m) return Promise.resolve(null);
  const key = `${voice}/${clip}`;
  const hit = cache.get(key);
  if (hit && hit.buffer.sampleRate === ctx.sampleRate) return Promise.resolve(hit);
  const running = inflight.get(key);
  if (running) return running;
  const p = fetch(ROOT + clipPath(m, voice, clip))
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${r.status}`))))
    .then((data) => decode(ctx, data))
    .then((buffer) => {
      const { start, end } = trimBounds(buffer.getChannelData(0), buffer.sampleRate);
      const d = { buffer, start, end };
      cache.set(key, d, decodedBytes(buffer.length, buffer.numberOfChannels));
      return d;
    })
    .catch(() => null)
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

// ---------- playback ----------

export interface VoiceLogEntry {
  text: string;
  voice: string;
  mode: 'recorded' | 'tts';
  clips: string[] | null;
  /** Why a line went to TTS. */
  why?: 'never recorded' | 'missing' | 'no audio' | 'load failed' | 'stalled';
  missing?: string[];
  outcome?: 'ended' | 'timeout' | 'cut';
  /** When each clip starts, in seconds from the line's start (recorded lines). */
  starts?: number[];
}
/** The last lines spoken, newest last (Voice test page and e2e). */
export const voiceLog: VoiceLogEntry[] = [];
const log = (e: VoiceLogEntry): VoiceLogEntry => {
  voiceLog.push(e);
  if (voiceLog.length > 100) voiceLog.shift();
  return e;
};

interface Playing {
  token: number;
  sources: AudioBufferSourceNode[];
  out: GainNode;
  done: Promise<void>;
  finish: (outcome: VoiceLogEntry['outcome']) => void;
}

let token = 0;
let playing: Playing | null = null;
/** Tokens of non-count recorded lines still playing. */
const activeLines = new Set<number>();

/** True while any non-count line plays, recorded or TTS (D75, D109). */
export const voiceBusy = (): boolean => ttsBusy() || activeLines.size > 0;

function stopRecorded(): void {
  playing?.finish('cut');
  playing = null;
}

/** Stops every line, recorded or TTS (leaving the service, a tap that skips ahead). */
export function hushVoice(): void {
  token++;
  stopRecorded();
  activeLines.clear();
  hushTts();
}

async function runningContext(): Promise<AudioContext | null> {
  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'closed') return null;
  if (ctx.state === 'running') return ctx;
  try {
    await Promise.race([ctx.resume(), new Promise((r) => window.setTimeout(r, RESUME_WAIT_MS))]);
  } catch {
    /* falls through */
  }
  return (ctx.state as AudioContextState) === 'running' ? ctx : null;
}

const withDeadline = <T>(p: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([p, new Promise<null>((r) => window.setTimeout(() => r(null), ms))]);

function tts(text: string, opts: SpeakOptions, entry: VoiceLogEntry): Promise<void> {
  entry.mode = 'tts';
  return speakText(text, opts).then(() => void (entry.outcome ??= 'ended'));
}

/**
 * Plays `clips` in `voice` back to back, or the whole `text` through TTS when any clip is missing,
 * fails to load in time, or there is no running audio context.
 */
export async function sayClips(
  voice: string,
  clips: readonly string[] | null,
  text: string,
  opts: SpeakOptions = {},
): Promise<void> {
  const entry = log({ text, voice, mode: 'recorded', clips: clips ? [...clips] : null });
  if (opts.interrupt !== false) {
    stopRecorded();
    hushTts();
  } else {
    const before = token;
    await playing?.done;
    if (token !== before) {
      entry.outcome = 'cut'; // hushed while it waited its turn
      return;
    }
  }
  const my = ++token;
  if (!clips) {
    entry.why = 'never recorded';
    return tts(text, opts, entry);
  }
  if (manifest === null) {
    await withDeadline(loadVoiceManifest(), LOAD_DEADLINE_MS);
    if (my !== token) {
      entry.outcome = 'cut'; // a newer line started meanwhile
      return;
    }
  }
  const miss = missingClips(manifest, voice, clips);
  if (miss.length) {
    entry.why = 'missing';
    entry.missing = miss;
    return tts(text, opts, entry);
  }
  if (!opts.count) activeLines.add(my);
  const release = () => activeLines.delete(my);

  const ctx = await runningContext();
  if (!ctx) {
    release();
    entry.why = 'no audio';
    return my === token ? tts(text, opts, entry) : undefined;
  }
  const loaded = await withDeadline(
    (async () => {
      const out: Decoded[] = [];
      for (const c of clips) {
        const d = await loadClip(ctx, voice, c);
        if (!d) return null;
        out.push(d);
      }
      return out;
    })(),
    LOAD_DEADLINE_MS,
  );
  if (my !== token) {
    release();
    entry.outcome = 'cut';
    return;
  }
  if (!loaded) {
    release();
    entry.why = 'load failed';
    return tts(text, opts, entry);
  }
  const stalled = await play(ctx, voice, clips, loaded, my, entry, release);
  if (!stalled || my !== token) return;
  entry.why = 'stalled';
  entry.outcome = undefined;
  return tts(text, opts, entry);
}

function play(
  ctx: AudioContext,
  voice: string,
  clips: readonly string[],
  parts: Decoded[],
  my: number,
  entry: VoiceLogEntry,
  release: () => void,
): Promise<boolean> {
  const xf = crossfadeMs / 1000;
  const lens = parts.map((d) => d.end - d.start);
  const { starts } = scheduleOffsets(lens, xf);
  const fades = joinFades(starts, lens);
  entry.starts = starts.map((t) => Math.round(t * 1000) / 1000);
  const out = ctx.createGain();
  out.gain.value = getVoiceVolume();
  out.connect(ctx.destination);
  const t0 = ctx.currentTime + START_LEAD_S;
  const sources = parts.map((d, i) => {
    const src = ctx.createBufferSource();
    src.buffer = d.buffer;
    const g = ctx.createGain();
    const at = t0 + starts[i]!;
    const len = lens[i]!;
    // Equal-gain crossfade over each join's overlap; the first clip starts and the last ends at
    // full level.
    const fadeIn = i > 0 ? fades[i - 1]! : 0;
    const fadeOut = i < parts.length - 1 ? fades[i]! : 0;
    if (fadeIn > 0) {
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(1, at + fadeIn);
    }
    if (fadeOut > 0) {
      g.gain.setValueAtTime(1, at + len - fadeOut);
      g.gain.linearRampToValueAtTime(0, at + len);
    }
    src.connect(g).connect(out);
    src.start(at, d.start, len);
    return src;
  });
  const manifestMs = clips.map((c) => manifest?.voices[voice]?.[c] ?? 0);
  const limit = recordedTimeoutMs(manifestMs, crossfadeMs) * getTimeScale();

  const clockAt = ctx.currentTime;
  let stalled = false;
  let finish: (outcome: VoiceLogEntry['outcome']) => void = () => undefined;
  const done = new Promise<void>((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => finish('timeout'), limit);
    const check = window.setTimeout(() => {
      if (ctx.currentTime - clockAt > 0.05) return;
      stalled = true;
      finish('cut');
    }, STALL_CHECK_MS);
    finish = (outcome) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      window.clearTimeout(check);
      // A clip that runs past its manifest length is cut, so it never talks over the next line.
      for (const s of sources) {
        s.onended = null;
        try {
          s.stop();
        } catch {
          /* not started or already stopped */
        }
      }
      try {
        out.disconnect();
      } catch {
        /* already gone */
      }
      if (playing?.token === my) playing = null;
      release();
      entry.outcome = outcome;
      resolve();
    };
  });
  sources[sources.length - 1]!.onended = () => finish('ended');
  playing = { token: my, sources, out, done, finish };
  return done.then(() => stalled);
}

/** Speaks a game line in `voice` (the monster's id, `pip` or `narrator`); `tts` is the fallback's voice. */
export function say(line: Line, voice: string, tts: SpeakOptions = {}): Promise<void> {
  return sayClips(voice, lineClips(line), lineText(line), tts);
}

/**
 * Counting while building (SPEC §3.3, D75): a new count cuts off the previous count, never another
 * line; while one of those plays the count is skipped and the tone carries the feedback.
 */
export function countLine(line: Line, voice: string, tts: SpeakOptions = {}): void {
  if (voiceBusy()) return;
  void say(line, voice, { ...tts, interrupt: true, count: true });
}
