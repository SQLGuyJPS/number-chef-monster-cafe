import { useEffect, useRef, useState } from 'react';
import { ServiceScreen } from '../game/service/ServiceScreen';
import { REGULARS } from '../engine/monsters';
import { buildService, knownPreset, type Order } from '../engine/session';
import { ORDERS_PER_SERVICE } from '../engine/config';
import { hashSeed } from '../engine/rng';
import type { SkillId } from '../engine/types';
import { newId } from '../storage/ids';
import { configFor, loadSkillConfigs, type SkillConfigs } from './skillConfig';
import { getStorageBoot, takeSeedOverride } from './runtime';
import { Stage } from './Stage';
import { Splash } from './screens/Splash';
import { Home } from './screens/Home';
import { Menu } from './screens/Menu';
import { BreakDialog } from './BreakDialog';
import { ParentScreen } from './ParentScreen';
import { GearDialog } from './GearDialog';
import { onBack, pushGuard } from './backGuard';
import { unlockFromGesture } from '../audio/unlock';
import { setCurrentScreen } from './runtime';
import { hush } from '../audio/speech';
import type { ScreenId } from './pwaPolicy';

type AppScreen = Extract<ScreenId, 'splash' | 'home' | 'menu' | 'service' | 'parent'>;

interface RunningService {
  svc: string;
  skill: SkillId;
  seed: number;
  orders: Order[];
}

let serviceCounter = 0;
/** Facts introduced earlier in this app session (stand-in for the M3a event log, D97). */
const introducedThisSession = new Set<string>();

export function App({ allowRotate }: { allowRotate: boolean }) {
  const [screen, setScreen] = useState<AppScreen>('splash');
  const screenRef = useRef(screen);
  const [breakOpen, setBreakOpen] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  const gearRef = useRef(gearOpen);
  const [configs, setConfigs] = useState<SkillConfigs>({});
  const [deviceId, setDeviceId] = useState('memory');
  const [service, setService] = useState<RunningService | null>(null);

  // Stage/operations per skill from the ?debug picker (D52); read whenever the menu opens so the
  // tile tap can start the service synchronously, inside the user gesture.
  useEffect(() => {
    if (screen !== 'menu' && screen !== 'home') return;
    let live = true;
    void getStorageBoot()?.then(async (boot) => {
      const c = await loadSkillConfigs(boot.storage);
      if (!live) return;
      setConfigs(c);
      setDeviceId(boot.deviceId);
    });
    return () => {
      live = false;
    };
  }, [screen]);

  useEffect(() => {
    gearRef.current = gearOpen;
  }, [gearOpen]);

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
    const seed = takeSeedOverride() ?? hashSeed(deviceId, Date.now(), ++serviceCounter);
    // Until M3a there is no event log: boxes come from the known preset, and facts introduced
    // earlier in this app session count as seen so later services move on (D97).
    const boxes = knownPreset(skill);
    const seen = new Set([...boxes.keys(), ...introducedThisSession]);
    const plan = buildService({
      seed,
      skill,
      ops: cfg.ops,
      stage: cfg.stage,
      orders: ORDERS_PER_SERVICE,
      boxes,
      seen,
      monsters: REGULARS,
    });
    plan.newFacts.forEach((k) => introducedThisSession.add(k));
    const orders = plan.orders;
    setService({ svc: newId(), skill, seed, orders });
    go('service');
  };

  // Parent area: full-screen, not rotated, scrollable (SPEC §2.2); outside the stage on purpose.
  if (screen === 'parent') return <ParentScreen onBack={() => go('home')} />;

  return (
    <Stage allowRotate={allowRotate} background={<div className="cafe-backdrop" />}>
      {screen === 'splash' && (
        <Splash
          onStart={() => {
            unlockFromGesture();
            go('home');
          }}
        />
      )}
      {screen === 'home' && (
        <Home coins={0} onOpen={() => go('menu')} onGear={() => setGearOpen(true)} />
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
        <Menu onHome={() => go('home')} onPick={startService} configs={configs} />
      )}
      {screen === 'service' && service && (
        <ServiceScreen
          key={service.svc}
          orders={service.orders}
          seed={service.seed}
          svc={service.svc}
          dev={deviceId}
          onDoor={() => setBreakOpen(true)}
          // M1 ends a service back on the menu board; Results arrive in M2 (D66).
          onDone={() => go('menu')}
        />
      )}
      {breakOpen && (
        <BreakDialog
          onKeepCooking={() => {
            setBreakOpen(false);
            pushGuard();
          }}
          // Mid-service only (D46). M3a writes the partial serviceEnd here.
          onCloseCafe={
            screen === 'service'
              ? () => {
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
