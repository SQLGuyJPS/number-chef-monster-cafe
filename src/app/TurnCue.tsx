/** Silent curved-arrow cue for the first 6 s in rotated mode: turn the device counter-clockwise (SPEC §2.2). */
export function TurnCue() {
  return (
    <div className="turn-cue" data-testid="turn-cue" aria-hidden="true">
      <svg viewBox="0 0 200 200" width="200" height="200">
        <rect x="62" y="40" width="76" height="120" rx="12" fill="none" stroke="currentColor" strokeWidth="8" />
        <path
          d="M 170 120 A 72 72 0 0 0 100 28"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path d="M 100 8 L 100 48 L 72 28 Z" fill="currentColor" />
      </svg>
    </div>
  );
}
