import { TapButton } from '../../game/input/TapButton';
import { GEAR_PATH } from '../../art/gearIcon';
import { CoinJar, at } from '../../game/service/ServiceParts';
import { COUNTER, FRONT, GEAR_SIZE, SHOP } from '../metrics';
import { Brush } from './ShopParts';
import './shop.css';
import { FrontMonster, FrontPip, FrontSign } from './FrontRoom';

/**
 * SPEC §5.2 over the counter (D123): the sign with the café's name, the coin jar in its service
 * spot, the grown-ups' gear in the corner past it (tap → popup, D95), Blobbo and Pip behind the
 * counter, Open the Café on the counter top and Shop right of it (D163; the left is kept for the
 * Monster Album, M16).
 */
export function Home({
  coins,
  onOpen,
  onShop,
  onGear,
}: {
  coins: number;
  onOpen: () => void;
  onShop: () => void;
  onGear: () => void;
}) {
  return (
    <div className="screen home" data-testid="screen-home">
      <FrontSign>
        <span className="front-title">Monster Café</span>
      </FrontSign>
      <CoinJar rect={COUNTER.bar.jar} count={coins} testId="coin-jar" />
      <TapButton
        className="gear"
        style={at(FRONT.gear)}
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
      <FrontMonster />
      <FrontPip />
      <TapButton
        className="btn btn-primary front-btn open-cafe"
        style={at(FRONT.open)}
        testId="open-cafe"
        tapKind="button"
        onTap={onOpen}
      >
        Open the Café
      </TapButton>
      <TapButton
        className="btn btn-secondary front-btn shop-button"
        style={at(SHOP.shopButton)}
        testId="shop-button"
        tapKind="button"
        onTap={onShop}
      >
        <span className="shop-button-inner">
          <Brush />
          <span>Shop</span>
        </span>
      </TapButton>
    </div>
  );
}
