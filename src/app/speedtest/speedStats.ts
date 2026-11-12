// Device speed test (SPEC §2.4, D112): the plan of ramp steps, the "smooth" rule, the budget it
// recommends and the text report. Pure, so the rules are unit-tested; the screen only measures.

export type RampKind = 'still' | 'moving';

export interface SpeedPlan {
  /** Extra SVG elements added per step, on top of the café scene and the live monster. */
  steps: number[];
  warmupMs: number;
  measureMs: number;
}

/** About 5 s a step; each ramp stops at the first step that is not smooth (after one retry). */
export const FULL_PLAN: SpeedPlan = {
  steps: [250, 500, 1000, 1500, 2000, 3000, 4000, 6000, 8000],
  warmupMs: 1000,
  measureMs: 4000,
};

/** `?speedtest=quick`: a few short steps, for e2e and a quick look; not for setting budgets. */
export const QUICK_PLAN: SpeedPlan = { steps: [250, 500, 1000], warmupMs: 150, measureMs: 400 };

/** A frame longer than this missed 30 fps: the child sees a hitch. */
export const SLOW_FRAME_MS = 34;
/** Smooth = at most 2% hitches and a typical frame at 50 fps or better (works at 60 and 120 Hz). */
export const MAX_SLOW_SHARE = 0.02;
export const MAX_MEDIAN_MS = 20;
/** The budget keeps this share of the last smooth count: headroom for heat, battery and new art. */
export const BUDGET_SHARE = 0.6;

export interface FrameSummary {
  frames: number;
  medianMs: number;
  p95Ms: number;
  worstMs: number;
  slowShare: number;
}

export function summarize(deltas: readonly number[]): FrameSummary {
  if (deltas.length === 0) return { frames: 0, medianMs: 0, p95Ms: 0, worstMs: 0, slowShare: 1 };
  const s = [...deltas].sort((a, b) => a - b);
  const at = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))]!;
  return {
    frames: s.length,
    medianMs: at(0.5),
    p95Ms: at(0.95),
    worstMs: s[s.length - 1]!,
    slowShare: s.filter((d) => d > SLOW_FRAME_MS).length / s.length,
  };
}

export function isSmooth(f: FrameSummary): boolean {
  return f.frames > 0 && f.slowShare <= MAX_SLOW_SHARE && f.medianMs <= MAX_MEDIAN_MS;
}

export interface StepResult extends FrameSummary {
  kind: RampKind | 'base';
  /** Extra elements asked for (0 for the base scene). */
  added: number;
  /** SVG elements actually on screen, counted after the step rendered. */
  elements: number;
  smooth: boolean;
}

export interface RampVerdict {
  kind: RampKind;
  /** Most on-screen elements that stayed smooth; null if even the first step was not. */
  lastSmooth: number | null;
  /** On-screen elements at the first step that was not smooth; null if every step was. */
  firstRough: number | null;
  /** Recommended on-screen budget (rounded down to 50), or null when nothing was smooth. */
  budget: number | null;
}

export function rampVerdict(kind: RampKind, results: readonly StepResult[]): RampVerdict {
  const steps = results.filter((r) => r.kind === kind);
  let lastSmooth: number | null = null;
  let firstRough: number | null = null;
  for (const r of steps) {
    if (r.smooth && firstRough === null) lastSmooth = r.elements;
    if (!r.smooth && firstRough === null) firstRough = r.elements;
  }
  const budget = lastSmooth === null ? null : Math.floor((lastSmooth * BUDGET_SHARE) / 50) * 50;
  return { kind, lastSmooth, firstRough, budget };
}

/** iOS Low Power Mode caps Safari at 30 fps: the base scene then runs at ~33 ms a frame. */
export function looksCappedAt30(base: FrameSummary): boolean {
  return base.frames > 0 && base.medianMs > 28 && base.medianMs < 40;
}

export interface ReportContext {
  version: string;
  date: string;
  userAgent: string;
  viewport: string;
  standalone: boolean;
  reducedMotion: boolean;
  quick: boolean;
  aborted?: string;
}

const ms = (n: number) => `${n.toFixed(1)} ms`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function verdictLine(v: RampVerdict, finished: boolean): string {
  const name = v.kind === 'still' ? 'Still elements' : 'Moving elements';
  if (v.lastSmooth === null) return `${name}: not smooth even at the first step.`;
  const where =
    v.firstRough === null
      ? `smooth up to ${v.lastSmooth}${finished ? ' (the most tested; no limit found)' : ''}`
      : `smooth up to ${v.lastSmooth}, rough at ${v.firstRough}`;
  return `${name}: ${where}. Suggested budget ${v.budget}.`;
}

export function formatReport(results: readonly StepResult[], ctx: ReportContext): string {
  const base = results.find((r) => r.kind === 'base');
  const still = rampVerdict('still', results);
  const moving = rampVerdict('moving', results);
  const lines = [
    'Number Chef speed test',
    `Version ${ctx.version} · ${ctx.date}${ctx.quick ? ' · QUICK (not for budgets)' : ''}`,
    `Device: ${ctx.userAgent}`,
    `Screen: ${ctx.viewport} · Home Screen app: ${ctx.standalone ? 'yes' : 'no'}`,
  ];
  if (ctx.aborted) lines.push(`Stopped early: ${ctx.aborted}`);
  if (ctx.reducedMotion)
    lines.push('Warning: Reduce Motion is on, so nothing moved during the test.');
  if (base && looksCappedAt30(base))
    lines.push('Warning: frames look capped at 30 fps (Low Power Mode?).');
  if (base && !base.smooth) lines.push('Warning: the café scene alone was not smooth.');
  lines.push('');
  if (base) lines.push(`Base scene: ${base.elements} elements, median ${ms(base.medianMs)}.`);
  lines.push(verdictLine(still, !ctx.aborted), verdictLine(moving, !ctx.aborted), '');
  lines.push('ramp | elements | median | p95 | worst | hitches | smooth');
  for (const r of results) {
    lines.push(
      [
        r.kind,
        r.elements,
        ms(r.medianMs),
        ms(r.p95Ms),
        ms(r.worstMs),
        pct(r.slowShare),
        r.smooth ? 'yes' : 'NO',
      ].join(' | '),
    );
  }
  return lines.join('\n');
}
