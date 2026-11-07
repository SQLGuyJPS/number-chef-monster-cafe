import { beforeEach, describe, expect, it, vi } from 'vitest';

// D87: a context that is interrupted, closed, or "running" with a frozen clock is replaced inside
// the next gesture; a suspended one is only resumed.
class FakeCtx {
  static made: FakeCtx[] = [];
  state = 'running';
  currentTime = 0;
  destination = {};
  closed = false;
  constructor() {
    FakeCtx.made.push(this);
  }
  resume = vi.fn(() => Promise.resolve());
  close = vi.fn(() => {
    this.closed = true;
    return Promise.resolve();
  });
  createBuffer = () => ({});
  createBufferSource = () => ({ buffer: null, connect: () => undefined, start: () => undefined });
}

let now = 0;

async function fresh() {
  vi.resetModules();
  FakeCtx.made = [];
  now = 1000;
  vi.stubGlobal('window', { AudioContext: FakeCtx, setInterval: () => 1 });
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  const m = await import('../../src/audio/unlock');
  m.ensureAudio();
  return m;
}

describe('ensureAudio (D87)', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('keeps a running context whose clock moves', async () => {
    const m = await fresh();
    for (let i = 1; i <= 5; i++) {
      now += 500;
      FakeCtx.made[0]!.currentTime = i * 0.5;
      m.ensureAudio();
    }
    expect(FakeCtx.made).toHaveLength(1);
  });

  it('replaces a running context whose clock has frozen', async () => {
    const m = await fresh();
    now += 100;
    FakeCtx.made[0]!.currentTime = 0.1;
    m.ensureAudio(); // clock moved: fine
    now += 1000; // clock stuck at 0.1 for a second
    m.ensureAudio();
    expect(FakeCtx.made).toHaveLength(2);
    expect(FakeCtx.made[0]!.closed).toBe(true);
    expect(m.getAudioContext()).toBe(FakeCtx.made[1]);
    expect(m.audioStats.rebuilds).toBe(1);
  });

  it('never replaces the context while speech is talking (D88)', async () => {
    const m = await fresh();
    const w = window as unknown as { speechSynthesis?: { speaking: boolean } };
    w.speechSynthesis = { speaking: true };
    FakeCtx.made[0]!.state = 'interrupted';
    m.ensureAudio();
    expect(FakeCtx.made).toHaveLength(1);
    w.speechSynthesis.speaking = false;
    m.ensureAudio();
    expect(FakeCtx.made).toHaveLength(2);
  });

  it('ignores a `speaking` flag stuck longer than any line can last (D88)', async () => {
    const m = await fresh();
    (window as unknown as { speechSynthesis: { speaking: boolean } }).speechSynthesis = { speaking: true };
    FakeCtx.made[0]!.state = 'interrupted';
    m.ensureAudio();
    now += 5000;
    m.ensureAudio();
    expect(FakeCtx.made).toHaveLength(1);
    now += 5000;
    m.ensureAudio();
    expect(FakeCtx.made).toHaveLength(2);
  });

  it('replaces an interrupted context and only resumes a suspended one', async () => {
    const m = await fresh();
    FakeCtx.made[0]!.state = 'suspended';
    m.ensureAudio();
    expect(FakeCtx.made).toHaveLength(1);
    expect(FakeCtx.made[0]!.resume).toHaveBeenCalledTimes(2);
    FakeCtx.made[0]!.state = 'interrupted';
    m.ensureAudio();
    expect(FakeCtx.made).toHaveLength(2);
  });
});
