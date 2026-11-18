import { useEffect, useState } from 'react';
import { MAX_BOX } from '../engine/config';
import { BUILT_SKILLS, pool } from '../engine/generators';
import { balance, boxOf, earned, servicesOf, type BoxSet, type Derived } from '../engine/replay';
import type { SkillId, Stage } from '../engine/types';
import { loadedProgress, useDerived } from './progress';
import { getStorageBoot } from './runtime';
import { configFor } from './skillConfig';
import { SKILL_TITLES, STAGE_NAMES } from './SkillPicker';

interface SkillRow {
  skill: SkillId;
  stage: Stage;
  services: number;
  problems: number;
  firstPct: string;
  assisted: number;
  facts: number;
  seen: number;
  /** Facts per box 0–4 in each box set, the never-seen ones apart (SPEC §4.2, D127). */
  tray: number[];
  num: number[];
}

/** Per-skill numbers for the simple progress list (SPEC §12 Progress, the M3a subset). */
export function progressRows(d: Derived): SkillRow[] {
  return BUILT_SKILLS.map((skill) => {
    const keys = [...new Set(pool(skill).map((p) => p.factKey))];
    const seen = keys.filter((k) => d.facts[k] !== undefined);
    const count = (set: BoxSet) => {
      const out = Array.from({ length: MAX_BOX + 1 }, () => 0);
      for (const k of seen) out[boxOf(d, k, set)]!++;
      return out;
    };
    const st = d.skills[skill] ?? { problems: 0, first: 0, assisted: 0 };
    return {
      skill,
      stage: configFor(d.config, skill).stage,
      services: servicesOf(d, skill),
      problems: st.problems,
      firstPct: st.problems ? `${Math.round((100 * st.first) / st.problems)}%` : '–',
      assisted: st.assisted,
      facts: keys.length,
      seen: seen.length,
      tray: count('tray'),
      num: count('num'),
    };
  });
}

/**
 * The simple progress list (SPEC §12, M3a): per skill, services played, problems, first-try share,
 * Pip's full help, and how the facts sit in boxes, shown to parents as confidence 0–4 (D130).
 * Never shown to the child (SPEC §4.2).
 */
export function ProgressList() {
  const d = useDerived();
  const rows = progressRows(d);
  return (
    <section className="parent-progress" data-testid="progress-list">
      <h2>Progress</h2>
      <p data-testid="progress-coins">
        Coins: {balance(d)} in the jar ({earned(d)} earned in all).
      </p>
      <p className="parent-note">Confidence: how many facts sit at 0 · 1 · 2 · 3 · 4.</p>
      {/* Two views of the same rows, swapped in CSS so rotating the phone swaps them live: a phone is
          too small for a readable table of eight columns in either orientation (D131, D132). */}
      <table className="progress-table">
        <thead>
          <tr>
            <th>Dish</th>
            <th>Support level</th>
            <th>Services · Problems</th>
            <th>First try</th>
            <th>Pip helped</th>
            <th>Facts tried</th>
            <th>Tray confidence</th>
            <th>Number pad confidence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.skill} data-testid={`progress-${r.skill}`}>
              <th>
                <DishTitle skill={r.skill} />
              </th>
              <td>{STAGE_NAMES[r.stage]}</td>
              <td className="nowrap">
                <span data-testid={`progress-${r.skill}-services`}>{r.services}</span> ·{' '}
                <span data-testid={`progress-${r.skill}-problems`}>{r.problems}</span>
              </td>
              <td>{r.firstPct}</td>
              <td>{r.assisted}</td>
              <td className="nowrap">
                {r.seen} of {r.facts}
              </td>
              <td className="nowrap" data-testid={`progress-${r.skill}-tray`}>
                {r.tray.join(' · ')}
              </td>
              <td className="nowrap" data-testid={`progress-${r.skill}-num`}>
                {r.num.join(' · ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="progress-cards">
        {rows.map((r) => (
          <dl key={r.skill} className="progress-card" data-testid={`progress-card-${r.skill}`}>
            <DishTitle skill={r.skill} />
            <dt>Support level</dt>
            <dd>{STAGE_NAMES[r.stage]}</dd>
            <dt>Services · Problems</dt>
            <dd>
              {r.services} · {r.problems}
            </dd>
            <dt>First try</dt>
            <dd>{r.firstPct}</dd>
            <dt>Pip helped</dt>
            <dd>{r.assisted}</dd>
            <dt>Facts tried</dt>
            <dd>
              {r.seen} of {r.facts}
            </dd>
            <dt>Tray confidence</dt>
            <dd className="nowrap">{r.tray.join(' · ')}</dd>
            <dt>Number pad confidence</dt>
            <dd className="nowrap">{r.num.join(' · ')}</dd>
          </dl>
        ))}
      </div>
      <p className="parent-note" data-testid="confidence-note">
        Each fact has a confidence score from 0 (new or still learning) to 4 (confident). A correct first answer
        raises it one step. A miss or Pip&apos;s full help sets it back to 0, so the fact comes back for more
        practice. Facts with lower confidence come up more often. The tray and the number pad are tracked
        separately, so counting on the tray doesn&apos;t count as knowing it by heart. Only Little help (tray starts
        empty) and Least help (number pad) change these. At Most help and Some help they stay put.
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

function DishTitle({ skill }: { skill: SkillId }) {
  const t = SKILL_TITLES[skill];
  return (
    <span className="progress-dish">
      {t?.name ?? skill}
      {t && <small>{t.asks}</small>}
    </span>
  );
}
