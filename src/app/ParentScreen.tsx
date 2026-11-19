import { useEffect, useRef } from 'react';
import { TapButton } from '../game/input/TapButton';
import { idleExpired } from '../engine/parentGate';
import { BasketSidePicker } from './BasketSidePicker';
import { PlaytestTools } from './DebugScreen';
import { InstallHelp, ParentData } from './ParentData';
import { ParentSettings } from './ParentSettings';
import { ProgressList, StorageStatus } from './ProgressList';
import { SkillPicker } from './SkillPicker';
import { parentClock } from './runtime';

const INPUT_EVENTS = ['pointerdown', 'keydown', 'input', 'change', 'scroll', 'wheel'] as const;

/**
 * The parent area behind the gate (SPEC §12, M3b): Skills, basket side, Progress, Settings, Data,
 * storage and install help. Full screen, not rotated, scrollable (SPEC §2.2). It locks (back to
 * Home, so the gate asks again) after 5 minutes without input or when left (D134).
 */
export function ParentScreen({ onBack, onLock }: { onBack: () => void; onLock: () => void }) {
  const lockRef = useRef(onLock);
  useEffect(() => {
    lockRef.current = onLock;
  }, [onLock]);

  useEffect(() => {
    let last = parentClock();
    const touch = () => {
      last = parentClock();
    };
    // Capture, so input inside the confirm gate or a native control counts too.
    INPUT_EVENTS.forEach((e) => window.addEventListener(e, touch, { capture: true, passive: true }));
    // Wall clock (D134): a device put down for an hour is locked when picked up, even if its timers slept.
    const check = () => {
      if (idleExpired(last, parentClock())) lockRef.current();
    };
    const id = window.setInterval(check, 1000);
    document.addEventListener('visibilitychange', check);
    return () => {
      INPUT_EVENTS.forEach((e) => window.removeEventListener(e, touch, { capture: true }));
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  return (
    <div className="debug parent-screen" data-scroll-ok data-testid="parent-screen">
      <TapButton className="parent-back" testId="parent-back" onTap={onBack}>
        Back to the café
      </TapButton>
      <h1>Grown-ups</h1>
      <SkillPicker />
      <BasketSidePicker />
      <ProgressList />
      <ParentSettings />
      <ParentData />
      <StorageStatus />
      <InstallHelp />
      <h2>Playtest tools</h2>
      <PlaytestTools skills={false} basket={false} deviceTests={false} />
    </div>
  );
}
