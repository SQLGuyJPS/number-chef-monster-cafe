// SPEC §2.3: one active pointer at a time; palm-sized contacts ignored (best-effort: iOS reports
// no contact geometry, so the single-pointer rule is the real defence).

const PALM_PX = 80;
/**
 * Native form controls open the OS picker (iOS wheel, Android list), which swallows the finger's
 * pointerup/pointercancel. Claiming such a pointer left the guard holding a pointer that never
 * lifted, and every later tap anywhere in the app was blocked (playtest, D102). They are parent-
 * area controls, never on the play surface, so the guard leaves them alone.
 */
const NATIVE_CONTROL = 'select, option, input, textarea';

function onNativeControl(t: EventTarget | null): boolean {
  const el = t as { closest?: (s: string) => unknown } | null;
  return typeof el?.closest === 'function' && el.closest(NATIVE_CONTROL) !== null;
}

interface PointerLike extends Event {
  pointerId: number;
  pointerType?: string;
  width?: number;
  height?: number;
}

export interface PointerGuard {
  activePointerId(): number | null;
  lastInputAt(): number;
  reset(): void;
  dispose(): void;
}

export function installPointerGuard(
  target: EventTarget,
  now: () => number,
  onInput?: () => void,
): PointerGuard {
  let active: number | null = null;
  let last = now();

  const block = (e: Event) => {
    e.stopImmediatePropagation();
    if (e.cancelable) e.preventDefault();
  };

  const down = (ev: Event) => {
    const e = ev as PointerLike;
    last = now();
    onInput?.();
    if (onNativeControl(e.target)) return;
    const palm = e.pointerType === 'touch' && ((e.width ?? 0) > PALM_PX || (e.height ?? 0) > PALM_PX);
    if (palm || (active !== null && active !== e.pointerId)) {
      block(e);
      return;
    }
    active = e.pointerId;
  };
  const move = (ev: Event) => {
    const e = ev as PointerLike;
    if (active !== null && e.pointerId !== active) e.stopImmediatePropagation();
  };
  const up = (ev: Event) => {
    const e = ev as PointerLike;
    if (active !== null && e.pointerId !== active) {
      e.stopImmediatePropagation();
      return;
    }
    // Element handlers track their own pointer id, so clearing before they run is safe.
    active = null;
  };
  const reset = () => {
    active = null;
  };
  // Safety net for any other path that loses the lift: once no finger is on the glass, no touch
  // pointer can still be active. (A mouse or pen pointer is released by its own pointerup.)
  const touchEnd = (ev: Event) => {
    const touches = (ev as Event & { touches?: { length: number } }).touches;
    if (touches && touches.length === 0) active = null;
  };

  const opts = { capture: true } as const;
  target.addEventListener('pointerdown', down, opts);
  target.addEventListener('pointermove', move, opts);
  target.addEventListener('pointerup', up, opts);
  target.addEventListener('pointercancel', up, opts);
  target.addEventListener('blur', reset);
  target.addEventListener('change', reset, opts);
  target.addEventListener('touchend', touchEnd, opts);
  target.addEventListener('touchcancel', touchEnd, opts);

  return {
    activePointerId: () => active,
    lastInputAt: () => last,
    reset,
    dispose() {
      target.removeEventListener('pointerdown', down, opts);
      target.removeEventListener('pointermove', move, opts);
      target.removeEventListener('pointerup', up, opts);
      target.removeEventListener('pointercancel', up, opts);
      target.removeEventListener('blur', reset);
      target.removeEventListener('change', reset, opts);
      target.removeEventListener('touchend', touchEnd, opts);
      target.removeEventListener('touchcancel', touchEnd, opts);
    },
  };
}
