import { useRef, type CSSProperties, type ReactNode } from 'react';

interface Props {
  onTap: () => void;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  label?: string;
  testId?: string;
  /** Rendered but taps do nothing (aria-disabled keeps events flowing for a later wobble). */
  inert?: boolean;
}

/**
 * Fires on pointerup only when pointerdown began on this element and the finger is still on it
 * (SPEC §2.3: no ghost clicks). Touch pointers are implicitly captured by the down target, so
 * the up position is checked against the element's screen rect, which stays an exact rectangle
 * under the 90° stage rotation.
 */
export function TapButton({ onTap, children, className, style, label, testId, inert }: Props) {
  const pointer = useRef<number | null>(null);

  return (
    <button
      type="button"
      className={className}
      style={style}
      aria-label={label}
      aria-disabled={inert || undefined}
      data-testid={testId}
      onPointerDown={(e) => {
        pointer.current = e.pointerId;
      }}
      onPointerUp={(e) => {
        if (pointer.current !== e.pointerId) return;
        pointer.current = null;
        const r = e.currentTarget.getBoundingClientRect();
        const inside =
          e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (inside && !inert) onTap();
      }}
      onPointerCancel={() => {
        pointer.current = null;
      }}
      onClick={(e) => {
        // detail 0 = keyboard activation; pointer activations were handled on pointerup.
        if (e.detail === 0 && !inert) onTap();
      }}
    >
      {children}
    </button>
  );
}
