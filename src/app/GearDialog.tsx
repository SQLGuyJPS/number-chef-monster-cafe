import { useEffect, useRef } from 'react';
import { TapButton } from '../game/input/TapButton';
import { pointerNear } from '../game/input/near';
import { GEAR_HOLD, GEAR_LONG_PRESS_MS } from './metrics';

const { svg: SVG, circle: CIRCLE, ringR: RING_R, ringW: RING_W } = GEAR_HOLD;
const C = 2 * Math.PI * RING_R;
/** CSS px the finger may drift past the circle before the hold gives up (fingers wobble). */
const SLOP_PX = 48;

/**
 * "For grown-ups" popup behind the Home gear (SPEC §5.2, D95). A tap on the gear only opens this;
 * the settings open after a 2 s hold on the circle, while a ring fills clockwise from the top so
 * the grown-up can see the hold is working. The ring is driven per frame rather than by a CSS
 * animation, so reduced motion (which stops CSS animations) never hides the feedback.
 */
export function GearDialog({ onOpen, onClose }: { onOpen: () => void; onClose: () => void }) {
  const ring = useRef<SVGCircleElement>(null);
  const pad = useRef<HTMLDivElement>(null);
  const hold = useRef<{ pointer: number; start: number; frame: number } | null>(null);
  const done = useRef(onOpen);
  useEffect(() => {
    done.current = onOpen;
  }, [onOpen]);

  const draw = (p: number) => {
    if (ring.current) ring.current.style.strokeDashoffset = String(C * (1 - p));
  };

  const stop = () => {
    if (hold.current) cancelAnimationFrame(hold.current.frame);
    hold.current = null;
    pad.current?.classList.remove('holding');
    draw(0);
  };

  useEffect(() => {
    // iOS starts its own long-press handling (callout, magnifier) on a still finger and may
    // cancel the pointer; refusing the touch keeps the pointer stream alive for the whole hold.
    const el = pad.current;
    if (!el) return;
    const block = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
    };
    el.addEventListener('touchstart', block, { passive: false });
    return () => {
      el.removeEventListener('touchstart', block);
      if (hold.current) cancelAnimationFrame(hold.current.frame);
    };
  }, []);

  const tick = (now: number) => {
    const h = hold.current;
    if (!h) return;
    const p = Math.min(1, (now - h.start) / GEAR_LONG_PRESS_MS);
    draw(p);
    if (p >= 1) {
      hold.current = null;
      done.current();
      return;
    }
    h.frame = requestAnimationFrame(tick);
  };

  return (
    <div
      className="dialog-scrim"
      data-testid="gear-dialog"
      role="dialog"
      aria-modal="true"
      onPointerUp={(e) => {
        // A tap on the dimmed café around the popup closes it.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog gear-dialog">
        <div className="gear-dialog-title">For grown-ups</div>
        <p className="gear-dialog-text">
          Press and hold the circle for two seconds to open the settings.
        </p>
        <div
          ref={pad}
          className="gear-hold"
          data-testid="gear-hold"
          style={{ width: SVG, height: SVG }}
          onPointerDown={(e) => {
            if (hold.current) return;
            pad.current?.classList.add('holding');
            hold.current = { pointer: e.pointerId, start: performance.now(), frame: 0 };
            hold.current.frame = requestAnimationFrame(tick);
          }}
          onPointerMove={(e) => {
            if (hold.current?.pointer !== e.pointerId) return;
            if (!pointerNear(e, e.currentTarget, SLOP_PX)) stop();
          }}
          onPointerUp={(e) => {
            if (hold.current?.pointer === e.pointerId) stop();
          }}
          onPointerCancel={(e) => {
            if (hold.current?.pointer === e.pointerId) stop();
          }}
        >
          <svg viewBox={`0 0 ${SVG} ${SVG}`} width={SVG} height={SVG} aria-hidden="true">
            <circle className="gear-hold-fill" cx={SVG / 2} cy={SVG / 2} r={CIRCLE / 2} />
            <circle
              ref={ring}
              className="gear-hold-ring"
              data-testid="gear-hold-ring"
              cx={SVG / 2}
              cy={SVG / 2}
              r={RING_R}
              strokeWidth={RING_W}
              strokeDasharray={C}
              strokeDashoffset={C}
              // SVG strokes run clockwise from three o'clock; turn back a quarter to start at the top.
              transform={`rotate(-90 ${SVG / 2} ${SVG / 2})`}
            />
          </svg>
        </div>
        <TapButton
          className="btn btn-secondary gear-dialog-close"
          testId="gear-close"
          onTap={onClose}
        >
          Close
        </TapButton>
      </div>
    </div>
  );
}
