import type { ReactNode } from 'react';
import {
  CELL,
  CELL_GAP,
  FRAME,
  FRAME_PADDING,
  FRAMES_GAP,
  MINI_CELL,
  MINI_FRAME,
  MINI_GAP,
  MINI_PAD,
  SERVICE as L,
  TAKEN_CELL,
  TAKEN_GAP,
  TAKEN_PAD,
  BUTTON_MIN,
  type Rect,
} from '../metrics';
import { PlaceholderMonster } from '../../art/PlaceholderMonster';
import { TenFrame, cellsOf, type CellView } from '../../game/tray/TenFrame';
import {
  AnswerDisplay,
  Backspace,
  Bell,
  Bin,
  ClocheLid,
  DigitButton,
  DoorSign,
  PeekButton,
  PipHat,
  Queue,
  TakeBack,
  Ticket,
  at,
  type TicketToken,
} from '../../game/service/ServiceParts';
import type { FoodId } from '../../engine/foods';
import '../../game/service/service.css';
import { MOCK_FRAMES, type MockFrame } from './frames';

// M1 step 1: static layout mock (D36, D48). No interaction. Reached with ?mock=<frame> in VITE_E2E
// builds only; production builds never include it (main.tsx).


const tok = (text: string, role?: TicketToken['role'], blank?: boolean): TicketToken => ({
  text,
  role,
  blank,
});
const op = (text: string): TicketToken => ({ text });

function Monster({ aside }: { aside?: boolean }) {
  const r: Rect = aside ? L.monsterAside : { x: 940, y: 52, w: 240, h: 240 };
  return (
    <div className="monster-slot" style={at(r)}>
      <PlaceholderMonster size={r.w} />
    </div>
  );
}

function Counter() {
  return <div className="counter" aria-hidden="true" />;
}

function Frames1({ cells }: { cells: CellView[] }) {
  return (
    <TenFrame
      cells={cells}
      cell={CELL}
      gap={CELL_GAP}
      pad={FRAME_PADDING}
      x={L.trayFrames1.x}
      y={L.trayFrames1.y}
      tapTargets
      testId="tray"
    />
  );
}

function Frames2({ cells }: { cells: CellView[] }) {
  return (
    <>
      <TenFrame
        cells={cells.slice(0, 10)}
        cell={CELL}
        gap={CELL_GAP}
        pad={FRAME_PADDING}
        x={L.trayFrames2.x}
        y={L.trayFrames2.y}
        tapTargets
        testId="tray"
      />
      <TenFrame
        cells={cells.slice(10)}
        cell={CELL}
        gap={CELL_GAP}
        pad={FRAME_PADDING}
        x={L.trayFrames2.x + FRAME.w + FRAMES_GAP}
        y={L.trayFrames2.y}
        tapTargets
      />
    </>
  );
}

function BottomBand({
  food,
  takeBack = true,
  bell = L.bell,
}: {
  food: FoodId;
  takeBack?: boolean;
  bell?: Rect | null;
}) {
  return (
    <>
      <PipHat rect={L.help} />
      <Bin rect={L.bin} food={food} />
      {takeBack && <TakeBack rect={L.takeBack} food={food} />}
      {bell && <Bell rect={bell} />}
    </>
  );
}

function Chrome({ children, queue = 4 }: { children: ReactNode; queue?: number }) {
  return (
    <div className="screen service mock" data-testid="layout-mock">
      <Counter />
      <DoorSign rect={L.door} />
      <Queue rect={L.queue} count={queue} />
      {children}
    </div>
  );
}

/** CountTogether model bubble (SPEC §5.5): blue then orange, Pip counts with running numbers. */
function Bubble({
  rect,
  frames,
  caption,
}: {
  rect: Rect;
  frames: CellView[][];
  caption: string;
}) {
  const innerW = frames.length * MINI_FRAME.w + (frames.length - 1) * 12;
  const left = Math.round((rect.w - innerW) / 2);
  return (
    <div className="model-bubble" style={at(rect)} data-testid="model-bubble">
      <div className="bubble-line">Let&apos;s count together!</div>
      {frames.map((cells, i) => (
        <TenFrame
          key={i}
          cells={cells}
          cell={MINI_CELL}
          gap={MINI_GAP}
          pad={MINI_PAD}
          x={left + i * (MINI_FRAME.w + 12)}
          y={50}
          className="mini"
        />
      ))}
      <div className="bubble-count">{caption}</div>
    </div>
  );
}

function numbered(cells: CellView[]): CellView[] {
  return cells.map((c, i) => ({ ...c, pop: i + 1 }));
}

function Digits() {
  return (
    <>
      {Array.from({ length: 10 }, (_, d) => (
        <DigitButton
          key={d}
          digit={d}
          rect={{ x: L.s0Digits.x + d * (BUTTON_MIN + L.s0DigitGap), y: L.s0Digits.y, w: BUTTON_MIN, h: BUTTON_MIN }}
        />
      ))}
    </>
  );
}

export function LayoutMock({ frame }: { frame: string }) {
  switch (frame as MockFrame) {
    case 'a-s3-frames1':
      // A2 `5 + 3 = ?` at S3: 5 prefilled (blue, locked), the child has added 2 of 3 (orange), pops on.
      return (
        <Chrome>
          <Monster />
          <Ticket rect={L.ticket} food="cookie" tokens={[tok('5', 'prefill'), op('+'), tok('3', 'child'), op('='), tok('?', 'result', true)]} />
          <Frames1 cells={cellsOf('cookie', 5, 2, { pops: true, popFrom: 5 })} />
          <BottomBand food="cookie" />
        </Chrome>
      );
    case 'b-frames2':
      // M5 preview: A7 `8 + 5 = ?` at S3, mid-build: 8 blue, 4 orange (the ten is full, two in frame 2).
      return (
        <Chrome>
          <Monster />
          <Ticket rect={L.ticket} food="strawberry" tokens={[tok('8', 'prefill'), op('+'), tok('5', 'child'), op('='), tok('?', 'result', true)]} />
          <Frames2 cells={cellsOf('strawberry', 8, 4, { pops: true, popFrom: 8 })} />
          <BottomBand food="strawberry" bell={L.bellFrames2} />
        </Chrome>
      );
    case 'c1-count-together-1':
      // After a wrong serve of 7 for `5 + 3`: bubble in the monster zone, child's tray stays editable.
      return (
        <Chrome>
          <Monster aside />
          <Bubble rect={L.bubble} frames={[numbered(cellsOf('cookie', 5, 3))]} caption="… six, seven, eight!" />
          <Ticket rect={L.ticket} food="cookie" tokens={[tok('5', 'prefill'), op('+'), tok('3', 'child'), op('='), tok('?', 'result', true)]} />
          <Frames1 cells={cellsOf('cookie', 5, 2)} />
          <BottomBand food="cookie" />
        </Chrome>
      );
    case 'c2-count-together-2': {
      const cells = numbered(cellsOf('strawberry', 8, 5));
      return (
        <Chrome>
          <Monster aside />
          <Bubble rect={L.bubble} frames={[cells.slice(0, 10), cells.slice(10)]} caption="… eleven, twelve, thirteen!" />
          <Ticket rect={L.ticket} food="strawberry" tokens={[tok('8', 'prefill'), op('+'), tok('5', 'child'), op('='), tok('?', 'result', true)]} />
          <Frames2 cells={cellsOf('strawberry', 8, 3)} />
          <BottomBand food="strawberry" bell={L.bellFrames2} />
        </Chrome>
      );
    }
    case 'e-taken-away':
      // A3 `10 − ? = 6` at S3 (remove mode): 4 taken away stay visible in the row (SPEC §3.3).
      // No "take one back" in remove mode: tapping the bin or the row puts one back (D42).
      return (
        <Chrome>
          <Monster />
          <Ticket rect={L.ticket} food="doughnut" tokens={[tok('10', 'prefill'), op('−'), tok('?', 'child', true), op('='), tok('6', 'result')]} />
          <Frames1 cells={cellsOf('doughnut', 6, 0)} />
          <div className="taken-away" style={at(L.takenAway)} data-tap="button" data-testid="taken-away">
            <TenFrame
              cells={cellsOf('doughnut', 0, 4)}
              cell={TAKEN_CELL}
              gap={TAKEN_GAP}
              pad={TAKEN_PAD}
              x={0}
              y={0}
              className="taken"
            />
          </div>
          <BottomBand food="doughnut" takeBack={false} />
        </Chrome>
      );
    case 'g1-s0-pad':
      // S0 (D48, D63): display row (with the bell) + digit row in the tray band; Pip's hat bottom-left.
      return (
        <Chrome>
          <Monster />
          <Ticket rect={L.ticket} food="pizza" tokens={[tok('6', 'prefill'), op('+'), tok('3', 'child'), op('='), tok('?', 'result', true)]} />
          <PeekButton rect={L.s0Peek} />
          <AnswerDisplay rect={L.s0Display} value="9" />
          <Backspace rect={L.s0Backspace} />
          <Digits />
          <PipHat rect={L.help} />
          <Bell rect={L.s0Bell} />
        </Chrome>
      );
    case 'g2-s0-cloche':
      // Peek / Worked / FollowMe at S0: the cloche lifts and the full S3 tray takes the band (D41, D48).
      return (
        <Chrome>
          <Monster />
          <Ticket rect={L.ticket} food="pizza" tokens={[tok('6', 'prefill'), op('+'), tok('3', 'child'), op('='), tok('?', 'result', true)]} />
          <div className="cloche-plate" style={at({ x: L.trayFrames1.x - 20, y: L.trayFrames1.y + L.trayFrames1.h - 14, w: L.trayFrames1.w + 40, h: 28 })} />
          <Frames1 cells={cellsOf('pizza', 6, 1, { pops: true, popFrom: 6 })} />
          <ClocheLid rect={L.clocheLid} />
          <BottomBand food="pizza" />
        </Chrome>
      );
    default:
      return (
        <div className="screen mock-index">
          {MOCK_FRAMES.map((f) => (
            <div key={f}>?mock={f}</div>
          ))}
        </div>
      );
  }
}
