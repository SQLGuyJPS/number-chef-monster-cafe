// The e2e voice test set (D141e, D146): small generated WAV clips plus their manifest, emitted into
// `audio-e2e/` of the VITE_E2E build only. Playwright's browsers are not relied on to decode AAC,
// and nothing here reaches a production build (tests/unit/build.test.ts checks).
import type { Plugin } from 'vite';
import {
  MONSTER_VOICES,
  foodClip,
  lineClip,
  monsterClip,
  numClip,
  wordClip,
} from '../src/engine/clips';
import { MANIFEST_VERSION, type VoiceManifest } from '../src/engine/voiceManifest';

const RATE = 8000;

/** A mono 16-bit WAV of a soft tone (`ms` long), fading in and out. */
export function toneWav(ms: number, freq: number): Uint8Array {
  const n = Math.round((RATE * ms) / 1000);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) =>
    [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + n * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, RATE, true);
  v.setUint32(28, RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, n * 2, true);
  const fade = RATE * 0.01;
  for (let i = 0; i < n; i++) {
    const env = Math.min(1, i / fade, (n - i) / fade);
    v.setInt16(
      44 + i * 2,
      Math.round(Math.sin((2 * Math.PI * freq * i) / RATE) * 0.3 * env * 32767),
      true,
    );
  }
  return new Uint8Array(buf);
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/** Clip length in the manifest, and how long the file really is (a "stuck" clip runs far longer). */
interface TestClip {
  voice: string;
  clip: string;
  ms: number;
  fileMs: number;
}

/**
 * What the e2e specs rely on: Pip counts 0–10 and says a few fixed lines; every monster can say
 * the warm-up cookie order recorded; each monster's greeting and Pip's "Your turn! Follow me." are
 * clips that never end on time (the manifest says 300 ms, the file lasts 6 s). Nothing for the
 * narrator, numbers above ten or other foods: those lines must fall back to TTS.
 */
export function e2eVoiceSet(): TestClip[] {
  const clips: TestClip[] = [];
  const add = (voice: string, clip: string, ms = 250, fileMs = ms) =>
    clips.push({ voice, clip, ms, fileMs });
  for (const n of range(0, 10))
    for (const form of ['lead', 'end'] as const) add('pip', numClip(n, form));
  for (const w of ['more', 'left'] as const) add('pip', wordClip(w));
  for (const k of ['ct.start', 'warm.bell', 'follow.type'] as const) add('pip', lineClip(k));
  add('pip', lineClip('follow.start'), 300, 6000);
  for (const m of MONSTER_VOICES) {
    for (const n of range(0, 10))
      for (const form of ['lead', 'mid'] as const) add(m, numClip(n, form));
    add(m, wordClip('plus'));
    add(m, wordClip('minus'));
    add(m, foodClip('cookie'));
    add(m, monsterClip(m, 'arrive', 0), 300, 6000);
  }
  return clips;
}

export function e2eVoicePlugin(): Plugin {
  return {
    name: 'ncmc-e2e-voice',
    apply: 'build',
    generateBundle() {
      if (process.env.VITE_E2E !== '1') return;
      const set = e2eVoiceSet();
      const manifest: VoiceManifest = { version: MANIFEST_VERSION, ext: 'wav', voices: {} };
      set.forEach((c, i) => {
        (manifest.voices[c.voice] ??= {})[c.clip] = c.ms;
        this.emitFile({
          type: 'asset',
          fileName: `audio-e2e/${c.voice}/${c.clip}.wav`,
          source: toneWav(c.fileMs, 300 + (i % 12) * 40),
        });
      });
      this.emitFile({
        type: 'asset',
        fileName: 'audio-e2e/manifest.json',
        source: JSON.stringify(manifest),
      });
    },
  };
}
