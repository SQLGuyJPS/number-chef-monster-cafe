import { describe, expect, it } from 'vitest';
import { parseFlags } from '../../src/app/flags';

describe('parseFlags', () => {
  it('defaults: no debug, rotation allowed', () => {
    expect(parseFlags('')).toEqual({
      debug: false,
      allowRotate: true,
      gallery: false,
      speedtest: false,
      mock: false,
    });
  });
  it('?debug', () => {
    expect(parseFlags('?debug')).toEqual({
      debug: true,
      allowRotate: true,
      gallery: false,
      speedtest: false,
      mock: false,
    });
  });
  it('?rotate=off', () => {
    expect(parseFlags('?rotate=off')).toEqual({
      debug: false,
      allowRotate: false,
      gallery: false,
      speedtest: false,
      mock: false,
    });
  });
  it('?debug&rotate=off', () => {
    expect(parseFlags('?debug&rotate=off')).toEqual({
      debug: true,
      allowRotate: false,
      gallery: false,
      speedtest: false,
      mock: false,
    });
  });
  it('other rotate values keep rotation on', () => {
    expect(parseFlags('?rotate=on')).toEqual({
      debug: false,
      allowRotate: true,
      gallery: false,
      speedtest: false,
      mock: false,
    });
  });
});

describe('parseFlags ?gallery', () => {
  it('opens the monster sheet', () => {
    expect(parseFlags('?gallery').gallery).toBe(true);
  });
});

describe('parseFlags ?speedtest (D112)', () => {
  it('off by default', () => {
    expect(parseFlags('').speedtest).toBe(false);
  });
  it('?speedtest runs the full test', () => {
    expect(parseFlags('?speedtest').speedtest).toBe('full');
  });
  it('?speedtest=quick runs the short one', () => {
    expect(parseFlags('?speedtest=quick').speedtest).toBe('quick');
  });
});

describe('parseFlags ?mock', () => {
  it('opens the counter layout mock', () => {
    expect(parseFlags('?mock&v=s0').mock).toBe(true);
  });
});
