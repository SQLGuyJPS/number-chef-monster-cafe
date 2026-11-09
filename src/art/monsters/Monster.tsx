// <Monster id expression /> (SPEC §7.2): renders the hand-authored asset for the id. `react` plays
// the monster's celebration (CSS, monsters.css); reduced motion leaves the still pose.
import { DRAWINGS } from './roster';
import { Zzz } from './face';
import { specFor, type Expression } from './specs';
import './monsters.css';

export function Monster({
  id,
  expression,
  size,
  react = false,
  className,
}: {
  id: string;
  expression: Expression;
  size: number;
  react?: boolean;
  className?: string;
}) {
  const spec = specFor(id);
  const Draw = DRAWINGS[spec.id]!;
  const reaction = spec.reactions[0];
  return (
    <div
      className={`monster-art expr-${expression}${react && reaction ? ` react-${reaction}` : ''}${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      data-monster={spec.id}
      data-expression={expression}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 200" width="100%" height="100%">
        <ellipse className="m-shadow" cx={100} cy={191} rx={62} ry={7} fill="rgba(0,0,0,0.16)" />
        <g className="m-figure">
          <Draw e={expression} s={spec} react={react} />
        </g>
        {expression === 'sleepy' && <Zzz x={150} y={56} />}
        {react && reaction === 'hearts' && (
          <g className="m-fx m-hearts" fill="#ff6f9c">
            <path d="M0 4 C-6 -4 -14 2 0 12 C14 2 6 -4 0 4 Z" transform="translate(60 40) scale(1.4)" />
            <path d="M0 4 C-6 -4 -14 2 0 12 C14 2 6 -4 0 4 Z" transform="translate(142 30) scale(1.1)" />
            <path d="M0 4 C-6 -4 -14 2 0 12 C14 2 6 -4 0 4 Z" transform="translate(104 12) scale(1.7)" />
          </g>
        )}
        {react && reaction === 'burp' && (
          <g className="m-fx m-burp">
            <circle cx={160} cy={74} r={22} fill="#e6f4ff" stroke="#8cc1ee" strokeWidth={3} />
            <circle cx={152} cy={66} r={5} fill="#fff" />
          </g>
        )}
      </svg>
    </div>
  );
}
