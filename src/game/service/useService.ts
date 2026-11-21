import { useEffect, useState, useSyncExternalStore } from 'react';
import { getTimeScale, setServiceProbe } from '../../app/runtime';
import { PIP_PITCH } from '../../audio/speech';
import { countLine, hushVoice, say } from '../../audio/voice';
import { voiceFor } from '../../engine/clips';
import { sfx } from '../../audio/sfx';
import { newId } from '../../storage/ids';
import { specFor } from '../../art/monsters/specs';
import { ServiceController, type ServiceDeps, type ServiceOptions } from './controller';

const browserDeps: ServiceDeps = {
  // Recorded clips in the speaker's voice (SPEC §8.4); the TTS fallback keeps Pip's pitch or the
  // monster's own voice (SPEC §7.2).
  speak: (line, who, monster) =>
    say(
      line,
      voiceFor(who === 'pip' ? 'pip' : 'monster', monster),
      who === 'pip' ? { pitch: PIP_PITCH } : monster ? { ...specFor(monster).voice } : {},
    ),
  lines: (monster) => {
    const s = specFor(monster);
    return { arrive: s.lines.arrive[0] ?? '', thanks: s.lines.thanks[0] ?? '', burps: s.reactions.includes('burp') };
  },
  // Counting while building is Pip's when recorded; its TTS fallback keeps the plain voice (D75).
  countAloud: (line) => countLine(line, 'pip'),
  hush: hushVoice,
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
