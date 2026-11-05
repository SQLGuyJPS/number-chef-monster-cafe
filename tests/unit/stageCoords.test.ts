import { describe, expect, it } from 'vitest';
import { STAGE_H, STAGE_W } from '../../src/app/metrics';
import { computeStageLayout, stageToScreen, type Insets } from '../../src/app/stageLayout';
import { eventToStage, toStageCoords } from '../../src/game/input/stageCoords';

const VIEWPORTS: Array<[number, number]> = [
  [1194, 834],
  [834, 1194],
  [844, 390],
  [390, 844],
  [1280, 720],
  [667, 375],
];
const INSETS: Insets[] = [
  { top: 0, right: 0, bottom: 0, left: 0 },
  { top: 20, right: 47, bottom: 21, left: 47 },
  { top: 47, right: 0, bottom: 34, left: 0 },
];
const NO_INSETS = INSETS[0]!;

describe('toStageCoords', () => {
  for (const [w, h] of VIEWPORTS) {
    for (const [i, insets] of INSETS.entries()) {
      it(`inverts stageToScreen at ${w}x${h}, insets #${i}`, () => {
        const layout = computeStageLayout({ width: w, height: h, insets, allowRotate: true });
        for (let ix = 0; ix <= 8; ix++) {
          for (let iy = 0; iy <= 6; iy++) {
            const sx = (STAGE_W * ix) / 8;
            const sy = (STAGE_H * iy) / 6;
            const p = stageToScreen(sx, sy, layout);
            const back = toStageCoords(p.x, p.y, layout);
            expect(Math.abs(back.x - sx)).toBeLessThan(1e-9);
            expect(Math.abs(back.y - sy)).toBeLessThan(1e-9);
          }
        }
      });
    }
  }

  it('round trips with rotation disabled in portrait', () => {
    const layout = computeStageLayout({
      width: 390,
      height: 844,
      insets: { top: 10, right: 0, bottom: 0, left: 0 },
      allowRotate: false,
    });
    const p = stageToScreen(321.5, 123.25, layout);
    const b = toStageCoords(p.x, p.y, layout);
    expect(b.x).toBeCloseTo(321.5, 9);
    expect(b.y).toBeCloseTo(123.25, 9);
  });

  it('portrait orientation: stage top-left lands near the screen top-RIGHT (rotated 90deg cw)', () => {
    const layout = computeStageLayout({
      width: 390,
      height: 844,
      insets: NO_INSETS,
      allowRotate: true,
    });
    expect(layout.rotated).toBe(true);
    // Container is 844x390; scale = min(844/1280, 390/720) = 0.540625 (width-limited, offsetX = 0
    // within rounding). The box is centered on the container's vertical axis, which is screen X:
    // offsetY = (390 - 720*s) / 2.
    const s = Math.min(844 / STAGE_W, 390 / STAGE_H);
    const offY = (390 - STAGE_H * s) / 2;
    const tl = stageToScreen(0, 0, layout);
    expect(tl.x).toBeCloseTo(390 - offY, 9);
    expect(tl.y).toBeCloseTo((844 - STAGE_W * s) / 2, 9);
    expect(tl.x).toBeGreaterThan(390 / 2);
    expect(tl.y).toBeLessThan(844 / 2);
    // Stage top-right (1280, 0) → screen bottom-right; stage bottom-left (0, 720) → screen top-left.
    const tr = stageToScreen(STAGE_W, 0, layout);
    expect(tr.x).toBeGreaterThan(390 / 2);
    expect(tr.y).toBeGreaterThan(844 / 2);
    const bl = stageToScreen(0, STAGE_H, layout);
    expect(bl.x).toBeLessThan(390 / 2);
    expect(bl.y).toBeLessThan(844 / 2);
  });

  it('screen top-right corner maps near the stage origin in portrait', () => {
    const layout = computeStageLayout({
      width: 390,
      height: 844,
      insets: NO_INSETS,
      allowRotate: true,
    });
    const p = toStageCoords(390, 0, layout);
    expect(Math.abs(p.x)).toBeLessThan(STAGE_W * 0.15);
    expect(Math.abs(p.y)).toBeLessThan(STAGE_H * 0.15);
  });

  it('eventToStage reads clientX/clientY', () => {
    const layout = computeStageLayout({
      width: 1280,
      height: 720,
      insets: NO_INSETS,
      allowRotate: true,
    });
    expect(eventToStage({ clientX: 640, clientY: 360 }, layout)).toEqual({ x: 640, y: 360 });
  });
});
