import { describe, expect, it } from 'vitest';
import {
  FULL_PLAN,
  formatReport,
  isSmooth,
  looksCappedAt30,
  rampVerdict,
  summarize,
  type StepResult,
} from '../../src/app/speedtest/speedStats';

const frames = (n: number, ms: number) => Array.from({ length: n }, () => ms);

function step(kind: StepResult['kind'], elements: number, deltas: number[]): StepResult {
  const f = summarize(deltas);
  return { ...f, kind, added: 0, elements, smooth: isSmooth(f) };
}

describe('speed test rules (D112)', () => {
  it('60 fps and 120 fps are smooth; 30 fps is not', () => {
    expect(isSmooth(summarize(frames(240, 16.7)))).toBe(true);
    expect(isSmooth(summarize(frames(480, 8.3)))).toBe(true);
    expect(isSmooth(summarize(frames(120, 33.3)))).toBe(false);
  });
  it('a few hitches are tolerated, more than 2% are not', () => {
    expect(isSmooth(summarize([...frames(196, 16.7), ...frames(4, 50)]))).toBe(true);
    expect(isSmooth(summarize([...frames(190, 16.7), ...frames(10, 50)]))).toBe(false);
  });
  it('no frames is never smooth', () => {
    expect(isSmooth(summarize([]))).toBe(false);
  });
  it('the full plan ramps upward and runs about 5 s a step', () => {
    expect(FULL_PLAN.steps).toEqual([...FULL_PLAN.steps].sort((a, b) => a - b));
    expect(FULL_PLAN.warmupMs + FULL_PLAN.measureMs).toBe(5000);
  });
  it('the budget is 60% of the last smooth count, rounded down to 50', () => {
    const r = [
      step('still', 600, frames(200, 16.7)),
      step('still', 1100, frames(200, 16.7)),
      step('still', 2100, frames(200, 40)),
    ];
    expect(rampVerdict('still', r)).toEqual({
      kind: 'still',
      lastSmooth: 1100,
      firstRough: 2100,
      budget: 650,
    });
  });
  it('no smooth step means no budget', () => {
    expect(rampVerdict('moving', [step('moving', 600, frames(100, 40))]).budget).toBeNull();
  });
  it('spots a 30 fps cap (Low Power Mode)', () => {
    expect(looksCappedAt30(summarize(frames(120, 33.3)))).toBe(true);
    expect(looksCappedAt30(summarize(frames(240, 16.7)))).toBe(false);
  });
  it('the report names both budgets and every step', () => {
    const r = [
      step('base', 180, frames(200, 16.7)),
      step('still', 700, frames(200, 16.7)),
      step('moving', 700, frames(200, 40)),
    ];
    const text = formatReport(r, {
      version: '1',
      date: '2026-11-12',
      userAgent: 'UA',
      viewport: '1080×810 @2x',
      standalone: true,
      reducedMotion: false,
      quick: false,
    });
    expect(text).toContain('Base scene: 180 elements');
    expect(text).toContain(
      'Still elements: smooth up to 700 (the most tested; no limit found). Suggested budget 400.',
    );
    expect(text).toContain('Moving elements: not smooth even at the first step.');
    expect(text.split('\n').filter((l) => / \| (yes|NO)$/.test(l))).toHaveLength(3);
  });
});
