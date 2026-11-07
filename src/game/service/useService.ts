import { useEffect, useState, useSyncExternalStore } from 'react';
import { getTimeScale, setServiceProbe } from '../../app/runtime';
import { PIP_PITCH, countAloud, hush, speakText } from '../../audio/speech';
import { sfx } from '../../audio/sfx';
import { newId } from '../../storage/ids';
import { ServiceController, type ServiceDeps, type ServiceOptions } from './controller';

const browserDeps: ServiceDeps = {
  speak: (text, who) => speakText(text, who === 'pip' ? { pitch: PIP_PITCH } : {}),
  countAloud,
  hush,
  sfx,
  now: () => performance.now(),
  wall: () => Date.now(),
  newId: () => newId(),
  timeScale: getTimeScale,
  setTimeout: (f, ms) => window.setTimeout(f, ms),
  clearTimeout: (id) => window.clearTimeout(id),
};

/** One controller per service; the screen re-renders from its snapshots. */
export function useService(opts: ServiceOptions) {
  const [ctrl] = useState(() => new ServiceController(opts, browserDeps));
  const view = useSyncExternalStore(ctrl.subscribe, ctrl.getView);
  useEffect(() => {
    ctrl.start();
    setServiceProbe(() => ctrl.probe());
    return () => {
      setServiceProbe(null);
      ctrl.dispose();
    };
  }, [ctrl]);
  return { view, ctrl };
}
