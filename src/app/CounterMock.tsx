// `?mock`: static layout mock for the over-the-counter service screen (owner request before M3a).
// Look only: nothing here is wired to the controller, and taps do nothing. URL parameters pick what
// it shows, so screenshots are reproducible:
//   v=s3|taken|frames2a|frames2b|frames2c|s0|cloche|offer|count   basket=right|left
//   window=behind|door   line=1..10   monster=full|waist (owner chose full height; waist kept for reference)
// A small toolbar outside the stage flips the same switches by hand; `&clean` hides it.
import type { ReactNode } from 'react';
import {
  BUTTON_MIN,
  CELL,
  CELL_GAP,
  COUNTER,
  COUNTER_Y,
  FRAME,
  FRAME_PADDING,
  FRAMES_GAP,
  TIGHT,
  frameSize,
  TAKEN_CELL,
  TAKEN_GAP,
  TAKEN_PAD,
  forSide,
  type BasketSide,
  type MonsterCut,
  type Rect,
} from './metrics';
import { CoinJarIcon, CounterScene, ShopIcon, type WindowSpot } from '../art/CounterScene';
import { Monster } from '../art/monsters/Monster';
import { Pip } from '../art/Pip';
import { FOODS, type FoodId } from '../engine/foods';
import { TenFrame, type CellView } from '../game/tray/TenFrame';
import {
  AnswerDisplay,
  Backspace,
  Bell,
  Bin,
  Caption,
  ClocheLid,
  DigitButton,
  DoorSign,
  HelpChoice,
  ModelBubble,
  PeekButton,
  PipHat,
  Ticket,
  at,
  type TicketToken,
} from '../game/service/ServiceParts';
import '../game/service/service.css';
import './counterMock.css';

export const MOCK_VARIANTS = ['s3', 'taken', 'frames2a', 'frames2b', 'frames2c', 's0', 'cloche', 'offer', 'count'] as const;
export type MockVariant = (typeof MOCK_VARIANTS)[number];

export interface MockOptions {
  variant: MockVariant;
  monster: MonsterCut;
  basket: BasketSide;
  /** Street window behind the monster (default) or beside the door, as in the first mock. */
  windowSpot: WindowSpot;
  /** Monsters waiting in line (default 5; 9 is the longest a service of 8 with two requeues gets). */
  line: number;
  clean: boolean;
}

export function parseMockOptions(search: string): MockOptions {
  const q = new URLSearchParams(search);
  const v = q.get('v') as MockVariant | null;
  return {
    variant: v && (MOCK_VARIANTS as readonly string[]).includes(v) ? v : 's3',
    monster: q.get('monster') === 'waist' ? 'waist' : 'full',
    basket: q.get('basket') === 'left' ? 'left' : 'right',
    windowSpot: q.get('window') === 'door' ? 'door' : 'behind',
    line: Math.max(1, Math.min(10, Number(q.get('line')) || 5)),
    clean: q.has('clean'),
  };
}

const noop = () => undefined;

/** One sample order per variant (a believable mid-service moment). */
interface Sample {
  monster: string;
  food: FoodId;
  tokens: TicketToken[];
  caption: string;
  speaker: 'monster' | 'pip';
}
const tok = (text: string, role?: TicketToken['role'], blank = false): TicketToken => ({ text, role, blank });
const TWO_FRAME: Sample = {
  monster: 'gruffles',
  food: 'burger',
  tokens: [tok('8', 'prefill'), tok('+'), tok('5', 'child'), tok('='), tok('?', 'result', true)],
  caption: 'Eight plus five burgers, please!',
  speaker: 'monster',
};
const SAMPLES: Record<MockVariant, Sample> = {
  s3: {
    monster: 'blobbo',
    food: 'strawberry',
    tokens: [tok('5', 'prefill'), tok('+'), tok('2', 'child'), tok('='), tok('?', 'result', true)],
    caption: 'Five plus two strawberries, please!',
    speaker: 'monster',
  },
  taken: {
    monster: 'zibbit',
    food: 'cookie',
    tokens: [tok('10', 'prefill'), tok('−'), tok('?', 'child', true), tok('='), tok('6', 'result')],
    caption: 'Ten take away what makes six?',
    speaker: 'monster',
  },
  frames2a: TWO_FRAME,
  frames2b: TWO_FRAME,
  frames2c: TWO_FRAME,
  s0: {
    monster: 'mimsy',
    food: 'bread',
    tokens: [tok('4', 'prefill'), tok('+'), tok('3', 'child'), tok('='), tok('?', 'result', true)],
    caption: 'Four plus three breads, please!',
    speaker: 'monster',
  },
  cloche: {
    monster: 'mimsy',
    food: 'bread',
    tokens: [tok('4', 'prefill'), tok('+'), tok('3', 'child'), tok('='), tok('?', 'result', true)],
    caption: 'Four plus three breads, please!',
    speaker: 'monster',
  },
  offer: {
    monster: 'chompers',
    food: 'pizza',
    tokens: [tok('6', 'prefill'), tok('+'), tok('3', 'child'), tok('='), tok('?', 'result', true)],
    caption: 'Want Pip to help? Or try again?',
    speaker: 'monster',
  },
  count: {
    monster: 'blobbo',
    food: 'strawberry',
    tokens: [tok('5', 'prefill'), tok('+'), tok('2', 'child'), tok('='), tok('?', 'result', true)],
    caption: '',
    speaker: 'pip',
  },
};

/**
 * The waiting line, front first. Chompers needed help two orders ago and was requeued 3–5 orders
 * later (D43), so it stands at its real place in the line, not at the back.
 */
const LINE_IDS = ['gruffles', 'chompers', 'mimsy', 'wobbleton', 'zibbit', 'blobbo', 'gruffles', 'mimsy', 'zibbit', 'wobbleton'];
/** Front first; places 2 and 7 are requeued monsters standing where their order really is. */
const lineOf = (n: number): { id: string; back?: boolean }[] =>
  LINE_IDS.slice(0, n).map((id, i) => ({ id, back: i === 1 || i === 6 }));

function cellsFor(prefill: number, child: number, cap: number, food: FoodId, popFrom = prefill): CellView[] {
  return Array.from({ length: cap }, (_, i) =>
    i < prefill
      ? { food, role: 'prefill' as const }
      : i < prefill + child
        ? { food, role: 'child' as const, pop: popFrom + (i - prefill) + 1 }
        : {},
  );
}

function Tray({ rect, cells, tight = false }: { rect: Rect; cells: CellView[]; tight?: boolean }) {
  const g = tight ? TIGHT : { cell: CELL, gap: CELL_GAP, pad: FRAME_PADDING, framesGap: FRAMES_GAP };
  const fw = tight ? frameSize(g.cell, g.gap, g.pad).w : FRAME.w;
  return (
    <div className="tray">
      {[0, 1].slice(0, cells.length > 10 ? 2 : 1).map((f) => (
        <TenFrame
          key={f}
          cells={cells.slice(f * 10, f * 10 + 10)}
          cell={g.cell}
          gap={g.gap}
          pad={g.pad}
          x={rect.x + f * (fw + g.framesGap)}
          y={rect.y}
          tapTargets
          testId="tray"
          firstIndex={f * 10}
        />
      ))}
    </div>
  );
}

/** The real monster, cut at the counter's far edge in waist mode. */
function CounterMonster({ id, rect, cut }: { id: string; rect: Rect; cut: MonsterCut }) {
  const clipH = cut === 'waist' ? COUNTER_Y + 4 - rect.y : rect.h;
  return (
    <div className="mock-monster" style={{ ...at(rect), height: clipH }} data-testid="monster" data-cut={cut}>
      <Monster id={id} expression="idle" size={rect.w} />
    </div>
  );
}

export function CounterMock({ opts }: { opts: MockOptions }) {
  const { variant, monster: cut, basket, windowSpot } = opts;
  const twoRow = variant === 'frames2c';
  const counterY = twoRow ? COUNTER.frames2c.counterY : COUNTER_Y;
  const LINE = lineOf(opts.line);
  const step = Math.min(COUNTER.bar.miniStep, (COUNTER.bar.line.w - 16) / LINE.length);
  const s = SAMPLES[variant];
  const side = (r: Rect) => forSide(r, basket);
  const { bar, scene } = COUNTER;
  const counting = variant === 'count';
  const pipOut = variant === 'offer' || counting;
  const monsterRect = counting
    ? scene.monsterAside
    : twoRow
      ? COUNTER.frames2c.monster
      : cut === 'waist'
        ? scene.monsterWaist
        : scene.monsterFull;
  const ticketRect = counting
    ? scene.ticketCounting
    : variant === 'frames2b'
      ? COUNTER.frames2b.ticket
      : twoRow
        ? COUNTER.frames2c.ticket
        : scene.ticket;
  // Waist mode: the aside monster is cut too, so it reads as the same monster stepping aside.
  const asideRect = cut === 'waist' ? { ...scene.monsterAside, y: COUNTER_Y - 90, w: 150, h: 150, x: 105 } : monsterRect;

  const band: ReactNode[] = [];
  const helpBell = (help: Rect, bell: Rect) => {
    band.push(<PipHat key="help" rect={side(help)} onTap={noop} pulsing={variant === 'offer'} />);
    band.push(<Bell key="bell" rect={side(bell)} onTap={noop} dim={variant === 'offer' || variant === 'count' || variant === 'cloche'} />);
  };
  switch (variant) {
    case 's3':
    case 'count':
      helpBell(COUNTER.s3.help, COUNTER.s3.bell);
      band.push(<Tray key="tray" rect={side(COUNTER.s3.tray)} cells={cellsFor(5, 2, 10, s.food)} />);
      band.push(<Bin key="bin" rect={side(COUNTER.s3.bin)} food={s.food} handlers={{}} />);
      break;
    case 'taken': {
      helpBell(COUNTER.s3.help, COUNTER.s3.bell);
      const cells = Array.from({ length: 10 }, (_, i) => (i < 6 ? { food: s.food, role: 'prefill' as const } : {}));
      band.push(<Tray key="tray" rect={side(COUNTER.s3.tray)} cells={cells} />);
      const r = side(COUNTER.taken.takenAway);
      band.push(
        <div key="taken" className="taken-away" style={at(r)} data-tap="button" data-testid="taken-away">
          <TenFrame
            cells={Array.from({ length: 4 }, (_, k) => ({ food: s.food, role: 'child' as const, pop: k + 1 }))}
            cell={TAKEN_CELL}
            gap={TAKEN_GAP}
            pad={TAKEN_PAD}
            x={0}
            y={0}
            className="taken"
          />
        </div>,
      );
      break;
    }
    case 'frames2a': {
      // A: tighter tray, Pip on the bell, an upright crate with a three-row heap.
      helpBell(COUNTER.frames2a.help, COUNTER.frames2a.bell);
      band.push(<Tray key="tray" tight rect={side(COUNTER.frames2a.tray)} cells={cellsFor(8, 5, 20, s.food)} />);
      band.push(
        <div key="bin" className="svc-btn mock-tall-bin" data-tap="button" data-testid="bin" style={at(side(COUNTER.frames2a.bin))}>
          {[0, 1, 2].map((row) => (
            <div key={row} className={`mock-heap-row r${row}`}>
              {[0, 1, 2].map((k) => (
                <span key={k}>{FOODS[s.food].glyph}</span>
              ))}
            </div>
          ))}
          <div className="bin-crate" />
        </div>,
      );
      break;
    }
    case 'frames2b':
      // B: the basket moves up onto the back counter beside the monster; Pip and the bell side by side.
      helpBell(COUNTER.frames2b.help, COUNTER.frames2b.bell);
      band.push(<Tray key="tray" rect={side(COUNTER.frames2b.tray)} cells={cellsFor(8, 5, 20, s.food)} />);
      band.push(<Bin key="bin" rect={side(COUNTER.frames2b.bin)} food={s.food} handlers={{}} />);
      break;
    case 'frames2c':
      // C: the counter rises; the tray spans the top row, Pip, the bell and a shallow basket below.
      helpBell(COUNTER.frames2c.help, COUNTER.frames2c.bell);
      band.push(<Tray key="tray" rect={side(COUNTER.frames2c.tray)} cells={cellsFor(8, 5, 20, s.food)} />);
      band.push(
        <Bin key="bin" rect={side(COUNTER.frames2c.bin)} food={s.food} handlers={{}} />,
      );
      break;
    case 's0': {
      helpBell(COUNTER.s0.help, COUNTER.s0.bell);
      const p = COUNTER.s0;
      band.push(<PeekButton key="peek" rect={side(p.peek)} onTap={noop} />);
      band.push(<AnswerDisplay key="disp" rect={side(p.display)} value="7" />);
      band.push(<Backspace key="bs" rect={side(p.backspace)} onTap={noop} />);
      for (let d = 0; d < 10; d++)
        band.push(
          <DigitButton
            key={`d${d}`}
            digit={d}
            onTap={noop}
            // Digits keep 0–9 left to right on both sides: the row is a little number line.
            rect={{ x: p.digits.x + d * (BUTTON_MIN + p.digitGap), y: p.digits.y, w: BUTTON_MIN, h: BUTTON_MIN }}
          />,
        );
      break;
    }
    case 'cloche': {
      helpBell(COUNTER.s3.help, COUNTER.s3.bell);
      const t = side(COUNTER.cloche.tray);
      band.push(
        <div key="plate" className="cloche-plate" style={at({ x: t.x - 20, y: t.y + t.h - 14, w: t.w + 40, h: 28 })} />,
      );
      band.push(<Tray key="tray" rect={t} cells={cellsFor(4, 3, 10, s.food)} />);
      band.push(<Bin key="bin" rect={side(COUNTER.cloche.bin)} food={s.food} handlers={{}} />);
      band.push(<ClocheLid key="lid" rect={side(COUNTER.cloche.lid)} onTap={noop} />);
      break;
    }
    case 'offer':
      helpBell(COUNTER.s3.help, COUNTER.s3.bell);
      band.push(<Bin key="bin" rect={side(COUNTER.s3.bin)} food={s.food} handlers={{}} />);
      band.push(
        <HelpChoice
          key="offer"
          yes={side(COUNTER.offer.yes)}
          no={side(COUNTER.offer.no)}
          onYes={noop}
          onNo={noop}
        />,
      );
      break;
  }

  return (
    <div
      className={`screen service counter-mock phase-${variant === 'offer' ? 'offerHelp' : 'building'}`}
      data-testid="counter-mock"
      data-variant={variant}
      data-basket={basket}
    >
      <CounterScene counterY={counterY} windowSpot={windowSpot} />

      {/* ---- status bar ---- */}
      <DoorSign rect={bar.door} onTap={noop} />
      <div className="mock-jar" style={at(bar.jar)} data-testid="service-jar">
        <div className="mock-jar-icon">
          <CoinJarIcon />
        </div>
        <span className="coin-count">12</span>
      </div>
      <div className="mock-line" style={at(bar.line)} data-testid="queue">
        <div className="mock-path" />
        {[...LINE].reverse().map((m, i) => (
          <div
            key={`${m.id}${i}`}
            className={`mock-mini ${m.back ? 'back-again' : ''}`}
            style={{ left: bar.line.w - (LINE.length - i) * step - 8, width: bar.mini, height: bar.mini, zIndex: i }}
            data-testid={m.back ? 'queue-returning' : undefined}
          >
            <Monster id={m.id} expression="idle" size={bar.mini} />
            {m.back && (
              <svg className="mock-back-badge" viewBox="0 0 30 30" aria-hidden="true">
                <circle cx={15} cy={15} r={13.5} fill="#fff" stroke="#4a8fd8" strokeWidth={3} />
                {/* "back again": a circling arrow, like the try-again picture (D90) */}
                <path d="M9.5 19.5 A7 7 0 1 1 15 22" fill="none" stroke="#4a8fd8" strokeWidth={3} strokeLinecap="round" />
                <path d="M5.5 16.5 L9.6 22.8 L13.2 16.4 Z" fill="#4a8fd8" />
              </svg>
            )}
          </div>
        ))}
      </div>
      <div className="mock-shop" style={at(bar.shop)}>
        <ShopIcon />
      </div>

      {/* ---- room ---- */}
      {counting ? (
        <CounterMonster id={s.monster} rect={asideRect} cut={cut} />
      ) : (
        <CounterMonster id={s.monster} rect={monsterRect} cut={cut} />
      )}
      {pipOut && (
        <div
          className="pip-slot mock-pip"
          style={{ ...at(counting ? scene.pipCounting : scene.pip), height: COUNTER_Y + 4 - (counting ? scene.pipCounting : scene.pip).y }}
          data-testid="pip"
        >
          <div style={{ width: scene.pip.w, height: scene.pip.h }}>
            <Pip />
          </div>
        </div>
      )}
      {!counting && <Caption rect={scene.caption} text={s.caption} speaker={s.speaker} />}
      {counting && (
        <ModelBubble
          rect={scene.bubble}
          frames={[cellsFor(5, 1, 10, s.food, 0).map((c, i) => (i === 0 ? { ...c, pop: 1 } : { ...c, pop: undefined }))]}
          caption="one"
        />
      )}
      <Ticket rect={ticketRect} tokens={s.tokens} food={s.food} />

      {/* ---- counter band ---- */}
      {band}
    </div>
  );
}

/** Hand switches for the owner, outside the stage so they never cover the layout. */
export function MockToolbar({ opts }: { opts: MockOptions }) {
  const go = (patch: Partial<Record<'v' | 'window' | 'basket', string>>) => {
    const q = new URLSearchParams(location.search);
    for (const [k, v] of Object.entries(patch)) q.set(k, v);
    location.search = q.toString();
  };
  return (
    <div className="mock-toolbar" data-testid="mock-toolbar">
      <select value={opts.variant} onChange={(e) => go({ v: e.target.value })} aria-label="Variant">
        {MOCK_VARIANTS.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
      <button type="button" onClick={() => go({ window: opts.windowSpot === 'behind' ? 'door' : 'behind' })}>
        Window: {opts.windowSpot === 'behind' ? 'behind the monster' : 'by the door'}
      </button>
      <button type="button" onClick={() => go({ basket: opts.basket === 'right' ? 'left' : 'right' })}>
        Basket: {opts.basket}
      </button>
    </div>
  );
}
