import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/andika/latin-400.css';
import '@fontsource/andika/latin-700.css';
import './app/theme.css';
import './app/global.css';
import { App } from './app/App';
import { DebugScreen } from './app/DebugScreen';
import { MonsterGallery } from './app/MonsterGallery';
import { SpeedTest } from './app/speedtest/SpeedTest';
import { parseFlags } from './app/flags';
import { CounterMock, MockToolbar, parseMockOptions } from './app/CounterMock';
import { Stage } from './app/Stage';
import { installTouchHardening } from './game/input/touchHardening';
import { installPointerGuard } from './game/input/pointerGuard';
import { installAudioResume } from './audio/unlock';
import { openStorage } from './storage/open';
import { getCurrentScreen, lastInputAt, setPointerGuard, setStorageBoot } from './app/runtime';
import { initPwa } from './app/pwa';
import { startProgress } from './app/progress';
import { onSettings, startSettings } from './app/deviceSettings';
import { configureSpeech } from './audio/speech';
import { setSfxVolume } from './audio/sfx';
import { loadVoiceManifest } from './audio/voice';

const flags = parseFlags(location.search);

if (import.meta.env.VITE_E2E === '1') {
  void import('./app/e2eHooks').then((m) => m.installE2eHooks());
}

const storageBoot = openStorage(() => Date.now());
setStorageBoot(storageBoot);
// The event log loads beside the Splash, so Home's coin jar is ready by the first tap (SPEC §11.3).
void startProgress(storageBoot);
// Per-device parent settings (D135): audio levels, voice and the motion class follow every change.
void startSettings(storageBoot.then((b) => b.storage));
onSettings((s) => {
  configureSpeech({ voiceURI: s.voiceURI, rate: s.speechRate, volume: s.masterVolume * s.voiceVolume });
  setSfxVolume(s.masterVolume * s.sfxVolume);
  document.documentElement.classList.toggle('reduce-motion', s.reducedMotion);
});
initPwa(getCurrentScreen, lastInputAt);
// Which recorded clips exist (SPEC §8.4); until it loads, or if it fails, every line is TTS.
void loadVoiceManifest();

if (flags.mock) {
  // Look-only layout mock: the normal stage styles, no input hardening needed.
} else if (flags.debug || flags.gallery || flags.speedtest) {
  document.documentElement.classList.add('debug-mode');
} else {
  installTouchHardening(document);
  setPointerGuard(installPointerGuard(window, () => performance.now()));
  installAudioResume(window);
}

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    {flags.mock ? (
      <>
        <Stage allowRotate={flags.allowRotate} background={<div className="cafe-backdrop counter-backdrop" />}>
          <CounterMock opts={parseMockOptions(location.search)} />
        </Stage>
        {!parseMockOptions(location.search).clean && <MockToolbar opts={parseMockOptions(location.search)} />}
      </>
    ) : flags.speedtest ? (
      <SpeedTest quick={flags.speedtest === 'quick'} />
    ) : flags.gallery ? (
      <MonsterGallery />
    ) : flags.debug ? (
      <DebugScreen />
    ) : (
      <App allowRotate={flags.allowRotate} />
    )}
  </StrictMode>,
);
