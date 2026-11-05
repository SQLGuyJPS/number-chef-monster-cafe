import { describe, expect, it } from 'vitest';
import { parseFlags } from '../../src/app/flags';

describe('parseFlags', () => {
  it('defaults: no debug, rotation allowed', () => {
    expect(parseFlags('')).toEqual({ debug: false, allowRotate: true, mock: null });
  });
  it('?debug', () => {
    expect(parseFlags('?debug')).toEqual({ debug: true, allowRotate: true, mock: null });
  });
  it('?rotate=off', () => {
    expect(parseFlags('?rotate=off')).toEqual({ debug: false, allowRotate: false, mock: null });
  });
  it('?debug&rotate=off', () => {
    expect(parseFlags('?debug&rotate=off')).toEqual({ debug: true, allowRotate: false, mock: null });
  });
  it('other rotate values keep rotation on', () => {
    expect(parseFlags('?rotate=on')).toEqual({ debug: false, allowRotate: true, mock: null });
  });
});
