# Spec Review — Number Chef: Monster Cafe

Reviewed: `CLAUDE.md`, `docs/SPEC.md` (v1.0), `docs/DECISIONS.md` (D1–D21 and review log), `docs/OPEN_ITEMS.md`, `docs/KICKOFF.md`.
Date: 2026-11-02.

Note: findings that concerned a feature since dropped from the design have been removed from this document (see `DECISIONS.md` D28). Section, row and item numbers were renumbered or left with gaps accordingly.

---

## Decision log (owner walk-through in progress)

The owner is working through this review in chat, a few items at a time. Each decision is recorded in the table below as it is made. When every chunk is done, the owner signs off on a summary; only then are the significant design changes written to `DECISIONS.md`. **Status: signed off; the design changes are recorded as D29–D38 in `DECISIONS.md`. Nothing in `SPEC.md`, `OPEN_ITEMS.md`, `CLAUDE.md` or `README.md` has been edited yet:** Claude Code applies every "Edit …" note in the table below as the spec-errata section of `PLAN.md` (the owner approves it in one pass). "D?" in the last column means the item is covered by a D29–D38 entry.

Status: **Accepted** = incorporate as suggested · **Modified** = incorporate with the change noted · **Rejected** = do not incorporate · **Deferred** = decide later / needs outside input. "D?" = needs a `DECISIONS.md` entry at the end.

**Chunk plan** (✅ = done)

| Chunk | Items | Done |
|---|---|---|
| 1 | §2.1 box movement, §2.1 diagnostic S2, §2.2 wrong-then-fixed, §2.3 new-fact order | ✅ |
| 2 | §2.4 remove-from-end, §2.4 "taken away" row, §2.5 tap-to-count, §2.6 feedback after a wrong serve | ✅ |
| 3 | §2.7 vocabulary, §2.8 `+0` toggle, response time, spacing claim | ✅ |
| 4 | C1 FollowMe bell, C2 `? + a = c` forms, C6 stage override in M3, C9 resume offer | ✅ |
| 5 | Tidy-ups C3, C4, C5, C8, C10, C12, C13, C14 (batch) | ✅ |
| 6 | §4.1 coins on resume, §4.2 S0 number pad, §4.4 tutorial order | ✅ |
| 7 | §4.3 allowance: last customer, tip on close, 60 s cue | ✅ |
| 8 | §4.3 allowance: 90 s cap, idle nudge; §4.5 frames1 capacity, ticket colors | ✅ |
| 9 | §4.5 requeued monster, debug route, word-list source, export checksum | ✅ |
| 10 | §4.5 Safari vs Home Screen; §5 items 6, 9, 10 (need owner input) | ✅ |
| 11 | §4.5 iOS baseline / device answers; §5 items 1–5, 7, 8 (platform risks for PLAN.md; batch) | ✅ |
| 12 | §6 scope and estimate (PLAN.md errata bullet handled in chunk 14) | ✅ |
| 13 | §7 fun ideas | ✅ |
| 14 | Summary of all changes, sign-off, then write `DECISIONS.md` | ✅ Signed off; D29–D38 written. `SPEC.md` and other docs not yet edited. |

**Decisions**

| ID | Item | Status | Decision / notes | D? |
|---|---|---|---|---|
| 2.1a | Only S1/S0 first-try results raise fact boxes | Accepted | Misses still reset the box at every stage. At the default S3, boxes do not rise until the parent moves a skill to S1/S0, so sampling stays even. Edit `SPEC` §4.2. | D? |
| 2.1b | Diagnostic S2 (tap the total on a number strip) | Rejected | S2 stays as specified. | |
| 2.2 | Wrong-then-fixed outcome and naming | Accepted | Four outcomes, persisted spelling everywhere (`SPEC` §3.4, §4.2, §11.2): `first`; `afterHint` (Help pressed before the first serve, then correct; box stays); `fixed` (wrong first serve, then correct; box = 0, no requeue); `assisted` (worked demo + FollowMe; box = 0 + requeue). Help at attempt 1 plays CountTogether and moves to attempt 2, so Help then a wrong serve goes straight to Worked. Supersedes the OPEN_ITEMS #10 default. | D? |
| 2.3 | New-fact introduction order, cap, shared box | Accepted (cap 3) | New facts are introduced in difficulty order, at most 3 new facts per service. One box per unordered pair; drop the "half weight" wording. Edit `SPEC` §4.1 step 4, §4.2. | D? |
| 2.4a | Remove always takes the last filled cell | Accepted | The tapped item still flies away, but the frame stays canonical (mirrors D5). Edit `SPEC` §3.3. | D? |
| 2.4b | Visible "taken away" row for missing-subtrahend forms | Accepted | A3 `10 − ? = a` and A4: removed items stay in a small row by the fridge so the unknown stays on screen; CountTogether and demos point at it. Needs a layout slot (check in the M1 layout mock). | D? |
| 2.5 | Tap-to-count vs tap-to-remove | Accepted | Add mode: tapping a placed item hops it and says its position number; removal by drag-to-bin or a single "take one back" button. Remove mode: tap still removes. Add "does she count by touching?" to PLAYTEST. | D? |
| 2.6 | Monster counts her plate aloud after a wrong serve | Accepted | "I see seven… I wanted eight. One more!" before the CountTogether model bubble; no red X or buzzer. Wording goes in the phrase table. | D? |
| 2.7a | "Take away" / "makes" wording | Rejected | Keep "minus" / "equals what?" as in `SPEC` §4. | |
| 2.7b | Spoken ticket wrapped in the café frame | Accepted | Spoken only, e.g. "Three plus two cookies, please!"; the written ticket stays numerals. Edit the `SPEC` §4 spoken forms / phrase table. | |
| 2.8a | `+0` known toggle | Accepted (remove) | Delete from `SPEC` §4.2 and §12 Skills; re-add only if the zero lesson is built. | |
| 2.8b | Median S0 response time in parent Progress tab | Accepted | Never shown to the child. Parent Progress is Tier 2, so this lands with it; `attempt.ms` keeps being recorded. | |
| 2.8c | "Spaced practice" claim | Accepted (soften) | Reword `SPEC` §1.1 point 5; no due-date logic added. | |
| C1 | FollowMe auto-rings the bell | Accepted | The bell pulses and she presses it; no auto-serve anywhere. Edit `SPEC` §5.5 (and the "assisted serve" wording). | |
| C2 | `? + a = c` forms in A3/A4 | Accepted (keep in) | Addition-only start-unknown (`? + a = 10`, `? + a = c`) stays in v1 as a commuted missing addend. Update D1(d) to say so; change the Mystery Orders backlog example to `? − 3 = 5`. Pools unchanged (A3 = 36, A4 = 135). | D? |
| C6 | Stage override vs M3 acceptance | Already resolved | D23 and `SPEC` §14 M3 already include per-skill stage and operations settings in the M3 parent area. No action. | |
| C9 | Resume: automatic vs offered | Accepted | Use the "Continue dinner service?" offer everywhere (fix `SPEC` §2.3 / line 137 wording); suppress the offer while the café is locked and offer it after a parent unlocks. Also settles "resume while locked" from §4.3. | |
| C3 | Requeue notation "stage−1" | Accepted | Already fixed in `SPEC` §4.1 step 7 and D23; fix the stale "stage−1" in the §13 test list to "one step more support (capped at S3)". | |
| C4 | Frame tint wording | Accepted | "Top row (cells 1–5) tint A, bottom row (6–10) tint B, in each frame." | |
| C5 | Shop total | Accepted | "≈ 1,600" → 1,340 in `SPEC` §10 and OPEN_ITEMS #4 (about 58 services at 23 coins). | |
| C8 | §3.1 types | Accepted | `operands: (number \| null)[]`; remove or use the `Unknown` type. | |
| C10 | D9 milestone number | Accepted | Profiles are M11, not M9. | |
| C12 | "20 h figure" in DECISIONS residual risks | Accepted | Reword to the Tier 1 ≈ 10 h framing (D20/D22). | |
| C13 | Play-time option order | Accepted | "none / 5 / 10 / 15 / 20" in `SPEC` §6.1. | |
| C14 | OPEN_ITEMS numbering gap | Accepted | Renumber so the table has no gap at #2. | |
| 4.1 | Coins on resume / app killed | Accepted | A small `coin` event is written in the same transaction as each completed problem (including the D26 warm-up order); `serviceEnd` carries only the tip; coin totals dedupe by event id. Edit `SPEC` §11.2, §11.3 and the §5.6 coin text. Needs a schema note (`coin` event type). | D? |
| 4.2 | S0 number pad layout | Accepted | One row of ten digit buttons 0–9 in order, one answer display that always accepts up to two digits (no tens/ones slots), and a backspace. Edit `SPEC` §5.4. | D? |
| 4.3a | "Last customer" wind-down | Accepted (both parts) | When remaining allowance drops below about one order's length (tune in playtest), waiting silhouettes wave and leave and the current monster is announced as the last customer. Also: no full new service when less than about half a service remains; offer a shorter one. Applies only when the limit is enabled (D27). Edit `SPEC` §6; add to §6.5 tests. | D? |
| 4.3b | Tip when the allowance closes the café | Accepted | The +5 tip is paid when the allowance closes the café mid-service; no tip for a voluntary early exit or Take a break. Supersedes the OPEN_ITEMS #8 default. | D? |
| 4.3c | 60 s warning cue | Accepted (dim + yawn) | Lights dim and Pip yawns; the door sign never animates. Edit `SPEC` §6 / §5.4. | |
| 4.3d | What happens at the 90 s grace cap | Accepted | The monster eats happily and leaves; no `attempt` event; the fact's box is unchanged; a pending requeue is dropped without a box reset. Edit `SPEC` §6.2 (and the §4.1 step 7 "leftovers set box = 0" wording to exclude cap cutoffs). | D? |
| 4.3e | Resume while locked | Covered by C9 | See C9. | |
| 4.3f | Idle nudge | Accepted | At every stage, after about 20 s idle, repeat the spoken ticket once per order; spoken only, no countdown. | |
| 4.5a | `frames1` capacity | Accepted | `frames1` capacity 10, `frames2` capacity 20; same bin wobble when over capacity. Edit `SPEC` §3.3. | |
| 4.5b | Ticket color mapping | Accepted | Blue = prefilled/locked group, orange = the group she adds or removes, green = result; not by position. Edit `SPEC` §5.4. | |
| 4.5c | Requeued monster identity and coins | Accepted | The same monster returns ("Blobbo's back — still hungry!") and pays 3 coins like any completed problem, so a service with requeues can pay up to 6 coins over the 23 base. Edit `SPEC` §4.1 step 7 and §9. Also covers §7 "returning-monster story" (7e). | D? |
| 4.5d | Hidden debug route | Accepted | `?debug` query flag read once at boot, available in production builds; not reachable from child-facing UI. Edit M0 acceptance. | |
| 4.5e | Easy-reader word list | Rejected (drop the lint) | No word list is committed and the easy-reader lint is removed from `SPEC` §13.2 and any milestone that mentions it (M10); child-facing text stays minimal by convention. | D? |
| 4.5f | Export checksum | Accepted | SHA-256 via SubtleCrypto, hex-encoded in the export header. Edit `SPEC` §11.6. | |
| 4.5g | Safari tab vs Home Screen storage | Accepted (note only) | Documentation note ("install to the Home Screen before first play") in README/PLAYTEST; no non-standalone detection or banner code. | |
| 5.6 | 🍒 and 🥞 are not single units | Accepted (swap) | Remove 🍒 and 🥞 from the allowlist; add 🍌 banana and 🍊 tangerine (Unicode 6.0). Mimsy → 🍞 / 🍊, Wobbleton → 🍦 / 🍌. Edit `SPEC` §7.1, §7.2, `scripts/emoji-versions.json` and any food tests. | D? |
| 5.9 | Static layout mock at the start of M1 | Accepted | First M1 step: static layout mock (1194×834 and 844×390) checking tray busyness, the CountTogether bubble width (≈ 420 px vs 400 px zone) and the "taken away" row slot (2.4b); stop for the owner's OK before building interaction. | |
| 5.10 | Family details in a public repo | Accepted (generalize fully) | Rewrite wording in current files to "the child", "a younger sibling", "a parent's phone"; drop specific ages, sexes, grade and device ownership (SPEC, DECISIONS D9/D16, OPEN_ITEMS, CLAUDE.md, README). Git history already contains the old wording; not rewritten. D16's design content stays (known facts, level) in generic terms. | D? |
| 4.5h | iOS version baseline | Accepted (default) | Baseline iOS 15.4+ and a recent Chrome on Android; `navigator.audioSession` (iOS 17+) stays a progressive enhancement. Change `SPEC` §2 "iOS 14+". The owner's actual device list is still not recorded (OPEN_ITEMS "Device details"); revisit if an older device must work. | D? |
| 5.1 | CSP vs dev server | Accepted | CSP meta tag emitted in production builds only; `build.assetsInlineLimit: 0` (or `font-src 'self' data:`). PLAN.md risk. | |
| 5.2 | Back guard needs user activation | Accepted | Push the guard history entry from inside a tap (the Splash tap) and again after each in-app navigation. PLAN.md risk; amend D19. | |
| 5.3 | Sharing / importing the export file | Accepted | `navigator.canShare({files})` check; fall back to text/plain with a `.json` name or a download; permissive `accept` on iOS file inputs. PLAN.md risk. | |
| 5.4 | Speech timeout formula | Accepted | Replace `clamp(600, 70·chars, 6000)` with about `clamp(1200, 400 + 90·chars/rate, 8000)`; tune on the iPad. Edit `SPEC` §8.1. | |
| 5.5 | Emoji fonts in CI/screenshots | Accepted | Install Noto Color Emoji in the e2e environment; PLAYTEST says emoji appearance is judged on real devices only. | |
| 5.7 | Performance gate | Accepted | The 4× CPU-throttle check becomes a report, not a blocking gate; smoothness judged on the iPad at the M2 playtest. | |
| 5.8 | M0 Home Screen install acceptance | Accepted | Move "installs to Home Screen and launches standalone" from agent acceptance to an owner check in PLAYTEST.md. | |
| 6a | Split M3 | Accepted | M3a = event log, replay, fact boxes, per-skill stage/ops settings, resume; M3b = optional play-time limit and lock, parent gate, parent area, export/reset/import. Each ends with its own playtest stop. Edit `SPEC` §14 and the Tier 1 estimate (D20). | D? |
| 6b | Defer migrations framework and snapshot rotation | Accepted | Ship `schemaVersion: 1` with an empty migration list and its test harness; the first real migration is written at the first schema change (CLAUDE.md rule still applies from then). One snapshot in Tier 1; rotation later. Edit `SPEC` §11 and M3 acceptance. | D? |
| 6c | Narrow M1 e2e; freeze event shapes in M1 | Accepted (both) | M1: tap in landscape on Chromium plus one WebKit iPad project, `toStageCoords` unit-tested for portrait; full device matrix and CDP drag in rotated portrait move to M2. `attempt` and `coin` event shapes (with the 2.2 outcomes) are fixed in M1 so M3 just writes them. Edit M1/M2 acceptance. | D? |
| 6d | Hand-authored monster SVGs | Accepted | M2: six hand-authored SVGs with expression variants (idle, delight, eat, puzzled, sleepy); keep the `MonsterSpec` data shape so art can be swapped or made procedural later. Edit `SPEC` §7.2 (drop the procedural-parts description from Tier 1). | D? |
| 7a | Garnish choice after each correct serve | Accepted (Tier 2 backlog) | Add to the "Later ideas" list in `SPEC` §14; revisit after the M2 playtest. | |
| 7b | Let her name the monsters | Deferred | Keep placeholder names through M2; in-app rename stays with M7 (focus list). OPEN_ITEMS #3 stays open. | |
| 7c | Monster album | Accepted (Tier 2 backlog) | Later idea, best after the shop/guests (M4). | |
| 7d | Decorated café as the Service background | Accepted | State in `SPEC` §7.4 that the Service screen uses the decorated café; add "purchases appear on the Service screen" to M4 acceptance. | |
| 7e | Returning-monster story for requeues | Covered by 4.5c | See 4.5c. | |
| 4.4 | First tutorial order | Already resolved | D26 already fixes the warm-up as `2 + 1` and writes no `attempt` event. No action. | |

---

## 1. Overall verdict

This is an unusually strong spec. The core teaching idea holds up: the child builds the answer on a ten-frame, the support fades over four stages, nothing ever punishes her, and coins reward effort. It is grounded in good early-math practice, and the spec explains why each choice was made. The engineering plan is careful too. It covers the iOS quirks that sink most kids' web games: speech that never fires `end`, silent-switch audio, storage eviction, the shared GitHub Pages origin, and the PWA reloading mid-game. Separating the pure engine from the UI, and keeping progress as an event log, are both good calls.

I checked every pool size in the §4 table by script. All of them are correct (A1 20, A2 70, A3 36, A4 135, A5 54, A6 108, A7 36/20, A8 36, B1 234, B2 684). The rotation transform in §2.2 is also correct, and the tap-target arithmetic in §2.2 adds up.

The problems I found fall into three groups, roughly in order of importance:

1. **A few rules contradict each other.** Examples: FollowMe auto-rings the bell, which the "never auto-serve" invariant forbids; start-unknown forms appear in A3/A4 although D1 moved them to the backlog; the requeue notation runs backwards. These are cheap to fix now and expensive to discover mid-build.
2. **Some situations have no rule.** Examples: how a resumed service records coins, and what the very first tutorial order should be.
3. **Tier 1 is very tight for ≈ 10.5 hours.** The scope is good; the estimate is optimistic. A few small cuts or re-sequencings would protect the goal of having a playable game.

Each finding below gives the spec section, the issue, and a suggested fix. Section 7 is a short prioritized checklist.

---

## 2. Pedagogy and the mastery model

### 2.1 S3 and S2 measure counting, not arithmetic (important)

At S3 and S2 (§3.2), the first operand is prefilled and locked, and she adds the second. For `5 + 3`, she places three items and the tray reaches 8 on its own. She never has to know the answer is 8. She only has to count out three. Subtraction result forms work the same way: remove 3 from 8 and 5 is left by construction. Only the missing-amount forms (A3 `7 + ? = 10`, A4) require her to aim at a target.

This matters for the **fact boxes** (§4.2): "first-try correct → box+1" applies at every stage. Facts she has only counted out will climb to box 2–3. They then get sampled less often (weights `[5,3,2,1,0.5]`) even though she has not shown she knows them. Because the parent sets the stage and S3 is the default, a skill can stay at S3 for weeks and its boxes would drift up on counting alone.

**Suggested fix** (needs a DECISIONS entry):
- Only S1 and S0 first-try results move fact boxes.
- Optional, and a bigger change: make S2 diagnostic. After she builds, she taps the total on a small number strip (see §4.2). That ties quantity to numeral, which is exactly the representational step between S2 and S1, and it makes S2 accuracy mean something.

### 2.2 "Wrong then fixed" is ambiguous

§4.2 says "correctAfterHint → stays; resolvedAssisted *or wrong-then-fixed* → box = 0." But §3.4 has only three outcomes (`firstTry | correctAfterHint | resolvedAssisted`). The common case is: wrong first serve, CountTogether plays, correct second serve. That case could be "afterHint" (box stays) or "wrong-then-fixed" (box resets). Pick one and add it to the outcome enum. My suggestion: a wrong first serve resets the box to 0 regardless, and "afterHint" means she pressed Help *before* her first serve.

Two related clarifications:
- Does pressing Help at attempt 1 advance her to attempt 2? Otherwise, Help followed by a wrong serve would play CountTogether twice.
- The outcome names differ between §3.4 (`firstTry/correctAfterHint/resolvedAssisted`) and the persisted event in §11.2 (`first/afterHint/assisted`). Since events are persisted, pick one spelling now.

### 2.3 New facts have no introduction order or cap

D17 says near-doubles and 9+x are introduced first, and §4 gives difficulty ordering. But the sampler (§4.1 step 4) gives every new fact weight 5 regardless of difficulty. So a fresh A2 service is as likely to draw 2+7 as 3+4. Add a rule: new facts are introduced in difficulty order, with at most 2–3 new facts per service. Without it, the near-doubles-first strategy will not actually happen.

The "half weight" sharing between a fact and its commuted partner (§4.2) is also undefined for integer boxes. A simple version: one canonical box per unordered pair, and drop the "half weight" wording.

### 2.4 Subtraction: remove from the end, and show what was removed

- **Removal order.** §3.3 lets her tap *any* placed item to remove it, which leaves holes in random places. After taking 3 from 8, the remaining 5 might be scattered across the frame instead of forming a full top row. That works against the five-wall subitizing the spec calls non-negotiable (§1.3), and against the back-through-ten demo. Suggest mirroring D5: a remove action always takes the *last* filled cell (the tapped item can still fly, but the frame stays canonical).
- **The answer to `7 − ? = 5` disappears.** At S3/S2 she removes 2 and they fly to the fridge. The tray shows 5, but the answer is the 2 she removed, which is no longer visible. For A3 `10 − ? = a` and A4, keep removed items in a small visible "taken away" row by the fridge so the unknown stays on screen. CountTogether and the demos should point to that row.

### 2.5 Tap-to-count will delete items (important for a 5-year-old)

Young children count by touching each object. On this tray, tapping a placed item removes it (§3.3, "tap a placed item (undo)"). Her natural way of checking her work will undo it, and she will not understand why the count keeps changing. Suggestions:
- In `add` mode, tapping a placed item makes it hop and say its position number (a counting aid). Removal happens by dragging it back to the bin or tapping a single "take one back" button.
- In `remove` mode, tapping still removes. That is the action being taught, and the reverse-order rule above keeps it tidy.

Add "does she count by touching?" to the PLAYTEST checklist either way.

### 2.6 Specific feedback after a wrong serve

CountTogether (§5.5) models the correct problem but never mentions what she actually served. For a 5-year-old, the most useful single sentence is about her plate: "I see seven… I wanted eight. One more!" This stays within the no-punishment rules (no red X, no buzzer) and tells her exactly how to fix it. Suggest the monster counts her plate aloud first, then the model bubble plays.

### 2.7 Vocabulary: "minus" and "equals what?"

The spoken forms (§4) use "minus" and "equals what?". Many Grade 1 programs start with "take away" and "makes" or "is". She already solves take-away word problems, so "Eight take away three is…?" connects to what she knows. Check which words her book uses and make the phrase table follow it. This is a one-line change in `phrases.ts`, and it is not the reading-load issue that led to declining story tickets (D21), because it is spoken only. A similar light option is to wrap the ticket in the café frame: "Three plus two cookies, please!" That gives the number sentence a meaning without adding text to read.

### 2.8 Smaller pedagogy notes

- **The `+0` "known" toggle** (§4.2, §12 Skills) does nothing, because every `n+0` is excluded from the pools (D11). Remove it, or note that it is reserved for the zero lesson.
- **Response time** is recorded (`attempt.ms`, §11.2) but never used. A median S0 time per skill in the parent Progress tab is cheap, never shown to her, and the best single sign that a fact has moved from counting to recall.
- **Spacing.** Boxes only change sampling weights; there are no due dates. That is fine for v1, but §1.1 point 5 claims "spaced" practice. Either add a simple "not seen for N days → weight up" rule, or soften the claim.

---

## 3. Contradictions and errors in the documents

| # | Where | Issue | Suggested resolution |
|---|---|---|---|
| C1 | §5.5 FollowMe vs. §1.3, D4, CLAUDE.md invariants | FollowMe says "Bell then rings automatically ('assisted serve')"; the invariant says serving is *always* an explicit bell press. | Make the bell pulse and have her press it. This keeps the invariant and teaches the bell again. |
| C2 | §1.2 A3/A4 table vs. D1(d) and the "Mystery Orders" row | A3 includes `?+a=10` and A4 includes `?+a=c`. Mystery Orders (backlog) uses `? + 3 = 8` as its example of the start-unknown form D1 moved out of v1. | Decide whether `? + a = c` (addition only, where it is just a commuted missing addend) is in. If yes, say so in D1 and change the Mystery Orders example to subtraction only (`? − 3 = 5`). If no, drop those forms and update the pool counts (A3 → 27, A4 → 90). |
| C3 | §3.4 "requeue(stage−1)", §4.1 step 7 "stage−1 (min S3)" | Stage numbers go *up* with support (S3 is the most help), so "stage−1, min S3" cannot happen. | Write "one step more support (stage+1, capped at S3)". |
| C4 | §3.3 Frames | "Cells 1–5 of each row are tinted A, 6–10 tinted B," but a row only has 5 cells. | "Top row (cells 1–5) tint A, bottom row (6–10) tint B, in each frame." |
| C5 | §10 | The shop total is stated as "≈ 1,600 coins". The listed prices add up to **1,340**. | Fix the number. At 23 coins per service it is still about 58 services, so the pacing claim holds. |
| C6 | §14 M3 acceptance vs. §12 | M3 accepts "stage override changes the next service," but §12 says the Tier 1 parent area has no Skills tab (stage override is M7). | Either add a stage-override control to the M3 parent area (useful while playtesting) or move this criterion to M7. I'd add it; it is small and it helps the owner tune things. |
| C8 | §3.1 types | `operands: number[]` "with `null` for the blank" (type should be `(number \| null)[]`); the `Unknown` type is defined but never used. | Tidy the types; the spec says types are authoritative. |
| C9 | §2.3 vs. §5.8 / §11.6 | §2.3 says a reloaded page resumes the service; §5.8 and §11.6 say the app *offers* "Continue dinner service?". | Use the offer everywhere, and suppress it when the café is locked. |
| C10 | DECISIONS.md D9 | D9 says profiles are milestone M9; the spec and OPEN_ITEMS say M11 (M9 is stretch skills). | Update D9. |
| C12 | DECISIONS.md residual risks | Still refers to "the 20 h figure." | Update to the Tier 1 ≈ 10.5 h framing (D20). |
| C13 | §6.1 vs. D7 | Play-time options are listed as "none / 5 / 15 / 10 / 20." | Put them in order. Trivial, but it will be copied into UI code. |
| C14 | OPEN_ITEMS | The open-items table jumps from #1 to #3. | Renumber. |

(C7 and C11 are omitted; the other row numbers are kept stable for cross-references.)

---

## 4. Gaps: situations with no rule yet

### 4.1 Coins on resume, and coins when the app is killed

- `serviceEnd` carries the service's coins, and earned coins are summed over *distinct* `svc` (§11.2). If she leaves mid-service (a partial `serviceEnd` for `svc X`) and then resumes and finishes, a second `serviceEnd` for `svc X` appears. Which one counts? As written, one set of coins is silently dropped.
- If iOS kills the app mid-service, no `serviceEnd` is written at all. She saw coins fly into the jar (§5.6), and they vanish. That breaks the spirit of "coins only ever go down through a purchase."

**Suggested fix:** put the per-monster coins on the `attempt` event (or a small `coin` event written in the same transaction as each completed problem, which §11.3 already does). `serviceEnd` then carries only the tip. Coins become exactly what she saw.

### 4.2 The S0 number pad doesn't fit, and its slots leak the answer

- §5.4 asks for a "3×4 grid, buttons ≥ 120 px" in place of the bin and tray (y ≈ 310–700, about 390 logical px tall). Four rows of 120 px buttons plus gaps need about 500 px. A phone-style keypad doesn't fit. Laid out three rows tall it fits only barely, with no room for the answer display.
- "Two digit slots 'tens | ones' for ≥ 10" means the number of slots tells her whether the answer is above 9.

**Suggestion:** a single row of ten digit buttons, 0 through 9, left to right (10 × 112 px fits in 1280 with gaps), plus one answer display that always accepts up to two digits, and a backspace. A row of digits in order also works as a small number line, which is pedagogically better than a phone keypad. It also gives you the "tap the total" strip for an optional diagnostic S2 (§2.1 above).

### 4.3 Allowance edge cases (§6)

- **The usual hand-off will end mid-service.** A 15-minute allowance with services of 8–10 minutes means the second service gets cut off almost every time. Children handle a predictable ending much better than a sudden one. Suggest a "last customer" rule: when the remaining time is less than about one order's typical length (tune in playtest), the waiting silhouettes wave and leave, the current monster is announced as the last customer, and closing follows naturally. Also consider not starting a new service unless at least half a service of time remains; offer a shorter one instead.
- **The tip when time runs out:** state that the +5 service tip is paid when the allowance closes the café. Closing time was not her choice.
- **The 60 s cue** animates the door sign, which is also the leave button (§5.4). Moving it invites her to tap it. Use Pip yawning or the lights dimming instead.
- **The 90 s grace cap** (§6.2): say what happens when it is reached (the monster leaves happily, no attempt is recorded, the fact keeps its box). Also say how a requeue left pending at the cap is recorded.
- **Resume while locked:** no "Continue dinner service?" offer while the café is locked. After a parent unlocks, offer it.
- **Idle with no prompt:** apart from Pip's hat (Help button) pulse at S3 after 10 s, nothing nudges her if she stalls. A gentle repeat of the ticket after about 20 s at every stage would help (spoken only, no countdown).

### 4.4 The first tutorial order

The ghost hand taps the bin *once* and then the bell (§5.4). On a random A1 problem such as 3 + 2, that demonstrates a *wrong* serve. Make the tutorial order a designated `n + 1` fact (she knows +1, so it is safe), and keep it out of the mastery data.

### 4.5 Other small gaps

- **Capacity in `frames1`:** §3.3 gives a capacity of 20 for the A-track. With one frame on screen, can she overfill past 10, and does a second frame appear? Suggest the single-frame capacity is 10, with the same wobble.
- **Ticket colors when the blank comes first** (`? + 4 = 14`, A5): §5.4 says "first operand blue," but here the first operand is the blank. Define the color by the tray's *prefilled* group instead of by position.
- **Requeued monster:** is it the same monster coming back ("Blobbo's still hungry!") or a new one? Do requeue monsters pay +3? §9's "23 coins for 6 monsters" suggests not, but it should say so.
- **The easy-reader word list** (§13.2) needs a named source that is committed to the repo (for example the Fry 1,000 instant words), or the lint can't be built.
- **Export checksum** (§11.6): name the algorithm (SHA-256 via SubtleCrypto is fine on HTTPS).
- **Safari tab vs. Home Screen storage:** on iOS, a Home Screen web app has *separate* storage from the same site in a Safari tab. If she plays in Safari first and the app is installed later, her progress won't carry over. Add a parent-facing note ("install before first play"). Consider having the parent area detect non-standalone mode on iOS and say so.
- **Hidden debug route** (M0 acceptance): §15 forbids path routing, so specify a query flag or hash (`?debug`).
- **iOS version baseline:** the spec targets iOS 14+, but `100dvh` and `crypto.randomUUID` need iOS 15.4+, and `navigator.audioSession` needs iOS 17+. The spec already has fallbacks for some of these. Answering the open device-model question (OPEN_ITEMS, "Device details") *before M0* lets Claude Code set a real baseline.

---

## 5. Build and platform risks the spec doesn't mention yet

1. **CSP vs. the dev server.** The React Vite plugin injects an inline `<script>` preamble for hot reload in dev, which `default-src 'self'` blocks. Emit the CSP meta tag in production builds only. Also, Vite inlines small assets as `data:` URIs, so a small font subset would be blocked by the default `font-src`. Set `build.assetsInlineLimit: 0`, or add `font-src 'self' data:`.
2. **Chrome skips history entries made without a user gesture.** The back guard (§2.3, D19) pushes history entries. Chrome's history intervention can skip entries pushed without user activation, so the back gesture would leave the app anyway. Push the guard entry from inside a tap handler (the Splash tap is ideal) and again after each in-app navigation.
3. **Sharing a `.json` file.** Chrome on Android only shares an allowlist of file types through the Web Share API, and JSON may not be on it. Check with `navigator.canShare({ files })`, and fall back to `text/plain` with a `.json` name, or to a download. On iOS, a file input with a narrow `accept` can grey out the file in the Files picker; use a permissive `accept`.
4. **The speech timeout is shorter than the speech.** `clamp(600, 70 ms × chars, 6000)` (§8.1) assumes about 14 characters per second, but the default rate is 0.85 and iOS adds start-up latency. A 28-character ticket gets a 1.96 s timeout and takes more like 2.5–3 s to speak. The game moves on, the next `cancel()` cuts the sentence off, and she hears clipped lines. Suggest something like `clamp(1200, 400 + 90 ms × chars / rate, 8000)`, tuned on the iPad.
5. **Color emoji in CI and screenshots.** Headless Chromium on a Linux runner (or a minimal Windows setup) may show empty boxes for emoji unless a color-emoji font is installed. The screenshots will also differ from what iOS shows. Note in PLAYTEST that emoji appearance is only judged on real devices, and make sure the e2e environment has Noto Color Emoji.
6. **The two-cherry problem.** 🍒 shows *two* cherries and 🥞 shows a *stack* of pancakes. A child counting "seven cherries" sees fourteen. For a counting game, each glyph must be one obvious unit. Drop 🍒 and 🥞 (or re-label them "cherry pairs" / "pancake stacks", which is worse). That means new favorites for Mimsy and Wobbleton (§7.2). There are enough single-unit foods on the allowlist.
7. **Performance gate on a desktop CPU.** A 4×-throttled Chromium run on a fast Windows machine says little about an iPad 6, and frame-rate tests on shared machines are flaky. Keep it as a report rather than a blocking gate. Judge smoothness on the real iPad in the M2 playtest.
8. **M0 acceptance can't be verified by the agent.** "Installs to iPad and iPhone Home Screens and launches standalone" depends on the owner pushing to GitHub and testing on a device. Move it to PLAYTEST.md as an owner check, in line with CLAUDE.md's "don't claim it works on a real iPad."
9. **Two color systems on one tray.** Cells are tinted for the five-wall and items are ringed blue/orange for the operands. With emoji on top, the tray could get busy. Have Claude Code produce a static layout mock at the start of M1 (a screenshot at 1194×834 and 844×390) before building interaction. The same mock should check that the CountTogether bubble fits: two 36-px mini frames are about 420 px wide, slightly more than the 400 px monster zone.
10. **Public repo and family details.** §15 says the repo contains no personal data. But SPEC, DECISIONS and OPEN_ITEMS describe your children's ages, sexes, school grade and which family member owns which phone. That is mild, but it will be public on GitHub Pages' source repo. Consider generalizing the wording ("the child," "a younger sibling") before the first push.

---

## 6. Scope and the Tier 1 estimate

The scope of Tier 1 is right: A1–A3, monsters, sound, saved progress, and a working allowance lock. That is a real game that matches her book. The ≈ 10.5-hour estimate is the weak point. M3 alone (2 h) covers the event log, replay, migrations, snapshots, Leitner boxes, the allowance clock and lock with all the §6.5 tests, the parent gate, a parent area, export/reset/import and resume. M1 (3.5 h) puts drag, speech, three demos and four stages for two skills behind e2e tests in both orientations. The review log already says "expect M1 to run over."

Since there is no hard hour cap (D20), the risk isn't the budget. The risk is a milestone that runs long and ends with many half-finished pieces. Suggestions, none of which change what she gets:

- **Split M3** into M3a (persistence, fact boxes) and M3b (allowance, lock, parent gate, minimal parent area, export/reset). Each gets its own playtest stop. M3b is what makes hand-off safe, so it deserves its own check.
- **Defer things that only protect future milestones:** the migrations framework (ship `schemaVersion: 1` with an empty migration list and its test harness; the first real migration is when you need it), snapshot rotation (one snapshot is enough for Tier 1), and the easy-reader word-list lint (add in M10).
- **Narrow the M1 e2e matrix:** the full device matrix and CDP drag in rotated portrait can arrive in M2. In M1, prove tap in landscape on Chromium plus one WebKit iPad project, and unit-test `toStageCoords` for portrait.
- **Simplify the M2 monsters:** the procedural parts system (§7.2) is a nice idea, but six hand-drawn SVGs with a few expression variants would be faster and probably look better. Keep the `MonsterSpec` shape so it can be swapped later.
- **Fix the attempt-event shape in M1**, even though persistence lands in M3, so M3 just writes what M1/M2 already produce.

Ask Claude Code to put an explicit "spec errata" section in `PLAN.md` listing the resolutions from §3 and §4 of this report. That way the owner approves them in one pass instead of discovering them milestone by milestone.

---

## 7. Making it more fun (optional, low cost)

The loop is sound but repetitive: monster arrives, build, bell, eat, coins, six times. These ideas add variety without adding math pressure or new mechanics that need their own tests:

- **A moment of choice after each correct serve.** For example, she picks a garnish (sprinkles, a cherry on top, a flag) for the plate before it goes to the monster. It is quick, has nothing to do with correctness, and gives her ownership of each order.
- **Let her name the monsters.** OPEN_ITEMS #3 suggests it. Do it before M2 so the names are in the voice lines. Children care much more about characters they named.
- **A monster album.** A page of monster portraits that fills in as she serves each one (with the two guests as silhouettes until they visit). It gives her a long-term collection goal next to the shop, without streaks or daily pressure.
- **Make sure purchases appear where she plays.** The service screen should use the decorated café as its background (§7.4 implies this; state it), so what she buys is visible during the game, not only on Home.
- **Returning-monster story for requeues.** "Blobbo's back — still hungry!" turns a requeued problem into a little story instead of an unexplained repeat.

Leave out anything timed, scored or competitive. The spec is right to exclude them.

---

## 8. Prioritized checklist

**Fix before building (spec edits, about an hour of the owner's time):**
1. Mastery signal: S3/S2 don't move fact boxes (§2.1).
2. FollowMe bell: she presses it (C1).
3. Decide on `? + a = c` forms in A3/A4 (C2).
4. Requeue notation (C3); outcome definitions and names (§2.2).
5. Coins written per completed problem, not only on `serviceEnd` (§4.1).
6. S0 pad layout: a single 0–9 row with one display (§4.2).
7. Tutorial order = `n + 1` (§4.4).
8. Drop 🍒 and 🥞 (§5 item 6).
9. Answer the device/iOS-version open item.

**Decide during PLAN.md review:**
10. Tap-to-count vs. tap-to-remove (§2.5); remove-from-end (§2.4).
11. "Last customer" ending and tip on allowance close (§4.3).
12. Split M3; defer migrations, snapshot rotation and word-list lint (§6).
13. "Take away" vs. "minus" wording, after checking her book (§2.7).
14. New-fact introduction order and cap (§2.3).

**Hand to Claude Code as known platform risks** (put them in PLAN.md risks): CSP in dev, back-guard user activation, JSON share type, speech timeout formula, emoji fonts in CI, Safari-vs-Home-Screen storage (§5, §4.5).

**Tidy-ups:** C4–C14.

None of these undermine the design. Most are a sentence or two in the spec. Settling them now means Claude Code spends its hours building, not guessing, and the game will measure what she actually knows.
