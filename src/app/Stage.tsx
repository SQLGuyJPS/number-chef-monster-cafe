import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { STAGE_H, STAGE_W, TURN_CUE_MS } from './metrics';
import { computeStageLayout, containerTransform, type StageLayout } from './stageLayout';
import { onViewportChange, readViewport } from './viewport';
import { TurnCue } from './TurnCue';

const StageContext = createContext<StageLayout | null>(null);

export function useStageLayout(): StageLayout {
  const v = useContext(StageContext);
  if (!v) throw new Error('useStageLayout outside <Stage>');
  return v;
}

let currentLayout: StageLayout | null = null;
/** For input code and test hooks that run outside React. */
export function getStageLayout(): StageLayout | null {
  return currentLayout;
}

/**
 * Landscape-only stage; portrait renders it rotated 90° clockwise (D8). The tree below never
 * remounts when the orientation flips, so rotating the device loses no state.
 */
export function Stage({
  allowRotate,
  background,
  children,
}: {
  allowRotate: boolean;
  background?: ReactNode;
  children: ReactNode;
}) {
  const [layout, setLayout] = useState(() => computeStageLayout(readViewport(allowRotate)));
  const [cueUntil, setCueUntil] = useState(() =>
    layout.rotated ? performance.now() + TURN_CUE_MS : 0,
  );
  const wasRotated = useRef(layout.rotated);

  useEffect(() => {
    currentLayout = layout;
  }, [layout]);

  useEffect(
    () =>
      onViewportChange(() => {
        const next = computeStageLayout(readViewport(allowRotate));
        // The cue shows for the first 6 s each time the stage enters rotated mode (SPEC §2.2).
        if (next.rotated && !wasRotated.current) setCueUntil(performance.now() + TURN_CUE_MS);
        if (!next.rotated) setCueUntil(0);
        wasRotated.current = next.rotated;
        setLayout(next);
      }),
    [allowRotate],
  );

  useEffect(() => {
    if (!cueUntil) return;
    const id = window.setTimeout(() => setCueUntil(0), Math.max(0, cueUntil - performance.now()));
    return () => window.clearTimeout(id);
  }, [cueUntil]);

  return (
    <StageContext.Provider value={layout}>
      <div
        className="stage-container"
        data-testid="stage"
        data-rotated={layout.rotated ? 'true' : 'false'}
        style={{
          width: layout.containerW,
          height: layout.containerH,
          transform: containerTransform(layout),
        }}
      >
        <div className="stage-bleed">{background}</div>
        <div
          className="safe-box"
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transform: `translate(${layout.offsetX}px, ${layout.offsetY}px) scale(${layout.scale})`,
          }}
        >
          {children}
          {cueUntil > 0 && <TurnCue />}
        </div>
      </div>
    </StageContext.Provider>
  );
}
