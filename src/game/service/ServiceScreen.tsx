import { EAT_STAGGER_MS } from '../../engine/eat';
import { useMemo, useState, type CSSProperties } from 'react';
import {
  CELL,
  COUNTER,
  COUNTER_Y,
  PIP_EXIT_MS,
  PLATE_BLEED,
  TAKEN_CELL,
  TAKEN_GAP,
  TAKEN_PAD,
  frameSize,
  type BasketSide,
  type Rect,
} from '../../app/metrics';
import { getStageLayout } from '../../app/Stage';
import { FOODS } from '../../engine/foods';
import type { ModelCell } from '../../engine/countTogether';
import type { Order } from '../../engine/session';
import { ticketRoles } from '../../engine/tray';
import { Monster } from '../../art/monsters/Monster';
import { Pip } from '../../art/Pip';
import { dragTapHandlers, inRect, type StagePoint } from '../input/dragTap';
import { TapButton } from '../input/TapButton';
import { TenFrame, type CellView } from '../tray/TenFrame';
import { useBlip, useHold } from './useHold';
import {
  AnswerDisplay,
  Backspace,
  Bell,
  Bin,
  Caption,
  ClocheLid,
  CoinJar,
  DigitButton,
  DoorSign,
  GhostHand,
  HelpChoice,
  ModelBubble,
  PeekButton,
  PipHat,
  ShopDoor,
  Ticket,
  WaitingLine,
  at,
  type TicketToken,
} from './ServiceParts';
import { useService } from './useService';
import { cellRect, counterLayout, type CounterRects } from './counterLayout';
import type { ServiceSummary, ServiceView } from './controller';
import './service.css';

interface Props {
  orders: Order[];
  /** Service seed: requeues are placed from it too (SPEC §4.1). */
  seed: number;
  svc: string;
  dev: string;
  onDone: (summary: ServiceSummary) => void;
  onCoins?: (n: number) => void;
  onDoor: () => void;
  /** Coins in the jar when the service started; landed coins add to it (SPEC §9). */
  jar?: number;
  /** Per-device: the basket on the child's dominant side, Pip and the bell on the other (D115). */
  basket?: BasketSide;
}

const { bar: BAR, scene: SCENE } = COUNTER;

/** Which cell a stage point is over (gaps count toward the nearer cell), or null. */
function cellAt(p: StagePoint, L: CounterRects, n: number): number | null {
  for (let i = 0; i < n; i++) if (inRect(p, cellRect(i, L.tray, L.frame), L.frame.gap / 2)) return i;
  return null;
}

const layoutOf = (v: ServiceView, side: BasketSide): CounterRects =>
  counterLayout({
    side,
    frames2: v.task.layout === 'frames2',
    takenAwayRow: v.tray.takenAwayRow,
    stage0: v.order.stage === 0,
    padMode: v.padMode,
  });

const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/** Logical rect of slot `k` in the taken-away row (2 × 5, SPEC §3.3). */
function takenRect(k: number, row: Rect): Rect {
  return {
    x: row.x + TAKEN_PAD + (k % 5) * (TAKEN_CELL + TAKEN_GAP),
    y: row.y + TAKEN_PAD + Math.floor(k / 5) * (TAKEN_CELL + TAKEN_GAP),
    w: TAKEN_CELL,
    h: TAKEN_CELL,
  };
}

/** Gone items render as empty cells so the remaining run is what the child sees (D30). */
function bubbleFrames(cells: ModelCell[], food: CellView['food']): CellView[][] {
  const shown: CellView[] = cells.map((c) =>
    c.gone ? {} : c.spot ? { spot: true, glow: c.glow } : { food, role: c.role, pop: c.pop, glow: c.glow },
  );
  return shown.length > 10 ? [shown.slice(0, 10), shown.slice(10)] : [shown];
}

/** Where food and coins leave from / fly to (stage px). */
const MONSTER = SCENE.monsterFull;
const MOUTH = { x: MONSTER.x + MONSTER.w / 2, y: MONSTER.y + MONSTER.h * 0.6 };
const JAR = BAR.jar;
/** The tray slides up toward the monster while it eats (SPEC §5.6). */
const EAT_SLIDE = 30;

export function ServiceScreen({ orders, seed, svc, dev, onDone, onCoins, onDoor, jar = 0, basket = 'right' }: Props) {
  const [jarStart] = useState(jar);
  const { view: v, ctrl } = useService({ orders, seed, svc, dev, onDone, onCoins });
  const { order, task } = v;
  const food = order.food;
  const glyph = FOODS[food].glyph;
  const frames2 = task.layout === 'frames2';
  const L = layoutOf(v, basket);
  const tray = L.tray;
  const cellOf = (i: number) => cellRect(i, tray, L.frame);

  // Created once: the gesture state inside must survive the re-renders a drag causes. They read
  // the controller's latest snapshot when they fire, never during render.
  const binHandlers = useMemo(() => {
    const now = () => layoutOf(ctrl.getView(), basket);
    return dragTapHandlers({
      layout: getStageLayout,
      inside: (p) => {
        const b = now().bin;
        return !!b && inRect(p, b, 4);
      },
      onTap: () => ctrl.tapBin(),
      onDragMove: (p) => ctrl.setDrag(p),
      // Dropping anywhere on the tray places into the next empty cell (SPEC §1.3).
      onDrop: (p) => {
        if (inRect(p, now().tray, 24)) ctrl.tapBin();
        else ctrl.touch(); // dropped elsewhere: the item goes back
      },
    });
  }, [ctrl, basket]);
  const trayHandlers = useMemo(() => {
    const now = () => layoutOf(ctrl.getView(), basket);
    const cap = () => ctrl.getView().tray.capacity;
    return dragTapHandlers({
      layout: getStageLayout,
      inside: (p) => inRect(p, now().tray, 4),
      onTap: (_p, start) => {
        const i = cellAt(start, now(), cap());
        if (i === null) return ctrl.touch();
        if (i < ctrl.getView().tray.filled) ctrl.tapItem(i);
        else ctrl.tapEmpty(i);
      },
      canDrag: (start) => {
        const i = cellAt(start, now(), cap());
        return i !== null && i < ctrl.getView().tray.filled;
      },
      onDragMove: (p) => ctrl.setDrag(p),
      onDrop: (p) => {
        // Add mode: drag an item to the bin. Remove mode: drag it off the tray (SPEC §3.3).
        const add = ctrl.getView().tray.mode === 'add';
        const { bin, tray: t } = now();
        if (add ? !!bin && inRect(p, bin, 24) : !inRect(p, t, 0)) ctrl.dragAway();
        else ctrl.touch();
      },
    });
  }, [ctrl, basket]);

  const roles = ticketRoles(order.problem);
  const tokens: TicketToken[] = order.problem.display.map((t, i) => ({
    text: String(t),
    role: roles[i] === 'op' ? undefined : roles[i],
    blank: t === '?',
  }));

  const s3 = order.stage === 3;
  const cue = v.cue;
  // Missing-number forms: the unknown's cells (the empty spots to fill, or the items to take away)
  // are marked orange, and S3 counts them from one (D104).
  const unknown = task.unknown;
  const inUnknown = (i: number) => !!unknown && i >= unknown.from && i < unknown.to;
  // Eating: the eaten plate leaves empty cells behind, and stays gone until the next order (SPEC §5.6).
  const plate = v.eaten;
  const eatenCell = (i: number) => plate?.source === 'tray' && i >= plate.from && i < plate.from + plate.count;
  const cells: CellView[] = Array.from({ length: v.tray.capacity }, (_, i) => {
    if (eatenCell(i)) return {};
    if (i >= v.tray.filled) {
      // Empty cells glow too: the make-ten demo flashes the gap to ten (SPEC §5.5).
      return {
        pulse: cue === 'place' && i === v.tray.filled,
        glow: v.glow.includes(i),
        spot: inUnknown(i) && v.tray.mode === 'add',
      };
    }
    const role = i < v.tray.prefill && !(v.tray.mode === 'remove' && inUnknown(i)) ? 'prefill' : 'child';
    const popAt = unknown && v.tray.mode === 'add' ? i + 1 - v.tray.prefill : i + 1;
    return {
      food,
      role,
      // S3: running counts pop on the child's items (SPEC §1.4, §3.2).
      pop: s3 && role === 'child' && i >= v.tray.prefill ? popAt : undefined,
      glow: v.glow.includes(i),
      pulse: cue === 'remove' && i === v.tray.filled - 1,
      fx: v.fx?.index === i ? v.fx.kind : undefined,
      nonce: v.fx?.index === i ? v.fx.nonce : 0,
    };
  });

  const showTray = !v.padMode;
  const bubbleUp = v.bubble !== null;
  // Pip steps back down behind the counter instead of vanishing (D91). The line is up in the
  // status bar now, clear of Pip and the monster, so it never steps away (D118).
  const pipShown = useHold(v.pipOut, PIP_EXIT_MS);
  const pipRect = bubbleUp ? SCENE.pipCounting : SCENE.pip;
  // The returning monster's walk-in plays once, as the next monster comes in (D108).
  const joining = useBlip(v.queueJoin, 1000);
  const removed = v.removed;
  const phase = v.attempt.phase;
  const lockedPhase = phase === 'plateCount' || phase === 'worked' || phase === 'eating';

  const frameW = frameSize(L.frame.cell, L.frame.gap, L.frame.pad).w;
  const frameProps = { cell: L.frame.cell, gap: L.frame.gap, pad: L.frame.pad, y: tray.y, tapTargets: true, testId: 'tray' };

  return (
    <div
      className={`screen service phase-${v.attempt.phase} basket-${basket}`}
      data-testid="screen-service"
      data-phase={v.attempt.phase}
      data-stage={order.stage}
      data-basket={basket}
    >
      {/* ---- status bar (SPEC §5.4) ---- */}
      <DoorSign rect={BAR.door} onTap={onDoor} />
      <CoinJar rect={JAR} count={jarStart + v.landed} />
      <WaitingLine rect={BAR.line} line={v.line} mini={BAR.mini} maxStep={BAR.miniStep} joining={joining} />
      <ShopDoor rect={BAR.shop} />

      {/* ---- room: the monster behind the counter, caption left of it, ticket right ---- */}
      {/* The CountTogether bubble is Pip's speech while it shows (D76, D90). */}
      <Caption rect={SCENE.caption} text={bubbleUp ? '' : v.caption} speaker={v.speaker} />
      <div
        className={`monster-slot mood-${v.mood}`}
        style={at(bubbleUp ? SCENE.monsterAside : MONSTER)}
        data-testid="monster"
        data-mood={v.mood}
      >
        <Monster
          id={order.monster}
          expression={v.mood === 'delight' || v.mood === 'eat' || v.mood === 'puzzled' ? v.mood : 'idle'}
          react={v.eat?.step === 'react'}
          // A first-try serve gets a bigger reaction (visual only, D45).
          className={v.eat?.firstTry && v.eat.step === 'react' ? 'big' : undefined}
          size={bubbleUp ? SCENE.monsterAside.w : MONSTER.w}
        />
      </div>
      {pipShown && (
        // Pip pops up from behind the counter: the well clips him at its far edge (D114).
        <div className="pip-well" style={{ ...at(pipRect), top: pipRect.y - 40, height: COUNTER_Y + 4 - pipRect.y + 40 }}>
          <div
            className={`pip-slot ${!v.pipOut ? 'leaving' : v.speaker === 'pip' ? 'talking' : ''}`}
            style={{ left: 0, top: 40, width: pipRect.w, height: pipRect.h }}
            data-testid={v.pipOut ? 'pip' : 'pip-leaving'}
          >
            <Pip />
          </div>
        </div>
      )}
      {bubbleUp && <ModelBubble rect={SCENE.bubble} frames={bubbleFrames(v.bubble!, food)} caption={v.bubbleCount} />}
      <Ticket
        key={v.index}
        rect={bubbleUp ? SCENE.ticketCounting : SCENE.ticket}
        tokens={tokens}
        food={food}
        solved={phase === 'eating' || phase === 'done' ? order.problem.answer : undefined}
        onTap={ctrl.replayTicket}
      />

      {/* ---- counter row: Pip and the bell on one side, tray, basket on the dominant side ---- */}
      {showTray && (
        <>
          {order.stage === 0 && (
            <div className="cloche-plate" style={at({ x: tray.x - PLATE_BLEED, y: tray.y + tray.h - 14, w: tray.w + 2 * PLATE_BLEED, h: 28 })} />
          )}
          <div
            className={`tray ${v.editable ? '' : 'locked'}`}
            style={v.eat ? { transform: `translateY(-${EAT_SLIDE}px)`, transition: 'transform 0.3s ease' } : undefined}
          >
            <TenFrame cells={cells.slice(0, 10)} {...frameProps} x={tray.x} handlers={trayHandlers} />
            {frames2 && (
              <TenFrame
                cells={cells.slice(10)}
                {...frameProps}
                x={tray.x + frameW + L.frame.framesGap}
                firstIndex={10}
                handlers={trayHandlers}
              />
            )}
          </div>
          {v.tray.takenAwayRow && (
            // In the basket's place (D117): on these forms tapping the basket does just what this does.
            <TapButton
              className={`taken-away ${cue === 'putBack' ? 'pulse' : ''}`}
              style={at(L.takenAway)}
              tapKind="button"
              testId="taken-away"
              label="Put one back"
              onTap={ctrl.tapTakenAway}
            >
              <TenFrame
                cells={Array.from({ length: plate?.source === 'taken' ? 0 : removed }, (_, k) => ({
                  food,
                  role: 'child' as const,
                  // S3 counts what was taken away, from one (D104).
                  pop: s3 && unknown ? k + 1 : undefined,
                }))}
                cell={TAKEN_CELL}
                gap={TAKEN_GAP}
                pad={TAKEN_PAD}
                x={0}
                y={0}
                className="taken"
              />
            </TapButton>
          )}
          {L.bin && (
            <Bin
              rect={L.bin}
              food={food}
              tall={L.tallBin}
              handlers={binHandlers}
              pulsing={cue === 'place' || cue === 'putBack'}
              wobble={v.binWobble}
            />
          )}
          {/* After the basket, so the lid is drawn over the heap's edge, not under it. */}
          {order.stage === 0 && <ClocheLid rect={L.lid} onTap={ctrl.lowerCloche} dim={v.cloche !== 'peek'} />}
        </>
      )}

      {v.padMode && (
        <div className="s0-pad">
          <PeekButton rect={L.peek} onTap={ctrl.peek} dim={v.attempt.phase !== 'building'} />
          <AnswerDisplay rect={L.display} value={v.typed} />
          <Backspace
            rect={L.backspace}
            onTap={ctrl.backspace}
            pulsing={v.correctTyped !== null && !v.correctTyped.startsWith(v.typed)}
          />
          {Array.from({ length: 10 }, (_, d) => (
            <DigitButton
              key={d}
              digit={d}
              rect={L.digit(d)}
              onTap={() => ctrl.digit(d)}
              pulsing={
                v.correctTyped !== null &&
                v.correctTyped.startsWith(v.typed) &&
                v.correctTyped[v.typed.length] === String(d)
              }
            />
          ))}
        </div>
      )}

      {v.ghost && <GhostHand target={v.ghost === 'bin' && L.bin ? L.bin : L.bell} name={v.ghost} />}
      {phase === 'offerHelp' && <HelpChoice yes={L.offerYes} no={L.offerNo} onYes={ctrl.help} onNo={ctrl.declineHelp} />}
      <PipHat rect={L.help} onTap={ctrl.help} pulsing={v.hatPulse || v.helpOffer || phase === 'offerHelp'} dim={lockedPhase} />
      <Bell
        rect={L.bell}
        onTap={ctrl.serve}
        dim={!v.canServe}
        pulsing={v.attempt.phase === 'followMe' && v.canServe}
        wobble={v.bellWobble}
      />

      {v.flights.map((f) => {
        const from = center(cellOf(f.from));
        const to = center(f.to === 'bin' && L.bin ? L.bin : L.takenAway);
        const style = {
          left: from.x - CELL / 2,
          top: from.y - CELL / 2,
          '--dx': `${to.x - from.x}px`,
          '--dy': `${to.y - from.y}px`,
        } as CSSProperties;
        return (
          <div key={f.id} className="flight" style={style} aria-hidden="true">
            {glyph}
          </div>
        );
      })}
      {v.drag && (
        <div className="drag-ghost" style={{ left: v.drag.x - CELL / 2, top: v.drag.y - CELL / 2 }} aria-hidden="true">
          {glyph}
        </div>
      )}
      {v.eat?.flown &&
        Array.from({ length: v.eat.plate.count }, (_, k) => {
          const p = v.eat!.plate;
          const r = p.source === 'pad' ? L.display : p.source === 'taken' ? takenRect(k, L.takenAway) : cellOf(p.from + k);
          const from = { x: r.x + r.w / 2, y: r.y + r.h / 2 - (p.source === 'tray' ? EAT_SLIDE : 0) };
          const style = {
            left: from.x - CELL / 2,
            top: from.y - CELL / 2,
            animationDelay: `${k * EAT_STAGGER_MS}ms`,
            '--dx': `${MOUTH.x - from.x}px`,
            '--dy': `${MOUTH.y - from.y}px`,
          } as CSSProperties;
          return (
            <div key={`e${k}`} className="eat-flight" style={style} aria-hidden="true">
              {glyph}
            </div>
          );
        })}
      {v.eat &&
        Array.from({ length: v.eat.coinsOut }, (_, k) => (
          // Coins rise from the monster up into the jar in the status bar (SPEC §9).
          <div
            key={`c${k}`}
            className="coin-flight"
            style={
              {
                left: MOUTH.x - 22,
                top: MOUTH.y - 60,
                '--dx': `${JAR.x + 35 - MOUTH.x}px`,
                '--dy': `${JAR.y + JAR.h / 2 - MOUTH.y + 60}px`,
              } as CSSProperties
            }
            aria-hidden="true"
          />
        ))}
      {v.attempt.phase === 'eating' && (
        // Any tap skips the eat/react time (SPEC §5.6, D56).
        <TapButton className="skip-layer" testId="skip" label="Skip" onTap={ctrl.skip}>
          {null}
        </TapButton>
      )}
    </div>
  );
}
