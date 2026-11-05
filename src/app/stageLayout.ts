import { STAGE_H, STAGE_W } from './metrics';

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ViewportInfo {
  /** Screen CSS px (visualViewport). */
  width: number;
  height: number;
  /** env(safe-area-inset-*) in screen orientation. */
  insets: Insets;
  /** false with `?rotate=off` (desktop debugging, SPEC §2.2). */
  allowRotate: boolean;
}

export interface StageLayout {
  rotated: boolean;
  screenW: number;
  screenH: number;
  /** Size of the (pre-rotation) stage container, in stage orientation. */
  containerW: number;
  containerH: number;
  /** Safe-area insets in stage orientation. */
  insets: Insets;
  /** Safe box placement inside the container. */
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const ZERO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * The stage is rotated 90° clockwise in portrait (D8), so screen edges map onto stage edges:
 * stage top = screen right, stage left = screen top, stage bottom = screen left,
 * stage right = screen bottom (SPEC §2.2).
 */
export function remapInsets(screen: Insets, rotated: boolean): Insets {
  if (!rotated) return { ...screen };
  return { top: screen.right, left: screen.top, bottom: screen.left, right: screen.bottom };
}

export function computeStageLayout(vp: ViewportInfo): StageLayout {
  const rotated = vp.allowRotate && vp.height > vp.width;
  const containerW = rotated ? vp.height : vp.width;
  const containerH = rotated ? vp.width : vp.height;
  const insets = remapInsets(vp.insets, rotated);
  const availW = Math.max(1, containerW - insets.left - insets.right);
  const availH = Math.max(1, containerH - insets.top - insets.bottom);
  const scale = Math.min(availW / STAGE_W, availH / STAGE_H);
  return {
    rotated,
    screenW: vp.width,
    screenH: vp.height,
    containerW,
    containerH,
    insets,
    scale,
    offsetX: insets.left + (availW - STAGE_W * scale) / 2,
    offsetY: insets.top + (availH - STAGE_H * scale) / 2,
  };
}

/** CSS transform for the stage container (transform-origin: top left). */
export function containerTransform(layout: StageLayout): string {
  return layout.rotated ? `translateX(${layout.screenW}px) rotate(90deg)` : 'none';
}

/** Forward map, logical stage point → screen point. Used by tests and the ghost hand. */
export function stageToScreen(x: number, y: number, layout: StageLayout): { x: number; y: number } {
  const lx = layout.offsetX + x * layout.scale;
  const ly = layout.offsetY + y * layout.scale;
  // Container local (lx, ly) → screen after translateX(W) rotate(90deg): (W − ly, lx).
  return layout.rotated ? { x: layout.screenW - ly, y: lx } : { x: lx, y: ly };
}
