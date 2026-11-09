// `?gallery`: every monster at every expression plus its reaction, and Pip (SPEC §7.2; the M2
// screenshot grid). A look-only page, like `?debug`; nothing here writes progress.
import { Monster } from '../art/monsters/Monster';
import { EXPRESSIONS, MONSTER_SPECS } from '../art/monsters/specs';
import { Pip } from '../art/Pip';

export function MonsterGallery() {
  return (
    <div className="gallery" data-testid="gallery">
      <table>
        <thead>
          <tr>
            <th />
            {EXPRESSIONS.map((e) => (
              <th key={e}>{e}</th>
            ))}
            <th>reaction</th>
          </tr>
        </thead>
        <tbody>
          {MONSTER_SPECS.map((s) => (
            <tr key={s.id} data-testid={`gallery-${s.id}`}>
              <th>{s.name}</th>
              {EXPRESSIONS.map((e) => (
                <td key={e}>
                  <Monster id={s.id} expression={e} size={120} />
                </td>
              ))}
              <td>
                <Monster id={s.id} expression="delight" react size={120} />
              </td>
            </tr>
          ))}
          <tr>
            <th>Pip</th>
            <td>
              <div style={{ width: 96, height: 120 }}>
                <Pip />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
