import { TapButton } from '../../game/input/TapButton';
import { Monster } from '../../art/monsters/Monster';

/** SPEC §5.1: the whole screen is the tap target; the tap unlocks audio and arms the back guard. */
export function Splash({ onStart }: { onStart: () => void }) {
  return (
    <TapButton className="splash" testId="splash" label="Tap to start" onTap={onStart}>
      <Monster id="blobbo" expression="idle" size={260} className="splash-monster" />
      <span className="splash-title">Number Chef</span>
      <span className="splash-sub">Monster Café</span>
      <span className="splash-tap">Tap to start</span>
    </TapButton>
  );
}
