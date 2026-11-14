import { useEffect, useState } from 'react';
import { MAX_BOX } from '../engine/config';
import { BUILT_SKILLS, pool } from '../engine/generators';
import { balance, boxOf, earned, servicesOf, type Derived, type Initial } from '../engine/replay';
import type { SkillId } from '../engine/types';
import { loadedProgress, useDerived } from './progress';
import { getStorageBoot } from './runtime';
import { configFor } from './skillConfig';
import { SKILL_NAMES } from './SkillPicker';

interface SkillRow {
  skill: SkillId;
  stage: number;
  services: number;
  problems: number;
  firstPct: string;
  assisted: number;
  facts: number;
  seen: number;
  /** Facts per box 0–4, the never-seen ones apart (SPEC §4.2). */
  boxes: number[];
  fresh: number;
}

/** Per-skill numbers for the simple progress list (SPEC §12 Progress, the M3a subset). */
export function progressRows(d: Derived, initial: Initial): SkillRow[] {
  return BUILT_SKILLS.map((skill) => {
    const keys = [...new Set(pool(skill).map((p) => p.factKey))];
    const boxes = Array.from({ length: MAX_BOX + 1 }, () => 0);
    let fresh = 0;
    for (const k of keys) {
      if (d.facts[k] === undefined && initial[k] === undefined) fresh++;
      else boxes[boxOf(d, k, initial)]!++;
    }
    const st = d.skills[skill] ?? { problems: 0, first: 0, assisted: 0 };
    return {
      skill,
      stage: configFor(d.config, skill).stage,
      services: servicesOf(d, skill),
      problems: st.problems,
      firstPct: st.problems ? `${Math.round((100 * st.first) / st.problems)}%` : '–',
      assisted: st.assisted,
      facts: keys.length,
      seen: keys.filter((k) => d.facts[k] !== undefined).length,
      boxes,
      fresh,
    };
  });
}

/**
 * The simple progress list (SPEC §12, M3a): per skill, services played, problems, first-try share,
 * Pip's full help, and how the facts sit in boxes. Never shown to the child (SPEC §4.2).
 */
export function ProgressList() {
  const d = useDerived();
  const initial = loadedProgress()?.initial ?? {};
  const rows = progressRows(d, initial);
  return (
    <section className="parent-progress" data-testid="progress-list">
      <h2>Progress</h2>
      <p data-testid="progress-coins">
        Coins: {balance(d)} in the jar ({earned(d)} earned in all).
      </p>
      <table>
        <thead>
          <tr>
            <th>Dish</th>
            <th>Stage</th>
            <th>Services</th>
            <th>Problems</th>
            <th>First try</th>
            <th>Pip helped</th>
            <th>Facts tried</th>
            <th>Boxes 0 · 1 · 2 · 3 · 4 (new)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.skill} data-testid={`progress-${r.skill}`}>
              <th>{SKILL_NAMES[r.skill] ?? r.skill}</th>
              <td>S{r.stage}</td>
              <td data-testid={`progress-${r.skill}-services`}>{r.services}</td>
              <td data-testid={`progress-${r.skill}-problems`}>{r.problems}</td>
              <td>{r.firstPct}</td>
              <td>{r.assisted}</td>
              <td>
                {r.seen} of {r.facts}
              </td>
              <td>
                {r.boxes.join(' · ')} ({r.fresh})
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="parent-note">
        A fact moves up a box only when it is answered right first time at S1 or S0, so at S3 and S2 the boxes
        stay put. A miss or Pip's full help puts it back in box 0. Facts the child already knew (+1 and doubles)
        start in box 3.
      </p>
    </section>
  );
}

interface StorageInfo {
  persisted: string;
  usage: string;
  kind: string;
}

const MB = (n?: number) => (n === undefined ? '?' : `${(n / 1048576).toFixed(1)} MB`);

/**
 * Whether the browser promised to keep the data, and how much space it uses (SPEC §11.3). Opening
 * the grown-ups' screen asks again for persistence. Both are feature-detected: missing on Safari
 * before 17 (D44).
 */
export function StorageStatus() {
  const [info, setInfo] = useState<StorageInfo | null>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      const st = typeof navigator !== 'undefined' ? navigator.storage : undefined;
      let persisted = 'not available on this device';
      if (st?.persist) {
        try {
          persisted = (await st.persist()) ? 'yes' : 'no (the browser may clear it if space runs low)';
        } catch {
          persisted = st.persisted ? String(await st.persisted().catch(() => '?')) : persisted;
        }
      } else if (st?.persisted) {
        persisted = (await st.persisted()) ? 'yes' : 'no';
      }
      let usage = 'not available on this device';
      if (st?.estimate) {
        const e = await st.estimate();
        usage = `${MB(e.usage)} of ${MB(e.quota)}`;
      }
      const boot = await getStorageBoot();
      const kind = !boot
        ? '?'
        : boot.degraded
          ? `not saved: running in memory (IndexedDB failed: ${boot.error ?? '?'})`
          : 'saved on this device';
      if (live) setInfo({ persisted, usage, kind });
    })();
    return () => {
      live = false;
    };
  }, []);
  const err = loadedProgress()?.writeError;
  return (
    <section className="parent-storage" data-testid="storage-status">
      <h2>Storage</h2>
      {!info ? (
        <p>Checking…</p>
      ) : (
        <table>
          <tbody>
            <tr>
              <th>Progress</th>
              <td data-testid="storage-kind">{info.kind}</td>
            </tr>
            <tr>
              <th>Kept safe by the browser</th>
              <td data-testid="storage-persisted">{info.persisted}</td>
            </tr>
            <tr>
              <th>Space used</th>
              <td data-testid="storage-usage">{info.usage}</td>
            </tr>
            {err && (
              <tr>
                <th>Last save failed</th>
                <td>{err}</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      <p className="parent-note">
        Install the game to the Home Screen before the first play: on an iPad or iPhone a Safari tab and the Home
        Screen app keep separate progress, and Safari may clear a tab&apos;s data after 7 days without a visit.
      </p>
    </section>
  );
}
