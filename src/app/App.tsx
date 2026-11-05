import { useEffect, useState } from 'react';
import { Stage } from './Stage';
import { Splash } from './screens/Splash';
import { Home } from './screens/Home';
import { Menu } from './screens/Menu';
import { BreakDialog } from './BreakDialog';
import { onBack, pushGuard } from './backGuard';
import { unlockFromGesture } from '../audio/unlock';
import { setCurrentScreen } from './runtime';
import type { ScreenId } from './pwaPolicy';

type ChildScreen = Extract<ScreenId, 'splash' | 'home' | 'menu'>;

export function App({ allowRotate }: { allowRotate: boolean }) {
  const [screen, setScreen] = useState<ChildScreen>('splash');
  const [breakOpen, setBreakOpen] = useState(false);

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
      {screen === 'menu' && <Menu onHome={() => go('home')} />}
      {breakOpen && (
        <BreakDialog
          onKeepCooking={() => {
            setBreakOpen(false);
            pushGuard();
          }}
        />
      )}
    </Stage>
  );
}
