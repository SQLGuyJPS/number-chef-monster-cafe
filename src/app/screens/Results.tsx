import { useEffect, useState } from 'react';
import { TapButton } from '../../game/input/TapButton';
import { PlaceholderMonster } from '../../art/PlaceholderMonster';
import { countAloud, hush, speakText } from '../../audio/speech';
import { numberToWords } from '../../engine/numberWords';
import { phrase } from '../../engine/phrases';
import { tallySteps } from '../../engine/tally';
import { getTimeScale } from '../runtime';

/** Pace of the spoken tally: ones are quick, the fives get a little more room (SPEC §5.7). */
const STEP_MS = 420;
const FIVES_MS = 650;

/**
 * Results / closing time (SPEC §5.7): the sign flips to CLOSED, the coins count up aloud (ones to
 * ten, then fives, ending on the exact total, D55), the monsters served show as happy faces. No
 * scores, streaks or nags. Decorate arrives with the shop (M4).
 */
export function Results({
  coins,
  monsters,
  onAnother,
  onChangeDish,
  onHome,
}: {
  coins: number;
  monsters: string[];
  onAnother: () => void;
  onChangeDish: () => void;
  onHome: () => void;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const steps = tallySteps(coins);
    let live = true;
    let timer = 0;
    const tick = (i: number) => {
      if (!live) return;
      const n = steps[i];
      if (n === undefined) return;
      setShown(n);
      const last = i === steps.length - 1;
      if (last) void speakText(phrase('results.total', { n }));
      else countAloud(numberToWords(n));
      if (!last) timer = window.setTimeout(() => tick(i + 1), (n >= 10 ? FIVES_MS : STEP_MS) * getTimeScale());
    };
    // Let the sign flip before the count starts.
    timer = window.setTimeout(() => tick(0), 700 * getTimeScale());
    return () => {
      live = false;
      window.clearTimeout(timer);
      hush();
    };
  }, [coins]);

  return (
    <div className="screen results" data-testid="screen-results">
      <div className="closed-sign" aria-label="Closed">
        CLOSED
      </div>
      <div className="results-tally" data-testid="results-tally" data-total={coins}>
        <span className="coin-icon" aria-hidden="true" />
        <span className="coin-count" data-testid="results-count">
          {shown}
        </span>
      </div>
      <div className="results-faces" data-testid="results-faces">
        {monsters.map((m, i) => (
          <div key={i} className="results-face" data-monster={m}>
            <PlaceholderMonster size={88} />
          </div>
        ))}
      </div>
      <TapButton className="btn btn-primary results-another" testId="results-another" onTap={onAnother}>
        Another service
      </TapButton>
      <TapButton className="btn btn-secondary results-change" testId="results-change" onTap={onChangeDish}>
        Change dish
      </TapButton>
      <TapButton className="btn btn-secondary results-home" testId="results-home" onTap={onHome}>
        Home
      </TapButton>
    </div>
  );
}
