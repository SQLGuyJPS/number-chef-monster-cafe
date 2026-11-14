import { useEffect, useRef, useState } from 'react';
import { ServiceScreen } from '../game/service/ServiceScreen';
import type {
  ProblemRecord,
  ServiceController,
  ServiceResume,
  ServiceSummary,
} from '../game/service/controller';
import { REGULARS } from '../engine/monsters';
import { buildService, withWarmUp, type Order } from '../engine/session';
import { isBuilt } from '../engine/generators';
import { ORDERS_PER_SERVICE } from '../engine/config';
import { hashSeed } from '../engine/rng';
import type { SkillId } from '../engine/types';
import { newId } from '../storage/ids';
import { configFor, type SkillConfig } from './skillConfig';
import { getProgress, loadedProgress, useDerived } from './progress';
import { balance, boxMap, seenSet } from '../engine/replay';
import { serviceEndEvent } from '../engine/events';
import { isOfferable, makeResume, restorePlan, type ResumeSnapshot } from '../engine/resume';
import { ResumeDialog } from './ResumeDialog';
import { getStorageBoot, takeSeedOverride } from './runtime';
import { Stage } from './Stage';
import { CounterScene } from '../art/CounterScene';
import { loadBasketSide } from './basketSide';
import type { BasketSide } from './metrics';
import { Splash } from './screens/Splash';
import { Home } from './screens/Home';
import { Results } from './screens/Results';
import { Menu } from './screens/Menu';
import { BreakDialog } from './BreakDialog';
import { ParentScreen } from './ParentScreen';
import { GearDialog } from './GearDialog';
import { onBack, pushGuard } from './backGuard';
import { unlockFromGesture } from '../audio/unlock';
import { setCurrentScreen } from './runtime';
import { hush } from '../audio/speech';
import type { ScreenId } from './pwaPolicy';

type AppScreen = Extract<ScreenId, 'splash' | 'home' | 'menu' | 'service' | 'results' | 'parent'>;

interface RunningService {
  svc: string;
  skill: SkillId;
  seed: number;
  orders: Order[];
  config: SkillConfig;
  /** Orders the service was planned with (requeues come on top). */
  planned: number;
  /** Set when continuing a stored service (SPEC §5.8). */
  resume?: ServiceResume;
}

/** Epoch ms for seeds and the resume row; only ever called from event handlers. */
const wallNow = (): number => Date.now();

let serviceCounter = 0;
/** "Continue dinner service?" is offered once per launch, on the first Home (SPEC §11.6, D125). */
let resumeChecked = false;

export function App({ allowRotate }: { allowRotate: boolean }) {
  const [screen, setScreen] = useState<AppScreen>('splash');
  const screenRef = useRef(screen);
  const [breakOpen, setBreakOpen] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  const gearRef = useRef(gearOpen);
  const derived = useDerived();
  /** Stage and operations per skill: the latest `skillConfig` events (SPEC §11.2). */
  const configs = derived.config;
  const [deviceId, setDeviceId] = useState('memory');
  const [service, setService] = useState<RunningService | null>(null);
  /** The coin jar: the balance derived from the event log (SPEC §11.2). */
  const coins = balance(derived);
  const ctrlRef = useRef<ServiceController | null>(null);
  const [offer, setOffer] = useState<ResumeSnapshot | null>(null);
  const [results, setResults] = useState<ServiceSummary | null>(null);
  /** First-ever warm-up order already shown on this device (SPEC §5.4, D26); `meta` store. */
  const [warmupShown, setWarmupShown] = useState(true);
  /** Per-device basket side (D115), read with the skill configs so a service starts with it. */
  const [basket, setBasket] = useState<BasketSide>('right');
  /** The dish tiles wait for the per-device settings, so a quick first tap can't start with defaults. */
  const [settingsReady, setSettingsReady] = useState(() => getStorageBoot() === null);

  // Per-device settings and the event log; read whenever the menu opens so the tile tap can start
  // the service synchronously, inside the user gesture.
  useEffect(() => {
    if (screen !== 'menu' && screen !== 'home') return;
    let live = true;
    const booting = getStorageBoot();
    // No storage (ready from the start), or reading it fails: play with the defaults rather than
    // leave the tiles dead.
    void booting
      ?.then(async (boot) => {
        await getProgress();
        const warm = (await boot.storage.getMeta('warmupShown')) === true;
        const side = await loadBasketSide(boot.storage);
        if (!live) return;
        setBasket(side);
        setWarmupShown(warm);
        setDeviceId(boot.deviceId);
        setSettingsReady(true);
      })
      .catch(() => setSettingsReady(true));
    return () => {
      live = false;
    };
  }, [screen]);

  useEffect(() => {
    gearRef.current = gearOpen;
  }, [gearOpen]);

  // On launch, a service left unfinished less than 2 h ago is offered back, never resumed
  // silently (SPEC §5.8, §11.6, D33). Checked once, on the first Home after Splash.
  useEffect(() => {
    if (screen !== 'home' || resumeChecked) return;
    resumeChecked = true;
    let live = true;
    void getProgress()
      ?.then((p) => p.getResume())
      .then((snap) => {
        if (!live || !snap) return;
        if (isOfferable(snap, wallNow())) setOffer(snap);
        else loadedProgress()?.setResume(null);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [screen]);

  useEffect(() => {
    screenRef.current = screen;
    setCurrentScreen(screen);
  }, [screen]);

  useEffect(
    () =>
      onBack(() => {
        // Never trap anyone in the grown-ups' screen (SPEC §2.3): back returns to Home. No new
        // guard entry can be pushed here (no gesture); the next navigation tap pushes one.
        if (screenRef.current === 'parent') {
          setScreen('home');
          return;
        }
        // The grown-ups' popup just closes; the child never sees "Take a break?" for it (D95).
        if (gearRef.current) {
          setGearOpen(false);
          return;
        }
        // Before the Splash tap no guard exists (none can be pushed without a gesture).
        setBreakOpen(true);
      }),
    [],
  );

  /** Every navigation comes from a tap, so the guard entry is pushed with user activation (D37). */
  const go = (next: AppScreen) => {
    setScreen(next);
    pushGuard();
  };

  const startService = (skill: SkillId) => {
    const cfg = configFor(configs, skill);
    // SPEC §4.1 step 1: seed from device, start time and a per-device counter (the e2e hook may pin it).
    const seed = takeSeedOverride() ?? hashSeed(deviceId, wallNow(), ++serviceCounter);
    // Boxes and the seen set come from the event log on top of the known preset (SPEC §4.1, §4.2).
    const progress = loadedProgress();
    const initial = progress?.initial ?? {};
    const plan = buildService({
      seed,
      skill,
      ops: cfg.ops,
      stage: cfg.stage,
      orders: ORDERS_PER_SERVICE,
      boxes: boxMap(derived, initial),
      seen: seenSet(derived, initial),
      monsters: REGULARS,
    });
    // The warm-up runs once per device; the flag is set as it starts, so leaving early never
    // shows it again (SPEC §5.4).
    const orders = warmupShown ? plan.orders : withWarmUp(plan.orders, REGULARS);
    if (!warmupShown) {
      setWarmupShown(true);
      void getStorageBoot()?.then((boot) => boot.storage.setMeta('warmupShown', true));
    }
    const run: RunningService = { svc: newId(), skill, seed, orders, config: cfg, planned: ORDERS_PER_SERVICE };
    // Stored from the start, so a reload before the first serve can still offer it back (D125).
    progress?.setResume(snapshotOf(run, { nextIndex: 0, orders, results: [], coins: 0, activeMs: 0 }));
    setService(run);
    go('service');
  };

  const snapshotOf = (
    run: RunningService,
    r: Pick<ProblemRecord, 'nextIndex' | 'orders' | 'results' | 'coins' | 'activeMs'>,
  ): ResumeSnapshot =>
    makeResume({
      svc: run.svc,
      seed: run.seed,
      skill: run.skill,
      stage: run.config.stage,
      ops: run.config.ops,
      orders: run.planned,
      plan: r.orders,
      index: r.nextIndex,
      results: r.results,
      coins: r.coins,
      activeMs: r.activeMs,
      savedAt: wallNow(),
    });

  /** One transaction per completed problem: its events and the resume row (SPEC §11.3). */
  const recordProblem = (run: RunningService, r: ProblemRecord) => {
    loadedProgress()?.append(r.events, snapshotOf(run, r));
  };

  /** `serviceEnd` (SPEC §11.2): a finished service clears the resume row; a partial one keeps it. */
  const endService = (run: RunningService, sum: ServiceSummary, partial: boolean) => {
    const progress = loadedProgress();
    if (!progress) return;
    const end = serviceEndEvent(progress.ctx(), {
      svc: run.svc,
      skill: run.skill,
      seed: run.seed,
      orders: sum.monsters.length,
      served: sum.served,
      tip: partial ? 0 : sum.tip,
      activeMs: sum.activeMs,
      partial,
    });
    progress.append([end], partial ? undefined : null);
  };

  const continueService = (snap: ResumeSnapshot) => {
    const orders = restorePlan(snap);
    setOffer(null);
    if (!orders || !isBuilt(snap.config.skill)) return;
    setService({
      svc: snap.svc,
      skill: snap.config.skill,
      seed: snap.seed,
      orders,
      config: { stage: snap.config.stage, ops: snap.config.ops },
      planned: snap.config.orders,
      resume: { index: snap.index, coins: snap.coins, results: snap.results, activeMs: snap.activeMs },
    });
    go('service');
  };

  // Parent area: full-screen, not rotated, scrollable (SPEC §2.2); outside the stage on purpose.
  if (screen === 'parent') return <ParentScreen onBack={() => go('home')} />;

  return (
    <Stage
      allowRotate={allowRotate}
      background={<div className="cafe-backdrop counter-backdrop" />}
    >
      {/* Every child screen is seen from behind the same counter (D114, D123). */}
      <CounterScene />
      {screen === 'splash' && (
        <Splash
          onStart={() => {
            unlockFromGesture();
            go('home');
          }}
        />
      )}
      {screen === 'home' && (
        <Home coins={coins} onOpen={() => go('menu')} onGear={() => setGearOpen(true)} />
      )}
      {screen === 'home' && offer && !gearOpen && (
        <ResumeDialog
          onContinue={() => continueService(offer)}
          onNew={() => {
            setOffer(null);
            loadedProgress()?.setResume(null);
            pushGuard();
          }}
        />
      )}
      {screen === 'home' && gearOpen && (
        <GearDialog
          onClose={() => setGearOpen(false)}
          onOpen={() => {
            setGearOpen(false);
            go('parent');
          }}
        />
      )}
      {screen === 'menu' && (
        <Menu
          onHome={() => go('home')}
          onPick={startService}
          configs={configs}
          coins={coins}
          ready={settingsReady}
        />
      )}
      {screen === 'service' && service && (
        <ServiceScreen
          key={service.svc}
          orders={service.orders}
          seed={service.seed}
          svc={service.svc}
          dev={deviceId}
          jar={coins}
          basket={basket}
          ctrlRef={ctrlRef}
          {...(service.resume ? { resume: service.resume } : {})}
          onDoor={() => setBreakOpen(true)}
          onRecord={(r) => recordProblem(service, r)}
          onDone={(summary) => {
            endService(service, summary, false);
            setResults(summary);
            go('results');
          }}
        />
      )}
      {screen === 'results' && service && results && (
        <Results
          coins={results.coins}
          jar={coins}
          monsters={results.monsters}
          // SPEC §5.7: Another service repeats the skill; Change dish goes back to the menu board.
          onAnother={() => startService(service.skill)}
          onChangeDish={() => go('menu')}
          onHome={() => go('home')}
        />
      )}
      {breakOpen && (
        <BreakDialog
          onKeepCooking={() => {
            setBreakOpen(false);
            pushGuard();
          }}
          // Mid-service only (D46): a partial serviceEnd, no tip; the resume row stays (SPEC §5.8).
          onCloseCafe={
            screen === 'service'
              ? () => {
                  const ctrl = ctrlRef.current;
                  if (service && ctrl) endService(service, ctrl.summary(), true);
                  hush();
                  setBreakOpen(false);
                  setService(null);
                  go('home');
                }
              : undefined
          }
        />
      )}
    </Stage>
  );
}
