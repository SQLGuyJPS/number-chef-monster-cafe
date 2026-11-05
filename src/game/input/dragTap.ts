import type { PointerEvent as ReactPointerEvent } from 'react';
import type { StageLayout } from '../../app/stageLayout';
import { eventToStage } from './stageCoords';

/** Movement (logical px) before a press becomes a drag. Below it, it is a tap. */
export const DRAG_THRESHOLD = 14;

export interface StagePoint {
  x: number;
  y: number;
}

export interface DragTapOptions {
  layout: () => StageLayout | null;
  /** A press that did not move: `p` is where the finger lifted (stage px). */
  onTap: (p: StagePoint, start: StagePoint) => void;
  /** Return false to refuse the drag (e.g. pressing an empty cell). */
  canDrag?: (start: StagePoint) => boolean;
  onDragMove?: (p: StagePoint | null) => void;
  onDrop?: (p: StagePoint, start: StagePoint) => void;
  /** Tap must lift inside the pressed element (no ghost taps, SPEC §2.3). */
  inside?: (p: StagePoint) => boolean;
}

/**
 * Tap-or-drag on one element (SPEC §3.3: tap the bin or drag from it). Coordinates come only from
 * toStageCoords, so it works in the rotated portrait stage too (SPEC §2.2). Touch pointers are
 * implicitly captured by the element pressed, so move/up arrive here.
 */
export function dragTapHandlers(o: DragTapOptions) {
  let id: number | null = null;
  let start: StagePoint | null = null;
  let dragging = false;

  const pt = (e: ReactPointerEvent): StagePoint | null => {
    const l = o.layout();
    return l ? eventToStage(e, l) : null;
  };
  const end = () => {
    if (dragging) o.onDragMove?.(null);
    id = null;
    start = null;
    dragging = false;
  };

  return {
    onPointerDown(e: ReactPointerEvent) {
      const p = pt(e);
      if (!p) return;
      id = e.pointerId;
      start = p;
      dragging = false;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic events */
      }
    },
    onPointerMove(e: ReactPointerEvent) {
      if (e.pointerId !== id || !start) return;
      const p = pt(e);
      if (!p) return;
      if (!dragging && Math.hypot(p.x - start.x, p.y - start.y) >= DRAG_THRESHOLD) {
        if (!o.onDrop || (o.canDrag && !o.canDrag(start))) return;
        dragging = true;
      }
      if (dragging) o.onDragMove?.(p);
    },
    onPointerUp(e: ReactPointerEvent) {
      if (e.pointerId !== id || !start) return;
      const p = pt(e);
      const s = start;
      const wasDrag = dragging;
      end();
      if (!p) return;
      if (wasDrag) o.onDrop?.(p, s);
      else if (!o.inside || o.inside(p)) o.onTap(p, s);
    },
    onPointerCancel() {
      end();
    },
  };
}

export const inRect = (p: StagePoint, r: { x: number; y: number; w: number; h: number }, pad = 0): boolean =>
  p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad;
