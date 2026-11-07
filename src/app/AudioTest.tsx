import { useEffect, useState } from 'react';
import { sfx } from '../audio/sfx';
import { speakText } from '../audio/speech';
import {
  AUDIO_SESSION_MODES,
  audioSessionType,
  audioStats,
  ensureAudio,
  getAudioContext,
  getAudioSessionMode,
  rebuildAudio,
  setAudioSessionMode,
  type AudioSessionMode,
} from '../audio/unlock';

/**
 * Sound test on the debug screen (D87): lets the owner reproduce the iOS speech-versus-WebAudio
 * problem on the real device and read off the AudioContext's state, which nothing here can see.
 */
export function AudioTest() {
  const [, tick] = useState(0);
  const [mode, setMode] = useState<AudioSessionMode>(getAudioSessionMode());
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  const ctx = getAudioContext();
  const run = (f: () => void) => () => {
    ensureAudio();
    f();
  };
  const rows: [string, string][] = [
    ['Context', ctx ? ctx.state : 'none yet (tap a button)'],
    ['Clock', ctx ? `${ctx.currentTime.toFixed(2)} s` : '-'],
    ['Contexts built', `${audioStats.contextsCreated} (rebuilt ${audioStats.rebuilds})`],
    ['Tones', `played ${audioStats.tonesPlayed} · skipped ${audioStats.tonesSkipped}`],
    ['audioSession', audioSessionType()],
  ];

  return (
    <section className="audio-test" data-testid="audio-test">
      <h2>Sound test</h2>
      <table>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <th>{k}</th>
              <td data-testid={`audio-${k.toLowerCase().replace(/\s+/g, '-')}`}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <button type="button" onClick={run(() => sfx.place(3))}>Tone</button>{' '}
        <button type="button" onClick={run(() => sfx.bell())} data-testid="audio-bell">Bell</button>{' '}
        <button type="button" onClick={run(() => void speakText('One, two, three.').then(() => sfx.bell()))}>
          Speak, then bell
        </button>{' '}
        <button
          type="button"
          onClick={run(() => {
            sfx.bell();
            window.setTimeout(() => void speakText('Yum!'), 500);
          })}
        >
          Bell, then speak
        </button>{' '}
        <button type="button" onClick={() => rebuildAudio()}>Rebuild sound</button>
      </p>
      <p>
        audioSession type (iOS 17+; applies now and at next launch):{' '}
        <select
          value={mode}
          onChange={(e) => {
            const m = e.target.value as AudioSessionMode;
            setMode(m);
            setAudioSessionMode(m);
          }}
        >
          {AUDIO_SESSION_MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </p>
    </section>
  );
}
