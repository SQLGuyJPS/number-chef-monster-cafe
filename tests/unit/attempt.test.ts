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

  it('fixed: the first miss plays only PlateCount, then straight back to building (D89)', () => {
    expect(run(bad)).toMatchObject({ phase: 'plateCount', afterPlate: 'retry' });
    expect(run(bad, done)).toMatchObject({ phase: 'building', attempt: 2 });
    expect(run(bad, done, ok).outcome).toBe('fixed');
  });

  it('the second miss offers help; yes plays Worked → FollowMe → assisted (D89)', () => {
    expect(run(bad, done, bad)).toMatchObject({ phase: 'plateCount', afterPlate: 'offerHelp' });
    expect(run(bad, done, bad, done).phase).toBe('offerHelp');
    expect(run(bad, done, bad, done, help).phase).toBe('worked');
    expect(run(bad, done, bad, done, help, done).phase).toBe('followMe');
    // A wrong FollowMe serve is ignored (the UI only lets the correct one through).
    expect(run(bad, done, bad, done, help, done, bad).phase).toBe('followMe');
    expect(run(bad, done, bad, done, help, done, ok).outcome).toBe('assisted');
  });

  it('no to the offer goes back to building; right then is fixed, a third miss plays the demo unasked (D89)', () => {
    const no: AttemptEvent = { type: 'declineHelp' };
    expect(run(bad, done, bad, done, no).phase).toBe('building');
    expect(run(bad, done, bad, done, no, ok).outcome).toBe('fixed');
    expect(run(bad, done, bad, done, no, bad)).toMatchObject({ phase: 'plateCount', afterPlate: 'worked' });
    expect(run(bad, done, bad, done, no, bad, done).phase).toBe('worked');
    expect(run(bad, done, bad, done, no, bad, done, done, ok).outcome).toBe('assisted');
    // Declining outside the offer does nothing.
    const b = run(bad, done);
    expect(stepAttempt(b, no)).toBe(b);
  });

  it('the offer locks the tray and the bell until the child chooses', () => {
    const offer = run(bad, done, bad, done);
    expect(stepAttempt(offer, ok)).toBe(offer);
    expect(stepAttempt(offer, bad)).toBe(offer);
    expect(stepAttempt(offer, done)).toBe(offer);
  });

  it('Help at attempt 1 then a wrong serve goes straight to Worked (D29)', () => {
    const s = run(help, done, bad);
    expect(s).toMatchObject({ phase: 'plateCount', afterPlate: 'worked' });
    expect(run(help, done, bad, done).phase).toBe('worked');
    expect(run(help, done, bad, done, done, ok).outcome).toBe('assisted');
  });

  it('Help after the first miss plays Worked then FollowMe → assisted (no CountTogether, D89)', () => {
    expect(run(bad, done, help).phase).toBe('worked');
    expect(run(bad, done, help, done, ok).outcome).toBe('assisted');
  });

  it('Peek at S0 counts as Help (afterHint), never assisted, and plays no CountTogether (D41)', () => {
    expect(run({ type: 'peek' })).toMatchObject({ phase: 'building', attempt: 1 });
    expect(run({ type: 'peek' }, ok).outcome).toBe('afterHint');
    expect(run({ type: 'peek' }, bad, done, ok).outcome).toBe('fixed');
  });

  it('ignores Help and serves while input is locked', () => {
    const plate = run(bad);
    expect(stepAttempt(plate, help)).toBe(plate);
    expect(stepAttempt(plate, ok)).toBe(plate);
    const worked = run(bad, done, bad, done, help);
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
