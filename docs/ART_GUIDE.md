# Art guide (D156)

Drawing rules for shop art: decor in M4b, and later the wardrobe (M15) and staff (M18). Every art chat reads this file first. It describes what the existing art already does, so new pieces match it. **Draft:** M4b batch 0 checks these rules against the test pieces and the owner's verdict, then fills in the open items (marked *TBD*). Rules change only with the owner's OK, noted under Change notes.

## 1. Where to look
- **Reference art:** `src/art/CounterScene.tsx` (the café every child screen uses), `src/art/Pip.tsx` (character standard), `src/art/monsters/` (monster standard), `StringLights` in `src/art/CafeScene.tsx` (the only decor drawn so far, unrendered).
- **Reference screenshots:** `docs/screens/counter/` (Home, Menu, Service, Results at 1194×834 and 844×390).
- **Review surface:** the `?decor` contact sheet (built in M4a). Each batch saves its sheets to `docs/screens/M4b/<batch>/`.
- **Colours:** `COLOR_FAMILIES` in `src/engine/economy.ts` (Sunny, Berry, Mint, Sky, Honey, Lavender, Cocoa: each a pale `base` and a stronger `accent`) and the scene's named constants (`WOOD`, `WOOD_DARK`, `TRIM`, …) in `CounterScene.tsx`.

## 2. The look
1. **Flat shapes, no outlines on scenery.** Walls, floor, furniture and windows are filled shapes; depth comes from a darker shade of the same hue (`FLOOR_B` on `FLOOR_A`, `WOOD_DARK` under `WOOD`), never from a black line.
2. **Thin, tinted outlines only on small objects** that would otherwise melt into the wall (cups, the door sign, the coin jar): 1.5–3 px in a darker tone of the object's own colour, never ink black.
3. **Ink (`#2b2b3a`) is for faces only** (characters' eyes and mouths). Decor has no faces unless the owner asks (*TBD at batch 0: e.g. the Tiny Robot*).
4. **Rounded everything.** Rects get `rx` 3–8; corners and ends are soft (`strokeLinecap="round"`). No sharp spikes.
5. **One shade, one highlight.** A shape may have one darker shade and one white highlight (`#fff` at about 0.5 opacity, like the door glass); no gradients, no filters, no blur, no drop shadows beyond the scene's flat `rgba(0,0,0,0.08)` strips.
6. **Muted behind, bright in front (D100).** Back-wall and floor decor is a step paler than the monsters, the tray and the food; whole groups sit at 0.8–0.92 opacity like the door and window. Nothing on the wall may be brighter or more saturated than the monster standing in front of it.
7. **Warm palette.** Whites are cream (`#fffaf0`, `#fffdf6`), not pure white, except highlights. The café's own accent is the peach awning (`#ff9f7a`).
8. **Readable at phone size.** Judge every piece at 844×390, where the stage is about 0.54 of its size: details under about 6 stage px vanish, so leave them out.

## 3. Colour rules
- Colorway items use only their family's `base` and `accent`, plus shades derived from them (*TBD at batch 0: one fixed darkening step, e.g. accent mixed 20% toward `WOOD_DARK`*). The same family must look the same in every slot.
- `classic` items (windows, named looks, metal and glass) pick from the scene constants and the families; no new loose hex values. Any new constant is named and added to this guide.
- An item is drawn once and takes its colours as props (`{base, accent}`), so its colorways need no extra drawing.

## 4. Slots
Stage coordinates (1280×720). The floor line is y 330, the wainscot top y 262, the counter's far edge y 432 (`COUNTER_Y`), the status bar ends at y 120 (`BAR_H`). Every wall or floor layer runs far past the safe box to fill the bleed, like the existing walls.

| Slot | Free default | Where it draws | Notes |
|---|---|---|---|
| Wallpaper | Plain Paint (Sunny) | the back wall above the wainscot | A pattern tile (`<pattern>`), so it costs a few elements however wide the wall is. The current two-tone stripe is the Sunny default. |
| Floor | Wood (classic) | y 330 down to the counter | Also a pattern or a few long rects; mostly hidden by the counter, so keep detail near the top. |
| Lights | None | hanging from the status bar's lower edge | Must not cover the status bar's buttons or the monster's head. |
| Window | Street | the window beside the door (x 208, y 142, 214×150) | Only the view changes; frame, bars and awning stay. |
| Counter-top | Bell | *TBD in M4a* | Must keep clear of the tray, bin, Pip's hat and the bell at both basket sides. |
| Wall art | Menu Board | *TBD in M4a* | Behind the monster's head zone it must stay quiet. |

M4a sets the exact anchors in `src/app/metrics.ts` (one place for sizes) and draws a labelled stand-in in each.

## 5. Budget
The whole screen may have at most 4,800 SVG elements, 650 of them moving (`SVG_BUDGET`, D113). The busiest combination of one item per slot, plus a full service, must stay inside it. Rough per-item allowance until batch 0 measures it: wallpaper and floor 40 each, lights 120 (bulbs may twinkle: they count as moving), window 60, counter-top 60, wall art 60. Prefer patterns and repeated `<use>` over many shapes. Animation only where it adds life (lights twinkle, the fish swims); the rest is still.

## 6. Characters (guest monsters now; staff in M18)
- Guest monsters follow the monster standard exactly: `MonsterSpec`, five expressions, reaction about 1.4 s, reduced-motion still poses, `lint:content` monster checks (SPEC §7.2).
- Staff are drawn to Pip's standard: soft fur shapes, ink eyes with a white catch-light, blush ellipses, tinted outlines only on clothing. They are smaller than the monsters and stand back in the room.

## 7. Batch checklist (every art chat)
1. Read this guide, the locked list below and the batch's entries in SPEC §10.
2. Draw the batch's items as components that take colours as props; register them in the decor table.
3. Run `npm run check` (includes the decor lint rules once batch 0 adds them) and the budget e2e.
4. Save the `?decor` sheets at 1194×834 and 844×390, plus one Service screenshot with the batch's busiest item equipped, to `docs/screens/M4b/<batch>/`.
5. Stop and ask the owner for a verdict per item: **keep**, **tweak** (say what) or **redo**.
6. Mark approved items locked below; record any new rule the owner states in this guide.

**Giving feedback (owner):** number your notes by item; say what works as well as what doesn't; point to a reference ("match the door's shading", "as quiet as the wall"); judge at phone size inside the café.

## 8. Locked items
Approved items. Do not redraw them without asking.
- *(none yet)*

## 9. Change notes
- 2026-11-21: first draft (D156), from the existing café, Pip and monster art.
