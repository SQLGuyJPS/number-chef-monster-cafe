import { expect, test, type Page } from '@playwright/test';
import { startApp, watchNetwork } from './helpers';
import { openService, probe, serveCorrect, stubSpeechNeverEnds, waitPhase } from './service';

// M13 step 1 (PLAN §6.2 item 9, SPEC §8.4): recorded voices through the WAV test set of the e2e
// build (D141e, D146). Pip has 0–10 and a few lines; every monster has the warm-up cookie order and
// a greeting whose file runs far past its manifest length; the narrator has nothing.

interface Entry {
  text: string;
  voice: string;
  mode: 'recorded' | 'tts';
  clips: string[] | null;
  why?: string;
  missing?: string[];
  outcome?: string;
  starts?: number[];
}
type Line =
  | { kind: 'phrase'; key: string; params: Record<string, number | string> }
  | { kind: 'text'; text: string };

const voiceSay = (page: Page, line: Line, voice: string) =>
  page.evaluate(
    ([l, v]) =>
      (
        window.__ncmc as unknown as {
          voiceSay(l: Line, v: string): Promise<{ ms: number; entry: Entry }>;
        }
      ).voiceSay(l, v),
    [line, voice] as const,
  );
const voiceLog = (page: Page) =>
  page.evaluate(() => (window.__ncmc as unknown as { voiceLog(): Entry[] }).voiceLog());

test.beforeEach(({ page: _page }, info) => {
  test.skip(
    !/ipad-pro-11$|ipad-gen7$/.test(info.project.name),
    'voice checks run on the two iPads (PLAN §6.2)',
  );
});

test('a recorded line plays its clips in order, and a missing clip gives whole-line TTS', async ({
  page,
  baseURL,
}) => {
  const net = watchNetwork(page, new URL(baseURL!).origin);
  await stubSpeechNeverEnds(page);
  await startApp(page);

  const rec = await voiceSay(page, { kind: 'phrase', key: 'ct.more', params: { n: 3 } }, 'pip');
  expect(rec.entry.mode).toBe('recorded');
  expect(rec.entry.clips).toEqual(['num.3.lead', 'w.more']);
  expect(rec.entry.outcome).toBe('ended');
  expect(rec.entry.starts![0]).toBe(0);
  expect(rec.entry.starts![1]).toBeGreaterThan(0.2); // the second clip after the first (250 ms tones)
  expect(rec.ms).toBeLessThan(2000);

  const order = await voiceSay(
    page,
    { kind: 'phrase', key: 'order.add', params: { a: 7, b: 2, food: 'cookie' } },
    'zibbit',
  );
  expect(order.entry.mode).toBe('recorded');
  expect(order.entry.clips).toEqual(['num.7.lead', 'w.plus', 'num.2.mid', 'food.cookie.please']);
  expect(order.entry.starts).toEqual([...order.entry.starts!].sort((a, b) => a - b));
  expect(order.entry.outcome).toBe('ended');

  // Recorded lines never reach the speech engine.
  expect(await page.evaluate(() => window.__spoken)).not.toContain('Three more!');

  // The stubbed speech engine never ends a line: shorten its timeouts for the TTS lines below.
  await page.evaluate(() => window.__ncmc.setTimeScale(0.2));
  // Fifteen is not in the test set: the whole line goes to TTS, never half recorded (D139e).
  const tts = await voiceSay(page, { kind: 'phrase', key: 'ct.more', params: { n: 15 } }, 'pip');
  expect(tts.entry).toMatchObject({ mode: 'tts', why: 'missing', missing: ['num.15.lead'] });
  expect(await page.evaluate(() => window.__spoken)).toContain('Fifteen more!');
  // A food the set lacks, and the narrator with no clips at all.
  const food = await voiceSay(
    page,
    { kind: 'phrase', key: 'order.add', params: { a: 7, b: 2, food: 'taco' } },
    'zibbit',
  );
  expect(food.entry).toMatchObject({ mode: 'tts', missing: ['food.taco.please'] });
  const narr = await voiceSay(
    page,
    { kind: 'phrase', key: 'results.total', params: { n: 9 } },
    'narrator',
  );
  expect(narr.entry.mode).toBe('tts');
  // Text lines (the child's name, D139e) are never recorded.
  const named = await voiceSay(page, { kind: 'text', text: 'Hello, chef!' }, 'pip');
  expect(named.entry).toMatchObject({ mode: 'tts', why: 'never recorded' });

  expect(net.external).toEqual([]);
  expect(net.csp).toEqual([]);
});

test('a clip that never ends resolves on its timeout and is cut', async ({ page }) => {
  await stubSpeechNeverEnds(page);
  await startApp(page);
  // The file lasts 6 s; the manifest says 300 ms, so the line ends after 300 ms + the margin.
  const r = await voiceSay(page, { kind: 'phrase', key: 'follow.start', params: {} }, 'pip');
  expect(r.entry).toMatchObject({ mode: 'recorded', outcome: 'timeout' });
  expect(r.ms).toBeLessThan(2500);
});

test('a stuck recorded greeting does not block the service', async ({ page, baseURL }) => {
  const net = watchNetwork(page, new URL(baseURL!).origin);
  await openService(page, { skill: 'A1', stage: 3, seed: 7 });
  const first = await probe(page);
  // The greeting is a recorded clip that runs past its length (D146): it is cut, the order follows.
  await expect
    .poll(async () =>
      (await voiceLog(page)).find((e) => e.clips?.[0] === `mon.${first.monster}.arrive.0`),
    )
    .toMatchObject({ mode: 'recorded', voice: first.monster });
  await serveCorrect(page);
  await waitPhase(page, 'building');
  await expect.poll(async () => (await probe(page)).index).toBe(1);
  const log = await voiceLog(page);
  const greet = log.find((e) => e.clips?.[0] === `mon.${first.monster}.arrive.0`)!;
  expect(['timeout', 'cut']).toContain(greet.outcome);
  // Every line the service spoke so far settled: nothing is left playing.
  expect(log.slice(0, -2).every((e) => e.outcome !== undefined)).toBe(true);
  expect(net.external).toEqual([]);
});

test('a context whose clock stands still (iOS, D87) gives the line to TTS', async ({ page }) => {
  await stubSpeechNeverEnds(page);
  // The clock never moves: the line would be silent until its timeout.
  await page.addInitScript(() => {
    Object.defineProperty(BaseAudioContext.prototype, 'currentTime', { get: () => 0 });
  });
  await startApp(page);
  const r = await voiceSay(page, { kind: 'phrase', key: 'ct.more', params: { n: 3 } }, 'pip');
  expect(r.entry).toMatchObject({ mode: 'tts', why: 'stalled' });
  expect(await page.evaluate(() => window.__spoken)).toContain('Three more!');
});

test('clips are precached and play offline', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'offline playback is checked on Chromium (PLAN §6.2)');
  await stubSpeechNeverEnds(page);
  await page.goto('./');
  await page.waitForFunction(async () => {
    await navigator.serviceWorker.ready;
    return navigator.serviceWorker.controller !== null;
  });
  await context.setOffline(true);
  await startApp(page); // reloads from the service worker

  const r = await voiceSay(page, { kind: 'phrase', key: 'ct.left', params: { n: 8 } }, 'pip');
  expect(r.entry).toMatchObject({
    mode: 'recorded',
    clips: ['num.8.lead', 'w.left'],
    outcome: 'ended',
  });
  await context.setOffline(false);
});

test('the ?debug Voice test lists clips, marks unrecorded ones and plays recorded variants', async ({
  page,
}) => {
  await stubSpeechNeverEnds(page);
  await page.goto('./?debug');
  const vt = page.getByTestId('voice-test');
  await expect(vt).toBeVisible();
  await page.getByTestId('vt-voice').selectOption('pip');
  await expect(page.getByTestId('vt-have')).toHaveText(/\d+ clips recorded for this voice/);
  // "Seven plus two cookies, please!" stitched: Pip has no "plus" or food clip in the test set.
  await expect(page.getByTestId('vt-ref0-0')).toHaveText('Stitched (TTS)');
  await expect(
    vt.getByText(/not recorded: w\.plus, num\.2\.mid, food\.cookie\.please/).first(),
  ).toBeVisible();
  // "Two more!" as two clips is recorded for Pip; as a pair it is not.
  await expect(page.getByTestId('vt-pair0-1')).toHaveText('Two clips');
  await expect(page.getByTestId('vt-pair0-0')).toHaveText('Pair (TTS)');
  await page.getByTestId('vt-xfade').fill('30');
  await page.getByTestId('vt-pair0-1').click();
  await expect(page.getByTestId('vt-last')).toHaveText(/^recorded, ended: Two more!/);
});
