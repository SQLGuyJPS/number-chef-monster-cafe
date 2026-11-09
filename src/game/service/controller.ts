// Service controller (SPEC §3.4, §5.4–5.6). All teaching decisions come from the engine; this
// class only sequences them in time, keeps the view model and talks to speech/SFX through injected
// deps. Scripted parts (PlateCount, CountTogether, Worked, eating) await speech that always
// resolves (SPEC §8.1), so nothing here can hang on a missing `end` event.
import { initialAttempt, plateCountLine, stepAttempt, trayEditable, type AttemptState, type Outcome } from '../../engine/attempt';
import { BELL_GUARD_MS, BELL_LEAD_MS, COINS_PER_PROBLEM, HAT_PULSE_IDLE_MS } from '../../engine/config';
import { countTogetherTicks, type ModelCell } from '../../engine/countTogether';
import { buildDemo, followMeCue, type FollowMeCue } from '../../engine/demos';
import { attemptEvent, coinEvent, type FrozenEvt } from '../../engine/events';
import { numberToWords } from '../../engine/numberWords';
import { phrase, type PhraseKey, type PhraseParams } from '../../engine/phrases';
import { REGULARS, type MonsterRef } from '../../engine/monsters';
import { hashSeed, mulberry32, type Rng } from '../../engine/rng';
import { withRequeue, type Order } from '../../engine/session';
import {
  check,
  isStartState,
  removeLast,
  removedCount,
  startState,
  tapBin,
  tapItem,
  tapTakenAway,
  toTrayTask,
  type TrayEffect,
  type TrayResult,
  type TrayState,
} from '../../engine/tray';
import type { TrayTask } from '../../engine/types';

/** S0 cloche (D41, D62): down = number pad; peek = the child lifted it; model = Worked/FollowMe. */
export type Cloche = 'down' | 'peek' | 'model';
export type Mood = 'arrive' | 'idle' | 'puzzled' | 'delight' | 'leave';
/** Who says the caption line: the monster orders and reacts; Pip gives the help (SPEC §7.3, D90). */
export type Speaker = 'monster' | 'pip';

export interface Flight {
  id: number;
  from: number; // tray cell index
  to: 'bin' | 'taken';
}

interface State {
  index: number;
  tray: TrayState;
  attempt: AttemptState;
  /** Worked + FollowMe use the S3 tray at every stage (D71). */
  demoTray: boolean;
  typed: string;
  cloche: Cloche;
  /** S0 FollowMe: the cloche tray is complete; the digits are back for typing (D41). */
  s0Typing: boolean;
  glow: number[];
  caption: string;
  speaker: Speaker;
  bubble: ModelCell[] | null;
  bubbleCount: string;
  counting: boolean;
  mood: Mood;
  fx: { index: number; kind: 'shake' | 'in'; nonce: number } | null;
  binWobble: number;
  bellWobble: number;
  flights: Flight[];
  hatPulse: boolean;
  /** After the first miss Pip's hat pulses as a quiet offer until the next serve or Help (D89). */
  helpOffer: boolean;
  drag: { x: number; y: number } | null;
  finished: boolean;
}

/** What the screen renders: the state plus everything derived from the engine. */
export interface ServiceView extends State {
  /** Pip is out beside the monster: offering help or giving it (D90). */
  pipOut: boolean;
  order: Order;
  task: TrayTask;
  padMode: boolean;
  cue: FollowMeCue | null;
  canServe: boolean;
  editable: boolean;
  /** S0 FollowMe typing: the number to enter, for the digit pulse. */
  correctTyped: string | null;
  removed: number;
  /** Silhouettes in the waiting line: orders still to come, requeues included (SPEC §5.4). */
  remaining: number;
  /** Coins earned this service, from its `coin` events (in memory until M3a, D51). */
  coins: number;
}

export interface ServiceDeps {
  /** Pip speaks in a higher voice so the child hears who is talking (D90). */
  speak(text: string, who?: Speaker): Promise<void>;
  /** Latest-wins counting voice (SPEC §3.3). */
  countAloud(text: string): void;
  hush(): void;
  sfx: { place(n: number): void; remove(): void; bell(): void; correct(): void; hm(): void; wobble(): void };
  /** Monotonic ms. */
  now(): number;
  /** Epoch ms for event timestamps. */
  wall(): number;
  newId(): string;
  /** Scales scripted waits (1 in normal builds; e2e fast-forward). */
  timeScale(): number;
  setTimeout(f: () => void, ms: number): number;
  clearTimeout(id: number): void;
}

export interface ServiceOptions {
  orders: Order[];
  svc: string;
  dev: string;
  onDone: () => void;
  /** The service seed; requeue placement draws from it too, so a seeded service stays deterministic. */
  seed?: number;
  monsters?: readonly MonsterRef[];
}

/** Pip stands beside the monster while help is offered or given (D90). */
const PIP_PHASES = new Set(['countTogether', 'offerHelp', 'worked', 'followMe']);

const say = (key: PhraseKey, params: PhraseParams = {}) => phrase(key, params);

/** The spoken order: result forms get the café wrapping with the food (SPEC §4). */
export function ticketLine(o: Order): string {
  const p = o.problem;
  const [a, b] = p.operands;
  if (p.form === 'add') return say('order.add', { a: a!, b: b!, food: o.food });
  if (p.form === 'sub') return say('order.sub', { a: a!, b: b!, food: o.food });
  return p.spoken;
}

export class ServiceController {
  private s: State;
  private snap: ServiceView;
  private listeners = new Set<() => void>();
  private script = 0; // bumped to cancel the running script
  private lastBell = -Infinity;
  private lastInput: number;
  private orderStarted: number;
  private skipEat: (() => void) | null = null;
  private nonce = 0;
  private flightId = 0;
  private idleTimer: number | null = null;
  /** Bumped per spoken ticket; the ticket is still talking while `ticketTalking` is set (D88). */
  private ticketTok = 0;
  private ticketTalking = false;
  private disposed = false;
  readonly events: FrozenEvt[] = [];
  /** The planned orders; an `assisted` order brings its monster back later (SPEC §4.1 step 7). */
  private orders: Order[];
  private readonly requeueRng: Rng;

  constructor(
    private readonly opts: ServiceOptions,
    private readonly d: ServiceDeps,
  ) {
    this.orders = opts.orders.slice();
    this.requeueRng = mulberry32(hashSeed(opts.seed ?? 0, 'requeue'));
    this.lastInput = d.now();
    this.orderStarted = d.now();
    this.s = this.fresh(0);
    this.snap = this.derive();
  }

  // ---------- store ----------
  subscribe = (f: () => void): (() => void) => {
    this.listeners.add(f);
    return () => this.listeners.delete(f);
  };
  getView = (): ServiceView => this.snap;

  private set(patch: Partial<State> | ((s: State) => Partial<State>)): void {
    const p = typeof patch === 'function' ? patch(this.s) : patch;
    this.s = { ...this.s, ...p };
    this.maybeStartS0Typing();
    this.snap = this.derive();
    this.listeners.forEach((f) => f());
  }

  private wait(ms: number): Promise<void> {
    return new Promise((r) => this.d.setTimeout(r, ms * this.d.timeScale()));
  }

  // ---------- derived ----------
  private get order(): Order {
    return this.orders[this.s.index]!;
  }
  private get stage() {
    return this.order.stage;
  }
  /** The tray shown: S1 builds the unknown; otherwise (and for every demo) the S3 tray (D71). */
  private trayTask(s: State = this.s): TrayTask {
    const o = this.orders[s.index]!;
    return toTrayTask(o.problem, o.stage === 1 && !s.demoTray ? 1 : o.stage === 0 ? 3 : o.stage);
  }
  private entryTask(): TrayTask {
    return toTrayTask(this.order.problem, this.stage);
  }
  private cueOf(s: State): FollowMeCue | null {
    return s.attempt.phase === 'followMe' && !s.s0Typing ? followMeCue(s.tray, this.trayTask(s).expected.cells) : null;
  }
  private correctNow(s: State): boolean {
    if (this.stage === 0 && (s.cloche === 'down' || s.s0Typing)) {
      return check(this.entryTask(), { filled: s.tray.filled, typed: s.typed === '' ? null : Number(s.typed) });
    }
    return check(this.trayTask(s), s.tray);
  }
  private canServe(s: State): boolean {
    const ph = s.attempt.phase;
    if (s.counting) return false;
    if (ph !== 'building' && ph !== 'countTogether' && ph !== 'followMe') return false;
    // FollowMe: the bell lights only once the tray (or, at S0, the typed number) is right.
    if (ph === 'followMe') return this.stage === 0 ? s.s0Typing && this.correctNow(s) : this.correctNow(s);
    if (this.stage === 0) return s.cloche === 'down' && s.typed !== ''; // D41: disabled while empty
    return !isStartState(s.tray); // SPEC §3.3 anti-mash
  }
  private editable(s: State): boolean {
    if (!trayEditable(s.attempt.phase)) return false;
    if (this.stage === 0 && s.cloche === 'down') return false;
    return !(s.attempt.phase === 'followMe' && s.s0Typing);
  }
  private derive(): ServiceView {
    const s = this.s;
    const followTyping = this.stage === 0 && s.attempt.phase === 'followMe' && s.s0Typing;
    return {
      ...s,
      pipOut: PIP_PHASES.has(s.attempt.phase),
      order: this.order,
      task: this.trayTask(s),
      padMode: this.stage === 0 && s.cloche === 'down',
      cue: this.cueOf(s),
      canServe: this.canServe(s),
      editable: this.editable(s),
      correctTyped: followTyping ? String(this.order.problem.answer) : null,
      removed: removedCount(s.tray),
      remaining: this.orders.length - s.index - 1,
      coins: this.events.filter((e) => e.k === 'coin').reduce((n, e) => n + (e as { n: number }).n, 0),
    };
  }

  /** e2e state dump (SPEC §13.5). */
  probe() {
    const v = this.snap;
    return {
      index: v.index,
      orders: this.orders.length,
      phase: v.attempt.phase,
      speaker: v.speaker,
      pipOut: v.pipOut,
      attempt: v.attempt.attempt,
      stage: v.order.stage,
      form: v.order.problem.form,
      display: v.order.problem.display.join(' '),
      factKey: v.order.problem.factKey,
      requeue: !!v.order.requeue,
      monster: v.order.monster,
      remaining: v.remaining,
      coins: v.coins,
      answer: v.order.problem.answer,
      mode: v.tray.mode,
      filled: v.tray.filled,
      prefill: v.tray.prefill,
      expectedCells: v.task.expected.cells,
      removed: v.removed,
      typed: v.typed,
      cloche: v.cloche,
      s0Typing: v.s0Typing,
      counting: v.counting,
      demoTray: v.demoTray,
      helpOffer: v.helpOffer,
      canServe: v.canServe,
      cue: v.cue,
      caption: v.caption,
      events: this.events,
    };
  }

  // ---------- lifecycle ----------
  private fresh(index: number): State {
    const o = this.orders[index]!;
    return {
      index,
      tray: startState(toTrayTask(o.problem, o.stage === 0 ? 3 : o.stage)),
      attempt: initialAttempt(),
      demoTray: false,
      typed: '',
      cloche: 'down',
      s0Typing: false,
      glow: [],
      caption: ticketLine(o),
      speaker: 'monster',
      bubble: null,
      bubbleCount: '',
      counting: false,
      mood: 'arrive',
      fx: null,
      binWobble: 0,
      bellWobble: 0,
      flights: [],
      hatPulse: false,
      helpOffer: false,
      drag: null,
      finished: false,
    };
  }

  start(): void {
    this.disposed = false;
    this.startOrder(0);
    this.scheduleIdle();
  }

  dispose(): void {
    this.disposed = true;
    this.script++;
    if (this.idleTimer !== null) this.d.clearTimeout(this.idleTimer);
    this.d.hush();
  }

  private startOrder(index: number): void {
    const my = ++this.script;
    this.orderStarted = this.d.now();
    this.lastInput = this.d.now();
    this.s = this.fresh(index);
    this.set({});
    this.speakTicket(true);
    void this.wait(600).then(() => my === this.script && this.set({ mood: 'idle' }));
  }

  /** `arrival`: a returning monster first says it is back (SPEC §4.1 step 7); replays skip that. */
  private speakTicket(arrival = false): void {
    const t = ++this.ticketTok;
    this.ticketTalking = true;
    const back = arrival && this.order.requeue;
    void (back ? this.d.speak(say('order.back')) : Promise.resolve())
      .then(() => (t === this.ticketTok ? this.d.speak(ticketLine(this.order)) : undefined))
      .then(() => {
        if (t === this.ticketTok) this.ticketTalking = false;
      });
  }

  /**
   * The child started building while the order was still being read: stop the order at once so the
   * tap's tone and count are heard and nothing waits for the line (D88). No AudioContext rebuild
   * here: the engine is still tearing the line down, which is when a new context took the audio
   * session from speech (D87). The tone resumes the context; a later tap rebuilds it if needed.
   */
  private cutTicket(): void {
    if (!this.ticketTalking) return;
    this.ticketTalking = false;
    this.ticketTok++;
    this.d.hush();
  }

  /** Idle cue (SPEC §3.2): Pip's hat pulses after 10 s at S3. The ticket is never re-spoken on idle (D81). */
  private scheduleIdle(): void {
    if (this.disposed) return;
    this.idleTimer = this.d.setTimeout(() => {
      const s = this.s;
      if (s.attempt.phase === 'building' && !s.finished) {
        const idle = this.d.now() - this.lastInput;
        if (this.stage === 3 && idle > HAT_PULSE_IDLE_MS && !s.hatPulse) this.set({ hatPulse: true });
      }
      this.scheduleIdle();
    }, 1000);
  }

  /** S0 FollowMe: once the cloche tray is complete the digits come back for the final typing (D41). */
  private maybeStartS0Typing(): void {
    const s = this.s;
    if (this.stage !== 0 || s.attempt.phase !== 'followMe' || s.s0Typing) return;
    if (followMeCue(s.tray, this.trayTask(s).expected.cells) !== 'bell') return;
    this.s = { ...s, s0Typing: true, cloche: 'down', typed: '', caption: say('follow.type'), speaker: 'pip' };
    void this.d.speak(say('follow.type'), 'pip');
  }

  // ---------- scripts ----------
  private record(outcome: Outcome): void {
    const ctx = { id: () => this.d.newId(), now: () => this.d.wall(), dev: this.opts.dev };
    const o = this.order;
    // In memory until M3a persists them (D51); the shapes are frozen (SPEC §11.2).
    this.events.push(
      attemptEvent(ctx, {
        svc: this.opts.svc,
        fact: o.problem.factKey,
        skill: o.problem.skill,
        stage: o.stage,
        outcome,
        ms: this.d.now() - this.orderStarted,
      }),
      coinEvent(ctx, { svc: this.opts.svc, n: COINS_PER_PROBLEM }),
    );
    // SPEC §4.1 step 7: an assisted fact comes back with the same monster, one step more support.
    if (outcome === 'assisted') {
      const next = withRequeue(this.orders, this.s.index, this.requeueRng, this.opts.monsters ?? REGULARS);
      if (next) this.orders = next;
    }
  }

  private async runEat(my: number): Promise<void> {
    const n = this.order.problem.answer;
    this.d.sfx.correct();
    this.set({ mood: 'delight', caption: say('serve.yum', { n }), speaker: 'monster', bubble: null, counting: false, glow: [] });
    // Let the bell ring out before "Yum!" (D86).
    await this.wait(BELL_LEAD_MS);
    if (my !== this.script) return;
    void this.d.speak(say('serve.yum', { n }));
    // Eat + react; any tap skips ahead (SPEC §5.6, D56). The full eat sequence is M2 (D66).
    await Promise.race([this.wait(1600), new Promise<void>((r) => (this.skipEat = r))]);
    this.skipEat = null;
    if (my !== this.script) return;
    this.set((s) => ({ attempt: stepAttempt(s.attempt, { type: 'phaseDone' }), mood: 'leave' }));
    await this.wait(350);
    if (my !== this.script) return;
    const next = this.s.index + 1;
    if (next < this.orders.length) {
      this.startOrder(next);
      return;
    }
    this.set({ finished: true, caption: say('service.closed'), speaker: 'monster', mood: 'delight' });
    await this.d.speak(say('service.closed'));
    await this.wait(600);
    if (my === this.script) this.opts.onDone();
  }

  private async runCountTogether(my: number): Promise<void> {
    const ticks = countTogetherTicks(this.order.problem);
    this.set({ counting: true, bubble: ticks[0]!.cells, bubbleCount: '', mood: 'idle', caption: say('ct.start'), speaker: 'pip' });
    await this.d.speak(say('ct.start'), 'pip');
    for (const t of ticks.slice(1)) {
      if (my !== this.script) return;
      const line = say(t.key, t.params);
      this.set({ bubble: t.cells, bubbleCount: line });
      await Promise.all([this.d.speak(line, 'pip'), this.wait(450)]);
    }
    if (my !== this.script) return;
    // The bubble stays up as a model until the next serve (D68); the tray was editable throughout.
    this.set((s) => ({ counting: false, attempt: stepAttempt(s.attempt, { type: 'phaseDone' }) }));
  }

  private async runWorked(my: number): Promise<void> {
    const t3 = toTrayTask(this.order.problem, 3);
    this.set({
      demoTray: true,
      tray: startState(t3),
      bubble: null,
      counting: false,
      glow: [],
      typed: '',
      cloche: this.stage === 0 ? 'model' : 'down',
      mood: 'idle',
    });
    for (const step of buildDemo(this.order.problem)) {
      if (my !== this.script) return;
      let tray = this.s.tray;
      // No place/remove tones in the demo: Pip's counting is the sound, and tones stepped on it (D91).
      if (step.trayOp.op === 'add') {
        tray = tapBin(tray).state;
      } else if (step.trayOp.op === 'remove') {
        const r = removeLast(tray);
        tray = r.state;
        this.flyAway(r.effect);
      }
      const line = say(step.narrationKey, step.params);
      this.set({ tray, glow: step.trayOp.op === 'glow' ? step.trayOp.cells : [], caption: line, speaker: 'pip' });
      await Promise.all([this.d.speak(line, 'pip'), this.wait(step.holdMs)]);
    }
    if (my !== this.script) return;
    // FollowMe: the tray resets to the start and the child repeats the steps (SPEC §5.5).
    this.set((s) => ({
      attempt: stepAttempt(s.attempt, { type: 'phaseDone' }),
      tray: startState(t3),
      glow: [],
      caption: say('follow.start'),
      speaker: 'pip',
    }));
    void this.d.speak(say('follow.start'), 'pip');
  }

  private async runPlate(my: number, served: number, expected: number): Promise<void> {
    this.d.sfx.hm();
    const line = plateCountLine(served, expected, this.stage);
    const text = say(line.key, line.params);
    this.set({ mood: 'puzzled', caption: text, speaker: 'monster', bubble: null, counting: false });
    await this.wait(BELL_LEAD_MS); // the bell first, then the monster (D86)
    if (my !== this.script) return;
    await Promise.all([this.d.speak(text), this.wait(900)]);
    if (my !== this.script) return;
    const next = stepAttempt(this.s.attempt, { type: 'phaseDone' });
    this.lastInput = this.d.now();
    // First miss: back to building at once with the hat pulsing as an offer (D89).
    this.set({ attempt: next, mood: 'idle', typed: '', helpOffer: next.phase === 'building' });
    if (next.phase === 'offerHelp') {
      const ask = say('offer.help');
      this.set({ caption: ask, speaker: 'monster', mood: 'puzzled' });
      void this.d.speak(ask);
    } else if (next.phase === 'worked') void this.runWorked(my);
  }

  // ---------- tray feedback ----------
  private flyAway(e: TrayEffect): void {
    if (e.kind !== 'removed') return;
    const id = ++this.flightId;
    const to = this.s.tray.takenAwayRow ? 'taken' : 'bin';
    this.set((s) => ({ flights: [...s.flights, { id, from: e.index, to }] }));
    this.d.setTimeout(() => this.set((s) => ({ flights: s.flights.filter((f) => f.id !== id) })), 450);
  }

  private applyTray(r: TrayResult): void {
    const e = r.effect;
    // S3 counts aloud (counting on / counting back); S2 and below: tones only (SPEC §3.2). A tap
    // gets a count or a tone, never both: the tone stepped on the spoken number (D91).
    const voice = this.stage === 3;
    const cue = (count: number, tone: () => void) => (voice ? this.d.countAloud(numberToWords(count)) : tone());
    const fx = (kind: 'shake' | 'in', index: number) => ({ index, kind, nonce: ++this.nonce });
    switch (e.kind) {
      case 'placed':
      case 'putBack':
        cue(e.count, () => this.d.sfx.place(e.count));
        this.set({ tray: r.state, fx: fx('in', e.index) });
        break;
      case 'removed':
        cue(e.count, () => this.d.sfx.remove());
        this.set({ tray: r.state });
        this.flyAway(e);
        break;
      case 'shakeLocked':
        this.d.sfx.wobble();
        this.set({ fx: fx('shake', e.index) });
        break;
      case 'wobbleBin':
        this.d.sfx.wobble();
        this.set((s) => ({ binWobble: s.binWobble + 1 }));
        break;
      case 'none':
        break;
    }
  }

  private act(f: (s: TrayState) => TrayResult): void {
    this.touch();
    if (!this.editable(this.s)) return;
    this.cutTicket();
    this.applyTray(f(this.s.tray));
  }

  // ---------- actions (bound, so the screen can pass them straight to handlers) ----------
  touch = (): void => {
    this.lastInput = this.d.now();
    if (this.s.hatPulse) this.set({ hatPulse: false });
  };

  tapBin = (): void => this.act(tapBin);
  tapItem = (i: number): void => this.act((s) => tapItem(s, i));
  /** FollowMe: tapping the pulsing empty cell places too. */
  tapEmpty = (i: number): void =>
    this.act((s) => (i === s.filled && this.cueOf(this.s) === 'place' ? tapBin(s) : { state: s, effect: { kind: 'none' } }));
  tapTakenAway = (): void => this.act(tapTakenAway);
  dragAway = (): void => this.act(removeLast);
  setDrag = (drag: { x: number; y: number } | null): void => this.set({ drag });

  serve = (): void => {
    this.touch();
    const now = this.d.now();
    if (now - this.lastBell < BELL_GUARD_MS) return;
    this.lastBell = now;
    const s = this.s;
    if (!this.canServe(s)) {
      this.d.sfx.wobble();
      this.set({ bellWobble: s.bellWobble + 1 });
      return;
    }
    this.d.sfx.bell();
    this.ticketTalking = false; // the monster's next line replaces the order; taps must not cut it
    const correct = this.correctNow(s);
    const next = stepAttempt(s.attempt, { type: 'serve', correct });
    const my = ++this.script;
    this.set({ attempt: next, bubble: null, counting: false, glow: [], hatPulse: false, helpOffer: false });
    if (next.phase === 'eating') {
      this.record(next.outcome!);
      void this.runEat(my);
    } else if (next.phase === 'plateCount') {
      const s0 = this.stage === 0;
      const served = s0 ? Number(s.typed) : s.tray.filled;
      const expected = s0 ? this.order.problem.answer : this.trayTask(s).expected.cells;
      void this.runPlate(my, served, expected);
    }
  };

  help = (): void => {
    this.touch();
    const s = this.s;
    const next = stepAttempt(s.attempt, { type: 'help' });
    if (next === s.attempt) return;
    const my = ++this.script;
    this.ticketTalking = false; // Pip's lines follow; taps must not cut them
    this.hushIfOffer(s);
    this.set({ attempt: next, hatPulse: false, helpOffer: false, cloche: s.cloche === 'peek' ? 'down' : s.cloche });
    if (next.phase === 'countTogether') void this.runCountTogether(my);
    else if (next.phase === 'worked') void this.runWorked(my);
  };

  /** "No" to the help offer: the monster repeats the order and the child tries again (D89). */
  declineHelp = (): void => {
    this.touch();
    const s = this.s;
    const next = stepAttempt(s.attempt, { type: 'declineHelp' });
    if (next === s.attempt) return;
    ++this.script;
    this.hushIfOffer(s);
    this.lastInput = this.d.now();
    this.set({ attempt: next, caption: ticketLine(this.order), speaker: 'monster', mood: 'idle' });
    this.speakTicket();
  };

  /** A choice made while the question is still being asked cuts it off, so the answer is heard at once. */
  private hushIfOffer(s: State): void {
    if (s.attempt.phase === 'offerHelp') this.d.hush();
  }

  /** S0 Peek lifts the cloche on the S3 model; counts as Help (D41). */
  peek = (): void => {
    this.touch();
    const s = this.s;
    if (this.stage !== 0 || s.cloche !== 'down' || s.attempt.phase !== 'building') return;
    this.set({
      attempt: stepAttempt(s.attempt, { type: 'peek' }),
      cloche: 'peek',
      tray: startState(toTrayTask(this.order.problem, 3)),
    });
  };

  lowerCloche = (): void => {
    this.touch();
    if (this.s.cloche === 'peek') this.set({ cloche: 'down' });
  };

  digit = (d: number): void => {
    this.touch();
    const s = this.s;
    const padOpen = s.cloche === 'down' || s.s0Typing;
    if (this.stage !== 0 || !padOpen || !trayEditable(s.attempt.phase) || s.typed.length >= 2) return;
    this.cutTicket();
    this.d.sfx.place(d === 0 ? 10 : d);
    // One display that always takes up to two digits (D32); a lone leading zero is replaced.
    this.set({ typed: s.typed === '0' ? String(d) : s.typed + String(d) });
  };

  backspace = (): void => {
    this.touch();
    const s = this.s;
    if (this.stage !== 0 || s.typed === '' || !trayEditable(s.attempt.phase)) return;
    this.cutTicket();
    this.d.sfx.remove();
    this.set({ typed: s.typed.slice(0, -1) });
  };

  replayTicket = (): void => {
    this.touch();
    this.speakTicket();
  };

  skip = (): void => this.skipEat?.();
}
