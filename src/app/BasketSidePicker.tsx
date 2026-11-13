import { useEffect, useState } from 'react';
import type { BasketSide } from './metrics';
import { getStorageBoot } from './runtime';
import { loadBasketSide, saveBasketSide } from './basketSide';

/**
 * Basket side for this device (D115): the basket goes on the hand the child drags with; Pip and the
 * bell on the other side. Applies from the next service.
 */
export function BasketSidePicker() {
  const [side, setSide] = useState<BasketSide | null>(null);
  useEffect(() => {
    let live = true;
    void getStorageBoot()?.then(async (b) => {
      const s = await loadBasketSide(b.storage);
      if (live) setSide(s);
    });
    return () => {
      live = false;
    };
  }, []);
  const change = async (next: BasketSide) => {
    const boot = await getStorageBoot();
    if (!boot) return;
    await saveBasketSide(boot.storage, next);
    setSide(next);
  };
  if (!side) return null;
  return (
    <section data-testid="basket-side-picker">
      <h2>Basket side (this device, from the next service)</h2>
      <p>
        <select
          data-testid="basket-side"
          value={side}
          onChange={(e) => void change(e.target.value === 'left' ? 'left' : 'right')}
        >
          <option value="right">Right (right-handed child)</option>
          <option value="left">Left (left-handed child)</option>
        </select>
      </p>
    </section>
  );
}
