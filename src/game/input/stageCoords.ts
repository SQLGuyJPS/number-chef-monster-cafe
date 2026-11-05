import type { StageLayout } from '../../app/stageLayout';

/**
 * The only way to turn a pointer position into stage coordinates (SPEC §2.2): inverts the
 * rotated-stage transform and the safe-box scale. Pure; unit-tested for both orientations.
 */
export function toStageCoords(
  clientX: number,
  clientY: number,
  layout: StageLayout,
): { x: number; y: number } {
  // Inverse of screen = (W − ly, lx): lx = screenY, ly = W − screenX.
  const lx = layout.rotated ? clientY : clientX;
  const ly = layout.rotated ? layout.screenW - clientX : clientY;
  return { x: (lx - layout.offsetX) / layout.scale, y: (ly - layout.offsetY) / layout.scale };
}

/** Reads the coordinates of a pointer event; kept here so no other module touches clientX/Y. */
export function eventToStage(
  e: { clientX: number; clientY: number },
  layout: StageLayout,
): { x: number; y: number } {
  return toStageCoords(e.clientX, e.clientY, layout);
}
