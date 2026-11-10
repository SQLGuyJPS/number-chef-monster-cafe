import { describe, expect, it } from 'vitest';
import { EAT_BUDGET_MS, eatReactMs } from '../../src/engine/eat';

describe('eat sequence (SPEC §5.6, D101)', () => {
  it('eat + react stays within 4 s for every tray answer 1–20', () => {
    for (let n = 1; n <= 20; n++) expect(eatReactMs(n)).toBeLessThanOrEqual(EAT_BUDGET_MS);
  });
});
