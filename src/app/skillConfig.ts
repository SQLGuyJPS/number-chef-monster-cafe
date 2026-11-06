// Per-skill stage and operations for M1–M2 playtests (D44b, D52): stored per device in the
// `settings` store under `debugSkillConfig`. M3a replaces it with `skillConfig` events.
import type { Ops, SkillId, Stage } from '../engine/types';
import type { Storage } from '../storage/types';

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

export async function loadSkillConfigs(storage: Storage): Promise<SkillConfigs> {
  try {
    return sanitize(await storage.getSetting(DEBUG_SKILL_CONFIG_KEY));
  } catch {
    return {};
  }
}

export async function saveSkillConfig(storage: Storage, skill: SkillId, cfg: SkillConfig): Promise<void> {
  const all = await loadSkillConfigs(storage);
  all[skill] = cfg;
  await storage.setSetting(DEBUG_SKILL_CONFIG_KEY, all);
}

export const configFor = (all: SkillConfigs, skill: SkillId): SkillConfig => all[skill] ?? DEFAULT_SKILL_CONFIG;
