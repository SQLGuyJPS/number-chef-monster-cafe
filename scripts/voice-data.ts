// The game data the voice scripts need (D144): monster lines live with the art, tickets come from
// the built pools. Kept out of src/engine so the engine stays free of art imports.
import { MONSTER_SPECS } from '../src/art/monsters/specs';
import { BUILT_SKILLS, pool } from '../src/engine/generators';
import type { MonsterLines, TicketDisplays } from '../src/engine/voiceScript';

export const MONSTER_LINES: readonly MonsterLines[] = MONSTER_SPECS.map((s) => ({
  id: s.id,
  arrive: s.lines.arrive,
  thanks: s.lines.thanks,
}));

/** Missing-number forms speak the generator's ticket sentence (A3). */
export const TICKETS: TicketDisplays = BUILT_SKILLS.flatMap((s) => pool(s))
  .filter((p) => p.form === 'missingAddend' || p.form === 'missingSub')
  .map((p) => p.display);

export const monsterText = (m: string, which: 'arrive' | 'thanks', i: number): string | undefined =>
  MONSTER_SPECS.find((s) => s.id === m)?.lines[which][i];
