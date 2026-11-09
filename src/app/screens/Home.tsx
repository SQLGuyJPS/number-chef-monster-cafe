import { TapButton } from '../../game/input/TapButton';
import { HoldButton } from '../../game/input/HoldButton';
import { PlaceholderMonster } from '../../art/PlaceholderMonster';
import { GEAR_LONG_PRESS_MS } from '../metrics';

/** SPEC §5.2. M0 placeholder: coin jar, Open the Café, and the grown-ups' gear (hold 2 s, D94). */
export function Home({
  coins,
  onOpen,
  onParent,
}: {
  coins: number;
  onOpen: () => void;
  onParent: () => void;
}) {
  return (
    <div className="screen home" data-testid="screen-home">
      <div className="cafe-sign">Monster Café</div>
      <div className="coin-jar" data-testid="coin-jar" aria-label={`${coins} coins`}>
        <span className="coin-icon" aria-hidden="true" />
        <span className="coin-count">{coins}</span>
      </div>
      <PlaceholderMonster size={220} className="home-monster" />
      <TapButton className="btn btn-primary open-cafe" testId="open-cafe" onTap={onOpen}>
        Open the Café
      </TapButton>
      <HoldButton className="gear" testId="gear" label="Grown-ups" holdMs={GEAR_LONG_PRESS_MS} onHold={onParent}>
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.9 4.6-.1-2.2 2-1.6-2-3.4-2.4.9-1.8-1.1L16.2 3h-4l-.4 2.6-1.9 1.1-2.4-.9-2 3.4 2 1.6v2.2l-2 1.6 2 3.4 2.4-.9 1.9 1.1.4 2.6h4l.4-2.6 1.8-1.1 2.4.9 2-3.4z"
          />
        </svg>
      </HoldButton>
    </div>
  );
}
