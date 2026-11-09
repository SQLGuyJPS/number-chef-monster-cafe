import { TapButton } from '../game/input/TapButton';
import { PlaytestTools } from './DebugScreen';

/**
 * Grown-ups' screen behind the Home gear (SPEC §5.2, §12, D94). Before M3a it holds the `?debug`
 * playtest tools, because an installed Home Screen app cannot carry `?debug` in its start URL and
 * on iOS a Safari tab does not even share its storage. Full-screen, not rotated, scrollable
 * (SPEC §2.2); M3a turns it into the Skills list and M3b puts the gate in front (D44).
 */
export function ParentScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="debug parent-screen" data-scroll-ok data-testid="parent-screen">
      <TapButton className="parent-back" testId="parent-back" onTap={onBack}>
        Back to the café
      </TapButton>
      <h1>Grown-ups: playtest tools</h1>
      <p>Changes apply from the next service.</p>
      <PlaytestTools />
    </div>
  );
}
