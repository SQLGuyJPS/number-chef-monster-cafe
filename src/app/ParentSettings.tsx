import { useEffect, useState } from 'react';
import { englishVoices, speakText, uniqueVoices } from '../audio/speech';
import { sfx } from '../audio/sfx';
import { getStorageBoot } from './runtime';
import {
  ORDER_CHOICES,
  RATE_MAX,
  RATE_MIN,
  saveSetting,
  useSettings,
  type DeviceSettings,
  type SettingKey,
} from './deviceSettings';

const ORDER_NAMES: Record<(typeof ORDER_CHOICES)[number], string> = {
  4: '4 monsters (shorter)',
  6: '6 monsters (standard)',
  8: '8 monsters (longer)',
};

async function save<K extends SettingKey>(key: K, value: DeviceSettings[K]): Promise<void> {
  const boot = await getStorageBoot()?.catch(() => null);
  await saveSetting(boot?.storage ?? null, key, value);
}

/** Voices load late and change (SPEC §8.2): `voiceschanged` plus retries. */
function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(englishVoices);
  useEffect(() => {
    const read = () => setVoices(englishVoices());
    const s = 'speechSynthesis' in window ? window.speechSynthesis : null;
    s?.addEventListener?.('voiceschanged', read);
    const ids = [250, 1000, 3000].map((ms) => window.setTimeout(read, ms));
    return () => {
      s?.removeEventListener?.('voiceschanged', read);
      ids.forEach((id) => window.clearTimeout(id));
    };
  }, []);
  return voices;
}

function Volume({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="parent-range">
      <span>{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        step={10}
        data-testid={id}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
      <output>{Math.round(value * 100)}%</output>
    </label>
  );
}

/**
 * Settings (SPEC §12, M3b): orders per service, voice, speed and a test, volumes, reduced motion.
 * All per device (SPEC §11.3, D135); each applies at once, orders from the next service.
 */
export function ParentSettings() {
  const s = useSettings();
  const voices = uniqueVoices(useVoices(), s.voiceURI);
  const chosenMissing = s.voiceURI !== null && !voices.some((v) => v.voiceURI === s.voiceURI);
  return (
    <section className="parent-settings" data-testid="parent-settings">
      <h2>Settings</h2>
      <p className="parent-note">These apply to this device only.</p>

      <h3>Orders per service</h3>
      <p>
        <select
          className="parent-select"
          data-testid="setting-orders"
          value={s.ordersPerService}
          onChange={(e) => void save('ordersPerService', Number(e.target.value) as DeviceSettings['ordersPerService'])}
        >
          {ORDER_CHOICES.map((n) => (
            <option key={n} value={n}>
              {ORDER_NAMES[n]}
            </option>
          ))}
        </select>
      </p>

      <h3>Voice</h3>
      <p>
        <select
          className="parent-select"
          data-testid="setting-voice"
          value={s.voiceURI ?? ''}
          onChange={(e) => void save('voiceURI', e.target.value || null)}
        >
          <option value="">Automatic (best on this device)</option>
          {chosenMissing && <option value={s.voiceURI ?? ''}>Chosen voice (not available now)</option>}
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name} ({v.lang}){v.localService ? '' : ' · needs internet'}
            </option>
          ))}
        </select>
      </p>
      {voices.length === 0 && (
        <p className="parent-note" data-testid="no-voices">
          No English voices found yet. The words always show on screen, so the game works without one.
        </p>
      )}
      <label className="parent-range">
        <span>Speed</span>
        <input
          type="range"
          min={RATE_MIN}
          max={RATE_MAX}
          step={0.05}
          data-testid="setting-rate"
          value={s.speechRate}
          onChange={(e) => void save('speechRate', Number(e.target.value))}
        />
        <output>{s.speechRate.toFixed(2)}</output>
      </label>
      <p>
        <button
          type="button"
          className="parent-button"
          data-testid="voice-test"
          onClick={() => void speakText('Five plus three cookies, please!')}
        >
          Test the voice
        </button>
      </p>

      <h3>Volume</h3>
      <Volume id="setting-master" label="Overall" value={s.masterVolume} onChange={(v) => void save('masterVolume', v)} />
      <Volume id="setting-sfx" label="Sounds" value={s.sfxVolume} onChange={(v) => void save('sfxVolume', v)} />
      <Volume id="setting-voice-volume" label="Voice" value={s.voiceVolume} onChange={(v) => void save('voiceVolume', v)} />
      <p>
        <button type="button" className="parent-button" data-testid="sound-test" onClick={() => sfx.correct()}>
          Test the sounds
        </button>
      </p>
      <p className="parent-note">
        The device&apos;s own volume buttons still apply. Some devices (iPhone and iPad) ignore the voice volume.
      </p>

      <h3>Motion</h3>
      <label className="parent-check">
        <input
          type="checkbox"
          data-testid="setting-reduced-motion"
          checked={s.reducedMotion}
          onChange={(e) => void save('reducedMotion', e.target.checked)}
        />
        <span>
          Reduce motion: the food, monsters and buttons move as little as possible. It is always on when the
          device&apos;s own Reduce Motion setting is on.
        </span>
      </label>
    </section>
  );
}
