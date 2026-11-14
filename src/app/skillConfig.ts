// Per-skill stage and operations (SPEC §3.2, §11.2). From M3a they are `skillConfig` events in the
// log (`Derived.config`); before that the playtest picker kept them per device under
// `debugSkillConfig` (D52), which the first M3a boot turns into events and deletes (D125).
import type { Ops, SkillId, Stage } from '../engine/types';

export interface SkillConfig {
  stage: Stage;
  ops: Ops;
}
export type SkillConfigs = Partial<Record<SkillId, SkillConfig>>;

export const DEBUG_SKILL_CONFIG_KEY = 'debugSkillConfig';
/** SPEC §4.2: every skill starts at S3 with both operations (D23, D24). */
export const DEFAULT_SKILL_CONFIG: SkillConfig = { stage: 3, ops: 'both' };

const isStage = (v: unknown): v is Stage => v === 0 || v === 1 || v === 2 || v === 3;
const isOps = (v: unknown): v is Ops => v === 'both' || v === 'add' || v === 'sub';

/** Unknown or damaged rows fall back to the default instead of breaking the service. */
export function sanitize(raw: unknown): SkillConfigs {
  const out: SkillConfigs = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^[AB][0-9]$/.test(k) || !v || typeof v !== 'object') continue;
    const { stage, ops } = v as Record<string, unknown>;
    if (isStage(stage) && isOps(ops)) out[k as SkillId] = { stage, ops };
  }
  return out;
}

export const configFor = (all: SkillConfigs, skill: SkillId): SkillConfig => all[skill] ?? DEFAULT_SKILL_CONFIG;
