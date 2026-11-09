import { TapButton } from '../../game/input/TapButton';
import { Monster } from '../../art/monsters/Monster';
import { GEAR_PATH } from '../../art/gearIcon';
import { GEAR_SIZE } from '../metrics';

/** SPEC §5.2. M0 placeholder: coin jar, Open the Café, and the grown-ups' gear (tap → popup, D95). */
export function Home({
  coins,
  onOpen,
  onGear,
}: {
  coins: number;
  onOpen: () => void;
  onGear: () => void;
}) {
  return (
    <div className="screen home" data-testid="screen-home">
      <div className="cafe-sign">Monster Café</div>
      <div className="coin-jar" data-testid="coin-jar" aria-label={`${coins} coins`}>
        <span className="coin-icon" aria-hidden="true" />
        <span className="coin-count">{coins}</span>
      </div>
      <Monster id="blobbo" expression="idle" size={220} className="home-monster" />
      <TapButton className="btn btn-primary open-cafe" testId="open-cafe" onTap={onOpen}>
        Open the Café
      </TapButton>
      <TapButton
        className="gear"
        style={{ width: GEAR_SIZE, height: GEAR_SIZE }}
        testId="gear"
        label="Grown-ups"
        onTap={onGear}
      >
        <svg
          viewBox="0 0 24 24"
          width={GEAR_SIZE * 0.66}
          height={GEAR_SIZE * 0.66}
          aria-hidden="true"
        >
          <path fill="currentColor" fillRule="evenodd" d={GEAR_PATH} />
        </svg>
      </TapButton>
    </div>
  );
}
