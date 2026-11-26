# Art guide (D156, D158)

How to draw shop art: decor in M4b, and later the wardrobe (M15) and staff (M18). Every art chat reads this file first.

The guide has three parts, held to different strengths:
1. **Firm limits (§2):** what the game needs to work for a young child on an iPad. Always met.
2. **House style (§3):** how the existing café, Pip and the monsters are drawn. It's the starting point, not a fence.
3. **Room to experiment (§4):** new ideas are welcome. The owner decides what stays, and an idea the owner likes becomes part of the house style.

## 1. Where to look
- **Existing art:**
  - `src/art/CounterScene.tsx`: the café behind every child screen.
  - `src/art/Pip.tsx`: Pip.
  - `src/art/monsters/`: the monsters.
  - `src/art/decor/`: the decor drawn so far (wallpaper, floor, lights, window, counter-top, wall art), one file per slot.
- **Screenshots:** `docs/screens/counter/`: Home, Menu, Service and Results at 1194×834 and 844×390.
- **Review page:** the `?decor` contact sheet (built in M4a); add `&zoom` to see the small slots (counter-top, wall art, window) close up. Each batch saves its sheets to `docs/screens/M4b/<batch>/`.
- **Shop pictures:** in all six slots (Wallpaper, Floor, Lights, Window, Counter top, Wall art), the shelf tiles, the confirm card and the delivery show each entry as the café cropped to its slot, still (`src/art/decor/Picture.tsx`, D184). A new item that is much smaller than its slot, or whose motif would sit off-centre or out of frame (Rainbow's rainbow, Cloud Carpet's cloud, Starry Night's moon), gets its own crop there. A single motif is centred; a motif with a partner (the moon and a star) sits on a golden point (about 0.382 across and down) with the partner near the opposite corner.
- **Colours:**
  - `COLOR_FAMILIES` in `src/engine/economy.ts`: Sunny, Berry, Mint, Sky, Honey, Lavender and Cocoa, each a pale `base` and a stronger `accent`.
  - The scene's named colours (`WOOD`, `WOOD_DARK`, `TRIM` and others) in `CounterScene.tsx`.

## 2. Firm limits
1. **The play stays readable.** Monsters, food, the tray and the buttons are what the child reads, so they stay the brightest and clearest things on screen (D100). Decor may be bold, but it must not compete with them. Above all it must stay quiet behind the monster's head and around the tray.
2. **It reads at phone size.** Judge every piece at 844×390, where the stage is about half size. Detail smaller than about 6 stage px disappears.
3. **Colours are shared across the café.** An item with colorways is drawn once and takes its colours as props (`{base, accent}`), so a new colorway costs no new drawing. The same colour family must look like the same family in every slot.
4. **It fits the element budget.** The screen may hold at most 4,800 SVG elements, 650 of them moving (`SVG_BUDGET`, D113). The busiest choice of one item per slot, plus a full service, must stay within that. `budget.spec.ts` enforces it.
5. **Motion is gentle and optional.** Nothing flashes or strobes. With reduced motion on, every piece is drawn still. Animation must never slow down or get in the way of play.
6. **It's safe and kind for a young child.** Nothing scary, no words or numbers the child would need to read, no brand names or logos, and nothing copied from an existing game or character.
7. **It has a slot and a fallback.** A piece draws inside its slot (§5), runs past the safe box where it is a wall or floor layer, and falls back to the labelled stand-in shape if it's missing.

## 3. House style (the starting point)
This is what the existing art does. Following it gives pieces that match. Leaving it is fine when you have a reason (§4).
- **Flat shapes.** Depth comes from a darker shade of the same colour rather than outlines or gradients.
- **Outlines are rare.** The few there are sit on small objects and are thin and tinted, never black. Ink (`#2b2b3a`) is kept for faces.
- **Soft and round.** Corners are rounded and line ends are round.
- **One shade and one highlight** per shape is typical. The highlight is white at about 0.5 opacity, like the door glass. It follows the shape: on a round body, a curved glint along its curve; where no glint suits the shape (a flat clock face), leave it out.
- **Things rest on what holds them up.** The thing on top overlaps its support: a cake over its plate, a stem over its foot, a lid sitting on its jar. Leaves grow from their stems and hang down, clear of the flowers.
- **Roofs overhang their walls.** A roof runs a little way down past the end of its gable, as eaves do. In a row of houses, choose which stands in front: its eaves overhang, and the roof of the house behind runs on down until it touches that roof, without overlapping it (owner, 2026-11-26).
- **What's in a window stays in it.** Goods, plants and glints keep clear of the frame and the glazing bars; nothing pokes out past the top. If the goods won't fit, change the goods or the window, not the frame.
- **Centred means centred.** A symmetric shape stays symmetric, an inner shape sits in the middle of its outer one, a line under a picture shares its middle, and parts that join (a stem and its star) touch.
- **Detail is welcome.** The owner likes batch 3's level of detail (2026-11-24): small touches such as sprinkles, chalk scribbles or a cookie by the jar don't go too far.
- **The room is warm and a little muted.** Whites are cream (`#fffaf0`), and background groups sit at about 0.8–0.92 opacity. The café's own accent is the peach awning (`#ff9f7a`).
- **Characters follow the existing standard:**
  - The guest monsters follow the monster standard (SPEC §7.2): five expressions, a reaction of about 1.4 s, still poses for reduced motion, and the `lint:content` monster checks.
  - Staff start from Pip: soft fur shapes, ink eyes with a white catch-light, blush on the cheeks.

## 4. Room to experiment
- **A batch may try something new:** a texture, a little glow, a different shape language for one item, a playful touch such as a face on the Tiny Robot. Keep the firm limits (§2).
- **When a piece leaves the house style, say so.** In the batch report, name what's different and why it might be nice, so the owner can judge it on purpose.
- **Offer a wildcard when unsure.** Show the house-style version beside the wildcard on the contact sheet, and let the owner pick.
- **What the owner likes becomes the style.** Add it to §3, or to the item's note in §6, with a line in the change notes. Later chats then build on it rather than reverting it.
- **One wildcard is not a rule change.** A single item that breaks from the style doesn't mean the rest should follow, unless the owner says so.

## 5. Slots
All positions are in stage coordinates (1280×720). The floor line is at y 330 and the wainscot top at y 262. The counter's far edge is at y 432 (`COUNTER_Y`), and the status bar ends at y 120 (`BAR_H`).

| Slot | Free default | Where it draws | Notes |
|---|---|---|---|
| Wallpaper | Plain Paint (Sunny) | the back wall above the wainscot | A repeating pattern keeps the element count low; today's two-tone stripe is the Sunny default. |
| Floor | Wood (classic) | from y 330 down to the counter | Mostly hidden by the counter, so put any interest near the top. |
| Lights | None | hanging below the status bar | Keeps clear of the bar's buttons and the monster's head. |
| Window | Street | the window beside the door (x 208, y 142, 214×150) | Usually only the view changes. A new frame is fair game if it still reads as the same window. |
| Counter-top | Clear Counter (nothing) | on the counter's far edge at its right end (x 1176, y 324, 96×112), right of the ticket | Keeps clear of the tray, the bin, Pip's hat and the serve bell on both basket sides. The bell is a control, not decor (D159). During CountTogether the ticket slides over the top 36 px. |
| Wall art | Bare Wall (nothing) | on the wall above the monster, between the two runs of lights (x 540, y 128, 200×72) | Stays quiet behind the monster's head; the tallest monster's eye stalks reach y 204. The Menu Board is a 20-coin item (D160). |

M4a puts the exact positions in `src/app/metrics.ts` and draws a labelled stand-in in each slot.

**Rough element allowance per item** (raised by half after batch 3, D183):

| Item | Elements |
|---|---|
| Wallpaper | 60 |
| Floor | 60 |
| Lights | 180 (bulbs that twinkle count as moving) |
| Window | 90 |
| Counter-top | 90 |
| Wall art | 90 |

An item may go over if another stays under. What must fit is the total.

## 6. Batch routine (every art chat)
1. Read this guide, the locked list (§7) and the batch's items in SPEC §10.
2. Draw the items as components that take their colours as props, and register them in the decor table.
3. Run `npm run check` and the budget e2e.
4. Save the `?decor` sheets at 1194×834 and 844×390 to `docs/screens/M4b/<batch>/`, plus one Service screenshot with the batch's busiest item equipped.
5. Report each item as house style or as an experiment (§4), then stop for the owner's verdict on each: **keep**, **tweak** (say what) or **redo**.
6. Mark approved items as locked in §7, and write any taste the owner states into §3 or into that item's note.

**Giving feedback (for the owner):**
- Number your notes by item.
- Say what works as well as what doesn't.
- Point to a reference: "match the door's shading", "as quiet as the wall".
- Judge at phone size, inside the café.
- When you like an experiment, say whether it should become the style or stay a one-off.

## 7. Locked items
These are approved: don't redraw them without asking. Notes record what the owner liked about each.
- *(none yet)*

## 8. Change notes
- 2026-11-21: first draft (D156), from the existing café, Pip and monster art.
- 2026-11-21: split into firm limits, house style and room to experiment, at the owner's request (D158). Lint checks only the firm limits.
- 2026-11-23: batch 1 (wallpaper + floor) drawn in `src/art/decor/Wallpaper.tsx` and `Floor.tsx`, awaiting the owner's verdict. Tones come from `mix()` in `src/art/decor/paint.ts` (base/accent mixes, cream). The café's own wall and floor are drawn by the same components, so a recolour is the same drawing. Experiments: Starry Night (dark wall, twinkling stars), perspective on Checkerboard and Tiles. Sheets: `npx cross-env NCMC_SCREENS=M4b/<batch> NCMC_DECOR_SLOTS=<slots> NCMC_DECOR_BUSY=<keys> playwright test screens --project=chromium-ipad-pro-11`.
- 2026-11-24: batch 2 (lights + window) drawn in `src/art/decor/Lights.tsx` and `Window.tsx`, awaiting the owner's verdict. Lights hang in two runs of three swags (DECOR.lightsLeft/Right, past the safe box for the bleed); the single ceiling pieces (Disco Ball, Star Chandelier) hang over the right wall, above the ticket. Windows share one frame (the café's own: white frame and bar, trim sill, peach awning) and only the view changes, clipped to the glass; Street is drawn the same way. Shapes of one colour that don't move on their own share one `<path>` (helpers `ellipsePath`, `starPath`, `sparklePath` in `paint.ts`). New motion classes in `decor.css`: `decor-glow`, `decor-sway`, `decor-snow`. Experiments: Star Chandelier (warm glow, left-wall star strands), Snowy (falling snow).
- 2026-11-24: batch 3 (counter-top + wall art) drawn in `src/art/decor/CounterTop.tsx` and `WallArt.tsx`, awaiting the owner's verdict. Counter-top pieces stand on the far edge strip on a soft shadow, at full opacity (the counter is nearer than the room); wall art keeps the room's 0.92 and its busy parts high. Gold and silver now live in `paint.ts` (`GOLD`, `SILVER`, …) so the chandelier, trophies and robot match; `heartPath` and the face `INK` too. Monster Portraits draws the monsters' own drawings (still: their motion classes only run inside a live monster), about 105 elements, over its 60 allowance; the counter-top pieces (14–25) make up for it. New motion classes: `decor-turn`, `decor-swim`, `decor-bubble`, `decor-blink`, `decor-wave`. Experiments: Tiny Robot (a face that blinks, and a wave), Fish Bowl (a goldfish that swims). The batch's screenshots add a `decor-<slot>-zoom.png` close-up for the small slots.
- 2026-11-24: batch 3 feedback. Allowances raised by half (D183). House style gains: highlights follow the shape, things rest on what holds them up, centred means centred, detail is welcome. Shop tiles show the drawings (D184). Neon OPEN: its crisp, high-contrast tube edges clash a little with the house style; the owner decides after the playtest.
- 2026-11-24: Street window redesign mocks, awaiting the owner's pick: five daytime streets in `src/art/decor/StreetMocks.tsx` (A Town Houses, B Little Shops, C Park, D Hilltop Town, E Seaside), on `?decor&slot=window&mocks` (add `&zoom`) and in a service at `?mock&window=<item>`; sheets in `docs/screens/M4b/street-mocks/`. Lessons for window views: the middle bar (x 104–110) falls in a gap, never through a building; clouds rest below y 34 (the awning's scallops reach y 14); a sun's halo is white, not yellow (yellow over the sky reads green); during play the caption bubble covers the right two-thirds of the window above about y 116, so a view's signature thing goes on the left. Experiments: C's balloons sway, D's windmill turns, E's boat rocks; A and B are still.
- 2026-11-26: Street mocks, owner's feedback on A, B and D applied. Roofs are a band along each slope that overhangs the wall (`roof()` in `StreetMocks.tsx`); in A's terrace Honey and Lavender stand in front and Berry's and Mint's roofs run down to meet theirs. B's flower shop ends short of the window's edge so its eave shows, with the next building along beyond it; its shop window is plain glass behind the flower buckets; the bakery's shelf sits 2 px lower so the cake's cherry clears the window. D's path from the windmill's door is back, winding down to the berry cottage. Glints stay inside their pane. The cats' "catch lights" were holes: shapes of one colour that share a `<path>` must all wind the same way round (counter-clockwise on screen, as `ellipsePath` and `box` do), or an overlap cuts a hole under the nonzero rule. Two new house-style points (§3): roofs overhang their walls; what's in a window stays in it.
