import { BUILT_SKILLS } from '../engine/generators';
import { STAGES, type Ops, type SkillId, type Stage } from '../engine/types';
import { loadedProgress, useDerived } from './progress';
import { configFor } from './skillConfig';

const STAGE_NAMES: Record<Stage, string> = {
  3: 'S3 Guided',
  2: 'S2 Build',
  1: 'S1 Build the answer',
  0: 'S0 Numeral',
};
const OPS: Ops[] = ['both', 'add', 'sub'];
const OPS_NAMES: Record<Ops, string> = { both: 'both', add: 'addition only', sub: 'subtraction only' };
/** What each built dish asks (SPEC §1.2), so the list reads without the skill codes. */
export const SKILL_NAMES: Partial<Record<SkillId, string>> = {
  A1: 'A1 Little Bites (within 5)',
  A2: 'A2 Big Bites (within 10)',
  A3: 'A3 Perfect Ten (pairs to 10)',
};

/**
 * The minimal Skills list (SPEC §12, M3a): stage and operations per skill, each change a
 * `skillConfig` event (SPEC §11.2) that applies from the next service. M3b puts the gate in front.
 */
export function SkillPicker() {
  const d = useDerived();
  const progress = loadedProgress();
  const change = (skill: SkillId, patch: { stage?: Stage; ops?: Ops }) => {
    const next = { ...configFor(d.config, skill), ...patch };
    progress?.setSkillConfig(skill, next.stage, next.ops);
  };

  if (!progress) return <p>Loading skills…</p>;
  return (
    <section className="debug-skills" data-testid="skill-picker">
      <h2>Skills</h2>
      <p>Stage and operations per dish. Changes apply from the next service.</p>
      <table>
        <tbody>
          {BUILT_SKILLS.map((skill) => {
            const c = configFor(d.config, skill);
            return (
              <tr key={skill}>
                <th>{SKILL_NAMES[skill] ?? skill}</th>
                <td>
                  <select
                    data-testid={`stage-${skill}`}
                    aria-label={`${skill} stage`}
                    value={c.stage}
                    onChange={(e) => change(skill, { stage: Number(e.target.value) as Stage })}
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_NAMES[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    data-testid={`ops-${skill}`}
                    aria-label={`${skill} operations`}
                    value={c.ops}
                    onChange={(e) => change(skill, { ops: e.target.value as Ops })}
                  >
                    {OPS.map((o) => (
                      <option key={o} value={o}>
                        {OPS_NAMES[o]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
