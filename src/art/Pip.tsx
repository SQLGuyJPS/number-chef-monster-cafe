// Pip (SPEC §7.3, D90): the mouse chef who helps. Same head and hat as the Help button, so the
// child sees one character. viewBox 120×150 matches the counter slot (metrics PIP).
const FUR = '#cdbdb6';
const FUR_DARK = '#b9a7a0';
const EAR_IN = '#f5b7c3';
const INK = '#2b2b3a';

export function Pip({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 150" width="100%" height="100%" aria-hidden="true">
      {/* tail */}
      <path d="M80 136 Q114 142 110 112 Q106 94 94 102" fill="none" stroke={FUR_DARK} strokeWidth="5" strokeLinecap="round" />
      {/* feet */}
      <ellipse cx="47" cy="145" rx="11" ry="5" fill={FUR_DARK} />
      <ellipse cx="73" cy="145" rx="11" ry="5" fill={FUR_DARK} />
      {/* body */}
      <ellipse cx="60" cy="124" rx="25" ry="22" fill={FUR} />
      {/* apron with a pocket and a wooden spoon */}
      <path d="M43 110 Q60 104 77 110 L73 141 Q60 147 47 141 Z" fill="#fff" stroke="#e2d8c3" strokeWidth="2" />
      <path d="M52 126 h16 v8 q-8 4 -16 0 Z" fill="#f3efe6" stroke="#e2d8c3" strokeWidth="1.5" />
      <path d="M64 128 L70 112" stroke="#c98b55" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="71" cy="110" rx="3.5" ry="5" fill="#c98b55" transform="rotate(20 71 110)" />
      {/* arms */}
      <ellipse cx="35" cy="118" rx="7" ry="12" fill={FUR_DARK} transform="rotate(25 35 118)" />
      <ellipse cx="85" cy="118" rx="7" ry="12" fill={FUR_DARK} transform="rotate(-25 85 118)" />
      {/* ears */}
      <circle cx="33" cy="78" r="13" fill={FUR_DARK} />
      <circle cx="87" cy="78" r="13" fill={FUR_DARK} />
      <circle cx="33" cy="78" r="7.5" fill={EAR_IN} />
      <circle cx="87" cy="78" r="7.5" fill={EAR_IN} />
      {/* head */}
      <ellipse cx="60" cy="89" rx="25" ry="21" fill={FUR} />
      <circle cx="51" cy="85" r="4" fill={INK} />
      <circle cx="69" cy="85" r="4" fill={INK} />
      <circle cx="52.3" cy="83.6" r="1.4" fill="#fff" />
      <circle cx="70.3" cy="83.6" r="1.4" fill="#fff" />
      <ellipse cx="44" cy="95" rx="5" ry="3" fill={EAR_IN} opacity="0.7" />
      <ellipse cx="76" cy="95" rx="5" ry="3" fill={EAR_IN} opacity="0.7" />
      <circle cx="60" cy="95" r="4" fill="#ff8fa3" />
      <path d="M54 101 Q60 105 66 101" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      {/* whiskers */}
      <path d="M50 97 L36 94 M50 99 L37 102 M70 97 L84 94 M70 99 L83 102" stroke="#8f7f78" strokeWidth="1.3" strokeLinecap="round" />
      {/* chef hat */}
      <path
        d="M30 52 Q10 50 14 32 Q18 14 38 20 Q44 4 60 6 Q78 4 82 20 Q102 14 106 32 Q110 50 90 52 L88 64 L32 64 Z"
        fill="#fff"
        stroke="#c9c2b4"
        strokeWidth="3"
      />
      <path d="M46 30 Q50 44 48 58 M74 30 Q70 44 72 58" fill="none" stroke="#e9e3d6" strokeWidth="2.5" />
      <rect x="32" y="60" width="56" height="10" rx="3" fill="#e9e3d6" />
    </svg>
  );
}
