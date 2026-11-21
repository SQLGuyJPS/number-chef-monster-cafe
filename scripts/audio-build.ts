// `npm run audio:build -- --src <folder>` (SPEC §8.4, D140c, D144): the owner's Audacity masters
// (WAV + label export) → public/audio/<voice>/<clipId>.m4a + public/audio/manifest.json.
//
// Options: --src <folder> (default voice-masters), --script <md> (default docs/VOICE_SPIKE.md when
// the folder name contains "spike", else docs/VOICE_SCRIPT.md), --voices a,b (only these),
// --kbps 48|64, --jobs N, --dry-run (match labels and report only).
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import { VOICE_IDS } from '../src/engine/clips';
import {
  emptyManifest,
  mergeManifest,
  parseManifest,
  type VoiceManifest,
} from '../src/engine/voiceManifest';
import { parseScript, voiceInventory } from '../src/engine/voiceScript';
import {
  encodeArgs,
  gainFor,
  matchLabels,
  parseDurationMs,
  parseLabels,
  parseLoudness,
  sizeReport,
  voicesForClip,
  type Take,
} from './audio-lib';
import { MONSTER_LINES, TICKETS } from './voice-data';

const repo = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const opt = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const src = resolve(repo, opt('src') ?? 'voice-masters');
const isSpike = /spike/i.test(basename(src));
const scriptFile = resolve(
  repo,
  opt('script') ?? (isSpike ? 'docs/VOICE_SPIKE.md' : 'docs/VOICE_SCRIPT.md'),
);
const onlyVoices = opt('voices')
  ?.split(',')
  .map((v) => v.trim())
  .filter(Boolean);
const kbps = Number(opt('kbps') ?? 48);
const jobs = Math.max(1, Number(opt('jobs') ?? 4));
const dryRun = args.includes('--dry-run');
const outRoot = join(repo, 'public/audio');

function fail(msg: string): never {
  console.error(`audio:build: ${msg}`);
  process.exit(1);
}

function run(argv: string[]): Promise<{ code: number; stderr: string }> {
  return new Promise((res) => {
    const p = spawn(ffmpegPath as unknown as string, argv, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    p.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
    p.on('error', (e) => res({ code: 1, stderr: String(e) }));
    p.on('close', (code) => res({ code: code ?? 1, stderr }));
  });
}

async function pool<T>(items: readonly T[], n: number, f: (t: T) => Promise<void>): Promise<void> {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) await f(items[next++]!);
    }),
  );
}

async function main() {
  if (!ffmpegPath || !existsSync(ffmpegPath as unknown as string))
    fail('ffmpeg-static has no binary for this platform (re-run npm install)');
  if (!existsSync(src)) fail(`no folder ${src}`);
  if (!existsSync(scriptFile))
    fail(`no script ${scriptFile} (run npm run audio:todo${isSpike ? ' -- --spike' : ''})`);
  if (!Number.isFinite(kbps) || kbps < 32 || kbps > 128) fail('--kbps must be 32–128');
  const unknown = onlyVoices?.filter((v) => !VOICE_IDS.includes(v));
  if (unknown?.length)
    fail(`unknown voice(s): ${unknown.join(', ')} (voices: ${VOICE_IDS.join(', ')})`);

  const script = parseScript(readFileSync(scriptFile, 'utf8'));
  console.log(`audio:build: ${src} against ${scriptFile} (${script.size} lines)`);

  // Every WAV needs its label file (same name, .txt) and the other way round.
  const names = readdirSync(src).filter((f) => statSync(join(src, f)).isFile());
  const wavs = names.filter((f) => extname(f).toLowerCase() === '.wav');
  const txts = names.filter((f) => extname(f).toLowerCase() === '.txt');
  const stem = (f: string) => f.slice(0, -extname(f).length);
  const problems: string[] = [];
  for (const t of txts)
    if (!wavs.some((w) => stem(w) === stem(t))) problems.push(`${t} has no WAV with the same name`);
  const pairs = wavs.flatMap((w) => {
    const t = txts.find((x) => stem(x) === stem(w));
    if (!t) {
      problems.push(`${w} has no label file (${stem(w)}.txt)`);
      return [];
    }
    return [
      { wav: join(src, w), file: t, labels: parseLabels(readFileSync(join(src, t), 'utf8')) },
    ];
  });
  const report = matchLabels(
    script,
    pairs.map((p) => ({ file: p.file, labels: p.labels })),
  );
  problems.push(...report.errors);
  console.log(
    `  ${report.takes.length} labelled, ${report.missing.length} missing${report.missing.length ? `: ${report.missing.join(', ')}` : ''}`,
  );
  if (problems.length) fail(`fix these first:\n  ${problems.join('\n  ')}`);
  if (dryRun || report.takes.length === 0) return;

  // One loudness measurement per master, so every clip from a take gets the same gain (D140b).
  const gain = new Map<string, number>();
  for (const p of pairs) {
    const r = await run([
      '-hide_banner',
      '-nostats',
      '-i',
      p.wav,
      '-af',
      'loudnorm=print_format=json',
      '-f',
      'null',
      '-',
    ]);
    gain.set(p.file, gainFor(parseLoudness(r.stderr)));
    console.log(`  ${p.file}: gain ${gain.get(p.file)} dB`);
  }

  const inventory = isSpike ? null : voiceInventory(MONSTER_LINES, TICKETS);
  const voices = onlyVoices ?? VOICE_IDS;
  const work: { take: Take; voice: string; wav: string }[] = [];
  for (const take of report.takes) {
    const wav = pairs.find((p) => p.file === take.file)!.wav;
    for (const voice of voicesForClip(take.clip, inventory, voices))
      work.push({ take, voice, wav });
  }

  const written: VoiceManifest['voices'] = {};
  const sizes = new Map<string, number[]>();
  const failed: string[] = [];
  let done = 0;
  await pool(work, jobs, async ({ take, voice, wav }) => {
    const out = join(outRoot, voice, `${take.clip}.m4a`);
    mkdirSync(dirname(out), { recursive: true });
    const r = await run(encodeArgs(wav, take, voice, gain.get(take.file) ?? 0, out, kbps));
    const ms = parseDurationMs(r.stderr);
    if (r.code !== 0 || ms <= 0) {
      failed.push(
        `${voice}/${take.clip}: ${r.stderr.split('\n').filter(Boolean).slice(-2).join(' | ')}`,
      );
      return;
    }
    (written[voice] ??= {})[take.clip] = ms;
    sizes.set(voice, [...(sizes.get(voice) ?? []), statSync(out).size]);
    if (++done % 50 === 0) console.log(`  ${done} / ${work.length}`);
  });
  if (failed.length)
    fail(`${failed.length} clip(s) failed:\n  ${failed.slice(0, 10).join('\n  ')}`);

  const manifestPath = join(outRoot, 'manifest.json');
  const base = existsSync(manifestPath)
    ? parseManifest(JSON.parse(readFileSync(manifestPath, 'utf8')))
    : emptyManifest();
  if (!base) fail('public/audio/manifest.json is not a valid manifest; fix or delete it');
  if (base.ext !== 'm4a') fail('public/audio/manifest.json is not an m4a manifest');
  writeFileSync(manifestPath, `${JSON.stringify(mergeManifest(base, written), null, 1)}\n`);
  console.log(`audio:build: wrote ${done} clips and public/audio/manifest.json`);
  for (const l of sizeReport(
    new Map([...sizes].sort(([a], [b]) => VOICE_IDS.indexOf(a) - VOICE_IDS.indexOf(b))),
  ))
    console.log(`  ${l}`);
}

void main();
