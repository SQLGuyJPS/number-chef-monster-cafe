// Shades for decor art (ART_GUIDE §2.3, §3): an item takes only its family's {base, accent} and
// derives every other tone from them, so a new colorway costs no new drawing and one family looks
// like one family in every slot.

const parse = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** `a` moved toward `b` by `t` (0 = a, 1 = b), as a #rrggbb string. */
export function mix(a: string, b: string, t: number): string {
  const pa = parse(a);
  const pb = parse(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i]! - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** The room's cream (ART_GUIDE §3): whites in the café are never pure white. */
export const CREAM = '#fffaf0';

/** A page-unique id for a pattern: the contact sheet draws many cafés on one page. */
export const patternId = (stem: string, ...colours: string[]): string =>
  `${stem}-${colours.map((c) => c.replace(/[^0-9a-z]/gi, '')).join('-')}`;
