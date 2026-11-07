import type { CSSProperties } from 'react';
import { FOODS, type FoodId } from '../../engine/foods';
import { frameSize } from '../../app/metrics';

/** Role colour of an item, by its job on the tray (SPEC §5.4, D30): blue prefill, orange the child's group. */
export type ItemRole = 'prefill' | 'child' | 'result';

export interface CellView {
  food?: FoodId;
  role?: ItemRole;
  /** Running count popped above the item (S3 counting cue, SPEC §1.4). */
  pop?: number;
  /** Next cell FollowMe wants (SPEC §5.5). */
  pulse?: boolean;
  /** Demo highlight (SPEC §5.5). */
  glow?: boolean;
  /** One-shot animation; `nonce` changes to replay it. */
  fx?: 'shake' | 'in';
  nonce?: number;
}

interface Props {
  cells: readonly CellView[]; // up to 10, reading order
  /** Spread on the frame element (tray-level tap/drag, resolved to a cell by stage coords). */
  handlers?: Record<string, unknown>;
  /** Index of this frame's first cell on the whole tray (frames2: the second frame starts at 10). */
  firstIndex?: number;
  cell: number;
  gap: number;
  pad: number;
  x: number;
  y: number;
  testId?: string;
  /** Small model frames (CountTogether) and the taken-away row are not tap targets per cell. */
  tapTargets?: boolean;
  className?: string;
}

/**
 * One ten-frame: 2 × 5, top row tinted A and bottom row tinted B (the "five wall", SPEC §3.3).
 * Emoji are absolutely positioned HTML, never SVG text (SPEC §7.1).
 */
export function TenFrame({ cells, cell, gap, pad, x, y, testId, tapTargets, className, handlers, firstIndex = 0 }: Props) {
  const size = frameSize(cell, gap, pad);
  const frameStyle: CSSProperties = { left: x, top: y, width: size.w, height: size.h };
  return (
    <div className={`ten-frame ${className ?? ''}`} style={frameStyle} data-testid={firstIndex === 0 ? testId : undefined} {...handlers}>
      {Array.from({ length: 10 }, (_, i) => {
        const c = cells[i];
        const row = i < 5 ? 0 : 1;
        const col = i % 5;
        const style: CSSProperties = {
          left: pad + col * (cell + gap),
          top: pad + row * (cell + gap),
          width: cell,
          height: cell,
          fontSize: Math.round(cell * 0.68),
          borderRadius: Math.round(cell * 0.2),
        };
        const cls = [
          'tf-cell',
          row === 0 ? 'tint-a' : 'tint-b',
          c?.food ? `filled role-${c.role ?? 'child'}` : 'empty',
          c?.pulse ? 'pulse' : '',
          c?.glow ? 'glow' : '',
          c?.fx ? `fx-${c.fx}` : '',
        ].join(' ');
        return (
          <div
            key={`${i}-${c?.nonce ?? 0}`}
            className={cls}
            style={style}
            data-tap={tapTargets ? 'cell' : undefined}
            data-testid={testId ? `${testId}-cell-${firstIndex + i}` : undefined}
            data-filled={c?.food ? 'true' : undefined}
          >
            {c?.food && <span className="food">{FOODS[c.food].glyph}</span>}
            {c?.pop !== undefined && (
              <span className="pop" style={{ fontSize: Math.round(cell * 0.36) }}>
                {c.pop}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Builds a cell list: `prefill` blue items, then `child` orange items, the rest empty. */
export function cellsOf(
  food: FoodId,
  prefill: number,
  child: number,
  opts: { pops?: boolean; popFrom?: number } = {},
): CellView[] {
  const out: CellView[] = [];
  for (let i = 0; i < prefill + child; i++) {
    out.push({
      food,
      role: i < prefill ? 'prefill' : 'child',
      pop: opts.pops && i >= (opts.popFrom ?? 0) ? i + 1 : undefined,
    });
  }
  return out;
}
