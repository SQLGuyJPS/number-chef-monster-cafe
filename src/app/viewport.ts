import type { Insets, ViewportInfo } from './stageLayout';

let probe: HTMLDivElement | null = null;

/** env(safe-area-inset-*) is only readable through layout, so a hidden probe carries it as padding. */
function readInsets(): Insets {
  if (!probe) {
    probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText =
      'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
      'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);';
    document.body.appendChild(probe);
  }
  const cs = getComputedStyle(probe);
  const px = (v: string) => Number.parseFloat(v) || 0;
  return {
    top: px(cs.paddingTop),
    right: px(cs.paddingRight),
    bottom: px(cs.paddingBottom),
    left: px(cs.paddingLeft),
  };
}

export function readViewport(allowRotate: boolean): ViewportInfo {
  const vv = window.visualViewport;
  return {
    width: vv?.width ?? window.innerWidth,
    height: vv?.height ?? window.innerHeight,
    insets: readInsets(),
    allowRotate,
  };
}

/**
 * iOS can deliver visualViewport resizes late or twice during rotation, so callers always
 * re-read the latest values instead of trusting event payloads (PLAN §3.4).
 */
export function onViewportChange(cb: () => void): () => void {
  const vv = window.visualViewport;
  let raf = 0;
  const schedule = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(cb);
  };
  vv?.addEventListener('resize', schedule);
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  return () => {
    cancelAnimationFrame(raf);
    vv?.removeEventListener('resize', schedule);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('orientationchange', schedule);
  };
}
