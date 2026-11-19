import { useCallback, useEffect, useRef, useState } from 'react';
import { TapButton } from '../game/input/TapButton';
import { hashSeed, mulberry32 } from '../engine/rng';
import {
  freshGate,
  gateQuestion,
  GATE_MAX_DIGITS,
  isLockedOut,
  submitGate,
  type GateQuestion,
  type GateState,
} from '../engine/parentGate';
import { parentClock, setGateAnswer } from './runtime';

/**
 * Wrong answers and the lockout belong to the launch, not to one showing of the gate, so closing
 * and reopening it does not clear a lockout (D134). A relaunch does.
 */
let gate: GateState = freshGate();
let asked = 0;

function newQuestion(): GateQuestion {
  const q = gateQuestion(mulberry32(hashSeed(Date.now(), ++asked)));
  setGateAnswer(q.answer);
  return q;
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Parent gate (SPEC §12, D134): a multiplication answered on a number pad, never spoken. Three
 * wrong in a row lock it for 30 s; the lockout shows no countdown (a child may be the one
 * looking). Full screen and not rotated, outside the stage (SPEC §2.2). Also used as the second
 * prompt before a Replace import or a Reset (SPEC §11.6, §12).
 */
export function ParentGate({
  title,
  text,
  onPass,
  onCancel,
  cancelLabel = 'Back to the café',
  testId = 'parent-gate',
}: {
  title: string;
  text: string;
  onPass: () => void;
  onCancel: () => void;
  cancelLabel?: string;
  testId?: string;
}) {
  const [q, setQ] = useState<GateQuestion>(newQuestion);
  const [typed, setTyped] = useState('');
  const [note, setNote] = useState<'wrong' | null>(null);
  const [locked, setLocked] = useState(() => isLockedOut(gate, parentClock()));
  const passRef = useRef(onPass);
  useEffect(() => {
    passRef.current = onPass;
  }, [onPass]);
  useEffect(() => () => setGateAnswer(null), []);

  // The pad comes back by itself when the lockout ends.
  useEffect(() => {
    if (!locked) return;
    const id = window.setInterval(() => {
      if (!isLockedOut(gate, parentClock())) {
        setLocked(false);
        setNote(null);
        setQ(newQuestion());
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [locked]);

  const press = useCallback(
    (key: string) => {
      if (locked) return;
      if (key === 'back') {
        setTyped((t) => t.slice(0, -1));
        return;
      }
      if (key === 'ok') {
        if (!typed) return;
        const r = submitGate(gate, q, Number(typed), parentClock());
        gate = r.state;
        setTyped('');
        if (r.result === 'open') {
          setGateAnswer(null);
          passRef.current();
          return;
        }
        if (r.result === 'lockedOut') {
          setLocked(true);
          setNote(null);
          return;
        }
        // A new question after each miss, so guessing one product over and over gets nowhere.
        setNote('wrong');
        setQ(newQuestion());
        return;
      }
      setTyped((t) => (t.length >= GATE_MAX_DIGITS ? t : t + key));
    },
    [locked, q, typed],
  );

  // A keyboard works too (iPad with a keyboard, desktop).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('back');
      else if (e.key === 'Enter') press('ok');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  return (
    <div className="parent-gate" data-testid={testId} data-scroll-ok>
      <div className="gate-panel">
        <div className="gate-ask">
          <h1>{title}</h1>
          <p className="gate-text">{text}</p>
          {locked ? (
            <p className="gate-locked" data-testid="gate-locked" role="status">
              Too many tries. Please wait a little, then try again.
            </p>
          ) : (
            <>
              <p className="gate-question" data-testid="gate-question" aria-live="polite">
                {q.a} × {q.b} = ?
              </p>
              <p className="gate-typed" data-testid="gate-typed" aria-label="Your answer">
                {typed || ' '}
              </p>
              <p className="gate-note" data-testid="gate-note" role="status">
                {note === 'wrong' ? 'Not quite. Try this one.' : ' '}
              </p>
            </>
          )}
          <TapButton className="parent-back gate-cancel" testId="gate-cancel" onTap={onCancel}>
            {cancelLabel}
          </TapButton>
        </div>
        <div className={`gate-pad${locked ? ' gate-pad-off' : ''}`} data-testid="gate-pad" aria-disabled={locked}>
          {DIGITS.map((d) => (
            <TapButton key={d} className="gate-key" testId={`gate-key-${d}`} inert={locked} onTap={() => press(d)}>
              {d}
            </TapButton>
          ))}
          <TapButton className="gate-key" testId="gate-key-back" label="Delete" inert={locked} onTap={() => press('back')}>
            ⌫
          </TapButton>
          <TapButton className="gate-key" testId="gate-key-0" inert={locked} onTap={() => press('0')}>
            0
          </TapButton>
          <TapButton className="gate-key gate-ok" testId="gate-key-ok" inert={locked} onTap={() => press('ok')}>
            OK
          </TapButton>
        </div>
      </div>
    </div>
  );
}

