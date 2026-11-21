import { describe, expect, it } from 'vitest';
import {
  CLIP_POLICY,
  PHRASE_SPEAKERS,
  VOICE_IDS,
  clipPlan,
  clipTranscript,
  isClipIdShape,
  lineClips,
  lineText,
  normalizeSpeech,
  type ClipPolicy,
  type Line,
} from '../../src/engine/clips';
import { PHRASES, phrase, type PhraseKey } from '../../src/engine/phrases';
import { MONSTER_SPECS } from '../../src/art/monsters/specs';
import {
  SPIKE_LINES,
  fullScript,
  parseScript,
  phraseParamSets,
  renderScript,
  scriptItemCount,
  spikeScript,
  targetOf,
  voiceInventory,
} from '../../src/engine/voiceScript';

import {
  MONSTER_LINES as monsters,
  TICKETS as tickets,
  monsterText,
} from '../../scripts/voice-data';
const join = (clips: readonly string[]) =>
  clips.map((c) => clipTranscript(c, monsterText) ?? `<${c}?>`).join(' ');

describe('clipPlan (D141b)', () => {
  const policies: [string, ClipPolicy][] = [
    ['default', CLIP_POLICY],
    ['pairs', { ...CLIP_POLICY, pairs: true }],
  ];
  for (const [name, policy] of policies) {
    it(`transcripts join to the phrase text for every phrase and parameter in range (${name})`, () => {
      let checked = 0;
      for (const key of Object.keys(PHRASES) as PhraseKey[]) {
        for (const params of phraseParamSets(key)) {
          const clips = clipPlan(key, params, policy);
          expect(normalizeSpeech(join(clips)), `${key} ${JSON.stringify(params)}`).toBe(
            normalizeSpeech(phrase(key, params)),
          );
          checked++;
        }
      }
      expect(checked).toBeGreaterThan(10_000);
    });
  }

  it('every clip id has the D141 shape', () => {
    for (const key of Object.keys(PHRASES) as PhraseKey[])
      for (const params of phraseParamSets(key))
        for (const c of clipPlan(key, params)) expect(isClipIdShape(c), c).toBe(true);
  });

  it('numbers are whole and carry their form: "Seven plus two cookies, please!"', () => {
    expect(clipPlan('order.add', { a: 7, b: 2, food: 'cookie' })).toEqual([
      'num.7.lead',
      'w.plus',
      'num.2.mid',
      'food.cookie.please',
    ]);
    expect(clipPlan('plate.echo', { seen: 2, wanted: 3 })).toEqual([
      'num.2.ask',
      'w.i-wanted',
      'num.3.end',
    ]);
    expect(clipPlan('ct.more', { n: 3 }, { ...CLIP_POLICY, pairs: true })).toEqual(['pair.3.more']);
  });

  it('one number form is a table change (D139d)', () => {
    const one: ClipPolicy = {
      forms: { lead: 'mid', mid: 'mid', end: 'mid', ask: 'mid' },
      pairs: false,
    };
    expect(clipPlan('order.add', { a: 7, b: 2, food: 'cookie' }, one)).toEqual([
      'num.7.mid',
      'w.plus',
      'num.2.mid',
      'food.cookie.please',
    ]);
  });

  it('missing-number tickets join to the generator sentence', () => {
    expect(tickets.length).toBeGreaterThan(0);
    for (const d of tickets) {
      const line: Line = { kind: 'ticket', display: d };
      expect(normalizeSpeech(join(lineClips(line)!))).toBe(normalizeSpeech(lineText(line)));
    }
  });

  it('monster lines are one clip each and text lines are never recorded (D139e)', () => {
    for (const s of MONSTER_SPECS)
      for (const which of ['arrive', 'thanks'] as const)
        s.lines[which].forEach((text, index) => {
          const clips = lineClips({ kind: 'monster', monster: s.id, which, index, text })!;
          expect(clips).toEqual([`mon.${s.id}.${which}.${index}`]);
          expect(join(clips)).toBe(text);
        });
    expect(lineClips({ kind: 'text', text: 'Hello, Sam!' })).toBeNull();
  });

  it('every phrase has a speaker; voices are the monsters, pip and narrator', () => {
    expect(Object.keys(PHRASE_SPEAKERS).sort()).toEqual(Object.keys(PHRASES).sort());
    expect(VOICE_IDS).toEqual([...MONSTER_SPECS.map((s) => s.id), 'pip', 'narrator']);
  });
});

describe('recording scripts (D144)', () => {
  it('the spike has every PLAN §6.2 item and every spike line can be stitched from it', () => {
    const sections = spikeScript();
    const clips = new Set(sections.flatMap((s) => s.items.map((i) => i.clip)));
    expect(scriptItemCount(sections)).toBe(clips.size); // no duplicates
    for (const l of SPIKE_LINES) {
      for (const policy of [CLIP_POLICY, { ...CLIP_POLICY, pairs: true }])
        for (const c of clipPlan(l.key, l.params, policy))
          expect(clips.has(c), `${l.key} ${c}`).toBe(true);
      if (l.ref) expect(clips.has(l.ref)).toBe(true);
    }
    expect(clips.size).toBeGreaterThan(45);
    expect(clips.size).toBeLessThan(65);
  });

  it('each carrier marks a target that says exactly the clip transcript', () => {
    for (const sections of [spikeScript(), fullScript(monsters, tickets)])
      for (const s of sections)
        for (const it of s.items)
          expect(normalizeSpeech(targetOf(it.carrier)), it.clip).toBe(
            normalizeSpeech(clipTranscript(it.clip, monsterText)!),
          );
  });

  it('the full script covers the inventory of every voice exactly once', () => {
    const inv = voiceInventory(monsters, tickets);
    const all = new Set([...inv.values()].flatMap((s) => [...s]));
    const sections = fullScript(monsters, tickets);
    const listed = sections.flatMap((s) => s.items.map((i) => i.clip));
    expect(new Set(listed).size).toBe(listed.length);
    expect(new Set(listed)).toEqual(all);
    // A monster's own lines are only in its own voice.
    expect(inv.get('pip')!.has('mon.blobbo.arrive.0')).toBe(false);
    expect(inv.get('blobbo')!.has('mon.blobbo.arrive.0')).toBe(true);
    expect(inv.get('gruffles')!.has('mon.blobbo.arrive.0')).toBe(false);
  });

  it('rendered Markdown reads back item number → clip', () => {
    const sections = spikeScript();
    const md = renderScript('Spike', ['intro'], sections);
    const map = parseScript(md);
    const flat = sections.flatMap((s) => s.items.map((i) => i.clip));
    expect([...map.keys()]).toEqual(flat.map((_, i) => i + 1));
    expect([...map.values()]).toEqual(flat);
    expect(md).toContain('1. **Zero** plus two cookies, please! — `num.0.lead`');
  });
});
