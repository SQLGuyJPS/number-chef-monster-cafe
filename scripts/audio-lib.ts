// Pure helpers for `audio:build` and `audio:todo` (SPEC §8.4, D140, D144). No file system or
// process here, so tests/unit/audioLib.test.ts covers the matching, the filter chain and parsing.
import { VOICE_SHIFTS } from '../src/engine/clips';

/** One Audacity region label: seconds and the text typed for it. */
export interface Label {
  start: number;
  end: number;
  text: string;
  /** 1-based line in the label file, for messages. */
  line: number;
}

/**
 * Audacity's "Export Labels" text: `start<TAB>end<TAB>text` per label. A spectral selection adds a
 * second line starting with `\`; it is skipped. Decimal commas (some Windows locales) are accepted.
 */
export function parseLabels(txt: string): Label[] {
  const out: Label[] = [];
  txt.split(/\r?\n/).forEach((raw, i) => {
    if (!raw.trim() || raw.startsWith('\\')) return;
    const [a, b, ...rest] = raw.split('\t');
    const start = Number((a ?? '').replace(',', '.'));
    const end = Number((b ?? '').replace(',', '.'));
    if (!Number.isFinite(start) || !Number.isFinite(end)) return;
    out.push({ start, end, text: rest.join('\t').trim(), line: i + 1 });
  });
  return out;
}

export interface Take {
  /** Script item number. */
  n: number;
  clip: string;
  file: string;
  start: number;
  end: number;
}

export interface MatchReport {
  takes: Take[];
  /** Script numbers with no label (fine for a partial session). */
  missing: number[];
  /** Problems that stop the build: unknown numbers, duplicates, point labels, unreadable text. */
  errors: string[];
}

/** Matches every file's labels to the script by number (D140c). */
export function matchLabels(
  script: ReadonlyMap<number, string>,
  files: readonly { file: string; labels: readonly Label[] }[],
): MatchReport {
  const takes: Take[] = [];
  const errors: string[] = [];
  const seen = new Map<number, string>();
  for (const { file, labels } of files) {
    for (const l of labels) {
      const where = `${file} line ${l.line}`;
      if (!/^\d+$/.test(l.text)) {
        errors.push(`${where}: label "${l.text}" is not a script number`);
        continue;
      }
      const n = Number(l.text);
      const clip = script.get(n);
      if (!clip) {
        errors.push(`${where}: ${n} is not in the script (extra)`);
        continue;
      }
      if (l.end - l.start < 0.05) {
        errors.push(`${where}: ${n} is a point label; select the words and press Ctrl+B`);
        continue;
      }
      const prev = seen.get(n);
      if (prev) {
        errors.push(`${where}: ${n} is labelled twice (also ${prev}); keep one label per number`);
        continue;
      }
      seen.set(n, where);
      takes.push({ n, clip, file, start: l.start, end: l.end });
    }
  }
  const missing = [...script.keys()].filter((n) => !seen.has(n)).sort((a, b) => a - b);
  takes.sort((a, b) => a.n - b.n);
  return { takes, missing, errors };
}

/** Loudness target for speech clips (EBU R128 integrated, measured per master take). */
export const TARGET_LUFS = -18;
/** Silence below this is trimmed from both ends; the app trims again at load (D141c). */
export const TRIM_DB = -45;
/** Seconds of audio kept around each label so a soft start or end is not clipped. */
export const PAD_S = 0.04;

/** Gain in dB that brings a master to the target, clamped so a silent file does not explode. */
export function gainFor(inputLufs: number): number {
  if (!Number.isFinite(inputLufs)) return 0;
  return Math.round(Math.max(-12, Math.min(24, TARGET_LUFS - inputLufs)) * 10) / 10;
}

/** `loudnorm=print_format=json` prints a JSON block on stderr; its `input_i` is the loudness. */
export function parseLoudness(stderr: string): number {
  const m = /\{[^{}]*"input_i"[^{}]*\}/s.exec(stderr);
  if (!m) return Number.NaN;
  try {
    return Number((JSON.parse(m[0]) as { input_i: string }).input_i);
  } catch {
    return Number.NaN;
  }
}

/** The last `time=HH:MM:SS.xx` ffmpeg reports: the encoded duration in ms. */
export function parseDurationMs(stderr: string): number {
  const all = [...stderr.matchAll(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/g)];
  const m = all[all.length - 1];
  if (!m) return 0;
  return Math.round((Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])) * 1000);
}

/**
 * Per clip and voice (D140): resample, gentle high-pass, the master's gain, trim silence at both
 * ends, the voice's pitch shift (formant-preserving `rubberband`, D145), a limiter and short fades.
 */
export function filterChain(voice: string, gainDb: number): string {
  const trim = `silenceremove=start_periods=1:start_silence=0.03:start_threshold=${TRIM_DB}dB`;
  const shift = VOICE_SHIFTS[voice] ?? { semitones: 0, tempo: 1 };
  const parts = [
    'aresample=48000',
    'highpass=f=70',
    `volume=${gainDb}dB`,
    trim,
    'areverse',
    trim,
    'areverse',
  ];
  if (shift.semitones !== 0 || shift.tempo !== 1) {
    const pitch = Math.pow(2, shift.semitones / 12).toFixed(5);
    parts.push(`rubberband=pitch=${pitch}:tempo=${shift.tempo}:formant=preserved:pitchq=quality`);
  }
  parts.push(
    'alimiter=limit=0.9:level=disabled',
    'afade=t=in:d=0.005',
    'areverse',
    'afade=t=in:d=0.01',
    'areverse',
  );
  return parts.join(',');
}

/** ffmpeg arguments that cut one take from its master and encode it (AAC-LC 48 kbps mono, D140b). */
export function encodeArgs(
  master: string,
  take: Pick<Take, 'start' | 'end'>,
  voice: string,
  gainDb: number,
  out: string,
  kbps = 48,
): string[] {
  const from = Math.max(0, take.start - PAD_S);
  const len = take.end + PAD_S - from;
  return [
    '-hide_banner',
    '-y',
    '-ss',
    from.toFixed(3),
    '-t',
    len.toFixed(3),
    '-i',
    master,
    '-af',
    filterChain(voice, gainDb),
    '-ac',
    '1',
    '-ar',
    '48000',
    '-c:a',
    'aac',
    '-b:a',
    `${kbps}k`,
    '-movflags',
    '+faststart',
    out,
  ];
}

/** Which voices get a clip: the spike gives every voice everything; the full set follows the inventory. */
export function voicesForClip(
  clip: string,
  inventory: ReadonlyMap<string, ReadonlySet<string>> | null,
  allVoices: readonly string[],
): string[] {
  if (!inventory) return [...allVoices];
  return allVoices.filter((v) => inventory.get(v)?.has(clip));
}

/** "pip 81 clips 412 KB" lines and a total, for the console and docs/perf (D144). */
export function sizeReport(sizes: ReadonlyMap<string, readonly number[]>): string[] {
  const kb = (b: number) => `${(b / 1024).toFixed(0)} KB`;
  let total = 0;
  let count = 0;
  const lines: string[] = [];
  for (const [voice, list] of sizes) {
    const sum = list.reduce((a, b) => a + b, 0);
    total += sum;
    count += list.length;
    lines.push(
      `${voice.padEnd(10)} ${String(list.length).padStart(4)} clips ${kb(sum).padStart(8)}`,
    );
  }
  lines.push(`${'total'.padEnd(10)} ${String(count).padStart(4)} clips ${kb(total).padStart(8)}`);
  return lines;
}
