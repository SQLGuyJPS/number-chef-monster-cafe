import { TapButton } from '../../game/input/TapButton';

const PLACEHOLDER_TILES = [
  { id: 'A1', name: 'Little Bites', sample: '3 + 2' },
  { id: 'A2', name: 'Big Bites', sample: '4 + 5' },
  { id: 'A3', name: 'Perfect Ten', sample: '7 + ? = 10' },
];

/** SPEC §5.3. M0 placeholder: tiles render but start nothing until M1/M2. */
export function Menu({ onHome }: { onHome: () => void }) {
  return (
    <div className="screen menu" data-testid="screen-menu">
      <div className="chalkboard">
        <div className="chalk-title">Little Menu</div>
        <div className="tiles">
          {PLACEHOLDER_TILES.map((t) => (
            <div key={t.id} className="tile" data-testid={`tile-${t.id}`}>
              <span className="tile-name">{t.name}</span>
              <span className="tile-sample">{t.sample}</span>
            </div>
          ))}
        </div>
      </div>
      <TapButton className="btn btn-secondary menu-home" testId="menu-home" onTap={onHome}>
        Home
      </TapButton>
    </div>
  );
}
