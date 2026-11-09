import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  onHold: () => void;
  holdMs: number;
  children: ReactNode;
  className?: string;
  label?: string;
  testId?: string;
}

/**
 * Fires once the finger has stayed on the element for `holdMs` (SPEC §5.2: the grown-ups' gear).
 * A short tap does nothing, so a child poking the corner never opens it. Lifting, cancelling or
 * sliding off the element cancels. Touch pointers are implicitly captured by the down target, so
 * "slid off" is checked against the element's screen rect, which stays exact under the rotation.
 */
export function HoldButton({ onHold, holdMs, children, className, label, testId }: Props) {
  const timer = useRef<number | null>(null);
  const pointer = useRef<number | null>(null);

  const cancel = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    pointer.current = null;
  };
  useEffect(() => cancel, []);

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      data-testid={testId}
      onPointerDown={(e) => {
        cancel();
        pointer.current = e.pointerId;
        timer.current = window.setTimeout(() => {
          timer.current = null;
          pointer.current = null;
          onHold();
        }, holdMs);
      }}
      onPointerMove={(e) => {
        if (pointer.current !== e.pointerId) return;
        const r = e.currentTarget.getBoundingClientRect();
        const inside =
          e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (!inside) cancel();
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onClick={(e) => {
        // detail 0 = keyboard activation (a grown-up with a keyboard); no child path reaches it.
        if (e.detail === 0) onHold();
      }}
    >
      {children}
    </button>
  );
}
