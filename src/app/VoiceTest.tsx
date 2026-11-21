import { useEffect, useState } from 'react';
import { ensureAudio } from '../audio/unlock';
import { PIP_PITCH, type SpeakOptions } from '../audio/speech';
import {
  getCrossfadeMs,
  getVoiceManifest,
  loadVoiceManifest,
  missingFor,
  sayClips,
  setCrossfadeMs,
  voiceCacheStats,
  voiceLog,
} from '../audio/voice';
import {
  CLIP_POLICY,
  VOICE_IDS,
  VOICE_SHIFTS,
  clipPlan,
  clipTranscript,
  type ClipPolicy,
  type NumberForm,
} from '../engine/clips';
import { phrase } from '../engine/phrases';
import { SPIKE_LINES } from '../engine/voiceScript';
import { MONSTER_SPECS, specFor } from '../art/monsters/specs';

const nameOf = (v: string) =>
  MONSTER_SPECS.find((s) => s.id === v)?.name ?? (v === 'pip' ? 'Pip' : 'Narrator');
/** The TTS voice a fallback uses, as in the game (D90, SPEC §7.2). */
const ttsFor = (v: string): SpeakOptions =>
  v === 'pip' ? { pitch: PIP_PITCH } : v === 'narrator' ? {} : { ...specFor(v).voice };

interface Variant {
  label: string;
  clips: string[];
  text: string;
}

/**
 * The M13 listening test (PLAN §6.2 item 7, D139d): the spike lines played side by side on the
 * device, in any voice, with the join crossfade adjustable. Each button lists its clips; a line with
 * a clip not yet recorded says so and plays through TTS, as the game would.
 */
export function VoiceTest() {
  const [voice, setVoice] = useState('pip');
  const [xf, setXf] = useState(getCrossfadeMs());
  const [single, setSingle] = useState<NumberForm>('mid');
  const [, tick] = useState(0);
  useEffect(() => {
    void loadVoiceManifest().then(() => tick((n) => n + 1));
    const id = window.setInterval(() => tick((n) => n + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  const m = getVoiceManifest();
  const have = Object.keys(m?.voices[voice] ?? {}).length;
  const cache = voiceCacheStats();
  const last = voiceLog[voiceLog.length - 1];
  const shift = VOICE_SHIFTS[voice];
  const oneForm: ClipPolicy = {
    forms: { lead: single, mid: single, end: single, ask: single },
    pairs: false,
  };

  const play = (v: Variant) => () => {
    ensureAudio();
    void sayClips(voice, v.clips, v.text, ttsFor(voice)).then(() => tick((n) => n + 1));
  };

  const row = (id: string, title: string, variants: Variant[]) => (
    <div className="vt-row" key={id}>
      <div className="vt-line">{title}</div>
      <div className="vt-variants">
        {variants.map((v, i) => {
          const miss = missingFor(voice, v.clips);
          return (
            <div className="vt-variant" key={i}>
              <button type="button" data-testid={`vt-${id}-${i}`} onClick={play(v)}>
                {v.label}
                {miss.length ? ' (TTS)' : ''}
              </button>
              <div className="vt-clips">
                {v.clips.map((c) => (
                  <code key={c} className={miss.includes(c) ? 'vt-missing' : undefined}>
                    {c}
                  </code>
                ))}
                {miss.length > 0 && (
                  <span className="vt-missing"> not recorded: {miss.join(', ')}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const refs = SPIKE_LINES.filter((l) => l.ref);
  const forms = SPIKE_LINES.filter((l) => l.key.startsWith('order') || l.key.startsWith('plate'));
  const counts = SPIKE_LINES.filter((l) => l.key.startsWith('ct.'));

  return (
    <section className="voice-test" data-testid="voice-test">
      <h2>Voice test</h2>
      <p>
        The listening test for recorded voices (M13). Play each pair and compare. Lines with a clip
        not recorded yet play through the device voice, as the game would.
      </p>
      <p>
        Voice{' '}
        <select data-testid="vt-voice" value={voice} onChange={(e) => setVoice(e.target.value)}>
          {VOICE_IDS.map((v) => (
            <option key={v} value={v}>
              {nameOf(v)}
            </option>
          ))}
        </select>{' '}
        <span data-testid="vt-have">
          {m ? `${have} clips recorded for this voice` : 'no voice manifest'}
        </span>
        {shift && (
          <span>
            {' '}
            · shift {shift.semitones > 0 ? '+' : ''}
            {shift.semitones} semitones, tempo ×{shift.tempo}
          </span>
        )}
      </p>
      <p>
        <label>
          Crossfade at joins: {xf} ms{' '}
          <input
            type="range"
            min={0}
            max={40}
            step={5}
            value={xf}
            data-testid="vt-xfade"
            onChange={(e) => {
              setCrossfadeMs(Number(e.target.value));
              setXf(getCrossfadeMs());
            }}
          />
        </label>
      </p>

      <h3>(a) Stitched or one take</h3>
      {refs.map((l, i) =>
        row(`ref${i}`, phrase(l.key, l.params), [
          { label: 'Stitched', clips: clipPlan(l.key, l.params), text: phrase(l.key, l.params) },
          { label: 'One take', clips: [l.ref!], text: clipTranscript(l.ref!) ?? '' },
        ]),
      )}

      <h3>(b) Three number forms or one</h3>
      <p>
        One form uses the{' '}
        <select
          data-testid="vt-single"
          value={single}
          onChange={(e) => setSingle(e.target.value as NumberForm)}
        >
          {(['lead', 'mid', 'end'] as const).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>{' '}
        recording of every number.
      </p>
      {forms.map((l, i) =>
        row(`form${i}`, phrase(l.key, l.params), [
          {
            label: 'Three forms',
            clips: clipPlan(l.key, l.params, CLIP_POLICY),
            text: phrase(l.key, l.params),
          },
          {
            label: 'One form',
            clips: clipPlan(l.key, l.params, oneForm),
            text: phrase(l.key, l.params),
          },
        ]),
      )}

      <h3>(c) Counting: pair clip or two clips</h3>
      {counts.map((l, i) =>
        row(`pair${i}`, phrase(l.key, l.params), [
          {
            label: 'Pair',
            clips: clipPlan(l.key, l.params, { ...CLIP_POLICY, pairs: true }),
            text: phrase(l.key, l.params),
          },
          {
            label: 'Two clips',
            clips: clipPlan(l.key, l.params, CLIP_POLICY),
            text: phrase(l.key, l.params),
          },
        ]),
      )}

      <table>
        <tbody>
          <tr>
            <th>Last line</th>
            <td data-testid="vt-last">
              {last
                ? `${last.mode}${last.why ? ` (${last.why})` : ''}${last.outcome ? `, ${last.outcome}` : ', playing'}: ${last.text}`
                : '-'}
            </td>
          </tr>
          <tr>
            <th>Decoded cache</th>
            <td>
              {cache.clips} clips, {(cache.bytes / 1048576).toFixed(1)} of{' '}
              {(cache.cap / 1048576).toFixed(0)} MB
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
