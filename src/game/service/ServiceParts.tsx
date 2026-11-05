import type { CSSProperties, ReactNode } from 'react';
import { FOODS, type FoodId } from '../../engine/foods';
import type { Rect } from '../../app/metrics';
import type { ItemRole } from '../tray/TenFrame';

export const at = (r: Rect): CSSProperties => ({ left: r.x, top: r.y, width: r.w, height: r.h });

export interface TicketToken {
  text: string;
  role?: ItemRole;
  /** The unknown: drawn as a dashed box so colour is never the only cue (SPEC §5.4). */
  blank?: boolean;
}

/** Paper receipt (SPEC §5.4): tokens coloured by their role on the tray, not by position (D30). */
export function Ticket({ rect, tokens, food }: { rect: Rect; tokens: TicketToken[]; food: FoodId }) {
  return (
    <div className="ticket" style={at(rect)} data-testid="ticket">
      <div className="ticket-food">{FOODS[food].glyph}</div>
      <div className="ticket-sentence">
        {tokens.map((t, i) => (
          <span
            key={i}
            className={[
              'tok',
              t.role ? `tok-${t.role}` : 'tok-op',
              t.blank ? 'tok-blank' : '',
            ].join(' ')}
          >
            {t.blank ? '' : t.text}
          </span>
        ))}
      </div>
    </div>
  );
}

function Btn({
  rect,
  className,
  children,
  testId,
}: {
  rect: Rect;
  className: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div className={`svc-btn ${className}`} style={at(rect)} data-tap="button" data-testid={testId}>
      {children}
    </div>
  );
}

export function Bell({ rect, pulsing }: { rect: Rect; pulsing?: boolean }) {
  return (
    <Btn rect={rect} className={`bell ${pulsing ? 'pulse' : ''}`} testId="bell">
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
        <ellipse cx="50" cy="86" rx="44" ry="9" fill="#8a5a35" />
        <path d="M14 80 Q14 34 50 30 Q86 34 86 80 Z" fill="#f6c445" stroke="#b88a16" strokeWidth="3" />
        <path d="M26 70 Q28 46 46 40" fill="none" stroke="#fff6c8" strokeWidth="6" strokeLinecap="round" />
        <rect x="44" y="18" width="12" height="14" rx="4" fill="#b88a16" />
        <circle cx="50" cy="16" r="7" fill="#f6c445" stroke="#b88a16" strokeWidth="3" />
      </svg>
    </Btn>
  );
}

/** The bin never empties (SPEC §3.3): a crate with a heap of the ordered food. */
export function Bin({ rect, food }: { rect: Rect; food: FoodId }) {
  const g = FOODS[food].glyph;
  return (
    <Btn rect={rect} className="bin" testId="bin">
      <div className="bin-heap">
        <span>{g}</span>
        <span>{g}</span>
        <span>{g}</span>
        <span>{g}</span>
        <span>{g}</span>
      </div>
      <div className="bin-crate" />
    </Btn>
  );
}

/** "Take one back" (SPEC §3.3, add mode): removes the last filled unlocked cell. */
export function TakeBack({ rect, food }: { rect: Rect; food: FoodId }) {
  return (
    <Btn rect={rect} className="take-back" testId="take-back">
      <span className="tb-food">{FOODS[food].glyph}</span>
      <svg className="tb-arrow" viewBox="0 0 60 40" aria-hidden="true">
        <path
          d="M52 8 Q52 30 26 30 L12 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path d="M18 18 L6 30 L18 40" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Btn>
  );
}

/** Pip's hat = Help (SPEC §7.3). */
export function PipHat({ rect, pulsing }: { rect: Rect; pulsing?: boolean }) {
  return (
    <Btn rect={rect} className={`pip-hat ${pulsing ? 'pulse' : ''}`} testId="help">
      <svg viewBox="0 0 120 110" width="100%" height="100%" aria-hidden="true">
        <path
          d="M30 52 Q10 50 14 32 Q18 14 38 20 Q44 4 60 6 Q78 4 82 20 Q102 14 106 32 Q110 50 90 52 L88 64 L32 64 Z"
          fill="#fff"
          stroke="#c9c2b4"
          strokeWidth="3"
        />
        <rect x="32" y="60" width="56" height="10" rx="3" fill="#e9e3d6" />
        <circle cx="34" cy="80" r="12" fill="#b9a7a0" />
        <circle cx="86" cy="80" r="12" fill="#b9a7a0" />
        <ellipse cx="60" cy="88" rx="24" ry="20" fill="#cdbdb6" />
        <circle cx="51" cy="84" r="3.5" fill="#2b2b3a" />
        <circle cx="69" cy="84" r="3.5" fill="#2b2b3a" />
        <circle cx="60" cy="94" r="4" fill="#ff8fa3" />
      </svg>
    </Btn>
  );
}

/** Door sign (leave, SPEC §5.4): small, top-left, never animates (SPEC §6.2 step 9). */
export function DoorSign({ rect }: { rect: Rect }) {
  return (
    <Btn rect={rect} className="door-sign" testId="door">
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
        <rect x="22" y="12" width="56" height="80" rx="6" fill="#8a5a35" />
        <rect x="30" y="20" width="40" height="64" rx="4" fill="#a8744a" />
        <circle cx="62" cy="54" r="5" fill="#f6c445" />
      </svg>
    </Btn>
  );
}

/** Waiting monsters peek from the left edge (SPEC §5.4): one silhouette per remaining order. */
export function Queue({ rect, count }: { rect: Rect; count: number }) {
  return (
    <div className="queue" style={at(rect)} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <svg
          key={i}
          className="queue-mon"
          viewBox="0 0 100 100"
          style={{ left: 8 + i * 62, zIndex: count - i }}
        >
          <path d="M14 98 C4 50 18 10 50 10 C82 10 96 50 86 98 Z" fill="#7b6f8f" opacity="0.55" />
          <circle cx="40" cy="44" r="7" fill="#fff" opacity="0.8" />
          <circle cx="62" cy="44" r="7" fill="#fff" opacity="0.8" />
        </svg>
      ))}
    </div>
  );
}

export function DigitButton({ rect, digit }: { rect: Rect; digit: number }) {
  return (
    <Btn rect={rect} className="digit" testId={`digit-${digit}`}>
      {digit}
    </Btn>
  );
}

/** One display that always takes up to two digits, so the slots never reveal the answer's size (D32). */
export function AnswerDisplay({ rect, value }: { rect: Rect; value: string }) {
  return (
    <div className="answer-display" style={at(rect)} data-testid="answer-display">
      <span>{value}</span>
      <span className="caret" />
    </div>
  );
}

export function Backspace({ rect }: { rect: Rect }) {
  return (
    <Btn rect={rect} className="backspace" testId="backspace">
      <svg viewBox="0 0 100 70" width="70%" aria-hidden="true">
        <path d="M30 6 L92 6 L92 64 L30 64 L6 35 Z" fill="none" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" />
        <path d="M46 22 L72 48 M72 22 L46 48" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      </svg>
    </Btn>
  );
}

function ClocheSvg() {
  return (
    <svg viewBox="0 0 100 80" width="100%" height="100%" aria-hidden="true">
      <path d="M8 66 Q8 18 50 16 Q92 18 92 66 Z" fill="#d7dde6" stroke="#8b95a5" strokeWidth="3" />
      <path d="M22 56 Q24 32 44 26" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      <circle cx="50" cy="12" r="7" fill="#8b95a5" />
      <rect x="2" y="64" width="96" height="8" rx="4" fill="#8b95a5" />
    </svg>
  );
}

/** Peek (SPEC §5.4): lifts the cloche to show the S3 model; counts as Help (D41). */
export function PeekButton({ rect }: { rect: Rect }) {
  return (
    <Btn rect={rect} className="peek" testId="peek">
      <ClocheSvg />
    </Btn>
  );
}

/** The lifted lid; tapping it lowers the cloche and brings the digit row back (D62). */
export function ClocheLid({ rect }: { rect: Rect }) {
  return (
    <Btn rect={rect} className="cloche-lid" testId="cloche-lid">
      <ClocheSvg />
      <span className="lid-badge">123</span>
    </Btn>
  );
}
