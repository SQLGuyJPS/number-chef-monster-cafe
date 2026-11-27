import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../../src/app/deviceSettings';
import { buildService } from '../../src/engine/session';
import { REGULARS } from '../../src/engine/monsters';

// SPEC §8.2, §8.3, §12 (D135): per-device settings with defaults; a bad row falls back.
describe('device settings', () => {
  it('defaults: 6 orders, rate 0.85, volumes 0.8 / 0.7 / 1.0, motion follows the device', () => {
    expect(sanitizeSettings({})).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS).toMatchObject({
      ordersPerService: 6,
      speechRate: 0.85,
      masterVolume: 0.8,
      sfxVolume: 0.7,
      voiceVolume: 1,
      reducedMotion: false,
      voiceURI: null,
    });
  });

  it('keeps valid values and drops bad ones one by one', () => {
    const s = sanitizeSettings({ ordersPerService: 8, speechRate: 3, masterVolume: 0.5, voiceURI: 7, basketSide: 'left' });
    expect(s.ordersPerService).toBe(8);
    expect(s.speechRate).toBe(0.85);
    expect(s.masterVolume).toBe(0.5);
    expect(s.voiceURI).toBeNull();
    expect(sanitizeSettings({ ordersPerService: 5 }).ordersPerService).toBe(6);
  });

  it.each([4, 6, 8])('a service plans %i orders', (n) => {
    for (const skill of ['A1', 'A2', 'A3'] as const) {
      const plan = buildService({
        seed: 11,
        skill,
        ops: 'both',
        stage: 1,
        orders: n,
        boxes: new Map(),
        seen: new Set(),
        monsters: REGULARS,
      });
      expect(plan.orders).toHaveLength(n);
    }
  });
});
