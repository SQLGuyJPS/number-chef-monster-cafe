// TTS (SPEC §8.1–8.2). Speech NEVER blocks game flow: every promise resolves on `end` OR after a
// timeout, because iOS sometimes never fires `onend`. Captions carry everything when no voice exists.
import { phrase, type PhraseKey, type PhraseParams } from '../engine/phrases';
import { getTimeScale } from '../app/runtime';
import { lastAudioBuildAt } from './unlock';

export const DEFAULT_RATE = 0.85;
/** Pip's voice: the same voice, higher, so the child can tell the helper from the monster (D90). */
export const PIP_PITCH = 1.5;
/** A line that has not fired `start` by then is retried once (D88). */
const START_WATCHDOG_MS = 1500;
const PREFERRED = [/Samantha/i, /Ava/i, /Allison/i, /Google US English/i, /Samsung/i];

let voice: SpeechSynthesisVoice | null = null;
/** Parent settings (SPEC §8.2, D135): a chosen voice, the speed and the voice volume. */
let chosenURI: string | null = null;
/** The parent's speed over the default; monster and Pip rates scale with it. */
let rateScale = 1;
let voiceVolume = 1;
let token = 0;
/** Tokens of non-count lines still playing. Counts never cut these off (D75). */
const activeLines = new Set<number>();
/** Every line not yet settled (counts too), so a newer interrupting line can settle them. */
const live = new Map<number, () => void>();
/** The line the engine holds; kept referenced so it is not garbage-collected mid-line (D178). */
const held: { u: SpeechSynthesisUtterance | null } = { u: null };

/**
 * iOS and iPadOS (every browser there is WebKit) and desktop Safari. WebKit drops or delays a line
 * spoken right after `cancel()` or right after the game's AudioContext was rebuilt in the same tap
 * (D178); Chrome and Android do not, so they keep speaking at once.
 */
function appleSpeech(): boolean {
  try {
    const n = navigator;
    if (/iP(hone|ad|od)/.test(n.userAgent)) return true;
    if (n.platform === 'MacIntel' && n.maxTouchPoints > 1) return true; // iPadOS reports a Mac
    return /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(n.userAgent);
  } catch {
    return false;
  }
}

/** A line after a cancel waits this long (D178; 100 ms in reports, a little more for old iPads). */
export const CANCEL_SETTLE_MS = 150;
/** A line in the same tap as an AudioContext rebuild waits until the audio session has switched. */
export const BUILD_SETTLE_MS = 250;
let lastCancelAt = -Infinity;

/** Cancels only when something is speaking or queued: a needless cancel also drops the next line. */
function cancelEngine(s: SpeechSynthesis, always = false): void {
  held.u = null;
  if (!always && !s.speaking && !s.pending) return;
  s.cancel();
  lastCancelAt = performance.now();
}

/** How long a line must wait before `speak()` (0 off WebKit). */
function settleMs(): number {
  if (!appleSpeech()) return 0;
  const now = performance.now();
  return Math.ceil(Math.max(0, lastCancelAt + CANCEL_SETTLE_MS - now, lastAudioBuildAt() + BUILD_SETTLE_MS - now));
}

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

/** English voices installed on this device, for the parent's voice picker. */
export function englishVoices(): SpeechSynthesisVoice[] {
  const s = synth();
  if (!s) return [];
  try {
    return s.getVoices().filter((v) => /^en([-_]|$)/i.test(v.lang));
  } catch {
    return [];
  }
}

/** The parts of a voice the picker shows and compares. */
type VoiceInfo = Pick<SpeechSynthesisVoice, 'name' | 'lang' | 'localService' | 'voiceURI'>;

/**
 * One entry per name and language (D137). iOS lists Samantha, Daniel, Moira and others twice
 * (two voiceURIs, same name and lang), which reads as a repeat in the picker. Keeps the voice the
 * parent chose if it is one of the pair, else an on-device one, else the first listed.
 */
export function uniqueVoices<V extends VoiceInfo>(voices: readonly V[], keepURI: string | null = null): V[] {
  const byKey = new Map<string, V>();
  const key = (v: V) => `${v.name.trim().toLowerCase()}|${v.lang.replace('_', '-').toLowerCase()}`;
  for (const v of voices) {
    const k = key(v);
    const held = byKey.get(k);
    if (!held) byKey.set(k, v);
    else if (held.voiceURI !== keepURI && (v.voiceURI === keepURI || (v.localService && !held.localService))) {
      byKey.set(k, v);
    }
  }
  // Map keeps first-insertion order, so the list stays in the device's order.
  return [...byKey.values()];
}

function loadVoices(): void {
  const s = synth();
  if (!s) return;
  const all = s.getVoices();
  // A chosen network voice can't speak offline (Android): fall back to the automatic pick.
  const chosen = chosenURI ? all.find((v) => v.voiceURI === chosenURI) : undefined;
  const usable = chosen && (chosen.localService || navigator.onLine !== false) ? chosen : undefined;
  const v = usable ?? pickVoice(all);
  if (v) voice = v;
}

/** The parent's voice volume; recorded lines use it too (SPEC §8.4). */
export const getVoiceVolume = (): number => voiceVolume;

export function configureSpeech(c: { voiceURI: string | null; rate: number; volume: number }): void {
  chosenURI = c.voiceURI;
  rateScale = c.rate / DEFAULT_RATE;
  voiceVolume = Math.max(0, Math.min(1, c.volume));
  loadVoices();
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
  // A chosen network voice is swapped for a local one while offline, and back when online (D135).
  window.addEventListener('online', loadVoices);
  window.addEventListener('offline', loadVoices);
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
  const rate = Math.min(1.5, Math.max(0.5, (opts.rate ?? DEFAULT_RATE) * rateScale));
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
      live.delete(my);
      window.clearTimeout(fallback);
      window.clearTimeout(deferred);
      resolve();
    };
    const s = synth();
    let deferred = 0;
    let fallback = 0;
    if (!s) {
      fallback = window.setTimeout(finish, ms);
      return; // no speech engine: captions carry the line
    }
    let started = false;
    const utter = (): SpeechSynthesisUtterance => {
      const u = new SpeechSynthesisUtterance(spokenForm(text));
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? 'en-US';
      u.rate = rate;
      u.pitch = opts.pitch ?? 1;
      u.volume = voiceVolume;
      u.onstart = () => void (started = true);
      u.onend = finish;
      u.onerror = finish;
      // Held until it ends: WebKit can collect an utterance mid-line and never fire `end` (D178).
      held.u = u;
      return u;
    };
    /** Speaks now, or once the engine has settled after a cancel or an audio rebuild (D178). */
    const say = (then?: (u: SpeechSynthesisUtterance) => void) => {
      const go = () => {
        if (settled) return;
        try {
          if (s.paused) s.resume();
          const u = utter();
          s.speak(u);
          then?.(u);
        } catch {
          /* the timeout resolves it */
        }
      };
      const wait = settleMs();
      if (wait > 0) deferred = window.setTimeout(go, wait);
      else go();
      return wait;
    };
    try {
      if (opts.interrupt !== false) {
        // A newer line replaces everything before it: settle those now rather than wait for an
        // `error` event that iOS does not always send.
        for (const [t, done] of live) if (t !== my) done();
        cancelEngine(s);
      }
      live.set(my, finish);
      // iOS can leave the engine paused after an audio interruption; a paused engine never speaks.
      if (s.paused) s.resume();
      const wait = say((u) => {
        // D88: if the line has not started by now (and nothing newer replaced it), the engine is
        // wedged: cancel, un-pause and say it once more. Counts skip this, and so do lines whose
        // fallback (≥ 1.2 s) has already settled them, such as a short "Yum!".
        if (opts.count) return;
        window.setTimeout(() => {
          if (started || settled || my !== token) return;
          try {
            u.onend = u.onerror = null;
            cancelEngine(s, true);
            // The retry starts late: give it its own full fallback so busy lasts as long as it does.
            const again = say();
            window.clearTimeout(fallback);
            fallback = window.setTimeout(finish, ms + again);
          } catch {
            /* the timeout resolves it */
          }
        }, START_WATCHDOG_MS);
      });
      fallback = window.setTimeout(finish, ms + wait);
    } catch {
      fallback = window.setTimeout(finish, ms);
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
  for (const done of [...live.values()]) done();
  activeLines.clear();
  try {
    const s = synth();
    if (s) cancelEngine(s);
  } catch {
    /* ignore */
  }
}
