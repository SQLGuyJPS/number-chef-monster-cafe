import { BUILT_SKILLS } from '../engine/generators';
import { STAGES, type Ops, type SkillId, type Stage } from '../engine/types';
import { loadedProgress, useDerived } from './progress';
import { configFor } from './skillConfig';
import { SKILL_TITLES, STAGE_NAMES } from '../engine/labels';

export { SKILL_TITLES, STAGE_NAMES };

export const STAGE_HELP: Record<Stage, string> = {
  3: 'The tray starts partially filled; Pip counts each tap aloud.',
  2: 'The tray starts partially filled; no spoken counts, a tone per tap.',
  1: 'The tray begins empty.',
  0: 'The player types the answer on a number pad. The tray appears only when the player asks for a hint or enters a wrong answer three times for the same order.',
};
const OPS: Ops[] = ['both', 'add', 'sub'];
const OPS_NAMES: Record<Ops, string> = {
  both: 'addition and subtraction',
  add: 'addition only',
  sub: 'subtraction only',
};
export const SKILL_NAMES: Partial<Record<SkillId, string>> = Object.fromEntries(
  Object.entries(SKILL_TITLES).map(([k, t]) => [k, `${t.name} (${t.asks})`]),
);

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
      <p>Support level and operations per dish. Changes apply from the next service.</p>
      <dl className="parent-levels" data-testid="stage-help">
        {STAGES.map((st) => (
          <div key={st}>
            <dt>{STAGE_NAMES[st]}</dt>
            <dd>{STAGE_HELP[st]}</dd>
          </div>
        ))}
      </dl>
      <table className="skills-table">
        <tbody>
          {BUILT_SKILLS.map((skill) => {
            const c = configFor(d.config, skill);
            return (
              <tr key={skill}>
                <th>{SKILL_NAMES[skill] ?? skill}</th>
                <td>
                  <select
                    data-testid={`stage-${skill}`}
                    aria-label={`${skill} support level`}
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
