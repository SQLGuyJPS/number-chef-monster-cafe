import { expect } from 'vitest';
import { PHRASE_SPEAKERS, type Line } from '../../src/engine/clips';
import type { Speaker } from '../../src/game/service/controller';

/** The controller speaks each phrase in the voice PHRASE_SPEAKERS names (D141b). */
export function checkSpeaker(line: Line, who: Speaker | undefined): void {
  if (line.kind === 'phrase') expect(who ?? 'monster', line.key).toBe(PHRASE_SPEAKERS[line.key]);
  if (line.kind === 'ticket' || line.kind === 'monster') expect(who ?? 'monster').toBe('monster');
}
