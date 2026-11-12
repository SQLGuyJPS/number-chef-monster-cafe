// The performance budget (SPEC §2.4, D112, D113) counts SVG elements on screen: every <svg> and
// every element inside one. One module so the speed test and the e2e budget test count alike.

/**
 * Measured on the iPad 7th gen with `?speedtest` (D113): still art was smooth past 8,000 elements
 * (no limit found), moving art up to about 1,100. Each budget keeps 60% of the last smooth count.
 */
export const SVG_BUDGET = { total: 4800, moving: 650 } as const;

export function countSvgElements(root: ParentNode): number {
  return root.querySelectorAll('svg, svg *').length;
}

/**
 * SVG elements inside a subtree that is animating right now (CSS animations, transitions and Web
 * Animations alike). Safari redraws those every frame; still art is drawn once, so only these
 * count against the moving budget.
 */
export function countMovingSvgElements(doc: Document): number {
  const moving = new Set<Element>();
  for (const a of doc.getAnimations()) {
    if (a.playState !== 'running') continue;
    const target = a.effect instanceof KeyframeEffect ? a.effect.target : null;
    if (!target) continue;
    if (target instanceof SVGElement) moving.add(target);
    const inside =
      target instanceof SVGElement
        ? target.querySelectorAll('*')
        : target.querySelectorAll('svg, svg *');
    inside.forEach((e) => moving.add(e));
  }
  return moving.size;
}
