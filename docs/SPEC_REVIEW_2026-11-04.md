# Final Spec Review — Number Chef Monsters (2026-11-04)

Reviewed: `CLAUDE.md`, `docs/SPEC.md` (v1.2), `docs/DECISIONS.md` (D1–D39 and review logs), `docs/OPEN_ITEMS.md`, `docs/KICKOFF.md`, `README.md`, and the earlier `docs/SPEC_REVIEW.md` (2026-11-02).

**Scope.** This review looks only for gaps, contradictions, errors, and problems with coherence or scope. It suggests no new features. Items that were already decided (D1–D39, and the decision log in `SPEC_REVIEW.md`) are not reopened. Where a finding touches a decided item, the problem is in how the decision was written into the spec, not in the decision itself. Each fix below is the smallest wording or scope change that resolves the problem.

**Re-checked and correct:** the pool sizes in §4 (A1 20, A2 70, A3 36, A4 135, A5 54, A6 108, A7 36/20, A8 36, B1 234, B2 684); the coin arithmetic (23 per service, 29 with two requeues); the shop total (1,340); tap-target scaling at 844×390 (0.54 scale gives 47.5 px cells and 60 px buttons, still at least 45/57 px after notch insets); the emoji allowlist (16 foods, each used once as a monster favorite, all Unicode ≤ 9.0).

---

## Decision log (owner walk-through in progress)

The owner is deciding every finding in chat, a few at a time. Each decision is recorded here as it is made. Once all chunks are done, the significant design changes go into `DECISIONS.md` (D40+) and the edits are applied to `SPEC.md` and the other docs. **Status: chunk 0 decided; nothing applied to `SPEC.md` yet.**

Status: **Accepted** = apply the fix as suggested · **Modified** = apply with the change noted · **Rejected** = no change · **Pending** = not yet decided.

**Chunk plan** (✅ = done)

| Chunk | Findings | Done |
|---|---|---|
| 0 | Q1–Q7 (R2, R1, R7, R10, S6, S9, S11) | ✅ |
| 1 | Teaching behavior: R3, R4, R5, R6 | |
| 2 | Engine and settings data: R8, R9, R11, S8 | |
| 3 | Allowance and screen-flow edges: S1, S2, S3, S5 | |
| 4 | Process and platform wording: S4, S7, S10, S12 | |
| 5 | Tier 2: T1–T6 | |
| 6 | Housekeeping: H1–H10 (batch) | |

**Decisions**

| ID | Finding | Status | Decision |
|---|---|---|---|
| R2 / Q1 | Resume offer after unlock | Accepted (default) | The lock clears the `resume` snapshot. Remove the post-unlock "Continue dinner service?" offer from §5.8, §6.2 step 6, §11.6, §6.5 and the §13.5 flow, and amend D33(f) and D39(g). Add: on boot, if a limit is on and `remainingMs ≤ 0`, lock and clear the snapshot. |
| R1 / Q2 | Requeue position and late misses | Accepted (default) | Requeues are exempt from the "last 4 problems" factKey window; "never adjacent" and "not the same monster twice in a row" still apply. A requeue that does not fit 3–5 problems later is appended to the end of the service (the service gets longer), with at least one other order in between when one exists. State whether a requeue adds a silhouette (§5.4). |
| R7 / Q3 | Restore in Tier 1 | Accepted (default) | M3b adds a basic Replace-only import (snapshot first; checksum and zod validation). Merge stays in M7. The M3b export→reset→import acceptance stays. |
| R10 / Q4 | Reset semantics | Accepted (default) | Tier 1 Reset: write a snapshot, then delete everything except the `snapshots` store. A later merge from an older export or another device may bring reset progress back; this is documented in the parent Help, not prevented. A parent-initiated reset is an explicit exception to "coins only go down through a purchase". |
| S6 / Q5 | Bigger reaction on first-try | Accepted (default) | Keep it. Record in DECISIONS as a deliberate, small exception to §1.1.7 (coins stay flat). |
| S9 / Q6 | Playtest channel | Accepted (default) | Milestone builds reach the devices by the owner pushing to `main` (the real app). Before real use, the parent resets playtest progress once. |
| S11 / Q7 | Tier 1 ≈ 10 h | Accepted (default) | ≈ 10 h is a guide; PLAN.md may exceed it. Reword §0, §14, CLAUDE.md and KICKOFF accordingly. |

---

## Summary

The spec is coherent and ready to build, apart from the items below. Eleven findings affect Tier 1 and should be settled before M0/M1, because PLAN.md and the tests would otherwise encode a contradiction. Most need only a sentence. Five of them need an owner decision; these are collected in §5.

| Group | Count | When to settle |
|---|---|---|
| §1 Tier 1 contradictions and gaps | 11 | Before PLAN.md is approved |
| §2 Smaller Tier 1 ambiguities | 12 | During PLAN.md review |
| §3 Tier 2 issues | 6 | Before the milestone that builds them |
| §4 Housekeeping | 10 | Any time; one pass |

---

## 1. Tier 1 contradictions and gaps (settle before PLAN.md)

### R1. Requeue positions break the no-repeat rule, and a late miss has no rule (§4.1 steps 5, 7, 8; §13.4)
- Step 5 says a `factKey` must not appear within the last 4 problems. Step 7 reinserts a requeue 3–5 problems later. At +3 or +4 the earlier attempt is still inside the 4-problem window, so only +5 satisfies both rules. §13.4 tests both rules as written, so those tests would conflict.
- A miss on order 5 or 6 of a 6-order service leaves no room 3–5 problems later. Step 8 ("service length = orders + requeues") implies the service is extended. Step 7 ("a requeue still pending when the service ends is dropped") implies it is dropped. The two readings give different services, coins and silhouette counts.
- **Fix:** exempt requeues from the factKey window (keep "never adjacent" and "not the same monster twice in a row"). State one rule for late misses: either the requeue is appended at the end (at least one other order in between when one exists), or it is dropped. Say whether a requeue adds a silhouette to the queue (§5.4). *Owner decision Q2.*

### R2. The resume offer after an unlock can never happen (§6.2 step 5 vs §5.8, §6.2 step 6, §11.6, §13.5, D33f, D39g)
- §6.2 step 5: when the café locks, "the `resume` snapshot is cleared". The lock always follows Results, so no snapshot is left either way.
- Yet §5.8, §6.2 step 6, §11.6, D33(f) and D39(g) all describe offering "Continue dinner service?" after a parent unlocks, with the 2 h window counting from the unlock. The §13.5 e2e flow requires it ("parent unlock → resume offer"). That test cannot pass against step 5.
- One real case has no rule: the app is killed during the last-customer wind-down or the 90 s grace period. On relaunch, `remainingMs ≤ 0`, the state is still `open`, and a resume snapshot exists.
- **Fix:** pick one. (a) The lock clears the snapshot, so delete the post-unlock offer from §5.8, §6.2.6, §11.6, the §13.5 flow and §6.5. (b) The lock keeps the snapshot and the offer appears after unlock. In both cases add: "on boot, if a limit is on and `remainingMs ≤ 0`, lock (and apply (a) or (b) to the snapshot)." *Owner decision Q1.*

### R3. S0 has no tray, but the help path assumes one (§3.2, §3.4, §5.4, §5.5)
- Worked "plays on the child's tray after it is cleared". FollowMe has the child "tap" the next pulsing cell. At S0 the number pad replaces the tray, so neither has anything to play on. M1 acceptance requires all four stages and the wrong→wrong→demo→follow-me path for A1/A2.
- It is unclear whether S0 still has the Help button (Pip's hat) as well as Peek. "Peek replaces Help's role as the concrete reveal" can be read either way, and Help at attempt 2 is the only way to reach Worked without a second wrong serve.
- §3.2's table says Peek "counts as assisted". §5.4 and D39(d) say Peek before the first serve counts as Help (`afterHint`). `assisted` is a persisted outcome with a box reset and a requeue, so these two rules lead to different data.
- The bell's "disabled while the tray equals its initial state" rule has no S0 equivalent (presumably "disabled while the display is empty").
- **Fix:** define the S0 help path. For example, Worked and FollowMe show the S3 tray under the lifted cloche, and FollowMe ends with the child typing the number and pressing the bell. Say whether Help exists at S0. Change §3.2 "counts as assisted" to "counts as Help (`afterHint` if then correct)". Add the empty-display bell rule.

### R4. Remove mode cannot undo an over-removal (§3.3, §5.5)
- In remove mode (subtraction result forms and missing-subtrahend forms at S3/S2), tapping removes. Nothing in the spec puts an item back. "Take one back" exists only in add mode, and §3.3 does not say whether the bin works in remove mode.
- After a wrong serve where the child took one too many, PlateCount says "One more!" and CountTogether leaves the tray "editable", but the child has no action that adds one. This is the main Tier 1 path: A1 subtraction only is the expected setting (D24), and A3 has `10 − a` and `10 − ? = a`.
- **Fix:** state how a removed item comes back in remove mode. For example, tapping the bin (or the taken-away row) returns the last removed item to the first empty cell. For missing-subtrahend forms, it comes from the taken-away row.

### R5. The doubles and near-doubles demos need a layout the tray never shows (§5.5 demo table, §1.3, §3.3)
- The demos say "two equal rows highlighted: three and three" and "two equal rows (six and six)". With the fixed 2×5 reading-order fill (which §1.3 calls non-negotiable), 3 + 3 fills one row of five plus one cell, and 6 + 6 spills into a second frame. The tray only ever shows two equal rows for 5 + 5.
- M1 builds the near-double demo, and A1/A2 contain doubles facts (2+2 … 5+5) tagged `doubles`. The `doubles` demo itself is not assigned to any Tier 1 milestone (M1 lists count-on, count-back and near-double; M2 adds make-ten). The "every pool item has a demo" test will force it in anyway.
- The bridge demo ("2 items slide from the second group into frame 1") describes a move that never happens: with first-empty-cell placement, those items are already in frame 1.
- **Fix:** describe doubles and near-doubles by the colored groups on the canonical tray ("three blue and three orange, the same"), or say these demos run in the model bubble with their own layout. Assign the `doubles` demo to M1. Reword the bridge demo as "the first two orange items fill the ten".

### R6. CountTogether cannot "end at the answer" for missing-amount forms (§5.5)
- CountTogether counts blue then orange "with running numbers, ending at the answer". For `7 + ? = 10` (A3, Tier 1) the running count ends at ten, the total, but the answer is three. The same applies to `10 − ? = a` and every A4 form.
- **Fix:** for missing-addend and missing-subtrahend forms, after the running count, count the orange group (or the taken-away row) from one ("one, two, three — three more") and end on that number. The make-ten demo already does this ("and three more makes ten").

### R7. Tier 1 has backup but no restore, yet M3b acceptance requires restore (§12, §14 M3b, M7)
- M3b scope: "basic Export JSON backup … Reset". Import, with Merge and Replace, is M7. M3b acceptance requires an "export→reset→import round trip", which cannot be done without import.
- Without import, a Tier 1 backup cannot be restored on the device it came from, which is exactly when it would be needed (eviction, reinstall).
- **Fix:** either add a basic import to M3b (Replace into an empty or reset device; Merge stays M7), or change the M3b acceptance to "export is valid and checksummed" and accept that Tier 1 has no restore. *Owner decision Q3.*

### R8. Parent controls exist before there is a way to reach them (§12, §14 M1–M3a)
- The parent gate and parent area arrive in M3b. M3a ships "a minimal Skills list" (stage and operations) and a progress list but does not say how they are reached.
- Earlier, M1 accepts "all four stages playable for A1 and A2", and the M1 playtest asks about "speed at S0 versus flash-card pace". Until M3a nothing lets the owner choose S0, or choose subtraction only for A1.
- **Fix:** name the interim path in §14. For example, the `?debug` screen offers stage and operations per skill until M3b, and the M3a Skills list is reached through the gear without a gate until the gate lands in M3b.

### R9. The operations filter list leaves out A3 and A4, which mix addition and subtraction (D24, §4.1 step 2/5, §3.1)
- D24 shows the both/add/sub filter "only for skills with both operations (A1, A2, A5, A6, B1, B2)". A3 has `a+?=10`, `?+a=10`, `10−a=?` and `10−?=a`, and A4 has `a+?=c`, `?+a=c` and `m−?=c`. Both mix operations. A3 is Tier 1.
- The ±1 balance rule uses "the skill's target ratio", but a target ratio is given only for A1 (~55/45).
- **Fix:** add A3 and A4 to D24's list (or state that their filter is fixed at both). State the default target ratio for every other skill (for example, the add/sub share of that skill's canonical pool, or 50/50).

### R10. "Reset" is not defined for an append-only, mergeable log (§12 Data, §11, §14 M3b)
- Tier 1 ships "Reset" without saying what it removes. Tier 2 adds "Reset progress (keeps shop)" and "reset this skill".
- Deleting events locally does not survive a merge: union-by-id brings them back from any older export or other device, so a reset silently comes undone at the next merge (M7).
- "Keeps shop" leaves coins unclear. If `coin` events go, the balance drops, which conflicts with the invariant "coins only ever go down through a confirmed shop purchase" (§9, CLAUDE.md). The parent is the one acting, but the spec should say this is allowed.
- It is also unclear whether Reset everything deletes the `snapshots` store, which would remove the only way back.
- **Fix:** define Tier 1 Reset precisely (for example, "snapshot first, then delete the `ncmc` database except `snapshots`"). State whether a later merge may restore reset data (accept and document it, or use a reset-marker event in M7). State that a parent reset is exempt from the coin invariant, or that it keeps coins. *Owner decision Q4.*

### R11. Resume and "replay any service" cannot rebuild the order list from the seed alone (§4.1 step 1, §11.6)
- The session builder samples using fact boxes and the seen set as they stand at service start. During the service, `attempt` events change both. The `resume` snapshot stores `{svc, seed, config, index, …}`, so re-running the builder from the seed on resume produces a different order list from the one the child was playing.
- §4.1 says the seed is stored "so any service can be replayed". That holds only if the box state at service start can be rebuilt. After a merge adds events from another device with earlier timestamps, it cannot.
- **Fix:** store the planned order list (factKeys, foods, monsters, requeue state) in `resume`. Narrow the replay claim to "same seed and same starting state → same service", which is what the determinism test checks.

---

## 2. Smaller Tier 1 ambiguities (settle during PLAN.md review)

| # | Where | Issue | Smallest fix |
|---|---|---|---|
| S1 | §6.2 | Time can run out while the child is on Home, the Menu, Results or the Shop (all count as play time). §6.2 only covers running out mid-service. | "If the allowance reaches 0 outside a service, lock at once (after Results if on Results)." |
| S2 | §6.2 step 3, §9 | At the 90 s grace cap "the monster eats happily and leaves", but the spec does not say whether it pays the usual 3 coins. §9 says +3 per *completed* problem. Also unclear whether the 90 s cap counts active time (which stops after 90 s idle) or wall time. | State "pays 3 / pays nothing" and "wall time". |
| S3 | §2.3, §5.4, §5.8 | "Take a break?" offers *Close the café*. On Home or the Menu (where the back guard also opens it), a PWA cannot close itself, and the spec does not say where a mid-service exit lands. The back guard covers Home/Menu/Service but not Results or the Shop, so Android back there exits the app. | Define *Close the café* per screen (for example, mid-service → partial `serviceEnd` → Home; on Home → dismiss). Extend the guard to every child screen. |
| S4 | §14 M0 vs M1 / D36c | M0 acceptance requires portrait e2e taps on rotated controls. M1 narrows e2e to landscape and moves "the full device matrix" to M2. Unclear whether the portrait tap test from M0 must keep passing in M1. | "The M0 portrait tap test stays; only CDP drag in portrait moves to M2." |
| S5 | §2.3, §3.3 | "Extra pointerdowns ignored while … an animation lock is active". If an item's flight to its cell counts as an animation lock, a child tapping the bin quickly loses taps and the count on the tray no longer matches their taps. | "Placement and removal update the tray model immediately; flights are not a lock. Locks apply to eating, demos and PlateCount." |
| S6 | §5.6 vs §1.1.7 | "A bigger reaction variant on first-try" rewards accuracy. §1.1.7 says "reward effort, not speed or accuracy", and assisted serves are "eaten happily". The difference in reaction is a small accuracy reward the child can notice. Never decided either way. | Keep and record it in DECISIONS, or pick the bigger variant at random. *Owner decision Q5.* |
| S7 | §4 "Difficulty" | Leftover wording from the removed draft: difficulty is "used for ordering warm-ups", and known facts "serve as openers", but no rule puts known facts first in a service. D29 now uses difficulty to order new-fact introduction, so every skill needs an ordering. Orderings exist only for A1/A2, A3 and A7/A8, and the spec does not say how add and sub are interleaved when `ops` is both. | Reword it as "new-fact introduction order (D29)", delete "openers", and add orderings for A4–A6 and B1–B2 by M5/M8 plus a cross-operation rule. |
| S8 | §4.2, §11.2, §3.1 | The `known` preset is a list of `factKey`s, and factKeys include the skill (`A2:+:3,5`). So 5 + 5 in A2 and `5 + ? = 10` in A3 are different facts. The spec does not say which factKeys "+1 and doubles" cover in A3 (`9 + ? = 10`, `5 + ? = 10`) and A7. A3 is Tier 1. | List the preset per skill (result forms only, or result and missing-addend forms). |
| S9 | §14 M0/M1, CLAUDE.md, §15 | No path is given for getting a milestone build onto the iPad. The only one stated is that the owner pushes to `main`, which deploys to the same URL as the child's installed app, so playtest builds and test data mix with real progress. A LAN dev server runs over plain `http`, which disables the service worker, `crypto.subtle` (the export checksum) and installability. | State the playtest channel (for example, "push to `main`; playtest builds are the real app"), and say whether test progress needs to be reset. *Owner decision Q6.* |
| S10 | §0 vs OPEN_ITEMS #7 | §0 states "about 8–10 minutes" per service as fact. OPEN_ITEMS #7 estimates 4–6. | §0: "about 5–10 minutes (measured at M2)". |
| S11 | §0, §14, CLAUDE.md, KICKOFF | The Tier 1 target is still "≈ 10 h", but the indicative figures for M0 + M1 + M2 alone add up to 8.75 h, leaving about 1.25 h for M3a and M3b. Those two milestones hold the event log, replay, boxes, resume, the allowance and lock, the gate, the parent area and export. D36 moves the estimate to PLAN.md but keeps the 10 h target, so PLAN.md has to either break the target or squeeze M3. | State whether ≈ 10 h is a hard target or a guide that PLAN.md may exceed. *Owner decision Q7.* |
| S12 | §11.3, M3a acceptance | The platform baseline is iOS 15.4, but `navigator.storage.estimate()` (and possibly `persist()`) is missing from Safari before 17. M3a accepts "persisted flag and estimate shown". | "Shown when available; feature-detected." |

---

## 3. Tier 2 issues (settle before that milestone)

| # | Milestone | Issue | Smallest fix |
|---|---|---|---|
| T1 | M5 (A5) | In `1n = ? + n` and `1n − 10 = ?` the unknown is the ten. With first-empty-cell placement and remove-from-the-end (D30), the ten never appears as one full frame: `14 − 10` removes frame 2's four and six of frame 1's ten, leaving 4 in frame 1. The teens demo ("full frame glows ten") contradicts what the tray shows. | Give these two forms an exception (the ten moves as one frame), or drop them and set A5 to 36. |
| T2 | M5 | FollowMe is capped at "≤ 10 steps (tens/ones ≤ 5)", but at S1 the child builds answers up to 20 (A0 11–20, A5–A8) and FollowMe repeats every step. | State what FollowMe does past 10 (for example, the first frame is placed as one step). |
| T3 | M8 | B-track layout: a tens shelf of 10 ten-packs (two rows of 5, each pack a 2×5 grid and a tap target of at least 44 CSS px, so about 81 logical px tall) plus a ones frame (~496 px) does not obviously fit in the 1280 × 210 tray band. Five landscape packs alone are about 1,000 px wide. Removal of a pack (which cell, which bin) is not defined. | Make the first M8 step a static layout mock, like M1's, and define pack removal. |
| T4 | M9 (B4) | B4 is "not a tray task" but has no response mechanic, `TrayTask`/`check` equivalent, outcome rules or demo. "The monster wants the bigger plate" reads as a two-way choice, which §1.4 rejects as guessable. | Define it before M9, or drop B4 from P2. |
| T5 | M7 | The heatmap uses "addition/subtraction grids 0–10", which cannot show A7/A8 teen facts or A5/A6. | Say which skills the grids cover, or use a per-skill list. |
| T6 | §6.3/§6.4 | Auto-refill modes use the wall clock, so setting the device clock forward refills a locked café. §6.1 says clock changes never refund time. | Add it to §6.4 "Honest limits" (true only when an auto-refill mode is chosen). |

---

## 4. Housekeeping (one pass, no decisions needed)

| # | Where | Issue |
|---|---|---|
| H1 | CLAUDE.md, §14 M0, OPEN_ITEMS #1 | "`git init` at M0" and "Owner action: create the GitHub repo (public)… push" are stale: the repo already exists on GitHub with history. Mark OPEN_ITEMS #1 resolved and change M0 to "use the existing repo". |
| H2 | SPEC, CLAUDE.md vs README, repo | The app is named "Number Chef Monsters" (SPEC, CLAUDE.md, export `app:'number-chef-monsters'`) and "Number Chef: Monster Cafe" (README, repo name). The export `app` id is persisted, so fix it before M3b. |
| H3 | DECISIONS D27 | Says "no swinging-door cue"; D33(c) replaced it with lights dimming and Pip yawning. Add an "Amended by D33" line. |
| H4 | SPEC status line, SPEC_REVIEW.md | The status line says "D29–D38 applied" (D39 too). SPEC_REVIEW chunk 14 still says "`SPEC.md` and other docs not yet edited". |
| H5 | OPEN_ITEMS "Needed during playtests" vs §14 M1 | Playtest is "15 min each" there but "5 minutes" in M1. OPEN_ITEMS "Devices … used by the children" doesn't match the one-child framing (D9/D38). |
| H6 | §13.5 | "Screenshots on every milestone" lists a bridging demo and a B-track task, which don't exist until M5/M8. Add "as built". |
| H7 | §11.3 vs §11.2 | "All rows carry `profileId='default'`", but the `Evt` type and the export shape have no `profileId`. Say whether it is a store column only or part of the event. |
| H8 | §1.2 A0 | "Warm-up + tutorial for the tray": the tutorial is now the D26 warm-up order. Use "tray practice". |
| H9 | §14 M1 vs M2 | M1 lists the "first-order ghost-hand tutorial" and M2 lists the "first-ever warm-up order" (§5.4). Name one milestone, and say where the "shown once" flag lives before M3a persistence (the M0 `meta` store skeleton). |
| H10 | §12 Settings | "Big-text captions" has no milestone, and "rename monsters" appears both in Settings and under §14 "Later ideas (M7)". |

---

## 5. Decisions needed from the owner

| Q | Finding | Question | Default if unanswered |
|---|---|---|---|
| Q1 | R2 | When the café locks, should an unfinished service still be offered after the parent unlocks? | No: the lock clears the snapshot, and the post-unlock offer and its tests are removed. |
| Q2 | R1 | A miss near the end of a service: should the requeue be appended (service gets longer) or dropped? | Appended, with at least one other order in between when possible. |
| Q3 | R7 | Should Tier 1 include a basic import (Replace) so a backup can be restored? | Yes: Replace-only import in M3b; Merge stays M7. |
| Q4 | R10 | What should Tier 1 "Reset" remove, and may a later merge bring reset progress back? | Snapshot first, delete everything except snapshots; merge may restore (documented). |
| Q5 | S6 | Keep the bigger reaction for first-try correct serves? | Keep, and record it in DECISIONS as a deliberate, small exception. |
| Q6 | S9 | How do milestone builds reach the iPad, and does playtest progress need clearing before real use? | Push to `main`; Reset once before real use. |
| Q7 | S11 | Is "≈ 10 h for Tier 1" a hard target or a guide PLAN.md may exceed? | A guide. |

Everything in §1–§4 that is not listed here is a plain correction that Claude Code can apply when writing PLAN.md, recorded as D40+ where it adds an assumption.
