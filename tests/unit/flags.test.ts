import { describe, expect, it } from 'vitest';
import { parseFlags } from '../../src/app/flags';

describe('parseFlags', () => {
  it('defaults: no debug, rotation allowed', () => {
    expect(parseFlags('')).toEqual({ debug: false, allowRotate: true });
  });
  it('?debug', () => {
    expect(parseFlags('?debug')).toEqual({ debug: true, allowRotate: true });
  });
  it('?rotate=off', () => {
    expect(parseFlags('?rotate=off')).toEqual({ debug: false, allowRotate: false });
  });
  it('?debug&rotate=off', () => {
    expect(parseFlags('?debug&rotate=off')).toEqual({ debug: true, allowRotate: false });
  });
  it('other rotate values keep rotation on', () => {
    expect(parseFlags('?rotate=on')).toEqual({ debug: false, allowRotate: true });
  });
});
