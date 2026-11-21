// Pure pieces of recorded-voice playback (SPEC §8.4, D141c): the decoded-audio cache, silence
// trimming and back-to-back scheduling. No DOM or Web Audio here, so unit tests drive them directly.

/** Decoded audio is kept under this many bytes (Float32 samples), so the iPad 7th gen never holds a set. */
export const DECODED_CAP_BYTES = 10 * 1024 * 1024;

/** Least-recently-used map with a byte cap. An item larger than the cap is not kept at all. */
export class ByteLru<K, V> {
  private map = new Map<K, { value: V; bytes: number }>();
  private used = 0;
  constructor(readonly cap: number) {}

  get(key: K): V | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    // Re-insert: Map keeps insertion order, so the first key is always the least recently used.
    this.map.delete(key);
    this.map.set(key, hit);
    return hit.value;
  }

  set(key: K, value: V, bytes: number): void {
    this.delete(key);
    if (bytes > this.cap) return;
    this.map.set(key, { value, bytes });
    this.used += bytes;
    for (const [k, v] of this.map) {
      if (this.used <= this.cap) break;
      this.map.delete(k);
      this.used -= v.bytes;
    }
  }

  delete(key: K): void {
    const hit = this.map.get(key);
    if (!hit) return;
    this.map.delete(key);
    this.used -= hit.bytes;
  }

  get bytes(): number {
    return this.used;
  }
  get size(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
    this.used = 0;
  }
}

/** Bytes a decoded clip holds: Web Audio keeps Float32 samples per channel. */
export const decodedBytes = (length: number, channels: number): number => length * channels * 4;

/** Below this level counts as silence when trimming at load (AAC padding, breaths, D141c). */
export const TRIM_THRESHOLD = 0.006; // ≈ −44 dBFS
/** Kept before the first and after the last loud sample so soft consonants are not clipped. */
export const TRIM_PAD_S = 0.012;

/**
 * Where a clip's sound starts and ends, in seconds. Encoders pad AAC differently per browser, so
 * the app trims each clip itself instead of trusting the file's edges (D141c).
 */
export function trimBounds(
  samples: ArrayLike<number>,
  sampleRate: number,
  threshold = TRIM_THRESHOLD,
  pad = TRIM_PAD_S,
): { start: number; end: number } {
  let first = -1;
  let last = -1;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]!) >= threshold) {
      if (first < 0) first = i;
      last = i;
    }
  }
  const dur = samples.length / sampleRate;
  if (first < 0) return { start: 0, end: dur };
  return {
    start: Math.max(0, first / sampleRate - pad),
    end: Math.min(dur, (last + 1) / sampleRate + pad),
  };
}

/**
 * Start times (seconds from the line's start) for clips played back to back, each overlapping
 * the one before by the crossfade, and the line's total length.
 */
export function scheduleOffsets(
  durations: readonly number[],
  crossfade: number,
): { starts: number[]; total: number } {
  const starts: number[] = [];
  let t = 0;
  durations.forEach((d, i) => {
    const xf = i === 0 ? 0 : Math.min(crossfade, d / 2, (durations[i - 1] ?? 0) / 2);
    t = Math.max(0, t - xf);
    starts.push(t);
    t += d;
  });
  return { starts, total: t };
}

/**
 * How long each join overlaps (seconds): `fades[i]` is the overlap between clip i and clip i+1, so
 * clip i fades out and clip i+1 fades in over exactly the time they play together.
 */
export function joinFades(starts: readonly number[], durations: readonly number[]): number[] {
  return starts.slice(1).map((s, i) => Math.max(0, starts[i]! + durations[i]! - s));
}

/** Margin past a recorded line's length before it counts as stuck and is cut (SPEC §8.1, §8.4). */
export const RECORDED_MARGIN_MS = 700;

/**
 * The longest a recorded line may take, from the manifest's durations: the clips back to back
 * plus a margin. The TTS formula (§8.1) does not apply to clips (PLAN §6.6).
 */
export function recordedTimeoutMs(manifestMs: readonly number[], crossfadeMs: number): number {
  const { total } = scheduleOffsets(
    manifestMs.map((ms) => ms / 1000),
    crossfadeMs / 1000,
  );
  return Math.round(total * 1000) + RECORDED_MARGIN_MS;
}
