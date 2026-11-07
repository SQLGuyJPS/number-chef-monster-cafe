// Placeholder Pip (SPEC §7.3, D90): the mouse from the Help button, now with a body, so the child
// sees that the hat button and the helper who counts and shows are the same character. Swap for
// hand-authored art later; the slot and size stay.
export function PlaceholderPip({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 150" width="100%" height="100%" aria-hidden="true">
      {/* tail */}
      <path d="M80 136 Q112 140 108 112 Q104 92 92 100" fill="none" stroke="#b9a7a0" strokeWidth="5" strokeLinecap="round" />
      {/* body and apron */}
      <ellipse cx="60" cy="124" rx="24" ry="22" fill="#cdbdb6" />
      <path d="M44 112 Q60 106 76 112 L72 140 Q60 146 48 140 Z" fill="#fff" stroke="#e2d8c3" strokeWidth="2" />
      {/* arms */}
      <ellipse cx="36" cy="118" rx="7" ry="12" fill="#b9a7a0" transform="rotate(25 36 118)" />
      <ellipse cx="84" cy="118" rx="7" ry="12" fill="#b9a7a0" transform="rotate(-25 84 118)" />
      {/* feet */}
      <ellipse cx="48" cy="145" rx="10" ry="5" fill="#b9a7a0" />
      <ellipse cx="72" cy="145" rx="10" ry="5" fill="#b9a7a0" />
      {/* head: same as the Help button */}
      <circle cx="34" cy="80" r="12" fill="#b9a7a0" />
      <circle cx="86" cy="80" r="12" fill="#b9a7a0" />
      <ellipse cx="60" cy="88" rx="24" ry="20" fill="#cdbdb6" />
      <circle cx="51" cy="84" r="3.5" fill="#2b2b3a" />
      <circle cx="69" cy="84" r="3.5" fill="#2b2b3a" />
      <circle cx="60" cy="94" r="4" fill="#ff8fa3" />
      <path d="M54 100 Q60 104 66 100" fill="none" stroke="#2b2b3a" strokeWidth="2" strokeLinecap="round" />
      {/* chef hat */}
      <path
        d="M30 52 Q10 50 14 32 Q18 14 38 20 Q44 4 60 6 Q78 4 82 20 Q102 14 106 32 Q110 50 90 52 L88 64 L32 64 Z"
        fill="#fff"
        stroke="#c9c2b4"
        strokeWidth="3"
      />
      <rect x="32" y="60" width="56" height="10" rx="3" fill="#e9e3d6" />
    </svg>
  );
}
