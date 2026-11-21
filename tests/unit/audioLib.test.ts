import { describe, expect, it } from 'vitest';
import {
  encodeArgs,
  filterChain,
  gainFor,
  matchLabels,
  parseDurationMs,
  parseLabels,
  parseLoudness,
  sizeReport,
  voicesForClip,
} from '../../scripts/audio-lib';
import { VOICE_IDS } from '../../src/engine/clips';

describe('Audacity labels (D140c)', () => {
  it('reads region labels, skips spectral lines, accepts decimal commas', () => {
    const txt = '0.500000\t1.250000\t1\n\\\t100.0\t2000.0\r\n2,000000\t2,600000\t 2 \n\n';
    expect(parseLabels(txt)).toEqual([
      { start: 0.5, end: 1.25, text: '1', line: 1 },
      { start: 2, end: 2.6, text: '2', line: 3 },
    ]);
  });

  it('matches by number and reports missing, extra, duplicate, point and non-number labels', () => {
    const script = new Map([
      [1, 'num.0.lead'],
      [2, 'num.1.lead'],
      [3, 'num.2.lead'],
      [4, 'w.plus'],
    ]);
    const lab = (start: number, end: number, text: string, line: number) => ({
      start,
      end,
      text,
      line,
    });
    const r = matchLabels(script, [
      { file: 'a.txt', labels: [lab(0, 0.5, '1', 1), lab(1, 1.5, '9', 2), lab(2, 2, '3', 3)] },
      { file: 'b.txt', labels: [lab(0, 0.5, '1', 1), lab(1, 1.6, '2', 2), lab(3, 3.4, 'two', 3)] },
    ]);
    expect(r.takes.map((t) => [t.n, t.clip, t.file])).toEqual([
      [1, 'num.0.lead', 'a.txt'],
      [2, 'num.1.lead', 'b.txt'],
    ]);
    expect(r.missing).toEqual([3, 4]);
    expect(r.errors).toHaveLength(4);
    expect(r.errors.join('\n')).toMatch(/9 is not in the script/);
    expect(r.errors.join('\n')).toMatch(/3 is a point label/);
    expect(r.errors.join('\n')).toMatch(/1 is labelled twice/);
    expect(r.errors.join('\n')).toMatch(/"two" is not a script number/);
  });
});

describe('processing chain (D140, D145)', () => {
  it('narrator is unshifted; other voices use formant-preserving rubberband', () => {
    expect(filterChain('narrator', 0)).not.toContain('rubberband');
    const pip = filterChain('pip', 3);
    expect(pip).toContain('rubberband=pitch=1.41421:tempo=1:formant=preserved');
    expect(pip).toContain('volume=3dB');
    expect(pip).toMatch(/^aresample=48000,highpass/);
  });
  it('cuts with a pad and encodes AAC-LC mono 48 kbps', () => {
    const a = encodeArgs('m.wav', { start: 1, end: 1.5 }, 'pip', 0, 'out.m4a');
    expect(a.slice(a.indexOf('-ss'), a.indexOf('-ss') + 4)).toEqual([
      '-ss',
      '0.960',
      '-t',
      '0.580',
    ]);
    expect(a.join(' ')).toContain('-ac 1 -ar 48000 -c:a aac -b:a 48k');
    expect(encodeArgs('m.wav', { start: 0.01, end: 0.5 }, 'pip', 0, 'o.m4a')).toContain('0.000');
  });
  it('gain targets the loudness and is clamped', () => {
    expect(gainFor(-24)).toBe(6);
    expect(gainFor(-70)).toBe(24);
    expect(gainFor(Number.NaN)).toBe(0);
  });
  it('parses loudnorm JSON and the encoded duration', () => {
    expect(parseLoudness('junk\n{\n\t"input_i" : "-23.41",\n\t"input_tp" : "-4.0"\n}\n')).toBe(
      -23.41,
    );
    expect(parseLoudness('nothing')).toBeNaN();
    expect(parseDurationMs('size=1kB time=00:00:00.25 x\nsize=6kB time=00:00:01.53 bitrate=')).toBe(
      1530,
    );
  });
  it('the spike goes to every voice; the full set follows the inventory', () => {
    expect(voicesForClip('num.1.lead', null, VOICE_IDS)).toEqual(VOICE_IDS);
    const inv = new Map([['pip', new Set(['num.1.end'])]]);
    expect(voicesForClip('num.1.end', inv, VOICE_IDS)).toEqual(['pip']);
  });
  it('reports sizes per voice and in total', () => {
    const r = sizeReport(
      new Map([
        ['pip', [2048, 2048]],
        ['narrator', [1024]],
      ]),
    );
    expect(r[0]).toMatch(/pip\s+2 clips\s+4 KB/);
    expect(r[2]).toMatch(/total\s+3 clips\s+5 KB/);
  });
});
