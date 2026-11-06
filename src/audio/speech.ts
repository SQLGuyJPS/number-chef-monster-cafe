// TTS (SPEC §8.1–8.2). Speech NEVER blocks game flow: every promise resolves on `end` OR after a
// timeout, because iOS sometimes never fires `onend`. Captions carry everything when no voice exists.
import { phrase, type PhraseKey, type PhraseParams } from '../engine/phrases';
import { getTimeScale } from '../app/runtime';

export const DEFAULT_RATE = 0.85;
const PREFERRED = [/Samantha/i, /Ava/i, /Allison/i, /Google US English/i, /Samsung/i];

let voice: SpeechSynthesisVoice | null = null;
let busyUntil = 0;
let token = 0;

const synth = (): SpeechSynthesis | null => ('speechSynthesis' in window ? window.speechSynthesis : null);

/** SPEC §8.2: localService en-US first, then en-*, then by preferred name. */
export function pickVoice(voices: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const english = voices.filter((v) => /^en([-_]|$)/i.test(v.lang));
  if (english.length === 0) return null;
  const score = (v: SpeechSynthesisVoice): number => {
    let s = 0;
    if (v.localService) s += 100;
    if (/^en[-_]US$/i.test(v.lang)) s += 50;
    const i = PREFERRED.findIndex((re) => re.test(v.name));
    if (i >= 0) s += 20 - i;
    return s;
  };
  return [...english].sort((a, b) => score(b) - score(a))[0] ?? null;
}

function loadVoices(): void {
  const s = synth();
  if (!s) return;
  const v = pickVoice(s.getVoices());
  if (v) voice = v;
}

/** Voices load asynchronously: `voiceschanged` plus retries at 0/250/1000/3000 ms (SPEC §8.2). */
export function initSpeech(): void {
  const s = synth();
  if (!s) return;
  try {
    s.addEventListener?.('voiceschanged', loadVoices);
  } catch {
    /* old engines */
  }
  for (const ms of [0, 250, 1000, 3000]) window.setTimeout(loadVoices, ms);
}

/** clamp(1200, 400 + 90 ms × chars / rate, 8000) (SPEC §8.1, D37). */
export const speechTimeoutMs = (text: string, rate = DEFAULT_RATE): number =>
  Math.min(8000, Math.max(1200, 400 + (90 * text.length) / rate));

export interface SpeakOptions {
  /** false queues behind the current line; true (default) cancels it first. */
  interrupt?: boolean;
  pitch?: number;
  rate?: number;
}

export function speakText(text: string, opts: SpeakOptions = {}): Promise<void> {
  const rate = opts.rate ?? DEFAULT_RATE;
  const ms = speechTimeoutMs(text, rate) * getTimeScale();
  const my = ++token;
  busyUntil = performance.now() + ms;
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (my === token) busyUntil = 0;
      resolve();
    };
    window.setTimeout(finish, ms);
    const s = synth();
    if (!s) return; // no speech engine: captions carry the line
    try {
      if (opts.interrupt !== false) s.cancel(); // iOS quirk: cancel before each non-queued line
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? 'en-US';
      u.rate = rate;
      u.pitch = opts.pitch ?? 1;
      u.onend = finish;
      u.onerror = finish;
      s.speak(u);
    } catch {
      /* the timeout resolves it */
    }
  });
}

export const speak = (key: PhraseKey, params: PhraseParams = {}, opts: SpeakOptions = {}): Promise<void> =>
  speakText(phrase(key, params), opts);

/** Counting while building is "latest wins": if speech is busy, skip it (SPEC §3.3, §8.2). */
export function countAloud(words: string): void {
  if (performance.now() < busyUntil) return;
  void speakText(words, { interrupt: true });
}

/** Stops any line (leaving the service). */
export function hush(): void {
  token++;
  busyUntil = 0;
  try {
    synth()?.cancel();
  } catch {
    /* ignore */
  }
}
