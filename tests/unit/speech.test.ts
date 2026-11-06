// Count-aloud cut-off rules (D75) and comma-free spoken form (D77), against a fake speech engine.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface FakeUtterance {
  text: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

let spoken: FakeUtterance[];
let playing: FakeUtterance | null;

const fakeSynth = {
  cancel: () => {
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
  vi.useFakeTimers();
  vi.stubGlobal('window', { speechSynthesis: fakeSynth, setTimeout: globalThis.setTimeout });
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
