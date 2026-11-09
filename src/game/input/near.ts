/**
 * True while a pointer is within `slopPx` CSS px of an element's screen rect. The rect stays an
 * exact rectangle under the 90° stage rotation, so no stage-coordinate conversion is needed; the
 * slop lets a held finger wobble without letting go (D95).
 */
export function pointerNear(
  e: { clientX: number; clientY: number },
  el: Element,
  slopPx: number,
): boolean {
  const r = el.getBoundingClientRect();
  return (
    e.clientX >= r.left - slopPx &&
    e.clientX <= r.right + slopPx &&
    e.clientY >= r.top - slopPx &&
    e.clientY <= r.bottom + slopPx
  );
}
