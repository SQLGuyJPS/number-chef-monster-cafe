// Grown-up labels for dishes and support levels, shared by the parent area and the owner's scripts
// (play report, D189). The S-codes and skill codes stay internal.
import type { SkillId, Stage } from './types';

/** Support-level names for grown-ups (owner's wording, D128, D129). */
export const STAGE_NAMES: Record<Stage, string> = {
  3: 'Most help',
  2: 'Some help',
  1: 'Little help',
  0: 'Least help',
};

/** Each built dish's name and what it asks (SPEC §1.2), so the lists read without the skill codes. */
export const SKILL_TITLES: Partial<Record<SkillId, { name: string; asks: string }>> = {
  A1: { name: 'A1 Little Bites', asks: 'within 5' },
  A2: { name: 'A2 Big Bites', asks: 'within 10' },
  A3: { name: 'A3 Perfect Ten', asks: 'pairs to 10' },
};
