# Number Chef Monsters — Build Spec

Status: design v1.1 (build-ready). Companion files: `CLAUDE.md` (conventions), `docs/DECISIONS.md` (why the design departs from the original proposal), `docs/OPEN_ITEMS.md` (what the owner must supply or decide), `docs/KICKOFF.md` (first prompt).

Normative words: **MUST** = acceptance criteria test it; **SHOULD** = default, may deviate with a DECISIONS.md entry.

---

## 0. Summary

A static, offline-capable web app (PWA) in which a 5-year-old runs a monster café. A monster arrives and places an order written as a number sentence with a blank (`8 + 5 = ?`). She builds the answer on a serving tray (ten-frames for numbers up to 20, ten-packs and singles above that), presses the serve bell, and the monster eats it with a big reaction. A *service* is 6 monsters (parent-adjustable 4/6/8), about 8–10 minutes, ending at a closing sign. She (or a parent) picks the skill to practice from the menu board; later services repeat that skill until a different one is picked (D22).

Audience: one child, age 5½ (Grade 1 first semester), reads easy chapter books, little writing practice, good at dragging. Parent is technical and plays the role of tester and configurator.

Targets: iPad Safari (primary), iPhone Safari, Android Chrome; she will use all three at different times. Landscape layout (portrait shows the rotated stage). Progress is stored per device and merged by exported file (§11). Works offline after first load. No backend, accounts, analytics, ads, external links, or purchases. All data local.

Build budget (D20): a **playable game in ≈ 10 agentic hours (Tier 1: M0–M3)**, then bonus features (Tier 2: M4–M11) in any order with no upper limit.

### Non-goals (v1)
Monster designer, rush-hour mode, regrouping (carry/borrow), multiplication, multi-child profile UI, recorded audio, music, localization, handwriting/tracing.

---

## 1. Pedagogy (the reasoning the rest depends on)

### 1.1 Principles
1. **Concrete → representational → abstract, faded per skill.** Every skill has four *support stages* (§3.2). The parent sets the stage per skill (default S3, D23); she never has to pick a stage.
2. **Strategy, not just recall.** The tray makes strategies visible: counting on, doubles, make-a-ten, bridging through ten, count back, tens-and-ones. Demonstrations (§5.4) model them.
3. **Errors teach, nothing punishes.** No buzzers, no lost coins, no failure screens. A miss triggers a count-together replay, then a worked demonstration, then a follow-me, then the fact is requeued with *more* support.
4. **First-try correctness is the only diagnostic signal.** Hints and demos are free, but flag the attempt as assisted so mastery stays honest.
5. **Short and spaced.** 6 orders per service; requeue of misses; light per-fact weighting so facts she misses come back sooner. The Leitner-style boxes only affect which fact is drawn inside the chosen skill, never how hard the skill is (D22).
6. **One consistent model.** Ten-frame layout never changes: 2 rows × 5, filled left→right, top→bottom, first-five/second-five tinted. Same food type within one order.
7. **Reward effort, not speed or accuracy.** Coins are flat per monster served (§9).
8. **The ladder matches her school year, with room to spare.** She is 5½ and working through the first half of a Grade 1 book: within-10 and within-20 add/subtract (A2–A8) is her actual curriculum this year, and tens and ones (B1–B2) is likely second-semester work. Expect A1–A5 to carry most of the early play (her book is on number sentences with sums under ten right now, i.e. A1–A3), so quality and variety matter most there. A0 is an optional warm-up tile (M5). B3 and beyond are headroom.
9. **Build on what she already owns.** She knows +0, +1 and doubles (1+1 … 9+9) from flash cards. Those are anchor facts: they come up less often than new facts (box 3 start, §4.2), and near-doubles (6+7 = 6+6+1) and 9+x (one from the other) become the first strategies taught for new facts.

### 1.2 The ladder (revised; see DECISIONS.md D1 for what changed and why)

Two tracks, no locks. All tiles are always tappable; she or a parent picks one for the service, and the tile played last glows (D22).

**Little Menu (up to 20)**

| ID | Menu name | Example | Notes |
|---|---|---|---|
| A0 | Count It Out | "Bring 7 cookies" | Warm-up + tutorial for the tray. 1–10, then 11–20 using two frames. No equation. |
| A1 | Little Bites | 3 + 2, 5 − 2 | Within 5. Add and subtract mixed ~55/45 by default; the parent can set addition only or subtraction only (D24). She already knows most A1 addition, so subtraction only is the likely setting. **Highlighted on first run.** |
| A2 | Big Bites | 4 + 5, 9 − 3 | Within 10 (sums 6–10). Near-doubles (3+4 = 3+3+1) built on her known doubles. |
| A3 | Perfect Ten | 7 + ? = 10, 10 − 4 | All pairs to 10. Ten-frame centered. |
| A4 | Missing Munchies | 3 + ? = 8, 7 − ? = 5 | Missing addend and missing subtrahend, within 10. |
| A5 | Ten and More | 10 + 4, 14 = 10 + ? | Teen numbers as ten + ones, and 1n − 10, 1n − n. |
| A6 | Teen Twists | 12 + 5, 17 − 4 | Teens ± ones **without** crossing ten (added; bridges A5 → A7). |
| A7 | Jump the Ten | 8 + 5, 9 + 6 | Bridging ten by addition. Her known doubles (6+6 … 9+9) are the anchors; leads with near-doubles (7+8), then 9+x, then 8+x. |
| A8 | Back Over Ten | 15 − 7, 13 − 6 | Subtracting through ten. |

**Big Menu (tens and ones, up to 100)**

| ID | Menu name | Example | Notes |
|---|---|---|---|
| B1 | Ten Boxes | 30 + 20, 50 − 30, 34 + 10 | Tens only, plus ten more / ten less. Needs only counting by tens; independent of A7/A8. |
| B2 | Tens and Ones | 23 + 4, 27 − 5, 20 + 7 | No regrouping either direction. |
| B3 | Double Boxes (P2) | 23 + 14, 48 − 23 | Two-digit ± two-digit, no regrouping. |
| B4 | More or Less (P2) | 34 vs 29 | Compare; monster wants the bigger/smaller plate. Not a tray task. |
| — | Mystery Orders (P3, backlog) | ? + 3 = 8, ? − 3 = 5 | Start-unknown. Not in v1. |

Priority: **P1** = A0–A8, B1, B2. **P2** = B3, B4 (M9). **P3** = backlog. Tier 1 ships only A1–A3; A0 and A4–A8 are M5, B1–B2 are M8.

### 1.3 Is the ten-frame approach sound?
Yes, with these constraints (all encoded below):
- Ten-frames are right up to 20. Above 20 use **ten-packs** (a box drawn as 2×5 mini-frame = 10) and singles; never 23 loose items.
- Frames alone do not teach strategy. The teaching lives in (a) the fixed fill order that makes "complete the ten first" happen naturally for bridging, (b) the demos, and (c) stage fading.
- Auto-serve is forbidden (she'd add until it dings). Serving is an explicit bell press.
- Tray accepts drops anywhere and places into the next empty cell. No free placement (keeps counting canonical and removes "which cell" errors).
- The first-five / second-five tint is non-negotiable: it supports subitizing 5-anchored quantities.

### 1.4 The response mechanic
The original idea of "tap the food with the right number on it" is a guessable multiple-choice and trains numeral matching, not quantity. Instead:
- **Primary response = build the answer** on the tray (stages S3–S1).
- **Abstract response = numeral entry** on a big number pad (S0).
- Numbers appear *on the foods only as counting cues*: each placed item pops its running count (S3), spoken with a rising tone.

---

## 2. Technical stack and architecture

| Concern | Decision |
|---|---|
| Language/build | TypeScript (strict), Vite, ES2020 target (iOS 14+ / Chrome 90+ baseline). |
| UI | React 18, function components. State via a small reducer + context; no state library. |
| Styling | CSS modules or plain CSS with custom properties. No CSS-in-JS. |
| Animation | CSS transforms/opacity and Web Animations API. No animation library. Animate only transform/opacity. |
| Drag | Custom Pointer Events (no dnd library). |
| Storage | IndexedDB via `idb`; in-memory fallback. |
| Validation | `zod` for import/export and settings. |
| PWA | `vite-plugin-pwa` (Workbox), precache everything, `registerType: 'prompt'`: a new service worker waits and is activated (with reload) only on the Home screen when idle or on cold launch — **never mid-service** (`autoUpdate` would reload the page under her). |
| Font | `@fontsource/andika` (self-hosted, OFL). |
| Tests | Vitest (unit/property), Playwright (e2e; Chromium + WebKit projects). |
| Lint | ESLint + Prettier; custom `lint:content`. |
| Network | No runtime requests except same-origin static assets. A CSP meta enforces `default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; worker-src 'self'` (inline styles are needed for React style props); e2e asserts zero external requests. |

### 2.1 Directory layout
```
/ CLAUDE.md
/ docs/ SPEC.md DECISIONS.md OPEN_ITEMS.md KICKOFF.md PLAN.md PLAYTEST.md CONTENT_REVIEW.md(generated) screens/
/ src/
    engine/      PURE TS. No DOM, no React. rng, problems, generators/, scheduler, mastery, tray model, demos, economy
    game/        tray UI, ten-frame, packs, drag/input, service state machine, numpad
    art/         monsters (SVG parts + specs), foods, shop items, Pip
    audio/       sfx (WebAudio synth), speech (TTS), phrases, manifest
    storage/     idb, schema (zod), migrations, export/import, snapshots
    parent/      gate, progress, settings
    app/         screens (Splash, Home, Menu, Service, Results, Shop), routing, layout/scale
/ tests/unit  /tests/e2e
/ scripts/ lint-content.ts content-table.ts make-icons.ts
/ public/ manifest, icons
```
ESLint MUST forbid `src/engine/**` importing `react`, `react-dom`, or touching `window`/`document`/`indexedDB`.

### 2.2 Stage and scaling
- **Landscape layout; portrait is handled by rotating the stage (D8).** The game is designed only for landscape but is never blocked: if the viewport is taller than wide, the whole stage is CSS-rotated 90° clockwise to fill the screen, so it already looks like landscape and she just turns the device counter-clockwise to hold it upright. When the device actually rotates, the transform is dropped with no state change. This works under iOS rotation lock (the rotated stage is upright once the device is physically turned that way) and on iOS, where no API can force orientation. Installed Android PWAs are locked to landscape by the manifest, so portrait never occurs there.
  - Implementation: portrait ⇔ `visualViewport.height > visualViewport.width`; container sized `H × W`, `transform-origin: top left; transform: translateX(W) rotate(90deg)`; safe-area insets remapped (stage top = screen right, stage left = screen top, stage bottom = screen left, stage right = screen bottom).
  - **All pointer math goes through one pure `toStageCoords(clientX, clientY, stageTransform)`** that inverts the current transform; no other code reads raw `clientX/Y`. Unit-tested for both orientations.
  - For the first 6 s in rotated mode a silent animated cue (curved arrow) shows which way to turn.
  - The parent gate and parent area are full-screen and not rotated (they contain text entry); the hidden gear on Home opens them in the device's natural orientation. `?rotate=off` disables rotation for desktop debugging.
- Logical **safe box 1280×720**; all interactive content lives inside it. Scale = `min(vw/1280, vh/720)`, centered; background art bleeds beyond the safe box to fill 4:3 (iPad) and ~2.2:1 (phones).
- Use `100dvh`, `viewport-fit=cover`, and `env(safe-area-inset-*)` for notches.
- Minimum tap sizes at **844×390** viewport (iPhone landscape standalone): tray cells ≥ 44 CSS px, buttons ≥ 56 CSS px. Logical sizes: tray cell 88, gap 8, buttons ≥ 112. (88 × 0.54 ≈ 47.5 CSS px.)
- Safari-in-browser iPhone landscape has less height (~340); documented as "install to Home Screen for phones".

### 2.3 Touch hardening (MUST)
- `<meta viewport ... user-scalable=no, maximum-scale=1, viewport-fit=cover>`; also `touch-action: none` on the play surface and `manipulation` elsewhere; prevent `gesturestart/gesturechange/gestureend` (iOS ignores `user-scalable`).
- Root: `position: fixed; inset: 0; overflow: hidden; overscroll-behavior: none`; `user-select: none`; `-webkit-touch-callout: none`; `-webkit-tap-highlight-color: transparent`; `contextmenu` event `preventDefault` (outside parent text fields).
- Non-passive `touchmove` listener on the root that `preventDefault`s (except inside parent-area scroll containers and inputs).
- Dragging: `setPointerCapture`; one active pointer at a time; extra `pointerdown`s ignored while a drag or an animation lock is active; `pointercancel` returns the item; ignore touches with `width` or `height` > 80 px (palm; best-effort — iOS Safari reports no contact geometry, so the single-pointer rule is the real defense).
- Tap vs drag: movement threshold 10 CSS px; a tap on the bin places an item (animated flight to the next empty cell).
- Buttons use `pointerup` with `pointerdown` inside the same element (no ghost clicks); Serve has a 400 ms re-press guard.
- `prefers-reduced-motion` honored, plus a parent toggle (§12): flights become 150 ms fades, no wobble, shake, or confetti.
- `visibilitychange`: pause TTS and the service clock; on return resume the same state. If the page was reloaded, resume the service from its `resume` snapshot (§11.6).
- **Back guard:** on Home/Menu/Service push a history entry and handle `popstate` by showing the "Take a break?" dialog (Android back gesture, iOS Safari edge-swipe) instead of leaving. Never trap the user inside the parent area.
- `text-size-adjust: 100%` (Android Chrome autosizing); `overscroll-behavior: none` also disables pull-to-refresh.

### 2.4 Performance
Target: iPad 6th gen / iPhone 8-class. ≤ 300 SVG nodes on screen; confetti ≤ 30 particles; no CSS `filter`/`backdrop-filter`/large shadows on animated nodes; 4× CPU-throttled e2e smoke test must hold ≥ 30 fps during the eat animation (measure with `requestAnimationFrame` deltas).

---

## 3. Core model

### 3.1 Types (authoritative shape; names may be refined, semantics may not)
```ts
type SkillId = 'A0'|'A1'|'A2'|'A3'|'A4'|'A5'|'A6'|'A7'|'A8'|'B1'|'B2'|'B3'|'B4';
type Stage = 3 | 2 | 1 | 0;                 // support stage, §3.2
type Unknown = 'result' | 'addend2' | 'addend1' | 'subtrahend' | 'count';

interface Problem {
  factKey: string;          // canonical, stable: e.g. "A2:+:3,5"  "A8:-:15,7"  "A4:?sub:7,5"
  skill: SkillId;
  form: string;             // generator-specific, e.g. 'add','sub','missingAddend','teenCompose'
  operands: number[];       // as displayed, left to right, with `null` for the blank
  display: (number|'?'|'+'|'−'|'=')[];  // tokens rendered on the ticket
  answer: number;           // the value of the unknown
  spoken: string;           // number words only, no digits/symbols, e.g. "Eight plus five equals what?"
  strategy: StrategyTag;    // 'countOn'|'doubles'|'nearDouble'|'makeTen'|'bridge'|'backThroughTen'|'tens'|'tensOnes'|'compare'|'count'
  difficulty: 1|2|3|4|5;
}

interface TrayTask {         // derived from Problem + Stage, pure function
  layout: 'frames1'|'frames2'|'tensOnes';
  prefill: { frameCells?: number; tens?: number; ones?: number; locked: boolean };
  mode: 'add' | 'remove';    // direction she acts in
  expected: { cells?: number; tens?: number; ones?: number };  // tray value that is correct
  entry?: 'numpad1'|'numpad2';                                 // S0 only
}
```
`toTrayTask(problem, stage)` and `check(trayTask, trayState)` are pure and unit-tested for every pool item at every stage.

### 3.2 Support stages (per skill)

The stage is a per-skill setting chosen by the parent (default S3, D23), stored as a `skillConfig` event and applied from the next service.
| Stage | Name | What she sees/does | Tray starts | Voice counting |
|---|---|---|---|---|
| S3 | Guided | Frames/packs visible; prefilled groups color-coded to the ticket; running counts pop on items; Pip's hat pulses after 10 s idle | Operand(s) prefilled & locked (add) or full minuend (sub) | Yes (counting on / counting back) |
| S2 | Build | Same as S3 without pops, voice counting, or pulsing | Same | No (tones only) |
| S1 | Build the answer | Empty frame(s) (outline only) holding only the **unknown**; no prefill | Empty | No |
| S0 | Numeral | No tray; big number pad; **Peek** button lifts a cloche to reveal the S3 model (counts as assisted) | n/a | No |

Meaning of "the unknown" at S1: result for `a + b = ?`; the missing amount for `3 + ? = 8`; the amount removed for `7 − ? = 5`; for sub result forms the answer left on the plate.

A0 (Count It Out) has no equation or prefill: S3 = empty tray with running-count pops and spoken counts; S2 = no pops/voice; S1 = same as S2 but the bin is the only cue (tray outline only, ticket text hidden after 3 s, tap ticket to hear again); S0 = a pile of food is shown and she types how many.

Worked mapping (add result, `5 + 3`): S3/S2 prefill 5 (blue, locked), she adds 3 (orange ring) → tray total 8. S1 builds 8 from empty. S0 types 8.
Subtraction result (`8 − 3`): S3/S2 prefill 8, she taps 3 items away (they fly to the fridge bin, leaving holes) → 5 remain; S1 builds 5; S0 types 5.
Missing addend (`7 + ? = 10`): S3/S2 prefill 7, she fills to 10; S1 builds 3; S0 types 3.
Missing subtrahend (`7 − ? = 5`): S3/S2 prefill 7, she removes until 5 remain; S1 builds 2; S0 types 2.

### 3.3 Tray rules (precise)
- **Frames** (A-track): ten-frame = 2 rows × 5 cells; cell 88 logical px, gap 8, padding 12. Two frames sit side by side (≈ 980 px wide). Cells 1–5 of each row are tinted A, 6–10 tinted B (the "five wall").
- **Canonical order:** reading order; frame 1 first, then frame 2. A new item always takes the **first empty cell**. Removing an item leaves a hole; the next add fills the first hole.
- **Place:** tap the bin or drag from it; dropping anywhere on the tray works; dropping elsewhere returns the item.
- **Remove:** tap a placed item (undo) or drag it off the tray. Prefilled+locked items shake gently and stay. In `remove` mode tapping any placed item removes it.
- **Unlimited copies:** the bin never empties. Only the ordered food type appears (no distractors; food-type discrimination is not the learning goal).
- **Capacity:** A-track max 20. Over-capacity attempts wobble the bin and say nothing.
- **Tens-and-ones layout (B-track):** left = **tens shelf** (up to 10 ten-packs, two rows of 5 slots), right = **ones frame** (single ten-frame, max 9 singles shown plus the 10th triggers auto-bundle: ten singles pop into a pack and fly to the tens shelf). Bin area has two bins: *Box of 10* and *Single*. B-track capacity: 10 packs + 9 ones.
- **Ten-pack art:** rounded SVG box border containing a 2×5 grid of ten small food glyphs (HTML-positioned, same renderer as frame cells), so a pack visibly equals one full frame.
- **Serve:** a bell button (≥ 112 logical px). Disabled while animations run or when the tray equals its initial state (a disabled tap wobbles the bell). **Never auto-serves.**
- **B-track counting voice (S3):** a pack says the running tens ("ten", "twenty"…); singles continue ("twenty-one"…).
- **Counting voice (S3):** adding says the running total ("six", "seven", …) starting from the prefilled count (models counting on); removing says the remaining count (counting back). If speech is busy, skip it; the rising tone is always immediate.

### 3.4 Problem state machine (service engine, pure + tested)
```
MonsterArrive → OrderShown(speak ticket) → Building(attempt=1)
Building --Serve--> Evaluate
Evaluate: correct → Eat → Reaction → Coins → MonsterLeave → next
Evaluate: wrong & attempt=1 → CountTogether (replay; tray stays editable) → Building(attempt=2)
Evaluate: wrong & attempt=2 → Worked (demo) → FollowMe → ResolvedAssisted → requeue(one step more support) → MonsterLeave → next
Help pressed (any time) → CountTogether if attempt=1, else Worked; marks assisted
```
- "First-try correct" = first Serve press correct **and** Help not used before it.
- Outcomes recorded: `firstTry | correctAfterHint | resolvedAssisted`.
- Wrong faces are never angry: monster tilts head, soft two-note descending "hm?" tone.

---

## 4. Generators and the problem pool

All generators are pure functions of `(rng, params)`; `pool(skill)` enumerates every fact; `make(fact, rng, stage)` realizes it (random operand order where commutative, random food).

Counts below were computed by script, not estimated. They count **ordered presentations** (3+5 and 5+3 are two); mastery uses canonical keys (`factKey`, unordered for addition), so there are fewer canonical facts than listed. `lint:content` compares against these ordered counts.

**No zero answers in tray stages.** The serve bell is disabled while the tray equals its starting state (anti-mash). A zero result at S1 would expect an empty tray, i.e. a deadlock. So no pool contains an answer of 0 (and `n+0` / `n−n` are excluded). Zero is a legitimate concept; deferred to a later "Nothing left!" mini-lesson (backlog).

**Frame count rule:** `layout = frames2` iff `max(prefill, expected tray value) > 10`, else `frames1` (centered).

| Skill | Forms | Constraints | Pool |
|---|---|---|---|
| A0 | `count`: bring n | n 1–10 (frames1), 11–20 (frames2) | 20 |
| A1 | `a+b=?`, `m−b=?` | a,b ≥ 1, a+b ≤ 5; m 2–5, b 1–(m−1). **No zero results** (see below) | 10 add + 10 sub = **20** |
| A2 | `a+b=?`, `m−b=?` | sums 6–10; m 6–10, b 1–(m−1) | 35 + 35 = **70** |
| A3 | `a+?=10`, `?+a=10`, `10−a=?`, `10−?=a` | a 1–9 | 9×4 = **36** |
| A4 | `a+?=c`, `?+a=c`, `m−?=c` | c ≤ 10, a<c; m 2–10, 1 ≤ c < m | **135** |
| A5 | `10+n=?`, `n+10=?`, `1n=10+?`, `1n=?+n`, `1n−10=?`, `1n−n=?` | n 1–9 | 9×6 = **54** |
| A6 | `1n+k=?`, `k+1n=?`, `1n−k=?` | n+k ≤ 9 (no crossing); k<n for sub (result > 10) | 72 + 36 = **108** |
| A7 | `a+b=?` | a,b 2–9, a+b 11–18 | **36** (20 unordered) |
| A8 | `m−b=?` | m 11–18, b 2–9, b > m−10 (must cross ten) | **36** |
| B1 | `T1+T2=?`, `T1−T2=?`, `n+10=?`, `n−10=?` | T multiples of 10; sums ≤ 100; n 11–89 not a multiple of 10 | 90 + 144 = **234** |
| B2 | `tO+k=?`, `tO−k=?`, `T+O=?` | add: t 1–8, ones 1–8, k 1–(9−ones). sub: t 1–9, ones 2–9, k 1–(ones−1) (ones digit stays ≥ 1). compose: T 10–80, O 1–9. **No regrouping** | add 288, sub 324, compose 72 → **684** |
| B3 (P2) | `tO+tO=?`, `tO−tO=?` | tens and ones each non-regrouping | generated |
| B4 (P2) | compare two quantities/numbers | ≤ 20 with plates, then ≤ 100 with numerals | generated |

Difficulty (1–5) used for ordering warm-ups:
- A1/A2: facts she already knows (+1, doubles) serve as openers; new work orders near-doubles (2+3, 3+4, 4+5) first, then by larger addend; sub by minuend.
- A3: 5+5 and 9+1 easiest; then by distance from 5.
- A7: doubles (known) and near-doubles (5+6, 6+7, 7+8, 8+9) first, then 9+x, then 8+x, then by `10 − max(a,b)`; A8: by `b − (m−10)` small first.

Strategy tags are attached per fact (e.g. 8+5 → `bridge`; 5+5 → `doubles`) and drive which demo plays.

Spoken forms (all via `numberToWords`, never raw digits):
`a + b = ?` → "Eight plus five equals what?"; `a + ? = c` → "Seven plus what equals ten?"; `m − ? = c` → "Seven minus what equals five?"; A0 → "Can I have seven cookies, please?"; A5 `14 = 10 + ?` → "Fourteen equals ten plus what?"

### 4.1 Session builder (deterministic given seed)
Inputs: `seed`, `skill` (chosen on the menu board), `orders` (4/6/8), the skill's `ops` filter and stage (`skillConfig`, D23, D24), per-fact boxes, focus list.
1. PRNG: `mulberry32`; seed = hash(`deviceId`, service start time, per-device service counter), injected by the caller. Stored in the `serviceEnd` event so any service can be replayed.
2. **Pool:** the chosen skill's pool, restricted by its `ops` filter (`both` | `add` | `sub`: only forms of that operation; skills with a single operation ignore the filter and do not show it). All orders come from this pool plus requeues.
3. **One skill per service (D22).** The skill never changes within a service; "Another service" repeats it and "Change dish" returns to the menu board (§5.7).
4. Weighted sampling by box: weights `[5,3,2,1,0.5]` for boxes 0–4; new facts weight 5.
5. **No immediate repeats:** the same `factKey` (commuted partner included) must not appear within the last 4 problems; the same food and the same monster must not appear twice in a row; when `ops` is `both`, the add/sub ratio stays within ±1 of the skill's target ratio per service.
6. Food: monster's favorite 70% of the time, else random from the allowlist.
7. **Requeue:** `resolvedAssisted` facts are reinserted 3–5 problems later with one step more support (S0→S1→S2→S3; S3 stays S3) and a different food and swapped operand order where commutative; max 2 requeues per service; leftovers set box = 0 for next time.
8. Service length = orders + requeues (max orders + 2).
9. Pool-size guard: if distinct available facts < orders (for example A1 with subtraction only has 10 canonical facts), allow repeats but never adjacent.

The first-ever service on a device begins with the warm-up order (§5.4, D26) before these orders.

### 4.2 Fact boxes, stage and starting state (constants live in `engine/config.ts`; tuned by playtest)
- **Fact box (0–4):** first-try correct → box+1; correctAfterHint → stays; resolvedAssisted or wrong-then-fixed → box = 0. Boxes are shared with the commuted partner (canonical key) at half weight.
- **Stage per skill** is a stored parent setting (`skillConfig` event, default S3, D23), applied from the next service.
- **Starting state (owner-reported: age 5½, Grade 1 first semester, D16).** She already knows +0, +1 (both orders) and doubles 1+1 … 9+9 from flash cards. She can solve take-away *word problems* but is still learning *number sentences* with sums under ten, so symbolic subtraction counts as new. Default `known` preset: those addition facts start at box 3, so they come up less often than new facts. Every skill's stage starts at S3, and the first-run menu highlights A1. All editable in Parent → Skills (M3: stage and operations per skill; M7: starting-point toggles); the toggles are stored as a `known` event.
- Never shown to her: percentages, wrong counts, streaks.
- Stage uses the *same fact pool*; only the representation fades.

---

## 5. Screens and flow

```
Splash(tap to start) → Home ─┬─ "Open the Café" → Menu board (pick a skill) → Service(skill) → Results ─┬─ Another service → Service(same skill)
                             │                                                                           ├─ Change dish → Menu board
                             │                                                                           └─ Home
                             ├─ Shop (decorate; from M4)
                             └─ [hidden corner] Parent gate → Parent area
```

### 5.1 Splash
Full-screen "Tap to start". The tap: unlocks WebAudio (`resume()`), primes `speechSynthesis` (speak a silent/empty utterance), sets `navigator.audioSession.type = 'playback'` if available, calls `navigator.storage.persist()` (best effort), and requests nothing else. No text input anywhere child-facing.

### 5.2 Home
The café exterior/interior as the owned shop decorations, Pip the guide, coin jar with count. Two big targets: **Open the Café** (primary, largest; opens the menu board) and **Decorate** (paintbrush; added with the shop in M4, absent before). The chalkboard is wall decoration, not a separate button. A 44-px, 30%-opacity gear in the top-right corner: long-press 2 s → gate. When the café is locked (§6.2) Home shows the closed café ("Closed — ask a grown-up to open it!") instead of the buttons; the gear still works.
### 5.3 Menu board
Chalkboard with two pages (swipe not required; two big tabs "Little Menu"/"Big Menu"; a tab with no built skill is hidden). Each tile 3×3 (9 on Little, 4 on Big): food icon and a sample sentence in chalk (it shows an example of the operations the parent allowed, e.g. a subtraction for A1 set to subtraction only). This is the start of every play session: the tile for the skill played last glows, and A1 on first run. Parent-hidden skills do not render. Tapping a tile starts a service with that skill.
### 5.4 Service screen layout (safe box 1280×720)
- Monster stands behind the counter top-center (x 440–840, y 40–300); queue of waiting monsters peeks from the left edge as small silhouettes (one per remaining order) — the natural end-of-service cue.
- **Ticket** (paper receipt, x 860–1220, y 60–260): equation tokens colored (first operand blue, second orange, result green; also shape-coded by the blank's dashed box so color is never the only cue). Tap ticket → replays spoken sentence. Food icon beside it.
- **Tray** on the counter (y 310–520), centered.
- **Bin** bottom-center-left (y 570–700). **Bell** bottom-right. **Pip's hat button (Help)** bottom-left. **Door sign (leave)** top-left, small: opens "Take a break?" with two 160-px buttons, *Keep cooking* / *Close the café*.
- **First-ever service (tutorial, D26):** before the chosen skill's orders, one warm-up order `2 + 1` (cookies, one ten-frame, S3, whatever skill was picked). If she has not touched anything after 4 s, a ghost hand taps the bin once to show how items are placed; once the item is on the tray, after 4 more idle seconds the ghost hovers over the bell with a tap motion while Pip says what to do. The bell press is always hers (never auto-serve). The order pays the usual 3 coins and writes no `attempt` event. Shown once per device (flag in the `meta` store).
- S0: number pad replaces bin and tray area (3×4 grid, buttons ≥ 120 px; two digit slots "tens | ones" for ≥ 10). **Peek** replaces Help's role as the concrete reveal.

### 5.5 Teaching behavior
- **CountTogether (after first wrong, or Help at attempt 1):** a *model bubble* appears in the monster zone (the monster shrinks aside): non-interactive mini frames/packs (cells 36 logical) show the problem — first group (blue) then second group (orange) — and Pip counts them with running numbers, ending at the answer. Her tray stays untouched and editable (the main tray is never covered). The monster says "Hmm! Let's count together." It is allowed to reveal the answer: first-try correctness is the diagnostic, not secrecy.
- **Worked (second wrong, or Help at attempt 2+):** a strategy demo (below) plays on her tray after it is cleared back to the start state, slower, narrated.
- **FollowMe:** tray resets to start; the next required cell/item pulses; she performs each step by tapping (≤ 10 steps; tens/ones: ≤ 5). Bell then rings automatically ("assisted serve"). Monster still eats happily.
- Demos are **data**: `buildDemo(problem): DemoStep[]` with `{ narrationKey, trayOp, holdMs }`; a single `DemoPlayer` renders them. Unit test: applying every step to the start state ends in the expected tray state for every pool item.

| Strategy | Demo |
|---|---|
| count on / count back | Blue group glows "five", orange items appear one by one "six, seven, eight"; back: items fly off "seven, six, five" |
| doubles | Two equal rows highlighted: "three and three" |
| near double | Two equal rows ("you know six and six is twelve"), one extra item appears: "one more — thirteen" |
| make ten (A3) | Empty cells flash; "seven… and three more makes ten" |
| teens (A5/A6) | Full frame glows "ten"; remainder "and four — fourteen" |
| bridge (A7) | "Eight. Fill the ten first": 2 items slide from the second group into frame 1 → full → "ten, and three left: thirteen" |
| back through ten (A8) | "Fifteen. Take the five to get to ten" (5 fly off) "then two more from the ten" → "eight" |
| tens (B1) | Packs counted "ten, twenty, thirty…" |
| tens and ones (B2/B3) | Tens packs counted by tens, then singles by ones: "twenty… twenty-one… twenty-seven" |

### 5.6 Eating and reaction
Correct serve: bell "ding"; tray slides to the monster; food flies into the mouth in groups (≤ 5 individually counted, > 5 by row/pack with running total spoken at the end, e.g. "Eight!"); 3 chew cycles; reaction chosen from the monster's list (§7.2) with a bigger variant on first-try. Total eat+react ≤ 4 s; any tap skips ahead. Then 3 coins fly into the jar one by one (§9).

### 5.7 Results (closing time)
The sign flips to CLOSED. Coin tally counts up with spoken numbers (counting by ones, then by fives for > 10). Shows the monsters served as a row of happy faces (everyone is happy; no scores). Buttons (≥ 160 px): **Another service** (the default, highlighted: same skill again; absent when the café is locked, §6), **Change dish** (back to the menu board), **Decorate** (from M4), **Home**. When the allowance ran out during this service, Results is followed by the locked Home. No streaks, no daily login, no "come back" nags.

### 5.8 Leaving mid-service
Coins earned so far are kept. The service is recorded as partial (`serviceEnd.partial`, §11.2) and can be resumed from the `resume` snapshot (§11.6). Reopening within 2 h offers "Continue dinner service?" with two big buttons.

---

## 6. Play allowance and lock
Goal (owner): when a parent wants to hand her the device and walk away, they can turn on a play-time limit, so she plays for a defined period, not endlessly, until a parent intervenes. **The limit is optional and off by default (D27):** a fresh install has no clock, no lock and no cue, and nothing in this section runs until a parent enables it in Settings. (D7 — an earlier draft misread this as a per-service or daily limit.)

### 6.1 Model
While the limit is enabled, a **play session** is one allowance of active play time. The allowance is per device and is *not* reset by closing the app, starting another service, or reloading.
- **Setting** (Parent → Settings, top of the page, per device): Play time limit = **Off (default)** / 5 / 10 / 15 / 20 minutes. Off means no clock, no lock, no cue and no "Start new session" / "Add time" buttons. Choosing a duration (or changing it) starts a fresh session with that full allowance, counting from the moment the parent returns to the child screens. Choosing Off at any time, even while the café is locked, clears the lock and the remaining time.
- **State** (per device, stored in the `clock` store, §11.3): `remainingMs`, `state: 'open' | 'locked'`, `lastRefillAt`. Unused while the limit is Off.
- **Counts as play time:** foreground time on any child-facing screen (Home, Menu, Service, Results, Shop). Does **not** count: the parent area, the parent gate, the "Take a break?" dialog, a hidden page, or idle time — the clock pauses after 90 s without any input (she walked away) and resumes on the next touch.
- The clock is a monotonic accumulator of active time (never wall-clock subtraction), flushed to IndexedDB every 5 s and on `visibilitychange`, so killing the app or changing the device clock does not refund time.

### 6.2 When time runs out
1. At `remainingMs ≤ 0`: stop accepting new orders. The monster she is serving finishes (including FollowMe), with a hard cap of 90 s grace; dropped requeues get box 0 for next time.
2. Results "Closing time!" plays as usual (tally), then the café **locks**: `state='locked'` is persisted immediately.
3. **Locked screen:** the closed café ("Closed — ask a grown-up to open it!") with sleepy monsters. No Open, Menu or Shop. The hidden gear still works. Relaunching or reloading the app lands on the same locked screen.
4. A parent unlocks through the gate: **Start new session** (full allowance) or **Add time** (5 / 10 / 15 / 20 minutes on top of what remains, also works before it runs out). Either sets `state='open'`. These two buttons exist only while a limit is enabled; to stop limiting, the parent chooses Off.
5. While `open` with time left, "Another service" and everything else works normally; a service ends after its orders as usual (the allowance and the service are independent).
6. When 60 s remain, a gentle non-numeric cue appears (the sign on the door starts swinging). No countdown number is ever shown to her.

### 6.3 Optional automatic refill
Setting "Refill" (shown only while a limit is enabled): **Parent only (default)** / after 1 hour / after 3 hours / next morning (4 a.m.). The automatic modes refill only a *locked* café, and only using wall-clock time since the lock began (the one place the wall clock is used). Parent only is the setting that matches the stated goal; the others are convenience.

### 6.4 Honest limits
- It is per device. If she picks up the iPhone instead of the iPad, that device has its own allowance. (Merge-by-file never merges allowances.)
- Clearing site data, deleting the home-screen app, or private browsing resets it. A 5-year-old will not do this, but it is not a security feature. For a hard guarantee on iOS, pair it with Guided Access; on Android, Screen Pinning.
- The parent gate uses multiplication (6–9 × 7–9), which a 5½-year-old cannot do; a determined older sibling could.

### 6.5 Tests
Default Off: a fresh install never accumulates time, never locks and never shows the cue, however long she plays; choosing a duration starts a full session; choosing Off while locked unlocks and clears the time. With a limit on: fake monotonic clock: pauses when hidden / idle 90 s / break dialog / parent area; flush and restore across reload; lock persists across reload; finishes current monster and caps grace at 90 s; Add time works from open and locked; refill modes with a fake wall clock; clock changes do not refund time; 60 s cue fires once.
---

## 7. Art

### 7.1 Foods
Use emoji at first via `<Food id>`; each id also has an optional SVG sprite path so art can be swapped without touching game code. **Allowlist, Unicode ≤ 9.0 (Emoji ≤ 3.0), all rendering as 1 codepoint or simple VS16 sequences:**
🍪 cookie (6.0), 🍩 doughnut (6.0), 🍕 pizza (6.0), 🍔 burger (6.0), 🌭 hot dog (8.0), 🥐 croissant (9.0), 🥞 pancakes (9.0), 🍞 bread (6.0), 🍰 cake slice (6.0), 🍓 strawberry (6.0), 🍒 cherries (6.0), 🍎 apple (6.0), 🍙 rice ball (6.0), 🍦 soft ice cream (6.0), 🥕 carrot (9.0), 🌮 taco (8.0).
Not allowed: 🧁 (11.0), 🥪 (10.0), 🥧 (10.0), anything newer. `lint:content` fails the build on any non-allowlisted codepoint in `src/`, scanning against a stored Unicode version table (`scripts/emoji-versions.json`).
- Each `FoodId` carries `{glyph, singular, plural}` (e.g. "cherry"/"cherries") used in spoken lines and captions; emoji need Android 8+ / iOS 12+, below that the glyph falls back to the plural name text in a rounded tile.
- Per-order, one food type only. Each monster has two favorites.
- Ten-pack art is custom SVG, not emoji.
- Emoji are rendered as absolutely positioned HTML elements (not SVG `<text>`, which sizes inconsistently on Safari) with `font-family: "Apple Color Emoji","Noto Color Emoji","Segoe UI Emoji"` and a fixed `font-size` per cell size; verify no clipping at 44-px cells.

### 7.2 Monsters (procedural SVG from parts)
`MonsterSpec` (JSON, versioned) → `<Monster spec expression />`.
```ts
interface MonsterSpec { id; name; body:'blob'|'tall'|'round'|'square'|'jelly'|'fluffy';
  palette:{ body:string; belly:string; accent:string };      // pre-validated, contrast >= 3:1 vs eyes/mouth
  eyes:{ count:1|2|3; kind:'round'|'stalk'|'sleepy' }; mouth:'smile'|'wide'|'toothy'|'tiny';
  extras:('horns'|'antennae'|'ears'|'spikes'|'drips'|'tail')[]; voice:{ pitch:number; rate:number };
  personality:string; favorites:[FoodId,FoodId]; reactions:ReactionId[]; lines:{ arrive:string[]; thanks:string[] } }
```
- Expressions: `idle` (bob + blink), `delight`, `eat` (mouth open, 3 chews), `puzzled` (head tilt), `sleepy` (closed-cafe art). CSS-transform-driven; reduced-motion swaps to static poses.
- Roster (v1, 6 + 2 surprise guests after the 5th and 15th completed service; names are placeholders for the owner to approve, §OPEN_ITEMS):
  1. **Blobbo** — green, one eye, shy giggler, 🍰 / 🍓. Reaction: melts happily.
  2. **Gruffles** — purple, horns, deep "Mmm!", 🍔 / 🌭. Reaction: ground-shaking stomp then purr.
  3. **Zibbit** — orange, tall, three eyes, speedy, 🍪 / 🍩. Reaction: spins like a top.
  4. **Mimsy** — pink, fluffy, tiny and polite, 🍞 / 🍒. Reaction: floats up with hearts.
  5. **Chompers** — blue, big teeth, messy, 🍕 / 🍙. Reaction: burp bubble.
  6. **Wobbleton** — yellow jelly, 🥞 / 🍦. Reaction: wobbles into a puddle and reforms.
  7. *(guest)* **Spindle** — teal, spiky, dramatic, 🥐 / 🍎. Reaction: fake-faints.
  8. *(guest)* **Drizzle** — lavender, dripping, 🌮 / 🥕. Reaction: rains tiny sparkles.
- `lint:content` validates every spec: palette contrast, allowed extras, favorites in allowlist, unique ids, reaction ids exist.

### 7.3 Pip and staff
Pip, a mouse in a chef hat, is the guide: Help button, hint narrator, tutorial pointer. Other animal staff are shop items (§10) that idle in the café and react to events (clap, bounce). Staff do not speak.

### 7.4 Café background
Layered SVG scene: wall, floor, window, lights, counter, counter-top slot, wall art slot, staff spots. Shop item = `{slot, svg component, price}`. Missing art should fall back to a labeled placeholder shape so milestones can ship before art polish.

---

## 8. Audio

### 8.1 Rules
- Unlock on every `pointerdown` if the `AudioContext` is not `running` (iOS suspends after backgrounding).
- Set `navigator.audioSession.type='playback'` when available so the iPhone silent switch does not mute WebAudio; document the silent switch in the Parent area's help.
- **Never block game flow on speech.** `speak()` returns a promise that resolves on `end` **or** after a timeout of `clamp(600, 70 ms × chars, 6000)`; iOS sometimes never fires `onend`. All game logic proceeds on this promise.
- Always show captions on the ticket and in Pip's bubble; if there are no voices the game is fully playable.

### 8.2 Speech
- `speech.ts` exposes `speak(key, params, {interrupt})`. A `phrases.ts` table maps keys to template functions that output **words only** (via `numberToWords`, 0–100 + hundreds edge, unit-tested). Never pass digits, `+`, `−`, `=`, or `?` to TTS.
- Voice selection: prefer `localService` voices with `lang` `en-US`, then `en-*`; prefer names matching /Samantha|Ava|Allison|Google US English|Samsung/ in that order; the parent can pick any installed English voice and a rate 0.7–1.1 (default 0.85) with a Test button. Voice choice is stored per device (iOS and Android voices differ); on Android, when offline, only voices with `localService === true` are used and captions carry the rest. Voices load async: handle `voiceschanged`, retry `getVoices()` at 0/250/1000/3000 ms.
- Call `speechSynthesis.cancel()` before each non-queued utterance (iOS quirk). `interrupt:false` queues. Count-aloud during building uses "latest wins": if speech is busy, skip.
- Monster per-voice quirks are limited to `pitch`/`rate`.
- **Recorded audio later:** `resolveAudio(key)` looks up `public/audio/manifest.json` (`key → file`); missing → TTS. Phrase keys are stable (`num.14`, `op.plus`, `line.blobbo.thanks.2`). A script `scripts/audio-todo.ts` prints the list of keys without recordings (target set: ~21 numbers 0–20, 8 tens 30–100, ~35 operator/prompt phrases, ~50 monster lines).

### 8.3 SFX (WebAudio synthesis, `sfx.ts`, no audio files)
| SFX | Spec |
|---|---|
| place(n) | short sine "pop", pitch walks a pentatonic ladder by running count (n mod 10), resets pitch every 10 |
| remove | soft downward glide 120 ms |
| bell | two-partial triangle ding, 1.2 s tail |
| correct | rising 4-note arpeggio |
| munch | band-passed noise bursts ×3 |
| burp | low saw glide down, short |
| hm | two-note descending soft sine (never a buzzer) |
| coin | two-tone sine "ting" |
| buy | coin ×3 + rising chime |
| arrive | rubber "boing" (sine with pitch envelope) |
Master volume, SFX volume, voice volume settings; defaults 0.8 / 0.7 / 1.0. No background music in v1.

---

## 9. Economy
All numbers live in `engine/economy.ts`.
- **Coins:** +3 per monster served (flat, regardless of correctness, speed, or hints) · +5 service-complete tip. A 6-monster service yields **23 coins**.
- Nothing is ever taken away. Purchases are the only spend; no refunds needed because swapping is free.
- No streaks, daily rewards, expiring items, ads, loot boxes, timers on rewards, or external links.
- Coin display: jar with count; counts spoken in Results only.

## 10. Café shop
Seven slots; every slot has a free default. Tapping an item previews it live in the café; a **Buy** button (160 px) then a confirm with big *Yes!* / *Not yet*. Owned items re-equip free any time. Everything is available from day one (no gating).

| Slot | Items (price) |
|---|---|
| Wallpaper | Sunny Yellow (free), Polka Dots 20, Mint Stripes 20, Brick 30, Starry Night 40, Rainbow 60 |
| Floor | Checkerboard (free), Wood 25, Pink Tiles 25, Cloud Carpet 45 |
| Lights | None (free), String Lights 20, Paper Lanterns 30, Disco Ball 60, Star Chandelier 90 |
| Window | Street (free), Garden 25, Moonlit 35, Snowy 35 |
| Counter-top | Bell (free), Flower Vase 15, Cake Stand 25, Cookie Jar 30, Fish Bowl 35, Tiny Robot 50 |
| Wall art | Menu Board (free), Neon OPEN 30, Giant Clock 35, Monster Portraits 40, Trophy Shelf 60 |
| Staff & pets | Pip (free), Bunny Barista 60, Cat Waiter 80, Bear Busker 100, Owl Cashier 100, Fox Baker 120 |

Total ≈ 1,600 coins ≈ 60+ services. First purchases (15–25 coins) are reachable in the first service.
Equipped items persist per slot; staff can be multiple (up to 3 visible).

---

## 11. Persistence and multi-device

### 11.1 Why event-sourced
She will play on an iPad, an iPhone, and an Android phone, with no backend. Progress would silently fork per device. So everything that counts as progress is an **append-only event log** with unique ids; derived state (fact boxes, wallet, history; per-skill settings are last-writer-wins events) is a pure function of the log. Backup = export the log. Syncing devices = **merge** logs (union by id) and replay. (D15)

### 11.2 Events
```ts
type Evt = { id: string; t: number; dev: string; v: number } & (   // id = crypto.randomUUID() (fallback: 128 random bits); t = epoch ms
 | { k:'attempt'; svc:string; fact:string; skill:SkillId; stage:Stage; outcome:'first'|'afterHint'|'assisted'; ms:number }
 | { k:'serviceEnd'; svc:string; skill:SkillId; seed:number; orders:number; served:number; coins:number; activeMs:number; partial:boolean }
 | { k:'buy'; item:string; price:number }
 | { k:'equip'; slot:string; items:string[] }
 | { k:'skillConfig'; skill:SkillId; stage:Stage; ops:'both'|'add'|'sub' }   // parent's per-skill settings, last writer per skill wins (D23, D24)
 | { k:'known'; facts:string[] }   // starting-point toggles, last writer wins
 | { k:'focus'; list:string[] } )                          // focus list, last writer wins
```
Rules:
- `engine/replay.ts`: `replay(events, initial) → Derived` sorts by `(t, id)`. `applyEvent` is the incremental form and MUST equal a full replay (property test).
- **Coins:** `earned = Σ serviceEnd.coins (distinct svc)`. Amounts live in the events and are never recomputed, so a merge cannot reduce earned coins. `spent = Σ price over distinct purchased items` (the same item bought on two devices is charged once). `balance = max(0, earned − spent)`. Owned items = union of `buy` events. Nothing a merge does can remove an owned item.
- Fact boxes are derived and may legitimately shift after a merge (adaptation, not reward). Stage and operations are explicit `skillConfig` events, so a merge does not shift them.
- `equip`, `known`, `focus`, and `skillConfig` (per skill): latest `t` wins.
- `factKey` format is a persisted identifier: changing it needs a migration.
- Initial state before any events = the owner preset (§4.2 starting state), applied implicitly and never as events, so two fresh devices do not double-seed.

### 11.3 Stores
IndexedDB database `ncmc-v1` (namespacing: §11.5). Stores: `meta` (schemaVersion, deviceId = random UUID, deviceLabel, createdAt, lastBackupAt) · `events` (keyPath `id`, index `t`) · `state` (derived cache with `throughEventCount`; safe to delete, rebuilt on boot when absent or inconsistent) · `settings` (**per device**: voice, volumes, reduced motion, orders per service, play time and refill mode, hidden skills, child name) · `clock` (per device: `remainingMs`, `state`, `lastRefillAt`; §6) · `resume` (in-progress service snapshot) · `snapshots` (last 3 full exports, written before migration, import or replace). All rows carry `profileId='default'` (D9).
- Never `await` a non-IDB promise inside an IDB transaction (Safari auto-commits). One transaction per completed problem appends its events. The in-memory derived state is the read source.
- `Storage` interface with `IdbStorage` and `MemoryStorage`; if IDB fails to open, run in memory and show a parent-only banner.
- `schemaVersion` integer with ordered `migrations[]` (event upcasters); each has a fixture test; unknown future versions refuse import with a clear message.
- Call `navigator.storage.persist()` after the first tap and on parent-area open; show `persisted` and `estimate()` there.

### 11.4 Eviction reality (document in parent Help)
Safari tabs can have script-writable storage evicted after 7 days of non-use; **installed Home-Screen apps are exempt**. Chrome on Android treats installed apps similarly well. The app therefore: (a) shows "Install to Home Screen" how-tos for iOS (Share → Add to Home Screen) and Android (Chrome menu → Install app) in the parent area, (b) shows "last backup N days ago" with a Back-up-now button, (c) keeps 3 auto snapshots.

### 11.5 GitHub Pages same-origin hygiene
`<user>.github.io` is **one origin shared by every Pages project in the account** (possibly your other kids' apps). Therefore:
- Every persistent name carries the prefix `ncmc`: IndexedDB database, Workbox `cacheId`, any `localStorage` key, `BroadcastChannel`.
- "Reset" deletes only the `ncmc-*` database. Never call `localStorage.clear()`, never enumerate-and-delete databases or caches without the `ncmc` filter. ESLint `no-restricted-properties` blocks `localStorage.clear`, and a unit test greps `src/` for `caches.delete` / `indexedDB.deleteDatabase` call sites and asserts the prefix.
- The service worker scope is the project path, so it cannot control sibling apps. A custom domain or a separate GitHub account would isolate completely (optional).

### 11.6 Export, import, merge
- **Export JSON:** `{ app:'number-chef-monsters', schemaVersion, deviceId, deviceLabel, exportedAt, events, settings, checksum }`. Delivered through the Web Share API with a file (iOS share sheet → AirDrop/Messages/Files; Android → Nearby Share/Drive/Messages), fallback to a download link. Must run inside a button tap (user activation).
- **Import — Merge (default):** union by event id; dry-run summary ("adds 42 events from 'iPad', Nov 3–Nov 9; coins 118 → 161"); idempotent (importing the same file twice adds 0); checkbox "also copy settings from this file". **Replace:** wipes local events and settings, needs a second multiplication prompt, always snapshots first.
- Keeping two devices aligned: export from A, merge into B, export from B (now a superset), merge into A. The Data tab explains this in three lines.
- Validate with zod; reject checksum mismatch unless a second confirm.
- **Service resume:** after each completed problem write `resume` = `{svc, seed, config, index, requeues, results, activeMs}`; on boot, offer to continue if < 2 h old. Per device only.
---

## 12. Parent area
**Gate:** long-press 2 s on the Home gear, then a multiplication question with factors 6–9 × 7–9 (answer by number pad, never spoken). 3 wrong → 30 s lockout. Auto-locks after 5 minutes idle or on leaving. Not reachable during a service.

Tier 1 (M3) ships only: the optional play-time limit (off by default) with Start new session / Add time, **per-skill stage (S3–S0) and operations (both / addition only / subtraction only)**, voice/speed/volume, reduced motion, a simple progress list, basic Export JSON, Reset. The full tab set below (Skills, Focus list, merge, heatmap, starting-point editor) lands in M7.

Tabs (normal scrolling layout; works in portrait too):
1. **Progress** — per-skill stage and services played; fact heatmap (addition/subtraction grids 0–10 colored by box); "trouble spots" (facts with box 0 after ≥ 3 sightings); last 20 services (date, skill, first-try %, assisted count, minutes); active minutes per day (last 14).
2. **Skills** — hide/show tiles; set **stage** (S3–S0) and **operations** (both / addition only / subtraction only; skills with one operation do not show it) per skill, shipped in M3 as a minimal list (D23, D24); "reset this skill"; **Starting point**: "already knows" toggles (+0, +1, doubles) (§4.2).
3. **Settings** — orders per service (4/6/8); **play-time limit** (Off by default; 5/10/15/20) and, only when a limit is on, refill mode (parent only / 1 h / 3 h / next morning) with **Start new session** and **Add time** buttons at the very top of the tab (§6, D27); voice, speed, test (voice is per device); master/SFX/voice volume; reduced motion; child's name (optional, used in the greeting only; phrase must degrade if unset); big-text captions; rename monsters.
4. **Focus list (custom content)** — add up to 30 specific facts or skill ranges (e.g. "8+5", "all 9+x") that mix at 25% weight into services of the skill each fact belongs to. Validated against the generators (cannot create a nonsense fact). 
5. **Data** — Device label (e.g. "Dad's iPad"), Export, Import (**Merge** default / Replace; §11.6) with a three-line "keep devices in sync" explanation, Back up now, snapshots list (restore), storage persisted/usage, Reset progress (keeps shop), Reset everything (a second, fresh multiplication prompt), app version/build date, install help.

No external links anywhere. An "About" shows plain text only.

---
## 13. Quality gates

### 13.1 Scripts (cross-platform Node; owner is on Windows — no bash-isms)
`npm run dev | build | preview | typecheck | lint | test | test:e2e | lint:content | content:table | check` where `check` = typecheck + lint + test + lint:content.

### 13.2 Content lint (`scripts/lint-content.ts`; fails CI/`check`)
- Every pool problem: recompute the answer with an *independent* evaluator (parse `display` tokens and solve) and compare to `answer`.
- Constraint checks per skill (no crossing/no regrouping where promised; bridging really crosses; ranges).
- `spoken` contains no digits or symbols; ends with a question or period; ≤ 12 words.
- Unique `factKey`s; pools non-empty; sizes match the §4 table (a drift fails with the new number printed).
- `toTrayTask`/`check` agree with `answer` at all four stages for every pool item.
- Emoji allowlist/version scan of `src/`; monster-spec validation (§7.2).
- Text strings child-facing: ≤ 8 words per caption, no words outside a 1,000-word easy-reader list unless allowlisted.

### 13.3 Content review table
`npm run content:table` writes `docs/CONTENT_REVIEW.md`: per skill pool size, 12 deterministic sample problems (ticket tokens, spoken line, tray start/expected at S3, S1), and each demo's step list. The owner skims it at M2 and M5.

### 13.4 Unit/property tests (Vitest)
- Generators: 1,000 seeds × every skill — answers valid; ranges respected.
- Session builder: determinism (same seed → identical order); no adjacent repeats; no fact within 4 of itself; add/sub balance; requeue positions 3–5 and stage−1; max length; pool-size guard.
- Fact boxes: transitions and sampling weights; the operation filter yields only the allowed forms; `skillConfig` last-writer-wins.- Tray model: fill order, holes, auto-bundle, capacity, locked prefill, `check` truth table.
- `numberToWords` 0–100 exhaustive vs. a hand-typed table of 0–20, tens, and 12 spot checks.
- Economy: coin totals, price/affordability, purchase idempotence.
- Event log: `applyEvent` ≡ full `replay`; merge commutative (A∪B ≡ B∪A) and idempotent; merge never lowers earned coins or removes owned items; duplicate buy/serviceEnd events across devices count once; clock skew between devices does not crash replay.
- Storage: migrations with fixtures, export→import round trip, checksum, corrupt input rejected, snapshot rotation, namespace test (§11.5).
- Play allowance and lock: the cases in §6.5.
- `toStageCoords` for landscape and rotated portrait, including safe-area remap.
- `engine/` import-purity lint.

### 13.5 E2E (Playwright)
- Projects: Chromium emulating iPad Pro 11 landscape (1194×834), Pixel 7 landscape (915×412), and WebKit emulating iPad (gen 7) landscape (1080×810) and iPhone 13 landscape (844×390), plus portrait variants (iPad 834×1194, iPhone 390×844) for the rotated-stage tests. `hasTouch: true`.
- Playwright has **no touch drag API**; taps use `page.touchscreen.tap`; drag tests dispatch touch via CDP `Input.dispatchTouchEvent` in the Chromium project only. Everything also works by tapping, so most flows test by tap.
- Test build flag `VITE_E2E=1` exposes `window.__ncmc` (seed override, fast-forward animations, fake clock, state dump). It is stripped from production builds (test: production bundle contains no `__ncmc`).
- Flows: first run → one full service per track; skill pick → service → Another service repeats the same skill → Change dish returns to the menu; parent sets stage/operations and the next service reflects them; wrong→hint→wrong→demo→follow-me→requeue; Help paths; S0 numpad; shop buy/equip persists across reload; parent gate (wrong answers/lockout); allowance runs out → finishes monster → locked Home → survives reload → parent unlock; export→reset→import restores; two-context merge (two browser contexts as two devices); portrait viewports render the rotated stage and taps/drags land on the right targets; back gesture shows the break dialog; offline reload (service worker) works; zero external network requests; no scrollbars / no zoom on double-tap; tap-target size assertions at 844×390.
- Screenshots on every milestone into `docs/screens/M<n>/`: Splash, Home, Menu (both pages), Service at S3/S1/S0 for a frame task, a bridging task mid-demo, a B-track task, Results, Shop, Parent progress, in iPad 1194×834 and iPhone 844×390.

### 13.6 PLAYTEST.md (only the owner can judge)
Claude Code creates the file with, per milestone, a checklist and blank notes. Always includes: Did she understand the ticket unaided? Tap vs. drag preference? Is the bell press discoverable? Is any voice line scary/annoying? Pace of requeue/FollowMe (too much?) Does she look for the monster or the math? Are tap targets comfortable? Anything she does the app doesn't handle (two-finger, resting palm, mashing)? Any freeze after backgrounding/rotation on the real iPad? Audio working with the silent switch on?

---

## 14. Milestones
Each milestone ends: `npm run check` green, e2e green, screenshots saved, `PLAYTEST.md` updated, **STOP and wait for owner playtest feedback** before the next. Each milestone also starts by fixing what the previous playtest found. Hours are agentic build estimates. (D20: the owner wants a playable game in ≈ 10 h and bonus features beyond, with no upper limit.)

### Tier 1 — Playable (≈ 10 h): M0–M3
At the end of M3 you can hand her the iPad: she plays A1–A3 (within 5, within 10, make ten) with monsters and sound, her progress is saved, and, if a parent turns on the optional play-time limit, the café locks when time is up until a parent unlocks it. That content is exactly what her book is working on (number sentences with sums under ten).

#### M0 — Foundations (≈ 2 h)
Vite/TS/React scaffold, strict TS, ESLint/Prettier, Vitest, Playwright projects, PWA manifest + service worker (`prompt` registration, `cacheId: 'ncmc'`), Andika, stage scaling, **rotated-stage portrait handling with `toStageCoords`** (pure matrix helper, unit-tested), touch-hardening layer incl. back guard, `Storage` interface + memory + IDB skeleton, `git init`, GitHub Actions Pages workflow (`.github/workflows/deploy.yml`), test-hook build flag, namespacing lint (§11.5).
**Accept:** `check` green; the GitHub Pages URL installs to iPad and iPhone Home Screens (and Android via Chrome Install) and launches standalone, no zoom/scroll/long-press menu; offline reload works; in portrait the stage renders rotated and a tap on a rotated control hits the right target (e2e, portrait viewports), and rotating the viewport back removes the transform with no state loss; Android back gesture and iOS edge-swipe do not leave the game (e2e: `popstate` shows the break dialog); zero external requests; version shown on a hidden debug route; ESLint blocks `localStorage.clear`.
**Owner action:** create the GitHub repo (public), set Pages source to "GitHub Actions", push.

#### M1 — Core loop vertical slice (≈ 3.5 h)
Pure engine: `numberToWords`, rng, A1–A2 generators, `toTrayTask`/`check`; tray + ten-frame UI with tap and drag; ticket; bell; placeholder monster (single static SVG) and one food; two-try flow with CountTogether, Worked, FollowMe for count-on/count-back/near-double; stages S3–S0 working for A1/A2; first-order ghost-hand tutorial; TTS v1.
**Accept:** unit tests for generators/tray/check/demos pass; all four stages playable for A1 and A2; fill-order/hole/lock rules per §3.3 verified by e2e; no auto-serve; wrong→wrong→demo→follow-me completes; speech never blocks the flow (test with `speechSynthesis` stubbed to never fire `end`); 844×390 tap-target assertions pass; tap and CDP drag work in both landscape and rotated portrait.
**Owner playtest:** 5 minutes with her on the real iPad: ticket comprehension, bell, tap vs. drag, speed at S0 versus her flash-card pace, take-away tasks (she knows subtraction stories; are number sentences the barrier?).

#### M2 — Café service (≈ 3.25 h)
Service loop (6 monsters), session builder with requeue and per-fact weighting (§4.1–4.2), first-ever warm-up order (§5.4), monster SVG parts + 6 roster specs + expressions + reactions, eat sequence, all SFX, Home + Menu board (pick a skill; tiles for built skills only; last-played glows), Results with coin tally and Another service (same skill) / Change dish (coins accrue and show in the jar; nothing to spend yet), Pip, voice lines, **A3 Perfect Ten** generator + demo.
**Accept:** deterministic service from seed; no adjacent repeats; each monster renders at all expressions (screenshot grid); eat+react ≤ 4 s and skippable; reduced-motion variant verified; 4× CPU throttle keeps ≥ 30 fps; first run reaches the first order in ≤ 2 taps after Splash (Open the Café, then the highlighted A1 tile); Another service repeats the skill and Change dish returns to the menu; content table generated.
**Owner playtest:** monster appeal, voices on all three devices, length of a service, queue cue.

#### M3 — Hand-off ready (≈ 1.5 h)
Single-device persistence on the event log (§11: events, `replay`, stores, migrations, snapshots), fact boxes (sampling weights only), per-skill stage and operations settings, the optional **play-time limit and lock screen** (§6, off by default), parent gate + minimal parent area (play-time limit + Start new session / Add time, per-skill stage and operations, voice/speed/volume, reduced motion, simple progress list, basic Export JSON backup, Reset), resume-service.
**Accept:** `applyEvent` incremental equals full replay (property test); limit off by default (a fresh install never locks); allowance behavior per §6.5 when enabled, including lock-after-reload; parent gate lockout; reload mid-service offers resume; export→reset→import round trip; migration fixture tests; storage persisted flag and estimate shown; per-skill stage and operations settings change the next service (e2e); box-weight tests.
**Owner playtest:** turn the limit on (10 minutes), hand her the iPad, walk away: does it lock; is unlocking easy; after a few days, are the per-skill stage and operations settings the right knobs, and how often do you want to change them.

### Tier 2 — Bonus features (no cap; suggested order, any order works)

#### M4 — Economy and shop (≈ 1.75 h)
Coin spending, shop slots/items with placeholder-quality SVG, preview/buy/confirm, equip, Pip and staff reactions, guest monsters. Purchases are `buy`/`equip` events.
**Accept:** economy table matches §9/§10 (unit test sums); purchase idempotent and persisted; confirm prevents accidental buy; no code path decreases earned coins; shop screenshots. The shop is play time (covered by the limit when it is enabled).

#### M5 — Rest of the Little Menu (≈ 3 h)
A0 and A4–A8 generators + demos (missing amounts, teens, near-double, bridging, back-through-ten), double-frame layouts, per-skill difficulty ordering, menu tiles live.
**Accept:** pool sizes match §4 exactly; all demos end in expected tray state for all pool items; bridging fills frame 1 first (e2e); content table reviewed by owner; every skill completes a service at each stage in e2e.

#### M6 — (unused; story tickets were declined, D21. Numbering kept stable.)

#### M7 — Full parent area and multi-device merge (≈ 2.5 h)
Import with **merge** (and Replace), device label, Focus list (custom content), Starting-point editor, skill hide/show, fact heatmap, trouble spots, per-service history, snapshots restore.
**Accept:** merge commutative and idempotent (A∪B ≡ B∪A; importing twice adds nothing); merging never lowers earned coins or removes an owned item; duplicate buy/serviceEnd events count once; two-context e2e (two browser contexts as two devices); Focus list validated and mixed at 25%.

#### M8 — Big Menu (≈ 2 h)
B1–B2: ten-packs, tens shelf + ones frame, auto-bundle, two-digit numpad, demos. Likely second-semester Grade 1 content.
**Accept:** pools match; auto-bundle at ten singles; capacity rules; tens/ones demos verified; screenshots.

#### M9 — Stretch skills (≈ 1.5 h)
B3 generators + layout reuse; B4 compare tasks.

#### M10 — Polish and hardening (≈ 1.5 h, and after any playtest round)
Accessibility pass (labels, tab order for parent area, contrast), full e2e matrix, bundle-size report (target < 1.5 MB gz), icon generation, README for deploy and restore, recorded-audio manifest support (`scripts/audio-todo.ts`).
**Accept:** full `check` + e2e green on all projects; Lighthouse PWA installable; contrast ≥ 4.5:1 for text; no console errors; bundle report committed.

#### M11 — Profiles (≈ 1.5–2 h)
Profile picker on Splash/Home, `profileId` on events (already reserved), per-profile wallet and café, per-profile known-facts preset (e.g. a toddler profile limited to A0 with 1–5), export/import per profile.

Later ideas, unscheduled: rush-hour mode, monster designer, zero-answer lesson, start-unknown "Mystery Orders", regrouping.
---

## 15. Deployment (GitHub Pages)
- Project site `https://<user>.github.io/number-chef-monster-cafe/`. On a free GitHub plan Pages needs a **public** repo: the code and these docs become public; the repo contains no personal data (child's name lives only in on-device settings).
- Deploy with GitHub Actions on push to `main`: `.github/workflows/deploy.yml` = checkout → setup-node → `npm ci` → `npm run check` → `npm run build` → `actions/upload-pages-artifact` → `actions/deploy-pages`. Pages source must be set to "GitHub Actions" in repo settings (owner action). Claude Code writes the workflow but never pushes (CLAUDE.md); the owner pushes or explicitly asks.
- Vite `base: './'`; manifest `start_url: './'`, `scope: './'`, `display: standalone`, `orientation: landscape` (honored by installed Android PWAs; iOS ignores it, hence the rotated stage in §2.2). **No path-based client routing**: screens are in-memory state, because Pages has no SPA rewrite.
- GitHub Pages sends `Cache-Control: max-age=600`: after a deploy, `index.html` and the service worker can be up to 10 minutes stale. Acceptable. Asset filenames are hashed.
- Update flow: `registerType: 'prompt'` with silent activation. The waiting worker is activated on the Home screen when idle (or on cold launch). Never reload during a service (e2e test: simulate a waiting worker mid-service, assert no reload).
- Same-origin hygiene: §11.5.
- Icons (192, 512, maskable-512, Apple-touch 180) are generated by `scripts/make-icons.ts` from a monster SVG.
---

## 16. Assumptions (recorded in DECISIONS.md; owner can veto)
Landscape layout with portrait handled by rotating the stage; single child profile now (`profileId` reserved, profiles = M11); per-device settings, optional play-time limit and lock (off by default); progress mergeable by exported file; US-English voice, chosen per device; emoji foods first; no music; Pip as guide; names of monsters/staff are placeholders; ladder order as specified; skill picked from the menu, stage and operations set per skill by the parent (D22–D24); play-time limit off by default (parent opts in; default parent-only refill); starting state from the owner's report (§4.2); hosting on GitHub Pages (public repo, no personal data).