import { describe, expect, it } from 'vitest';
import {
  initialAttempt,
  plateCountLine,
  stepAttempt,
  type AttemptEvent,
  type AttemptState,
} from '../../src/engine/attempt';

const run = (...events: AttemptEvent[]): AttemptState =>
  events.reduce(stepAttempt, initialAttempt());
const ok: AttemptEvent = { type: 'serve', correct: true };
const bad: AttemptEvent = { type: 'serve', correct: false };
const done: AttemptEvent = { type: 'phaseDone' };
const help: AttemptEvent = { type: 'help' };

describe('attempt state machine (SPEC §3.4)', () => {
  it('first: correct on the first serve, no Help', () => {
    expect(run(ok)).toMatchObject({ phase: 'eating', outcome: 'first' });
    expect(run(ok, done).phase).toBe('done');
  });

  it('afterHint: Help before the first serve, then correct', () => {
    const s = run(help);
    expect(s).toMatchObject({ phase: 'countTogether', attempt: 2 });
    expect(run(help, done, ok).outcome).toBe('afterHint');
    // Serving straight out of CountTogether is evaluated too.
    expect(run(help, ok).outcome).toBe('afterHint');
  });

  it('fixed: wrong, PlateCount, CountTogether, then correct', () => {
    expect(run(bad)).toMatchObject({ phase: 'plateCount', afterPlate: 'countTogether' });
    expect(run(bad, done)).toMatchObject({ phase: 'countTogether', attempt: 2 });
    expect(run(bad, done, done, ok).outcome).toBe('fixed');
  });

  it('assisted: wrong → wrong → PlateCount → Worked → FollowMe → correct', () => {
    const s = run(bad, done, done, bad);
    expect(s).toMatchObject({ phase: 'plateCount', afterPlate: 'worked' });
    expect(run(bad, done, done, bad, done).phase).toBe('worked');
    expect(run(bad, done, done, bad, done, done).phase).toBe('followMe');
    // A wrong FollowMe serve is ignored (the UI only lets the correct one through).
    expect(run(bad, done, done, bad, done, done, bad).phase).toBe('followMe');
    expect(run(bad, done, done, bad, done, done, ok).outcome).toBe('assisted');
  });

  it('Help at attempt 1 then a wrong serve goes straight to Worked (D29)', () => {
    const s = run(help, done, bad);
    expect(s).toMatchObject({ phase: 'plateCount', afterPlate: 'worked' });
    expect(run(help, done, bad, done).phase).toBe('worked');
    expect(run(help, done, bad, done, done, ok).outcome).toBe('assisted');
  });

  it('Help at attempt 2 plays Worked then FollowMe → assisted', () => {
    expect(run(bad, done, done, help).phase).toBe('worked');
    expect(run(bad, done, done, help, done, ok).outcome).toBe('assisted');
  });

  it('Peek at S0 counts as Help (afterHint), never assisted, and plays no CountTogether (D41)', () => {
    expect(run({ type: 'peek' })).toMatchObject({ phase: 'building', attempt: 1 });
    expect(run({ type: 'peek' }, ok).outcome).toBe('afterHint');
    expect(run({ type: 'peek' }, bad, done, done, ok).outcome).toBe('fixed');
  });

  it('ignores Help and serves while input is locked', () => {
    const plate = run(bad);
    expect(stepAttempt(plate, help)).toBe(plate);
    expect(stepAttempt(plate, ok)).toBe(plate);
    const worked = run(bad, done, done, bad, done);
    expect(stepAttempt(worked, help)).toBe(worked);
    expect(stepAttempt(worked, ok)).toBe(worked);
  });
});

describe('plateCountLine (SPEC §5.5)', () => {
  it('picks one more / one less / plain / S0 echo', () => {
    expect(plateCountLine(7, 8, 3).key).toBe('plate.oneMore');
    expect(plateCountLine(9, 8, 2).key).toBe('plate.oneLess');
    expect(plateCountLine(5, 8, 1).key).toBe('plate.off');
    expect(plateCountLine(11, 8, 3).key).toBe('plate.off');
    expect(plateCountLine(7, 8, 0)).toEqual({ key: 'plate.echo', params: { seen: 7, wanted: 8 } });
  });
});
