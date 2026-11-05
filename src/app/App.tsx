import { useEffect, useState } from 'react';
import { ServiceScreen } from '../game/service/ServiceScreen';
import { planOrders, type Order } from '../engine/plan';
import { ORDERS_PER_SERVICE } from '../engine/config';
import { hashSeed, mulberry32 } from '../engine/rng';
import type { SkillId } from '../engine/types';
import { newId } from '../storage/ids';
import { configFor, loadSkillConfigs, type SkillConfigs } from './skillConfig';
import { getStorageBoot, takeSeedOverride } from './runtime';
import { Stage } from './Stage';
import { Splash } from './screens/Splash';
import { Home } from './screens/Home';
import { Menu } from './screens/Menu';
import { BreakDialog } from './BreakDialog';
import { onBack, pushGuard } from './backGuard';
import { unlockFromGesture } from '../audio/unlock';
import { setCurrentScreen } from './runtime';
import { hush } from '../audio/speech';
import type { ScreenId } from './pwaPolicy';

type ChildScreen = Extract<ScreenId, 'splash' | 'home' | 'menu' | 'service'>;

interface RunningService {
  svc: string;
  skill: SkillId;
  orders: Order[];
}

let serviceCounter = 0;

export function App({ allowRotate }: { allowRotate: boolean }) {
  const [screen, setScreen] = useState<ChildScreen>('splash');
  const [breakOpen, setBreakOpen] = useState(false);
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

  useEffect(() => setCurrentScreen(screen), [screen]);

  useEffect(
    () =>
      onBack(() => {
        // Before the Splash tap no guard exists (none can be pushed without a gesture).
        setBreakOpen(true);
      }),
    [],
  );

  /** Every navigation comes from a tap, so the guard entry is pushed with user activation (D37). */
  const go = (next: ChildScreen) => {
    setScreen(next);
    pushGuard();
  };

  const startService = (skill: SkillId) => {
    const cfg = configFor(configs, skill);
    // SPEC §4.1 step 1: seed from device, start time and a per-device counter (the e2e hook may pin it).
    const seed = takeSeedOverride() ?? hashSeed(deviceId, Date.now(), ++serviceCounter);
    const orders = planOrders(mulberry32(seed), skill, cfg.ops, cfg.stage, ORDERS_PER_SERVICE);
    setService({ svc: newId(), skill, orders });
    go('service');
  };

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
      {screen === 'home' && <Home coins={0} onOpen={() => go('menu')} />}
      {screen === 'menu' && <Menu onHome={() => go('home')} onPick={startService} configs={configs} />}
      {screen === 'service' && service && (
        <ServiceScreen
          key={service.svc}
          orders={service.orders}
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
