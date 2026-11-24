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

/** A five-point star with softened points (draw with a same-colour stroke and round joins). */
export function starPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.48 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}

/** A full ellipse as path data, so many shapes of one colour can share one element. */
export const ellipsePath = (cx: number, cy: number, rx: number, ry: number = rx): string =>
  `M${(cx - rx).toFixed(1)} ${cy.toFixed(1)}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;

/** A four-point sparkle (a glint of light), curved in to its centre. */
export const sparklePath = (cx: number, cy: number, r: number): string =>
  `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;
