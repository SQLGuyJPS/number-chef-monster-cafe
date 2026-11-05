import { describe, expect, it } from 'vitest';
import {
  HOME_IDLE_ACTIVATE_MS,
  shouldActivateWaitingWorker,
  type ScreenId,
} from '../../src/app/pwaPolicy';

describe('shouldActivateWaitingWorker (D12, D54)', () => {
  it('threshold is 30 s', () => {
    expect(HOME_IDLE_ACTIVATE_MS).toBe(30_000);
  });

  it('always activates on the splash (cold launch)', () => {
    expect(shouldActivateWaitingWorker('splash', 0)).toBe(true);
    expect(shouldActivateWaitingWorker('splash', 1e9)).toBe(true);
  });

  it('activates on home only after at least 30 s idle', () => {
    expect(shouldActivateWaitingWorker('home', 0)).toBe(false);
    expect(shouldActivateWaitingWorker('home', 29_999)).toBe(false);
    expect(shouldActivateWaitingWorker('home', 30_000)).toBe(true);
    expect(shouldActivateWaitingWorker('home', 120_000)).toBe(true);
  });

  it.each(['menu', 'service', 'results', 'shop', 'parent'] as ScreenId[])(
    'never activates on %s, however idle',
    (screen) => {
      expect(shouldActivateWaitingWorker(screen, 0)).toBe(false);
      expect(shouldActivateWaitingWorker(screen, 10 * 60_000)).toBe(false);
    },
  );
});
