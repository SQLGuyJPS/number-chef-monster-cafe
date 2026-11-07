// SPEC §5.1, §8.1: WebAudio and speech must be unlocked inside a user gesture on iOS.
//
// D87: on iOS, speech can leave the AudioContext "interrupted", or "running" with its clock frozen
// and no sound, and `resume()` does not always bring it back. So every pointerdown checks the
// context and, if it is not healthy, closes it and builds a fresh one inside that gesture.
// A context counts as healthy only if it is running and its clock has moved recently.

// Debug-only override of `navigator.audioSession.type` (D87), stored per device under the
// literal key 'ncmc.debug.audioSession' (a literal so the namespace test can check it, D18).
export type AudioSessionMode = 'playback' | 'ambient' | 'auto' | 'unset';
export const AUDIO_SESSION_MODES: AudioSessionMode[] = ['playback', 'ambient', 'auto', 'unset'];

/** A running clock that has not moved for this long is treated as stuck. */
const FROZEN_MS = 600;
const SAMPLE_MS = 200;

let ctx: AudioContext | null = null;
let lastAdvance = { wall: 0, audio: -1 };
let sampler: number | null = null;

export const audioStats = { contextsCreated: 0, rebuilds: 0, tonesPlayed: 0, tonesSkipped: 0 };

export function getAudioContext(): AudioContext | null {
  return ctx;
}

export function getAudioSessionMode(): AudioSessionMode {
  try {
    const v = localStorage.getItem('ncmc.debug.audioSession');
    if (v && (AUDIO_SESSION_MODES as string[]).includes(v)) return v as AudioSessionMode;
  } catch {
    /* storage blocked */
  }
  return 'playback';
}

export function setAudioSessionMode(mode: AudioSessionMode): void {
  try {
    localStorage.setItem('ncmc.debug.audioSession', mode);
  } catch {
    /* storage blocked: applies until reload */
  }
  applyAudioSession(mode);
}

type NavWithSession = Navigator & { audioSession?: { type: string } };

/** What `navigator.audioSession.type` reads now, or why it can't. */
export function audioSessionType(): string {
  const s = (navigator as NavWithSession).audioSession;
  return s ? s.type : 'not supported (iOS < 17)';
}

function applyAudioSession(mode: AudioSessionMode = getAudioSessionMode()): void {
  try {
    const s = (navigator as NavWithSession).audioSession;
    // iOS 17+: 'playback' keeps WebAudio audible with the silent switch on (D37: progressive enhancement).
    if (s && mode !== 'unset') s.type = mode;
  } catch {
    /* not supported */
  }
}

function sample(): void {
  if (!ctx) return;
  if (ctx.currentTime !== lastAdvance.audio) lastAdvance = { wall: performance.now(), audio: ctx.currentTime };
}

function healthy(c: AudioContext): boolean {
  if (c.state !== 'running') return false;
  sample();
  return performance.now() - lastAdvance.wall < FROZEN_MS;
}

/** Old iOS only unlocks output once a sound starts inside a gesture: one silent sample does it. */
function primeSilent(c: AudioContext): void {
  try {
    const b = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = b;
    src.connect(c.destination);
    src.start(0);
  } catch {
    /* best-effort */
  }
}

function build(): void {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  // Builds only happen inside a gesture; set the session type here too, so pages that skip the
  // Splash tap (the ?debug sound test) test the same session type as the game.
  applyAudioSession();
  if (ctx) {
    audioStats.rebuilds++;
    void ctx.close().catch(() => undefined);
  }
  try {
    ctx = new AC();
  } catch {
    ctx = null;
    return;
  }
  audioStats.contextsCreated++;
  // A fresh context counts as advancing until it has had time to prove otherwise.
  lastAdvance = { wall: performance.now(), audio: -1 };
  void ctx.resume().catch(() => undefined);
  primeSilent(ctx);
  if (sampler === null) sampler = window.setInterval(sample, SAMPLE_MS);
}

/** Longer than any line may last (8 s cap, SPEC §8.1): `speaking` true beyond this is stuck. */
const STUCK_SPEAKING_MS = 9000;
let talkingSince: number | null = null;

/**
 * True while the speech engine is talking (read directly, so this module stays free of speech.ts).
 * WebKit can leave `speaking` stuck at true after an interruption; trusting it forever would block
 * every rebuild, so a flag that has stayed true longer than any line can last is ignored.
 */
function speechTalking(): boolean {
  try {
    if (!('speechSynthesis' in window) || !window.speechSynthesis.speaking) {
      talkingSince = null;
      return false;
    }
    const t = performance.now();
    talkingSince ??= t;
    return t - talkingSince < STUCK_SPEAKING_MS;
  } catch {
    return false;
  }
}

/**
 * Call inside a gesture (every pointerdown, D87). A suspended context (backgrounding) is resumed;
 * an interrupted, closed or frozen one is replaced, but never while speech is playing (D88): iOS
 * pauses WebAudio during speech, and building a new context then takes the audio session from the
 * speech engine, which cut the line off, left later lines silent and held up the tap.
 */
export function ensureAudio(): void {
  try {
    if (!ctx) {
      if (!speechTalking()) build();
      return;
    }
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => undefined);
      lastAdvance = { wall: performance.now(), audio: -1 };
      return;
    }
    if (speechTalking()) return;
    if (!healthy(ctx)) build();
  } catch {
    ctx = null;
  }
}

/** Debug sound test: always replace the context (inside a gesture). */
export function rebuildAudio(): void {
  build();
}

/** Runs inside the Splash tap. Every step is best-effort: a missing API never blocks play. */
export function unlockFromGesture(): void {
  applyAudioSession();
  ensureAudio();
  try {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
  } catch {
    /* no speech: captions carry everything (SPEC §8.1) */
  }
  try {
    void navigator.storage?.persist?.().catch(() => undefined);
  } catch {
    /* feature-detected (D44g) */
  }
}

export function installAudioResume(target: EventTarget): () => void {
  // Only once the Splash tap has created the context: the first tap's job is the Splash's.
  const onDown = () => ctx && ensureAudio();
  target.addEventListener('pointerdown', onDown, { capture: true });
  return () => target.removeEventListener('pointerdown', onDown, { capture: true });
}
