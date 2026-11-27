import { useState } from 'react';
import { CRATE_EVERY_MONSTERS } from '../engine/economy';
import { balance, servedMonsters } from '../engine/replay';
import { cratesLeft, deliveredCrates } from '../engine/shop';
import { loadedProgress, useDerived } from './progress';
import { addShopFresh } from './shopFresh';
import { setShopPlaytest, useShopPlaytest } from './shopPlaytest';

const MAX_COINS = 99_999;

/**
 * Shop playtest tools (SPEC §12, D179, D180), under Basket side: set the coin jar, and send a
 * crate (or replay the last delivery) on the next shop visit, so the shop can be tried quickly
 * without serving monsters in between. The coin change and every crate are real log entries.
 */
export function ShopPlaytestTools() {
  const d = useDerived();
  const request = useShopPlaytest();
  const coins = balance(d);
  const [draft, setDraft] = useState<string | null>(null);
  const [allConfirm, setAllConfirm] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const delivered = deliveredCrates(d);
  const left = cratesLeft(d);
  const lastN = delivered.length > 0 ? delivered[delivered.length - 1]! : null;
  const nextDue = lastN === null ? 0 : d.crates[lastN]!;

  const value = draft ?? String(coins);
  const target = Number(value);
  const valid =
    value.trim() !== '' && Number.isInteger(target) && target >= 0 && target <= MAX_COINS;

  const setCoins = () => {
    if (!valid) return;
    loadedProgress()?.setCoins(target);
    setDraft(null);
    setNote(`The jar now holds ${target} coins.`);
  };

  const deliverAll = () => {
    if (!allConfirm) {
      setAllConfirm(true);
      return;
    }
    const keys = loadedProgress()?.deliverAllCrates() ?? [];
    addShopFresh(keys);
    setAllConfirm(false);
    if (request === 'crate') setShopPlaytest(null);
    setNote(`Delivered ${keys.length} things to the shelf.`);
  };

  return (
    <section data-testid="shop-playtest">
      <h2>Shop playtest</h2>
      <p>
        For trying the shop quickly. These change the progress log like play does: coins set here
        and things bought with them stay (only Reset or Replace undoes them), and crates sent here
        are delivered for good.
      </p>

      <h3>Coins in the jar</h3>
      <p>
        <label>
          Coins:{' '}
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_COINS}
            step={1}
            className="parent-select parent-number"
            data-testid="playtest-coins"
            value={value}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>{' '}
        <button
          type="button"
          className="parent-button"
          data-testid="playtest-coins-set"
          disabled={!valid || target === coins}
          onClick={setCoins}
        >
          Set coins
        </button>
      </p>
      <p className="parent-note">
        Now {coins} in the jar. Serving monsters still adds coins as usual.
      </p>

      <h3>Delivery crates</h3>
      <p className="parent-note" data-testid="playtest-crate-status">
        {delivered.length} delivered, {left} left. {servedMonsters(d)} monsters served;{' '}
        {left === 0
          ? 'no crates left to deliver.'
          : lastN === null
            ? 'the first crate comes on the next shop visit.'
            : `the next crate is due at ${nextDue} (and fewer than 6 unbought things on the shelf).`}
      </p>
      <p>
        {request === 'crate' ? (
          <button
            type="button"
            className="parent-button"
            data-testid="playtest-crate"
            onClick={() => setShopPlaytest(null)}
          >
            Crate waiting for the next shop visit (tap to cancel)
          </button>
        ) : (
          <button
            type="button"
            className="parent-button"
            data-testid="playtest-crate"
            disabled={left === 0}
            onClick={() => setShopPlaytest('crate')}
          >
            Send a crate on the next shop visit
          </button>
        )}
      </p>
      <p>
        {request === 'replay' ? (
          <button
            type="button"
            className="parent-button"
            data-testid="playtest-replay"
            onClick={() => setShopPlaytest(null)}
          >
            Replay waiting for the next shop visit (tap to cancel)
          </button>
        ) : (
          <button
            type="button"
            className="parent-button"
            data-testid="playtest-replay"
            disabled={lastN === null}
            onClick={() => setShopPlaytest('replay')}
          >
            Replay the last delivery on the next shop visit
          </button>
        )}
      </p>
      <p className="parent-note">
        A sent crate skips the {CRATE_EVERY_MONSTERS}-monster wait and the hold at 6 unbought; the
        next one is then due {CRATE_EVERY_MONSTERS} monsters from now. A replay shows the last crate
        arriving again and records nothing. Either one is used up on the next shop visit, and
        forgotten if the app is closed first.
      </p>
      <p>
        <button
          type="button"
          className={`parent-button${allConfirm ? ' parent-danger' : ''}`}
          data-testid="playtest-crate-all"
          disabled={left === 0}
          onClick={deliverAll}
        >
          {allConfirm ? `Tap again to deliver all ${left} crates` : 'Deliver every crate now'}
        </button>
        {allConfirm && (
          <>
            {' '}
            <button
              type="button"
              className="parent-button"
              data-testid="playtest-crate-all-cancel"
              onClick={() => setAllConfirm(false)}
            >
              Cancel
            </button>
          </>
        )}
      </p>
      {note && (
        <p className="parent-note" role="status" data-testid="playtest-note">
          {note}
        </p>
      )}
    </section>
  );
}
