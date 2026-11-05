// Placeholder monster until the hand-authored roster lands in M2 (SPEC §7.2). Also the source of the
// app icons (scripts/make-icons.ts), so it is plain SVG markup with no dependencies.
export function placeholderMonsterSvg(opts: { background?: string; size?: number } = {}): string {
  const size = opts.size ?? 200;
  const bg = opts.background
    ? `<rect width="200" height="200" fill="${opts.background}"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}">${bg}
<g transform="translate(100 112)">
<path d="M-62 58 C-78 10 -70 -58 0 -62 C70 -58 78 10 62 58 Q31 70 0 60 Q-31 70 -62 58 Z" fill="#6cc24a"/>
<ellipse cx="0" cy="22" rx="38" ry="30" fill="#b9ec8f"/>
<path d="M-40 -52 L-52 -84 L-24 -60 Z M40 -52 L52 -84 L24 -60 Z" fill="#3f8f2a"/>
<circle cx="0" cy="-22" r="24" fill="#fff"/>
<circle cx="4" cy="-20" r="11" fill="#2b2b3a"/>
<circle cx="8" cy="-24" r="4" fill="#fff"/>
<path d="M-22 18 Q0 40 22 18" fill="none" stroke="#2b2b3a" stroke-width="7" stroke-linecap="round"/>
</g></svg>`;
}
