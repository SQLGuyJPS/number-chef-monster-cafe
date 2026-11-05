// SPEC §5.1, §8.1: WebAudio and speech must be unlocked inside a user gesture on iOS, and iOS
// suspends the AudioContext again after backgrounding, so every pointerdown re-resumes it.

let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  return ctx;
}

function resume(): void {
  if (ctx && ctx.state !== 'running') void ctx.resume().catch(() => undefined);
}

/** Runs inside the Splash tap. Every step is best-effort: a missing API never blocks play. */
export function unlockFromGesture(): void {
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    // iOS 17+: keeps WebAudio audible with the silent switch on (D37: progressive enhancement).
    if (nav.audioSession) nav.audioSession.type = 'playback';
  } catch {
    /* not supported */
  }
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ctx && AC) ctx = new AC();
    resume();
  } catch {
    ctx = null;
  }
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
  target.addEventListener('pointerdown', resume, { capture: true });
  return () => target.removeEventListener('pointerdown', resume, { capture: true });
}
