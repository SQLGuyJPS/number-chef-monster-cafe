import { describe, expect, it } from 'vitest';
import { STAGE_H, STAGE_W } from '../../src/app/metrics';
import {
  ZERO_INSETS,
  computeStageLayout,
  containerTransform,
  remapInsets,
} from '../../src/app/stageLayout';

const vp = (width: number, height: number, insets = ZERO_INSETS, allowRotate = true) => ({
  width,
  height,
  insets,
  allowRotate,
});

describe('computeStageLayout', () => {
  it('landscape is not rotated and fits the stage by the tighter axis', () => {
    const l = computeStageLayout(vp(1194, 834));
    expect(l.rotated).toBe(false);
    expect(l.containerW).toBe(1194);
    expect(l.containerH).toBe(834);
    expect(l.scale).toBeCloseTo(Math.min(1194 / STAGE_W, 834 / STAGE_H), 12);
    // Width-limited here: height has slack, so the safe box is centered vertically.
    expect(l.offsetX).toBeCloseTo(0, 9);
    expect(l.offsetY).toBeCloseTo((834 - STAGE_H * l.scale) / 2, 9);
    expect(l.offsetY).toBeGreaterThan(0);
  });

  it('height-limited landscape (844x390) centers horizontally', () => {
    const l = computeStageLayout(vp(844, 390));
    expect(l.scale).toBeCloseTo(390 / STAGE_H, 12);
    expect(l.offsetY).toBeCloseTo(0, 9);
    expect(l.offsetX).toBeCloseTo((844 - STAGE_W * l.scale) / 2, 9);
  });

  it('portrait rotates the stage and swaps the container axes (SPEC §2.2)', () => {
    const l = computeStageLayout(vp(834, 1194));
    expect(l.rotated).toBe(true);
    expect(l.containerW).toBe(1194);
    expect(l.containerH).toBe(834);
    expect(l.screenW).toBe(834);
    expect(l.screenH).toBe(1194);
    expect(l.scale).toBeCloseTo(Math.min(1194 / STAGE_W, 834 / STAGE_H), 12);
  });

  it('allowRotate=false keeps portrait unrotated', () => {
    const l = computeStageLayout(vp(834, 1194, ZERO_INSETS, false));
    expect(l.rotated).toBe(false);
    expect(l.containerW).toBe(834);
    expect(l.containerH).toBe(1194);
    expect(l.scale).toBeCloseTo(834 / STAGE_W, 12);
  });

  it('insets shrink the available area and offset the safe box', () => {
    const insets = { top: 20, right: 40, bottom: 10, left: 60 };
    const l = computeStageLayout(vp(1280, 720, insets));
    const availW = 1280 - 100;
    const availH = 720 - 30;
    expect(l.scale).toBeCloseTo(Math.min(availW / STAGE_W, availH / STAGE_H), 12);
    expect(l.offsetX).toBeGreaterThanOrEqual(insets.left);
    expect(l.offsetY).toBeGreaterThanOrEqual(insets.top);
    // The safe box stays inside the inset-reduced area.
    expect(l.offsetX + STAGE_W * l.scale).toBeLessThanOrEqual(1280 - insets.right + 1e-9);
    expect(l.offsetY + STAGE_H * l.scale).toBeLessThanOrEqual(720 - insets.bottom + 1e-9);
    // Centered within the available area.
    const slackX = availW - STAGE_W * l.scale;
    expect(l.offsetX).toBeCloseTo(insets.left + slackX / 2, 9);
  });

  it('never yields a non-positive scale even with absurd insets', () => {
    const l = computeStageLayout(vp(100, 100, { top: 90, right: 90, bottom: 90, left: 90 }));
    expect(l.scale).toBeGreaterThan(0);
  });
});

describe('remapInsets', () => {
  const screen = { top: 1, right: 2, bottom: 3, left: 4 };

  it('is the identity (a copy) in landscape', () => {
    const out = remapInsets(screen, false);
    expect(out).toEqual(screen);
    expect(out).not.toBe(screen);
  });

  it('rotated: stage top=screen right, left=screen top, bottom=screen left, right=screen bottom', () => {
    expect(remapInsets(screen, true)).toEqual({ top: 2, left: 1, bottom: 4, right: 3 });
  });

  it('computeStageLayout applies the remap when rotated', () => {
    const l = computeStageLayout(vp(834, 1194, screen));
    expect(l.insets).toEqual({ top: 2, left: 1, bottom: 4, right: 3 });
  });
});

describe('containerTransform', () => {
  it('is none in landscape', () => {
    expect(containerTransform(computeStageLayout(vp(1194, 834)))).toBe('none');
  });
  it('translates by the screen width then rotates 90deg in portrait', () => {
    expect(containerTransform(computeStageLayout(vp(834, 1194)))).toBe(
      'translateX(834px) rotate(90deg)',
    );
  });
});
