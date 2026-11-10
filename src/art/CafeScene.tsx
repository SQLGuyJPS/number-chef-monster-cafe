// Café background (SPEC §7.4): layered SVG in stage coordinates (1280×720), drawn behind every
// screen so Home, the menu and the service share one room. Muted colours: the foreground (monster,
// ticket, tray) must stay the brightest thing. The wallpaper itself is CSS on the bleed, so it
// continues past the safe box; the floor runs well past the edges for the same reason.
// Slots (wall art, counter top, staff spots) are filled by shop items from M4.
const WALL_TRIM = '#e8c48a';
const PANEL = '#f3cf92';
const FLOOR_A = '#e2ad6f';
const FLOOR_B = '#d79f62';
const BULBS = ['#ffd56b', '#ff9f7a', '#9fd7ff', '#b8f09a', '#ffb3d1'];

export function CafeScene() {
  const bulbs = Array.from({ length: 17 }, (_, i) => {
    const x = 20 + i * 77;
    const t = (x % 320) / 320;
    const y = 18 + Math.sin(t * Math.PI) * 26;
    return { x, y, c: BULBS[i % BULBS.length]! };
  });
  const planks = Array.from({ length: 30 }, (_, i) => -560 + i * 80);
  return (
    <svg className="cafe-scene" viewBox="0 0 1280 720" width="1280" height="720" aria-hidden="true">
      {/* wainscot panel and trim */}
      <rect x={-1000} y={430} width={3280} height={120} fill={PANEL} />
      <rect x={-1000} y={424} width={3280} height={10} fill={WALL_TRIM} />
      {/* floor planks, long enough to fill any letterbox */}
      <g>
        <rect x={-1000} y={546} width={3280} height={900} fill={FLOOR_A} />
        {planks.map((x, i) => (
          <rect key={x} x={x} y={546} width={40} height={900} fill={i % 2 ? FLOOR_B : FLOOR_A} opacity={0.6} />
        ))}
        <rect x={-1000} y={546} width={3280} height={8} fill="rgba(0,0,0,0.08)" />
      </g>
      {/* window with a sunny sky */}
      <g transform="translate(560 26)" opacity={0.55}>
        <rect x={0} y={0} width={160} height={110} rx={10} fill="#bfe6ff" stroke="#fff" strokeWidth={8} />
        <circle cx={124} cy={30} r={14} fill="#fff3a6" />
        <path d="M18 70 q12 -16 26 -6 q10 -12 24 0 q8 10 -4 14 h-40 q-12 -2 -6 -8 Z" fill="#fff" />
        <line x1={80} y1={0} x2={80} y2={110} stroke="#fff" strokeWidth={6} />
        <line x1={0} y1={55} x2={160} y2={55} stroke="#fff" strokeWidth={6} />
      </g>
      {/* wall art slot: an empty frame with a soft hill picture until the shop fills it (M4) */}
      <g transform="translate(410 168)" opacity={0.5} data-slot="wallArt">
        <rect x={0} y={0} width={86} height={70} rx={6} fill="#fffaf0" stroke="#c98b55" strokeWidth={6} />
        <path d="M6 62 Q28 30 46 50 Q60 36 80 62 Z" fill="#a8d88a" />
        <circle cx={62} cy={22} r={8} fill="#ffd56b" />
      </g>
      {/* string lights */}
      <path
        d={`M0 18 ${bulbs.map((b) => `L${b.x} ${b.y}`).join(' ')} L1280 18`}
        fill="none"
        stroke="#8a6a4a"
        strokeWidth={2}
        opacity={0.6}
      />
      {bulbs.map((b) => (
        <g key={b.x} transform={`translate(${b.x} ${b.y})`}>
          <rect x={-3} y={0} width={6} height={6} fill="#8a6a4a" opacity={0.7} />
          <ellipse cx={0} cy={13} rx={6} ry={8} fill={b.c} opacity={0.85} />
        </g>
      ))}
    </svg>
  );
}
