import { describe, expect, it } from 'vitest';
import { installPointerGuard } from '../../src/game/input/pointerGuard';

interface Opts {
  pointerId: number;
  pointerType?: string;
  width?: number;
  height?: number;
}

function ev(type: string, o: Opts): Event {
  return Object.assign(new Event(type, { cancelable: true }), {
    pointerType: 'touch',
    width: 20,
    height: 20,
    ...o,
  });
}

// The guard registers capture listeners. On a bare EventTarget (target phase) capture listeners
// run before non-capture ones, and stopImmediatePropagation stops the later ones, so a test
// listener registered afterwards only sees events the guard let through.
function setup(start = 1000) {
  const target = new EventTarget();
  let t = start;
  const guard = installPointerGuard(target, () => t);
  const seen: string[] = [];
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
    target.addEventListener(type, (e) => {
      seen.push(`${type}:${(e as Event & { pointerId: number }).pointerId}`);
    });
  }
  return { target, guard, seen, setNow: (v: number) => (t = v) };
}

describe('installPointerGuard', () => {
  it('accepts the first pointer and blocks a second concurrent one', () => {
    const { target, guard, seen } = setup();
    target.dispatchEvent(ev('pointerdown', { pointerId: 1 }));
    expect(guard.activePointerId()).toBe(1);
    const second = ev('pointerdown', { pointerId: 2 });
    target.dispatchEvent(second);
    expect(second.defaultPrevented).toBe(true);
    expect(seen).toEqual(['pointerdown:1']);
    expect(guard.activePointerId()).toBe(1);
  });

  it('hides moves and ups of non-active pointers, passes the active one', () => {
    const { target, seen } = setup();
    target.dispatchEvent(ev('pointerdown', { pointerId: 1 }));
    target.dispatchEvent(ev('pointermove', { pointerId: 2 }));
    target.dispatchEvent(ev('pointerup', { pointerId: 2 }));
    target.dispatchEvent(ev('pointermove', { pointerId: 1 }));
    expect(seen).toEqual(['pointerdown:1', 'pointermove:1']);
  });

  it('accepts a new pointer after the first one lifts', () => {
    const { target, guard, seen } = setup();
    target.dispatchEvent(ev('pointerdown', { pointerId: 1 }));
    target.dispatchEvent(ev('pointerup', { pointerId: 1 }));
    expect(guard.activePointerId()).toBeNull();
    target.dispatchEvent(ev('pointerdown', { pointerId: 2 }));
    expect(guard.activePointerId()).toBe(2);
    expect(seen).toEqual(['pointerdown:1', 'pointerup:1', 'pointerdown:2']);
  });

  it('blocks palm-sized touch contacts (SPEC §2.3)', () => {
    const { target, guard, seen } = setup();
    const palm = ev('pointerdown', { pointerId: 1, width: 120 });
    target.dispatchEvent(palm);
    expect(palm.defaultPrevented).toBe(true);
    expect(guard.activePointerId()).toBeNull();
    const tall = ev('pointerdown', { pointerId: 2, height: 120 });
    target.dispatchEvent(tall);
    expect(guard.activePointerId()).toBeNull();
    expect(seen).toEqual([]);
  });

  it('does not treat large mouse contacts as palms', () => {
    const { target, guard } = setup();
    target.dispatchEvent(ev('pointerdown', { pointerId: 1, pointerType: 'mouse', width: 200 }));
    expect(guard.activePointerId()).toBe(1);
  });

  it('lastInputAt uses the injected clock and updates on every pointerdown (even blocked)', () => {
    const { target, guard, setNow } = setup(1000);
    expect(guard.lastInputAt()).toBe(1000);
    setNow(2500);
    target.dispatchEvent(ev('pointerdown', { pointerId: 1 }));
    expect(guard.lastInputAt()).toBe(2500);
    setNow(3000);
    target.dispatchEvent(ev('pointerdown', { pointerId: 2 }));
    expect(guard.lastInputAt()).toBe(3000);
  });

  it('calls onInput on pointerdown', () => {
    const target = new EventTarget();
    let n = 0;
    installPointerGuard(
      target,
      () => 0,
      () => n++,
    );
    target.dispatchEvent(ev('pointerdown', { pointerId: 1 }));
    expect(n).toBe(1);
  });

  it('pointercancel releases the active pointer', () => {
    const { target, guard } = setup();
    target.dispatchEvent(ev('pointerdown', { pointerId: 1 }));
    target.dispatchEvent(ev('pointercancel', { pointerId: 1 }));
    expect(guard.activePointerId()).toBeNull();
  });

  it('reset() releases the active pointer', () => {
    const { target, guard } = setup();
    target.dispatchEvent(ev('pointerdown', { pointerId: 1 }));
    guard.reset();
    expect(guard.activePointerId()).toBeNull();
    target.dispatchEvent(ev('pointerdown', { pointerId: 2 }));
    expect(guard.activePointerId()).toBe(2);
  });

  it('blur releases the active pointer', () => {
    const { target, guard } = setup();
    target.dispatchEvent(ev('pointerdown', { pointerId: 1 }));
    target.dispatchEvent(new Event('blur'));
    expect(guard.activePointerId()).toBeNull();
  });

  it('ignores pointers on native form controls, whose picker swallows the lift (D102)', () => {
    class Control extends EventTarget {
      closest(sel: string) {
        return sel.includes('select') ? this : null;
      }
    }
    const target = new Control();
    const guard = installPointerGuard(target, () => 0);
    target.dispatchEvent(ev('pointerdown', { pointerId: 1 }));
    expect(guard.activePointerId()).toBeNull();
  });

  it('a value change (native picker closed) releases the active pointer', () => {
    const { target, guard } = setup();
    target.dispatchEvent(ev('pointerdown', { pointerId: 1 }));
    target.dispatchEvent(new Event('change'));
    expect(guard.activePointerId()).toBeNull();
  });

  it('touchend with no fingers left releases a pointer whose lift was lost', () => {
    const { target, guard } = setup();
    target.dispatchEvent(ev('pointerdown', { pointerId: 1 }));
    target.dispatchEvent(Object.assign(new Event('touchend'), { touches: { length: 1 } }));
    expect(guard.activePointerId()).toBe(1);
    target.dispatchEvent(Object.assign(new Event('touchend'), { touches: { length: 0 } }));
    expect(guard.activePointerId()).toBeNull();
    target.dispatchEvent(ev('pointerdown', { pointerId: 2 }));
    expect(guard.activePointerId()).toBe(2);
  });

  it('dispose() removes the listeners', () => {
    const { target, guard, seen } = setup();
    guard.dispose();
    target.dispatchEvent(ev('pointerdown', { pointerId: 1 }));
    target.dispatchEvent(ev('pointerdown', { pointerId: 2 }));
    expect(guard.activePointerId()).toBeNull();
    expect(seen).toEqual(['pointerdown:1', 'pointerdown:2']);
  });
});
