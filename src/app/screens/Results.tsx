import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { TapButton } from '../../game/input/TapButton';
import { Monster } from '../../art/monsters/Monster';
import { CoinJar, at } from '../../game/service/ServiceParts';
import { COUNTER, FRONT } from '../metrics';
import { hush, speakText } from '../../audio/speech';
import { sfx } from '../../audio/sfx';
import { phrase } from '../../engine/phrases';
import { tallySchedule } from '../../engine/tally';
import { getTimeScale } from '../runtime';

/** Let the CLOSED sign flip before the count starts. */
const SIGN_FLIP_MS = 700;
/** A beat after the last ting before the total is said, so speech doesn't clip it (iOS mutes WebAudio under speech). */
const SAY_TOTAL_MS = 400;
/**
 * After a skip, the buttons wait this long past the finger lifting, so a quick second tap (or the
 * rest of the skipping tap) can't land on a button that just appeared under it.
 */
const SKIP_REVEAL_MS = 300;

/**
 * Results / closing time (SPEC §5.7): the sign flips to CLOSED, the coin count ticks up by one
 * with a coin ting per step (slow, then faster up to a readable cap: engine/tally.ts), then the
 * total is said once and the buttons appear. A tap anywhere during the count skips to the total,
 * silently. The monsters served show as happy faces. No scores, streaks or nags.
 * Over the counter (D123): the café's sign flips to CLOSED, the jar keeps its spot, the tally sits
 * in the room above the served monsters standing along the counter's far edge, and the three
 * buttons are on the counter top.
 */
export function Results({
  coins,
  jar,
  monsters,
  onAnother,
  onChangeDish,
  onHome,
}: {
  coins: number;
  /** The coin jar's total, this service's coins included. */
  jar: number;
  monsters: string[];
  onAnother: () => void;
  onChangeDish: () => void;
  onHome: () => void;
}) {
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);
  const counting = useRef(true);
  const timers = useRef<number[]>([]);
  const skipPointer = useRef<number | null>(null);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms * getTimeScale()));
  };
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    counting.current = true;
    const schedule = tallySchedule(coins);
    const finish = () => {
      counting.current = false;
      setShown(coins);
      setDone(true);
      later(() => void speakText(phrase('results.total', { n: coins })), SAY_TOTAL_MS);
    };
    const tick = (i: number) => {
      const step = schedule[i];
      if (!step) return finish();
      setShown(step.n);
      sfx.coin();
      const next = schedule[i + 1];
      if (next) later(() => tick(i + 1), next.atMs - step.atMs);
      else finish();
    };
    later(() => {
      hush(); // nothing may speak over the tings (iOS mutes WebAudio while speech plays)
      tick(0);
    }, SIGN_FLIP_MS);
    return () => {
      clearTimers();
      hush();
    };
  }, [coins]);

  // Any tap during the count skips it: total at once, no speech; buttons after the finger lifts.
  const onPointerDown = (e: PointerEvent) => {
    if (!counting.current) return;
    counting.current = false;
    clearTimers();
    hush();
    setShown(coins);
    skipPointer.current = e.pointerId;
  };
  const onPointerEnd = (e: PointerEvent) => {
    if (skipPointer.current !== e.pointerId) return;
    skipPointer.current = null;
    later(() => setDone(true), SKIP_REVEAL_MS);
  };

  return (
    <div
      className="screen results"
      data-testid="screen-results"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <div className="closed-sign" style={at(FRONT.closed)} aria-label="Closed">
        CLOSED
      </div>
      <CoinJar rect={COUNTER.bar.jar} count={jar} testId="coin-jar" />
      <div
        className="results-tally"
        style={at(FRONT.tally)}
        data-testid="results-tally"
        data-total={coins}
        data-done={done}
      >
        <span className="coin-icon" aria-hidden="true" />
        <span className="coin-count" data-testid="results-count">
          {shown}
        </span>
      </div>
      <div className="results-faces" data-testid="results-faces">
        {monsters.map((m, i) => {
          const f = FRONT.faces;
          const step = Math.min(
            f.size + f.gap,
            (f.maxW - f.size) / Math.max(1, monsters.length - 1),
          );
          const x = Math.round((1280 - (f.size + step * (monsters.length - 1))) / 2 + i * step);
          return (
            <div
              key={i}
              className="results-face"
              data-monster={m}
              style={at({ x, y: f.y, w: f.size, h: f.size })}
            >
              <Monster id={m} expression="delight" size={f.size} />
            </div>
          );
        })}
      </div>
      {done && (
        <>
          <TapButton
            className="btn btn-primary front-btn results-another"
            style={at(FRONT.another)}
            testId="results-another"
            tapKind="button"
            onTap={onAnother}
          >
            Another service
          </TapButton>
          <TapButton
            className="btn btn-secondary front-btn results-change"
            style={at(FRONT.change)}
            testId="results-change"
            tapKind="button"
            onTap={onChangeDish}
          >
            Change dish
          </TapButton>
          <TapButton
            className="btn btn-secondary front-btn results-home"
            style={at(FRONT.home)}
            testId="results-home"
            tapKind="button"
            onTap={onHome}
          >
            Home
          </TapButton>
        </>
      )}
    </div>
  );
}
