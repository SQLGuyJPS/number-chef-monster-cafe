import { EAT_STAGGER_MS } from '../../engine/eat';
import { useMemo, useState, type CSSProperties } from 'react';
import {
  BUTTON_MIN,
  CELL,
  CELL_GAP,
  FRAME,
  FRAME_PADDING,
  FRAMES_GAP,
  MONSTER_MOVE_MS,
  PIP_EXIT_MS,
  SERVICE as L,
  TAKEN_CELL,
  TAKEN_GAP,
  TAKEN_PAD,
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
import { useHold } from './useHold';
import {
  AnswerDisplay,
  Backspace,
  Bell,
  Bin,
  Caption,
  ClocheLid,
  DigitButton,
  DoorSign,
  GhostHand,
  HelpChoice,
  ModelBubble,
  PeekButton,
  PipHat,
  Queue,
  Ticket,
  at,
  type TicketToken,
} from './ServiceParts';
import { useService } from './useService';
import type { ServiceSummary } from './controller';
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
}

/** Tray rect for the layout (SPEC §3.3, §5.4). */
const trayRect = (frames2: boolean): Rect => (frames2 ? L.trayFrames2 : L.trayFrames1);

/** Logical rect of tray cell `i` (reading order, frame 1 first). */
function cellRect(i: number, frames2: boolean): Rect {
  const t = trayRect(frames2);
  const frame = Math.floor(i / 10);
  const j = i % 10;
  return {
    x: t.x + frame * (FRAME.w + FRAMES_GAP) + FRAME_PADDING + (j % 5) * (CELL + CELL_GAP),
    y: t.y + FRAME_PADDING + Math.floor(j / 5) * (CELL + CELL_GAP),
    w: CELL,
    h: CELL,
  };
}

/** Which cell a stage point is over (gaps count toward the nearer cell), or null. */
function cellAt(p: StagePoint, frames2: boolean): number | null {
  const n = frames2 ? 20 : 10;
  for (let i = 0; i < n; i++) if (inRect(p, cellRect(i, frames2), CELL_GAP / 2)) return i;
  return null;
}

const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/** Gone items render as empty cells so the remaining run is what the child sees (D30). */
function bubbleFrames(cells: ModelCell[], food: CellView['food']): CellView[][] {
  const shown: CellView[] = cells.map((c) => (c.gone ? {} : { food, role: c.role, pop: c.pop }));
  return shown.length > 10 ? [shown.slice(0, 10), shown.slice(10)] : [shown];
}

/** Where food and coins leave from / fly to (stage px). */
const MOUTH = { x: L.monsterZone.x + L.monsterZone.w / 2, y: L.monsterZone.y + L.monsterZone.h * 0.6 };
const JAR = { x: 1096, y: 590, w: 160, h: 96 };
/** The tray slides up toward the monster while it eats (SPEC §5.6). */
const EAT_SLIDE = 30;

export function ServiceScreen({ orders, seed, svc, dev, onDone, onCoins, onDoor, jar = 0 }: Props) {
  const [jarStart] = useState(jar);
  const { view: v, ctrl } = useService({ orders, seed, svc, dev, onDone, onCoins });
  const { order, task } = v;
  const food = order.food;
  const glyph = FOODS[food].glyph;
  const frames2 = task.layout === 'frames2';
  const tray = trayRect(frames2);

  // Created once: the gesture state inside must survive the re-renders a drag causes. They read
  // the controller's latest snapshot when they fire, never during render.
  const binHandlers = useMemo(
    () =>
      dragTapHandlers({
        layout: getStageLayout,
        inside: (p) => inRect(p, L.bin, 4),
        onTap: () => ctrl.tapBin(),
        onDragMove: (p) => ctrl.setDrag(p),
        // Dropping anywhere on the tray places into the next empty cell (SPEC §1.3).
        onDrop: (p) => {
          const f2 = ctrl.getView().task.layout === 'frames2';
          if (inRect(p, trayRect(f2), 24)) ctrl.tapBin();
          else ctrl.touch(); // dropped elsewhere: the item goes back
        },
      }),
    [ctrl],
  );
  const trayHandlers = useMemo(() => {
    const f2 = () => ctrl.getView().task.layout === 'frames2';
    return dragTapHandlers({
      layout: getStageLayout,
      inside: (p) => inRect(p, trayRect(f2()), 4),
      onTap: (_p, start) => {
        const i = cellAt(start, f2());
        if (i === null) return ctrl.touch();
        if (i < ctrl.getView().tray.filled) ctrl.tapItem(i);
        else ctrl.tapEmpty(i);
      },
      canDrag: (start) => {
        const i = cellAt(start, f2());
        return i !== null && i < ctrl.getView().tray.filled;
      },
      onDragMove: (p) => ctrl.setDrag(p),
      onDrop: (p) => {
        // Add mode: drag an item to the bin. Remove mode: drag it off the tray (SPEC §3.3).
        const add = ctrl.getView().tray.mode === 'add';
        if (add ? inRect(p, L.bin, 24) : !inRect(p, trayRect(f2()), 0)) ctrl.dragAway();
        else ctrl.touch();
      },
    });
  }, [ctrl]);

  const roles = ticketRoles(order.problem);
  const tokens: TicketToken[] = order.problem.display.map((t, i) => ({
    text: String(t),
    role: roles[i] === 'op' ? undefined : roles[i],
    blank: t === '?',
  }));

  const s3 = order.stage === 3;
  const cue = v.cue;
  // Eating: the flown plate leaves empty cells behind (SPEC §5.6).
  const eaten = v.eat?.flown ? v.eat.items : 0;
  const cells: CellView[] = Array.from({ length: v.tray.capacity }, (_, i) => {
    if (i < eaten) return {};
    if (i >= v.tray.filled) {
      // Empty cells glow too: the make-ten demo flashes the gap to ten (SPEC §5.5).
      return { pulse: cue === 'place' && i === v.tray.filled, glow: v.glow.includes(i) };
    }
    const role = i < v.tray.prefill ? 'prefill' : 'child';
    return {
      food,
      role,
      // S3: running counts pop on the child's items (SPEC §1.4, §3.2).
      pop: s3 && role === 'child' ? i + 1 : undefined,
      glow: v.glow.includes(i),
      pulse: cue === 'remove' && i === v.tray.filled - 1,
      fx: v.fx?.index === i ? v.fx.kind : undefined,
      nonce: v.fx?.index === i ? v.fx.nonce : 0,
    };
  });

  const showTray = !v.padMode;
  const bubbleUp = v.bubble !== null;
  // Pip steps back instead of vanishing; the line stays away until the monster is home (D91).
  const pipShown = useHold(v.pipOut, PIP_EXIT_MS);
  const lineAway = useHold(v.pipOut || bubbleUp, MONSTER_MOVE_MS);
  const removed = v.removed;
  const phase = v.attempt.phase;
  const lockedPhase = phase === 'plateCount' || phase === 'worked' || phase === 'eating';

  return (
    <div
      className={`screen service phase-${v.attempt.phase}`}
      data-testid="screen-service"
      data-phase={v.attempt.phase}
      data-stage={order.stage}
    >
      <div className="counter" aria-hidden="true" />
      <DoorSign rect={L.door} onTap={onDoor} />
      {/* The waiting line steps away while Pip is out or the bubble is up, so Pip stands on a clear
          counter (D90) and the monster never walks back over it (D91). */}
      {!lineAway && <Queue rect={L.queue} count={Math.max(0, v.remaining)} />}
      {/* The CountTogether bubble is Pip's speech while it shows (D76, D90). */}
      <Caption rect={L.caption} text={bubbleUp ? '' : v.caption} speaker={v.speaker} />

      <div
        className={`monster-slot mood-${v.mood}`}
        style={at(bubbleUp ? (v.pipOut ? L.monsterAsideForPip : L.monsterAside) : L.monsterZone)}
        data-testid="monster"
        data-mood={v.mood}
      >
        <Monster
          id={order.monster}
          expression={v.mood === 'delight' || v.mood === 'eat' || v.mood === 'puzzled' ? v.mood : 'idle'}
          react={v.eat?.step === 'react'}
          // A first-try serve gets a bigger reaction (visual only, D45).
          className={v.eat?.firstTry && v.eat.step === 'react' ? 'big' : undefined}
          size={bubbleUp ? L.monsterAside.w : L.monsterZone.w}
        />
      </div>
      {pipShown && (
        <div
          className={`pip-slot ${!v.pipOut ? 'leaving' : v.speaker === 'pip' ? 'talking' : ''}`}
          style={at(L.pip)}
          data-testid={v.pipOut ? 'pip' : 'pip-leaving'}
        >
          <Pip />
        </div>
      )}
      {bubbleUp && (
        <ModelBubble
          rect={L.bubble}
          frames={bubbleFrames(v.bubble!, food)}
          caption={v.bubbleCount}
        />
      )}
      <Ticket
        key={v.index}
        rect={bubbleUp ? L.ticketCounting : L.ticket}
        tokens={tokens}
        food={food}
        solved={phase === 'eating' || phase === 'done' ? order.problem.answer : undefined}
        onTap={ctrl.replayTicket}
      />

      {showTray && (
        <>
          {order.stage === 0 && (
            <div
              className="cloche-plate"
              style={at({ x: tray.x - 20, y: tray.y + tray.h - 14, w: tray.w + 40, h: 28 })}
            />
          )}
          <div
            className={`tray ${v.editable ? '' : 'locked'}`}
            style={v.eat ? { transform: `translateY(-${EAT_SLIDE}px)`, transition: 'transform 0.3s ease' } : undefined}
          >
            <TenFrame
              cells={cells.slice(0, 10)}
              cell={CELL}
              gap={CELL_GAP}
              pad={FRAME_PADDING}
              x={tray.x}
              y={tray.y}
              tapTargets
              testId="tray"
              handlers={trayHandlers}
            />
            {frames2 && (
              <TenFrame
                cells={cells.slice(10)}
                cell={CELL}
                gap={CELL_GAP}
                pad={FRAME_PADDING}
                x={tray.x + FRAME.w + FRAMES_GAP}
                y={tray.y}
                tapTargets
                testId="tray"
                firstIndex={10}
                handlers={trayHandlers}
              />
            )}
          </div>
          {v.tray.takenAwayRow && (
            <TapButton
              className={`taken-away ${cue === 'putBack' ? 'pulse' : ''}`}
              style={at(L.takenAway)}
              tapKind="button"
              testId="taken-away"
              label="Put one back"
              onTap={ctrl.tapTakenAway}
            >
              <TenFrame
                cells={Array.from({ length: removed }, () => ({ food, role: 'child' as const }))}
                cell={TAKEN_CELL}
                gap={TAKEN_GAP}
                pad={TAKEN_PAD}
                x={0}
                y={0}
                className="taken"
              />
            </TapButton>
          )}
          <Bin
            rect={L.bin}
            food={food}
            handlers={binHandlers}
            pulsing={cue === 'place' || (cue === 'putBack' && !v.tray.takenAwayRow)}
            wobble={v.binWobble}
          />
          {order.stage === 0 && (
            <ClocheLid rect={L.clocheLid} onTap={ctrl.lowerCloche} dim={v.cloche !== 'peek'} />
          )}
        </>
      )}

      {v.padMode && (
        <>
          <PeekButton rect={L.s0Peek} onTap={ctrl.peek} dim={v.attempt.phase !== 'building'} />
          <AnswerDisplay rect={L.s0Display} value={v.typed} />
          <Backspace
            rect={L.s0Backspace}
            onTap={ctrl.backspace}
            pulsing={v.correctTyped !== null && !v.correctTyped.startsWith(v.typed)}
          />
          {Array.from({ length: 10 }, (_, d) => (
            <DigitButton
              key={d}
              digit={d}
              rect={{
                x: L.s0Digits.x + d * (BUTTON_MIN + L.s0DigitGap),
                y: L.s0Digits.y,
                w: BUTTON_MIN,
                h: BUTTON_MIN,
              }}
              onTap={() => ctrl.digit(d)}
              pulsing={
                v.correctTyped !== null &&
                v.correctTyped.startsWith(v.typed) &&
                v.correctTyped[v.typed.length] === String(d)
              }
            />
          ))}
        </>
      )}

      {v.ghost && <GhostHand target={v.ghost === 'bin' ? L.bin : L.bell} name={v.ghost} />}
      {phase === 'offerHelp' && (
        <HelpChoice yes={L.offerYes} no={L.offerNo} onYes={ctrl.help} onNo={ctrl.declineHelp} />
      )}
      <PipHat
        rect={L.help}
        onTap={ctrl.help}
        pulsing={v.hatPulse || v.helpOffer || phase === 'offerHelp'}
        dim={lockedPhase}
      />
      <Bell
        rect={L.bell}
        onTap={ctrl.serve}
        dim={!v.canServe}
        pulsing={v.attempt.phase === 'followMe' && v.canServe}
        wobble={v.bellWobble}
      />

      {v.flights.map((f) => {
        const from = center(cellRect(f.from, frames2));
        const to = center(f.to === 'bin' ? L.bin : L.takenAway);
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
        <div
          className="drag-ghost"
          style={{ left: v.drag.x - CELL / 2, top: v.drag.y - CELL / 2 }}
          aria-hidden="true"
        >
          {glyph}
        </div>
      )}
      {v.eat?.flown &&
        Array.from({ length: v.eat.items }, (_, k) => {
          const r = v.padMode ? L.s0Display : cellRect(k, frames2);
          const from = { x: r.x + r.w / 2, y: r.y + r.h / 2 - (v.padMode ? 0 : EAT_SLIDE) };
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
          <div
            key={`c${k}`}
            className="coin-flight"
            style={
              {
                left: MOUTH.x - 22,
                top: MOUTH.y - 60,
                '--dx': `${JAR.x + 40 - MOUTH.x}px`,
                '--dy': `${JAR.y + JAR.h / 2 - MOUTH.y + 60}px`,
              } as CSSProperties
            }
            aria-hidden="true"
          />
        ))}
      <div className="service-jar" style={at(JAR)} data-testid="service-jar" data-count={jarStart + v.landed}>
        <span className="coin-icon" aria-hidden="true" />
        <span className="coin-count">{jarStart + v.landed}</span>
      </div>
      {v.attempt.phase === 'eating' && (
        // Any tap skips the eat/react time (SPEC §5.6, D56).
        <TapButton className="skip-layer" testId="skip" label="Skip" onTap={ctrl.skip}>
          {null}
        </TapButton>
      )}
    </div>
  );
}
