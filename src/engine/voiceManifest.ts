// `audio/manifest.json` (SPEC §8.4, D141a, D144): which clips exist per voice and how long each is.
// Written by `audio:build`, checked by `lint:content`, read by the player; a missing or invalid
// manifest means every line is TTS.
import { VOICE_IDS, isClipIdShape } from './clips';

export const MANIFEST_VERSION = 1;

/**
 * `ext`: `m4a` shipped (D140b), `wav` for the e2e test set (D146). `voices`: voice → clip id →
 * duration in ms (as encoded). Checked by hand, not with zod: zod 4 probes `new Function` on first
 * use, which the CSP reports as a violation when the manifest loads at startup (SPEC §2).
 */
export interface VoiceManifest {
  version: typeof MANIFEST_VERSION;
  ext: 'm4a' | 'wav';
  voices: Record<string, Record<string, number>>;
}

export const emptyManifest = (ext: VoiceManifest['ext'] = 'm4a'): VoiceManifest => ({
  version: MANIFEST_VERSION,
  ext,
  voices: {},
});

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

export function parseManifest(json: unknown): VoiceManifest | null {
  if (!isObj(json) || json.version !== MANIFEST_VERSION) return null;
  if (json.ext !== 'm4a' && json.ext !== 'wav') return null;
  if (!isObj(json.voices)) return null;
  const voices: VoiceManifest['voices'] = {};
  for (const [voice, clips] of Object.entries(json.voices)) {
    if (!VOICE_IDS.includes(voice) || !isObj(clips)) return null;
    const out: Record<string, number> = {};
    for (const [clip, ms] of Object.entries(clips)) {
      if (!isClipIdShape(clip) || typeof ms !== 'number' || !Number.isInteger(ms) || ms <= 0)
        return null;
      out[clip] = ms;
    }
    voices[voice] = out;
  }
  return { version: MANIFEST_VERSION, ext: json.ext, voices };
}

/** The path of a clip relative to the audio root: `<voice>/<clipId>.<ext>`. */
export const clipPath = (m: Pick<VoiceManifest, 'ext'>, voice: string, clip: string): string =>
  `${voice}/${clip}.${m.ext}`;

/** The clips of `want` the manifest lacks for a voice (empty = the line can play recorded). */
export function missingClips(
  m: VoiceManifest | null,
  voice: string,
  want: readonly string[],
): string[] {
  const have = m?.voices[voice];
  return want.filter((c) => !have || !(c in have));
}

/** Clips written by a build replace the same clips in the manifest; everything else is kept. */
export function mergeManifest(base: VoiceManifest, add: VoiceManifest['voices']): VoiceManifest {
  const voices: VoiceManifest['voices'] = {};
  for (const v of VOICE_IDS) {
    const merged = { ...(base.voices[v] ?? {}), ...(add[v] ?? {}) };
    if (Object.keys(merged).length)
      voices[v] = Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)));
  }
  return { ...base, voices };
}
