import { afterEach, describe, expect, it, vi } from 'vitest';

// D86: iOS leaves the AudioContext "interrupted" after speech; a tone asked for in the same tap
// as the resume must still play once the context is running, not be skipped.
let fake: FakeCtx | null = null;
vi.mock('../../src/audio/unlock', () => ({
  getAudioContext: () => fake,
  audioStats: { contextsCreated: 0, rebuilds: 0, tonesPlayed: 0, tonesSkipped: 0 },
}));
const { sfx } = await import('../../src/audio/sfx');

class FakeCtx {
  started = 0;
  currentTime = 0;
  destination = {};
  constructor(public state: string) {}
  resume = vi.fn(() => {
    this.state = 'running';
    return Promise.resolve();
  });
  createOscillator() {
    const param = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
    return {
      type: 'sine',
      frequency: param,
      connect: (n: unknown) => n,
      start: () => void this.started++,
      stop() {},
    };
  }
  createGain() {
    const param = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
    return { gain: param, connect: (n: unknown) => n };
  }
}

afterEach(() => {
  fake = null;
});

describe('sfx', () => {
  it('plays at once while the context runs', () => {
    fake = new FakeCtx('running');
    sfx.bell();
    expect(fake.started).toBe(2);
    expect(fake.resume).not.toHaveBeenCalled();
  });

  it('resumes an interrupted context and then plays (D86)', async () => {
    fake = new FakeCtx('interrupted');
    sfx.place(3);
    expect(fake.started).toBe(0);
    await Promise.resolve();
    await Promise.resolve();
    expect(fake.resume).toHaveBeenCalled();
    expect(fake.started).toBe(1);
  });

  it('does nothing without a context or with a closed one', () => {
    expect(() => sfx.bell()).not.toThrow();
    fake = new FakeCtx('closed');
    sfx.bell();
    expect(fake.started).toBe(0);
    expect(fake.resume).not.toHaveBeenCalled();
  });
});
