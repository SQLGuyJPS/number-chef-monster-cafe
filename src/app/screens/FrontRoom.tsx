import type { ReactNode } from 'react';
import { Monster } from '../../art/monsters/Monster';
import { Pip } from '../../art/Pip';
import { at } from '../../game/service/ServiceParts';
import { COUNTER, COUNTER_Y, FRONT, type Rect } from '../metrics';

const { scene } = COUNTER;

/** Blobbo behind the counter, at the service monster's spot (D123). */
export function FrontMonster() {
  return (
    <div className="front-monster" style={at(scene.monsterFull)}>
      <Monster id="blobbo" expression="idle" size={scene.monsterFull.w} />
    </div>
  );
}

/** Pip behind the counter at his service spot, cut at the counter's far edge (SPEC §5.2). */
export function FrontPip() {
  return (
    <div
      className="pip-well"
      style={at({ ...scene.pip, h: COUNTER_Y + 4 - scene.pip.y })}
      data-testid="front-pip"
    >
      <div style={{ width: scene.pip.w, height: scene.pip.h }}>
        <Pip />
      </div>
    </div>
  );
}

/** The café's sign in the cream bar: its name, "Little Menu" or CLOSED (D123). */
export function FrontSign({ rect = FRONT.sign, children }: { rect?: Rect; children: ReactNode }) {
  return (
    <div className="front-sign" style={at(rect)}>
      {children}
    </div>
  );
}
