import { useEffect, useState } from 'react';
import { BUILT_SKILLS } from '../engine/generators';
import { STAGES, type Ops, type SkillId, type Stage } from '../engine/types';
import { getStorageBoot } from './runtime';
import { configFor, loadSkillConfigs, saveSkillConfig, type SkillConfigs } from './skillConfig';

const STAGE_NAMES: Record<Stage, string> = { 3: 'S3 Guided', 2: 'S2 Build', 1: 'S1 Build the answer', 0: 'S0 Numeral' };
const OPS: Ops[] = ['both', 'add', 'sub'];
const OPS_NAMES: Record<Ops, string> = { both: 'both', add: 'addition only', sub: 'subtraction only' };

/**
 * Stage and operations per skill for M1–M2 playtests (D44b, D52). Parent-only: it lives on the
 * `?debug` screen, which no child-facing UI links to. Applies from the next service.
 */
export function SkillPicker() {
  const [configs, setConfigs] = useState<SkillConfigs | null>(null);
  useEffect(() => {
    let live = true;
    void getStorageBoot()?.then(async (b) => {
      const c = await loadSkillConfigs(b.storage);
      if (live) setConfigs(c);
    });
    return () => {
      live = false;
    };
  }, []);

  const change = async (skill: SkillId, patch: { stage?: Stage; ops?: Ops }) => {
    const boot = await getStorageBoot();
    if (!boot || !configs) return;
    const next = { ...configFor(configs, skill), ...patch };
    await saveSkillConfig(boot.storage, skill, next);
    setConfigs({ ...configs, [skill]: next });
  };

  if (!configs) return <p>Loading skills…</p>;
  return (
    <section className="debug-skills" data-testid="skill-picker">
      <h2>Skills (playtest picker, applies from the next service)</h2>
      <table>
        <tbody>
          {BUILT_SKILLS.map((skill) => {
            const c = configFor(configs, skill);
            return (
              <tr key={skill}>
                <th>{skill}</th>
                <td>
                  <select
                    data-testid={`stage-${skill}`}
                    value={c.stage}
                    onChange={(e) => void change(skill, { stage: Number(e.target.value) as Stage })}
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
                    value={c.ops}
                    onChange={(e) => void change(skill, { ops: e.target.value as Ops })}
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
