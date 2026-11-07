// TTS (SPEC §8.1–8.2). Speech NEVER blocks game flow: every promise resolves on `end` OR after a
// timeout, because iOS sometimes never fires `onend`. Captions carry everything when no voice exists.
import { phrase, type PhraseKey, type PhraseParams } from '../engine/phrases';
import { getTimeScale } from '../app/runtime';

export const DEFAULT_RATE = 0.85;
/** A line that has not fired `start` by then is retried once (D88). */
const START_WATCHDOG_MS = 1500;
const PREFERRED = [/Samantha/i, /Ava/i, /Allison/i, /Google US English/i, /Samsung/i];

let voice: SpeechSynthesisVoice | null = null;
let token = 0;
/** Tokens of non-count lines still playing. Counts never cut these off (D75). */
const activeLines = new Set<number>();

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

/**
 * Text as sent to the speech engine. Engines pause as long on a comma as between sentences, which
 * makes "Five plus two cookies, please!" sound broken; captions keep the comma (D77).
 */
export const spokenForm = (text: string): string => text.replace(/,/g, '');

export interface SpeakOptions {
  /** false queues behind the current line; true (default) cancels it first. */
  interrupt?: boolean;
  pitch?: number;
  rate?: number;
  /** A tray count: does not mark speech busy, so the next tap's count may replace it (D75). */
  count?: boolean;
}

export function speakText(text: string, opts: SpeakOptions = {}): Promise<void> {
  const rate = opts.rate ?? DEFAULT_RATE;
  const ms = speechTimeoutMs(text, rate) * getTimeScale();
  const my = ++token;
  if (!opts.count) activeLines.add(my);
  return new Promise<void>((resolve) => {
    let settled = false;
    // Busy ends when the line really ends (`end`/`error`, including being cancelled); the timeout
    // is only the fallback for engines that never fire `end` (SPEC §8.1).
    const finish = () => {
      if (settled) return;
      settled = true;
      activeLines.delete(my);
      resolve();
    };
    let fallback = window.setTimeout(finish, ms);
    const s = synth();
    if (!s) return; // no speech engine: captions carry the line
    let started = false;
    const utter = (): SpeechSynthesisUtterance => {
      const u = new SpeechSynthesisUtterance(spokenForm(text));
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? 'en-US';
      u.rate = rate;
      u.pitch = opts.pitch ?? 1;
      u.onstart = () => void (started = true);
      u.onend = finish;
      u.onerror = finish;
      return u;
    };
    try {
      if (opts.interrupt !== false) s.cancel(); // iOS quirk: cancel before each non-queued line
      // iOS can leave the engine paused after an audio interruption; a paused engine never speaks.
      if (s.paused) s.resume();
      const u = utter();
      s.speak(u);
      // D88: if the line has not started by now (and nothing newer replaced it), the engine is
      // wedged: cancel, un-pause and say it once more. Counts skip this, and so do lines whose
      // fallback (≥ 1.2 s) has already settled them, such as a short "Yum!".
      if (!opts.count) {
        window.setTimeout(() => {
          if (started || settled || my !== token) return;
          try {
            u.onend = u.onerror = null;
            s.cancel();
            if (s.paused) s.resume();
            s.speak(utter());
            // The retry starts late: give it its own full fallback so busy lasts as long as it does.
            window.clearTimeout(fallback);
            fallback = window.setTimeout(finish, ms);
          } catch {
            /* the timeout resolves it */
          }
        }, START_WATCHDOG_MS);
      }
    } catch {
      /* the timeout resolves it */
    }
  });
}

export const speak = (key: PhraseKey, params: PhraseParams = {}, opts: SpeakOptions = {}): Promise<void> =>
  speakText(phrase(key, params), opts);

/**
 * Counting while building (SPEC §3.3, §8.2 as amended by D75): a new count cuts off the previous
 * count so every tap is heard, but never cuts off another line (order, coaching, PlateCount);
 * while one of those plays the count is skipped and the tone carries the feedback.
 */
export function countAloud(words: string): void {
  if (speechBusy()) return;
  void speakText(words, { interrupt: true, count: true });
}

/** True while a non-count line is playing. */
export const speechBusy = (): boolean => activeLines.size > 0;

/** Stops any line (leaving the service). */
export function hush(): void {
  token++;
  activeLines.clear();
  try {
    synth()?.cancel();
  } catch {
    /* ignore */
  }
}
