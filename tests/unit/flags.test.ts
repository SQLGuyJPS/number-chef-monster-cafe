import { describe, expect, it } from 'vitest';
import { parseFlags } from '../../src/app/flags';

describe('parseFlags', () => {
  it('defaults: no debug, rotation allowed', () => {
    expect(parseFlags('')).toEqual({ debug: false, allowRotate: true, gallery: false, mock: false });
  });
  it('?debug', () => {
    expect(parseFlags('?debug')).toEqual({ debug: true, allowRotate: true, gallery: false, mock: false });
  });
  it('?rotate=off', () => {
    expect(parseFlags('?rotate=off')).toEqual({ debug: false, allowRotate: false, gallery: false, mock: false });
  });
  it('?debug&rotate=off', () => {
    expect(parseFlags('?debug&rotate=off')).toEqual({ debug: true, allowRotate: false, gallery: false, mock: false });
  });
  it('other rotate values keep rotation on', () => {
    expect(parseFlags('?rotate=on')).toEqual({ debug: false, allowRotate: true, gallery: false, mock: false });
  });
});

describe('parseFlags ?gallery', () => {
  it('opens the monster sheet', () => {
    expect(parseFlags('?gallery').gallery).toBe(true);
  });
});

describe('parseFlags ?mock', () => {
  it('opens the counter layout mock', () => {
    expect(parseFlags('?mock&v=s0').mock).toBe(true);
  });
});
