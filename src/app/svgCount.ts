// The performance budget (SPEC §2.4, D112) counts SVG elements on screen: every <svg> and every
// element inside one. One function so the speed test and any future budget test count alike.
export function countSvgElements(root: ParentNode): number {
  return root.querySelectorAll('svg, svg *').length;
}
