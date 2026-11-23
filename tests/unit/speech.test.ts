// Count-aloud cut-off rules (D75) and comma-free spoken form (D77), against a fake speech engine.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface FakeUtterance {
  text: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

let spoken: FakeUtterance[];
let playing: FakeUtterance | null;
let cancels: number;

const fakeSynth = {
  get speaking() {
    return playing !== null;
  },
  pending: false,
  paused: false,
  resume: () => undefined,
  cancel: () => {
    cancels++;
    const u = playing;
    playing = null;
    u?.onerror?.(); // browsers fire `error` ("interrupted") on the cancelled line
  },
  speak: (u: FakeUtterance) => {
    spoken.push(u);
    playing = u;
  },
  getVoices: () => [],
};

const endCurrent = () => {
  const u = playing;
  playing = null;
  u?.onend?.();
};

beforeEach(() => {
  spoken = [];
  playing = null;
  cancels = 0;
  vi.useFakeTimers();
  vi.stubGlobal('window', {
    speechSynthesis: fakeSynth,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  });
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      onend = null;
      onerror = null;
      constructor(public text: string) {}
    },
  );
  vi.resetModules();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const load = () => import('../../src/audio/speech');

describe('countAloud (D75)', () => {
  it('a new count cuts off the previous count', async () => {
    const sp = await load();
    sp.countAloud('six');
    sp.countAloud('seven');
    sp.countAloud('eight');
    expect(spoken.map((u) => u.text)).toEqual(['six', 'seven', 'eight']);
    expect(playing?.text).toBe('eight');
  });

  it('never cuts off another line; counts during it are skipped', async () => {
    const sp = await load();
    void sp.speakText('Five plus two cookies, please!');
    sp.countAloud('six');
    expect(spoken).toHaveLength(1);
    expect(sp.speechBusy()).toBe(true);
  });

  it('busy ends when the line really ends, not at the timeout estimate', async () => {
    const sp = await load();
    void sp.speakText('Your turn! Follow me.');
    endCurrent();
    expect(sp.speechBusy()).toBe(false);
    sp.countAloud('six');
    expect(playing?.text).toBe('six');
  });

  it('the timeout still frees speech when `end` never fires', async () => {
    const sp = await load();
    void sp.speakText('Your turn! Follow me.');
    vi.advanceTimersByTime(8000);
    expect(sp.speechBusy()).toBe(false);
  });

  it('a count does not block the next line', async () => {
    const sp = await load();
    sp.countAloud('six');
    expect(sp.speechBusy()).toBe(false);
    void sp.speakText('Yum! Seven!');
    expect(playing?.text).toBe('Yum! Seven!');
  });
});

describe('start watchdog (D88)', () => {
  it('a line that never starts is retried once', async () => {
    const sp = await load();
    void sp.speakText('Five plus two cookies, please!');
    vi.advanceTimersByTime(1600);
    expect(spoken.map((u) => u.text)).toEqual(['Five plus two cookies please!', 'Five plus two cookies please!']);
    vi.advanceTimersByTime(3000);
    expect(spoken).toHaveLength(2);
  });

  it('the retried line keeps speech busy for its own full length', async () => {
    const sp = await load();
    const text = 'Five plus two cookies please!';
    void sp.speakText(text);
    const ms = sp.speechTimeoutMs(text);
    vi.advanceTimersByTime(1600); // retried here
    vi.advanceTimersByTime(ms - 1600 + 100); // past the first fallback
    expect(sp.speechBusy()).toBe(true);
    vi.advanceTimersByTime(1600);
    expect(sp.speechBusy()).toBe(false);
  });

  it('no retry once the line has started, or when a newer line replaced it', async () => {
    const sp = await load();
    void sp.speakText('Yum! Seven!');
    (spoken[0] as unknown as { onstart: () => void }).onstart();
    vi.advanceTimersByTime(1600);
    expect(spoken).toHaveLength(1);
    void sp.speakText('Thank you chef!');
    void sp.speakText('Bye!'); // replaces the line before its watchdog fires
    (spoken[2] as unknown as { onstart: () => void }).onstart();
    vi.advanceTimersByTime(1600);
    expect(spoken.map((u) => u.text)).toEqual(['Yum! Seven!', 'Thank you chef!', 'Bye!']);
  });
});

describe('spokenForm (D77)', () => {
  it('drops commas but keeps other punctuation', async () => {
    const sp = await load();
    expect(sp.spokenForm('All done! Thank you, chef!')).toBe('All done! Thank you chef!');
    expect(sp.spokenForm('I see three… I wanted five.')).toBe('I see three… I wanted five.');
  });

  it('the engine gets the comma-free text', async () => {
    const sp = await load();
    void sp.speakText('Five plus two cookies, please!');
    expect(spoken[0]?.text).toBe('Five plus two cookies please!');
  });
});

describe('WebKit cancel race (D178)', () => {
  const ipad = () =>
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15', platform: 'iPad', maxTouchPoints: 5 });

  it('no cancel when nothing is speaking', async () => {
    const sp = await load();
    void sp.speakText('Wallpaper!');
    expect(cancels).toBe(0);
    expect(playing?.text).toBe('Wallpaper!');
  });

  it('on iOS a line that cuts another off waits for the engine to settle; only the latest speaks', async () => {
    ipad();
    const sp = await load();
    const first = sp.speakText('Wallpaper!');
    expect(playing?.text).toBe('Wallpaper!');
    let firstDone = false;
    void first.then(() => (firstDone = true));
    void sp.speakText('Floor!');
    void sp.speakText('Lights!');
    await Promise.resolve();
    expect(firstDone).toBe(true); // the cut line settles at once
    expect(spoken.map((u) => u.text)).toEqual(['Wallpaper!']);
    vi.advanceTimersByTime(sp.CANCEL_SETTLE_MS);
    expect(spoken.map((u) => u.text)).toEqual(['Wallpaper!', 'Lights!']);
    expect(sp.speechBusy()).toBe(true);
  });

  it('off WebKit the next line still speaks at once', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile Safari/537.36', platform: 'Linux', maxTouchPoints: 5 });
    const sp = await load();
    void sp.speakText('Wallpaper!');
    void sp.speakText('Floor!');
    expect(spoken.map((u) => u.text)).toEqual(['Wallpaper!', 'Floor!']);
  });

  it('hush settles every line', async () => {
    const sp = await load();
    void sp.speakText('Wallpaper!');
    sp.hush();
    expect(sp.speechBusy()).toBe(false);
    expect(playing).toBeNull();
  });
});
