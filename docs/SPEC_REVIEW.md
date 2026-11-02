# Spec Review — Number Chef: Monster Cafe

Reviewed: `CLAUDE.md`, `docs/SPEC.md` (v1.0), `docs/DECISIONS.md` (D1–D21 and review log), `docs/OPEN_ITEMS.md`, `docs/KICKOFF.md`.
Date: 2026-11-02.

---

## 1. Overall verdict

This is an unusually strong spec. The core teaching idea holds up: the child builds the answer on a ten-frame, the support fades over four stages, nothing ever punishes her, and coins reward effort. It is grounded in good early-math practice, and the spec explains why each choice was made. The engineering plan is careful too. It covers the iOS quirks that sink most kids' web games: speech that never fires `end`, silent-switch audio, storage eviction, the shared GitHub Pages origin, and the PWA reloading mid-game. Separating the pure engine from the UI, and keeping progress as an event log, are both good calls.

I checked every pool size in the §4 table by script. All of them are correct (A1 20, A2 70, A3 36, A4 135, A5 54, A6 108, A7 36/20, A8 36, B1 234, B2 684). The rotation transform in §2.2 is also correct, and the tap-target arithmetic in §2.2 adds up.

The problems I found fall into four groups, roughly in order of importance:

1. **The mastery signal is weaker than the spec assumes.** At the two most-supported stages, success shows she can count, not that she can add or subtract. Because of how hats and Chef's Pick are wired, she could climb the ladder much faster than she is actually learning (§2 below). This is the one finding I would fix before any code is written.
2. **A few rules contradict each other.** Examples: FollowMe auto-rings the bell, which the "never auto-serve" invariant forbids; start-unknown forms appear in A3/A4 although D1 moved them to the backlog; the requeue notation runs backwards. These are cheap to fix now and expensive to discover mid-build.
3. **Some situations have no rule.** Examples: what Chef's Pick does when the next skill hasn't been built yet, how a resumed service records coins, and what the very first tutorial order should be.
4. **Tier 1 is very tight for ≈ 10.5 hours.** The scope is good; the estimate is optimistic. A few small cuts or re-sequencings would protect the goal of having a playable game.

Each finding below gives the spec section, the issue, and a suggested fix. Section 7 is a short prioritized checklist.

---

## 2. Pedagogy and the mastery model

### 2.1 S3 and S2 measure counting, not arithmetic (important)

At S3 and S2 (§3.2), the first operand is prefilled and locked, and she adds the second. For `5 + 3`, she places three items and the tray reaches 8 on its own. She never has to know the answer is 8. She only has to count out three. Subtraction result forms work the same way: remove 3 from 8 and 5 is left by construction. Only the missing-amount forms (A3 `7 + ? = 10`, A4) require her to aim at a target.

This matters because three mechanisms treat S3/S2 success as evidence of learning:

- **Fact boxes** (§4.2): "first-try correct → box+1" applies at every stage. Facts she has only counted out will climb to box 2–3. They then get sampled less often (weights `[5,3,2,1,0.5]`) and count toward hat 3's "facts at box ≥ 2."
- **Fast-track** (§4.2): "first 6 attempts on a never-played skill are 6/6 → jump to S1." Any child who can count six items will pass this on almost every skill.
- **Hat 2 and Chef's Pick advancement** (§4.2): hat 2 is "stage has *ever been* ≤ 1." That means reaching S1, not succeeding there. Chef's Pick then moves past the skill. The spec says this means "she can build the answer from an empty tray," but the rule as written does not check that.

Put together, the likely path is: one or two services at A1, fast-track to S1, hats 1 and 2 (+20 coins), and Chef's Pick moves to A2 before she has answered a single A1 problem without support. Demotion (≤ 2/6 at S1) would eventually catch this, but by then the hats are permanent and the frontier has moved on. In Tier 1, with only A1–A3 built, she could run out of frontier in about a week.

**Suggested fix** (needs a DECISIONS entry, since it adjusts D3/D13):
- Only S1 and S0 first-try results move fact boxes. S3/S2 results still feed the stage window.
- Hat 2 = "promoted out of S1" (≥ 5/6 first-try at S1). This makes the hat mean what §4.2 says it means.
- Keep fast-track, but have it jump to S2 rather than S1, or require 6/6 at S2 to reach S1.
- Optional, and a bigger change: make S2 diagnostic. After she builds, she taps the total on a small number strip (see §4.4). That ties quantity to numeral, which is exactly the representational step between S2 and S1, and it makes S2 accuracy mean something.

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

- **Fluency.** S1 and S0 are only reached through Chef's Pick's two review slots once the frontier moves on (§4.1 step 3). Promotion S1 → S0 and hat 3 will take many services. That is fine if §2.1 is fixed, because the frontier won't move until S1 is solid. Otherwise S0 fluency practice will be thin.
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
| C7 | §14 M2 vs. M3 | M2 requires "Open the Café → … starts at A1," but Chef's Pick does not exist until M3. | State the M2 interim rule (Open the Café = A1 for now). |
| C8 | §3.1 types | `operands: number[]` "with `null` for the blank" (type should be `(number \| null)[]`); the `Unknown` type is defined but never used. | Tidy the types; the spec says types are authoritative. |
| C9 | §2.3 vs. §5.8 / §11.6 | §2.3 says a reloaded page resumes the service; §5.8 and §11.6 say the app *offers* "Continue dinner service?". | Use the offer everywhere, and suppress it when the café is locked. |
| C10 | DECISIONS.md D9 | D9 says profiles are milestone M9; the spec and OPEN_ITEMS say M11 (M9 is stretch skills). | Update D9. |
| C11 | DECISIONS.md review row 25 | Says "Chef's Pick starts at A2"; D16 and §4.2 say A1. | Mark row 25 as superseded by D16. |
| C12 | DECISIONS.md residual risks | Still refers to "the 20 h figure." | Update to the Tier 1 ≈ 10.5 h framing (D20). |
| C13 | §6.1 vs. D7 | Play-time options are listed as "none / 5 / 15 / 10 / 20." | Put them in order. Trivial, but it will be copied into UI code. |
| C14 | OPEN_ITEMS | The open-items table jumps from #1 to #3. | Renumber. |

---

## 4. Gaps: situations with no rule yet

### 4.1 Chef's Pick when the next skill doesn't exist

- **Review of the "previous skill"** (§4.1 step 3) when the frontier is A1: the previous skill is A0, which is assumed known (§4.2) and, more importantly, not built until M5. In Tier 1 there is nothing to draw from. Add a fallback: if no earlier built skill exists, use an opener (box ≥ 2 fact) or another frontier item.
- **Frontier past the last built skill:** once A3 has 2 hats in Tier 1, the "first skill with hats < 2" is A4, which doesn't exist. Rule: the frontier is capped at the highest built and unhidden skill. When she is at the cap, Chef's Pick should mix review across built skills with a bias toward the lowest stage.
- **Two tracks:** it's not stated whether Chef's Pick ever recommends B1/B2, or how it orders A and B skills. Say so explicitly. My suggestion: Chef's Pick stays on the Little Menu until A5 has 2 hats, then alternates.

### 4.2 When stage changes take effect

A promotion or demotion can happen in the middle of a service (six attempts can fill the window). If it applies right away, the tray changes form between monsters. Suggest: stage changes take effect at the *next* service. A child does better with a stable screen within one sitting, and replays become easier to reason about.

### 4.3 Coins on resume, and coins when the app is killed

- `serviceEnd` carries the service's coins, and earned coins are summed over *distinct* `svc` (§11.2). If she leaves mid-service (a partial `serviceEnd` for `svc X`) and then resumes and finishes, a second `serviceEnd` for `svc X` appears. Which one counts? As written, one set of coins is silently dropped.
- If iOS kills the app mid-service, no `serviceEnd` is written at all. She saw coins fly into the jar (§5.6), and they vanish. That breaks the spirit of "coins only ever go down through a purchase."

**Suggested fix:** put the per-monster coins on the `attempt` event (or a small `coin` event written in the same transaction as each completed problem, which §11.3 already does). `serviceEnd` then carries only the tip. Coins become exactly what she saw.

### 4.4 The S0 number pad doesn't fit, and its slots leak the answer

- §5.4 asks for a "3×4 grid, buttons ≥ 120 px" in place of the bin and tray (y ≈ 310–700, about 390 logical px tall). Four rows of 120 px buttons plus gaps need about 500 px. A phone-style keypad doesn't fit. Laid out three rows tall it fits only barely, with no room for the answer display.
- "Two digit slots 'tens | ones' for ≥ 10" means the number of slots tells her whether the answer is above 9.

**Suggestion:** a single row of ten digit buttons, 0 through 9, left to right (10 × 112 px fits in 1280 with gaps), plus one answer display that always accepts up to two digits, and a backspace. A row of digits in order also works as a small number line, which is pedagogically better than a phone keypad. It also gives you the "tap the total" strip for an optional diagnostic S2 (§2.1 above).

### 4.5 Allowance edge cases (§6)

- **The usual hand-off will end mid-service.** A 15-minute allowance with services of 8–10 minutes means the second service gets cut off almost every time. Children handle a predictable ending much better than a sudden one. Suggest a "last customer" rule: when the remaining time is less than about one order's typical length (tune in playtest), the waiting silhouettes wave and leave, the current monster is announced as the last customer, and closing follows naturally. Also consider not starting a new service unless at least half a service of time remains; offer a shorter one instead.
- **The tip when time runs out:** state that the +5 service tip is paid when the allowance closes the café. Closing time was not her choice.
- **The 60 s cue** animates the door sign, which is also the leave button (§5.4). Moving it invites her to tap it. Use Pip yawning or the lights dimming instead.
- **The 90 s grace cap** (§6.2): say what happens when it is reached (the monster leaves happily, no attempt is recorded, the fact keeps its box). Also say how a requeue left pending at the cap is recorded.
- **Resume while locked:** no "Continue dinner service?" offer while the café is locked. After a parent unlocks, offer it.
- **Idle with no prompt:** apart from the S3 hat pulse after 10 s, nothing nudges her if she stalls. A gentle repeat of the ticket after about 20 s at every stage would help (spoken only, no countdown).

### 4.6 The first tutorial order

The ghost hand taps the bin *once* and then the bell (§5.4). On a random A1 problem such as 3 + 2, that demonstrates a *wrong* serve. Make the tutorial order a designated `n + 1` fact (she knows +1, so it is safe), and keep it out of the mastery data.

### 4.7 Other small gaps

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

The scope of Tier 1 is right: A1–A3, monsters, sound, saved progress, and a working allowance lock. That is a real game that matches her book. The ≈ 10.5-hour estimate is the weak point. M3 alone (2 h) covers the event log, replay, migrations, snapshots, Leitner boxes, stage promotion, Chef's Pick, hats, the allowance clock and lock with all the §6.5 tests, the parent gate, a parent area, export/reset/import and resume. M1 (3.5 h) puts drag, speech, three demos and four stages for two skills behind e2e tests in both orientations. The review log already says "expect M1 to run over."

Since there is no hard hour cap (D20), the risk isn't the budget. The risk is a milestone that runs long and ends with many half-finished pieces. Suggestions, none of which change what she gets:

- **Split M3** into M3a (persistence, mastery, Chef's Pick, hats) and M3b (allowance, lock, parent gate, minimal parent area, export/reset). Each gets its own playtest stop. M3b is what makes hand-off safe, so it deserves its own check.
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
- **Bigger hat celebrations.** Hats are the only marker of mastery she sees. A short ceremony with Pip placing the hat on the menu tile, shown on Results (§5.7 already reserves this), is worth the polish.

Leave out anything timed, scored or competitive. The spec is right to exclude them.

---

## 8. Prioritized checklist

**Fix before building (spec edits, about an hour of the owner's time):**
1. Mastery signal: S3/S2 don't move boxes; hat 2 = promoted out of S1; adjust fast-track (§2.1).
2. FollowMe bell: she presses it (C1).
3. Decide on `? + a = c` forms in A3/A4 (C2).
4. Requeue notation (C3); outcome definitions and names (§2.2).
5. Chef's Pick fallbacks for missing previous or next skills (§4.1).
6. Coins written per completed problem, not only on `serviceEnd` (§4.3).
7. S0 pad layout: a single 0–9 row with one display (§4.4).
8. Tutorial order = `n + 1` (§4.6).
9. Drop 🍒 and 🥞 (§5 item 6).
10. Answer the device/iOS-version open item.

**Decide during PLAN.md review:**
11. Tap-to-count vs. tap-to-remove (§2.5); remove-from-end (§2.4).
12. "Last customer" ending and tip on allowance close (§4.5).
13. Split M3; defer migrations, snapshot rotation and word-list lint (§6).
14. "Take away" vs. "minus" wording, after checking her book (§2.7).
15. New-fact introduction order and cap (§2.3).

**Hand to Claude Code as known platform risks** (put them in PLAN.md risks): CSP in dev, back-guard user activation, JSON share type, speech timeout formula, emoji fonts in CI, Safari-vs-Home-Screen storage (§5, §4.7).

**Tidy-ups:** C4–C14.

None of these undermine the design. Most are a sentence or two in the spec. Settling them now means Claude Code spends its hours building, not guessing, and the game will measure what she actually knows.
