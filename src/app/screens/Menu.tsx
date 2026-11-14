import { TapButton } from '../../game/input/TapButton';
import { CoinJar, at } from '../../game/service/ServiceParts';
import { COUNTER, FRONT } from '../metrics';
import { FrontMonster, FrontPip, FrontSign } from './FrontRoom';
import { isBuilt } from '../../engine/generators';
import type { SkillId } from '../../engine/types';
import { configFor, type SkillConfigs } from '../skillConfig';

interface Tile {
  id: SkillId;
  name: string;
  /** Sample sentence per allowed operations (SPEC §5.3). */
  add: string;
  sub: string;
}

const LITTLE_MENU: Tile[] = [
  { id: 'A1', name: 'Little Bites', add: '3 + 2', sub: '5 − 2' },
  { id: 'A2', name: 'Big Bites', add: '4 + 5', sub: '9 − 3' },
  { id: 'A3', name: 'Perfect Ten', add: '7 + ? = 10', sub: '10 − 4' },
];

/**
 * SPEC §5.3 over the counter (D123): "Little Menu" on the sign, the coin jar in its spot, Blobbo
 * and Pip behind the counter, and the dishes as little chalkboards standing on the counter beside
 * Home. A1–A3 start a service (M2); later tiles stay inert until their milestone.
 */
export function Menu({
  onHome,
  onPick,
  configs,
  coins,
  ready,
}: {
  onHome: () => void;
  onPick: (skill: SkillId) => void;
  configs: SkillConfigs;
  coins: number;
  /** Skill settings and basket side loaded (they are read when Home or the menu opens). */
  ready: boolean;
}) {
  const t = FRONT.tiles;
  return (
    <div className="screen menu" data-testid="screen-menu" data-ready={ready}>
      <FrontSign>
        <span className="front-title">Little Menu</span>
      </FrontSign>
      <CoinJar rect={COUNTER.bar.jar} count={coins} testId="coin-jar" />
      <FrontMonster />
      <FrontPip />
      <TapButton
        className="btn btn-secondary front-btn menu-home"
        style={at(FRONT.menuHome)}
        testId="menu-home"
        tapKind="button"
        onTap={onHome}
      >
        Home
      </TapButton>
      {LITTLE_MENU.map((tile, i) => {
        const built = isBuilt(tile.id);
        const sample = configFor(configs, tile.id).ops === 'sub' ? tile.sub : tile.add;
        return (
          <TapButton
            key={tile.id}
            // Every playable tile looks the same; no last-played glow (D83).
            className={`tile ${built ? '' : 'tile-soon'}`}
            style={at({ x: t.x + i * t.step, y: t.y, w: t.w, h: t.h })}
            testId={`tile-${tile.id}`}
            tapKind="button"
            inert={!built || !ready}
            onTap={() => onPick(tile.id)}
          >
            <span className="tile-name">{tile.name}</span>
            <span className="tile-sample">{sample}</span>
          </TapButton>
        );
      })}
    </div>
  );
}
