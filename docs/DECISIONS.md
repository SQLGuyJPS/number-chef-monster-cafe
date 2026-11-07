# Decisions

Each entry: what was decided, why, how to revisit. D1–D14 were made during design (departures from the original proposal and resolved gaps). Round 2 added D15–D19; round 3 (owner clarifications on hours, the play allowance and story tickets) added D20–D21 and rewrote D7. Round 4 (owner: pick the skill instead of automatic leveling; play-time limit optional) added D22–D27 and amended D3, D6, D7, D13, D16, D20. Round 5 (owner: remove automatic leveling, Chef's Pick and chef hats from the project entirely) added D28 and reduced D13 and D25 to tombstones. Round 6 (owner walk-through of SPEC_REVIEW.md) added D29–D38; round 7 (applying them to the docs) added D39. Round 8 (owner walk-through of `SPEC_REVIEW_2026-11-04.md`) added D40–D47. New decisions are appended after the last entry, numbered one higher than the highest existing `D<n>`.

**Reading guide for removed features.** The first draft of the spec contained three linked mechanics that no longer exist anywhere except in this file and in git history: **automatic leveling** (stage promotion, demotion and fast-track driven by recent accuracy), **Chef's Pick** (an automatic "recommended" mode that chose the skill to practice and mixed in review of other skills) and **chef hats** (up to three mastery badges per skill, shown on each menu tile, each paying a coin bonus). Where an entry below mentions them, it describes the first draft, not the current design. See D28.

**D1. Ladder re-cut into two open tracks.**
Changes: (a) "within 10" split into A1 within 5 and A2 within 10 (a young child's within-5 and within-10 are very different jobs; pools of 20 and 70); (b) added A0 Count It Out (tray tutorial and numeral/quantity base); (c) added A6 teens ± ones without crossing, between teen numbers and bridging (the jump from 10+4 to 8+5 is otherwise too big); (d) "missing amounts" kept at A4 for missing addend/subtrahend within 10, but start-unknown (`? + 3 = 8`, `? − 3 = 5`) moved to backlog because it is the hardest word-problem structure; (e) comparing moved out of the "stretch" tail into its own P2 tile (it is a Kindergarten skill; still low priority because the child likely does it in school); (f) tens work (B1/B2) is a separate track that does not depend on bridging, so a strong counter can do 30+20 before wrestling with 8+5; (g) no locks; every tile is open. *(The first draft also said "Chef's Pick recommends"; Chef's Pick was removed, D28.)*
*Amended by D34: in (d), only the subtraction start-unknown form `? − 3 = 5` stays in the backlog; the addition form `? + a = c` is a commuted missing addend and is in A3/A4.*
*Amended by D47: in (e), comparing (B4) moved from P2 to the P3 backlog until it has a response mechanic.*
Revisit: if the child stalls at a skill, hide or reorder in the parent Skills tab; ladder order is data in `engine/skills.ts`.

**D2. The response is "build the answer", not "tap the food with the right number".**
Numbered choices are guessable and train numeral matching rather than quantity. Primary response is building the answer on the tray (S3–S1); numeral entry is the abstract end state (S0). Numbers on food are only counting cues.

**D3. Four support stages per skill (concrete → abstract fading).**
S3 guided, S2 prefilled, S1 build-the-answer from empty, S0 numeral. The parent sets the stage per skill (D23). Rationale: the ten-frame is a scaffold, not the goal; without fading it becomes a crutch and the game never tests recall.
*Amended by D22/D23/D28: the first draft moved stages automatically from first-try accuracy (6-attempt window, fast-track for strong starts) with a parent override. That automatic leveling was removed from the spec entirely; the four stages remain.*

**D4. Serving is an explicit bell press; no auto-serve.**
Auto-serve on the correct count turns the game into "add until it dings".

**D5. Canonical tray placement.**
Items always take the first empty cell; drops anywhere on the tray work; removal leaves holes. Keeps counting consistent and removes "which cell" errors; makes "fill the ten first" automatic for bridging.
*Amended by D30: removal now always takes the last filled cell, so there are no holes.*

**D6. Flat effort coins.**
3 per monster, 5 per completed service. Not tied to correctness or speed. Accuracy is tracked for fact weighting and the parent, not rewarded in currency. A 6-monster service pays 23 coins.
*Amended by D31: coins are recorded per completed problem, and a requeued problem pays its 3 coins too (up to 29 per 6-order service).*
*Amended by D25/D28: the first draft also paid 10 coins once per chef hat; hats were removed from the spec.*

**D7. Play allowance with a parent-only unlock (owner clarification).**
*Amended by D27: the limit is optional and off by default.*
Intent: hand the child the device and know the child can play for a defined period, not endlessly, without parent intervention to extend. Implemented as an allowance of active play time per device (off/5/10/15/20, off by default per D27) that is not reset by closing the app or starting another service. At zero the current monster finishes, Results plays, and the café locks persistently; only the parent gate can Start new session or Add time (optional auto-refill modes exist but default is parent-only). Never a visible countdown. Two earlier readings (daily cap, then per-service limit) were wrong. Known limits: per device, and clearing site data resets it (SPEC §6.4). No "max services per day" setting (owner declined).

**D8. One landscape layout; portrait renders the stage rotated 90°.**
Owner wants the game to look landscape immediately and only require turning the device. iOS cannot force orientation, so in portrait the stage is CSS-rotated to fill the screen; physically turning the device (counter-clockwise) makes it upright, and the transform drops when the OS rotates. Works under iOS rotation lock. Installed Android PWAs are locked to landscape by the manifest. Cost: all pointer math must use one inverse-transform helper (`toStageCoords`). Replaces an earlier "turn me sideways" overlay.

**D9. Single child profile now; `profileId` reserved; profiles are milestone M11.**
A younger sibling is not a target user in v1. A later profile could be limited to A0 with 1–5 via the known-facts/hidden-skills mechanisms (est. 1.5–2 h).

**D10. Foods are Unicode ≤ 9.0 emoji (allowlist); ten-packs and monsters are custom SVG.**
Renders on older tablets. Emoji are HTML-positioned, not SVG text. A swap-in SVG food path exists per food id.

**D11. No zero answers in tray stages.**
Bell is disabled when the tray is unchanged; a zero result at S1 would deadlock. Zero is deferred to a dedicated lesson.

**D12. PWA update policy: prompt + silent activation at Home.**
`autoUpdate` reloads the page under a playing child.

**D13. [Removed] Chef hat criteria.**
The first draft defined when each of the three chef hats (per-skill mastery badges) was earned, including a fix for a threshold that was unreachable for large pools. Hats were deferred by D25 and removed from the spec entirely by D28; nothing in the spec or the engine implements or reserves them. The full criteria are in git history (`git show e943553^:docs/DECISIONS.md`).

**D14. Hosting: GitHub Pages (owner decision).**
Public repo on the free plan (code and docs public, no personal data). Deployed by a GitHub Actions workflow; Claude Code never pushes unprompted. Installable PWA is a storage-safety requirement on iOS (installed apps are exempt from the 7-day eviction of script-writable storage). Pages sends `max-age=600`, so updates can lag up to 10 minutes.

**D15. Progress is an event log that merges across devices.**
The child will play on an iPad, an iPhone and an Android phone, with no backend. Local-only state would fork per device, so progress is an append-only event log; derived state is a pure replay; devices sync by exporting a file and **merging** (union by event id) on another device. Coins are carried in events (never recomputed), so merges cannot lower earned coins; duplicate buy/serviceEnd events count once (the first draft also deduplicated hat events; hats were removed, D28). Settings (voice, volume, limits) stay per device. Cost ≈ +1 h in M3 versus plain snapshots; benefit: backup, sync and migrations all become the same mechanism. Revisit: if the owner decides one device is canonical, merge becomes optional but the log stays.

**D16. Starting state from the owner's report.**
The child is in the first half of a first-year primary maths book; knows +0, +1 and doubles (1+1 … 9+9) from flash cards. Those facts start at box 3 (+0 is in no pool, D11); the child can solve take-away word problems but is still learning number sentences with sums under ten, so symbolic subtraction is treated as new. The spec's earlier claim that the child would "live in A0–A5" was revised: A2–A8 is this school year's curriculum, B1–B2 likely second-half work (hence the Big Menu is bonus work, M8). Wording generalized by D38. Editable in Parent → Skills → Starting point.
*Amended by D22/D28: the first draft also marked A0 as assumed-known and had the automatic Chef's Pick start at A1 with a short diagnostic and fast-track; those were removed. What remains of the preset: the known addition facts start at box 3 (less frequent), every skill starts at S3, and the first-run menu highlights A1.*
*Amended by D43: the preset covers only result forms (`a + b = ?`) in A1, A2 and A7; missing-addend forms count as new.*

**D17. Near-doubles and 9+x are the first strategies for new facts.**
They build on the child's known doubles and +1. `nearDouble` strategy tag and demo; A2 and A7 difficulty ordering lead with them.

**D18. Same-origin hygiene on GitHub Pages.**
`<user>.github.io` is one origin for all of the owner's Pages projects, so IndexedDB, caches and any `localStorage` are namespaced `ncmc`, and reset/cleanup code may only touch `ncmc*`. Enforced by ESLint and a unit test.

**D19. Back guard.**
Android back gesture and iOS Safari edge-swipe would otherwise exit the game mid-service; both open the "Take a break?" dialog instead.
*Amended by D37: the guard history entry is pushed from inside a tap (Chrome skips entries pushed without user activation) and again after each in-app navigation.*

**D20. Build tiers instead of an hour cap (owner decision).**
The earlier "≈ 20 h" was only a scoping device. Tier 1 = a playable game in ≈ 10.5 h (M0–M3: foundations, core loop with A1–A2, café service with A3, hand-off-ready persistence + play allowance + minimal parent area). Tier 2 = bonus features M4–M11 in any order, no upper limit. *Amended by D22: Tier 1 is now ≈ 10 h (M2 ≈ 3.25, M3 ≈ 1.5).* *Amended by D36: M3 is split into M3a/M3b and the Tier 1 hour estimate is redone in PLAN.md.* *Amended by D44: ≈ 10 h is a guide, not a cap; M3b also gets a Replace-only import.* Consequence: Tier 1 has no shop (coins accrue and show in the jar), no multi-device merge UI (the event log exists), and only A1–A3, which matches the child's current book.

**D21. Story tickets (word-problem phrasing of each order) declined by the owner.**
Considered: template-driven one-sentence stories beside the equation, to bridge the child's take-away word-problem skill to number sentences (risks: reading load blurring the mastery signal, keyword shortcuts). Removed from the spec; M6 number left unused. Revisit if the child stalls on missing-addend or take-away sentences.

**D22. The owner picks the skill; there is no automatic leveling.**
What: every play session starts at the menu board. The child or a parent picks a skill tile; "Another service" on Results repeats the same skill by default; "Change dish" returns to the menu. Dropped from the first draft (first deferred to an optional milestone M12, then removed outright by D28): Chef's Pick (an automatic recommender with a "frontier" skill, a fixed mix of orders and review slots), cross-skill 20% review, stage promotion/demotion/fast-track, mastery hats and their +10 coins, assumed-known skills. Kept: fact boxes as sampling weights (misses return sooner inside the chosen skill), requeue within a service, and the full attempt log. The menu is the first thing after Home ("Open the Café" opens it); the tile played last glows, A1 on first run.
Why: the owner knows where the child is in the curriculum and wants to direct practice. The design review found that the automatic path was unpredictable for a first-time player: fast-track after one 6/6 service at S3 (where the prefilled tray and spoken counting make success near-automatic) would jump A1 to S1 and award two hats in about five minutes; the add/sub balance rule forced known facts into half of the first A1 orders; Chef's Pick had no review material on day one.
How to revisit: see D28 (the mechanics no longer exist in the docs; attempts are still logged with skill, stage and outcome, so a future adaptive layer could derive stages from history).

**D23. Stage is a fixed per-skill parent setting (default S3), stored as a `skillConfig` event.**
What: Parent → Skills lists each skill with a stage selector (S3–S0), applied from the next service. It replaces the `stageOverride` event with `skillConfig {skill, stage, ops}`, last writer per skill wins, so it syncs through merge (unlike per-device settings) and is not lost on a fresh device. Default S3 for every skill, A0 included.
Also fixes an inconsistency in the draft: requeue was written as "stage−1 (min S3)", but S3 is the *most* supported stage, so one step more support means S0→S1→S2→S3 (S3 stays). Requeued facts therefore get one step more support within the service.
Why: the scaffold must be adjustable without automatic movement, and the parent is the one who knows when to fade it.
How to revisit: if the parent wants it per device, move it to the `settings` store; if changing it is frequent, surface it on the menu board (parent-gated).

**D24. Per-skill operation filter: both / addition only / subtraction only.**
What: a parent setting in `skillConfig.ops`, shown only for skills with both operations (A1, A2, A5, A6, B1, B2). The session pool is restricted to the allowed forms; the menu tile's sample sentence matches. The ±1 add/sub balance rule applies only when `ops` is `both`.
Why: A1 addition is almost entirely known (5 of 6 canonical addition facts are in the child's preset; only 2+3 is new) while all 10 subtraction facts are new, so a mixed A1 spends about half its orders on facts the child knows. Subtraction only is the likely setting.
Consequence: A1 with subtraction only has 10 canonical facts; a 15-minute limit, if one is enabled (2–3 services), repeats each about twice, which is practice, not a defect. The pool-size guard still prevents adjacent repeats.
How to revisit: the focus list (M7) can express the same thing per fact.
*Amended by D43: A3 and A4 also get the setting; skills other than A1 target their pool's add/sub share.*

**D25. [Removed] Chef hats and the hat coin bonus.**
What: chef hats (up to three mastery badges per skill, shown on menu tiles and in Results, +10 coins each) were first deferred to an optional milestone (M12), then removed from the spec entirely by D28. There are no hats on tiles, in Results or the Progress tab, no +10 coins, no `hat` event type, and no hat SFX.
Why: hats measured mastery-driven stage progress, which the design no longer has, and the owner considered them an extra progression mechanic that is not needed for quite a while.
How to revisit: see D28. If a sense of progress on the tiles is missed in playtest, a simple effort-based marker (services completed per skill) is the cheapest substitute.

**D26. First-ever service starts with a fixed warm-up order.**
What: once per device (flag in `meta`), before the chosen skill's orders, one order `2 + 1` with cookies on one ten-frame at S3, whatever skill was picked. A ghost hand taps the bin once after 4 s idle; after the item lands and 4 more idle seconds it hovers over the bell. The bell press is always the child's. It pays the usual 3 coins and writes no `attempt` event, so it cannot affect weights or stats.
Why: the draft's scripted gesture ("tap bin once, then bell once") only works for an `n + 1` fact, and the skill is now arbitrary. A scripted ghost bell tap would also be an auto-serve, which the invariants forbid.
How to revisit: if the child does not need a warm-up (older player, profile M11), drop it; it is one flag.

**D27. The play-time limit is optional and off by default (owner).**
What: a fresh install has no limit. Parent → Settings → "Play time limit" is Off / 5 / 10 / 15 / 20 minutes. While Off there is no clock, no lock, no swinging-door cue, and no Start new session / Add time / Refill controls. Choosing a duration starts a full session; choosing Off at any time (even while locked) clears the lock. Everything else in SPEC §6 applies unchanged once a parent enables it.
Why: the draft (review row 33) defaulted to 15 minutes so the café would lock after a surprise amount of play. The owner wants the limit to be a deliberate hand-off tool that a parent switches on, never something that turns on by itself.
How to revisit: the default is one constant in `engine/config.ts`; the per-device `settings` store holds the choice.
*Amended by D33: the "swinging-door cue" became the lights dimming and Pip yawning; the door sign never animates.*

**D28. Automatic leveling, Chef's Pick and chef hats are removed from the project documentation entirely (owner).**
What: D22 and D25 had deferred these three mechanics to an optional late milestone (M12) while the docs kept describing them. They are now removed outright:
- *Automatic leveling*: stage promotion (a window of recent first-try results), demotion, and fast-track for strong starts. Stage is only ever the parent's per-skill setting (D23).
- *Chef's Pick*: the first draft's "recommended" mode, which picked the main skill each service (a frontier skill, a fixed composition, review slots drawing on other skills) so the player never had to choose.
- *Chef hats*: three mastery badges per skill on each menu tile, tied to stage progress and fact mastery, each paying +10 coins once (D13, D25).
Docs changed: SPEC.md (M12 deleted, so Tier 2 is M4–M11 and the number M12 is unused like M6; `hat` event type, its coin term and SFX removed; the `'pick'` service marker removed from `serviceEnd.skill`; the "assumed-known A0" wording removed), OPEN_ITEMS.md, SPEC_REVIEW.md (findings about the mechanics removed; numbering adjusted) and CLAUDE.md (next decision number). The pointers in D3, D6, D13, D15, D16, D22, D25 and the review logs below now say what the removed features were.
Not affected: Pip's chef hat (the mouse mascot's costume and the Help button) is character art, not the badge. Fact boxes, requeue, the attempt log, `skillConfig` stage/operations settings, the first-run warm-up (D26) and the optional play-time limit (D27) stay as designed.
Why: the owner kept getting Claude Code reports about gaps in these dormant mechanics (missing fallbacks, balance rules, unreachable thresholds) while working on unrelated milestones, and the text leaked into other chats. They will decide whether to revisit after all other milestones are done.
How to revisit: do not treat the absence as a defect and do not flag it. If the owner reopens it, the first-draft rules are in git history: `git show e943553^:docs/SPEC.md` (§4.1 session composition and Chef's Pick, §4.2 stages, boxes and hats) and `git show e943553^:docs/DECISIONS.md` (D3, D13). Write it as a fresh decision, bump `schemaVersion` with a migration if events are added, and take these review lessons into account: success at S3/S2 mostly reflects the prefilled tray and spoken counting, so fast-track and hats could be earned within minutes (D22 Why); fast-track should count only facts outside the `known` preset and not jump past S2 for subtraction; demotion should react faster; Chef's Pick needs fallbacks when the previous or next skill is not built and a rule for how it treats the Big Menu.

**Round 6: owner walk-through of `docs/SPEC_REVIEW.md` (D29–D38).** Each item was decided in chat; the per-item log is the "Decision log" table at the top of `SPEC_REVIEW.md`. When these entries were written `SPEC.md` had not yet been edited. The edits listed in the log have since been applied directly to `SPEC.md`, `OPEN_ITEMS.md`, `CLAUDE.md`, `README.md` and `KICKOFF.md` (see D39), so the spec now matches these entries; if the two ever disagree, this file wins until the spec is corrected. Where an entry amends an earlier one, the earlier entry is not rewritten.

**D29. Fact boxes move only on S1/S0 first-try results; four attempt outcomes; capped new-fact introduction.**
What: (a) A first-try correct result raises a fact box only at S1 or S0; a miss or assisted resolution resets it to 0 at every stage. (b) Outcomes, spelled the same in the engine (§3.4) and the persisted `attempt` event (§11.2): `first` (right on the first serve, no Help), `afterHint` (Help pressed before the first serve, then correct; box stays), `fixed` (wrong first serve, then right on the second; box = 0, no requeue), `assisted` (worked demo + FollowMe; box = 0, requeue). Help at attempt 1 plays CountTogether and moves the child to attempt 2, so Help followed by a wrong serve goes straight to Worked. (c) New facts are introduced in difficulty order, at most 3 per service; one box per unordered pair (the "half weight" wording is dropped).
Why: at S3/S2 the first operand is prefilled and the answer follows from counting out the second, so first-try success there says little about recall and would push facts out of rotation. "Wrong then fixed" was undefined, and a uniform weight of 5 for all new facts defeated D17's near-doubles-first order.
Consequence: at the default S3 boxes do not rise until a parent moves a skill to S1/S0, so sampling stays even. Supersedes the former OPEN_ITEMS #10 default (which logged the wrong-then-fixed case as `afterHint`); that item is now in OPEN_ITEMS' resolved table.
How to revisit: thresholds and the cap live in `engine/config.ts`; move S2 into the box rule if S2 turns out to be diagnostic in practice.

**D30. Tray interaction rules: remove from the end, taken-away row, tap-to-count, and a spoken plate count.**
What: (a) Removal always takes the last filled cell, whichever item the child taps (the tapped item still flies away). This amends D5's "removal leaves holes". (b) For missing-subtrahend forms (A3 `10 − ? = a`, A4) the removed items stay in a small "taken away" row so the unknown stays visible; CountTogether and demos point at it. (c) In add mode, tapping a placed item hops it and says its position number; removal there is by dragging it to the bin or a single "take one back" button. In remove mode, tapping still removes. (d) After a wrong serve the monster first counts the child's plate aloud ("I see seven… I wanted eight. One more!"), then the model bubble plays; no red X or buzzer. (e) `frames1` capacity is 10 (`frames2`: 20), with the same bin wobble. (f) Ticket colors follow the tray: blue = prefilled/locked group, orange = the group the child adds or removes, green = result; not by operand position.
Why: scattered holes break the five-wall subitizing and the back-through-ten demo; young children count by touching; the removed amount is the answer in `7 − ? = 5`; the feedback should name what the child actually served.
How to revisit: PLAYTEST adds "does the child count by touching?". The taken-away slot and the CountTogether bubble width are checked in the M1 layout mock (D36).

**D31. Coins are recorded per completed problem; requeues bring back the same monster.**
What: a small `coin` event is written in the same transaction as each completed problem (including the D26 warm-up order). `serviceEnd` carries only the service tip. Totals dedupe by event id. A requeued problem is the same monster returning ("Blobbo's back — still hungry!") and pays the usual 3 coins, so a service with requeues can pay up to 6 over the 23 base.
Why: coins were summed from `serviceEnd` per distinct service id, so a resumed service silently lost one set, and an app killed mid-service lost coins the child had seen fly into the jar.
Consequence: a new event type, so the event shape is frozen in M1 (D36); amends D6/D15's wording on where coins live (still "in events, never recomputed").
How to revisit: if per-problem events are too chatty, batch them per service with a resume-safe id.
*Amended by D40: a problem cut off at the 90 s grace cap is not completed and pays nothing.*

**D32. The S0 number pad is one row of digits.**
What: ten digit buttons 0–9 in order, one answer display that always accepts up to two digits, and a backspace. No separate tens/ones slots.
Why: the 3×4 keypad with 120 px buttons needs about 500 px of height against about 390 available, and tens|ones slots reveal whether the answer is above nine. An ordered digit row doubles as a small number line.
How to revisit: if buttons feel cramped on the phone, shrink within the 56 px minimum before changing the layout.

**D33. Allowance ending is predictable (only when the limit is enabled, D27).**
What: (a) "Last customer": when remaining time falls below about one order's length (tuned in playtest), waiting silhouettes wave and leave and the current monster is announced as the last one; no full new service starts when less than about half a service remains (a shorter one is offered). (b) The +5 tip is paid when the allowance closes the café mid-service, but not for a voluntary early exit or Take a break. Supersedes the former OPEN_ITEMS #8 "no tip on a partial service" default for this case (that item is now #7 after the renumbering). (c) The 60 s cue is the lights dimming and Pip yawning; the door sign never animates. (d) At the 90 s grace cap the monster eats happily and leaves, no `attempt` is recorded, the fact's box is unchanged, and a pending requeue is dropped without a box reset. (e) After about 20 s idle the spoken ticket repeats once per order (all stages; spoken only). (f) The "Continue dinner service?" offer is used everywhere (no silent resume) and is not shown while the café is locked; it appears after a parent unlocks.
Why: a service of 8–10 minutes against a 15-minute allowance would otherwise be cut off abruptly almost every time; closing time is not the child's choice and a time cutoff must never count against the child.
How to revisit: the thresholds are constants in `engine/config.ts`; measure real service length at the M2 playtest (OPEN_ITEMS #7).
*Amended by D40: in (f), the lock clears the resume snapshot, so no offer appears after an unlock. Amended by D46: the back guard and "Take a break?" cover every child screen.*

**D34. Addition-only start-unknown forms (`? + a = c`) stay in v1.**
What: A3 `? + a = 10` and A4 `? + a = c` remain in the pools (A3 = 36, A4 = 135). This amends D1(d): only the subtraction start-unknown form (`? − 3 = 5`) and the harder word-problem structures stay in the backlog. The Mystery Orders example becomes `? − 3 = 5`.
Why: `? + a = c` is a commuted missing addend (`a + ? = c`), not a new structure.
How to revisit: drop the forms and update the pool counts (A3 → 27, A4 → 90) if the child finds them confusing.

**D35. Foods must be one obvious unit: 🍒 and 🥞 are replaced.**
What: 🍒 (two cherries) and 🥞 (a stack) leave the allowlist; 🍌 banana and 🍊 tangerine (Unicode 6.0) are added. Mimsy's favorites become 🍞 / 🍊 and Wobbleton's 🍦 / 🍌. Update SPEC §7.1/§7.2 and `scripts/emoji-versions.json`.
Why: "seven cherries" on screen would be fourteen cherries to a counting child.
How to revisit: swap any food; the allowlist is data, and `lint:content` enforces it.

**D36. Tier 1 scope and sequencing changes.**
What: (a) M3 is split into M3a (event log, replay, fact boxes, per-skill stage/operations settings, resume) and M3b (optional play-time limit and lock, parent gate and parent area, export/reset/import), each with its own playtest stop. (b) Migrations: ship `schemaVersion: 1` with an empty migration list and its test harness; the first real migration is written at the first schema change, after which the CLAUDE.md rule applies as written. One snapshot in Tier 1; rotation later. (c) M1 e2e proves tap in landscape on Chromium plus one WebKit iPad project, with `toStageCoords` unit-tested for portrait; the full device matrix and CDP drag in rotated portrait move to M2. (d) The `attempt` and `coin` event shapes (D29, D31) are fixed in M1. (e) M2 monsters are six hand-authored SVGs with expression variants (idle, delight, eat, puzzled, sleepy); the `MonsterSpec` data shape stays so art can be swapped or made procedural. (f) The easy-reader word-list lint is dropped; no word list is committed and child-facing text stays minimal by convention. (g) The first M1 step is a static layout mock (1194×834 and 844×390) that the owner approves before any interaction is built.
Why: the Tier 1 estimate was optimistic, and the cuts remove work that only protects later milestones without changing what the child plays.
Consequence: the Tier 1 hour estimate is redone in `PLAN.md` (D20/D22 figures are not authoritative any more).
How to revisit: reinstate any item when its protection is needed (first schema change, first need for a word list).

**D37. Platform baseline and known platform risks.**
What: baseline iOS 15.4+ and a recent Chrome on Android; `navigator.audioSession` (iOS 17+) is a progressive enhancement. The owner's actual device list was not provided (OPEN_ITEMS "Device details" stays open). Platform risks go in `PLAN.md`: CSP emitted in production builds only with `assetsInlineLimit: 0`; the back-guard history entry is pushed from inside a tap (amends D19); the export file is shared via `canShare` with a text/plain or download fallback and a permissive `accept` on iOS; speech timeout about `clamp(1200, 400 + 90·chars/rate, 8000)`, tuned on the iPad; Noto Color Emoji in the e2e environment (emoji appearance is judged on real devices only); the 4× CPU-throttle check is a report, not a gate; "installs to Home Screen" is an owner check in PLAYTEST, not agent acceptance. Also decided: `?debug` query flag for the debug screen (production builds too), SHA-256 via SubtleCrypto for the export checksum, a README/PLAYTEST note to install to the Home Screen before first play (no detection code), and the Service screen uses the decorated café so purchases show while the child plays.
Why: the old "iOS 14+" target conflicts with `100dvh` and `crypto.randomUUID`; these are known traps that are cheaper to plan for than to discover.
How to revisit: raise or lower the baseline once real devices are listed.

**D38. Family details are generalized in the public repo.**
What: current files say "the child", "a younger sibling" and "a parent's phone" instead of ages, sexes, school grade and who owns which device; D9, D16, OPEN_ITEMS, SPEC §4.2/§15, CLAUDE.md and README are reworded accordingly, keeping the design-relevant content (known facts, level) in generic terms. Git history already contains the old wording and is not rewritten.
Why: the repo is public (D14) and the docs described the owner's children.
How to revisit: scrubbing history is a separate, destructive step the owner would have to ask for explicitly.

Also decided in the walk-through without a separate entry (plain corrections or wording; see the log): FollowMe now pulses the bell and the child presses it; the spoken ticket includes the food and "please"; the `+0` known toggle is removed; the "spaced practice" claim is softened; median S0 response time joins the Tier 2 Progress tab; tidy-ups C3–C5, C8, C10, C12–C14; garnish choice and monster album are Tier 2 backlog ideas; naming the monsters is deferred (placeholders through M2); diagnostic S2 and "take away" wording were rejected.

**D39. Assumptions made while applying D29–D38 to the docs (owner can veto).**
What:
- (a) *Event shapes* (D31, D36d): `coin {svc, n}` is one event per completed problem; `serviceEnd` drops `coins` for `tip` (0 or 5) and keeps `partial` (true when the service ended before all orders were served, including an allowance close). Earned coins = Σ `coin.n` + Σ over distinct `svc` of the largest `serviceEnd.tip` (a resumed service can have two `serviceEnd` rows). Allowance close clears `resume`.
- (b) *New-fact cap vs. the pool guard* (D29): "available facts" are the facts already seen plus the at most 3 newly introduced ones, and the "no repeat within 4" window shrinks when fewer than 5 are available. Consequence: the first service of a skill whose facts are all new (A1 subtraction only) repeats 3 facts about twice each, never adjacent.
- (c) *Tray* (D30): locked prefilled items also hop and count in add mode; every removal path (tap in remove mode, drag, "take one back") takes the last filled unlocked cell; the "take one back" button and the taken-away row get their slots in the M1 layout mock.
- (d) *Plate count* (D30d): it plays after every wrong serve, before CountTogether or Worked, comparing the tray total with the expected tray total ("One more!"/"One less!" only when off by one). At S0 the monster echoes the typed number. Peek before the first serve counts as Help.
- (e) *Ticket colors* (D30f): by role on the tray; at S1/S0, where nothing is prefilled, blue marks the group that would be prefilled at S3.
- (f) *Spoken ticket* (owner answer): only result forms are wrapped in the café frame ("Three plus two cookies, please!"); missing-amount and start-unknown forms keep the plain question; A0 is unchanged. The `spoken` field stays the unwrapped sentence.
- (g) *Allowance* (D33): "a shorter service" means as many orders as fit, at least 1 (with less than one order's length left, the single order is the last customer); a wind-down service that ends with allowance left still locks the café, since less than one order is not enough to play; `lastCustomerMs` and `minServiceMs` are set from the median service length measured at the M2 playtest; after an unlock the 2 h resume window counts from the unlock.
- (h) *Estimates*: SPEC §14 gives no hour figure for M3a/M3b; PLAN.md sets them (D36). The per-milestone figures that remain are indicative.
- (i) *D38 scope*: neutral wording ("the child", "they") in SPEC, OPEN_ITEMS, CLAUDE.md, README, KICKOFF and D9/D16. A follow-up pass applied the same neutral wording to every other DECISIONS entry and to SPEC_REVIEW.md (quoted identifiers such as `resolvedAssisted` are unchanged); git history is not rewritten.
- (j) *Housekeeping*: OPEN_ITEMS is renumbered (C14; old #3→#2 … #12→#10) and the former #10 moved to its resolved table; SPEC_REVIEW.md keeps the old numbers and says so. The export `checksum` covers the serialized `events` and `settings`. `scripts/emoji-versions.json` does not exist yet (no code); it is created with `lint:content` using the D35 allowlist.
Why: each of these closes a gap that D29–D38 left open, with the smallest rule that keeps the decided behavior intact.
How to revisit: all are spec text and `engine/config.ts` constants; change the spec line and add a decision that supersedes the item above.
*Amended by D40: in (g), the post-unlock 2 h window is gone (the lock clears the snapshot).*

**Round 8: owner walk-through of `docs/SPEC_REVIEW_2026-11-04.md` (D40–D47).** Each finding was decided in chat; the per-finding log is the "Decision log" table at the top of that file (finding IDs R1–R11, S1–S12, T1–T6, H1–H10). The edits have been applied to `SPEC.md`, `CLAUDE.md`, `OPEN_ITEMS.md`, `KICKOFF.md` and `README.md`. Earlier entries are not rewritten; where one is amended, it carries an "Amended by" line.

**D40. Allowance endings: the lock clears the resume snapshot; lock outside a service; grace-cap problems pay nothing (R2, S1, S2).**
What: (a) The lock clears the `resume` snapshot (as SPEC §6.2 step 5 already said), so there is **no** "Continue dinner service?" offer after a parent unlocks. This amends D33(f) and D39(g). (b) On boot, if a limit is on and `remainingMs ≤ 0`, the café locks and the snapshot is cleared (covers the app being killed during the wind-down or grace period). (c) If the allowance reaches 0 outside a service, the café locks at once; on Results the tally finishes first; in the Shop an open purchase confirm is cancelled. (d) The problem cut off at the 90 s grace cap pays **no** coins (no `coin` and no `attempt` event); the monster still eats happily, and the +5 closing tip is still paid (D33b). The cap is 90 s of wall time, so it runs even while the idle pause has stopped the allowance clock. This narrows D31's "every completed problem pays 3": a cutoff is not a completed problem.
Why: the post-unlock offer could never fire (the snapshot was already gone) and an e2e test required it; running out off-service and a kill during grace had no rule; the owner chose no coins for a cutoff.
How to revisit: keeping the snapshot across a lock is one rule in §6.2 step 5 plus the old D33(f) wording.

**D41. S0 help path (R3).**
What: at S0, Pip's Help button stays. Worked and FollowMe play on the S3 tray shown under the lifted cloche; FollowMe ends with the child typing the number and pressing the bell. Peek before the first serve counts as Help (`afterHint` if then correct), never as `assisted`. The bell is disabled while the answer display is empty.
Why: S0 has no tray, but Worked and FollowMe were written to play on one; §3.2 and §5.4 disagreed on what Peek records.
How to revisit: SPEC §5.4/§5.5; playtest whether the cloche tray is clear at phone size.

**D42. Tray, demo and input rules (R4, R5, R6, S5).**
What: (a) In remove mode, tapping the bin (or, for missing-subtrahend forms, the taken-away row) returns the last removed item to the first empty cell, so an over-removal can be fixed. (b) Doubles and near-doubles demos are described by the blue and orange groups on the canonical tray ("three blue, three orange: the same"), not "two equal rows"; the `doubles` demo is built in M1. The bridge demo says "the first orange items fill the ten" (canonical placement already puts them there). (c) For missing-addend and missing-subtrahend forms, CountTogether ends by counting the orange group (or the taken-away row) from one and naming that number ("one, two, three — three more"). (d) Placing and removing update the tray model at once; item flights are visual only and never an input lock. Locks apply only to eating, demos and PlateCount.
Why: remove mode had no undo though PlateCount says "One more!"; the fixed 2×5 fill never shows two equal rows; a running count ends at the total, not at a missing amount; dropping fast taps would break counting by tapping.
How to revisit: SPEC §2.3, §3.3, §5.5.

**D43. Session builder data (R1, R9, R11, S7, S8).**
What: (a) Requeues are exempt from the "not within the last 4 problems" factKey window; "never adjacent" and "not the same monster twice in a row" still apply. A requeue that does not fit 3–5 problems later is appended to the end of the service (the service gets longer), with at least one other order in between when one exists; a requeue adds a silhouette when it is queued. (b) A3 and A4 get the both / addition only / subtraction only setting (amends D24's list). For the ±1 balance rule, A1 targets ~55/45 and every other skill targets its pool's own add/sub share of canonical facts. (c) The `resume` snapshot stores the planned order list (factKeys, foods, monsters, requeue state). The replay claim is narrowed to "same seed and same starting state → same service". (d) Difficulty is the new-fact introduction order (D29); the leftover "warm-ups" and "openers" wording is gone. When `ops` is both, new add and sub facts alternate. Orderings for A4–A6 are written in M5 and for B1–B2 in M8. (e) The `known` preset covers only result forms (`a + b = ?`) that are +1 or doubles, in A1, A2 and A7; missing-addend forms such as `9 + ? = 10` count as new (amends D16).
Why: requeue positions 3 and 4 broke the no-repeat window and late misses had no rule; A3/A4 mix operations; a resumed service rebuilt from the seed came out different because boxes had changed; factKeys include the skill, so the preset's scope had to be named.
How to revisit: constants and orderings in `engine/config.ts` and `engine/skills.ts`.

**D44. Tier 1 scope, parent access, reset and process (R7, R8, R10, S4, S9, S11, S12).**
What: (a) M3b adds a basic **Replace-only import** (snapshot first, checksum and zod validation); Merge stays in M7. (b) Until M3a, the `?debug` screen offers stage and operations per skill; from M3a the gear opens the Skills list without a gate; M3b puts the gate in front of it. (c) Tier 1 **Reset** writes a snapshot and then deletes everything except the `snapshots` store. A later merge from an older export or another device may bring reset progress back; that is documented in the parent Help, not prevented. A parent Reset or Replace import may lower the coin balance; this is an explicit parent exception to "coins only go down through a purchase". (d) The M0 portrait tap e2e test stays green from M0 on; only CDP drag in rotated portrait and the full device matrix wait for M2. (e) Milestone builds reach the devices by the owner pushing to `main` (the real app); before real use the parent resets playtest progress once. (f) The Tier 1 ≈ 10 h figure is a guide, not a cap; PLAN.md may exceed it (amends D20/D36). (g) `navigator.storage.persist()`/`estimate()` are feature-detected (missing on Safari before 17); the parent area shows "not available on this device".
Why: a backup with no restore protects nothing; the Skills settings had no entry point before M3b; deleting events from a mergeable log is undone by the next merge; the indicative hours for M0–M2 already used almost all of 10 h.
How to revisit: a reset-marker event (M7) if resurrected progress turns out to be a real problem.

**D45. A first-try serve keeps its bigger reaction (S6).**
What: the monster's reaction after a first-try correct serve stays a little bigger (SPEC §5.6). This is a deliberate, small exception to §1.1 point 7; coins stay flat.
Why: the owner wants the extra delight; it is visual only and never affects coins.
How to revisit: pick the bigger variant at random if the child seems to chase it or looks disappointed after a fixed serve.

**D46. Exits and the back guard (S3).**
What: mid-service, *Close the café* writes a partial `serviceEnd` and goes to Home. On Home, Menu, Results and Shop the "Take a break?" dialog offers only *Keep cooking* and dismisses. The back guard covers every child-facing screen.
Why: a web app cannot close itself, and the back guard did not cover Results or the Shop.
How to revisit: SPEC §2.3, §5.4, §5.8.

**D47. Tier 2 fixes, naming and housekeeping (T1–T6, H1–H10).**
What: (a) A5 `1n = ? + n` and `1n − 10 = ?`: the ten is added or removed as one whole frame in a single step (pool stays 54). (b) FollowMe past 10: the first full frame is placed as one step ("ten"), then the ones one by one. (c) M8 starts with a static layout mock for the owner's OK; removing a pack takes the last pack on the shelf, which flies to the Box-of-10 bin. (d) B4 moves from P2 to the P3 backlog ("needs a response mechanic"); M9 is B3 only (amends D1(e)). (e) The heatmap's 0–10 grids cover A1–A4; A5 and up show a per-skill fact list. (f) §6.4 notes that auto-refill modes can be triggered early by changing the device clock. (g) The app's name is **Number Chef: Monster Café**; the export `app` id is `number-chef-monster-cafe`. (h) `profileId` is a store column only; M11 adds it to the event shape with a migration. (i) The first-ever warm-up order belongs to M2; its "shown once" flag uses the M0 `meta` store skeleton. (j) Big-text captions are M10; renaming monsters stays M7. (k) Plain corrections: the Git repo already exists (no `git init`; OPEN_ITEMS #1 resolved), D27's door-sign wording, stale status lines, playtest lengths, the screenshot list "as built", A0 described as tray practice.
Why: each closes a contradiction or a gap found in the second review.
How to revisit: each item is a spec line; supersede with a new decision.

**Round 9: PLAN.md §2 resolutions, approved by the owner with the plan on 2026-11-05 (D48–D59), and assumptions made while building (D60+).**

**D48. S0 number pad lives in the tray band.**
What: at S0 the ten-digit row sits in the tray band (y ≈ 400–512) with the answer display, backspace and Peek above it (y ≈ 310–390); the bottom band keeps Pip's hat and the bell. When Peek, Worked or FollowMe lifts the cloche, the full S3 tray takes the tray band and the digit row returns for the final typing (D41). The M1 layout mock gets an S0 frame.
Why: ten 112-px buttons with gaps need ≈ 1192 px, but Pip's hat and the bell leave ≈ 1000 px in the bottom band (§5.4 vs §2.2).
How to revisit: M1 layout mock; PLAYTEST at M1.

**D49. Playwright pinned to exactly 1.63.0; WebKit installed by the cloud setup script.**
What: `@playwright/test` is pinned to 1.63.0 so it finds the browsers the cloud environment pre-installs (`npx -y playwright@1.63.0 install --with-deps webkit` next to Chromium). Chromium and WebKit projects both run; the owner's Windows machine is the fallback. A session without WebKit reports it rather than skipping silently.
Why: only Chromium was pre-installed in the cloud container.
How to revisit: bumping Playwright means changing the setup-script line too.

**D50. `factKey` scheme for missing-amount forms.**
What: `skill:form:operands`. Addition result keys sort operands (`A2:+:3,5`); `a+?=c` and `?+a=c` share `A4:?add:a,c` (commuted partners share a box, §4.1 step 4); `10−a=?` is `A3:-:10,a` and `10−?=a` is `A3:?sub:10,a` (separate keys). Consequence: A3's canonical add/sub share is 9 : 18, so with `ops = both` its balance target is about one third addition (D43b).
Why: §3.1 gives examples but no rule; `factKey` is a persisted identifier (§11.2).
How to revisit: a change needs a migration.

**D51. Coins stay in memory until M3a.**
What: M2 keeps the jar in memory (a reload resets it); M3a starts writing the frozen `coin` events. The M2 warm-up "shown once" flag already uses the `meta` store (D47i).
Why: persistence is M3a's job; writing coin events before the event log exists would need a second migration path.
How to revisit: PLAYTEST for M2 says so.

**D52. The `?debug` stage/operations picker stores its values in the `settings` store under `debugSkillConfig`.**
What: survives reloads during M1–M2 playtests; M3a ignores and deletes the key once `skillConfig` events exist.
Why: the picker needs somewhere per device to live before the event log exists.
How to revisit: n/a after M3a.

**D53. The Home gear is inert before M3a.**
What: in M2 the gear renders but its long-press has no target; stage changes go through `?debug`.
Why: §5.2 gives the gear a target only from M3a.

**D54. The waiting service worker activates on cold launch or after 30 s of Home idle.**
What: a waiting worker is activated (with reload) while the Splash is still showing (cold launch), or after Home has had no input for 30 s. Never on any other screen.
Why: §2 and §15 say "on Home when idle" with no threshold.
How to revisit: one constant in `src/app/pwa.ts`.

**D55. Results tally counts by ones to ten, then by fives, ending on the exact total.**
What: "…fifteen, twenty, twenty-three!".
Why: §5.7 did not say where the count ends.

**D56. Tap-to-skip is exempt from the eat animation lock.**
What: the OPEN_ITEMS #9 default; every other tap is still ignored while the lock is held.

**D57. Tier 1 renders only `frames1`; `frames2` is supported in the model from M1.**
What: A1–A3 never exceed 10. The tray model, `toTrayTask` and `check` support `frames2` from M1 (tested), and the M1 mock shows the two-frame layout.

**D58. The service worker is registered from app code (`injectRegister: null`, `virtual:pwa-register`).**
Why: `vite-plugin-pwa`'s default inline registration script would be blocked by the `default-src 'self'` CSP.

**D59. Dev-only dependencies beyond SPEC §2.**
What: `tsx` (runs the TS scripts cross-platform), `cross-env`, `@vitejs/plugin-react`, `typescript-eslint`, `@eslint/js`, `globals`, `eslint-plugin-react-hooks`, `eslint-config-prettier`, `fake-indexeddb` (IDB unit tests), `workbox-window` (peer of `vite-plugin-pwa`'s register module, bundled), `@types/react*`, `@types/node`. Icons are rasterized with the Playwright Chromium already needed for e2e (no `sharp`). No runtime dependencies beyond §2.
Why: the spec implies this tooling without listing it; CLAUDE.md asks for one entry.
How to revisit: remove any that a later milestone stops using.

**D60. Toolchain versions (M0).**
What: Vite 8, Vitest 5, React 18.3 (spec), ESLint 9 (flat config), TypeScript **6.0** rather than 7.x, all pinned exactly in `package.json`.
Why: `typescript-eslint` supports TypeScript `< 6.1`; ESLint 10 is new and `eslint-plugin-react-hooks` is fine with 9. Exact pins keep the owner's Windows machine, CI and the cloud session on the same toolchain.
How to revisit: bump together once `typescript-eslint` supports TS 7.

**D61. M0 test and tooling assumptions.**
What: (a) The e2e `overscroll-behavior` assertion is skipped where the engine does not support the property: Playwright's Windows WebKit port reports none (Safari 16+ supports it; the CSS is in place either way). (b) The iPhone projects use 844×390 / 390×844 (standalone size, SPEC §2.2) instead of Playwright's Safari-tab 750×342 descriptor. (c) `lint:content` and `content:table` exist from M0 as stubs that print "no content yet", so `npm run check` has its final shape; the real checks land in M1/M2. (d) Fonts ship Andika's Latin subsets only (400 and 700); the app is US-English (SPEC §16). (e) Milestone screenshots come from `tests/e2e/screens.spec.ts`, run with `NCMC_SCREENS=M<n>` (skipped otherwise). (f) The turn cue sits at the stage's right edge for its 6 s; it ignores taps.
Why: each is a gap between the spec and what the tools can do on the owner's Windows machine, or wording the spec left open.
How to revisit: (a) drop the guard if the cloud WebKit reports the property; (d) add subsets if localization is ever wanted.

**D62. M1 layout mock geometry (service screen; positions of the bell, bin, taken-away row, cloche lid and bubble amended by D63).**
What: the service layout is one table, `SERVICE` in `src/app/metrics.ts`. (a) **S0 rows are 112 logical px tall**, not the ≈ 80 px D48 sketched: Peek, the answer display and backspace sit at y 292–404 and the digit row at y 414–526, so every S0 button stays ≥ 56 CSS px at 844×390 (60.7 measured). (b) **Take one back** sits right of the bin (x 650–774, bottom band), add mode only; remove mode has no such button (tapping the bin puts one back, D42). (c) **Taken-away row** is a 2 × 5 grid of 56-px dashed slots right of the centred `frames1` tray (x 916–1240), tapped as one target (175 × 75 CSS px at 844×390); the tray keeps its size and position. (d) **CountTogether** mini frames keep 36-px cells but use a 3 px gap and 4 px padding (200 px per frame), so the two-frame bubble is 432 px wide; it overlaps the monster zone by 32 px and the monster shrinks to its left (x 300–410). (e) Tray group colour is a 5 px ring on the cell, so the five-wall tint stays visible under the emoji. (f) **S0 cloche:** while it is lifted (Peek, Worked, FollowMe) the bin and take-one-back return to the bottom band and the lifted lid sits right of the tray with a "123" badge; tapping the lid lowers the cloche and brings the digits back. After Worked/FollowMe the digits return on their own (D41). (g) The mock is reachable at `?mock=<frame>` only in `VITE_E2E=1` builds (`npx cross-env VITE_E2E=1 vite` for dev); production builds drop it (build test).
Why: D48's band heights could not hold 112-px buttons; §3.3/§5.4 left the slots and the Peek return path to the mock.
How to revisit: owner's review of `docs/screens/M1/mock/`; geometry changes are edits to `SERVICE` only.

**D63. Service layout after the owner's mock review: ticket centred, monster right, bell beside the tray (amends SPEC §5.4 and D62; monster, ticket and bell positions superseded by D64).**
What: (a) The **ticket** moves to the centre, straight above the tray (x 450–830); the **monster** stands at the right (x 880–1240). (b) The **waiting line stays on the left by the door**, so nothing else moves: monsters wait by the door and walk to the counter on the right. (c) The **bell sits beside the tray**, vertically centred on it (frames1: x 920–1064); at S0 it joins the Peek · display · backspace row; for `frames2` (M5) the two-frame tray shifts left (x 40–1056) to make room. (d) With the bell on the right, the **taken-away row** and the **lifted cloche lid** move to the left of the tray; the **bin** is centred under the tray with take one back to its right. (e) The **CountTogether bubble** sits in the monster zone at one width for one or two frames (428 px), so the counting line never wraps; the monster shrinks to 64 px below the bubble's tail. The tail is drawn in the bubble's own colours (the first mock showed a stray grey triangle, a badly drawn tail).
Why: owner feedback 2026-11-05 on the M1 mock: the problem should be centred above the tray, and the bell next to the tray makes "the bell sends the food" obvious.
How to revisit: positions are the `SERVICE` table in `src/app/metrics.ts`. If the line by the door reads poorly once monsters walk across (M2), the fallback is a small row of plate icons by the door instead of silhouettes.

**D64. Monster just left of centre with the ticket beside it; bell back in the bottom band next to the bin (amends D63; monster, ticket and bubble positions superseded by D65).**
What: (a) The **monster** stands just left of centre (x 360–600) and the **ticket** sits right beside it (x 624–1004), so customer and order read as one. The waiting line stays by the door on the left. (b) The **bell** returns to the bottom band, always next to the bin: right of **take one back** when that button shows (add mode, x 954–1098), otherwise straight right of the bin (remove mode and S0, x 810–954). At S0 there is no bin on screen, but the bell keeps that same spot so it never jumps around between stages. (c) The two-frame tray (M5) is centred again. (d) The CountTogether bubble now sits over the monster's spot (x 200–628, y 8–218); the monster shrinks below its tail. Unchanged from D63: bin centred under the tray, taken-away row and lifted cloche lid left of the tray, one bubble width for one or two frames.
Why: owner feedback 2026-11-05 on mock rev 2: the child should feel they are serving the monster, so it belongs near the middle; the bell should sit by the basket, not by the tray or at the far right.
How to revisit: the `SERVICE` table in `src/app/metrics.ts`.

**D65. Monster centred, ticket right beside it; ticket slides right during CountTogether (amends D64).**
What: (a) The **monster** is centred (x 520–760). (b) The **ticket** (360 wide) sits 24 px to its right (x 784–1144), the same gap as mock rev 3. (c) During **CountTogether** the bubble is centred over the monster's spot (x 426–854) and the ticket slides right to x 904–1264, leaving a 50 px gap; it slides back afterwards. Unchanged from D64: bell in the bottom band next to the bin (after take one back when that shows), waiting line by the door, bin centred under the tray, taken-away row and cloche lid left of the tray.
Why: owner feedback 2026-11-05 on mock rev 3: the off-centre monster did not feel right; the bubble and ticket were too close.
How to revisit: `SERVICE` in `src/app/metrics.ts` (`ticket`, `ticketCounting`, `bubble`).

**D66. M1 service scope: a stand-in order plan, a short "Yum!", and back to the menu.**
What: until the §4.1 session builder (M2), `engine/plan.ts` draws 6 orders uniformly from the skill's filtered pool, with the no-repeat window (§4.1 step 5/9) and no food twice in a row; one placeholder monster serves every order. A correct serve plays a ≈ 1.6 s skippable "Yum! Eight!" instead of the M2 eat sequence; no coins are shown (D51). After the last order the service ends back on the menu board (Results is M2). `attempt` and `coin` events are built with the frozen shapes and kept in memory (visible only through the e2e probe) until M3a writes them. The A3 tile is shown but inert until M2; the A1 tile glows (first-run rule; last-played glow is M2). Close the café writes nothing yet (M3a: partial `serviceEnd`).
Why: M1 is the core loop; the session builder, eating, Results and persistence are M2/M3a work.
How to revisit: replaced piece by piece in M2 and M3a.

**D67. S0 Peek marks Help but plays no CountTogether and does not advance the attempt.**
What: Peek before the first serve makes a correct first serve `afterHint` (D41). It only lifts the cloche on the S3 model, so the attempt stays 1: a wrong serve after Peek still gets PlateCount → CountTogether, and a correct second serve is `fixed`. Help (Pip's hat) keeps §3.4's rule (attempt 1 → CountTogether → attempt 2). While the cloche is up for Peek the bell is disabled; tapping the lid (or Help) lowers it.
Why: D41 says Peek counts as Help for the outcome, but Peek shows a model, not the CountTogether script, so advancing to attempt 2 would skip CountTogether without having played it.
How to revisit: `peek` in `engine/attempt.ts`.

**D68. CountTogether details.**
What: the bell is disabled while Pip is counting; the tray stays editable throughout (SPEC §5.5). When the count ends the bubble stays up as a model until the next serve, which is evaluated as usual. Subtraction result forms count back from the minuend as the orange items fade ("Eight. Seven, six, five. Five left!"); missing-subtrahend forms (M2) end on "Three taken away!" (`ct.away`), missing-addend forms on "Three more!".
Why: §5.5 does not say whether the bubble stays, whether the child may serve mid-count, or how subtraction is counted.
How to revisit: `engine/countTogether.ts`, `runCountTogether` in `src/game/service/controller.ts`.

**D69. `TrayTask` refinement for S0.**
What: at S0 `toTrayTask` returns the S3 tray fields (the cloche model, D41) plus `entry: 'numpad1'` and `expected.typed = answer`; `check` compares the typed number when `entry` is set, otherwise the tray. (SPEC §3.1 allows names and shapes to be refined, not semantics.)
Why: the S0 task needs both the typed answer and the tray Worked/FollowMe play on.
How to revisit: `engine/tray.ts`.

**D70. Caption bubble slot.**
What: captions (SPEC §8.1: always on) sit in one bubble between the door and the monster, `SERVICE.caption` (x 144–414, y 16–140), clear of the CountTogether bubble and the waiting line. Every child-facing caption is ≤ 8 words (lint); ticket lines ≤ 12.
Why: the approved mock had no caption slot; this is the free space in the top band.
How to revisit: one rect in `src/app/metrics.ts`.

**D71. Worked and FollowMe always use the S3 tray; FollowMe can only end right.**
What: (a) at every stage (S1 and S0 included) Worked clears to the S3 start (prefill, or the full minuend) so the strategy is visible, and FollowMe repeats it there; at S0 that is the cloche tray (D41). (b) FollowMe pulses the next target (empty cell + bin, last item, take one back, or the bin for put-back); tapping the pulsing empty cell also places. The bell lights and pulses only when the tray (at S0: the typed number) is right, so a FollowMe serve is always correct; it is never pressed for the child. (c) At S0, once the cloche tray is complete the cloche lowers on its own, the digits return and the correct digit pulses.
Why: a count-on demo on an empty S1 tray shows no strategy; §5.5 does not say what happens on a wrong FollowMe serve.
How to revisit: `runWorked` and `canServe` in `src/game/service/controller.ts`.

**D72. A1/A2 strategy tags, difficulty and demo wording.**
What: addition `a = b` → `doubles`; `|a − b| = 1` → `nearDouble` (1+2 included); otherwise `countOn`; subtraction → `countBack`. Difficulty 1–5: near-doubles 1, then by larger addend (A1: larger − 1, A2: larger − 4); subtraction by minuend (A1: m − 1, A2: m − 5). The doubles line is split in two ("Three orange. The same!" then "Three and three is six.") to keep every caption ≤ 8 words.
Why: SPEC §4 names the orderings but not the 1–5 mapping; §13.2's 8-word caption limit.
How to revisit: `engine/generators.ts`, `engine/demos.ts`.

**D73. Layout mock removed; service controller is a plain class.**
What: (a) the `?mock` screen, its frames and `layout-mock.spec.ts` are deleted now that the real service screen exists; the approved shots stay in `docs/screens/M1/mock/` and all geometry stays in `SERVICE`. The 844×390 tap-size check moved to `tests/e2e/m1-taps.spec.ts` on the live screen. (b) The service is driven by `ServiceController` (`src/game/service/controller.ts`), a plain class with injected speech, SFX, clocks and timers, read by React through `useSyncExternalStore`: the React-hooks lint (v7) forbids reading refs during render, and the class can be unit-tested without a DOM. (c) The e2e hook gains `setTimeScale` (scales speech timeouts and scripted holds), `setSeed`, `setSkillConfig` and a `service()` state dump; all VITE_E2E-only (build test).
Why: a second copy of the layout would drift; the lint rule is part of `npm run check`.
How to revisit: n/a.

**D74. CI actions on current majors.**
What: `actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5` (all on the Node 24 runtime), clearing the Node 20 deprecation warnings.
Why: housekeeping before M1; confirmed by the owner's next push to `main`.
How to revisit: bump majors when GitHub deprecates a runtime again.

**D75. A tap's count cuts off the previous count (owner, M1 playtest).**
What: while building at S3, a new count stops the count still playing and speaks its own, so every tap is heard. Counts never cut off any other line (order, coaching, PlateCount); during those the count is skipped and the tone carries the feedback. "Busy" now ends when a line really ends (`end`/`error`); the timeout (SPEC §8.1) is only the fallback. Replaces "if speech is busy, skip" in SPEC §3.3/§8.2.
Why: the owner found counts went silent on quick taps: the old busy window was the timeout estimate (at least 1.2 s), so even "six" blocked the next count.
How to revisit: `countAloud` in `src/audio/speech.ts`. The owner may extend the cut-off to every line after playtesting; that is a one-line change (drop the `speechBusy()` check).

**D76. Caption bubble beside the monster, with a tail; hidden during CountTogether (owner, M1 playtest).**
What: amends D70. `SERVICE.caption` moves to x 250–520 (y 16–140), ending just short of the monster, with a speech tail on its right edge pointing at it. In M1 the tail points at the monster for every line; when Pip arrives (M2) narrator-style lines ("Now ring the bell!") may move to Pip's bubble. While the CountTogether bubble is up the caption hides, because that bubble already carries "Let's count together!" and the monster has shrunk aside.
Why: the owner found the caption too far from the monster to read as its speech.
How to revisit: one rect in `src/app/metrics.ts`; tail in `.caption::before/::after` (`service.css`).

**D77. Commas are dropped from spoken text only (owner, M1 playtest).**
What: `speakText` sends the speech engine the text without commas (`spokenForm`); captions keep them. Ellipses stay, as they are a wanted pause ("I see three… I wanted five."). Also "Hmm!" is dropped from `ct.start` ("Let's count together.").
Why: engines pause as long on a comma as between sentences, so "…cookies, please!" and "Thank you, chef!" sounded broken.
How to revisit: `spokenForm` in `src/audio/speech.ts`. Recorded audio (M10) would bypass it.

**D78. Playable menu tiles have solid borders (owner, M1 playtest).**
What: every playable tile is drawn with a solid border; the last-played tile keeps its glow (SPEC §5.3). Dashed borders are kept for tiles that cannot be tapped yet (faded, unbuilt). The taken-away row stays dashed: it is not a button, and the dashes mean "these are gone".
Why: dashed versus solid read as "not playable" versus "playable"; Big Bites looked disabled.
How to revisit: `.tile` / `.tile-soon` in `src/app/global.css`.

**D79. A fuller bin heap (owner, M1 playtest).**
What: the bin shows two overlapping rows (four behind, five in front) with about a third of each item overlapping its neighbour, all inside the crate's width, so nothing is clipped at the edges.
Why: the outer items were clipped and looked like they were falling out; the heap looked sparse.
How to revisit: `.bin-heap` in `service.css`, rows in `Bin` (`ServiceParts.tsx`).

**D80. WebKit e2e runs locally too, not only in the cloud (owner).**
What: amends D49. Every session that has Playwright's WebKit runs the WebKit projects, the owner's Windows machine included (`npx playwright test` runs the whole M1 set there: 62 passed on 2026-11-06). The cloud setup script still installs WebKit so cloud sessions can too. A session without WebKit says so rather than skipping silently.
Why: the cloud-only note came from an earlier session that had no WebKit; it never meant local runs should skip it.
How to revisit: `playwright.config.ts` projects; the setup script line in D49.

**D81. The ticket is not re-spoken on idle (owner, M1 playtest 2).**
What: amends SPEC §5.4. The 20 s idle repeat of the spoken order is removed at every stage. The order is spoken once when the monster arrives; tapping the ticket still replays it. Pip's hat still pulses after 10 s idle at S3.
Why: the child understands the ticket and never needed the repeat; hearing it again unprompted was annoying.
How to revisit: `scheduleIdle` in `src/game/service/controller.ts`; `HAT_PULSE_IDLE_MS` in `src/engine/config.ts`.

**D82. Tapping a placed item always sends one back to the bin; no "take one back" button (owner, M1 playtest 2).**
What: amends SPEC §3.3 and D64. In add mode a tap on a placed item now removes one (the last unlocked cell, D30), as remove mode always did. The tap-to-count hop is gone, and so is the *take one back* button in every mode. A tap on a locked blue prefill item shakes that item and removes nothing, so touching a blue item never takes away one of the child's orange items. Dragging an item to the bin still works. The bell sits right of the bin at every stage. FollowMe's "too many" cue now pulses the last item in both modes (the old `takeBack` cue is gone).
Why: the child counts the items by eye without touching. A tap that removed items in subtraction but only counted them in addition was confusing. One meaning everywhere is simpler, and the child already taps items to take them away.
How to revisit: `tapItem` in `src/engine/tray.ts`, `followMeCue` in `src/engine/demos.ts`, `SERVICE.bell` in `src/app/metrics.ts`.

**D83. No last-played glow on the menu (owner, M1 playtest 2).**
What: amends SPEC §1.2 and §5.3, and D78. Every playable tile looks the same (solid border, no glow). Tiles that can't be played yet stay dashed and faded.
Why: the glow made Little Bites look different from Big Bites, and the child found the highlight confusing.
How to revisit: `.tile` in `src/app/global.css`, `Menu.tsx`.

**D84. CountTogether: the monster stands left of a larger bubble (owner, M1 playtest 2).**
What: amends SPEC §5.5 and D65's bubble placement. While the model bubble shows, the monster shrinks to 120 px and stands on the counter at x 262, in front of the waiting line. The bubble runs from its right side to the ticket (x 404–888) and from y 8 down to the counter (h 282), with its tail pointing left at the monster. One frame is drawn with 64-px cells (was 36); two frames sit side by side with 42-px cells. The title is 38 px and the running count 40 px (both were 30). On an iPhone (scale ≈ 0.54) a single-frame cell is ≈ 35 CSS px, up from ≈ 19.
Why: on the iPhone the pictures and text in the bubble were too small to read.
How to revisit: `SERVICE.bubble`, `SERVICE.monsterAside`, `MODEL_ONE` / `MODEL_TWO` in `src/app/metrics.ts`; `ModelBubble` in `ServiceParts.tsx`.

**D85. Bin items are placed by their centres (owner, M1 playtest 2).**
What: amends D79. Each item in the bin heap is absolutely positioned at a fixed share of the bin's width (front row 13 %–87 %, back row in the gaps) instead of flowing in a row with negative margins. The two-row heap and the overlap are kept.
Why: the flowing row's width depended on the emoji font's glyph width. Segoe (Windows) is wide enough to fill the crate, but Apple's emoji are narrower, so on iOS the heap bunched up in the middle. Centre positions give the same spread with any font, so the laptop view stays as it was and iOS now fills to the edges.
How to revisit: `FRONT_ROW` / `BACK_ROW` in `Bin` (`ServiceParts.tsx`), `.bin-heap` in `service.css`.

**D86. The bell rings before the monster speaks; sound effects wait for audio to resume (owner, M1 playtest 2).**
What: amends SPEC §5.6 and §8.3. After a serve, the monster's line ("Yum!" or the plate count) starts 500 ms after the bell press (`BELL_LEAD_MS`), so the ding is heard first. And when the AudioContext is not running (iOS marks it "interrupted" while speech plays), a sound effect now resumes it and plays as soon as it is running, if that happens within 250 ms; before, it was skipped.
Why: the owner never heard the bell (silent switch off), and tray tones were missing whenever a count was spoken. iOS pauses WebAudio while speech plays, and the tap's resume is asynchronous, so a tone started in the same tap found the context not running and was dropped. A line spoken at the moment of the press also swallowed the ding.
How to revisit: `BELL_LEAD_MS` in `src/engine/config.ts`; `whenRunning` in `src/audio/sfx.ts`. If tray tones are still lost under the counting voice on the real iPad, the next step is to start each count a tone-length (≈ 120 ms) after its tone; this was not done here because it adds lag to counting, which the owner said already feels right.

<!-- New decisions go above this line, numbered one higher than the highest existing D<n>. -->

---

## Adversarial review log (what the self-review found in the first draft, all fixed in SPEC.md)
(Rows 8 and 10 describe draft-1 mechanisms later superseded by D7 and D8; the underlying concerns are still covered. Rows 3, 16 and 25 mention chef hats and Chef's Pick, which were later removed entirely, D28.)

| # | Finding | Fix |
|---|---|---|
| 1 | Zero-result facts (e.g. 5−5) deadlock at S1: empty tray equals start state, bell disabled | D11; zero excluded, A1 pool 24 → 20 |
| 2 | `autoUpdate` PWA would reload the page mid-service | D12; `prompt` registration, e2e test |
| 3 | Hat 3 "70% of the pool" unreachable for B2 (684 facts); hats removed later, D28 | D13 (tombstone) |
| 4 | CountTogether "mirrored copy beside the tray" had no room on the 1280×720 layout (tray is ~980 px wide) | Model bubble in the monster zone with 36-px cells |
| 5 | Strict `default-src 'self'` CSP would break React inline styles | CSP spec expanded |
| 6 | Ten-pack described as SVG `<use>` of emoji (text) — doesn't work | HTML glyph grid inside SVG box; emoji never in SVG `<text>` |
| 7 | Pool counts were ordered presentations while mastery uses canonical keys — lint would compare wrong numbers | Clarified both |
| 8 | Portrait overlay blocked access to the parent gear on phones | Gear on the overlay; parent area orientation-agnostic |
| 9 | Palm rejection via touch width/height is a no-op on iOS | Marked best-effort; single-pointer rule is the defense |
| 10 | Daily cap reached: "Another service" on Results still offered; pending requeues unspecified | Hidden; requeues dropped with box 0 |
| 11 | A0 stage meanings undefined (no equation/prefill) | Defined |
| 12 | B-track spoken counting undefined | Tens then ones |
| 13 | Spoken plurals ("cherries") not modeled; broken favorite emoji for Blobbo (🧁 is Unicode 11) | `{singular, plural}` per food; Blobbo → 🍰/🍓 |
| 14 | B2 subtraction constraint in the table (k ≤ ones) disagreed with the computed pool (k < ones) | Table corrected |
| 15 | No first-run teaching for the very first order | Ghost-hand tutorial |

### Round 2 review (changes made after the owner's answers)

| # | Finding | Fix |
|---|---|---|
| 16 | A hat earned independently on two devices would pay +10 twice after a merge (hats removed later, D28); same for `serviceEnd` and duplicate purchases | Earned coins dedupe by svc id (and formerly hat); spent counts distinct items |
| 17 | Replay-derived coin totals could shrink after a merge, violating "nothing is taken away" | Coin amounts are stored in events, not recomputed |
| 18 | Per-device sequence numbers in event ids can collide after a restore | Random UUID ids |
| 19 | Seeding known facts as events would double-seed two fresh devices | Preset applied implicitly before replay |
| 20 | GitHub Pages shares one origin across the owner's other apps: storage and cache cleanup could touch them | `ncmc` prefix everywhere; ESLint + test (D18) |
| 21 | Rotated portrait stage breaks raw `clientX/Y` drag math | Single `toStageCoords`, unit and e2e tests |
| 22 | Android back gesture exits the PWA mid-service | Back guard (D19) |
| 23 | Per-service clock would reset on reload | Persisted in the `resume` snapshot |
| 24 | Voice settings differ between iOS and Android; syncing settings would break one of them | Settings are per device; optional copy on import |
| 25 | The child's known +0/+1/doubles would make A1 and early A2 boring | Known preset (D16). The draft's assumed-known A0/A1 and Chef's Pick start were removed, D22/D28 |

### Round 3 review (play allowance and tiers)

| # | Finding | Fix |
|---|---|---|
| 26 | Both earlier timer readings let the child restart their way to endless play | Persistent lock until the parent gate acts (D7) |
| 27 | Wall-clock subtraction would let a clock change refund time; killing the app mid-interval would lose it | Monotonic active-time accumulator flushed every 5 s |
| 28 | Leaving the app open and walking away would burn the allowance | 90 s idle pause |
| 29 | Locking mid-monster would be abrupt, and a dawdling child could stall forever | Finish current monster with a 90 s hard cap |
| 30 | The shop is also play time; leaving it unmetered would defeat the lock | All child-facing screens count |
| 31 | Allowances are per device, so another device is a loophole | Documented honestly (SPEC §6.4); Guided Access / Screen Pinning suggested |
| 32 | Tier 1 without a shop gives coins nothing to do | Coins accrue as events and show in the jar; shop is the first Tier 2 item |
| 33 | Default of "no timer" contradicts the hand-off goal | Default was 15 minutes; **superseded by D27: off by default, parent opts in** |

### Residual risks the review could not close (need real devices or playtest)
- iOS Safari TTS quality/latency and `onend` reliability, silent switch behavior, audio after backgrounding.
- Whether the explicit bell press is discoverable to the child unaided (tutorial mitigates).
- Whether FollowMe feels tedious after wrong-wrong (steps capped at 10; tune in playtest).
- Estimate risk: M1 and M2 are the densest; the Tier 1 estimate (target ≈ 10 h, redone in PLAN.md per D36) has no slack. Expect M1 to run over if drag, TTS, and demos all land at once.
