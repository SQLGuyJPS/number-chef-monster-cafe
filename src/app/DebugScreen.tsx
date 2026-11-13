import { useEffect, useState } from 'react';
import { getStorageBoot } from './runtime';
import { getSwStatus } from './pwa';
import { APP_NAME } from './identity';
import { BasketSidePicker } from './BasketSidePicker';
import { SkillPicker } from './SkillPicker';
import { AudioTest } from './AudioTest';

interface Info {
  rows: [string, string][];
}

async function collect(): Promise<Info> {
  const rows: [string, string][] = [
    ['App', APP_NAME],
    ['Version', __APP_VERSION__],
    ['Build date', __BUILD_DATE__],
    ['Service worker', getSwStatus()],
    ['Standalone', String(matchMedia('(display-mode: standalone)').matches)],
    ['Viewport', `${innerWidth}×${innerHeight} @${devicePixelRatio}x`],
    ['User agent', navigator.userAgent],
  ];
  const boot = await getStorageBoot();
  if (boot) {
    rows.push([
      'Storage',
      boot.degraded ? `memory (IndexedDB failed: ${boot.error ?? '?'})` : boot.storage.kind,
    ]);
    rows.push(['Schema version', String(boot.schemaVersion)]);
    rows.push(['Device id', boot.deviceId]);
    const counts = await boot.storage.counts();
    rows.push([
      'Store rows',
      Object.entries(counts)
        .map(([k, v]) => `${k} ${v}`)
        .join(' · '),
    ]);
  }
  // Feature-detected: missing on Safari before 17 (D44g).
  const st = navigator.storage;
  rows.push([
    'Persisted',
    st?.persisted ? String(await st.persisted()) : 'not available on this device',
  ]);
  if (st?.estimate) {
    const e = await st.estimate();
    const mb = (n?: number) => (n === undefined ? '?' : `${(n / 1048576).toFixed(1)} MB`);
    rows.push(['Usage', `${mb(e.usage)} of ${mb(e.quota)}`]);
  } else {
    rows.push(['Usage', 'not available on this device']);
  }
  return { rows };
}

/**
 * Build/storage info, the stage/operations picker, the sound test and the speed-test link. Shown by the `?debug` screen
 * and, before M3a, by the grown-ups' screen behind the Home gear (D94).
 */
export function PlaytestTools() {
  const [info, setInfo] = useState<Info | null>(null);
  useEffect(() => {
    let live = true;
    void collect().then((i) => live && setInfo(i));
    return () => {
      live = false;
    };
  }, []);
  return (
    <>
      <table>
        <tbody>
          {info?.rows.map(([k, v]) => (
            <tr key={k}>
              <th>{k}</th>
              <td data-testid={`debug-${k.toLowerCase().replace(/\s+/g, '-')}`}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!info && <p>Loading…</p>}
      <SkillPicker />
      <BasketSidePicker />
      <AudioTest />
      <h2>Speed test</h2>
      <p>How many drawing pieces this device can show smoothly (D112). About 2 minutes.</p>
      <button
        type="button"
        className="st-open"
        data-testid="open-speedtest"
        onClick={() => (location.href = `${location.pathname}?speedtest`)}
      >
        Open the speed test
      </button>
    </>
  );
}

/** Hidden debug screen (`?debug`, SPEC §2.2): not rotated, scrollable, unreachable from child UI. */
export function DebugScreen() {
  return (
    <div className="debug" data-scroll-ok data-testid="debug-screen">
      <h1>Debug</h1>
      <h2>Counter layout mock</h2>
      <p>
        {(['full', 'waist'] as const).map((m) => (
          <button key={m} type="button" data-testid={`mock-${m}`} onClick={() => (location.search = `?mock&monster=${m}`)}>
            Monster {m === 'full' ? 'full height' : 'to the waist'}
          </button>
        ))}
      </p>
      <PlaytestTools />
    </div>
  );
}
