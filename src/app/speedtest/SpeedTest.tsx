// `?speedtest` (SPEC §2.4, D112): measures how many SVG elements this device can show before the
// café stops being smooth. Two ramps over the real café scene and a live chewing monster: copies of
// the real monster art standing still (like shop decorations), then copies that move (like the
// idle bob). Each step warms up, records frame times, and is retried once before it counts as
// rough. Grown-ups only: reached by URL or from the playtest tools; nothing is sent anywhere.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Stage } from '../Stage';
import { CafeScene } from '../../art/CafeScene';
import { Monster } from '../../art/monsters/Monster';
import { MONSTER_SPECS } from '../../art/monsters/specs';
import { FOODS } from '../../engine/foods';
import { countSvgElements } from '../svgCount';
import {
  FULL_PLAN,
  QUICK_PLAN,
  formatReport,
  isSmooth,
  rampVerdict,
  summarize,
  type RampKind,
  type StepResult,
} from './speedStats';
import './speedtest.css';

type Load = { kind: RampKind | 'base'; copies: number };
type Phase = 'intro' | 'running' | 'done';

const COPY_SIZE = 96;
/** Calibration renders this many copies to learn how many elements one copy adds. */
const CALIBRATE_COPIES = 12;

function nextFrames(n = 2): Promise<void> {
  return new Promise((res) => {
    const step = () => (--n <= 0 ? res() : requestAnimationFrame(step));
    requestAnimationFrame(step);
  });
}

/** Frame-to-frame times for `ms` of wall time (stops early when `stop()` turns true). */
function recordFrames(ms: number, stop: () => boolean): Promise<number[]> {
  return new Promise((res) => {
    const deltas: number[] = [];
    let last = -1;
    let t0 = -1;
    const loop = (t: number) => {
      if (t0 < 0) t0 = t;
      if (last >= 0) deltas.push(t - last);
      last = t;
      if (t - t0 >= ms || stop()) res(deltas);
      else requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}

/** Spread copies over the whole stage (golden-ratio scatter: even, overlapping like a busy room). */
function copyPos(i: number): { left: number; top: number } {
  return {
    left: ((i * 0.6180339887) % 1) * (1280 - COPY_SIZE),
    top: 20 + ((i * 0.7548776662) % 1) * (720 - COPY_SIZE - 40),
  };
}

function Copies({ load }: { load: Load }) {
  if (load.kind === 'base' || load.copies === 0) return null;
  return (
    <div className={`st-copies st-${load.kind}`} key={load.kind} data-testid="st-copies">
      {Array.from({ length: load.copies }, (_, i) => (
        <div key={i} className="st-copy" style={copyPos(i)}>
          <Monster
            id={MONSTER_SPECS[i % MONSTER_SPECS.length]!.id}
            expression="idle"
            size={COPY_SIZE}
          />
        </div>
      ))}
    </div>
  );
}

/** The always-on load: the eat sequence's chewing monster and food flying to it, on a loop. */
function LiveScene() {
  const glyph = FOODS.cookie.glyph;
  return (
    <div className="st-live">
      <div className="st-live-monster">
        <Monster id={MONSTER_SPECS[0]!.id} expression="eat" size={300} />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="st-fly" style={{ animationDelay: `${i * 0.4}s` }}>
          {glyph}
        </div>
      ))}
    </div>
  );
}

export function SpeedTest({ quick }: { quick: boolean }) {
  const plan = quick ? QUICK_PLAN : FULL_PLAN;
  const [phase, setPhase] = useState<Phase>('intro');
  const [load, setLoad] = useState<Load>({ kind: 'base', copies: 0 });
  const [label, setLabel] = useState('');
  const [results, setResults] = useState<StepResult[]>([]);
  const [aborted, setAborted] = useState<string | undefined>();
  const stopReason = useRef<string | null>(null);
  const rendered = useRef<(() => void) | null>(null);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Resolves the runner's wait once React has committed the new load.
  useLayoutEffect(() => {
    rendered.current?.();
    rendered.current = null;
  }, [load]);

  useEffect(() => {
    if (phase !== 'running') return;
    const onHide = () => {
      if (document.visibilityState === 'hidden')
        stopReason.current = 'the app went to the background';
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [phase]);

  async function show(next: Load): Promise<number> {
    await new Promise<void>((res) => {
      rendered.current = res;
      setLoad(next);
    });
    await nextFrames(2);
    const stage = document.querySelector('[data-testid="stage"]');
    return stage ? countSvgElements(stage) : 0;
  }

  async function step(
    kind: StepResult['kind'],
    added: number,
    copies: number,
  ): Promise<StepResult> {
    const elements = await show({ kind, copies });
    const stop = () => stopReason.current !== null;
    await recordFrames(plan.warmupMs, stop);
    const f = summarize(await recordFrames(plan.measureMs, stop));
    return { ...f, kind, added, elements, smooth: isSmooth(f) };
  }

  async function run() {
    stopReason.current = null;
    setResults([]);
    setAborted(undefined);
    setPhase('running');
    window.scrollTo(0, 0);
    // Keep the screen awake for the ~2 min run (best effort; iOS 16.4+ / Chrome).
    let lock: { release(): Promise<void> } | null = null;
    try {
      lock = (await navigator.wakeLock?.request('screen')) ?? null;
    } catch {
      lock = null;
    }
    const out: StepResult[] = [];
    const stopped = () => stopReason.current !== null;
    try {
      setLabel('Café scene only');
      out.push(await step('base', 0, 0));
      const baseCount = out[0]!.elements;
      const perCopy = Math.max(
        1,
        ((await show({ kind: 'still', copies: CALIBRATE_COPIES })) - baseCount) / CALIBRATE_COPIES,
      );
      for (const kind of ['still', 'moving'] as const) {
        for (const [i, added] of plan.steps.entries()) {
          if (stopped()) break;
          const copies = Math.max(1, Math.round(added / perCopy));
          setLabel(
            `${kind === 'still' ? 'Still' : 'Moving'} · step ${i + 1} of ${plan.steps.length}`,
          );
          let r = await step(kind, added, copies);
          if (!r.smooth && !stopped()) r = await step(kind, added, copies); // one retry: a hiccup is not a limit
          if (stopped()) break;
          out.push(r);
          setResults([...out]);
          if (!r.smooth) break;
        }
      }
    } finally {
      await lock?.release().catch(() => undefined);
    }
    setAborted(stopReason.current ?? undefined);
    setResults(out);
    setLoad({ kind: 'base', copies: 0 });
    setPhase('done');
  }

  if (phase === 'running') {
    return (
      <Stage allowRotate background={<div className="cafe-backdrop" />}>
        <CafeScene />
        <Copies load={load} />
        <LiveScene />
        <div className="st-hud" data-testid="st-hud">
          <span>Speed test · {label} · please don't touch</span>
          <button
            type="button"
            data-testid="st-stop"
            onClick={() => (stopReason.current = 'stopped by you')}
          >
            Stop
          </button>
        </div>
      </Stage>
    );
  }

  const report =
    phase === 'done'
      ? formatReport(results, {
          version: __APP_VERSION__,
          date: new Date().toISOString().slice(0, 16).replace('T', ' '),
          userAgent: navigator.userAgent,
          viewport: `${innerWidth}×${innerHeight} @${devicePixelRatio}x`,
          standalone: matchMedia('(display-mode: standalone)').matches,
          reducedMotion,
          quick,
          aborted,
        })
      : '';

  return (
    <div className="debug speedtest" data-scroll-ok data-testid="speedtest">
      <button type="button" className="st-big" onClick={() => (location.href = location.pathname)}>
        Back to the café
      </button>
      <h1>Speed test</h1>
      {phase === 'intro' ? (
        <Intro quick={quick} reducedMotion={reducedMotion} onStart={() => void run()} />
      ) : (
        <Results results={results} report={report} onAgain={() => void run()} />
      )}
    </div>
  );
}

function Intro({
  quick,
  reducedMotion,
  onStart,
}: {
  quick: boolean;
  reducedMotion: boolean;
  onStart: () => void;
}) {
  return (
    <>
      <p>
        Finds how many drawing pieces this device can show before the café stops being smooth. It
        adds copies of the monsters in steps: first standing still, then moving. About{' '}
        {quick ? '10 seconds' : '2 minutes'}.
      </p>
      <ul>
        <li>Turn Low Power Mode off (it caps the screen at 30 frames a second).</li>
        <li>Run it from the Home Screen icon, the way the child plays.</li>
        <li>Hold the device in landscape and don't touch the screen until it finishes.</li>
      </ul>
      {reducedMotion && (
        <p className="st-warn" data-testid="st-reduced-motion">
          Reduce Motion is on, so nothing will move and the moving test means little. Turn it off in
          Settings → Accessibility → Motion for this test.
        </p>
      )}
      {quick && (
        <p className="st-warn">Quick mode: a few short steps, not enough to set a budget.</p>
      )}
      <button type="button" className="st-big st-start" data-testid="st-start" onClick={onStart}>
        Start
      </button>
    </>
  );
}

function Results({
  results,
  report,
  onAgain,
}: {
  results: StepResult[];
  report: string;
  onAgain: () => void;
}) {
  const [copied, setCopied] = useState('');
  const still = rampVerdict('still', results);
  const moving = rampVerdict('moving', results);
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Number Chef speed test', text: report });
        return;
      }
      await navigator.clipboard.writeText(report);
      setCopied('Copied.');
    } catch {
      setCopied('Could not share; select the text below and copy it.');
    }
  };
  return (
    <>
      <p data-testid="st-summary">
        Suggested budgets: <b>{still.budget ?? '—'}</b> still elements,{' '}
        <b>{moving.budget ?? '—'}</b> moving elements on screen. Send the text below back so the
        budget can be set from it.
      </p>
      <button type="button" className="st-big" data-testid="st-share" onClick={() => void share()}>
        Share results
      </button>{' '}
      <button type="button" className="st-big" data-testid="st-again" onClick={onAgain}>
        Run again
      </button>
      {copied && <p>{copied}</p>}
      <textarea className="st-report" data-testid="st-report" readOnly value={report} rows={14} />
      <table>
        <thead>
          <tr>
            <th>Ramp</th>
            <th>Elements</th>
            <th>Median</th>
            <th>Hitches</th>
            <th>Smooth</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} data-testid={`st-row-${r.kind}`}>
              <td>{r.kind}</td>
              <td>{r.elements}</td>
              <td>{r.medianMs.toFixed(1)} ms</td>
              <td>{(r.slowShare * 100).toFixed(1)}%</td>
              <td>{r.smooth ? 'yes' : 'no'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
