# Number Chef: Monster Café — Build Spec

Status: the single, current statement of the design, with every live decision through D95 folded in (D92). `(Dn)` cites the decision that set a rule; `docs/DECISIONS.md` indexes them and `docs/archive/DECISIONS_LOG.md` holds the full reasoning. Companion files: `CLAUDE.md` (conventions), `docs/OPEN_ITEMS.md` (what the owner must supply or decide), `docs/PLAN.md` (build plan and hour estimates), `docs/PLAYTEST.md`.

Normative words: **MUST** = acceptance criteria test it; **SHOULD** = default, may deviate with a decision entry.

---

## 0. Summary

A static, offline-capable web app (PWA) in which a young child runs a monster café. A monster arrives and places an order written as a number sentence with a blank (`8 + 5 = ?`). The child builds the answer on a serving tray (ten-frames for numbers up to 20, ten-packs and singles above that), presses the serve bell, and the monster eats it with a big reaction. A *service* is 6 monsters (parent-adjustable 4/6/8), about 5–10 minutes (measured at the M2 playtest), ending at a closing sign. The child (or a parent) picks the skill to practice from the menu board; later services repeat that skill until a different one is picked (D22).

Audience: one young child (first-year primary school level), who reads easy chapter books, has little writing practice and is good at dragging (D38). The parent is technical and plays the role of tester and configurator.

Targets: iPad Safari (primary), iPhone Safari, Android Chrome; the child may use all three. Baseline iOS 15.4+ and a recent Chrome on Android; `navigator.audioSession` (iOS 17+) is a progressive enhancement (D37). Landscape layout (portrait shows the rotated stage, D8). Progress is stored per device and merged by exported file (§11). Works offline after first load. No backend, accounts, analytics, ads, external links, or purchases. All data local.

Build budget (D20, D36, D44): **Tier 1 (M0, M1, M2, M3a, M3b) is a playable game in ≈ 10 agentic hours**, a guide rather than a cap; **Tier 2 (M4–M11)** is bonus work in any order with no upper limit. `PLAN.md` holds the authoritative per-milestone estimates; the figures in §14 are indicative.

### Non-goals (v1)
Monster designer, rush-hour mode, regrouping (carry/borrow), multiplication, multi-child profile UI (profiles are M11, D9), recorded audio, music, localization, handwriting/tracing, word-problem story tickets (D21), automatic stage changes (the stage is a parent setting, D22, D23).

---

## 1. Pedagogy (the reasoning the rest depends on)

### 1.1 Principles
1. **Concrete → representational → abstract, faded per skill.** Every skill has four *support stages* (§3.2, D3). The parent sets the stage per skill (default S3, D23); the child never picks a stage.
2. **Strategy, not just recall.** The tray makes strategies visible: counting on, doubles, make-a-ten, bridging through ten, count back, tens-and-ones. Demonstrations (§5.5) model them.
3. **Errors teach, nothing punishes.** No buzzers, no lost coins, no failure screens. A first miss gets the monster's plate count and another go; a second miss offers Pip's help (a worked demonstration, then a follow-me); a third plays it unasked; then the fact is requeued with *more* support (D89). The monster counts the plate that was actually served before anything else (§5.5, D30).
4. **First-try correctness is the only diagnostic signal.** Hints and demos are free but mark the attempt, so mastery stays honest. Only first-try results at S1 and S0 raise a fact box, because at S3/S2 the prefilled tray makes success mostly a matter of counting out the second group (§4.2, D29).
5. **Short and varied.** 6 orders per service; requeue of misses; light per-fact weighting so missed facts come back sooner. No due dates or spacing schedule: the Leitner-style boxes only affect which fact is drawn inside the chosen skill, never how hard the skill is (D22, D29).
6. **One consistent model.** Ten-frame layout never changes: 2 rows × 5, filled left→right, top→bottom, first-five/second-five tinted. Same food type within one order.
7. **Reward effort, not speed or accuracy.** Coins are flat per monster served (§9, D6). The one deliberate exception is visual: the monster's reaction is a little bigger after a first-try serve (§5.6, D45).
8. **The ladder matches the child's school year, with room to spare.** The child is in the first half of a first-year primary maths book: within-10 and within-20 add/subtract (A2–A8) is this year's curriculum; tens and ones (B1–B2) is likely second-half work (D16). Expect A1–A5 to carry most early play (the book is on number sentences with sums under ten, i.e. A1–A3), so quality and variety matter most there. A0 is an optional tray-practice tile (M5). B3 and beyond are headroom.
9. **Build on what the child already owns.** The child knows +0, +1 and doubles (1+1 … 9+9) from flash cards. Those are anchor facts: they come up less often than new facts (box 3 start, §4.2), and near-doubles (6+7 = 6+6+1) and 9+x become the first strategies taught for new facts (D17).

### 1.2 The ladder (D1)

Two tracks, no locks. All playable tiles are tappable and look the same; no tile is highlighted (D83). The child or a parent picks one for the service (D22).

**Little Menu (up to 20)**

| ID | Menu name | Example | Notes |
|---|---|---|---|
| A0 | Count It Out | "Bring 7 cookies" | Tray practice. 1–10, then 11–20 using two frames. No equation. |
| A1 | Little Bites | 3 + 2, 5 − 2 | Within 5. Add/sub mixed ~55/45 by default; the parent can set addition only or subtraction only (D24). The child knows most A1 addition, so subtraction only is the likely setting. |
| A2 | Big Bites | 4 + 5, 9 − 3 | Within 10 (sums 6–10). Near-doubles (3+4 = 3+3+1) built on known doubles. |
| A3 | Perfect Ten | 7 + ? = 10, 10 − 4 | All pairs to 10. Ten-frame centered. |
| A4 | Missing Munchies | 3 + ? = 8, 7 − ? = 5 | Missing addend (either order) and missing subtrahend, within 10. |
| A5 | Ten and More | 10 + 4, 14 = 10 + ? | Teen numbers as ten + ones, and 1n − 10, 1n − n. |
| A6 | Teen Twists | 12 + 5, 17 − 4 | Teens ± ones **without** crossing ten (bridges A5 → A7). |
| A7 | Jump the Ten | 8 + 5, 9 + 6 | Bridging ten by addition. Known doubles (6+6 … 9+9) are the anchors; leads with near-doubles (7+8), then 9+x, then 8+x. |
| A8 | Back Over Ten | 15 − 7, 13 − 6 | Subtracting through ten. |

**Big Menu (tens and ones, up to 100)**

| ID | Menu name | Example | Notes |
|---|---|---|---|
| B1 | Ten Boxes | 30 + 20, 50 − 30, 34 + 10 | Tens only, plus ten more / ten less. Needs only counting by tens; independent of A7/A8. |
| B2 | Tens and Ones | 23 + 4, 27 − 5, 20 + 7 | No regrouping either direction. |
| B3 | Double Boxes (P2) | 23 + 14, 48 − 23 | Two-digit ± two-digit, no regrouping. |
| B4 | More or Less (P3, backlog) | 34 vs 29 | Compare. Not a tray task; needs a response mechanic that is not a guessable two-way choice (§1.4) before it can be scheduled (D47). Not in v1. |
| — | Mystery Orders (P3, backlog) | ? − 3 = 5 | Start-unknown subtraction. Not in v1. The addition form `? + a = c` is a commuted missing addend and is in A3/A4 (D34). |

Priority: **P1** = A0–A8, B1, B2. **P2** = B3 (M9). **P3** = backlog (B4, Mystery Orders). Tier 1 ships A1–A3; A0 and A4–A8 are M5, B1–B2 are M8.

### 1.3 Is the ten-frame approach sound?
Yes, with these constraints (all encoded below):
- Ten-frames up to 20. Above 20 use **ten-packs** (a box drawn as a 2×5 mini-frame = 10) and singles; never 23 loose items.
- Frames alone do not teach strategy. The teaching lives in (a) the fixed fill order that makes "complete the ten first" happen naturally for bridging, (b) the demos, and (c) stage fading.
- Auto-serve is forbidden (the child would add until it dings). Serving is an explicit bell press (D4).
- The tray accepts drops anywhere and places into the next empty cell. No free placement (D5).
- The first-five / second-five tint is non-negotiable: it supports subitizing 5-anchored quantities.

### 1.4 The response mechanic (D2)
"Tap the food with the right number on it" is guessable multiple choice and trains numeral matching, not quantity. Instead:
- **Primary response = build the answer** on the tray (S3–S1).
- **Abstract response = numeral entry** on a number pad (S0).
- Numbers appear only as counting cues: at S3 each tap speaks the running count (adding) or the remaining count (removing), §3.3 (D91).

---

## 2. Technical stack and architecture

| Concern | Decision |
|---|---|
| Language/build | TypeScript (strict), Vite, ES2020 target; baseline iOS 15.4+ / recent Chrome on Android (`100dvh` and `crypto.randomUUID` need iOS 15.4+, D37). |
| UI | React 18, function components. The service is a plain controller class read through `useSyncExternalStore` (D73); elsewhere a small reducer + context; no state library. |
| Styling | Plain CSS (or CSS modules) with custom properties. No CSS-in-JS. |
| Animation | CSS transforms/opacity and Web Animations API. No animation library. Animate only transform/opacity. |
| Drag | Custom Pointer Events (no dnd library). |
| Storage | IndexedDB via `idb`; in-memory fallback. |
| Validation | `zod` for import/export and settings. |
| PWA | `vite-plugin-pwa` (Workbox), precache everything, `registerType: 'prompt'` (D12): a waiting service worker is activated (with reload) only while the Splash shows on cold launch or after 30 s without input on Home — **never on any other screen, never mid-service** (D54). |
| Font | `@fontsource/andika` (self-hosted, OFL). |
| Tests | Vitest (unit/property), Playwright (e2e; Chromium + WebKit projects). |
| Lint | ESLint + Prettier; custom `lint:content`. |
| Network | No runtime requests except same-origin static assets. CSP meta: `default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; worker-src 'self'` (inline styles are needed for React style props); e2e asserts zero external requests. The CSP meta is emitted in **production builds only**, and `build.assetsInlineLimit: 0` keeps small assets from becoming `data:` URIs the default `font-src` would block (D37). |

### 2.1 Directory layout
```
/ CLAUDE.md
/ docs/ SPEC.md DECISIONS.md(index) OPEN_ITEMS.md PLAN.md PLAYTEST.md CONTENT_REVIEW.md(generated) screens/ archive/
/ src/
    engine/      PURE TS. No DOM, no React. rng, problems, generators, attempt flow, scheduler, mastery, tray model, demos, economy
    game/        tray UI, ten-frame, packs, drag/input, service controller, numpad
    art/         monsters (SVG), foods, shop items, Pip
    audio/       sfx (WebAudio synth), speech (TTS), unlock, manifest
    storage/     idb, schema (zod), migrations, export/import, snapshots
    parent/      gate, progress, settings
    app/         screens (Splash, Home, Menu, Service, Results, Shop), layout/scale, metrics.ts
/ tests/unit  /tests/e2e
/ scripts/ lint-content.ts content-table.ts make-icons.ts
/ public/ manifest, icons
```
ESLint MUST forbid `src/engine/**` importing `react`, `react-dom`, or touching `window`/`document`/`indexedDB`.

### 2.2 Stage and scaling
- **Landscape layout; portrait rotates the stage (D8).** If the viewport is taller than wide, the whole stage is CSS-rotated 90° clockwise to fill the screen, so the child just turns the device counter-clockwise to hold it upright. When the device actually rotates, the transform is dropped with no state change. Works under iOS rotation lock and on iOS, where no API can force orientation. Installed Android PWAs are locked to landscape by the manifest.
  - Portrait ⇔ `visualViewport.height > visualViewport.width`; container sized `H × W`, `transform-origin: top left; transform: translateX(W) rotate(90deg)`; safe-area insets remapped (stage top = screen right, stage left = screen top, stage bottom = screen left, stage right = screen bottom).
  - **All pointer math goes through one pure `toStageCoords(clientX, clientY, stageTransform)`** that inverts the current transform; no other code reads raw `clientX/Y`. Unit-tested for both orientations.
  - For the first 6 s in rotated mode a silent animated cue (curved arrow) at the stage's right edge shows which way to turn; it ignores taps (D61).
  - The parent gate and parent area are full-screen and not rotated (they contain text entry). `?rotate=off` disables rotation for desktop debugging.
  - **Debug screen:** a `?debug` query flag, read once at boot and available in production builds, opens a hidden debug screen (version, build date, storage state, a per-skill stage/operations picker until M3a, D44, and a **Sound test**: AudioContext state and clock, contexts built/rebuilt, tones played/skipped, buttons Tone / Bell / "Speak, then bell" / "Bell, then speak" / "Rebuild sound", and a per-device `navigator.audioSession.type` picker, default `playback`, D87). No child-facing link reaches it (D37). Before M3a the same content also opens, for grown-ups only, from the Home gear: a tap opens the "For grown-ups" popup and a 2 s hold on its circle opens the tools (§5.2, D94, D95), full-screen, not rotated and scrollable, with a big "Back to the café" button; the back gesture also returns to Home.
- Logical **safe box 1280×720**; all interactive content lives inside it. Scale = `min(vw/1280, vh/720)`, centered; background art bleeds beyond it to fill 4:3 (iPad) and ~2.2:1 (phones). All logical sizes and rects live in `src/app/metrics.ts`.
- Use `100dvh`, `viewport-fit=cover`, and `env(safe-area-inset-*)`.
- Minimum tap sizes at **844×390** (iPhone landscape standalone): tray cells ≥ 44 CSS px, buttons ≥ 56 CSS px. Logical sizes: tray cell 88, gap 8, buttons ≥ 112 (88 × 0.54 ≈ 47.5 CSS px).
- Safari-in-browser iPhone landscape has less height (~340); documented as "install to Home Screen for phones".

### 2.3 Touch hardening (MUST)
- `<meta viewport ... user-scalable=no, maximum-scale=1, viewport-fit=cover>`; `touch-action: none` on the play surface and `manipulation` elsewhere; prevent `gesturestart/gesturechange/gestureend` (iOS ignores `user-scalable`).
- Root: `position: fixed; inset: 0; overflow: hidden; overscroll-behavior: none`; `user-select: none`; `-webkit-touch-callout: none`; `-webkit-tap-highlight-color: transparent`; `contextmenu` `preventDefault` (outside parent text fields).
- Non-passive `touchmove` listener on the root that `preventDefault`s (except inside parent-area scroll containers and inputs).
- One active pointer at a time (`setPointerCapture`); extra `pointerdown`s are ignored while a drag or an animation lock is active. Placing and removing update the tray model at once; item flights are visual only and never a lock; locks apply only to eating, demos and PlateCount (D42). Tap-to-skip is exempt from the eat lock (D56). `pointercancel` returns the item. Touches with `width` or `height` > 80 px are ignored (palm; best-effort — iOS reports no contact geometry, so the single-pointer rule is the real defense).
- Tap vs drag: movement threshold 10 CSS px.
- Buttons act on `pointerup` with `pointerdown` inside the same element (no ghost clicks); the bell has a 400 ms re-press guard.
- `prefers-reduced-motion` honored, plus a parent toggle (§12): flights become 150 ms fades; no wobble, shake, or confetti.
- `visibilitychange`: pause TTS and the service clock; on return resume the same state. After a reload the app **offers** "Continue dinner service?" from the `resume` snapshot (§5.8, §11.6); it never resumes silently (D33).
- **Back guard (D19, D46):** on every child-facing screen (Home, Menu, Service, Results, Shop) a history entry is pushed and `popstate` shows the "Take a break?" dialog (§5.4) instead of leaving (Android back gesture, iOS edge-swipe). Chrome skips entries pushed without user activation, so the entry is pushed from inside a tap (the Splash tap) and again after each in-app navigation (D37). Never trap the user inside the parent area.
- `text-size-adjust: 100%`; `overscroll-behavior: none` also disables pull-to-refresh.

### 2.4 Performance
Target: iPad 6th gen / iPhone 8-class. ≤ 300 SVG nodes on screen; confetti ≤ 30 particles; no CSS `filter`/`backdrop-filter`/large shadows on animated nodes. A 4× CPU-throttled e2e run measures frame deltas during the eat animation and **reports** them; it is not a gate. Smoothness is judged on the real iPad (D37).

---

## 3. Core model

### 3.1 Types (authoritative shape; names may be refined, semantics may not)
```ts
type SkillId = 'A0'|'A1'|'A2'|'A3'|'A4'|'A5'|'A6'|'A7'|'A8'|'B1'|'B2'|'B3'|'B4';
type Stage = 3 | 2 | 1 | 0;                 // support stage, §3.2

interface Problem {
  factKey: string;          // canonical, stable, persisted (scheme below)
  skill: SkillId;
  form: string;             // generator-specific, e.g. 'add','sub','missingAddend','teenCompose'
  operands: (number | null)[];   // as displayed, left to right; `null` is the blank
  display: (number|'?'|'+'|'−'|'=')[];  // tokens rendered on the ticket
  answer: number;           // the value of the unknown
  spoken: string;           // unwrapped sentence, number words only, e.g. "Eight plus five equals what?"; result forms are wrapped with the food at speak time (§4)
  strategy: StrategyTag;    // 'countOn'|'countBack'|'doubles'|'nearDouble'|'makeTen'|'bridge'|'backThroughTen'|'tens'|'tensOnes'|'compare'|'count'
  difficulty: 1|2|3|4|5;
}

interface TrayTask {         // derived from Problem + Stage, pure function
  layout: 'frames1'|'frames2'|'tensOnes';
  prefill: { frameCells?: number; tens?: number; ones?: number; locked: boolean };
  mode: 'add' | 'remove';    // direction the child acts in
  takenAwayRow: boolean;     // missing-subtrahend forms (A3 `10−?=a`, A4): removed items stay visible, §3.3
  expected: { cells?: number; tens?: number; ones?: number; typed?: number };
  entry?: 'numpad1'|'numpad2';   // S0 only
}
```
- **`factKey` scheme (D50):** `skill:form:operands`. Addition result keys sort the operands (`A2:+:3,5`), so commuted partners share a key; `a+?=c` and `?+a=c` share `A4:?add:a,c`; `10−a=?` is `A3:-:10,a` and `10−?=a` is `A3:?sub:10,a`. Changing the scheme needs a migration.
- **S0 (D69):** `toTrayTask` returns the S3 tray fields (the cloche model, §5.4) plus `entry: 'numpad1'` and `expected.typed = answer`; `check` compares the typed number when `entry` is set, otherwise the tray.
- `toTrayTask(problem, stage)` and `check(trayTask, trayState)` are pure and unit-tested for every pool item at every stage.

### 3.2 Support stages (per skill)

The stage is a per-skill parent setting (default S3, D3, D23), stored as a `skillConfig` event and applied from the next service.

| Stage | Name | What the child sees/does | Tray starts | Sound per tap |
|---|---|---|---|---|
| S3 | Guided | Frames/packs visible; groups color-coded to the ticket; running counts; Pip's hat pulses after 10 s idle | Operand prefilled & locked (add) or full minuend (sub) | Spoken running count, no tone (D91) |
| S2 | Build | Same as S3 without counts or pulsing | Same | Tone |
| S1 | Build the answer | Empty frame(s) (outline only) holding only the **unknown**; no prefill | Empty | Tone |
| S0 | Numeral | No tray; number pad; **Peek** lifts a cloche to reveal the S3 model (§5.4) | n/a | Tone on digits |

"The unknown" at S1: the result for `a + b = ?`; the missing amount for `3 + ? = 8`; the amount removed for `7 − ? = 5`; for subtraction result forms, what is left on the plate.

A0 (Count It Out) has no equation or prefill: S3 = empty tray with spoken running counts; S2 = no counts; S1 = same as S2 but the bin is the only cue (tray outline only, ticket text hidden after 3 s, tap ticket to hear again); S0 = a pile of food is shown and the child types how many.

Worked mapping — add result `5 + 3`: S3/S2 prefill 5 (blue, locked), the child adds 3 (orange) → 8; S1 builds 8 from empty; S0 types 8. Sub result `8 − 3`: S3/S2 prefill 8, the child taps 3 items away (each removes the last filled cell, so the 5 left stay a full row) → 5; S1 builds 5; S0 types 5. Missing addend `7 + ? = 10`: prefill 7, fill to 10; S1 builds 3; S0 types 3. Missing subtrahend `7 − ? = 5`: prefill 7, remove until 5 remain, and the 2 removed items stay in the taken-away row; S1 builds 2; S0 types 2.

### 3.3 Tray rules (precise)
- **Frames** (A-track): ten-frame = 2 rows × 5 cells; cell 88 logical px, gap 8, padding 12 (496 × 208). Two frames sit side by side with a 24 px gap, centered. In each frame the top row (cells 1–5) is tinted A and the bottom row (cells 6–10) tinted B (the "five wall"). Group colour (blue/orange/green, §5.4) is a 5 px ring on the cell, so the tint stays visible under the emoji (D62).
- **Canonical order (D5, D30):** reading order; frame 1 first, then frame 2. A new item always takes the **first empty cell**. Removal always takes the **last filled cell**, whichever item was tapped or dragged (the touched item is the one that visibly flies away), so the filled cells always run from cell 1 with no holes. **Exception (A5, D47):** in `1n = ? + n` and `1n − 10 = ?` the ten is added or removed as one whole frame in a single step.
- **Place:** tap the bin or drag from it; dropping anywhere on the tray works; dropping elsewhere returns the item.
- **A tap on an item means the same thing everywhere (D82):** tapping a placed unlocked item sends one back to the bin (the last filled unlocked cell), in add and remove mode alike; dragging an item off the tray or to the bin does the same. Tapping a locked blue prefill item shakes it and removes nothing. There is no "take one back" button.
- **Put back (remove mode, D42):** tapping the bin (or, for missing-subtrahend forms, the taken-away row) puts the last removed item back into the first empty cell, so an over-removal can be fixed.
- **Taken-away row** (`takenAwayRow`, missing-subtrahend forms only, D30): removed items stay in a 2 × 5 grid of 56 px dashed slots left of the tray, tapped as one target (D62, D63), so the unknown (the amount removed) stays on screen. CountTogether and the demos point at it. Result forms (`8 − 3 = ?`) have no such row; their removed items fly to the bin.
- **Unlimited copies:** the bin never empties. Only the ordered food type appears (no distractors).
- **Capacity:** `frames1` holds 10, `frames2` 20 (A-track max). Over-capacity attempts wobble the bin and say nothing; no second frame appears on its own. Tier 1 renders only `frames1`; the model, `toTrayTask` and `check` support `frames2` from M1 (D57).
- **Tens-and-ones layout (B-track, M8):** left = **tens shelf** (up to 10 ten-packs, two rows of 5 slots), right = **ones frame** (single ten-frame; the 10th single triggers auto-bundle: ten singles pop into a pack and fly to the shelf). Two bins: *Box of 10* and *Single*. Capacity: 10 packs + 9 ones. Removing a pack takes the last pack on the shelf, which flies to the *Box of 10* bin. Settled by a static layout mock at the start of M8 (D47).
- **Ten-pack art:** rounded SVG box containing a 2×5 grid of ten small food glyphs (HTML-positioned, same renderer as frame cells), so a pack visibly equals one full frame.
- **Serve:** the bell (≥ 112 logical px). Disabled while animations run or when the tray equals its start state (a disabled tap wobbles the bell; this is also why no answer is ever 0, §4). **Never auto-serves** (D4).
- **Counting voice (S3, D75, D91):** adding says the running total from the prefilled count ("six", "seven", …, counting on); removing says the remaining count (counting back); B-track packs say the running tens ("ten", "twenty"…), then singles continue ("twenty-one"…). A new count cuts off the count still playing, but never another line; while another line plays, the count is skipped. At S3 a tap gets the count and no tone; at S2, S1 and on the S0 digit pad a tap gets its tone (§8.3). The sound follows the service's stage, also during FollowMe.

### 3.4 Problem state machine (`engine/attempt.ts`, pure + tested; D29, D89)
```
MonsterArrive → OrderShown(speak ticket) → Building(attempt=1)
Building --Serve--> Evaluate
Evaluate: correct → Eat → Reaction → Coins → MonsterLeave → next
Evaluate: 1st wrong → PlateCount → Building(attempt=2, tray as served); Pip's hat pulses until the next serve or Help
Evaluate: 2nd wrong → PlateCount → OfferHelp("Want Pip to help? Or try again?")
OfferHelp: yes (Pip button or Pip's hat) → Worked → FollowMe → Assisted → requeue → MonsterLeave → next
OfferHelp: no (try again) → order repeated → Building
Evaluate: 3rd or later wrong → PlateCount → Worked → FollowMe → Assisted → requeue
Help before any serve (attempt=1) → CountTogether → Building(attempt=2)
Evaluate: wrong after Help-before-serving → PlateCount → Worked → FollowMe → Assisted
Help at attempt=2 (after a miss, or again after CountTogether) → Worked → FollowMe → Assisted
```
- Help at attempt 1 *advances* to attempt 2, so CountTogether never plays twice and Help followed by a wrong serve goes straight to Worked (D29). The first miss also advances to attempt 2, so Help after a miss plays Worked (D89).
- OfferHelp locks the tray and bell until the child picks one of two picture buttons; the tray hides behind them. Nothing is chosen for the child, and the offer never repeats within one problem: a miss after "no" plays the demo (D89).
- **Peek (S0, D41, D67):** marks Help for the outcome but plays no CountTogether and does not advance the attempt; a wrong serve after Peek is an ordinary first miss.
- "First-try correct" = first serve correct **and** no Help or Peek before it.
- Outcomes (identical spelling in the engine and the persisted `attempt` event, §11.2; D29):
  - `first`: correct on the first serve, no Help.
  - `afterHint`: Help or Peek before the first serve, then correct.
  - `fixed`: one or more wrong serves, then correct without the demo.
  - `assisted`: Worked + FollowMe ran.
- Box effects of each outcome are in §4.2.
- Wrong faces are never angry: the monster tilts its head, soft two-note descending "hm?" tone.

---

## 4. Generators and the problem pool

All generators are pure functions of `(rng, params)`; `pool(skill)` enumerates every fact; `make(fact, rng, stage)` realizes it (random operand order where commutative, random food).

Pool counts below were computed by script. They count **ordered presentations** (3+5 and 5+3 are two); mastery uses canonical `factKey`s, so there are fewer canonical facts. `lint:content` compares against these ordered counts.

**No zero answers (D11).** The bell is disabled while the tray equals its start state, so a zero result at S1 would deadlock. No pool contains an answer of 0 (`n+0` and `n−n` are excluded). Zero is deferred to a later "Nothing left!" lesson (backlog).

**Frame count rule:** `layout = frames2` iff `max(prefill, expected tray value) > 10`, else `frames1` (centered).

| Skill | Forms | Constraints | Pool |
|---|---|---|---|
| A0 | `count`: bring n | n 1–10 (frames1), 11–20 (frames2) | 20 |
| A1 | `a+b=?`, `m−b=?` | a,b ≥ 1, a+b ≤ 5; m 2–5, b 1–(m−1) | 10 add + 10 sub = **20** |
| A2 | `a+b=?`, `m−b=?` | sums 6–10; m 6–10, b 1–(m−1) | 35 + 35 = **70** |
| A3 | `a+?=10`, `?+a=10`, `10−a=?`, `10−?=a` | a 1–9 | 9×4 = **36** |
| A4 | `a+?=c`, `?+a=c`, `m−?=c` | c ≤ 10, a<c; m 2–10, 1 ≤ c < m; `?+a=c` included (D34) | **135** |
| A5 | `10+n=?`, `n+10=?`, `1n=10+?`, `1n=?+n`, `1n−10=?`, `1n−n=?` | n 1–9 | 9×6 = **54** |
| A6 | `1n+k=?`, `k+1n=?`, `1n−k=?` | n+k ≤ 9 (no crossing); k<n for sub (result > 10) | 72 + 36 = **108** |
| A7 | `a+b=?` | a,b 2–9, a+b 11–18 | **36** (20 unordered) |
| A8 | `m−b=?` | m 11–18, b 2–9, b > m−10 (must cross ten) | **36** |
| B1 | `T1+T2=?`, `T1−T2=?`, `n+10=?`, `n−10=?` | T multiples of 10; sums ≤ 100; n 11–89 not a multiple of 10 | 90 + 144 = **234** |
| B2 | `tO+k=?`, `tO−k=?`, `T+O=?` | add: t 1–8, ones 1–8, k 1–(9−ones). sub: t 1–9, ones 2–9, k 1–(ones−1). compose: T 10–80, O 1–9. **No regrouping** | add 288, sub 324, compose 72 → **684** |
| B3 (P2) | `tO+tO=?`, `tO−tO=?` | tens and ones each non-regrouping | generated |
| B4 (P3, backlog) | compare two quantities/numbers | ≤ 20 with plates, then ≤ 100 with numerals | generated |

A3's canonical add/sub share is 9 : 18 (its `?sub` and `-` keys are separate), so with `ops = both` its balance target is about one third addition (D50).

**Difficulty (1–5) is the new-fact introduction order** (§4.1 step 4, D29, D43). When `ops` is both, new addition and subtraction facts alternate. Orderings for A4–A6 are written in M5 and for B1–B2 in M8.
- A1/A2 (D72): addition near-doubles (`|a − b| = 1`, 1+2 included) are difficulty 1, then by larger addend (A1: larger − 1, A2: larger − 4); subtraction by minuend (A1: m − 1, A2: m − 5). Known facts (+1, doubles) are never "new" (§4.2).
- A3: 5+5 and 9+1 easiest; then by distance from 5.
- A7: near-doubles (5+6, 6+7, 7+8, 8+9) first (doubles are known), then 9+x, then 8+x, then by `10 − max(a,b)`; A8: by `b − (m−10)`, small first (D17).

Strategy tags are attached per fact and pick the demo (§5.5). A1/A2 (D72): addition `a = b` → `doubles`; `|a − b| = 1` → `nearDouble`; otherwise `countOn`; subtraction → `countBack`. Other skills: e.g. 8+5 → `bridge`, A3 → `makeTen`.

Spoken forms (all via `numberToWords`, never raw digits):
- **Result forms** (`a + b = ?`, `m − b = ?`) are wrapped in the café frame with the order's food and "please": "Three plus two cookies, please!", "Eight minus three cookies, please!" Spoken only; the written ticket stays numerals and symbols.
- **All other forms keep the plain question** (the food is shown, not spoken): `a + ? = c` → "Seven plus what equals ten?"; `m − ? = c` → "Seven minus what equals five?"; A5 `14 = 10 + ?` → "Fourteen equals ten plus what?". The unwrapped result form (the `spoken` field) is "Eight plus five equals what?".
- A0 → "Can I have seven cookies, please?"
- The base wording is "minus" and "equals what?"; "take away" / "makes" was considered and rejected.
- The food noun uses the `{singular, plural}` pair of the order's `FoodId` (§7.1). Phrases live in the phrase table (`phrases.ts`).

### 4.1 Session builder (deterministic given seed)
Inputs: `seed`, `skill` (chosen on the menu board), `orders` (4/6/8), the skill's `ops` filter and stage (`skillConfig`, D23, D24), per-fact boxes, focus list, and the set of facts already seen (any `attempt` event, or in the `known` preset).
1. PRNG: `mulberry32`; seed = hash(`deviceId`, service start time, per-device service counter), injected by the caller and stored in `serviceEnd`. Same seed and same starting state (boxes, seen set, settings) → same service. A resumed service does not rebuild from the seed; it continues the planned order list stored in `resume` (§11.6, D43).
2. **Pool:** the chosen skill's pool, restricted by its `ops` filter (`both` | `add` | `sub`; shown for A1–A6, B1, B2; single-operation skills ignore it, D24, D43). All orders come from this pool plus requeues.
3. **One skill per service (D22).** "Another service" repeats it; "Change dish" returns to the menu board (§5.7).
4. **Weighted sampling by box:** weights `[5,3,2,1,0.5]` for boxes 0–4; new facts weight 5. **New-fact introduction (D29):** a *new* fact is one never attempted and not in the `known` preset. New facts are introduced in difficulty order (ties broken by the seeded rng), **at most 3 per service**; the other orders come from facts already seen. One box per canonical `factKey`, so commuted partners share it. When `ops` is `both`, new facts of the operation the seen set lacks are introduced first, as many as that operation's minimum count under step 5's balance (the band is `ceil(target − 1)` … `floor(target + 1)` additions), so the balance stays reachable (D97).
5. **No immediate repeats:** the same `factKey` must not appear within the last 4 problems; the same food and the same monster never twice in a row; when `ops` is `both`, the add/sub ratio stays within ±1 of the target per service (A1 ~55/45; every other skill its pool's canonical add/sub share, D43). Requeues are exempt from the 4-problem window but never adjacent to their fact (their monster gives way first when both cannot be met, D97). The window shrinks to (distinct available facts − 1) when fewer than 5 are available.
6. Food: the monster's favorite 70% of the time, else random from the allowlist.
7. **Requeue (D23, D31, D43):** `assisted` facts are reinserted 3–5 problems later with one step more support (S0→S1→S2→S3; S3 stays), a different food and swapped operand order where commutative; max 2 requeues per service. A requeue that does not fit 3–5 problems later is appended to the end (the service gets longer), with at least one other order in between when one exists (if the end would touch its own fact or monster, the latest spot keeping an order in between, D97); a queued requeue adds a silhouette to the waiting line. A requeue is **the same monster coming back** ("Blobbo's back — still hungry!") and pays the usual 3 coins. A requeue is dropped only when the service is cut short (a voluntary exit, or the play-time wind-down or grace cap, §6.2); a time cutoff never changes a box.
8. Service length = orders + requeues (max orders + 2).
9. **Pool-size guard (D39):** *available* facts are the facts already seen plus the (at most 3) newly introduced ones. If distinct available facts < orders (e.g. the first A1 service with subtraction only), repeats are allowed but never adjacent.

The first-ever service on a device begins with the warm-up order (§5.4, D26).

### 4.2 Fact boxes, stage and starting state (constants in `engine/config.ts`; tuned by playtest)
- **Fact box (0–4), one per canonical `factKey` (D29):**
  - `first` at **S1 or S0** → box+1 (max 4). `first` at S3 or S2 → unchanged (with the first operand prefilled, success mostly reflects counting out the second group).
  - `afterHint` → unchanged.
  - `fixed` → box 0, no requeue. `assisted` → box 0 and a requeue (§4.1 step 7). A miss or an assisted resolution resets the box at **every** stage.
  - At the default S3 boxes therefore do not rise until a parent moves a skill to S1/S0, so sampling stays even.
  - Time cutoffs (the allowance, the 90 s grace cap) write no `attempt` and change no box (§6.2).
- **Stage per skill** is a stored parent setting (`skillConfig`, default S3, D23), applied from the next service. The stage uses the *same fact pool*; only the representation fades.
- **Starting state (reported by the parent, D16, D38, D43):** the child knows +1 (both orders) and doubles 1+1 … 9+9. (+0 is known too but is in no pool, D11, so there is no toggle for it.) The child solves take-away *word problems* but is still learning *number sentences* with sums under ten, so symbolic subtraction counts as new. The default `known` preset puts those addition facts at box 3; it covers only result forms (`a + b = ?`) in A1, A2 and A7, so missing-addend forms such as `9 + ? = 10` count as new. Every skill starts at S3. Editable in Parent → Skills (M3a: stage and operations; M7: starting-point toggles, stored as a `known` event).
- Never shown to the child: percentages, wrong counts, streaks, response times.

---

## 5. Screens and flow

```
Splash(tap to start) → Home ─┬─ "Open the Café" → Menu board (pick a skill) → Service(skill) → Results ─┬─ Another service → Service(same skill)
                             │                                                                           ├─ Change dish → Menu board
                             │                                                                           └─ Home
                             ├─ Shop (decorate; from M4)
                             └─ [hidden corner gear] Parent gate → Parent area
```

### 5.1 Splash
Full-screen "Tap to start". The tap unlocks WebAudio (`resume()`), primes `speechSynthesis` (an empty utterance), sets `navigator.audioSession.type = 'playback'` if available, calls `navigator.storage.persist()` (best effort), and pushes the back-guard entry (§2.3). No text input anywhere child-facing.

### 5.2 Home
The café with the owned shop decorations, Pip, and the coin jar with count. Two big targets: **Open the Café** (primary, largest; opens the menu board) and **Decorate** (paintbrush; added with the shop in M4). An 88 px, 30%-opacity gear (real gear art) in the top-right corner; a tap opens the "For grown-ups" popup ("Press and hold the circle for two seconds to open the settings.", a large light-blue circle, **Close**; tapping outside or the back gesture also closes it), and a 2 s hold on its circle (a darker ring fills clockwise from the top, drawn per frame so it shows with reduced motion; lifting early or sliding off empties it) opens the playtest tools before M3a (the `?debug` content, §2.2; picker changes apply from the next service), the Skills list in M3a, and the gate from M3b (D44, D94, D95). When the café is locked (§6.2) Home shows the closed café ("Closed — ask a grown-up to open it!") instead of the buttons; the gear still works.

### 5.3 Menu board
Chalkboard with two tabs, "Little Menu" / "Big Menu" (a tab with no built skill is hidden). Tiles 3×3 (9 on Little, 4 on Big): food icon and a sample sentence in chalk showing an operation the parent allowed (e.g. a subtraction for A1 set to subtraction only). This is the start of every play session. Every playable tile looks the same, with a solid border and no highlight or glow; tiles that cannot be played yet are dashed and faded (D78, D83). Parent-hidden skills do not render. Tapping a tile starts a service with that skill.

### 5.4 Service screen layout (safe box 1280×720; the `SERVICE` table in `src/app/metrics.ts`)
Bands: monster and ticket y ≈ 50–300 · tray y 311–519 · bottom y 562–706. Coordinates are logical px (x/y ranges).
- **Monster** centred behind the counter (x 520–760, y 52–292; D65), so the child feels they are serving it. **Waiting line** by the door at the left (x 0–340, y 150–300): small silhouettes, one per remaining order (a queued requeue adds one), the natural end-of-service cue (D63). The line hides while Pip is out or the CountTogether bubble is up and fades back in only after the monster has walked back to its spot (D91).
- **Ticket** (paper receipt, right beside the monster, x 784–1144, y 50–270; it slides right to x 904–1264 while the CountTogether bubble shows; D65). Tokens are colored **by their role on the tray, not by position** (D30, D39): blue = the prefilled/locked group (at S1/S0, the group that would be prefilled at S3), orange = the group the child adds or removes, green = the result; so in `? + 4 = 14` the 4 is blue and the blank orange. The blank also has a dashed box so color is never the only cue. On a correct serve the dashed box is replaced by the answer in green (the result color, whatever the blank's role), popping in unless motion is reduced; it stays until the next order (D96). Tap the ticket → replays the order. Food icon beside it.
- **Caption bubble** (x 250–520, y 16–140) just left of the monster with a tail pointing at it, for the monster's lines (D76). Pip's lines use Pip's own caption (§7.3). Hidden while the CountTogether bubble shows.
- **Tray** on the counter, centered (frames1: x 392–888, y 311–519). The **taken-away row** (missing-subtrahend forms) sits left of it (x 40–364, y 346–484, D63) without shrinking the tray.
- **Bottom band:** **Bin** centred under the tray (x 490–790, y 570–700), a two-row heap (four items behind, five in front, overlapping, each placed by its centre at a fixed share of the bin's width so any emoji font fills it, D79, D85). **Bell** right of the bin at every stage and in every mode (x 810–954, y 562–706; D64, D82). **Pip's hat button (Help)** bottom-left (x 40–180, y 576–700). **Door sign (leave)** top-left (x 16–128, y 16–128): opens "Take a break?" with two 160 px buttons, *Keep cooking* / *Close the café*; *Close the café* writes a partial `serviceEnd` and goes to Home (§5.8). On Home, Menu, Results and Shop the back guard's dialog shows only *Keep cooking* and dismisses (D46).
- **Help offer (D89):** two 220 px picture buttons over the tray band (x 380–600 and 680–900, y 300–520): full-body Pip (yes) and a ten-frame in a circling arrow, arrowhead at the end of the turn (no) (D90).
- **Pip** (x 262–386, y 150–305) stands on the counter left of the monster while help is offered or given (§7.3, D90).
- **S0 (D32, D48, D62):** the number pad replaces the bin and tray. **One row of ten digit buttons, 0–9 in order** (112 × 112 each, gap 8; x 44–1236, y 414–526), above it **Peek** (x 360–488), **one answer display that always accepts up to two digits** (x 520–760) and **backspace** (x 776–904), all y 292–404. No separate tens/ones slots, so the number of slots never reveals whether the answer is above nine; the ordered digit row doubles as a small number line. Every S0 button is ≥ 56 CSS px at 844×390. Pip's hat (Help) stays at S0 and follows §3.4. The bell keeps its spot and is disabled while the display is empty (D41).
- **S0 cloche (D41, D62, D63, D67):** Peek, Worked and FollowMe lift the cloche: the full S3 tray takes the tray band, the bin returns to the bottom band, and the lifted lid (x 200–350, y 330–480, with a "123" badge) sits left of the tray. During Peek the bell is disabled; tapping the lid (or Help) lowers the cloche and brings the digits back. After Worked/FollowMe the cloche lowers on its own (§5.5).
- **First-ever service (tutorial, D26, M2):** before the chosen skill's orders, one warm-up order `2 + 1` (cookies, one ten-frame, S3, whatever skill was picked). If the child has not touched anything after 4 s, a ghost hand taps the bin once; once the item is on the tray, after 4 more idle seconds the ghost hovers over the bell with a tap motion while Pip says what to do. The bell press is always the child's. The order pays the usual 3 coins (a `coin` event) and writes no `attempt`. Shown once per device (flag in the `meta` store).
- **Building cuts the order (D88):** while the order is being read, the child's first tray, bin, taken-away row, digit or backspace action stops it at once; the tap's count or tone plays and the tray works normally. Serving and Help never cut it. Tapping the ticket replays it.
- **Idle:** the order is spoken once when the monster arrives and again only when the child taps the ticket; it never repeats on idle (D81). At S3 Pip's hat pulses after 10 s idle (§3.2).

### 5.5 Teaching behavior
- **PlateCount (after every wrong serve, D30, D39):** the monster counts the served plate aloud and names what it wanted: "I see seven… I wanted eight. One more!" ("One less!" when over by one; no closing phrase when off by more). It compares the tray total with the expected tray total; at S0 the monster echoes the typed number ("Seven? I wanted eight."). No red X, no buzzer, no lost coins. It plays before OfferHelp or Worked, and on its own after a first miss (D89).
- **OfferHelp (after the second miss, D89):** the monster asks "Want Pip to help? Or try again?"; Pip pops up on the counter; the tray hides behind the two picture buttons (§5.4) and the bell is locked until the child picks. Yes (or Pip's hat) → Worked → FollowMe; No → the monster repeats the order and the child builds again from the tray as served.
- **CountTogether (Help before the first serve, D84, D90):** a *model bubble* fills the space from Pip to the ticket (x 404–888, y 8–290, down to the counter); the ticket slides right, Pip stands at x 262 with the bubble's tail pointing at it, and the monster shrinks to 120 px and steps further left (x 120). Non-interactive frames/packs, as large as fit (one frame: 64 logical px cells; two side by side: 42), show the problem — first group (blue), then second group (orange) — and Pip says "Let's count together." (D77) and counts them with running numbers to the answer. Subtraction result forms count back from the minuend as the orange items fade ("Eight. Seven, six, five. Five left!"). For missing-addend and missing-subtrahend forms the count then counts the orange group (or the taken-away row) from one and names it: "one, two, three — three more!" / "three taken away!" (D42, D68). The bell is disabled while Pip counts; the child's tray stays visible and editable throughout. When the count ends the bubble stays up as a model until the next serve, which is evaluated as usual (D68). It may reveal the answer: first-try correctness is the diagnostic, not secrecy.
- **Worked (D71, D89, D90):** played after "yes" to the offer, a third miss, a miss after Help-before-serving, or Help after a miss. The child's tray is cleared to the **S3 start state at every stage** (prefill, or the full minuend), so the strategy is visible, and Pip narrates the strategy demo (below) slowly. Demos that remove items take them from the last filled cell; demos for missing-subtrahend forms point at the taken-away row. At S0 Worked and FollowMe play on the S3 tray under the lifted cloche (D41).
- **FollowMe (D71):** the tray resets to the S3 start; the next target pulses (an empty cell and the bin to place — tapping the pulsing cell also places; the last item when there are too many; the bin or taken-away row to put one back). The child performs each step (≤ 10 steps; tens/ones ≤ 5; when the answer is over 10 the first full frame is placed as one step, "ten", then the ones one by one, D47). The bell lights and **pulses only when the tray is right**, and the child presses it, so a FollowMe serve is always correct; nothing auto-serves (D4). At S0, once the cloche tray is complete the cloche lowers, the digits return, the correct digit pulses, and the child types it and presses the bell. The monster still eats happily.
- Demos are **data**: `buildDemo(problem): DemoStep[]` with `{ narrationKey, trayOp, holdMs }`; a single player renders them. Unit test: applying every step to the start state ends in the expected tray state for every pool item.

| Strategy | Demo |
|---|---|
| count on / count back | Blue group glows "five", orange items appear one by one "six, seven, eight"; back: items fly off "seven, six, five" |
| doubles | The blue and orange groups glow in turn (groups on the canonical tray, not rows, D42): "Three blue." "Three orange. The same!" "Three and three is six." (split so each caption is ≤ 8 words, D72) |
| near double | The blue group and an equal part of the orange group glow ("you know six and six is twelve"), then the one extra orange item: "One more makes thirteen!" |
| make ten (A3) | Empty cells flash; "seven… and three more makes ten" |
| teens (A5/A6) | Full frame glows "ten"; remainder "and four — fourteen" |
| bridge (A7) | "Eight. Fill the ten first": the first 2 orange items fill frame 1 → "ten, and three left: thirteen" |
| back through ten (A8) | "Fifteen. Take the five to get to ten" (5 fly off) "then two more from the ten" → "eight" |
| tens (B1) | Packs counted "ten, twenty, thirty…" |
| tens and ones (B2/B3) | Packs counted by tens, then singles by ones: "twenty… twenty-one… twenty-seven" |

### 5.6 Eating and reaction
Correct serve: bell "ding"; the monster's line starts 500 ms after the press (`BELL_LEAD_MS`) so the ding is heard first, also after a wrong serve (D86). The tray slides to the monster; food flies into the mouth in groups (≤ 5 individually counted, > 5 by row/pack with the total spoken at the end, e.g. "Eight!"); 3 chew cycles; a reaction from the monster's list (§7.2), with a bigger variant after a first-try serve (visual only, D45). Total eat+react ≤ 4 s; any tap skips ahead (D56). Then 3 coins fly into the jar one by one (§9); the matching `coin` event is written in the same transaction as the problem's other events (§11.3, D31), so the coins shown are exactly the coins kept.

### 5.7 Results (closing time)
The sign flips to CLOSED. The coin tally counts up aloud by ones to ten, then by fives, ending on the exact total ("…fifteen, twenty, twenty-three!", D55). The monsters served show as a row of happy faces (no scores). Buttons (≥ 160 px): **Another service** (default, highlighted: same skill again; absent when the café is locked; with a play-time limit on and less than about half a service left it offers a shorter service, §6.2), **Change dish** (menu board), **Decorate** (from M4), **Home**. When the allowance ran out during this service, Results is followed by the locked Home. No streaks, daily login, or "come back" nags.

### 5.8 Leaving mid-service
Coins earned so far are kept (each completed problem already wrote its `coin` event, D31). A voluntary exit (*Close the café*) records the service as partial (`serviceEnd.partial`, no tip), goes to Home, and the service can be resumed from the `resume` snapshot (§11.6). Reopening within 2 h **offers** "Continue dinner service?" with two big buttons; nothing resumes silently (D33). The play-time lock clears the snapshot, so no offer appears while locked or after an unlock (§6.2, D40).

---

## 6. Play allowance and lock
Goal (owner, D7): a parent who wants to hand the child the device and walk away can turn on a play-time limit, so the child plays for a defined period, not endlessly, until a parent intervenes. **The limit is optional and off by default (D27):** a fresh install has no clock, no lock and no cue, and nothing in this section runs until a parent enables it.

### 6.1 Model
While enabled, a **play session** is one allowance of active play time, per device, *not* reset by closing the app, starting another service, or reloading.
- **Setting** (Parent → Settings, top of the page, per device): Play time limit = **Off (default)** / 5 / 10 / 15 / 20 minutes. Off means no clock, lock, cue, or Start new session / Add time buttons. Choosing a duration (or changing it) starts a fresh session with the full allowance, counting from when the parent returns to the child screens. Choosing Off at any time, even while locked, clears the lock and the remaining time.
- There is no "max services per day" setting (D7).
- **State** (`clock` store, §11.3): `remainingMs`, `state: 'open' | 'locked'`, `lastRefillAt`. Unused while Off.
- **Counts as play time:** foreground time on any child-facing screen (Home, Menu, Service, Results, Shop). **Not counted:** the parent area and gate, the "Take a break?" dialog, a hidden page, and idle time — the clock pauses after 90 s without input and resumes on the next touch.
- The clock is a monotonic accumulator of active time (never wall-clock subtraction), flushed to IndexedDB every 5 s and on `visibilitychange`, so killing the app or changing the device clock refunds nothing.

### 6.2 When time runs out
Only while a limit is enabled. Closing time is not the child's choice, so a time cutoff never counts against them: it writes no `attempt` event and changes no fact box (D33).
1. **Last customer (wind-down).** When `remainingMs` falls below about one order's length (`lastCustomerMs`, set from the median service length measured at the M2 playtest), the waiting silhouettes wave and leave, no further order or requeue is queued, and the current monster is announced as the last customer. The service then ends normally (Results). No number or countdown is shown.
2. **No full new service on a short allowance.** Below about half a service (`minServiceMs`), starting a service (Another service or a menu tile) offers a **shorter service** with as many orders as fit (at least 1, D39). With less than one order's length left, that single order is the last customer.
3. At `remainingMs ≤ 0` with a monster still being served: no new orders; the monster finishes (including FollowMe) with a **hard cap of 90 s grace**. At the cap the monster eats happily and leaves; that problem writes no `attempt` and no `coin` event (a cutoff pays nothing), its box is unchanged, and any pending requeue is dropped. The cap is 90 s of **wall time**, so it runs even while the idle pause has stopped the allowance clock (D40).
4. **Tip:** the +5 tip is paid when the allowance closes the café mid-service (steps 1–3). A voluntary exit (Close the café, Take a break) pays no tip. A service that finishes all its orders pays it as usual.
5. Results ("Closing time!") plays as usual (tally), then the café **locks**: `state='locked'` is persisted immediately and the `resume` snapshot is cleared. This also applies after a wind-down that ends with a little allowance left (less than one order is not enough to play; Start new session or Add time reopens).
6. **Locked screen:** the closed café ("Closed — ask a grown-up to open it!") with sleepy monsters. No Open, Menu or Shop. The gear still works. Relaunching or reloading lands on the same locked screen. No "Continue dinner service?" offer while locked or after an unlock (D40).
7. A parent unlocks through the gate: **Start new session** (full allowance) or **Add time** (5 / 10 / 15 / 20 minutes on top of what remains; also works before it runs out). Either sets `state='open'`. These buttons exist only while a limit is enabled.
8. While `open` with time left, everything works normally; the allowance and the service are independent unless step 1 or 2 shortens a service.
9. **60 s cue (D33):** when 60 s remain, a gentle non-numeric cue plays once: the café lights dim and Pip yawns. The door sign never animates. No countdown is ever shown.
10. **Running out outside a service (D40).** On Home, the Menu or the Shop the café locks at once (an open Shop purchase confirm is cancelled; no coins are spent). On Results the tally finishes first.
11. **Boot check (D40).** On boot, if a limit is on and `remainingMs ≤ 0` (e.g. the app was killed during the wind-down or grace), the café locks and the `resume` snapshot is cleared.

### 6.3 Optional automatic refill
Setting "Refill" (shown only while a limit is enabled): **Parent only (default)** / after 1 hour / after 3 hours / next morning (4 a.m.). The automatic modes refill only a *locked* café, using wall-clock time since the lock began (the one place the wall clock is used).

### 6.4 Honest limits
- Per device: another device has its own allowance (merge never merges allowances).
- Clearing site data, deleting the home-screen app, or private browsing resets it. Not a security feature; for a hard guarantee pair it with Guided Access (iOS) or Screen Pinning (Android).
- The parent gate uses multiplication (6–9 × 7–9), which a young child cannot do; a determined older child could.
- The auto-refill modes use the wall clock, so setting the device clock forward can refill a locked café early; "Parent only" is unaffected (D47).

### 6.5 Tests
Default Off: a fresh install never accumulates time, locks, or cues; choosing a duration starts a full session; Off while locked unlocks. With a limit on, using a fake monotonic clock (and a fake wall clock for the grace cap and refill), every rule in §6.1–§6.3 has a test.

---

## 7. Art

### 7.1 Foods (D10, D35)
Emoji at first via `<Food id>`; each id also has an optional SVG sprite path so art can be swapped without touching game code. **Allowlist, Unicode ≤ 9.0 (Emoji ≤ 3.0), each 1 codepoint or a simple VS16 sequence:**
🍪 cookie (6.0), 🍩 doughnut (6.0), 🍕 pizza (6.0), 🍔 burger (6.0), 🌭 hot dog (8.0), 🥐 croissant (9.0), 🍞 bread (6.0), 🍰 cake slice (6.0), 🍓 strawberry (6.0), 🍎 apple (6.0), 🍌 banana (6.0), 🍊 tangerine (6.0), 🍙 rice ball (6.0), 🍦 soft ice cream (6.0), 🥕 carrot (9.0), 🌮 taco (8.0).
Every food must read as **one obvious unit** to a counting child. Not allowed: 🍒 (two cherries), 🥞 (a stack), 🧁 (11.0), 🥪 (10.0), 🥧 (10.0), anything newer. `lint:content` fails on any non-allowlisted codepoint in `src/`, scanning against `scripts/emoji-versions.json`.
- Each `FoodId` carries `{glyph, singular, plural}` for spoken lines and captions; below Android 8 / iOS 12 the glyph falls back to the plural name in a rounded tile.
- One food type per order. Each monster has two favorites.
- Emoji are absolutely positioned HTML elements (never SVG `<text>`) with `font-family: "Apple Color Emoji","Noto Color Emoji","Segoe UI Emoji"` and a fixed `font-size` per cell size; no clipping at 44 px cells.

### 7.2 Monsters (hand-authored SVG)
Tier 1 (M2) ships **six hand-authored SVG monsters, each with five expression variants** (D36). `MonsterSpec` (JSON, versioned) stays the data shape so the art can later be swapped or generated; in Tier 1 its `body`/`eyes`/`mouth`/`extras` fields describe the look and feed validation, while `<Monster spec expression />` renders the hand-authored asset for `spec.id`. Until M2 one placeholder monster serves every order (D66).
```ts
interface MonsterSpec { id; name; body:'blob'|'tall'|'round'|'square'|'jelly'|'fluffy';
  palette:{ body:string; belly:string; accent:string };      // contrast >= 3:1 vs eyes/mouth
  eyes:{ count:1|2|3; kind:'round'|'stalk'|'sleepy' }; mouth:'smile'|'wide'|'toothy'|'tiny';
  extras:('horns'|'antennae'|'ears'|'spikes'|'drips'|'tail')[]; voice:{ pitch:number; rate:number };
  personality:string; favorites:[FoodId,FoodId]; reactions:ReactionId[]; lines:{ arrive:string[]; thanks:string[] } }
```
- Expressions: `idle` (bob + blink), `delight`, `eat` (mouth open, 3 chews), `puzzled` (head tilt), `sleepy` (closed-café art). CSS-transform-driven; reduced motion swaps to static poses.
- Roster (6 + 2 surprise guests after the 5th and 15th completed service; names are placeholders through M2, renaming comes with M7):
  1. **Blobbo** — green, one eye, shy giggler, 🍰 / 🍓. Reaction: melts happily.
  2. **Gruffles** — purple, horns, deep "Mmm!", 🍔 / 🌭. Reaction: ground-shaking stomp then purr.
  3. **Zibbit** — orange, tall, three eyes, speedy, 🍪 / 🍩. Reaction: spins like a top.
  4. **Mimsy** — pink, fluffy, tiny and polite, 🍞 / 🍊. Reaction: floats up with hearts.
  5. **Chompers** — blue, big teeth, messy, 🍕 / 🍙. Reaction: burp bubble.
  6. **Wobbleton** — yellow jelly, 🍦 / 🍌. Reaction: wobbles into a puddle and reforms.
  7. *(guest)* **Spindle** — teal, spiky, dramatic, 🥐 / 🍎. Reaction: fake-faints.
  8. *(guest)* **Drizzle** — lavender, dripping, 🌮 / 🥕. Reaction: rains tiny sparkles.
- `lint:content` validates every spec: palette contrast, allowed extras, favorites in the allowlist, unique ids, reaction ids exist, all five expressions present.

### 7.3 Pip and staff
Pip, a mouse in a chef hat, is the guide and **the one who helps (D90)**: the Help button (Pip's hat), the help-offer button, the helper on the counter and the tutorial pointer are one character. While help is offered or given (OfferHelp, CountTogether, Worked, FollowMe) Pip pops up on the counter left of the monster and bobs while talking; every help line (CountTogether, demo and FollowMe lines) comes from Pip, in Pip's own caption bubble with its tail pointing down at Pip and the same voice at pitch 1.5. The monster keeps the order, PlateCount, the help question, "Yum!", its reactions and the closing line. When help ends Pip sinks back behind the counter over 0.5 s (`PIP_EXIT_MS`), and the monster's moves between its spot and the aside spots take 0.55 s (`MONSTER_MOVE_MS`; D91, D93). Pip is a placeholder drawing until the hand-authored art in M2. Other animal staff are shop items (§10) that idle in the café and react to events (clap, bounce); staff do not speak.

### 7.4 Café background
Layered SVG scene: wall, floor, window, lights, counter, counter-top slot, wall art slot, staff spots. Shop item = `{slot, svg component, price}`. The **Service screen uses the same decorated café**, so purchases show while the child plays (D37). Missing art falls back to a labeled placeholder shape.

---

## 8. Audio

### 8.1 Rules
- **Unlock and recovery (D86, D87, D88):** every `pointerdown` checks the `AudioContext`. A suspended one is resumed. One that is interrupted, closed, or "running" with a clock frozen for 600 ms is closed and replaced inside that tap (plus one silent sample, which older iOS needs to unlock output) — but never while `speechSynthesis.speaking` is true, since a new context takes the audio session from the speech engine; a `speaking` flag stuck true for more than 9 s is ignored. A sound effect asked for while the context is not running resumes it and plays once it is running, within 250 ms, instead of being skipped (iOS pauses WebAudio while speech plays).
- Set `navigator.audioSession.type='playback'` when available so the iPhone silent switch does not mute WebAudio; document the silent switch in the parent Help.
- **Never block game flow on speech.** `speak()` resolves on `end` **or** after a fallback timeout of `clamp(1200, 400 + 90 ms × chars / rate, 8000)` (`rate` default 0.85; iOS sometimes never fires `onend`, and its start-up latency means a shorter timeout clips lines; tune on the iPad, D37); "busy" ends when a line really ends (`end`/`error`), the timeout is only the fallback (D75). A line (not a count) that has not fired `start` 1.5 s after `speak()` is cancelled and spoken once more with a fresh timeout (lines whose fallback is under 1.5 s, like "Yum!", are already settled and not retried), and a paused engine is resumed before each line (D88).
- Captions always show (the monster's caption bubble or Pip's, §5.4, §7.3); with no voices the game is fully playable.

### 8.2 Speech
- `speech.ts` exposes `speak(key, params, {interrupt})`. `phrases.ts` maps keys to template functions that output **words only** (via `numberToWords`, 0–100 + hundreds edge, unit-tested). Never pass digits, `+`, `−`, `=`, or `?` to TTS.
- Commas are dropped from the text sent to the engine (engines pause on them as on a full stop); captions keep them; ellipses stay as wanted pauses (D77).
- Voice selection: prefer `localService` voices with `lang` `en-US`, then `en-*`; prefer names matching /Samantha|Ava|Allison|Google US English|Samsung/ in that order; the parent can pick any installed English voice and a rate 0.7–1.1 (default 0.85) with a Test button. Voice is stored per device; on Android, when offline, only `localService` voices are used and captions carry the rest. Voices load async: handle `voiceschanged`, retry `getVoices()` at 0/250/1000/3000 ms.
- Call `speechSynthesis.cancel()` before each non-queued utterance (iOS quirk). `interrupt:false` queues. Counts while building follow §3.3 (D75).
- Monster and Pip voices differ only by `pitch`/`rate` (Pip: pitch 1.5).
- **Recorded audio later (M10):** `resolveAudio(key)` looks up `public/audio/manifest.json` (`key → file`); missing → TTS. Phrase keys are stable (`num.14`, `op.plus`, `line.blobbo.thanks.2`). `scripts/audio-todo.ts` prints keys without recordings (target set: ~21 numbers 0–20, 8 tens 30–100, ~35 operator/prompt phrases, ~50 monster lines).

### 8.3 SFX (WebAudio synthesis, `sfx.ts`, no audio files)
Tones start 30 ms ahead of the audio clock (D87). Place/remove tones play only where nothing is counted aloud (S2, S1, the S0 digit pad; never at S3 or in Pip's demo, D91); the other effects are unchanged.

| SFX | Spec |
|---|---|
| place(n) | short sine "pop", 0.16 s, pitch walks a pentatonic ladder by running count (n mod 10), resets every 10 |
| remove | soft downward glide, 0.16 s |
| bell | two-partial triangle ding, 1.2 s tail |
| correct | rising 4-note arpeggio |
| munch | band-passed noise bursts ×3 |
| burp | low saw glide down, short |
| hm | two-note descending soft sine (never a buzzer) |
| wobble | short wobble for a disabled bell, full bin or locked item (unchanged by D91) |
| coin | two-tone sine "ting" |
| buy | coin ×3 + rising chime |
| arrive | rubber "boing" (sine with pitch envelope) |

Master, SFX and voice volume; defaults 0.8 / 0.7 / 1.0. No background music in v1.

---

## 9. Economy
All numbers live in `engine/economy.ts`.
- **Coins (D6, D31, D40):** +3 per completed problem (flat, regardless of correctness, speed, or hints), each a `coin` event written when the problem completes; requeued problems and the warm-up order pay 3 too; a problem cut off at the play-time grace cap is not completed and pays nothing. +5 service tip on completion, or when the allowance closes the café mid-service; not on a voluntary exit. A 6-monster service pays **23**; with the maximum 2 requeues, **29**.
- Coins only go down through a confirmed shop purchase; swapping is free, so no refunds. A parent's Reset or Replace import may lower the balance; that is an explicit parent action, not play (D44).
- No streaks, daily rewards, expiring items, ads, loot boxes, timers on rewards, or external links.
- Coin display: jar with count; counts spoken in Results only.

## 10. Café shop
Seven slots; every slot has a free default. Tapping an item previews it live in the café; a **Buy** button (160 px) then a confirm with big *Yes!* / *Not yet*. Owned items re-equip free any time. Everything is available from day one.

| Slot | Items (price) |
|---|---|
| Wallpaper | Sunny Yellow (free), Polka Dots 20, Mint Stripes 20, Brick 30, Starry Night 40, Rainbow 60 |
| Floor | Checkerboard (free), Wood 25, Pink Tiles 25, Cloud Carpet 45 |
| Lights | None (free), String Lights 20, Paper Lanterns 30, Disco Ball 60, Star Chandelier 90 |
| Window | Street (free), Garden 25, Moonlit 35, Snowy 35 |
| Counter-top | Bell (free), Flower Vase 15, Cake Stand 25, Cookie Jar 30, Fish Bowl 35, Tiny Robot 50 |
| Wall art | Menu Board (free), Neon OPEN 30, Giant Clock 35, Monster Portraits 40, Trophy Shelf 60 |
| Staff & pets | Pip (free), Bunny Barista 60, Cat Waiter 80, Bear Busker 100, Owl Cashier 100, Fox Baker 120 |

Total **1,340 coins** ≈ 58 services at 23 coins. First purchases (15–25 coins) are reachable in the first service. Equipped items persist per slot; staff can be multiple (up to 3 visible).

---

## 11. Persistence and multi-device

### 11.1 Why event-sourced (D15)
The child may play on an iPad, an iPhone and an Android phone, with no backend. So everything that counts as progress is an **append-only event log** with unique ids; derived state (fact boxes, wallet, history, per-skill settings) is a pure function of the log. Backup = export the log. Syncing devices = **merge** logs (union by id) and replay. Settings stay per device.

### 11.2 Events
```ts
type Evt = { id: string; t: number; dev: string; v: number } & (   // id = crypto.randomUUID() (fallback: 128 random bits); t = epoch ms
 | { k:'attempt'; svc:string; fact:string; skill:SkillId; stage:Stage; outcome:'first'|'afterHint'|'fixed'|'assisted'; ms:number }   // outcomes: §3.4
 | { k:'coin'; svc:string; n:number }   // one per completed problem, incl. warm-up and requeues (D31)
 | { k:'serviceEnd'; svc:string; skill:SkillId; seed:number; orders:number; served:number; tip:number; activeMs:number; partial:boolean }   // tip 0 or 5; partial = ended before all orders were served (D39)
 | { k:'buy'; item:string; price:number }
 | { k:'equip'; slot:string; items:string[] }
 | { k:'skillConfig'; skill:SkillId; stage:Stage; ops:'both'|'add'|'sub' }   // per-skill parent settings (D23, D24)
 | { k:'known'; facts:string[] }   // starting-point toggles
 | { k:'focus'; list:string[] } )  // focus list
```
Rules:
- `engine/replay.ts`: `replay(events, initial) → Derived` sorts by `(t, id)`. `applyEvent` is the incremental form and MUST equal a full replay (property test).
- **Event shapes are frozen from M1 (D36):** `attempt` (four outcomes) and `coin`; M2 keeps coins in memory and M3a starts writing them (D51).
- **Coins (D31, D39):** `earned = Σ coin.n (distinct event id) + Σ over distinct svc of the largest serviceEnd.tip`. A resumed service (two `serviceEnd` rows for one `svc`) loses nothing, and an app killed mid-service keeps every coin the child saw fly into the jar. Amounts live in the events and are never recomputed, so a merge cannot reduce earned coins. `spent = Σ price over distinct purchased items` (the same item bought on two devices is charged once). `balance = max(0, earned − spent)`. Owned items = union of `buy` events.
- Fact boxes are derived and may shift after a merge (adaptation, not reward). Stage and operations are explicit `skillConfig` events, so a merge does not shift them.
- `equip`, `known`, `focus`, and `skillConfig` (per skill): latest `t` wins.
- `factKey` is a persisted identifier (§3.1): changing it needs a migration.
- Initial state before any events = the starting-state preset (§4.2), applied implicitly and never as events, so two fresh devices do not double-seed.

### 11.3 Stores
IndexedDB database `ncmc-v1` (§11.5). Stores: `meta` (schemaVersion, deviceId = random UUID, deviceLabel, createdAt, lastBackupAt, one-time flags) · `events` (keyPath `id`, index `t`) · `state` (derived cache with `throughEventCount`; rebuilt on boot when absent or inconsistent) · `settings` (**per device**: voice, volumes, reduced motion, orders per service, play time and refill mode, hidden skills, child name) · `clock` (per device, §6) · `resume` (in-progress service snapshot) · `snapshots` (Tier 1: one, the latest full export, written before migration, import, replace or reset; rotation to the last 3 later, D36). Store rows carry a `profileId='default'` column (D9); it joins the event shape and export only in M11, with a migration (D47).
- Never `await` a non-IDB promise inside an IDB transaction (Safari auto-commits). One transaction per completed problem appends its events (`attempt`, if any, and `coin`) and updates `resume`. The in-memory derived state is the read source.
- `Storage` interface with `IdbStorage` and `MemoryStorage`; if IDB fails to open, run in memory and show a parent-only banner.
- `schemaVersion` with ordered `migrations[]` (event upcasters). Tier 1 ships `schemaVersion: 1` with an **empty migration list and its test harness** (D36); from the first schema change on, each change bumps the version and adds a migration with a fixture test. Unknown future versions refuse import with a clear message.
- `navigator.storage.persist()` after the first tap and on parent-area open; `persisted` and `estimate()` shown there. Both are feature-detected (missing on Safari before 17); when missing the parent area says "not available on this device" (D44).

### 11.4 Eviction reality (document in parent Help)
Safari tabs can have script-writable storage evicted after 7 days of non-use; **installed Home Screen apps are exempt** (D14). The app therefore (a) shows "Install to Home Screen" how-tos for iOS and Android in the parent area, (b) shows "last backup N days ago" with Back up now, (c) keeps the latest auto snapshot, (d) says "install to the Home Screen before the first play": on iOS a Home Screen app and a Safari tab keep separate storage. Documentation only (README, PLAYTEST, parent Help); no detection code (D37).

### 11.5 GitHub Pages same-origin hygiene (D18)
`<user>.github.io` is **one origin shared by every Pages project in the account**. Therefore:
- Every persistent name carries the prefix `ncmc`: IndexedDB database, Workbox `cacheId`, any `localStorage` key, `BroadcastChannel`.
- Reset deletes only `ncmc*` data. Never call `localStorage.clear()`, never enumerate-and-delete databases or caches without the `ncmc` filter. ESLint `no-restricted-properties` blocks `localStorage.clear`, and a unit test greps `src/` for `caches.delete` / `indexedDB.deleteDatabase` call sites and asserts the prefix.
- The service worker scope is the project path, so it cannot control sibling apps.

### 11.6 Export, import, merge, reset, resume
- **Export JSON:** `{ app:'number-chef-monster-cafe', schemaVersion, deviceId, deviceLabel, exportedAt, events, settings, checksum }`; `checksum` = hex SHA-256 (SubtleCrypto) of the serialized `events` and `settings` (D37, D39). Shared through the Web Share API with a file when `navigator.canShare({ files })` allows it; otherwise a `text/plain` share with a `.json` name, or a download link (Android Chrome shares only an allowlisted set of file types). Runs inside a button tap. Import file inputs use a permissive `accept` (a narrow one greys out the file in the iOS Files picker).
- **Import — Merge (default, M7):** union by event id; dry-run summary ("adds 42 events from 'iPad', Nov 3–Nov 9; coins 118 → 161"); idempotent; checkbox "also copy settings from this file". **Replace (M3b, D44):** wipes local events and settings, needs a second multiplication prompt, always snapshots first. Validate with zod; reject a checksum mismatch unless confirmed twice.
- **Reset (D44):** writes a snapshot, then deletes everything except the `snapshots` store (only `ncmc*` names). Because merging is union by id, a later merge from an older export or another device can bring reset progress back; the parent Help says so.
- Keeping two devices aligned: export from A, merge into B, export from B, merge into A. The Data tab explains this in three lines.
- **Service resume (D43):** after each completed problem write `resume` = `{svc, seed, config, plan, index, requeues, results, activeMs}`, where `plan` is the planned order list (factKeys, foods, monsters, requeue state), so a resumed service continues exactly what the child was playing. On boot, **offer** "Continue dinner service?" if the snapshot is < 2 h old (§5.8). The play-time lock clears it (D40). Per device only.

---

## 12. Parent area
**Gate:** tap the Home gear, hold the popup's circle 2 s (D95), then a multiplication question with factors 6–9 × 7–9 (answer by number pad, never spoken). 3 wrong → 30 s lockout. Auto-locks after 5 minutes idle or on leaving. Not reachable during a service.

Tier 1 builds it in steps (D36, D44): before M3a the gear (tap, then a 2 s hold on the popup's circle, no gate) and `?debug` both open the playtest tools with the stage/operations picker and sound test (D94, D95); **M3a** adds a minimal Skills list (stage and operations per skill, opened by the gear without a gate) and a simple progress list; **M3b** adds the gate and the rest of the minimal area: play-time limit (off by default) with Start new session / Add time, voice/speed/volume, reduced motion, Export, Replace-only import, Reset. The full tab set lands in M7.

Tabs (normal scrolling layout; works in portrait):
1. **Progress** — per-skill stage and services played; fact heatmap (addition/subtraction grids 0–10 colored by box for A1–A4; A5 and up show a per-skill fact list colored by box, D47); "trouble spots" (box 0 after ≥ 3 sightings); **median S0 response time per skill** (from `attempt.ms`; the best sign that a fact moved from counting to recall); last 20 services (date, skill, first-try %, assisted count, minutes); active minutes per day (last 14).
2. **Skills** — hide/show tiles; **stage** (S3–S0) and **operations** (both / addition only / subtraction only; A1–A6, B1, B2) per skill (D23, D24, D43); "reset this skill"; **Starting point**: "already knows" toggles (+1, doubles; no +0 toggle, D11).
3. **Settings** — orders per service (4/6/8); **play-time limit** (Off by default; 5/10/15/20) and, only when on, refill mode with **Start new session** and **Add time** at the top (§6, D27); voice, speed, test; master/SFX/voice volume; reduced motion; child's name (optional, greeting only; phrases degrade if unset); big-text captions (M10); rename monsters (M7) (D47).
4. **Focus list** — up to 30 specific facts or skill ranges (e.g. "8+5", "all 9+x") that mix at 25% weight into services of the skill each fact belongs to. Validated against the generators.
5. **Data** — device label, Export, Import (Merge / Replace, §11.6) with the three-line sync explanation, Back up now, snapshots list (restore), storage persisted/usage, Reset progress (keeps shop), Reset everything (second multiplication prompt; both snapshot first, §11.6), app version/build date, install help (§11.4).

No external links anywhere. "About" is plain text.

---

## 13. Quality gates

### 13.1 Scripts (cross-platform Node; owner is on Windows)
`npm run dev | build | preview | typecheck | lint | test | test:e2e | lint:content | content:table | check`, where `check` = typecheck + lint + test + lint:content.

### 13.2 Content lint (`scripts/lint-content.ts`; fails `check`)
- Every pool problem: recompute the answer with an *independent* evaluator (parse `display` tokens and solve) and compare to `answer`.
- Constraint checks per skill (no crossing/regrouping where promised; bridging really crosses; ranges).
- `spoken` has no digits or symbols, ends with `?`, `.` or `!`, and is ≤ 12 words (both unwrapped and wrapped with each food, §4).
- Unique `factKey`s; pools non-empty; sizes match the §4 table (a drift fails with the new number printed).
- `toTrayTask`/`check` agree with `answer` at all four stages for every pool item.
- Emoji allowlist/version scan of `src/` (§7.1); monster-spec validation (§7.2).
- Every child-facing caption ≤ 8 words; ticket lines ≤ 12 (D70). No easy-reader word list exists; child-facing text stays minimal by convention (D36).

### 13.3 Content review table
`npm run content:table` writes `docs/CONTENT_REVIEW.md`: per skill pool size, 12 deterministic sample problems (ticket tokens, spoken line, tray start/expected at S3 and S1), and each demo's step list. The owner skims it at M2 and M5.

### 13.4 Unit/property tests (Vitest)
Every engine rule in §3, §4, §6, §9 and §11 has a unit test; these MUST exist:
- Generators: 1,000 seeds × every skill, answers valid and ranges respected. `numberToWords` 0–100 exhaustive against a hand-typed table.
- Session builder: determinism from seed and starting state; the §4.1 repeat, balance, new-fact, requeue (position, support, append), length and pool-size rules; resume continues the stored `plan`.
- Fact boxes per outcome and stage (§4.2); operation filter; `skillConfig` last-writer-wins.
- Attempt flow: every §3.4 path (first miss → retry, second → offer, third → demo, "no" then a miss → demo, Help before and after a miss, Peek) and its outcome; PlateCount lines.
- Tray model: every §3.3 rule, and the `check` truth table.
- Event log: `applyEvent` ≡ full `replay`; merge commutative and idempotent, never lowers earned coins or removes owned items; duplicates count once; a resumed or killed service loses no coins; clock skew does not crash replay.
- Storage: migration harness, export→import round trip, checksum, corrupt input rejected, snapshot before import/replace/reset, namespace test (§11.5). Economy sums. Play allowance: §6.5. `toStageCoords` in both orientations with safe-area remap. `engine/` import-purity lint.

### 13.5 E2E (Playwright)
- Projects (full matrix from M2; M1 runs tap in landscape on Chromium plus one WebKit iPad project, with the M0 portrait tap test green throughout, D36, D44): Chromium iPad Pro 11 landscape (1194×834) and Pixel 7 landscape (915×412); WebKit iPad gen 7 landscape (1080×810) and iPhone 13 landscape (844×390); portrait variants (iPad 834×1194, iPhone 390×844) for the rotated stage. `hasTouch: true`. The e2e environment installs **Noto Color Emoji**; emoji appearance is judged only on real devices (D37).
- Playwright has **no touch drag API**: taps use `page.touchscreen.tap`; drag tests dispatch CDP `Input.dispatchTouchEvent` in Chromium only (in rotated portrait from M2). Everything also works by tapping, so most flows test by tap.
- `VITE_E2E=1` builds expose `window.__ncmc` (seed, time scale, fake clock, skill config, state dump); production builds contain no `__ncmc` (test).
- Flows: first run → one full service per track; skill pick → service → Another service repeats the skill → Change dish returns to the menu; parent stage/operations changes reach the next service; wrong → wrong → offer → yes → demo → follow-me (bell pulses, child presses it) → requeue (same monster returns); offer → no → wrong → demo; Help then a wrong serve goes straight to Worked; S0 number pad; tap an item to send it back (both modes); remove-from-end; taken-away row; shop buy/equip persists across reload; parent gate lockout; allowance runs out → wind-down → locked Home → survives reload → parent unlock → no resume offer (D40); export → reset → import; two-context merge; rotated portrait renders and taps/drags land; back gesture shows the break dialog; offline reload; zero external requests; no scroll/zoom on double-tap; tap-target sizes at 844×390.
- Screenshots at each milestone into `docs/screens/M<n>/`, as built so far: Splash, Home, Menu (both pages), Service at S3/S1/S0 for a frame task, a bridging task mid-demo, a B-track task, Results, Shop, Parent progress, at 1194×834 and 844×390.

### 13.6 PLAYTEST.md (only the owner can judge)
`docs/PLAYTEST.md` keeps the standing checklist (ticket understood unaided, tap vs. drag, bell discoverable, voice lines, requeue/FollowMe pace, tap comfort, unhandled touches, emoji read as one unit, Home Screen install, smoothness, freezes after backgrounding/rotation, silent switch) and a checklist with blank notes per milestone. Anything that needs a real device goes there, never into a claim that it works.

---

## 14. Milestones
Each milestone starts by fixing what the previous playtest found and ends: `npm run check` green, e2e green, screenshots saved, `PLAYTEST.md` updated, **STOP and wait for the owner's playtest feedback**. Hours are indicative; `PLAN.md` holds the authoritative estimate (D36).

### Tier 1 — Playable (guide ≈ 10 h, not a cap, D20, D44): M0, M1, M2, M3a, M3b
Playtest builds reach the devices when the owner pushes to `main` (the real app, §15). Before the child's real use begins, the parent resets playtest progress once (D44). At the end of M3b the child plays A1–A3 with monsters and sound, progress is saved, and if a parent turns on the optional limit the café locks when time is up until a parent unlocks it.

#### M0 — Foundations (≈ 2 h)
Vite/TS/React scaffold, strict TS, ESLint/Prettier, Vitest, Playwright projects, PWA manifest + service worker (`prompt`, `cacheId: 'ncmc'`), Andika, stage scaling, **rotated-stage portrait with `toStageCoords`**, touch hardening incl. back guard, `Storage` interface + memory + IDB skeleton (incl. `meta`), GitHub Actions Pages workflow, test-hook build flag, namespacing lint, production-only CSP with `assetsInlineLimit: 0`. The Git repo already exists.
**Accept:** `check` green; offline reload; no zoom/scroll/long-press menu; in portrait a tap on a rotated control hits the right target and rotating back loses no state; back gesture shows the break dialog; zero external requests; version on the `?debug` screen; ESLint blocks `localStorage.clear`.
**Owner checks:** the Pages URL installs to the Home Screen and launches standalone (D37). **Owner action:** set Pages source to "GitHub Actions".

#### M1 — Core loop vertical slice (≈ 3.5 h)
Started with a static layout mock that the owner approved before any interaction was built (D36; shots in `docs/screens/M1/mock/`, geometry now in `SERVICE`, §5.4). Pure engine: `numberToWords`, rng, A1–A2 generators, `toTrayTask`/`check`, attempt flow; tray + ten-frame UI with tap and drag; ticket; bell; placeholder monster and foods; PlateCount, OfferHelp, CountTogether, Worked, FollowMe for count-on/count-back/doubles/near-double; placeholder Pip as the helper (D90); stages S3–S0 for A1/A2, including the S0 cloche path (D41); the `?debug` stage/operations picker (D44), also opened from the Home gear's hold-to-open popup (D94, D95); TTS v1. `attempt` and `coin` shapes are frozen here.
M1 runs a stand-in service (D66): 6 orders drawn uniformly from the filtered pool with the no-repeat window and no food twice in a row; one placeholder monster; a correct serve plays a skippable ≈ 1.6 s "Yum! Eight!" instead of the eat sequence; no coins shown; after the last order it returns to the menu board; events stay in memory; the A3 tile shows but is inert.
**Accept:** unit tests for generators/tray/check/demos/attempt flow; all four stages playable for A1 and A2; fill-order, remove-from-end and lock rules verified by e2e (Chromium + one WebKit iPad project); no auto-serve; the D89 miss/help paths complete; speech never blocks the flow (`speechSynthesis` stubbed to never fire `end`); 844×390 tap-target assertions.
**Owner playtest:** ticket comprehension, bell, tap vs. drag, speed at S0 versus flash-card pace, take-away tasks.

#### M2 — Café service (≈ 3.25 h)
Service loop (6 monsters), session builder with requeue and per-fact weighting (§4.1–4.2), first-ever warm-up order (§5.4, D47), **six hand-authored monsters** with five expressions and their reactions (§7.2), eat sequence, all SFX, Home + Menu board (tiles for built skills only), Results with tally and Another service / Change dish, hand-authored Pip art, voice lines, **A3 Perfect Ten** (incl. the taken-away row), the answer filling the ticket's blank in green on a correct serve (D96). Coins show in the jar but stay in memory until M3a (D51).
**Accept:** deterministic service from seed; no adjacent repeats; at most 3 new facts per service; each monster renders at all five expressions; eat+react ≤ 4 s and skippable; reduced-motion variant; 4× CPU-throttle run reported (not a gate); full e2e device matrix incl. CDP drag in rotated portrait; first order reached in ≤ 2 taps after Splash (Open the Café, then a tile); content table generated.
**Owner playtest:** monster appeal, voices on all three devices, the green answer on the ticket (D96), service length (sets `lastCustomerMs`/`minServiceMs`), queue cue, smoothness, emoji foods as one unit.

#### M3a — Persistence and fact boxes (estimate in PLAN.md)
Event log (§11: `attempt`, `coin`, `serviceEnd`, `replay`, stores, migration harness at `schemaVersion: 1`, one snapshot), fact boxes (§4.2), per-skill stage and operations (minimal list via the gear, no gate yet), simple progress list, resume offer.
**Accept:** incremental ≡ full replay; box transitions; coins survive a resume and a killed app; reload mid-service offers resume and continues the stored plan; stage/operations settings change the next service (e2e); migration harness test; storage persisted/estimate shown when available.
**Owner playtest:** progress and coins persist; are the stage/operations knobs right.

#### M3b — Hand-off ready (estimate in PLAN.md)
Optional play-time limit and lock (§6) with wind-down and 60 s cue, parent gate, minimal parent area (§12), Export (checksum, share fallbacks), Replace-only import, Reset (§11.6).
**Accept:** limit off by default; §6.5 when enabled; gate lockout; export → reset → import round trip; checksum verified.
**Owner playtest:** limit on (10 min), hand over the iPad, walk away: does it lock, is the ending gentle, is unlocking easy.

### Tier 2 — Bonus features (no cap; any order)

#### M4 — Economy and shop (≈ 1.75 h)
Coin spending, shop slots/items (placeholder-quality SVG), preview/buy/confirm, equip, staff reactions, guest monsters; `buy`/`equip` events.
**Accept:** economy table sums to 1,340; purchase idempotent and persisted; confirm prevents accidental buys; no code path lowers earned coins; purchases show on the Service screen; the shop counts as play time.

#### M5 — Rest of the Little Menu (≈ 3 h)
A0 and A4–A8 generators + demos, two-frame layouts, difficulty orderings for A4–A6 (D43), A5 whole-frame moves and FollowMe past 10 (D47), tiles live.
**Accept:** pool sizes match §4; all demos end in the expected state for every pool item; bridging fills frame 1 first (e2e); content table reviewed; every skill completes a service at each stage in e2e.

#### M6 — unused (story tickets were declined, D21; numbering kept stable)

#### M7 — Full parent area and multi-device merge (≈ 2.5 h)
Merge import, device label, Focus list, Starting-point editor, hide/show skills, heatmap, trouble spots, history, snapshot restore, renaming monsters.
**Accept:** merge commutative and idempotent; never lowers earned coins or removes an owned item; duplicates count once; two-context e2e; Focus list validated and mixed at 25%.

#### M8 — Big Menu (≈ 2 h)
Starts with a static layout mock of the tens shelf, ones frame and two bins at 1194×834 and 844×390, approved by the owner before interaction (D47). Then B1–B2: ten-packs, auto-bundle, two-digit numpad, demos, difficulty orderings (D43).
**Accept:** pools match; auto-bundle at ten singles; capacity rules; tens/ones demos verified; screenshots.

#### M9 — Stretch skills (≈ 1.5 h)
B3 generators + layout reuse (B4 stays in the backlog, D47).

#### M10 — Polish and hardening (≈ 1.5 h, and after any playtest round)
Accessibility pass (labels, parent-area tab order, contrast), big-text captions (D47), full e2e matrix, bundle-size report (target < 1.5 MB gz), icon generation, README for deploy and restore, recorded-audio manifest support.
**Accept:** `check` + e2e green on all projects; Lighthouse PWA installable; text contrast ≥ 4.5:1; no console errors; bundle report committed.

#### M11 — Profiles (≈ 1.5–2 h)
Profile picker on Splash/Home, `profileId` on events (migration, D47), per-profile wallet, café and known-facts preset (e.g. a younger sibling limited to A0 with 1–5, D9), export/import per profile.

Later ideas, unscheduled: B4 compare (needs a response mechanic), rush-hour mode, monster designer, zero-answer lesson, Mystery Orders (`? − 3 = 5`), regrouping; **garnish choice** after each correct serve (nothing to do with correctness; revisit after the M2 playtest); **monster album** (portraits fill in as monsters are served; after M4).

---

## 15. Deployment (GitHub Pages, D14)
- Project site `https://<user>.github.io/number-chef-monster-cafe/`. On a free plan Pages needs a **public** repo: the code and docs are public, the repo holds no personal data (the child's name lives only in on-device settings), and the docs describe the child generically: no age, sex, school grade or device ownership (D38).
- GitHub Actions (`.github/workflows/deploy.yml`) deploys on push to `main`: checkout → setup-node → `npm ci` → `npm run check` → `npm run build` → upload-pages-artifact → deploy-pages. Pages source = "GitHub Actions" (owner). Claude Code never pushes unless asked.
- Vite `base: './'`; manifest `start_url: './'`, `scope: './'`, `display: standalone`, `orientation: landscape` (iOS ignores it, hence §2.2). **No path-based routing**: screens are in-memory state.
- Pages sends `Cache-Control: max-age=600`, so `index.html` and the service worker can be 10 minutes stale after a deploy. Asset filenames are hashed.
- Updates: `registerType: 'prompt'` (`autoUpdate` would reload under a playing child, D12) with silent activation on cold launch or after 30 s of Home idle (§2, D54); never during a service (e2e: a waiting worker mid-service causes no reload).
- Icons (192, 512, maskable-512, Apple-touch 180) are generated by `scripts/make-icons.ts` from a monster SVG.

---

## 16. Assumptions
Every rule above that the owner did not state directly is a recorded decision (cited `(Dn)`); the owner can veto any of them. US-English voice (chosen per device), emoji foods first, no music, placeholder names for monsters and staff.
