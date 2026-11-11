import { useEffect, useState } from 'react';

/**
 * True while `on`, and for `ms` after it turns false. Lets a part play its exit, or keeps something
 * hidden until a move has finished, without the controller knowing about animation times (D91).
 */
export function useHold(on: boolean, ms: number): boolean {
  const [held, setHeld] = useState(on);
  // Latch during render (React's "adjust state when a prop changes"), so there is no on→off flicker.
  if (on && !held) setHeld(true);
  useEffect(() => {
    if (on || !held) return;
    const t = window.setTimeout(() => setHeld(false), ms);
    return () => window.clearTimeout(t);
  }, [on, held, ms]);
  return on || held;
}

/** True for `ms` after `nonce` changes (never for the initial 0): plays a one-shot animation once. */
export function useBlip(nonce: number, ms: number): boolean {
  const [seen, setSeen] = useState(0);
  const active = nonce !== 0 && nonce !== seen;
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setSeen(nonce), ms);
    return () => window.clearTimeout(t);
  }, [active, nonce, ms]);
  return active;
}
