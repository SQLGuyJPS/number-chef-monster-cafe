// SPEC §2.3: one active pointer at a time; palm-sized contacts ignored (best-effort: iOS reports
// no contact geometry, so the single-pointer rule is the real defence).

const PALM_PX = 80;

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

  const opts = { capture: true } as const;
  target.addEventListener('pointerdown', down, opts);
  target.addEventListener('pointermove', move, opts);
  target.addEventListener('pointerup', up, opts);
  target.addEventListener('pointercancel', up, opts);
  target.addEventListener('blur', reset);

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
    },
  };
}
