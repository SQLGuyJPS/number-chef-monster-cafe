import { TapButton } from '../game/input/TapButton';
import { PlaytestTools } from './DebugScreen';
import { ProgressList, StorageStatus } from './ProgressList';
import { SkillPicker } from './SkillPicker';

/**
 * Grown-ups' screen behind the Home gear (SPEC §5.2, §12). M3a: the minimal Skills list, a simple
 * progress list and the storage status, opened by the gear without a gate; the playtest tools stay
 * below until M3b builds the parent area and puts the gate in front (D44, D94).
 * Full-screen, not rotated, scrollable (SPEC §2.2).
 */
export function ParentScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="debug parent-screen" data-scroll-ok data-testid="parent-screen">
      <TapButton className="parent-back" testId="parent-back" onTap={onBack}>
        Back to the café
      </TapButton>
      <h1>Grown-ups</h1>
      <SkillPicker />
      <ProgressList />
      <StorageStatus />
      <h2>Playtest tools</h2>
      <PlaytestTools skills={false} />
    </div>
  );
}
