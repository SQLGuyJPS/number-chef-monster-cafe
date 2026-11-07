// Problem state machine (SPEC §3.4, D29, D41, D89). Pure: the UI feeds it events and plays whatever
// phase it reports; the phase only advances when the UI says a scripted part is done.
import type { PhraseKey, PhraseParams } from './phrases';
import type { Stage } from './types';

export type Outcome = 'first' | 'afterHint' | 'fixed' | 'assisted';

export type Phase =
  | 'building'
  | 'plateCount' // the monster counts the served plate (input locked)
  | 'countTogether' // model bubble after Help before any serve; the tray stays editable (SPEC §5.5)
  | 'offerHelp' // after the second miss the monster asks "Want Pip to help?" (D89)
  | 'worked' // demo on the child's tray (input locked)
  | 'followMe' // the child repeats the steps; the bell pulses at the end
  | 'eating' // correct serve; outcome fixed
  | 'done';

export interface AttemptState {
  phase: Phase;
  /**
   * 1 or 2 (SPEC §3.4). Help at attempt 1 advances to 2 (D29), and so does the first miss (D89):
   * from attempt 2 on, Help plays Worked → FollowMe.
   */
  attempt: 1 | 2;
  wrongServes: number;
  /** Help pressed (or Peek at S0) before the first serve. */
  helpedBeforeFirstServe: boolean;
  /** Worked + FollowMe ran. */
  demoed: boolean;
  /** What PlateCount leads to: straight back to building, the help offer, or the demo (D89). */
  afterPlate: 'retry' | 'offerHelp' | 'worked' | null;
  outcome: Outcome | null;
}

export type AttemptEvent =
  | { type: 'serve'; correct: boolean }
  /** Pip's hat, or "yes" to the help offer. */
  | { type: 'help' }
  /** "No" to the help offer: the monster repeats the order and the child tries again (D89). */
  | { type: 'declineHelp' }
  /** S0 Peek: counts as Help for the outcome, never as `assisted` (D41); it plays no CountTogether. */
  | { type: 'peek' }
  /** The UI finished the current scripted phase (PlateCount line, CountTogether count, demo, eating). */
  | { type: 'phaseDone' };

export const initialAttempt = (): AttemptState => ({
  phase: 'building',
  attempt: 1,
  wrongServes: 0,
  helpedBeforeFirstServe: false,
  demoed: false,
  afterPlate: null,
  outcome: null,
});

/** Can the child act on the tray / number pad in this phase? */
export const trayEditable = (p: Phase): boolean =>
  p === 'building' || p === 'countTogether' || p === 'followMe';

function classify(s: AttemptState): Outcome {
  if (s.demoed) return 'assisted';
  if (s.wrongServes > 0) return 'fixed';
  return s.helpedBeforeFirstServe ? 'afterHint' : 'first';
}

/**
 * Where a wrong serve leads (D89). The PlateCount line already names the wanted number, which is
 * usually enough, so the first miss goes straight back to building. The second miss offers help;
 * the third plays the demo without asking, because the children who most need help are often the
 * ones who turn it down. A miss after Help-before-serving already saw the model, so it goes
 * straight to the demo as before (D29).
 */
function afterMiss(s: AttemptState): 'retry' | 'offerHelp' | 'worked' {
  if (s.wrongServes === 0) return s.attempt === 1 ? 'retry' : 'worked';
  return s.wrongServes === 1 ? 'offerHelp' : 'worked';
}

export function stepAttempt(s: AttemptState, e: AttemptEvent): AttemptState {
  switch (e.type) {
    case 'serve': {
      // A serve during CountTogether ends the bubble and is evaluated like any other.
      if (s.phase !== 'building' && s.phase !== 'countTogether' && s.phase !== 'followMe') return s;
      if (e.correct) return { ...s, phase: 'eating', outcome: classify(s) };
      if (s.phase === 'followMe') return s; // the UI only lets a correct FollowMe serve through
      return { ...s, wrongServes: s.wrongServes + 1, phase: 'plateCount', afterPlate: afterMiss(s) };
    }
    case 'help': {
      if (s.phase === 'offerHelp') return { ...s, phase: 'worked' };
      if (s.phase !== 'building' && s.phase !== 'countTogether') return s;
      const before = s.wrongServes === 0;
      if (s.attempt === 1) {
        return {
          ...s,
          attempt: 2,
          phase: 'countTogether',
          helpedBeforeFirstServe: s.helpedBeforeFirstServe || before,
        };
      }
      return { ...s, phase: 'worked', helpedBeforeFirstServe: s.helpedBeforeFirstServe || before };
    }
    case 'declineHelp':
      return s.phase === 'offerHelp' ? { ...s, phase: 'building' } : s;
    case 'peek':
      if (s.phase !== 'building') return s;
      return { ...s, helpedBeforeFirstServe: s.helpedBeforeFirstServe || s.wrongServes === 0 };
    case 'phaseDone':
      switch (s.phase) {
        case 'plateCount':
          if (s.afterPlate === 'retry') return { ...s, phase: 'building', attempt: 2, afterPlate: null };
          if (s.afterPlate === 'offerHelp') return { ...s, phase: 'offerHelp', afterPlate: null };
          return { ...s, phase: 'worked', afterPlate: null };
        case 'countTogether':
          return { ...s, phase: 'building' };
        case 'worked':
          return { ...s, phase: 'followMe', demoed: true };
        case 'eating':
          return { ...s, phase: 'done' };
        default:
          return s;
      }
  }
}

/**
 * PlateCount line (SPEC §5.5, D30): compares the served tray total with the expected one. At S0
 * there is no plate, so the monster echoes the typed number.
 */
export function plateCountLine(
  served: number,
  expected: number,
  stage: Stage,
): { key: PhraseKey; params: PhraseParams } {
  const params = { seen: served, wanted: expected };
  if (stage === 0) return { key: 'plate.echo', params };
  if (served === expected - 1) return { key: 'plate.oneMore', params };
  if (served === expected + 1) return { key: 'plate.oneLess', params };
  return { key: 'plate.off', params };
}
