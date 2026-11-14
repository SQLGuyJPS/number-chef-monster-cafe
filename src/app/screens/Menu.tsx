import { TapButton } from '../../game/input/TapButton';
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

/** SPEC §5.3. A1–A3 start a service (M2); later tiles stay inert until their milestone. */
export function Menu({
  onHome,
  onPick,
  configs,
  ready,
}: {
  onHome: () => void;
  onPick: (skill: SkillId) => void;
  configs: SkillConfigs;
  /** Skill settings and basket side loaded (they are read when Home or the menu opens). */
  ready: boolean;
}) {
  return (
    <div className="screen menu" data-testid="screen-menu" data-ready={ready}>
      <div className="chalkboard">
        <div className="chalk-title">Little Menu</div>
        <div className="tiles">
          {LITTLE_MENU.map((t) => {
            const built = isBuilt(t.id);
            const sample = configFor(configs, t.id).ops === 'sub' ? t.sub : t.add;
            return (
              <TapButton
                key={t.id}
                // Every playable tile looks the same; no last-played glow (D83).
                className={`tile ${built ? '' : 'tile-soon'}`}
                testId={`tile-${t.id}`}
                tapKind="button"
                inert={!built || !ready}
                onTap={() => onPick(t.id)}
              >
                <span className="tile-name">{t.name}</span>
                <span className="tile-sample">{sample}</span>
              </TapButton>
            );
          })}
        </div>
      </div>
      <TapButton className="btn btn-secondary menu-home" testId="menu-home" onTap={onHome}>
        Home
      </TapButton>
    </div>
  );
}
