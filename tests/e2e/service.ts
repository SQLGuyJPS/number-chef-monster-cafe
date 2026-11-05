import { expect, type Page } from '@playwright/test';
import { tap } from './helpers';

/** What `window.__ncmc.service()` returns (src/game/service/controller.ts probe). */
export interface Probe {
  index: number;
  phase: string;
  attempt: number;
  stage: number;
  form: string;
  display: string;
  answer: number;
  mode: 'add' | 'remove';
  filled: number;
  prefill: number;
  expectedCells: number;
  removed: number;
  typed: string;
  cloche: string;
  s0Typing: boolean;
  counting: boolean;
  canServe: boolean;
  cue: string | null;
  caption: string;
  events: { k: string; outcome?: string; stage?: number; fact?: string }[];
}

interface Hooks {
  setTimeScale(s: number): void;
  setSeed(s: number | null): void;
  setSkillConfig(skill: string, stage: number, ops: string): Promise<void>;
  service(): Probe | undefined;
}
declare global {
  interface Window {
    __ncmc: Hooks;
    __phases: string[];
  }
}

/**
 * SPEC §8.1 / M1 acceptance: `speechSynthesis` stubbed so `end` never fires. The game must
 * still flow, because every speak() resolves on its timeout.
 */
export async function stubSpeechNeverEnds(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const spoken: string[] = [];
    const stub = {
      speaking: false,
      pending: false,
      paused: false,
      speak: (u: { text: string }) => void spoken.push(u.text),
      cancel: () => undefined,
      pause: () => undefined,
      resume: () => undefined,
      getVoices: () => [],
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    };
    Object.defineProperty(window, 'speechSynthesis', { value: stub, configurable: true });
    (window as unknown as { __spoken: string[] }).__spoken = spoken;
  });
}

export interface OpenOptions {
  skill?: 'A1' | 'A2';
  stage?: 0 | 1 | 2 | 3;
  ops?: 'both' | 'add' | 'sub';
  seed?: number;
  /** Scales speech timeouts and scripted holds; 1 = real time. */
  timeScale?: number;
}

/** Splash → Home → Menu → tile, with stage/ops set through the e2e hook (same store as ?debug). */
export async function openService(page: Page, o: OpenOptions = {}): Promise<void> {
  await stubSpeechNeverEnds(page);
  await page.goto('./');
  await page.waitForFunction(() => !!window.__ncmc);
  await page.evaluate(
    async ({ skill, stage, ops, seed, timeScale }) => {
      await window.__ncmc.setSkillConfig(skill, stage, ops);
      window.__ncmc.setTimeScale(timeScale);
      window.__ncmc.setSeed(seed);
      // Phase recorder: every phase the service passes through, in order.
      window.__phases = [];
      setInterval(() => {
        const p = window.__ncmc.service()?.phase;
        if (p && window.__phases.at(-1) !== p) window.__phases.push(p);
      }, 10);
    },
    { skill: o.skill ?? 'A1', stage: o.stage ?? 3, ops: o.ops ?? 'both', seed: o.seed ?? 1, timeScale: o.timeScale ?? 0.1 },
  );
  await tap(page, page.getByTestId('splash'));
  await tap(page, page.getByTestId('open-cafe'));
  await expect(page.getByTestId('screen-menu')).toBeVisible();
  // The menu reads the stored config on open; give it a beat before the tile tap.
  await page.waitForTimeout(150);
  await tap(page, page.getByTestId(`tile-${o.skill ?? 'A1'}`));
  await expect(page.getByTestId('screen-service')).toBeVisible();
  await waitPhase(page, 'building');
}

export const probe = (page: Page): Promise<Probe> => page.evaluate(() => window.__ncmc.service()!);
export const phases = (page: Page): Promise<string[]> => page.evaluate(() => window.__phases);

export async function waitPhase(page: Page, phase: string, timeout = 20_000): Promise<void> {
  await page.waitForFunction((p) => window.__ncmc.service()?.phase === p, phase, { timeout });
}

export const tapId = (page: Page, id: string) => tap(page, page.getByTestId(id));

/** Brings the tray to `target` cells the way a child would: bin taps or tapping an item. */
export async function trayTo(page: Page, target: number): Promise<void> {
  for (let i = 0; i < 25; i++) {
    const s = await probe(page);
    if (s.filled === target) return;
    if (s.filled < target) await tapId(page, 'bin');
    else if (s.mode === 'remove') await tapId(page, 'tray-cell-0');
    else await tapId(page, 'take-back');
  }
  throw new Error(`tray did not reach ${target}`);
}

/** A tray value that is wrong but not the start state (the bell is disabled there). */
export function wrongTarget(s: Probe): number {
  const e = s.expectedCells;
  const candidates = [e - 1, e + 1, e - 2, e + 2].filter((t) => t >= 0 && t <= 10 && t !== s.prefill && t !== e);
  if (s.mode === 'add') return candidates.find((t) => t >= s.prefill)!;
  return candidates.find((t) => t <= s.prefill)!;
}

/** Bell presses are 400 ms apart at least (double-press guard). */
export async function ringBell(page: Page): Promise<void> {
  await page.waitForTimeout(420);
  await tapId(page, 'bell');
}

export async function typeNumber(page: Page, n: number): Promise<void> {
  for (const d of String(n)) await tapId(page, `digit-${d}`);
}

export async function serveCorrect(page: Page): Promise<void> {
  const s = await probe(page);
  if (s.stage === 0 && s.cloche === 'down') await typeNumber(page, s.answer);
  else await trayTo(page, s.expectedCells);
  await ringBell(page);
}

export async function serveWrong(page: Page): Promise<void> {
  const s = await probe(page);
  if (s.stage === 0 && s.cloche === 'down') await typeNumber(page, s.answer === 1 ? 2 : s.answer - 1);
  else await trayTo(page, wrongTarget(s));
  await ringBell(page);
}

/** FollowMe: do whatever is pulsing until the bell lights (SPEC §5.5). */
export async function followMe(page: Page): Promise<void> {
  for (let i = 0; i < 25; i++) {
    const s = await probe(page);
    if (s.s0Typing) {
      if (!s.canServe) await typeNumber(page, s.answer);
      return;
    }
    if (s.cue === 'bell') return;
    if (s.cue === 'place' || s.cue === 'putBack') await tapId(page, 'bin');
    else if (s.cue === 'remove') await tapId(page, `tray-cell-${s.filled - 1}`);
    else if (s.cue === 'takeBack') await tapId(page, 'take-back');
    else await page.waitForTimeout(50);
  }
}
