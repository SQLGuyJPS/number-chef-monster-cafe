import { TapButton } from '../../game/input/TapButton';
import { at } from '../../game/service/ServiceParts';
import { FRONT } from '../metrics';
import { FrontMonster, FrontSign } from './FrontRoom';

/**
 * SPEC §5.1: the whole screen is the tap target; the tap unlocks audio and arms the back guard.
 * Over the counter (D123): the bar is the café's name sign, Blobbo waits behind the counter, and
 * "Tap to start" sits on a paper card on the counter top.
 */
export function Splash({ onStart }: { onStart: () => void }) {
  return (
    <TapButton
      className="splash"
      testId="splash"
      tapKind="button"
      label="Tap to start"
      onTap={onStart}
    >
      <FrontSign rect={FRONT.signWide}>
        <span className="front-title">Number Chef</span>
        <span className="front-sub">Monster Café</span>
      </FrontSign>
      <FrontMonster />
      <span className="front-tap" style={at(FRONT.tapCard)}>
        Tap to start
      </span>
    </TapButton>
  );
}
