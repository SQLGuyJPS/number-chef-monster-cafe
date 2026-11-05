import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/andika/latin-400.css';
import '@fontsource/andika/latin-700.css';
import './app/theme.css';
import './app/global.css';
import { App } from './app/App';
import { DebugScreen } from './app/DebugScreen';
import { parseFlags } from './app/flags';
import { installTouchHardening } from './game/input/touchHardening';
import { installPointerGuard } from './game/input/pointerGuard';
import { installAudioResume } from './audio/unlock';
import { openStorage } from './storage/open';
import { getCurrentScreen, lastInputAt, setPointerGuard, setStorageBoot } from './app/runtime';
import { initPwa } from './app/pwa';

const flags = parseFlags(location.search);

if (import.meta.env.VITE_E2E === '1') {
  void import('./app/e2eHooks').then((m) => m.installE2eHooks());
}

setStorageBoot(openStorage(() => Date.now()));
initPwa(getCurrentScreen, lastInputAt);

if (flags.debug) {
  document.documentElement.classList.add('debug-mode');
} else {
  installTouchHardening(document);
  setPointerGuard(installPointerGuard(window, () => performance.now()));
  installAudioResume(window);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{flags.debug ? <DebugScreen /> : <App allowRotate={flags.allowRotate} />}</StrictMode>,
);
