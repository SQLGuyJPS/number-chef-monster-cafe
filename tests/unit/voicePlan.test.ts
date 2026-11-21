import { describe, expect, it } from 'vitest';
import {
  ByteLru,
  DECODED_CAP_BYTES,
  RECORDED_MARGIN_MS,
  decodedBytes,
  recordedTimeoutMs,
  scheduleOffsets,
  trimBounds,
} from '../../src/audio/voicePlan';
import {
  emptyManifest,
  mergeManifest,
  missingClips,
  parseManifest,
  clipPath,
} from '../../src/engine/voiceManifest';
import { e2eVoiceSet, toneWav } from '../../scripts/vite-e2e-voice-plugin';
import { VOICE_IDS, isClipIdShape } from '../../src/engine/clips';

describe('decoded-audio cache (D141c)', () => {
  it('stays under its cap however many clips pass through, evicting the least recently used', () => {
    const lru = new ByteLru<string, number>(DECODED_CAP_BYTES);
    // A one-second clip at 48 kHz mono is 192 KB decoded; a full voice set would be ~100 of them.
    const clip = decodedBytes(48_000, 1);
    for (let i = 0; i < 500; i++) {
      lru.set(`c${i}`, i, clip);
      if (i % 3 === 0) lru.get('c0'); // keep one clip hot
      expect(lru.bytes).toBeLessThanOrEqual(DECODED_CAP_BYTES);
    }
    expect(lru.get('c0')).toBe(0);
    expect(lru.get('c1')).toBeUndefined();
    expect(lru.get('c499')).toBe(499);
    expect(lru.size).toBe(Math.floor(DECODED_CAP_BYTES / clip));
  });

  it('never keeps an item larger than the cap, and replacing a key does not double-count', () => {
    const lru = new ByteLru<string, string>(100);
    lru.set('big', 'x', 101);
    expect(lru.size).toBe(0);
    lru.set('a', 'x', 60);
    lru.set('a', 'y', 60);
    expect(lru.bytes).toBe(60);
    lru.set('b', 'z', 50);
    expect(lru.get('a')).toBeUndefined();
    expect(lru.bytes).toBe(50);
  });
});

describe('silence trim at load (D141c)', () => {
  it('cuts padding and silence but keeps a short pad around the sound', () => {
    const rate = 1000;
    const s = new Float32Array(1000);
    for (let i = 200; i < 700; i++) s[i] = 0.5;
    const b = trimBounds(s, rate, 0.006, 0.012);
    expect(b.start).toBeCloseTo(0.188, 5);
    expect(b.end).toBeCloseTo(0.712, 5);
  });
  it('leaves an all-quiet clip whole', () => {
    expect(trimBounds(new Float32Array(480), 48_000)).toEqual({ start: 0, end: 0.01 });
  });
});

describe('back-to-back scheduling (injected clock)', () => {
  it('each clip starts where the one before ends, minus the crossfade', () => {
    const { starts, total } = scheduleOffsets([0.5, 0.3, 0.4], 0.015);
    expect(starts[0]).toBe(0);
    expect(starts[1]).toBeCloseTo(0.485, 6);
    expect(starts[2]).toBeCloseTo(0.77, 6);
    expect(total).toBeCloseTo(1.17, 6);
  });
  it('a crossfade never exceeds half a short clip', () => {
    const { starts } = scheduleOffsets([0.02, 0.5], 0.04);
    expect(starts[1]).toBeCloseTo(0.01, 6);
  });
  it('no crossfade plays clips end to end', () => {
    expect(scheduleOffsets([0.2, 0.2], 0).starts).toEqual([0, 0.2]);
  });
  it('the timeout comes from the manifest durations plus a margin, not the TTS formula', () => {
    expect(recordedTimeoutMs([400, 300], 0)).toBe(700 + RECORDED_MARGIN_MS);
    expect(recordedTimeoutMs([400, 300], 20)).toBe(680 + RECORDED_MARGIN_MS);
  });
});

describe('voice manifest (D141a)', () => {
  it('accepts a valid manifest and rejects unknown voices, bad ids and bad durations', () => {
    const ok = {
      version: 1,
      ext: 'm4a',
      voices: { pip: { 'num.7.end': 420 }, blobbo: { 'mon.blobbo.arrive.0': 900 } },
    };
    expect(parseManifest(ok)).not.toBeNull();
    expect(parseManifest({ ...ok, voices: { bob: {} } })).toBeNull();
    expect(parseManifest({ ...ok, voices: { pip: { 'num.7': 420 } } })).toBeNull();
    expect(parseManifest({ ...ok, voices: { pip: { 'num.7.end': 0 } } })).toBeNull();
    expect(parseManifest({ ...ok, version: 2 })).toBeNull();
    expect(parseManifest('nope')).toBeNull();
  });
  it('lists what a voice lacks; no manifest means everything is missing', () => {
    const m = parseManifest({ version: 1, ext: 'm4a', voices: { pip: { 'num.7.end': 420 } } })!;
    expect(missingClips(m, 'pip', ['num.7.end', 'w.more'])).toEqual(['w.more']);
    expect(missingClips(m, 'narrator', ['num.7.end'])).toEqual(['num.7.end']);
    expect(missingClips(null, 'pip', ['num.7.end'])).toEqual(['num.7.end']);
    expect(clipPath(m, 'pip', 'num.7.end')).toBe('pip/num.7.end.m4a');
  });
  it('a build replaces its own clips and keeps the rest', () => {
    const base = { ...emptyManifest(), voices: { pip: { 'num.1.end': 300, 'num.2.end': 300 } } };
    const m = mergeManifest(base, { pip: { 'num.2.end': 350 }, narrator: { 'num.2.mid': 310 } });
    expect(m.voices).toEqual({
      pip: { 'num.1.end': 300, 'num.2.end': 350 },
      narrator: { 'num.2.mid': 310 },
    });
  });
  it('the committed manifest parses', async () => {
    const { readFileSync } = await import('node:fs');
    const j = JSON.parse(
      readFileSync(new URL('../../public/audio/manifest.json', import.meta.url), 'utf8'),
    ) as unknown;
    expect(parseManifest(j)).not.toBeNull();
  });
});

describe('e2e WAV test set (D146)', () => {
  it('uses known voices and clip ids, and makes valid WAV files', () => {
    const set = e2eVoiceSet();
    for (const c of set) {
      expect(VOICE_IDS).toContain(c.voice);
      expect(isClipIdShape(c.clip), c.clip).toBe(true);
    }
    const wav = toneWav(250, 440);
    expect(new TextDecoder().decode(wav.slice(0, 4))).toBe('RIFF');
    expect(wav.length).toBe(44 + 2000 * 2);
  });
});
