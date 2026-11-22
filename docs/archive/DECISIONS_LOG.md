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

**D53. The Home gear is inert before M3a (superseded by D94).**
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

**D87. A stuck sound player is rebuilt on the next tap; sound test on the debug screen (owner, M1 playtest 3).**
What: amends SPEC §8.3 and D86. Every pointerdown checks the AudioContext. A suspended one is resumed, as before. One that is interrupted, closed, or "running" but with a clock that hasn't moved for 600 ms is closed and replaced by a fresh one inside that tap (plus one silent sample, which older iOS needs to unlock output). Tones start 30 ms ahead of the audio clock, and place/remove tones last 0.16 s (was 0.12). The `?debug` screen gets a **Sound test**: the context's state and clock, contexts built/rebuilt, tones played/skipped, buttons for Tone, Bell, "Speak, then bell", "Bell, then speak" and "Rebuild sound", and a picker for `navigator.audioSession.type` (iOS 17+; stored per device under `ncmc.debug.audioSession`; default `playback` as before).
Why: after D86 the bell still never rang on the iPhone/iPad. Tones played for a while, sounded clipped, then stopped for good, while speech kept working. That matches iOS leaving WebAudio stuck after speech, where `resume()` doesn't bring it back. The clipping matches tones scheduled at the exact current time of a context that had just resumed. This can't be reproduced off the device, so the sound test is there to show what the context is doing on it.
How to revisit: `ensureAudio` in `src/audio/unlock.ts`, `START_LEAD_S` in `src/audio/sfx.ts`, `AudioTest.tsx`. If rebuilding doesn't fix it, the fallback is to play the effects as short audio files through `<audio>` elements (generated at build time, still no network), which needs a SPEC §8.3 change ("no audio files").

**D88. The order stops when the child starts building; no audio rebuild while speech plays; a stuck line is retried once (owner, M1 playtest 4).**
What: amends SPEC §5.4, §8.1 and D87. (a) While the order is being read, the first tray, bin, taken-away row, digit or rub-out action cancels the order line, the tap's tone and count play at once, and the tray works normally. Tapping the ticket still replays it; serving or Help is never cut this way. (b) `ensureAudio` no longer replaces the AudioContext while `speechSynthesis.speaking` is true; it waits until speech has stopped. The tap that cuts the order does not rebuild either (the engine is still tearing the line down); its tone resumes the context, and a later tap rebuilds it if it is still stuck. WebKit can leave `speaking` stuck at true, so a flag seen true for more than 9 s (longer than any line, SPEC §8.1) is ignored. (c) A line (not a count) that has not fired `start` 1.5 s after `speak()` is cancelled and spoken once more with a fresh fallback timeout, and a paused engine is resumed before each line. Lines whose fallback is under 1.5 s ("Yum!") are already settled by then and are not retried.
Why: after D87 the owner found that a tap while the monster was talking cut the line off, the next order was silent, and speech came back only after a long while. Taps during the order also did nothing until the line ended, then "caught up". D87 rebuilt the AudioContext on any tap where iOS had paused WebAudio, which it does during every spoken line. Building a new context then takes the audio session from the speech engine, which fits the line cutting off, later lines going silent, and the tap being held up. The owner wants an eager child to be able to skip the rest of the order by starting to build.
How to revisit: `cutTicket` in `src/game/service/controller.ts`; `speechTalking` in `src/audio/unlock.ts`; `START_WATCHDOG_MS` in `src/audio/speech.ts`.

**D89. A first miss only names the wanted number; the second miss offers help; the third plays the demo unasked (owner, M1 playtest 5).**
What: amends SPEC §1.1 point 3, §3.4 and §5.5, and D29's flow (not its outcomes or box effects). (a) First wrong serve: PlateCount, then straight back to building (attempt 2) with the tray as served and the bell live; no CountTogether. Pip's hat pulses until the next serve or Help. (b) Second wrong serve: PlateCount, then the monster asks "Want Pip to help? Or try again?" with two picture buttons over the hidden tray: Pip (yes) and a ten-frame in a circling arrow (no). The bell and tray are locked until the child chooses; Pip's hat also counts as yes. Yes plays Worked → FollowMe → `assisted` + requeue. No repeats the order and the child builds again. (c) Third wrong serve: Worked → FollowMe with no question. (d) Help after a miss plays Worked → FollowMe; Help before any serve still plays CountTogether, and a wrong serve after that still goes straight to Worked (D29). Outcomes are unchanged: right after any number of misses without the demo is `fixed`.
Why: the owner saw that the PlateCount line ("I wanted eight. One more!") is usually enough for a single slip, and making the child sit through the whole CountTogether before the bell came back turned a quick fix into a long interruption. Struggling children still get the demo: they can ask for it at any time, it is offered after the second miss, and it is no longer optional after the third, because the children who need help most are often the ones who turn it down.
How to revisit: `afterMiss` in `src/engine/attempt.ts` (when to retry, offer or demo); `HelpChoice` in `src/game/service/ServiceParts.tsx`; phrase `offer.help`.

**D90. Pip becomes the helper now: a placeholder Pip on the counter who says every help line in a higher voice (owner, M1 playtest 5).**
What: pulls part of M2's "Pip" item (SPEC §7.3, D76) forward. (a) A placeholder full-body Pip (the Help button's mouse with a body, apron and tail; `src/art/PlaceholderPip.tsx`) stands on the counter left of the monster during OfferHelp, CountTogether, Worked and FollowMe, popping up when it arrives and bobbing while it talks; the waiting-line silhouettes hide while Pip is out. During CountTogether Pip takes the shrunken monster's spot so the model bubble's tail points at Pip, and the monster steps further left. (b) Pip says the CountTogether, demo and FollowMe lines, in a caption whose tail points down at Pip, with the same voice at pitch 1.5. The monster keeps the order, PlateCount, the help question ("Want Pip to help? Or try again?"), "Yum!" and the closing line. (c) The help offer's "yes" button shows the full Pip, so it matches the Pip standing on the counter. (d) The "try again" arrow now has its head at the end of the turn (owner).
Why: the owner pointed out that the D89 offer's Pip picture meant nothing: the monster said every help line and Pip was only a mouse face on the Help button, so "Want Pip to help?" named someone the child had never seen help. With Pip visibly giving the help, the hat button, the offer and the helper are one character.
How to revisit: `PIP_PITCH` in `src/audio/speech.ts` (real voices differ in how pitch sounds; it may need tuning or a second voice); `SERVICE.pip` and `monsterAsideForPip` in `src/app/metrics.ts`; `PIP_PHASES` in `src/game/service/controller.ts`. The hand-authored Pip art is still M2.

**D91. A tap gets a count or a tone, never both; Pip steps back slowly; the waiting line stays away until the monster is home (owner, M1 playtest 6).**
What: amends SPEC §3.2, §5.5 and §8.3, and D90. (a) Place/remove tones play only where nothing is counted aloud: S3 taps (which count on or back) and Pip's worked demo get the spoken number alone; S1/S2 taps, FollowMe below S3 and the S0 digit pad keep their tones. The bell, "Yum" chime, "hm", and wobble/shake tones are unchanged. (b) Pip no longer vanishes when help ends: it sinks back behind the counter over 0.5 s (`PIP_EXIT_MS`), and the monster's moves between its spot, the CountTogether aside and the Pip aside take 0.5 s (was 0.3). (c) The waiting-line silhouettes stay hidden while Pip is out *or* the CountTogether bubble is up, and come back (fading in) only `MONSTER_MOVE_MS` after the monster has started back to its own spot.
Why: the owner heard Pip's counting and the food tones step on each other and asked that tones be limited to modes without spoken counting. The hand-off from Pip to the monster felt a hair too quick. And when CountTogether ended, Pip left and the line reappeared while the monster was still standing left of the bubble, so the monster looked as if it stood on top of the last waiting monster.
How to revisit: `applyTray` and `runWorked` in `src/game/service/controller.ts`; `PIP_EXIT_MS` / `MONSTER_MOVE_MS` in `src/app/metrics.ts` (kept in step with `.pip-slot.leaving` and `.monster-slot` in `service.css`); `useHold` in `src/game/service/useHold.ts`.

**D92. Decisions folded into SPEC; DECISIONS.md becomes an index; finished review docs archived (owner).**
What: every live decision D1–D91 is folded into the section of `docs/SPEC.md` it governs, in present tense, with a `(Dn)` citation; superseded text and the removed features (D28) are gone from SPEC; section numbers are unchanged, so code comments citing `SPEC §x` stay valid. The full decision log moved unchanged to `docs/archive/DECISIONS_LOG.md` (this file); `docs/DECISIONS.md` is now a one-line-per-decision index with each entry's status (in SPEC §x / partly superseded / implementation only / removed). `SPEC_REVIEW.md`, `SPEC_REVIEW_2026-11-04.md` and `KICKOFF.md` (finished work) moved to `docs/archive/`. New rule: a new decision gets its full entry here, a line in the index, and the SPEC change in the same commit. Implementation-only decisions (toolchain, CI, tests, code structure) stay out of SPEC. No decision was changed.
Why: SPEC had stopped tracking decisions around D47, so the current design had to be pieced together from about 42 "amended by"/"superseded by" chains, SPEC and DECISIONS contradicted each other (e.g. the A1 first-run highlight vs. D83), and `docs/` cost about 80k tokens per fresh session.
How to revisit: restore the old layout from this archive or from git history (the commit before this one); the content is unchanged.

**D93. The monster's move between spots takes 550 ms (owner, 2026-11-09).**
What: amends D91(b). The monster's moves between its own spot, the CountTogether aside and the Pip aside take 550 ms (`MONSTER_MOVE_MS`), not the 0.5 s D91 states; Pip's exit stays 500 ms (`PIP_EXIT_MS`). The code already used 550 ms; the owner confirmed it is intended.
Why: found while folding D91 into SPEC (D92): the text and `src/app/metrics.ts` disagreed.
How to revisit: `MONSTER_MOVE_MS` in `src/app/metrics.ts`, kept in step with `.monster-slot` in `service.css`.

**D94. Before M3a, a long-press on the Home gear opens the playtest tools, with no gate (owner, 2026-11-09; amended by D95).**
What: supersedes D53. (a) Before M3a, a 2 s long-press on the Home gear (top right, 44 px, 30% opacity; `GEAR_LONG_PRESS_MS = 2000` in `src/app/metrics.ts`) opens a "Grown-ups" playtest-tools screen with the same content as the `?debug` screen: build/storage info, the per-skill stage/operations picker (D44, D52) and the sound test (D87). A short tap does nothing. The gear exists only on Home, so the screen is never reachable during a service. (b) The screen is full-screen, not rotated, and scrollable, like the parent area (SPEC §2.2). A big "Back to the café" button returns to Home, and so does the back gesture (Android back, iOS edge swipe), so nobody is trapped (SPEC §2.3). (c) Picker changes apply from the next service. It is parent area, so it will not count as play time (§6) once that exists. (d) `?debug` keeps working unchanged for desktop/browser use. (e) M3a turns this screen into the minimal Skills list (still opened by the gear without a gate); M3b puts the multiplication gate in front (D44 otherwise unchanged).
Why: the owner playtests from the installed Home Screen app, whose start URL can't carry `?debug`, so changing stages or running the sound test meant switching to a browser tab. On iOS a Home Screen app and a Safari tab keep separate storage (SPEC §11.4), so the picker in a Safari tab could not even configure the installed app, and the sound test there tested a different audio setup from the installed app's.
How to revisit: if the child finds and opens it, lengthen the press (`GEAR_LONG_PRESS_MS`) or bring the M3b multiplication gate forward.

**D95. A gear tap opens a hold-to-open popup with a filling ring; the gear is 88 px with real gear art (owner, 2026-11-09).**
What: amends D94. (a) Owner's playtest of D94 on the real devices: the 2 s hold on the gear did nothing and gave no feedback, and the gear was too small to tell whether it was being touched (44 logical px ≈ 24 CSS px on the iPhone, ≈ 41 on the iPad; the hold also cancelled as soon as the finger drifted off that small square). It also looked like a grey star. (b) The gear is now 88 logical px (≈ 47 CSS px at 844×390, the tap-target minimum), still 30% opacity, brightening while pressed, drawn as a real gear (8 square teeth, a centre hole); `GEAR_SIZE` in `src/app/metrics.ts`. (c) **Tapping** the gear immediately opens a popup in the middle of the stage: title "For grown-ups", text "Press and hold the circle for two seconds to open the settings.", a large light-blue circle (≈ 220 logical px across, wider than a fingertip) and a **Close** button. Tapping outside the popup or the back gesture also closes it (no break dialog). (d) Pressing and holding the circle draws a darker blue ring around its outside, starting at the top and running clockwise; it closes after 2 s (`GEAR_LONG_PRESS_MS`), then the popup disappears and the playtest tools (D94) open. Lifting the finger early, or sliding well off the circle, empties the ring; nothing opens. The ring is drawn per frame (not a CSS animation), so it also shows with reduced motion. (e) The circle blocks the iOS long-press behaviours (callout, magnifier) on its touchstart so a still finger is not cancelled. (f) From M3b the multiplication gate follows the completed hold (D44 unchanged).
Why: the owner needs clear feedback that the hold is working; a short tap must still never open settings, but a child who taps the gear sees only a popup of grown-up text and a circle.
How to revisit: if the child learns to hold the circle, bring the M3b multiplication gate forward; if the hold is still unreliable on iOS, report what the ring does.

**D96. A correct serve fills the ticket's blank with the answer in green (owner, 2026-11-09).**
What: amends the ticket in SPEC §5.4. When a serve is correct (the attempt enters `eating`, at every stage and after any help path), the dashed box of the blank is replaced by the answer as a number in the result green (`--c-role-result`), whatever the blank's role colour was (so in `? + 4 = 14` the filled-in 10 is green, not orange). It pops in (scale) with motion, and appears without animation under reduced motion. The finished sentence stays until the next order's ticket replaces it. Nothing changes on a wrong serve: the blank stays dashed. Added to M2 by the owner.
Why: the child sees the whole, true number sentence at the moment of success, linking the tray she built to the written fact. Green means "done" here, and the dashed box would otherwise still say "unknown" while the monster eats.
How to revisit: if the green answer competes with the eating for attention, delay it until the monster's reaction ends; if it should keep the role colour instead, change `.tok-solved` in `service.css`.

**D97. Session builder gaps: new facts keep the add/sub balance reachable; requeue fallback; in-memory "seen" until M3a (agent, 2026-11-09).**
What: fills gaps in SPEC §4.1 found while building it (M2 step 1, `src/engine/session.ts`). (a) When `ops` is both, the (≤ 3) new facts are chosen so the ±1 add/sub balance can be met: if the seen facts of one operation are fewer than that operation's minimum count this service (A1: at least 2 subtractions in 6 orders; A2: at least 3), that many of its easiest new facts are introduced first; the remaining slots alternate addition and subtraction (SPEC §4), each operation in its own difficulty order. With the default `known` preset (addition only) the first A1/A2 service with both operations therefore introduces subtraction facts. (b) The ±1 band is `ceil(target − 1)` … `floor(target + 1)` additions, `target = share × orders`. (c) Requeue placement: a 3–5-later spot must not sit next to the same fact or the same monster; otherwise it is appended; if the end would sit next to its own fact or monster, the latest spot that keeps at least one order in between is used. If nothing satisfies both, its own fact never sits next to it, but its monster may (a fact repeated back-to-back is worse for practice than a monster seen twice). (d) The requeue keeps its monster, takes the commuted presentation of an addition fact when one exists, a food different from the original and its neighbours, and one more support stage. (e) Until M3a writes `attempt` events, a service's starting state is the `known` preset plus the facts introduced earlier in the same app session (in memory, lost on reload), so successive services move through the pool. (f) Monsters come from the six regulars, never the same twice in a row; guests arrive with the service counter in M3a.
Why: SPEC §4.1 states the rules but not how the new-fact cap and the balance interact (they conflict on the first service, when only addition is seen), nor what to do when a requeue fits nowhere.
How to revisit: if the first services feel subtraction-heavy, lower the reserve or the A1 target share; requeue placement rules live in `withRequeue`.

**D98. A3 Perfect Ten: strategy tags, make-ten demo wording, missing-subtrahend demo ending (agent, 2026-11-09).**
What: (a) A3's addition forms (`a + ? = 10`, `? + a = 10`) are tagged `makeTen`; its subtraction forms (`10 − a = ?`, `10 − ? = a`) are tagged `countBack` and use the count-back demo, since taking items off a full ten is already the clearest model. (b) Make-ten demo (Pip): the blue part glows ("Seven."), the empty cells to ten glow ("Three empty spots." / "One empty spot."), they fill one by one with counts ("eight, nine, ten"), then the whole frame glows: "Seven and three more makes ten!" Each caption ≤ 8 words (D70). For `? + a = 10` the known addend is the blue part, as on the tray. (c) The count-back demo for a missing subtrahend (`10 − ? = 6`) ends with "Four taken away!" (the unknown) instead of "Six left!". (d) Difficulty: 5+5 and both 9+1 / 1+9 parts are 1, then 1 + distance from 5 (4/6 → 2, 3/7 → 3, 2/8 → 4), same for the subtraction forms by the part taken away. (e) Missing forms are spoken as the plain sentence ("Seven plus what equals ten?"), not wrapped with the food; only result forms are wrapped (SPEC §4). (f) A3 has no `known` preset (SPEC §4.2: missing-addend forms count as new).
Why: SPEC §5.5 gives the make-ten demo in one line and §4 says only "A3 → makeTen"; the subtraction forms and exact lines were open.
How to revisit: if the child prefers a make-ten picture for `10 − a`, tag those `makeTen` and add a "take away from ten" variant to `buildDemo`.

**D99. Warm-up order details: the ghost keeps pointing until touched, the flag is set at start, its monster and food (agent, 2026-11-09).**
What: fills gaps in the first-ever warm-up (SPEC §5.4, D26). (a) The ghost hand only points (a pale hand tapping in place with a ripple); it never places an item or presses the bell. Once shown it keeps tapping until the child touches anything, and it comes back after every further 4 s without a touch (`WARMUP_GHOST_IDLE_MS`), at the bin while the tray is unchanged and at the bell once the item is on it. (b) Each time the ghost moves to the bell, Pip pops up and says "Ring the bell to serve!" in Pip's voice and caption. The ghost waits while the order is still being read. (c) The `warmupShown` flag (`meta` store) is set when the warm-up service starts, so leaving early never shows it again. (d) The warm-up monster differs from the first planned monster; if the first planned order was cookies, it gets another food so cookies are not served twice in a row. (e) A wrong serve in the warm-up runs the usual PlateCount/help flow; it still writes no `attempt` and never requeues. Reduced motion: the hand points without moving.
Why: SPEC §5.4 says "a ghost hand taps the bin once" but not what happens if the child still does nothing, nor when the once-per-device flag is written.
How to revisit: if the repeating ghost is distracting, show each hint once; `warmUpIdle` in `src/game/service/controller.ts`.

## D100 — Monster art details: palettes, reactions, still poses, `?gallery`, café scene (2026-11-09)
**What:** The six regulars are drawn as hand-authored SVG (`src/art/monsters/`), with shared face parts so an expression reads the same on every monster: idle = open eyes, blink and bob; delight = happy arc eyes, open smile, cheeks; eat = squeezed eyes, wide mouth that chews 3 times; puzzled = pupils look up and aside, one brow raised, wavy mouth, and the body tilted 9° (a still pose, so it shows with reduced motion; it replaces the old CSS tilt on the slot); sleepy = closed eyes and drifting z's. Closed eyes on Zibbit's stalks keep an eyelid so they still read as eyes. Reactions are named ids (`melt`, `stomp`, `spin`, `hearts`, `burp`, `puddle`; guests `faint`, `sparkles`), about 1.4 s each so eat + react fits in 4 s. `spin` flips with `scaleX` (3-D `rotateY` on SVG is unreliable in Safari). Until the eat sequence (M2 step 5) the delight mood plays the reaction. Reduced motion turns off every monster animation and leaves the expression's still pose (hearts and the burp bubble rest in place). Palettes: Gruffles' purple is lightened to `#a57ae0` so eyes and mouth keep ≥ 3:1. `MonsterSpec` data lives with the art (`src/art/monsters/specs.ts`); a unit test keeps its ids and favourites equal to the engine roster. Arrive/thanks lines are drafted in the specs and wired with the voice lines in step 5. `?gallery` shows every monster at every expression plus its reaction, and Pip (look-only, like `?debug`); the e2e grid test and the M2 screenshot grid use it. Café background: the wallpaper stripes are CSS on the bleed, and a `CafeScene` SVG in stage coordinates (wainscot, floor planks, window, string lights, an empty wall-art frame as the M4 slot) sits behind every screen, kept muted so the monster, ticket and tray stay the brightest things.
**Why:** SPEC §7.2 fixes the roster and the five expressions but not how they look or move, and the screenshot grid needs one page that shows them all.
**How to revisit:** Owner playtest (monster appeal). Art can be redrawn per monster in `roster.tsx` without touching game code.

## D101 — Eat sequence, coin flight, monster voices and greetings, service tip (2026-11-09)
**What:** On a correct serve the monster eats **the plate as served** (the tray total: all ten for `7 + ? = 10`; the answer at S1/S0). After the bell lead, food flies from the tray (which slides up 30 px) into the mouth: up to 5 items one by one, 0.26 s each, each counted aloud in the counting voice; more than 5 by rows of five, 0.38 s per row, then the monster names the total ("Eight!"). Then 3 chews with a munch sound (1.05 s), then the reaction with the monster's thanks line in its own voice (1.3 s; Chompers also burps). Eat + react ≤ 4 s for every answer 1–20 (unit test; e2e measures it in real time). Then the 3 coins fly one by one to a coin jar at the bottom right of the service screen with a "ting" each; the jar shows the coins kept so far. Any tap skips straight to the coins, and a tap during the coins lands them at once. A first-try serve shows the same reaction scaled up 12% (D45). Each monster greets the chef the first time it arrives in a service ("Hee hee. Hello!") before its order; a returning (requeued) monster says "I'm back!" instead; the caption shows the order throughout. Monster lines use the monster's `voice` (pitch 0.6–1.3, all below Pip's 1.5 so Pip stays recognisable). Arrival plays the "boing". SPEC §9's +5 tip on completing a service is now paid (a 6-monster service pays 23); none on a voluntary exit.
**Why:** SPEC §5.6 fixes the shape (groups, ≤ 5 counted, total spoken, 3 chews, reaction, ≤ 4 s, skippable) but not the timings, what the monster eats on missing-amount forms, or when the monster's own lines are spoken.
**How to revisit:** Owner playtest (service length, whether the greeting slows orders, whether eating the whole ten on make-ten orders reads right). Timings live in `src/engine/eat.ts`.

## D102 — Pointer guard leaves native form controls alone (2026-11-10)
**What:** The single-pointer guard (SPEC §2.3) no longer claims a pointer that goes down on a `select`, `option`, `input` or `textarea`. It also releases the held pointer on any `change` event and on a `touchend`/`touchcancel` that leaves no finger on the glass.
**Why:** Playtest: after changing a stage picker (S3 → S1 on Perfect Ten) on the grown-ups' screen, no tap anywhere worked — not *Back to the café*, not *Open the Café*, not the gear. The native picker swallowed the finger's `pointerup`, so the guard kept that pointer as active forever and blocked every later `pointerdown`. These controls live only in the parent area, never on the play surface.
**How to revisit:** If a form control is ever added to the play surface, decide there whether it needs the single-pointer rule.

## D103 — Eating: the plate flies in together, the monster says only the answer (2026-11-10)
**What:** Replaces D101's flight. On a correct serve the whole plate flies into the mouth at once (each item 20 ms after the one before, 0.34 s flight) and the monster says the order's answer once in its own voice ("Eight!"), the same number that shows in green on the ticket (D96). Nothing is counted item by item, at any size. Chews, reaction, thanks, coins and skip are unchanged. For `7 + ? = 10` the monster still eats all ten on the tray but says "Three!".
**Why:** Owner playtest: the per-item counts (0.26 s apart) tripped over each other in the monster's voice.
**How to revisit:** Owner playtest. If saying the answer (not the tray total) reads oddly on missing-amount orders, say the total instead (`runEat` in `src/game/service/controller.ts`).

## D104 — Missing-number forms: the orange group is the answer (2026-11-10)
**What:** On missing-number forms (`a + ? = c`, `? + a = c`, `m − ? = c`) at S3/S2 and on the S0 cloche model, everything points at the unknown. The tray marks it (dashed orange empty spots up to the total; for `m − ? = c` an orange ring on the items to take away). S3 tap counts say the size of the orange group from one ("one, two, three"; taken away "one … four"). PlateCount names the orange group ("Two more… I wanted three. One more!", "Three taken away… I wanted four."). The tray demo fills or removes counted from one. The monster eats only the orange group (`7 + ? = 10`: the three added; `10 − ? = 6`: the four in the taken-away row) and says that number; what it ate stays off the tray until the next order. Amends D98 (demo counts), D101 (eats the tray total) and D103's note. Implementation: `TrayTask.unknown`, `spokenCount`, `childCount`, `eatenPlate` in `engine/tray.ts`; `plateCountLine(…, group)`.
**Why:** Owner playtest: on "What plus 5 equals 10" the answer is 5, but the monster wanted ten items, said "I see nine. I wanted ten." and ate all ten, which contradicted the answer. The owner chose this over serving these forms only at S1/S0, to try first.
**How to revisit:** Owner playtest. If S3/S2 missing-number orders still confuse, restrict them to S1/S0 (the generator's pool by stage) and serve result forms at S3/S2.

## D105 — S1 help on missing-number forms plays in the model bubble (2026-11-10)
**What:** CountTogether on missing-number forms tells the make-ten story without first counting to the total ("Seven." / "Three empty spots." / "one, two, three" / "Seven and three more makes ten!"; `10 − ? = 6`: "Ten." / "one … four" / "Six left!" / "Four taken away!"), with empty spots drawn as dashed outlines. At S1 the Worked demo for these forms plays the same ticks in the model bubble instead of on the S3 tray (amends D71 for this case): the child's tray stays empty, FollowMe builds only the answer on it, and the finished model stays up until the serve. `missingTicks` in `engine/countTogether.ts`.
**Why:** Owner playtest: at S1 (`1 + ? = 10`) Pip counted to ten including blue food, then counted the orange to nine, all on a tray that had started empty, with food the child never placed. The owner picked the bubble option.
**How to revisit:** If the bubble works well, consider it for S1 result forms too (they still use the S3 tray demo).

## D106 — The solved answer takes the blank's role colour (2026-11-10)
**What:** Amends D96. On a correct serve the answer replaces the dashed blank in the blank's own role colour: green on result forms, orange on missing-number forms (blue would apply if a blank were ever the prefilled group).
**Why:** Owner playtest: on `7 + ? = 10` both the filled-in 3 and the 10 were green, losing the sentence's colour coding.
**How to revisit:** Owner playtest.

## D107 — Results: silent count-up with tings, then one spoken total (2026-11-10)
**What:** Supersedes D55. After the sign flips, the coin number counts up by one, silently, with a coin ting per step; the gap starts at 333 ms and eases to a 100 ms floor (`tallySchedule`, 23 coins ≈ 3.75 s). Then "You earned twenty-three coins! Great job, chef!" (`results.total`). The buttons appear only after the count; a tap anywhere during the count jumps to the total, shows the buttons 300 ms after the finger lifts, and nothing is spoken.
**Why:** Owner playtest: the spoken count ran faster than the speech engine could say the numbers. The owner specified this behaviour and chose counting by one throughout.
**How to revisit:** Tune `tallyDelayMs` after a device playtest.

## D108 — A returning monster joins the line as the next monster comes in (2026-11-10)
**What:** After an assisted order, the requeue no longer adds a silhouette the moment the plate is eaten. It joins when the next monster arrives: the line shuffles one place right and the newcomer walks in from the left, by the door (≈ 0.9 s, once; still with reduced motion).
**Why:** Owner playtest: the line grew by one as the food flew into the mouth, with no visible reason. The owner proposed this animation.
**How to revisit:** Owner playtest.

## D109 — Sound effects never overlap speech (2026-11-10)
**What:** The arrival boing plays 400 ms before the monster's first word. The crunch waits for the answer word to end, Chompers' burp plays before its thanks, and the coin tings wait for the thanks to end (each plus 120 ms for the audio context to resume). A tap that skips the meal also hushes any line, so the tings are heard. Results tings run with nothing spoken (D107). Eat + react stays ≤ 4 s of animation; waiting for a line can add to it.
**Why:** Owner playtest: no boing, no crunch, and coin tings only when speech was cut off. iOS silences WebAudio while speech plays (D86–D88), so effects scheduled during a line were lost.
**How to revisit:** Device playtest. If effects are still missing after a line ends, the iOS context may need a gesture to resume; then consider HTML audio elements for SFX.

## D110 — Playtest polish: Blobbo's giggle, door, string lights to the shop, Pip button, Mimsy's hello (2026-11-10)
**What:** Blobbo's reaction is now `giggle` (blushes, giggle-hops with a tilt, tiny hearts and bubbles), so it no longer looks like Wobbleton's puddle, which is unchanged. The café's string lights are no longer drawn; `StringLights` stays in `CafeScene.tsx` for the shop's Lights slot (§10). A wooden door now stands on the floor at the left (x 48–212, y 172–546); the leave button is a wooden sign hanging on the wall, with no light box (same rect and tap target). The Help button shows the new full-body Pip art (`<Pip fit="tight" />`). Mimsy's hello is "Hello, dear chef!" (was "Hello. May I order, please?").
**Why:** Owner playtest notes on each item. The old door sign floated above the window line with a light box.
**How to revisit:** Owner playtest.

## D111 — Family devices recorded; baseline iOS/iPadOS 18+ (2026-11-11)
**What:** The child plays on an **iPad 7th gen** (primary; A10, 3 GB, newest OS iPadOS 18), an **iPhone 17** (iOS 26) and a **Pixel 10 Pro** (Android 16, Chrome). Consequences: (1) the baseline becomes iOS/iPadOS 18+ and a recent Chrome on Android (amends D37's iOS 15.4+); (2) the performance target is the iPad 7th gen, which has the same A10 chip as the 6th gen, so the §2.4 budgets (≤ 300 SVG nodes, ≤ 30 confetti, no filters on animated nodes) stay as they are; (3) the emoji limit rises from Unicode 9.0 to 15.0 (amends D10): `scripts/emoji-versions.json` `maxUnicode` 15.0; the allowlist itself is unchanged, and the version-only denials (cupcake, sandwich, pie) are dropped; (4) `navigator.audioSession` is present on every target iOS device, so the parent Help needs no silent-switch note, but the feature check stays (Chrome has no `audioSession`); (5) the "below Android 8 / iOS 12" glyph text fallback is dropped (it was never built); (6) the e2e matrix is unchanged: iPad gen 7 matches the iPad, and the smaller iPhone 13 and Pixel 7 viewports are conservative stand-ins for the iPhone 17 and Pixel 10 Pro.
**Why:** The owner listed the devices (OPEN_ITEMS "Device details"). The iPad's chip sets the speed budget; its OS sets the feature baseline. iOS 18.0 renders Emoji 15.1 and Android 16 renders Emoji 16, so Unicode 15.0 single codepoints are safe everywhere.
**How to revisit:** If the iPad is not on iPadOS 18 (Settings → General → About), update it or lower the baseline. The ES2020 build target could move to ES2022 under this baseline; left as is because nothing needs it. Revisit the emoji limit if an older device joins.

## D112 — M2b: device speed test; the element budget becomes measured (2026-11-12)
**What:** A new Tier 1 milestone, **M2b**, inserted by the owner between M2 and M3a. It adds a grown-ups-only `?speedtest` screen (also opened from the playtest tools, which the installed app reaches through the Home gear) that measures how many SVG elements the real device shows smoothly. Design: the real café scene plus a monster chewing on a loop with food flying to it as the constant load; two ramps of copies of the real monster art, **still** (stand-in for shop decorations) and **moving** (idle bob and blink), at 250, 500, 1,000, 1,500, 2,000, 3,000, 4,000, 6,000 and 8,000 extra elements; 1 s warm-up and 4 s of frame times per step; smooth = ≤ 2% of frames over 34 ms and median ≤ 20 ms; a rough step is retried once and then ends its ramp; suggested budget = 60% of the last smooth on-screen count, rounded down to 50. Results are shown and can be shared as text (share sheet, else clipboard); the app sends nothing. Warnings for Reduce Motion and a 30 fps cap; Screen Wake Lock where available; stops on backgrounding or Stop. `countSvgElements` (every `<svg>` and every element inside one) is the single counting rule. The ≤ 300 budget in SPEC §2.4 stays in force but is provisional.
**Why:** The owner plans interface redesigns and shop decorations, and the 300 figure was a rule of thumb with no measurement behind it (SPEC §2.4 never had a test enforcing it). The cost of an element depends on whether it moves: Safari redraws animated SVG on the processor, while still art can be drawn once, so one number would either waste the iPad or let animation get janky. Headless Chromium and the 4× throttle report cannot stand in for an A10 iPad. Counted on 2026-11-12: Home 77, Menu 57, Service about 150 elements.
**How to revisit:** When the owner sends the iPad result, record a decision that replaces the 300 figure with the measured still and moving budgets and adds an e2e test that counts the busiest screens with `countSvgElements`. Rerun the speed test after any big art change, or if a new slowest device joins. The smooth rule and the 60% headroom are constants in `src/app/speedtest/speedStats.ts`.

## D113 — SVG element budget measured on the iPad: 4,800 on screen, 650 moving (2026-11-12)
**What:** Replaces the provisional ≤ 300 SVG elements of SPEC §2.4 (D112). New budget: at most **4,800 SVG elements on screen** in total and at most **650 moving**, where moving means inside a subtree with a running CSS animation, transition or Web Animation (`countMovingSvgElements`, from `document.getAnimations()`). Both live in `SVG_BUDGET` (`src/app/svgCount.ts`). A new e2e test, `budget.spec.ts`, samples both counts every 40 ms through Home, the menu, a full real-time service with a miss, and Results, and fails if any screen's peak passes the budget. The raw result is kept in `docs/perf/M2b-ipad7-speedtest.txt`. Art that need not move (shop decorations) should be still so it counts only against the total. The confetti cap and the no-filter rule stay.
**Why:** The owner ran the full speed test from the Home Screen app on the iPad 7th gen (iPadOS 18.7; Safari reports a Mac user agent, but the 1080×790 @2x standalone screen is the iPad). Still elements stayed at 17 ms frames up to 8,052, the most tested, so 60% of that is 4,800 and the true limit is higher. Moving elements were smooth up to 1,091 (median 20 ms) and rough at 1,579 (median 23 ms, a steady drop to about 43 fps rather than hitches), so 60% gives 650. The moving ramp's totals included the 76 still base elements; applying 650 to moving elements only is a small approximation well inside the 40% headroom. Peaks on 2026-11-12: Splash 75/16, Home 77/16, Menu 57/0, Service 149/56, Results 192/0 (total/moving), so today's game uses about 4% of the total budget and 9% of the moving one.
**How to revisit:** Rerun `?speedtest` after a big art change or if a slower device joins, and update `SVG_BUDGET` with the new 60% figures. The still budget is a floor (no limit was found); raise it only with a speed test that ramps further. Mounting thousands of elements when a screen opens is not measured by the speed test; if a screen with thousands of elements opens slowly, that is a separate cost.

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

## D114 — Service screen seen from behind the counter (2026-11-13)
**What:** Replaces the M2 service layout (D62–D65 geometry) with an over-the-counter view, settled by a static mock (`?mock`, three owner review rounds). Three bands in the 1280×720 safe box: a **status bar** (y 0–120: leave sign, coin jar, waiting line walking to a small open-door shop icon), the **room** (y 120–432: the front door with one street window beside it, one table with two front-view chairs, caption · monster · ticket), and the **counter top** (y 432–720), where Pip's hat (Help), the bell, the tray and the basket sit in one row. Monsters stand **full height** behind the counter's far edge (240 px, as in M2). The street window stays beside the door (behind the monster was tried and not kept). Pip's hat is Pip alone with a soft shadow on the counter, no box. Pip's helper spot is behind the counter under the caption; CountTogether keeps its bubble, and Pip and the shrunken monster step left in front of the table. S0: Pip, bell, Peek, display and backspace in an upper row, the ten digits below. Cloche: the tray shifts toward Pip and the lid sits between tray and basket. Help offer: two 220 px buttons over the hidden tray. The proposal geometry is `COUNTER` in `src/app/metrics.ts`; it replaces `SERVICE` when the screen is built. All targets keep ≥ 44/56 CSS px at 844×390 (unit and e2e tests).
**Why:** Owner request before M3a: the service should feel like standing behind a café counter, not inside a house. References were used for the camera angle only, not their art. The waist cut was mocked and declined: short monsters (Blobbo) showed little more than an eye.
**How to revisit:** The screen is built before M3a; playtest whether the child finds the bell and Help in the counter row, and whether the room reads as a café. Screenshots of the approved mock: `docs/screens/counter-mock/`.

## D115 — Basket side: a per-device setting (2026-11-13)
**What:** New per-device setting **Basket side: right (default) / left**. The basket goes on the child's dominant-hand side; Pip's hat and the bell go on the other. Left mirrors the counter row only (`mirrorX`); the room, the status bar and the digit order (0–9 left to right, a small number line) do not mirror. Stored with the other per-device settings; set in the playtest tools (gear) until M3b, then in the parent area's Settings.
**Why:** Owner request: the hand that drags from the basket to the tray should not cross the body.
**How to revisit:** If the child switches hands, or if Help and the bell turn out to want the dominant side.

## D116 — Two-frame tray in the counter row (2026-11-13)
**What:** Two frames side by side (A5+) plus a 300-px basket and two buttons do not fit 1280 px. Of three mocked options the owner picked A: the frames keep **88-px cells** but use **gap 4, padding 8** (472 × 196 each) and a **12-px gap between frames** (956 wide); Pip's hat sits on the bell in one 112-px column on the non-dominant side; the basket is an **upright crate (172 × 200) with a two-row heap**. A third heap row was tried and looked precarious. Every item of the heap stays inside the crate (e2e). Declined: B (basket on the back counter beside the monster under a shorter ticket; left-handed it took Pip's helper spot) and C (a two-row counter for two-frame skills, which shortened the room).
**Why:** Keeps the tap minimums (cells 47.7 CSS px) and the full one-row counter without moving anything into the room.
**How to revisit:** At the M5 playtest: whether the tighter gaps still show the five wall clearly, and whether the crate reads as the same basket.

## D117 — The taken-away row takes the basket's place (2026-11-13)
**What:** On missing-subtrahend forms (S3/S2) the taken-away row (324 × 138) sits where the basket is, on the dominant side, and the basket is not shown. Amends D63's position (left of the tray).
**Why:** Beside the tray, the basket, Pip and the bell the row needs 1404 px. On these forms the basket has no job of its own: tapping it does exactly what tapping the row does (D42a, `tapTakenAway`), and removed items fly to the row.
**How to revisit:** If the child looks for the basket on these orders.

## D118 — The waiting line in the status bar, real monsters at their real places (2026-11-13)
**What:** The waiting line moves from the room to the status bar: small real monsters (76 px, idling), in plan order, the front one next to the shop icon. A long line squeezes its spacing to stay in the bar. A requeued monster stands at its **real place** in the line (D43: 3–5 orders later), marked with a small circling-arrow badge, instead of at the back (amends D108's position; its timing stays: it joins as the next monster comes in). The line no longer hides while Pip is out or the CountTogether bubble is up (amends D91), because it is no longer on the counter.
**Why:** Owner request. Real monsters let the child see who is coming and who is coming back. The D113 budget allows it: nine idling minis during CountTogether measured 489 elements on screen and 300 moving (budget 4,800 / 650). The first mock planned head-only icons for the old 300-element budget; D113 lifted that.
**How to revisit:** If the bar feels busy, the minis can stop idling (they then count only against the total).

## D119 — The ticket's blank is an SVG outline with even dashes (2026-11-13)
**What:** The dashed box for the unknown on the ticket is drawn as an SVG rounded rectangle with `pathLength` and 12 equal dashes, not a dashed CSS border. Implementation only; SPEC §5.4's rule (a dashed box, so colour is never the only cue) is unchanged.
**Why:** The owner noticed uneven corners in the mock; the M2 screenshots show the same in the real game. Safari lays out each side of a dashed border on its own, so at the phone's ≈ 0.54 scale the dashes did not meet evenly at the corners.
**How to revisit:** Check on the real iPhone.

## D120 — The line walks left; the cloche lid is centred by eye (2026-11-14)
**What:** (1) Status bar order is door sign · coin jar · little café (x 328–440) · waiting line (x 448–1272); the front of the line stands next to the café and the line steps left as each monster goes to the counter. Amends D118's direction (it walked right to a shop icon at the far right). The jar keeps its spot, so Home can show it in the same place. (2) S0 lifted cloche: tray x 304, basket x 960, and the lid placed so its drawing (tilted dome plus the "123" badge, which reaches 16 px further toward the basket) is centred between the plate's rim and the crate's side, not its tap box; mirrored for a left-handed child, lid tilt and badge included. Amends D114's cloche geometry.
**Why:** Owner review. Monsters come in at the room's door on the left and leave that way, so a line walking right read backwards. The lid looked off centre: it overlapped the plate's rim on one side and left a wide gap on the other.
**How to revisit:** If the line reads better walking toward the monster, or the lid's art changes (then re-measure `LID_ART_SHIFT`).

## D121 — Coin jar and leave sign move to the right of the status bar (2026-11-14)
**What:** Status bar order, left to right: little café (x 8–120) · waiting line (x 128–952, walking left into the café) · coin jar (x 968–1144) · door sign (x 1160–1272). Amends D120's order (door sign and jar were at the left, before the café). The jar keeps this spot on every screen that shows it, and the leave sign's corner is the one the grown-ups' gear has on Home. While the service uses `CounterScene` and Home, Menu and Results still use `CafeScene`, a shop decoration (D37) must be drawn in both scenes.
**Why:** Owner review. With the line walking left, the jar and the leave sign sat at the end the monsters walk toward, so they read as part of the line's path.
**How to revisit:** If the owner approves the counter versions of Home, Menu and Results (mocked under `?mock`), the D37 note goes away because every screen shares one scene.

## D122 — At S0 the number pad hides during the help offer (2026-11-14)
**What:** While OfferHelp's two picture buttons are up at S0, the whole pad (Peek, display, backspace, digits) hides along with the tray; Pip's hat stays. It comes back when the child picks.
**Why:** In the counter layout the pad shares the band with the picture buttons. Leaving the digits under them put two sets of targets in one place, and a digit tapped by mistake would have been ignored anyway (the offer locks input, D89).
**How to revisit:** If the child should see the typed number while choosing, show the display alone, greyed.

## D123 — Splash, Home, Menu and Results over the counter (2026-11-14)
**What:** Every child screen uses `CounterScene`. The cream bar is the café's sign: "Number Chef · Monster Café" across it on Splash, "Monster Café" on Home, "Little Menu" on Menu, a chalk CLOSED sign on Results. The coin jar keeps its service spot (x 968–1144) on Home, Menu and Results; the gear on Home takes the corner the leave sign has during a service. Blobbo (and Pip on Home and Menu) stand behind the counter at their service spots. The counter top holds the targets: Splash's "Tap to start" card (the whole screen stays the tap target), Open the Café, Menu's dish tiles as little chalkboards beside Home, and Results' three buttons. Results puts the tally card in the room and the served monsters along the counter's far edge, squeezing their spacing for a long service. Geometry in `FRONT` (`metrics.ts`). The menu waits for the device's settings before its tiles take a tap. Resolves the D121 note: shop items are drawn once, in `CounterScene` (D37 holds). Open for M5: nine Little Menu tiles and the Big Menu tab do not fit one counter row.
**Why:** Owner approved the mocks: the café should look the same before, during and after a service.
**How to revisit:** At M5 (more tiles) and M4 (Decorate beside Open the Café).

## D124 — Play-time limit postponed to its own Tier 2 milestone, M12 (2026-11-14)
**What:** The optional play-time limit and lock (SPEC §6: allowance clock, wind-down, shorter service, grace cap, tip-on-closing, lock, boot check, 60 s cue, refill modes, and the parent-area limit setting with Start new session / Add time) leaves M3b and Tier 1. It becomes M12, a Tier 2 milestone the owner has postponed indefinitely. M3b keeps the parent gate, the minimal parent area, Export, Replace-only import and Reset. Until M12 no allowance code ships; §6's rules all start "while a limit is enabled", so they simply never apply, and D7/D27/D33/D40 stay as the design for M12. The `clock` IDB store already exists, so M12 needs no IDB upgrade. Estimates: M3b 3.0 → 1.5 h, M12 ≈ 1.75 h.
**Why:** Owner decision at the start of M3.
**How to revisit:** The owner picks M12 like any Tier 2 milestone; it depends only on M3b's gate.

## D125 — M3a persistence details: when the service is offered back, the old picker, the progress list (2026-11-14)
**What:**
- (a) **Resume row.** Written when a service starts (index 0) as well as after each completed problem, so a reload before the first serve is still offered back. The plan is stored by reference (skill, the ticket as shown, food, stage, monster, requeue and warm-up flags) and looked up again in the skill's pool; a row that no longer matches the pool, or fails validation, is not offered.
- (b) **The offer.** "Continue dinner service?" is checked once per app launch, on the first Home after Splash, with Pip asking aloud and two buttons, *Keep cooking* / *Not now*. *Not now* clears the row. *Close the café* writes the partial `serviceEnd` and keeps the row, but the offer waits for the next launch rather than popping up the moment the child chose to stop. Finishing a service clears the row.
- (c) **The old playtest picker.** The first M3a boot turns the per-device `debugSkillConfig` setting (D52) into `skillConfig` events, for skills that have none yet, then deletes the setting, so the owner's playtest settings carry over. (PLAN §2 item 5 had said "ignores and deletes".)
- (d) **Simple progress list (SPEC §12, M3a subset).** Per built dish: stage, services played (distinct services with a `serviceEnd`, partial ones included), problems, first-try share, how often Pip gave full help, facts tried out of the pool, and facts per box 0–4 with the never-seen ones apart; the coin balance; a storage block (saved / in memory, persisted, usage, last failed write). Opening the screen asks `navigator.storage.persist()` again.
- (e) **Active time.** Until M12, `activeMs` is the time spent on the service screen, carried across a resume; the idle pause arrives with the allowance clock.
- (f) **Services left behind, and the tip at the very end** (added in the M3a review). A stored service that will not be played on (*Not now*, older than 2 h, or no longer playable) gets a `serviceEnd` if it has none yet, in the same write that clears the row, so an app killed mid-service still counts as a service. A service counts as finished once every order is served (SPEC §11.2: partial = ended before all orders were served), so *Close the café* during the last meal or the closing line, or an app killed then, keeps the tip. A stored monster id must be in the roster, or the row is not offered.
**Why:** The SPEC says to write the row "after each completed problem" and to offer it "on boot", but not what declining does or whether closing the café should bring the question straight back. Asking a child who just chose to stop would feel like a nag (SPEC §5.7: no "come back" prompts).
**How to revisit:** If the owner wants the offer every time Home opens, drop the once-per-launch flag. If the progress list needs more, the full Progress tab is M7.

## D126 — M3a playtest: Close the café is never offered back; parent screen wording; Chompers' teeth (2026-11-17)
**What:**
- (a) **Close the café clears the resume row.** It still writes the partial `serviceEnd` (no tip), but the row goes in the same write, so no later launch asks "Continue dinner service?". Only a service the app lost (killed, reloaded, crashed) is offered back. Amends D125 (b), which kept the row and waited for the next launch.
- (b) **Support levels named for what is on screen** (owner's wording), with a one-line description of each shown above the Skills list: *Full tray with counting* (S3) — the tray starts filled; Pip counts each tap aloud. *Full tray, no counting* (S2) — prefilled tray, no spoken counts; a tone per tap. *Empty tray* (S1) — build the answer starting from an empty tray. *Number pad* (S0) — no tray; the player types the answer, Peek shows the picture. The S-codes stay as internal names in SPEC and code.
- (c) **Operations** read "addition and subtraction / addition only / subtraction only" (was "both").
- (d) **Basket side** moves out of the playtest tools to its own section after Skills and Progress (before Storage), headed just "Basket side", with a two-line description for a parent instead of "(this device, from the next service)"; its dropdown is wider, at the body text size.
- (e) **Chompers' teeth hang from the top lip.** In the open mouths (delight, reaction) they sat partway down the mouth and did not move with it; they now start at the lip line. Gruffles' fangs follow the same rule.
**Why:** Owner playtest of M3a. A child who closes the café on purpose has chosen to stop; offering the same service on the next launch undoes that choice. The S-names did not tell a parent what each level does.
**How to revisit:** If a deliberately closed service should be offered once after all, restore the row on Close the café.

## D127 — No starting preset; separate fact boxes for the tray levels and the number pad (2026-11-17)
**What:**
- (a) **No `known` preset.** Every fact starts new and in box 0 (D16's +1 and doubles at box 3 is gone). The owner wants the boxes to show whether the child really knows those facts, and the game will have other players. With nothing seen, new facts are shared between the operations on a first service with both: one new fact of each first, then the third slot to whichever still needs more for the add/sub balance (amends D97's reserve, which could give all three slots to one operation). The `known` event and M7's starting-point toggles stay as a possible parent choice; their defaults are empty.
- (b) **Two box sets per fact.** The **tray set** covers S3, S2 and S1; the **number set** covers S0. An attempt changes only its own set: `first` at S1 raises the tray box, `first` at S0 raises the number box, `first` at S3/S2 and `afterHint` change nothing, a miss or Pip's full help resets the box of that set to 0. The session builder samples with the set for the service's level. Derived state only (`FactStat` = `tray`, `num`, `seen`, `first`); the events are unchanged, so no migration. The `state` cache carries a shape number and an older cache is rebuilt from the log on boot.
- (c) The progress list shows both sets per dish ("Tray boxes", "Number boxes", and the never-seen facts apart).
**Why:** Owner playtest. At *Empty tray* the child reliably solves any fact by counting out (taps for each addend; for subtraction, lay out the minuend and take away the subtrahend, as her workbook teaches). A first-try success there says little about recall at the number pad, which is closer to the flash cards the box method was built for, so S1 successes must not lower how often a fact comes up at S0.
**How to revisit:** If S1 boxes prove meaningless, stop raising them at S1 (boxes only at S0). If a parent wants known facts seeded, M7's starting-point toggles write a `known` event.

## D128 — Support levels renamed Level 1–4 by amount of help (2026-11-17)
**What:** Parent-facing names and descriptions replace D126 (b): S3 *Level 1: Most help* — the tray starts partially filled; Pip counts each tap aloud. S2 *Level 2: Some help* — prefilled tray, no spoken counts; a tone per tap. S1 *Level 3: Little help* — fill an empty tray. S0 *Level 4: No help* — type the answer on a number pad. The progress list's note refers to the levels by number. S-codes stay internal.
**Why:** Owner feedback after seeing the D126 names.
**How to revisit:** Names live in `STAGE_NAMES` / `STAGE_HELP` (`src/app/SkillPicker.tsx`).

## D129 — Support levels lose their numbers; Least help; basket side above Progress (2026-11-18)
**What:** Parent-facing level names drop the "Level n:" prefix and S0 becomes *Least help*: S3 *Most help* — the tray starts partially filled; Pip counts each tap aloud. S2 *Some help* — the tray starts partially filled; no spoken counts, a tone per tap. S1 *Little help* — the tray begins empty. S0 *Least help* — the player types the answer on a number pad; the tray appears only when the player asks for a hint or enters a wrong answer twice for the same order. The progress note names levels instead of numbering them. The Basket side section moves above Progress (after Skills). Amends D128 and D126 (basket side placement).
**Why:** Owner's playtest feedback on round 1 of M3a.
**How to revisit:** `STAGE_NAMES` / `STAGE_HELP` in `src/app/SkillPicker.tsx`; section order in `src/app/ParentScreen.tsx`.

## D130 — Parents see fact boxes as "confidence" 0–4 (2026-11-18)
**What:** Parent-facing text never says "box". The Progress columns read *Tray confidence: facts at 0 · 1 · 2 · 3 · 4* and *Number pad confidence: facts at 0 · 1 · 2 · 3 · 4*, and the note under the table explains the score: 0 (new or still learning) to 4 (confident); a right first answer raises it one step; a miss or Pip's full help sets it back to 0 so the fact returns for practice; lower scores come up more often; tray and number pad are tracked separately; only Little help and Least help change it. Engine and docs keep "box" internally. "Level" is avoided so it never clashes with *Support level*.
**Why:** A parent who doesn't know the Leitner method can't read "boxes". Owner chose "confidence" over "mastery" because a drop from 4 to 0 reads naturally for confidence but sounds like a loss for mastery.
**How to revisit:** Wording lives in `src/app/ProgressList.tsx`; M7's heatmap (SPEC §12) should use the same word.

## D131 — Progress list: cards on a portrait phone, a tighter table elsewhere (2026-11-18)
**What:** Below 600 CSS px wide (a portrait phone) the Progress list shows one card per dish; wider screens show the table. The swap is a CSS media query, so rotating the device swaps the views at once. The table is tightened to fit an iPhone in landscape inside the notch insets (~750 px): dish description on a small second line, Services and Problems in one column, "facts at" moved to one line above the table, the *New* column dropped (it was always the total minus *Facts tried*), less cell padding, counts kept on one line. In the Skills list, each dish's row stacks on a portrait phone (name, then the support-level and operations dropdowns one under the other).
**Why:** At 844 × 390 with the notch the old table needed ~820 px and its right columns were cut off; in portrait only ~4 of 10 columns were visible, and the grown-ups' screen scrolls only vertically. The Skills operations dropdown ran ~18 px past the edge in portrait.
**How to revisit:** `src/app/ProgressList.tsx`, `.skills-table` in `src/app/global.css` and the `.progress-*` rules in `src/app/global.css`; mock shots in `docs/screens/M3a/progress-mock/`.

## D132 — Progress on a phone in landscape: two cards per row (2026-11-18)
**What:** On a phone in landscape (landscape and at most 500 CSS px tall) the Progress list shows the dish cards two per row instead of the table; a portrait phone keeps one card per row and a tablet (either orientation) keeps the table. Still pure CSS, so rotation swaps at once. The confidence note now reads "A correct first answer …", "Only Little help (tray starts empty) and Least help (number pad) change these. At Most help and Some help they stay put."
**Why:** Owner's M3a round-2 playtest: in iPhone landscape the eight-column table fit only with ~7 px cell padding, so the *Facts tried*, *Tray confidence* and *Number pad confidence* values ran together. Nothing could shrink further without hurting the other columns; two ~360 px cards fit the ~750 px between the notch insets, the same width as a portrait card. Note wording is the owner's.
**How to revisit:** the `.progress-cards` media queries in `src/app/global.css`; the note in `src/app/ProgressList.tsx`; shots in `docs/screens/M3a/progress-mock/`.
**Amendment (2026-11-18, owner):** the Least help description says the tray appears when the player "enters a wrong answer three times for the same order" (it was "twice"; the tray comes on the third miss, or on yes to the offer after the second). The confidence note says "An incorrect answer or using Pip's full help …" and puts the level names in double quotes ("Little help", "Least help", "Most help", "Some help") so they read as names.

## D133 — Sound and speed tests hidden from the grown-ups' screen (2026-11-18)
**What:** The grown-ups' screen (gear → hold) no longer shows the Sound test or the Speed test link; its Playtest tools keep only the build and storage info. The code stays: the hidden `?debug` screen still shows both, and `?speedtest` still opens the speed test directly (`PlaytestTools` takes `deviceTests`, false on the grown-ups' screen).
**Why:** Owner: they are not needed now, but may be again (e.g. a new device or an audio problem).
**How to revisit:** pass `deviceTests` (or drop the prop) in `src/app/ParentScreen.tsx`.
**Amendment to D132 (2026-11-19, owner):** the confidence note reads "An incorrect answer or Pip's full help sets it back to 0" (no "using").

## D134 — Parent gate and parent-area lock details (2026-11-19)
**What:**
- (a) **Question.** After the 2 s hold (D95) a full-screen, unrotated gate shows `a × b = ?` with a 6–9 and b 7–9, a number pad (1–9, delete, 0, OK; up to three digits; a keyboard also works) and *Back to the café*. It is never spoken. Each wrong answer brings a new question with "Not quite. Try this one."
- (b) **Lockout.** The third wrong answer in a row locks the pad for 30 s. The screen says "Too many tries. Please wait a little, then try again." with **no countdown** (the child may be the one looking, CLAUDE.md). The count and the lockout live in memory for the launch: leaving and reopening the gate keeps the lockout; a relaunch clears it. After the lockout the count starts again from zero.
- (c) **Auto-lock.** The area returns to Home after 5 minutes with no input (pointer, key, form change or scroll anywhere in it), measured on the wall clock and checked every second and when the app comes back to the foreground, so a device put down for an hour is locked when picked up. Leaving (Back to the café or the back gesture) also returns Home; every visit asks a fresh question. Backgrounding alone does not lock: Android's file picker and share sheet background the page in the middle of an import or export.
- (d) **Not during a service.** The gear exists only on Home, and the app opens the gate only from Home.
- (e) **e2e.** `__ncmc.gateAnswer()` reads the answer and `__ncmc.skewParentClock(ms)` moves the lockout and idle clock forward (VITE_E2E builds only).
**Why:** SPEC §12 gives the factors, the 3-wrong/30 s rule and the 5-minute idle lock but not what is shown during a lockout, whether it survives reopening, or what counts as idle or as leaving.
**How to revisit:** `src/engine/parentGate.ts` (constants, pure rules), `src/app/ParentGate.tsx`, the idle check in `src/app/ParentScreen.tsx`. Persist the lockout (e.g. in `meta`) if a child is seen relaunching to get past it.

## D135 — Per-device parent settings: where they live and what they change (2026-11-19)
**What:**
- (a) One row per setting in the `settings` store (SPEC §11.3), validated by zod on read; a missing or bad row takes its default: `ordersPerService` 4/6/8 (6), `voiceURI` (null = automatic pick, SPEC §8.2), `speechRate` 0.7–1.1 (0.85), `masterVolume` 0.8, `sfxVolume` 0.7, `voiceVolume` 1.0, `reducedMotion` (false). New keys only and events unchanged, so `schemaVersion` stays 1. The basket side keeps its own `basketSide` row (D115).
- (b) The speed scales every voice: monster and Pip rates (SPEC §7.2, §8.2) are multiplied by speed ÷ 0.85, kept within 0.5–1.5, and the speech timeout follows the real rate. SFX play at master × SFX; the voice at master × voice through `utterance.volume`, which iOS ignores (PLAYTEST). A chosen voice that needs the network is replaced by the automatic pick while offline (re-checked on the `online`/`offline` events).
- (c) **Reduced motion** on forces the same CSS as the device's Reduce Motion (an `html.reduce-motion` class mirrors each `prefers-reduced-motion` block); off follows the device.
- (d) Orders per service applies from the next service; the rest apply at once. Settings are read once at boot (and again after a restore), never re-read while the parent edits them.
- (e) The parent area keeps the M3a order (Skills, Basket side, Progress) and adds Settings, Data, Storage, Install help, then the build info. Sound and speed tests stay off it (D133). *Test the voice* speaks a sample order; *Test the sounds* plays the correct-serve chime.
**Why:** SPEC lists the settings and the per-device store but not the keys, how speed combines with each monster's own rate, or how the toggle and the media query combine.
**How to revisit:** `src/app/deviceSettings.ts`, `src/app/ParentSettings.tsx`, `configureSpeech` in `src/audio/speech.ts`, `setSfxVolume` in `src/audio/sfx.ts`.

## D136 — Export, Replace import and Reset details (2026-11-19)
**What:**
- (a) **Checksum** = hex SHA-256 (SubtleCrypto) of `JSON.stringify({ events, settings })`, the two fields exactly as written in the file (events in replay order). Import hashes the parsed file's own values before any validation or upcast.
- (b) **File name** `number-chef-backup-YYYY-MM-DD.json` (local date). The file is built ahead of the tap and rebuilt whenever progress or settings change, so *Back up now* calls `share()` with nothing awaited inside the tap. Order: JSON file share → the same file as `text/plain` → a download, with a visible link to the same file in case the browser ignored the click. Closing the share sheet is not an error and records nothing; any other share failure falls back to the download. A share or download sets `meta.lastBackupAt`, shown as "Last backup: today / N days ago / never on this device".
- (c) **Import (Replace only).** Permissive `accept="*/*"`. zod checks the header (`app` id, version, fields) and every event (the five kinds schemaVersion 1 writes); a newer `schemaVersion` is refused with "Update the game on this device first"; an older one is upcast through the migrations; duplicate ids keep one copy. A checksum mismatch shows a warning and needs two confirmations (*Use it anyway*, then *Yes, use it*). A summary (device label, date, entries and their date range, coins before → after) comes next, then a second multiplication question. It snapshots first (`reason: 'replace'`), then in one transaction clears events, the state cache, the resume row and settings and writes the file's events and settings. `meta` (deviceId, warm-up flag) stays.
- (d) **Reset** asks *Erase everything on this device?* (coins before → 0), then a second multiplication question; snapshots first (`reason: 'reset'`), then clears every store except `snapshots` in one transaction, `meta` included (the next boot is a new device: new deviceId, warm-up order once more). It does not touch the service-worker caches (app code, not data) or the `?debug` sound test's `ncmc.debug.audioSession` localStorage key; nothing outside `ncmc*` is touched.
- (e) After a Replace or Reset the app reloads to the Splash, so nothing in memory (derived state, resume check, settings) is stale. Restore is off (with a note) while storage runs in memory (IndexedDB failed), since that reload would lose it; Reset still works. Restoring the snapshot is M7 (snapshots list), so the screen doesn't promise it: it says to back up first. *Back up now* is off while a share sheet is open (a second `share()` would be refused and fall through to a download).
**Why:** SPEC §11.6 fixes the shape and the fallbacks but not the hash input, the file name, how `share()` keeps its user activation with an async hash, or what Replace and Reset keep.
**How to revisit:** `src/storage/backup.ts`, `src/app/shareFile.ts`, `src/app/ParentData.tsx`.

## D137 — M3b playtest fixes: 1-minute idle lock, inactive pad during lockout, one entry per voice (2026-11-19)
**What:**
- (a) The parent area returns to Home after **1 minute** without input (was 5 minutes, D134 (c)); everything else in D134 (c) stands: wall clock, any input counts, checked every second and on return to the foreground.
- (b) During the gate's lockout the number pad takes no touches at all (`pointer-events: none` on the dimmed pad) and the keys have no pressed colour, so nothing lights up when tapped.
- (c) The voice picker lists each voice name and language once. iOS reports Samantha, Daniel, Moira and others twice under different voice URIs; the picker keeps the parent's chosen one if it is one of a pair, else an on-device one, else the first listed. The automatic pick (SPEC §8.2) is unchanged.
**Why:** Owner playtest of M3b: the phone sleeps at 5 minutes so the lock was never seen, and 5 minutes is too long anyway; the keys lit up blue while greyed out; voices appeared twice on iPhone and iPad.
**How to revisit:** `PARENT_IDLE_MS` in `src/engine/parentGate.ts`; `.gate-pad-off` in `src/app/global.css`; `uniqueVoices` in `src/audio/speech.ts`.

## D138 — Gate fits a short browser window; the last monster stays for the closing line (2026-11-20)
**What:**
- (a) The parent gate is centred with auto margins instead of flex `align-items: center`, so when the window is shorter than the gate (a phone in landscape in Safari, with the address and tab bars) it starts at the top and scrolls down; nothing is lost above the top edge.
- (b) After the last order of a service the monster does not play the walk-off: it stays where it is, delighted, for "All done! Thank you, chef!", then Results. Every other monster still leaves to the left before the next one arrives.
**Why:** Owner playtest after D137: the top of "For grown-ups" was cut off in landscape browser tabs and could not be scrolled to; the last monster walked off and then popped back in the same spot to say thanks.
**How to revisit:** `.parent-gate` / `.gate-panel` in `src/app/global.css`; the end of the eat sequence in `src/game/service/controller.ts`.

## D139 — Recorded voices: hybrid clips, current wording, Tier 2 milestone M13 (2026-11-21)
**What:**
- (a) Recorded voice-overs are in scope as **Tier 2 milestone M13** (SPEC §14). They leave the v1 non-goals (SPEC §0) and M10 no longer carries "recorded-audio manifest support".
- (b) **Hybrid clips.** Lines without numbers are recorded whole. Number words are recorded **whole** (never "thirty" + "one") and cut out of carrier sentences in the position where the game uses them, so each keeps its natural intonation: *lead* (starts a phrase: "**Seven** plus two…", "**Seven** more!"), *mid* (inside a phrase: "…plus **two** cookies…") and *end* (ends a phrase: "I wanted **nine**.", "Yum! **Seven**!"). Each food's order tail is one clip ("cookies, please!"); connecting words and phrases ("plus", "minus", "I see", "I wanted", "One more!", "taken away!") are clips.
- (c) **The current wording stays.** Phrase templates are not reworded to move joins to commas or pauses (owner, 2026-11-21: the rewordings could sound less natural than stitched clips of the current lines). Joins are hidden by trimming each clip's silence and a short crossfade (D141).
- (d) **The M13 listening test** (step 1, on `?debug`) settles three open points by ear on the iPad before the full recording: stitched clips vs the same line recorded in one take (is stitching good enough); one number form vs the three forms in (b); pair clips ("Seven more!" in one take) vs two clips ("seven" + "more!") for the short counting lines. The results become a decision at the end of step 2.
- (e) **Whole-line fallback.** A line plays recorded only when every clip it needs exists for that voice; otherwise the whole line is spoken by TTS. A line never mixes recorded and synthetic speech. Lines that would carry the child's name (or, from M7, a renamed monster) are never recorded and stay TTS, because the recordings are public on Pages (D38).
- (f) **M13 covers** numbers 0–20 and every phrase and monster line the built Little Menu dishes (A1–A3) use. Later dishes get theirs in voice passes (D142).
**Why:** Enumerating the phrase table (2026-11-21): about 13,000 distinct lines with numbers 0–20 and about 290,000 with 0–100; the 126 A1–A3 problems × 16 foods alone give about 2,000 order sentences (≈ 24 MB as AAC; the 0–100 orders would pass Pages' 1 GB limit). Recording whole sentences is impossible; only 103 distinct words occur (183 at 0–100). Phone menus (IVR) and limited-domain speech synthesis use matched sets of beginning / middle / end fragments recorded at one level and pace, and name sentence position as the main thing to match. Owner accepted the research recommendations 1, 2 and 4–7, declined 3 (rewording), and wants the listening test first.
**How to revisit:** the listening-test result (step 2 of M13); `clipPlan` in `src/engine/` and `src/audio/voice.ts` once built; PLAN.md §6.

## D140 — Voice production: one recorded voice shifted per character, AAC, Audacity labels + build script (2026-11-21)
**What:**
- (a) **One voice set.** The owner records everything once, in their own voice. Each monster's and Pip's voice is made offline by pitch-shifting the same recordings to that character's pitch (formant-preserving where the tool allows); the unshifted voice is the narrator (the Results total). The monsters' arrive and thanks lines (12) are recorded one by one and shifted like the rest. The build only emits the clips each voice actually says (from the speaker table, D141).
- (b) **Format.** Masters: WAV, 48 kHz, 24-bit, mono, kept outside git. Shipped: AAC-LC in `.m4a`, mono, 48 kbps (64 kbps if it sounds hissy), loudness-normalized, under `public/audio/`. Not Opus: Safari plays Ogg Opus only from iOS 18.4 and WebM Opus from 17.4 in media elements, and Web Audio decoding of Opus on iPadOS 18 is unconfirmed; the saving (≈ 0.6 MB) is not worth it. Not MP3: larger, and no standard field for the encoder's start and end padding.
- (c) **Workflow.** `npm run audio:todo` writes the recording script (`docs/VOICE_SCRIPT.md`: carrier sentences in reading order, each target clip numbered and marked) and lists missing clips. The owner records in Audacity on the Windows PC, marks each target clip with a region label whose text is its number, and exports the WAV and the label track. `npm run audio:build` matches labels to the script by number (reporting missing, extra and duplicate numbers), cuts, trims silence, normalizes, pitch-shifts per voice, encodes and writes `public/audio/manifest.json`. Both are cross-platform Node scripts. `ffmpeg-static` is added as a **dev-only** dependency (build time only; nothing runs at runtime). Encoded clips are committed; masters and label files are not.
- (d) **Voice cloning is the last resort**, used only if recording proves too much: a cloud service (e.g. ElevenLabs instant cloning, 1–2 minutes of samples, paid plan, the clone cannot be exported, the voice is uploaded to a third party) would generate the clips at build time; the game itself still makes no network requests.
- (e) **Privacy.** The clips are public on Pages: nothing personal is recorded (D38).
**Why:** Sizes per second of mono audio: WAV 48 kHz 16-bit 96 KB, MP3 64 kbps 8 KB, AAC 48 kbps 6 KB, Opus 32 kbps 4 KB. All voices for A1–A3 come to roughly 700 clips ≈ 2–3 MB as AAC, small next to the 1.5 MB-gz app target and well inside iOS storage (iOS 17+ gives web apps a large share of the disk; Home Screen apps are exempt from Safari's 7-day storage cap). Recording once and shifting keeps the owner's work to one sitting instead of seven. Audacity labels keep every clip cut from its carrier sentence (D139b) without exporting hundreds of files by hand.
**How to revisit:** `scripts/audio-todo.ts`, `scripts/audio-build.ts` (M13). If `ffmpeg-static` has no formant-preserving shift on Windows, step 1 of M13 picks another tool and records it here.

## D141 — Recorded voice playback in the app (2026-11-21)
**What:**
- (a) **Clip ids** replace the examples in the old SPEC §8.2 (`num.14`, `op.plus`, `line.blobbo.thanks.2`): `num.<n>.<form>` (`lead` / `mid` / `end`, as the listening test leaves them), `food.<id>.please`, `w.<slug>` for connecting words and short phrases, `line.<phraseKey>` for phrases with no parameters, `mon.<monsterId>.<arrive|thanks>.<i>`. A file is `public/audio/<voice>/<clipId>.m4a`; voices are the monster ids, `pip` and `narrator`.
- (b) **`clipPlan(key, params)`** in `src/engine/` (pure) returns the clip ids for a line, and a `PHRASE_SPEAKERS` table says who says each phrase. Unit test: for every phrase key and every parameter in range, the clips' transcripts joined equal the phrase text (ignoring case and punctuation), the same way generators, `check` and `buildDemo` must agree. `lint:content` validates the manifest (known clip ids, existing files, no stray files).
- (c) **`src/audio/voice.ts`** plays clips through the existing AudioContext. Clips are precached by the service worker (`m4a` joins the Workbox glob patterns) and fetched from the cache on demand, decoded **one at a time** (WebKit has crashed decoding many in parallel), kept in a small LRU cache of decoded audio (cap about 10 MB, so the iPad 7th gen never holds a whole set), silence-trimmed at load, and scheduled back to back on the audio clock with a short crossfade (about 15 ms, tuned by ear). Voice volume applies; the speech-rate setting applies only to TTS. The `speak()` contract does not change: it resolves on end or on the timeout, `interrupt` cancels what is playing, counting is latest-wins, and a recorded line counts as speech for the SFX rule (D109).
- (d) **`?debug`** gets the Voice test page (D139d) and a per-device voice source toggle (recorded / TTS). No parent setting.
- (e) **Tests.** Playwright's Chromium and its Linux WebKit may not decode AAC, so e2e runs on a small test clip set in WAV through the same manifest. Real AAC decoding, the joins, the voices and memory are owner checks on the devices (PLAYTEST).
**Why:** Pins down how recorded clips reach the speaker so step 1 of M13 is plain plumbing; the decoding and memory rules come from the WebKit bug reports on parallel `decodeAudioData` and slow buffer release on iOS; AAC encoder padding is not trimmed the same way by every browser, so the app trims silence itself.
**How to revisit:** `src/audio/voice.ts`, `clipPlan` and `PHRASE_SPEAKERS` in `src/engine/`, `vite.config.ts` (`globPatterns`), the `?debug` Voice test page.

## D142 — A voice pass closes each milestone that adds or changes spoken lines (2026-11-21)
**What:**
- (a) From M13 on, a milestone that adds or changes spoken lines (M5's new dishes and demos, M8's Big Menu, M9, M4's guest monsters, any playtest rewording) builds them with the whole-line TTS fallback (D139e) and regenerates the recording script with `npm run audio:todo`.
- (b) After the owner's playtest has settled the wording, a short **"M<n> voice pass"** closes that milestone: the owner records the new clips, runs `npm run audio:build` and pushes; `audio:todo` then reports nothing missing for that milestone's dishes. The next milestone starts only after the voice pass.
- (c) Changing the wording of a recorded line means re-recording it in the next voice pass; until then the whole line is TTS.
**Why:** Owner, 2026-11-21: recording after the playtest avoids re-recording lines the playtest changes, and closing the milestone with it keeps the game from mixing voices for long. The whole-line fallback keeps every build playable in between.
**How to revisit:** SPEC §14 (Tier 2 header), CLAUDE.md working agreement.

## D143 — Clip plan details: an `ask` number form, pair and reference clip ids, punctuation as intonation, the policy table (2026-11-21)
**What:**
- (a) A fourth number form, **`ask`**, for a number that ends a question: "**Two?** I wanted three." (`plate.echo`) and the missing-number tickets "Six plus what equals **ten?**". D139b's three forms are statements; a question rises.
- (b) Two clip id families beyond D141a: **`pair.<n>.<more|left>`** ("Two more!" in one take, for `ct.more`, `ct.left`, `demo.left` when pairs are on) and **`ref.<slug>`**, the spike's one-take whole lines, used only on the Voice test page.
- (c) Connecting words are cut with their punctuation, which is their intonation: `w.more` "more!", `w.more-trail` "more…", `w.more-stop` "more." are different recordings. Phrase tails that never change are one clip ("coins! Great job, chef!", "more makes ten!", "orange. The same!").
- (d) The listening-test outcome is the **`CLIP_POLICY`** table in `src/engine/clips.ts`: which recorded form stands in for each position (one form = every position maps to the same one) and whether counting lines use pairs. Pairs are off and all four forms are used until step 2 decides.
- (e) Lines reach the voice layer as a **`Line`**: a phrase (key + params), a ticket (the generator's tokens, for missing-number forms), a monster's own line (`mon.<id>.<which>.<i>`; the game uses line 0), or plain text, which is never recorded (D139e). Captions are `lineText(line)`, unchanged.
**Why:** The phrase table has questions and trailing pauses that a statement-form number or word would flatten; the spike needs ids for what it compares; the listening test must be able to change the plan without new code (PLAN §6.2 item 1).
**How to revisit:** `src/engine/clips.ts` (`clipPlan`, `CLIP_POLICY`, `WORDS`); the M13 step 2 result.

## D144 — Recording scripts, label matching and the clip build (2026-11-21)
**What:**
- (a) `npm run audio:todo` writes `docs/VOICE_SCRIPT.md` (full: sections numbers by form, foods, connecting words, whole lines, monster lines) and with `-- --spike` `docs/VOICE_SPIKE.md` (53 lines). Each item is one numbered line, `12. **Seven** plus two cookies, please! — \`num.7.lead\``: a carrier sentence from a real game line with the target in bold, and the clip id. It then lists, per voice, the clips the manifest lacks.
- (b) `npm run audio:build -- --src <folder>` reads **the committed script it was recorded from** (the spike script when the folder name contains "spike", else the full one; `--script` overrides) and matches each Audacity region label (text = item number) by number. Each `x.wav` needs `x.txt` (Audacity's label export). Unknown numbers, duplicates, point labels and non-numbers stop the build before anything is written; missing numbers are listed (a partial session is fine). `--dry-run` only reports; `--voices` limits voices; `--kbps 64` if hissy.
- (c) Processing per clip: 40 ms pad around the label, resample to 48 kHz, 70 Hz high-pass, one gain per master take to −18 LUFS (EBU R128, measured over the whole take, so clips cut from one take keep their relative level), silence trimmed at −45 dB at both ends, the voice's shift (D145), a limiter, 5–10 ms fades, AAC-LC mono 48 kbps `.m4a`.
- (d) **Who gets which clip:** the spike is built for every voice (the listening test compares voices); the full script follows the inventory: every clip of every phrase a speaker says with numbers 0–20 and every food (a slight over-count; numbers 0–20 are covered in full anyway), the missing-number tickets, and each monster's own lines in its own voice only. Today: 148 recordings → 807 files (each monster 117, Pip 81, narrator 24).
- (e) **Manifest:** `public/audio/manifest.json` = `{ version: 1, ext: "m4a", voices: { <voice>: { <clipId>: <ms> } } }`, committed (empty until the first build); a build merges its clips into it. It is checked by hand, not with zod: zod 4 probes `new Function` on first use, which the CSP reported as a violation once the manifest loaded at startup (caught by the M0 e2e). `lint:content` fails on an unknown voice or clip, a listed file that is missing, a file not listed, or a clip over 8 s.
**Why:** Reading the numbers back from the script the owner read from means a later change to the inventory cannot shift labels onto the wrong clips. One gain per take keeps a carrier's words at matching levels, which per-clip loudness normalization of half-second clips would not.
**How to revisit:** `scripts/audio-todo.ts`, `scripts/audio-build.ts`, `scripts/audio-lib.ts`, `src/engine/voiceScript.ts`, `src/engine/voiceManifest.ts`.

## D145 — Pitch shift with ffmpeg-static's rubberband filter; starting shifts per voice (2026-11-21)
**What:**
- (a) The per-voice shift uses ffmpeg's **`rubberband`** filter with `formant=preserved` and `pitchq=quality`, from `ffmpeg-static` (D140c). Checked 2026-11-21: the package installs here (its postinstall download was not blocked), the Linux binary (ffmpeg 7.0.2) lists the filter, and the Windows x64 binary it downloads (gyan.dev 6.1.1 essentials) is built with `--enable-librubberband`. No other tool is needed.
- (b) Starting shifts (`VOICE_SHIFTS` in `src/engine/clips.ts`), semitones / tempo: narrator 0 / 1, Pip +6 / 1, Blobbo +2 / 1, Gruffles −5 / 0.94, Zibbit +4 / 1.1, Mimsy +5 / 1, Chompers −2 / 1.05, Wobbleton −1 / 0.94. From the TTS pitch and rate in MonsterSpec (12·log2 pitch; rate / 0.85), pulled in where the TTS pitch would mean a large shift (Gruffles −9, Pip +7), and Wobbleton moved off the narrator's pitch. The listening test tunes them; changing one means re-running `audio:build`.
**Why:** PLAN §6.6 named the risk that the Windows build had no formant-preserving shift; it does, so the plan stands. Large shifts with formants preserved can still sound odd; the iPad listening test judges.
**How to revisit:** `VOICE_SHIFTS`, `filterChain` in `scripts/audio-lib.ts`; the step 2 result (e.g. `formant=shifted` for a more cartoon monster).

## D146 — The e2e voice test set is generated and emitted only into the e2e build (2026-11-21)
**What:** A Vite plugin (`scripts/vite-e2e-voice-plugin.ts`) emits generated WAV tones and their manifest into `audio-e2e/` of the `VITE_E2E=1` build only; the player reads `audio-e2e/` in that build and `audio/` otherwise, and Workbox precaches `wav` only there. The set: Pip's numbers 0–10 (lead, end), "more!", "left!" and four fixed lines; every monster's numbers 0–10 (lead, mid), "plus", "minus", "cookies, please!"; each monster greeting and Pip's "Your turn! Follow me." are "stuck" clips (manifest 300 ms, file 6 s); nothing for the narrator. `build.test.ts` checks the production build has no `audio-e2e` and no WAV. No binary test files are committed. Older specs that asked which voice said a line now read the voice layer's log (`heard()` in `tests/e2e/service.ts`), since recorded lines never reach the stubbed speech engine. Found 2026-11-21: Playwright's Chromium and WebKit in this container both decode AAC, but e2e stays on WAV as D141e says.
**Why:** The offline test needs the clips precached by the real service worker, so they must be in the built output, and nothing of the test set may reach production.
**How to revisit:** the plugin, `src/audio/voice.ts` (`ROOT`), `tests/e2e/voice.spec.ts`.

## D147 — Recorded playback limits and fallbacks (2026-11-21)
**What:**
- (a) A recorded line's timeout is the clips' manifest durations back to back plus 700 ms (scaled by the e2e time scale); a clip still playing then is cut, so it never talks over the next line.
- (b) Whole-line TTS also when the clips cannot be fetched and decoded within 1.5 s, or the AudioContext is not running within 250 ms of asking (e.g. before the first tap); never part recorded, part TTS.
- (c) Joins: equal-gain linear crossfade, 15 ms by default (0–40 ms on the Voice test page, not stored); at load each clip is trimmed below −44 dBFS with a 12 ms pad.
- (d) Counting while building (`count.n`) plays in Pip's recorded voice (PHRASE_SPEAKERS); its TTS fallback keeps today's plain voice. Monster greetings and thanks use the monster's line 0, as the game does.
- (e) `voiceBusy()` covers recorded and TTS lines, and every interrupting line stops both.
- (f) A line whose audio clock has not moved 300 ms after it starts (iOS can report a frozen context as running, D87) is cut and goes to TTS as a whole; one decode that never calls back is given up after 3 s so it cannot block the one-at-a-time queue. Each join's fade lasts exactly the clips' overlap.
**Why:** Keeps the §8.1 contract (never block, never overlap) with real clip lengths instead of the TTS formula (PLAN §6.6), and keeps a slow first decode on an old iPad from leaving a silent gap.
**How to revisit:** `src/audio/voice.ts`, `src/audio/voicePlan.ts`; the owner's playtest (cut-offs, gaps, latency of the first line).

*D148–D152 were written on a branch as D139–D143 with milestones M13–M16; renumbered on 2026-11-21 when merged with main, which had already used D139–D147 and M13 for recorded voices. Commit messages before the merge use the old numbers.*

## D148 — Shop prices in five tiers with colorways, sized to last about two months (2026-11-21)
**What:**
- (a) **Lifespan target.** The shop is sized for the owner's estimate of play: an hour a week in sittings of 15–20 minutes, services of 3–4 minutes (simulated: about 14 services, 85 monsters and 320 coins a week). The M4 stock lasts about 2 months (simulated 2.3); the later content (D149) about 6–9 more.
- (b) **Earning is unchanged** (D6, D31): 3 coins a monster, +5 tip, 23 a service.
- (c) **Tiers:** T1 20 (one service), T2 30, T3 55, T4 100 (about one sitting), T5 180 (about two sittings). A T1 item is reachable after the first service. Nothing costs more than about two sittings until the Wish Jar (M6, D149) exists; a pricier "grand wish" tier may follow it.
- (d) **Colorways:** an item may come in several colours, each its own purchase. The first colour costs the item's tier price, each other one 75% of it rounded to 5; colorways of a slot's free default cost T1. M4 gives items at most 3 colorways including the original; M14 adds 1–2 more. Colours come from seven shared families (Sunny, Berry, Mint, Sky, Honey, Lavender, Cocoa) so items match across slots; each family appears in several slots. No colorways on windows, named looks (Brick, Starry Night, Rainbow), metal or glass (Disco Ball, Star Chandelier, Fish Bowl, Trophy Shelf), the serve bell (a control), the chalk menu board, or staff.
- (e) **M4 stock:** SPEC §10's items with tiers and colorways: 36 items, 54 paid entries, 3,080 coins (was 30 items, 1,340). "Sunny Yellow" becomes Plain Paint (Sunny), "Mint Stripes" Stripes, "Pink Tiles" Tiles. `buy` events name entries `slot.item.colorway`.
**Why:** Owner (2026-11-21): the 1,340-coin shop is bought out in 4–5 hours of play, far sooner than new content can be built. Research on reward pacing and young children's saving (goals of 1–2 weeks at most, shown visually) and on goal gradients shaped the tiers; the simulator (D150) checked them: first purchase at the end of the first sitting, about 85–90% of sittings end with a purchase, never more than two sittings in a row without one.
**How to revisit:** `TIER_PRICE`, `COLORWAY_SHARE`, `COLOR_FAMILIES` and `M4_ITEMS` in `src/engine/economy.ts`; rerun `npm run economy:sim`. The owner plans to retune after the M4 playtest; scaling all prices × 0.8 gives exactly 2 months.
*Amended by D152: Wood is the free floor and Checkerboard a T2 item; the M4 stock is 55 paid entries, 3,105 coins.*

## D149 — Later shop content in five milestones; delivery crates every 30 monsters (2026-11-21)
**What:** The owner approved and split the economy follow-ups (numbering chosen by the owner: fill the unused M6, then the next free numbers, M14+):
- **M6 Wish Jar** (fast follow-up to M4): the child pins an unowned item; the jar on Home and Results shows how full the wish is; Pip may say how close it is at Results. Reuses the M6 number left free by D21.
- **M14 Deliveries & Themed Sets:** 1–2 more colorways on items that have them, four themed sets of three new pieces each (completing a set gives a free surprise, never coins), and delivery crates for all later content: **2 items every 30 monsters served, held while 6 or more unbought items are in the shop**; the first crate of an update arrives with it; a crate's arrival is recorded when first seen, so a backlog arrives one crate at a time. Counted in monsters, not services, because services can be cut short and their length is a parent setting. Never calendar-based, never expiring.
- **M15 Monster Wardrobe:** per monster, including the two guests: 2–3 hats (T2), 4–5 skins (T5) and 2–3 accessories (T3), worn whenever the monster visits.
- **M16 Monster Album and friendship gifts:** per monster: portrait, name, favourite foods, brief bio, collected hats/skins/accessories, its friendship gift (free, after it has been served a set number of times). Story episodes per monster are a later idea.
- **M17 Treat Time:** a repeatable treat (about 40 coins) that throws a short party; nothing decays or needs care. *(Price set to T2, 30 coins, by D153.)*
**Why:** Owner (2026-11-21): more and longer-lasting content without relying on new art alone. Simulated (D150): the planned counts total about 9,400 coins, about 6.8 months of play. *(Corrected in review, 2026-11-21: round-2 colorways are now priced as colorways of their own items, 11 at T1–T2, 2 at T3, 2 at T4, so the total is 9,525, still about 6.8 months.)* Content lifespan is set by total price; crate pace only sets how many choices are on the shelf. A crate worth about what the child earns between crates (one item per 20–25 monsters) keeps about 5 choices in the shop, and the hold stops a saving child from facing a growing pile; slower crates only made her wait with coins piling up (35–53% of sittings with nothing to buy). The ratio is independent of play time because coins and crates both count monsters.
**How to revisit:** crate size, interval and hold in M14; counts and tiers in `LATER_GROUPS` (`src/engine/economy.ts`); rerun the simulator with the real catalog when M14 and M15 are designed.
*Amended by D151: crates are built in M4 and also deliver the M4 stock beyond a 17-entry starter shelf; M14 is content only.*

## D150 — Economy simulator (2026-11-21)
**What:** `npm run economy:sim` (`scripts/economy-sim.ts`, pure engine module `src/engine/economySim.ts`, tests in `tests/unit/economy.test.ts`) plays 300 seeded runs of weeks of sittings against the catalog, earning as SPEC §9 pays and spending by three habits (impulse, cheapest-first, saver), and writes `docs/ECONOMY_SIM.md`: earnings per week, tier costs in play time, the catalog, buy-out time with sensitivity (prices, minutes a week, service length, 8 orders), the later-content totals, and crate rules. Flags change the profile and tier prices. Not part of `check`.
**Why:** Owner asked for a tool to test prices against play time before committing to them.
**How to revisit:** the model's own assumptions (30 s between services, 1.5 min in the shop per sitting, requeue and early-exit rates) are `DEFAULT_PROFILE` in `src/engine/economySim.ts`; replace them with measured values after the M4 playtest.

## D151 — Delivery crates in M4; the shop opens with a starter shelf (2026-11-21)
**What:** Amends D149. Delivery crates (2 entries every 30 monsters served, held while 6 or more unbought entries are in the shop, arrival recorded when first seen, one crate at a time from a backlog) are built in **M4**, not M14. The M4 shop opens with a **starter shelf** of 17 entries (775 coins): the first colour of every tier 1–2 item, the tier-1 recolours of the free defaults (Plain Paint Berry and Lavender, Checkerboard Berry and Mint), and four things to save for (Garden window, Disco Ball, Bunny Barista, Cat Waiter); every slot has at least one entry on it. The other 37 M4 entries wait in the crate queue from day one; later updates' items join the queue behind them. M14 becomes content only (colorways round 2, themed sets). M4's estimate rises from 2.5 to 3.5 h. Holding items back for M6 instead was rejected.
**Why:** Owner (2026-11-21): 54 entries on day one overcrowds the shop for a young child. Simulated (D150): the shelf averages about 7 unbought entries instead of 24–28, with the same buy-out (10 weeks), the same share of sittings ending in a purchase (84–94%), no sittings with nothing to buy and no dry spell longer than two sittings. Holding items for M6 would not lengthen the shop (lifespan is set by total price) and, since M6 follows M4 quickly, would just bring back a big batch a week or two later; the crate queue also covers a late M14. The crate mechanism gets playtested months earlier.
**How to revisit:** `STARTER_SHELF`, `CRATE_SIZE`, `CRATE_EVERY_MONSTERS`, `CRATE_HOLD_AT_UNBOUGHT` in `src/engine/economy.ts`; rerun `npm run economy:sim`.
*Amended by D152: the shelf's floor entries are Wood Honey, Wood Cocoa and Checkerboard Classic (still 17 entries, 775 coins); 38 entries wait in crates.*
*Amended by D157: Tiny Robot Sky and Star Chandelier replace Bunny Barista and Cat Waiter (still 17 entries, 775 coins); 33 entries wait in crates.*

## D152 — Wood is the free floor; Checkerboard is for sale (2026-11-21)
**What:** Amends D148 and D151. The Floor slot's free default is **Wood** in its classic colour (the floor the café art already draws), with Honey and Cocoa recolours at T1 (20 each). **Checkerboard** becomes a T2 item: Classic 30, Berry 25, Mint 25. The M4 stock becomes 55 paid entries, 3,105 coins (about 2.4 months at an hour a week). On the starter shelf, Wood Honey, Wood Cocoa and Checkerboard Classic replace Checkerboard Berry, Checkerboard Mint and Wood Honey (17 entries, 775 coins); 38 entries wait in crates.
**Why:** Owner (2026-11-21): the café art shows a wood floor, so the free default should be wood and the checkerboard a purchase.
**How to revisit:** the Floor entries and `STARTER_SHELF` in `src/engine/economy.ts`; rerun `npm run economy:sim`.

## D153 — Generic wish line; Treat Time at T2 (2026-11-21)
**What:** Pip's Wish Jar line at Results (M6) is one of a few fixed, generic lines ("Your wish is getting closer!", "Just a little more for your wish!", "You can get your wish!"); it never names the item or says an amount. The Treat Time treat (M17) costs T2, 30 coins.
**Why:** Owner (2026-11-21). Naming the item would need a recorded clip for every shop item name in every voice pass (D142); a generic line is three clips. The treat had been "about 40 coins", which is not a tier price; every other shop price comes from the tiers (D148).
**How to revisit:** if the child wants Pip to name the wish, add item-name clips in a voice pass; the treat price is one table entry when M17 is built.

## D154 — Crate arrivals are events in the progress log (2026-11-21)
**What:** A delivered crate is recorded as an event `{ k:'crate'; n; next }` (crate number; monsters served at which crate n+1 is due), written when the child opens the shop and a crate is due, one per visit (D151). Delivered crates = distinct `n`; crate n's items come from a fixed crate order (catalog order, never random), so the same crate on two devices holds the same items and a merge counts it once (two rows for one `n`: the smaller `next`). `next` = max(this crate's due point + 30, served + 1); a crate is held while 6 or more unbought items are on the shelf. Adding the event kind is the project's first schema change: `schemaVersion` 2, a migration (existing data needs no rewrite) and a fixture test (D36), and the export/import schema accepts it.
**Why:** Owner (2026-11-21). Crates cannot be derived from monsters served alone: after an update a long-time player would get every crate at once. The note must survive reloads and should merge, so the iPad and the phone show the same shelf; the per-device `meta` store is not merged.
Timing checked in the simulator (D150): counting the next crate from the monsters served at arrival instead stretched the pace (sittings with nothing to buy rose from about 1% to 44%), so the schedule counts from the due point.
**How to revisit:** if the schema bump causes trouble before M4 ships, a `meta` flag works for a single device; switch only with a merge test showing the difference is acceptable.

## D155 — M4 splits into M4a (code, stand-in art) and M4b (art in batches) (2026-11-21)
**What:** **M4a Coin shop** (≈ 3.5 h) builds the whole shop end to end: catalog, `buy`/`equip`/`crate` events and `schemaVersion` 2, shop screen with preview, colour dots, Buy + confirm, equip, starter shelf and crates, purchases shown on every child screen, and the `?decor` contact sheet (D156). Every item is drawn as the labelled placeholder shape SPEC §7.4 already allows. **M4b Shop art** replaces the placeholders in batches, one chat each, each ending with the contact sheet and a stop for the owner: batch 0 (art guide plus one test piece per slot and the decor lint rules), batch 1 wallpaper + floor, batch 2 lights + window, batch 3 counter-top + wall art, batch 4 the guest monsters Spindle and Drizzle (moved here from M4 because they are art, not shop code). M4a and M4b each count as a milestone for the stop rule.
**Why:** Owner (2026-11-21): there is too much new art for one chat, and the priority is getting the coin shop built. Splitting lets the shop be played and tested before any drawing, and keeps each art review small enough to judge in one sitting. Agent estimate for M4b: about 3–4 h over the five batches, plus the owner's review time.
**How to revisit:** batches can be merged or reordered by the owner; the guest monsters can move to any later milestone, since nothing in M4a depends on them.

## D156 — Art guide, `?decor` contact sheet and decor lint (2026-11-21)
**What:** `docs/ART_GUIDE.md` holds the drawing rules for shop art (and later wardrobe and staff art): what the existing café, Pip and monsters already do, the slot geometry, colour use, the review checklist and a list of locked (approved) items. M4a adds a `?decor` page that shows every M4 entry in place in the café, slot by slot and colorway by colorway, at 1194×834 and 844×390; it is the review surface for every art batch, and its screenshots go in `docs/screens/M4b/`. Batch 0 adds decor rules to `lint:content`: colours only from `COLOR_FAMILIES` or the scene's named constants, stroke widths from a shared set, and an element count per item that keeps the busiest combination inside the SVG budget (§2.4, D113). Items the owner approves are marked locked in the guide and are not redrawn without asking.
**Why:** Shop art will be drawn across many separate chats; consistency has to live in the repo, where every chat reads it, not in a conversation that gets compacted. A contact sheet lets the owner judge a whole batch side by side at the size the child sees.
**How to revisit:** the guide's rules change only with the owner's OK, recorded in the guide's change notes (and as a decision if it changes SPEC).
*Amended by D158: the guide is no longer a fixed rule set; the lint check covers colour families only, and stroke widths and colour constants are house style, not lint.*

## D157 — Staff & pets move to M18 Café Staff (2026-11-21)
**What:** Amends D148, D149 and D151. The Staff & pets slot (Pip as free default; Bunny Barista T4; Cat Waiter, Bear Busker, Owl Cashier, Fox Baker T5) leaves M4 and becomes **M18 Café Staff**, planned in `LATER_GROUPS` as its own wave (820 coins) and delivered by the crates. M4 now has six slots, 30 items, 50 paid entries and 2,285 coins. On the starter shelf, Tiny Robot Sky (T4) and Star Chandelier (T5) replace the two staff as things to save for (still 17 entries, 775 coins); 33 entries wait in crates. Later content totals about 10,300 coins (about 7.3 months). The simulator's assumed later-wave weeks move to 7 (decor), 12 (wardrobe) and 20 (staff), since M4 now runs out about two weeks sooner.
**Why:** Owner (2026-11-21): staff are characters with idle loops and event reactions, which adds complexity to the first shop; the priority is getting the coin shop built. No existing milestone fits: M15 Wardrobe is monster clothing and already large, M16 Album is per monster, M14 is decor. Staff are closest to M15 in kind (character art) and are best drawn after it, once the character rules in the art guide have been proven. Simulated (D150): the M4 stock now lasts about 1.8 months (8 weeks; with fewer big-ticket items the crates, not the prices, set the pace: prices × 0.8 gives the same 8 weeks); 92–100% of sittings end with a purchase and no dry spell is longer than one sitting. Over the whole roadmap, sittings with nothing to buy rose from 0% to about 4%: during the decor wave the shelf holds mostly cheap colorways and nothing big to save for, which the staff used to provide.
**How to revisit:** M4 acceptance now asks for about 2 months rather than 2–3. If the M4 playtest shows the shop running out too soon, the cheapest fix is the crate pace (`CRATE_EVERY_MONSTERS`), not prices; if the decor-wave waiting matters, give M14 a big save-for item. Staff return in M18 as designed in SPEC §10.1.

## D158 — Art guide: firm limits, house style as a starting point, room to experiment (2026-11-21)
**What:** Amends D156. `docs/ART_GUIDE.md` holds the art to three strengths:
- **Firm limits:** always met. The play stays the brightest and clearest thing on screen (D100); art reads at 844×390; colorway items take shared family colours as props; the SVG budget (D113); gentle, optional motion with still poses under reduced motion; child-safe (nothing scary, no words to read, no brands, nothing copied); every piece has a slot and falls back to the stand-in.
- **House style:** how the café, Pip and the monsters are drawn now. It's the default, not a rule.
- **Room to experiment:** an art chat may leave the house style. It flags each such piece in the batch report and may show it beside a house-style version. What the owner likes is written into the guide as style; a one-off stays a one-off unless the owner says otherwise.

The decor lint check covers only what can be checked mechanically among the firm limits: colorway items use `COLOR_FAMILIES`. The budget is enforced by `budget.spec.ts`. Stroke widths and fixed colour constants are no longer lint rules. Per-item element counts are an allowance to share, not a cap; only the total must fit.
**Why:** Owner (2026-11-21): the first draft was too prescriptive. The owner wants the agent free to find a look they like that the existing art doesn't already use, while consistency is still kept by review and by the guide recording what the owner chose.
**How to revisit:** if batches drift apart, move the drifting point from house style into the firm limits, with the owner's OK.

## D159 — The serve bell is not a shop item (2026-11-22)
**What:** Amends D148. The Counter-top slot's free default was "Bell", the serve bell itself. It is removed from the catalog: the Counter-top default is now **Clear Counter** (nothing on the counter-top slot), and the serve bell stays where SPEC §5.4 puts it, always present, never sold or unequipped. New looks for the bell may come in a later item drop, as an appearance option that keeps it a control; that is an unscheduled idea (SPEC §14). Catalog totals are in D160.
**Why:** Owner (2026-11-22): there must always be an object the child touches to say the order is ready, so the bell cannot be a decoration that might be swapped out.
**How to revisit:** a bell-looks drop would add appearance entries for the bell (not a Counter-top item), with a test that every look keeps the bell's tap target and behaviour.

## D160 — The Menu Board costs 20 coins; the wall starts bare (2026-11-22)
**What:** Amends D148 and D151. The Wall art slot's free default was "Menu Board", which the café art has never drawn. The Menu Board becomes a **tier-1 item, 20 coins**, one look (no colorways), and the free default is **Bare Wall** (nothing in the wall-art slot). Following D151's rule (the first colour of every tier 1–2 item is on the starter shelf), the Menu Board joins the starter shelf: 18 entries, 795 coins. With D159, M4 is 31 items (including three empty defaults), 51 paid entries, **2,305 coins**; 33 entries still wait in crates. Simulated (D150): the M4 stock lasts about 1.8–1.9 months (8 weeks), 92–100% of sittings end with a purchase; over the whole roadmap, sittings with nothing to buy are about 5% (4% after D157).
**Why:** Owner (2026-11-22): the menu board was never drawn, so it can't be a free default already in the café; it is something to buy.
**How to revisit:** the Wall art entries and `STARTER_SHELF` in `src/engine/economy.ts`; rerun `npm run economy:sim`. Note: "menu board" also names the dish-choice screen (SPEC §5.3); the shop item is the wall decoration only.

## D161 — "The shop counts as play time" waits for M12 (2026-11-22)
**What:** M4a's acceptance line "the shop counts as play time" is marked not applicable until M12: there is no play-time clock yet (the limit and its active-time accumulator were moved to M12 and postponed, D124). When M12 is built, the Shop is an ordinary child screen and its active time counts like every other.
**Why:** Owner (2026-11-22). Nothing in the app measures play time today, so the line can't be tested.
**How to revisit:** M12's acceptance carries the check (§6.5): time on the Shop screen counts toward the allowance.

## D162 — Shop speech uses general lines (2026-11-22)
**What:** Pip's shop lines never name an item, a colour or an amount: e.g. "Buy this one?", "It's yours!", "A delivery arrived!", "Keep cooking to save up!". The confirm card shows the item's name and price as text; nothing reads them aloud.
**Why:** Owner (2026-11-22), following D153: every spoken name or amount would need its own recorded clip (D142), 31 items and their prices in M4 alone.
**How to revisit:** if the owner wants names spoken, add item-name clips to the voice script and a line form that joins them (§8.4).

## D163 — Home's shop button reads "Shop" (2026-11-22)
**What:** Amends SPEC §5.2 and §5.7. The shop button is labelled **Shop**, with a small drawn paintbrush beside the word (a drawing, not an emoji: the emoji allowlist is foods only, §7.1). On Home it sits right of Open the Café, centred on the same line (x 940–1240, y 500–660); the matching space on the left is kept for the Monster Album button (M16).
**Why:** Owner (2026-11-22): "Shop" is the word the family uses, and the left side is planned for the album.
**How to revisit:** `SHOP.shopButton` in `src/app/metrics.ts`.

## D164 — The delivery moment, and Buy without enough coins (2026-11-22)
**What:** When a crate arrives (§10.1, D154), a cardboard box fades in and drops onto the counter's far edge in the middle of the room with a small bounce, the rest of the shop dims, Pip says "A delivery arrived!", and sparkles twinkle round the box. It opens on a tap or by itself 2 s after it lands: the side flaps fold out to the sides and the front flap folds down, sparkles burst, and the two new entries rise out of it, then go to their tiles, which wear a star (as do their slot tabs) until tapped. Reduced motion: no drop, bounce or twinkle; the box appears and opens. When the balance is below the price, Buy is dimmed; a tap on it gets Pip's "Keep cooking to save up!" and nothing else (no buzzer, no shake).
**Why:** Owner (2026-11-22): a crate should feel like an event without waiting on the child; the first flaps drawn over the box did not read as flaps.
**How to revisit:** `AUTO_OPEN_MS` and the delivery CSS (`shop.css`); the box is `src/art/decor/DeliveryBox.tsx`.

## D165 — A shorter ticket so the lights show (2026-11-22)
**What:** Amends SPEC §5.4. The ticket keeps its width and bottom but starts lower: x 808–1168, y 172–360 (was y 140–360), and x 904–1264 while counting together. It still holds the food and the widest sentence (`10 − ? = 6`) above its torn edge.
**Why:** Owner (2026-11-22): the right string of lights hangs just under the status bar (y 122–166) and was always hidden behind the ticket.
**How to revisit:** `TICKET_Y` in `src/app/metrics.ts`.

## D166 — Mocks test fit at the maximum count (2026-11-22)
**What:** Whenever a mock lays out UI elements whose number varies on one screen (shop tiles, colour dots, monsters on Results, buttons, tabs), it also shows the maximum number planned for any milestone, with the longest names and widest numbers, and is checked for overlap, clipping and even spacing before the owner reviews it.
**Why:** Owner (2026-11-22): the round-2 shop mock showed three colour dots and three tiles while five dots and up to fourteen items are planned.
**How to revisit:** The working agreement in CLAUDE.md.

## D167 — The shop shelf pages four tiles at a time (2026-11-22)
**What:** Amends D163/§10 shop layout. The counter band shows a slot's items four to a page (tiles 128 × 220 at x 112–648, y 464–684) between two obtuse-triangle arrows (88-px cells, x 16–104 and x 656–744); page pips under the tiles show which page is on. With one page there are no arrows or pips; with more, both arrows show and the one with no page that way is faded, so nothing jumps. The colour dots (room for five) and Buy stay on the right. M14 brings a slot to at most 14 items (four pages).
**Why:** Owner (2026-11-22) chose option A of four mocked (pages, sliding strip, two rows of picture-only tiles, a "more" sheet). The max-fit mock (D166) showed six 110-px tiles too narrow for "Monster Portraits" and a three-digit price; tiles keep their names, which help the child read (she reads easy chapter books, §1).
**How to revisit:** `SHOP_PAGE` and `SHOP` in `src/app/metrics.ts`.

## D168 — The caption bubble fits its text (2026-11-22)
**What:** Amends §5.4 (D76) and §7.3. The caption bubble shrinks to its widest line (its §5.4 box, x 226–496, y 140–264, is the most it grows to), with balanced line breaks. A monster's bubble stays anchored by its right edge and middle, so its tail still points at the monster; Pip's by its right and bottom edges, so its tail still points down at Pip. Captions always show.
**Why:** Owner (2026-11-22): the full-size bubble always covered the window and the left string of lights; captions stay because the child reads them and learns words from them.
**How to revisit:** `Caption` in `src/game/service/ServiceParts.tsx` and `.caption` in `service.css`.

## D169 — Pip names a slot when its tab is tapped (2026-11-22)
**What:** Amends §10. Tapping a slot tab in the shop has Pip say the slot's name, with his caption: "Wallpaper", "Floor", "Lights", "Window", "Counter top", "Wall art". Six new lines, on the TTS fallback until the voice pass (D142).
**Why:** Owner (2026-11-22): the tabs are pictures only, so what each one holds might not be obvious; hearing and seeing the word also helps her reading.
**How to revisit:** the shop phrases in the phrase table.

## D170 — Results gets the Shop button in M4a (2026-11-22)
**What:** Amends §5.7. Results shows four buttons on one line, text 38 px: Change dish (x 65–345), **Another service** (x 365–715, still the highlighted default), Shop with the paintbrush (x 735–975), Home (x 995–1215), all 160 px tall.
**Why:** Owner (2026-11-22) asked to see Shop on Results in M4a; four buttons only fit one line with slightly smaller text.
**How to revisit:** `RESULTS4` in `src/app/metrics.ts`.
