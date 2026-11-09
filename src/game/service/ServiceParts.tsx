import type { CSSProperties, ReactNode } from 'react';
import { TapButton } from '../input/TapButton';
import { FOODS, type FoodId } from '../../engine/foods';
import type { Rect } from '../../app/metrics';
import { TenFrame, type CellView, type ItemRole } from '../tray/TenFrame';
import { PlaceholderPip } from '../../art/PlaceholderPip';
import { MODEL_FRAMES_GAP, MODEL_ONE, MODEL_TWO, frameSize } from '../../app/metrics';

export const at = (r: Rect): CSSProperties => ({ left: r.x, top: r.y, width: r.w, height: r.h });

export interface TicketToken {
  text: string;
  role?: ItemRole;
  /** The unknown: drawn as a dashed box so colour is never the only cue (SPEC §5.4). */
  blank?: boolean;
}

/** Paper receipt (SPEC §5.4): tokens coloured by their role on the tray, not by position (D30). */
/**
 * `solved`: after a correct serve the blank shows the answer in result green, so the child sees the
 * finished, true sentence at the moment of success (D96).
 */
export function Ticket({
  rect,
  tokens,
  food,
  solved,
  onTap,
}: {
  rect: Rect;
  tokens: TicketToken[];
  food: FoodId;
  solved?: number;
  onTap?: () => void;
}) {
  return (
    <TapButton
      className="ticket"
      style={at(rect)}
      testId="ticket"
      label="Hear the order"
      onTap={onTap ?? (() => undefined)}
    >
      <div className="ticket-food">{FOODS[food].glyph}</div>
      <div className="ticket-sentence">
        {tokens.map((t, i) =>
          t.blank && solved !== undefined ? (
            <span key={i} className="tok tok-solved" data-testid="ticket-answer">
              {solved}
            </span>
          ) : (
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
          ),
        )}
      </div>
    </TapButton>
  );
}

interface BtnProps {
  rect: Rect;
  className: string;
  children?: ReactNode;
  testId?: string;
  onTap?: () => void;
  label?: string;
  /** Rendered and tappable, but looks idle (the bell before anything is built wobbles instead). */
  dim?: boolean;
  pulsing?: boolean;
  /** Bumped to replay a one-shot wobble. */
  wobble?: number;
}

function Btn({ rect, className, children, testId, onTap, label, dim, pulsing, wobble }: BtnProps) {
  const cls = [
    'svc-btn',
    className,
    dim ? 'dim' : '',
    pulsing ? 'pulse' : '',
    wobble ? `wobble-${wobble % 2}` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <TapButton
      className={cls}
      style={at(rect)}
      tapKind="button"
      testId={testId}
      label={label}
      onTap={onTap ?? (() => undefined)}
    >
      {children}
    </TapButton>
  );
}

export type PartProps = Omit<BtnProps, 'className' | 'children' | 'testId'>;

export function Bell(props: PartProps) {
  return (
    <Btn {...props} className="bell" testId="bell" label="Serve">
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
        <ellipse cx="50" cy="86" rx="44" ry="9" fill="#8a5a35" />
        <path
          d="M14 80 Q14 34 50 30 Q86 34 86 80 Z"
          fill="#f6c445"
          stroke="#b88a16"
          strokeWidth="3"
        />
        <path
          d="M26 70 Q28 46 46 40"
          fill="none"
          stroke="#fff6c8"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <rect x="44" y="18" width="12" height="14" rx="4" fill="#b88a16" />
        <circle cx="50" cy="16" r="7" fill="#f6c445" stroke="#b88a16" strokeWidth="3" />
      </svg>
    </Btn>
  );
}

/**
 * Item centres as a share of the bin's width (D85). Placing each item by its centre, not by inline
 * flow, keeps the heap the same width whatever the emoji font: Apple's glyphs are narrower than
 * Segoe's, so a flowing row bunched up in the middle on iOS. Front row spans the crate (inset 10 of
 * 300 plus half an item); the back row sits in the gaps.
 */
const FRONT_ROW = [13, 31.5, 50, 68.5, 87];
const BACK_ROW = [22.25, 40.75, 59.25, 77.75];

/** The bin never empties (SPEC §3.3): a crate with a heap of the ordered food. */
export function Bin({
  rect,
  food,
  handlers,
  pulsing,
  wobble,
}: {
  rect: Rect;
  food: FoodId;
  handlers: Record<string, unknown>;
  pulsing?: boolean;
  wobble?: number;
}) {
  const g = FOODS[food].glyph;
  // Tap or drag (SPEC §3.3), so not a TapButton: handlers come from dragTapHandlers.
  const cls = ['svc-btn', 'bin', pulsing ? 'pulse' : '', wobble ? `wobble-${wobble % 2}` : ''].join(
    ' ',
  );
  return (
    <div
      className={cls}
      style={at(rect)}
      data-tap="button"
      data-testid="bin"
      aria-label="Food bin"
      {...handlers}
    >
      {/* Two overlapping rows read as a full heap; both sit inside the crate's width (D79, D85). */}
      <div className="bin-heap back">
        {BACK_ROW.map((x) => (
          <span key={x} style={{ left: `${x}%` }}>
            {g}
          </span>
        ))}
      </div>
      <div className="bin-heap front">
        {FRONT_ROW.map((x) => (
          <span key={x} style={{ left: `${x}%` }}>
            {g}
          </span>
        ))}
      </div>
      <div className="bin-crate" />
    </div>
  );
}

function HatArt() {
  return (
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
  );
}

/** Pip's hat = Help (SPEC §7.3). */
export function PipHat(props: PartProps) {
  return (
    <Btn {...props} className="pip-hat" testId="help" label="Help">
      <HatArt />
    </Btn>
  );
}

/**
 * Help offer after the second miss (D89). Pictures, not words: Pip (the helper standing on the
 * counter, D90) means "help me"; the circling arrow round the child's own tray means "let me try
 * again". The monster says the question aloud, so neither button needs reading.
 */
export function HelpChoice({
  yes,
  no,
  onYes,
  onNo,
}: {
  yes: Rect;
  no: Rect;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <>
      <Btn
        rect={yes}
        className="choice choice-yes pulse"
        testId="offer-yes"
        label="Yes, help me"
        onTap={onYes}
      >
        <PlaceholderPip />
      </Btn>
      <Btn
        rect={no}
        className="choice choice-no"
        testId="offer-no"
        label="No, I will try again"
        onTap={onNo}
      >
        <svg viewBox="0 0 120 110" width="100%" height="100%" aria-hidden="true">
          {/* A small ten-frame (the child's tray) inside a circling arrow. */}
          <rect
            x="30"
            y="40"
            width="60"
            height="30"
            rx="4"
            fill="#fffdf6"
            stroke="#8a5a35"
            strokeWidth="3.5"
          />
          <line x1="30" y1="55" x2="90" y2="55" stroke="#8a5a35" strokeWidth="2.5" />
          {[42, 54, 66, 78].map((x) => (
            <line key={x} x1={x} y1="40" x2={x} y2="70" stroke="#8a5a35" strokeWidth="2.5" />
          ))}
          {/* Clockwise arc round the tray; the arrowhead sits at the end, pointing along the turn. */}
          <path
            d="M24.3 42 A38 38 0 1 1 30.9 79.4"
            fill="none"
            stroke="#4a8fd8"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path d="M21.9 68.7 L25.1 89.6 L41.9 75.4 Z" fill="#4a8fd8" />
        </svg>
      </Btn>
    </>
  );
}

/** Door sign (leave, SPEC §5.4): small, top-left, never animates (SPEC §6.2 step 9). */
export function DoorSign(props: PartProps) {
  return (
    <Btn {...props} className="door-sign" testId="door" label="Take a break">
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

export function DigitButton({ digit, ...props }: PartProps & { digit: number }) {
  return (
    <Btn {...props} className="digit" testId={`digit-${digit}`} label={String(digit)}>
      {digit}
    </Btn>
  );
}

/** One display that always takes up to two digits, so the slots never reveal the answer's size (D32). */
export function AnswerDisplay({ rect, value }: { rect: Rect; value: string }) {
  return (
    <div className="answer-display" style={at(rect)} data-testid="answer-display">
      <span data-testid="answer-value">{value}</span>
      {value.length < 2 && <span className="caret" />}
    </div>
  );
}

export function Backspace(props: PartProps) {
  return (
    <Btn {...props} className="backspace" testId="backspace" label="Rub out">
      <svg viewBox="0 0 100 70" width="70%" aria-hidden="true">
        <path
          d="M30 6 L92 6 L92 64 L30 64 L6 35 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <path
          d="M46 22 L72 48 M72 22 L46 48"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </svg>
    </Btn>
  );
}

function ClocheSvg() {
  return (
    <svg viewBox="0 0 100 80" width="100%" height="100%" aria-hidden="true">
      <path d="M8 66 Q8 18 50 16 Q92 18 92 66 Z" fill="#d7dde6" stroke="#8b95a5" strokeWidth="3" />
      <path
        d="M22 56 Q24 32 44 26"
        fill="none"
        stroke="#fff"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="50" cy="12" r="7" fill="#8b95a5" />
      <rect x="2" y="64" width="96" height="8" rx="4" fill="#8b95a5" />
    </svg>
  );
}

/** Peek (SPEC §5.4): lifts the cloche to show the S3 model; counts as Help (D41). */
export function PeekButton(props: PartProps) {
  return (
    <Btn {...props} className="peek" testId="peek" label="Peek">
      <ClocheSvg />
    </Btn>
  );
}

/** The lifted lid; tapping it lowers the cloche and brings the digit row back (D62). */
export function ClocheLid(props: PartProps) {
  return (
    <Btn {...props} className="cloche-lid" testId="cloche-lid" label="Close the lid">
      <ClocheSvg />
      <span className="lid-badge">123</span>
    </Btn>
  );
}

/** Caption bubble (SPEC §8.1: captions always on). ≤ 8 words by lint (SPEC §13.2). */
/** The tail points at whoever is talking: right at the monster, down at Pip (D76, D90). */
export function Caption({
  rect,
  text,
  speaker,
}: {
  rect: Rect;
  text: string;
  speaker: 'monster' | 'pip';
}) {
  if (!text) return null;
  return (
    <div
      className={`caption from-${speaker}`}
      style={at(rect)}
      data-testid="caption"
      data-speaker={speaker}
      aria-live="polite"
    >
      {text}
    </div>
  );
}

/** Bubble border width (service.css .model-bubble); children are placed inside it. */
const BUBBLE_BORDER = 4;
/** Frames band inside the bubble, below the title line and above the running count (D84). */
const FRAMES_TOP = 68;
const FRAMES_H = frameSize(MODEL_ONE.cell, MODEL_ONE.gap, MODEL_ONE.pad).h;

/**
 * CountTogether model bubble (SPEC §5.5): non-interactive frames, blue then orange, with a running
 * count. One frame is drawn large; two shrink to fit side by side (D84). One bubble size for both,
 * so the line never wraps (D63e).
 */
export function ModelBubble({
  rect,
  frames,
  caption,
}: {
  rect: Rect;
  frames: CellView[][];
  caption: string;
}) {
  const m = frames.length > 1 ? MODEL_TWO : MODEL_ONE;
  const size = frameSize(m.cell, m.gap, m.pad);
  const innerW = frames.length * size.w + (frames.length - 1) * MODEL_FRAMES_GAP;
  const left = Math.round((rect.w - 2 * BUBBLE_BORDER - innerW) / 2);
  const top = FRAMES_TOP + Math.round((FRAMES_H - size.h) / 2);
  return (
    <div className="model-bubble" style={at(rect)} data-testid="model-bubble">
      <div className="bubble-line">Let&apos;s count together!</div>
      {frames.map((cells, i) => (
        <TenFrame
          key={i}
          cells={cells}
          cell={m.cell}
          gap={m.gap}
          pad={m.pad}
          x={left + i * (size.w + MODEL_FRAMES_GAP)}
          y={top}
          className="mini"
        />
      ))}
      <div className="bubble-count" data-testid="bubble-count">
        {caption}
      </div>
    </div>
  );
}

/**
 * Warm-up ghost hand (SPEC §5.4, D26): a pale pointing hand that taps the thing to press next.
 * It never presses anything itself; under reduced motion it just points.
 */
export function GhostHand({ target, name }: { target: Rect; name: 'bin' | 'bell' }) {
  const size = 120;
  // Fingertip lands a little below the target's centre, the hand trailing down-right.
  const x = target.x + target.w / 2 - 34;
  const y = target.y + target.h / 2 - 10;
  return (
    <div
      className="ghost-hand"
      data-testid="ghost-hand"
      data-target={name}
      style={{ left: x, top: y, width: size, height: size }}
      aria-hidden="true"
    >
      <span className="ghost-ripple" />
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <path
          d="M34 10c7 0 12 5 12 12v38l6-3V44c0-6 5-10 11-10s10 4 10 10v14l5-2c6-2 12 2 13 8l1 6 6-1c6 0 10 5 10 11v12c0 14-12 26-28 26H62c-10 0-19-5-24-14L18 72c-3-6 0-12 6-14 5-2 9 0 12 4l-14-1V22c0-7 5-12 12-12z"
          fill="rgba(255,255,255,0.85)"
          stroke="rgba(43,43,58,0.55)"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

