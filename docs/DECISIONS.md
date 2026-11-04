# Decisions

Each entry: what was decided, why, how to revisit. D1–D14 were made during design (departures from the original proposal and resolved gaps). Round 2 added D15–D19; round 3 (owner clarifications on hours, the play allowance and story tickets) added D20–D21 and rewrote D7. Round 4 (owner: pick the skill instead of automatic leveling; play-time limit optional) added D22–D27 and amended D3, D6, D7, D13, D16, D20. Round 5 (owner: remove automatic leveling, Chef's Pick and chef hats from the project entirely) added D28 and reduced D13 and D25 to tombstones. Round 6 (owner walk-through of SPEC_REVIEW.md) added D29–D38; round 7 (applying them to the docs) added D39. New decisions are appended after the last entry, numbered one higher than the highest existing `D<n>`.

**Reading guide for removed features.** The first draft of the spec contained three linked mechanics that no longer exist anywhere except in this file and in git history: **automatic leveling** (stage promotion, demotion and fast-track driven by recent accuracy), **Chef's Pick** (an automatic "recommended" mode that chose the skill to practice and mixed in review of other skills) and **chef hats** (up to three mastery badges per skill, shown on each menu tile, each paying a coin bonus). Where an entry below mentions them, it describes the first draft, not the current design. See D28.

**D1. Ladder re-cut into two open tracks.**
Changes: (a) "within 10" split into A1 within 5 and A2 within 10 (a young child's within-5 and within-10 are very different jobs; pools of 20 and 70); (b) added A0 Count It Out (tray tutorial and numeral/quantity base); (c) added A6 teens ± ones without crossing, between teen numbers and bridging (the jump from 10+4 to 8+5 is otherwise too big); (d) "missing amounts" kept at A4 for missing addend/subtrahend within 10, but start-unknown (`? + 3 = 8`, `? − 3 = 5`) moved to backlog because it is the hardest word-problem structure; (e) comparing moved out of the "stretch" tail into its own P2 tile (it is a Kindergarten skill; still low priority because she likely does it in school); (f) tens work (B1/B2) is a separate track that does not depend on bridging, so a strong counter can do 30+20 before wrestling with 8+5; (g) no locks; every tile is open. *(The first draft also said "Chef's Pick recommends"; Chef's Pick was removed, D28.)*
*Amended by D34: in (d), only the subtraction start-unknown form `? − 3 = 5` stays in the backlog; the addition form `? + a = c` is a commuted missing addend and is in A3/A4.*
Revisit: if she stalls at a skill, hide or reorder in the parent Skills tab; ladder order is data in `engine/skills.ts`.

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
Intent: hand her the device and know she can play for a defined period, not endlessly, without parent intervention to extend. Implemented as an allowance of active play time per device (off/5/10/15/20, off by default per D27) that is not reset by closing the app or starting another service. At zero the current monster finishes, Results plays, and the café locks persistently; only the parent gate can Start new session or Add time (optional auto-refill modes exist but default is parent-only). Never a visible countdown. Two earlier readings (daily cap, then per-service limit) were wrong. Known limits: per device, and clearing site data resets it (SPEC §6.4). No "max services per day" setting (owner declined).

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
She will play on an iPad, an iPhone and an Android phone, with no backend. Local-only state would fork per device, so progress is an append-only event log; derived state is a pure replay; devices sync by exporting a file and **merging** (union by event id) on another device. Coins are carried in events (never recomputed), so merges cannot lower earned coins; duplicate buy/serviceEnd events count once (the first draft also deduplicated hat events; hats were removed, D28). Settings (voice, volume, limits) stay per device. Cost ≈ +1 h in M3 versus plain snapshots; benefit: backup, sync and migrations all become the same mechanism. Revisit: if the owner decides one device is canonical, merge becomes optional but the log stays.

**D16. Starting state from the owner's report.**
The child is in the first half of a first-year primary maths book; knows +0, +1 and doubles (1+1 … 9+9) from flash cards. Those facts start at box 3 (+0 is in no pool, D11); the child can solve take-away word problems but is still learning number sentences with sums under ten, so symbolic subtraction is treated as new. The spec's earlier claim that the child would "live in A0–A5" was revised: A2–A8 is this school year's curriculum, B1–B2 likely second-half work (hence the Big Menu is bonus work, M8). Wording generalized by D38. Editable in Parent → Skills → Starting point.
*Amended by D22/D28: the first draft also marked A0 as assumed-known and had the automatic Chef's Pick start at A1 with a short diagnostic and fast-track; those were removed. What remains of the preset: the known addition facts start at box 3 (less frequent), every skill starts at S3, and the first-run menu highlights A1.*

**D17. Near-doubles and 9+x are the first strategies for new facts.**
They build on her known doubles and +1. `nearDouble` strategy tag and demo; A2 and A7 difficulty ordering lead with them.

**D18. Same-origin hygiene on GitHub Pages.**
`<user>.github.io` is one origin for all of the owner's Pages projects, so IndexedDB, caches and any `localStorage` are namespaced `ncmc`, and reset/cleanup code may only touch `ncmc*`. Enforced by ESLint and a unit test.

**D19. Back guard.**
Android back gesture and iOS Safari edge-swipe would otherwise exit the game mid-service; both open the "Take a break?" dialog instead.
*Amended by D37: the guard history entry is pushed from inside a tap (Chrome skips entries pushed without user activation) and again after each in-app navigation.*

**D20. Build tiers instead of an hour cap (owner decision).**
The earlier "≈ 20 h" was only a scoping device. Tier 1 = a playable game in ≈ 10.5 h (M0–M3: foundations, core loop with A1–A2, café service with A3, hand-off-ready persistence + play allowance + minimal parent area). Tier 2 = bonus features M4–M11 in any order, no upper limit. *Amended by D22: Tier 1 is now ≈ 10 h (M2 ≈ 3.25, M3 ≈ 1.5).* *Amended by D36: M3 is split into M3a/M3b and the Tier 1 hour estimate is redone in PLAN.md.* Consequence: Tier 1 has no shop (coins accrue and show in the jar), no multi-device merge UI (the event log exists), and only A1–A3, which matches her current book.

**D21. Story tickets (word-problem phrasing of each order) declined by the owner.**
Considered: template-driven one-sentence stories beside the equation, to bridge her take-away word-problem skill to number sentences (risks: reading load blurring the mastery signal, keyword shortcuts). Removed from the spec; M6 number left unused. Revisit if she stalls on missing-addend or take-away sentences.

**D22. The owner picks the skill; there is no automatic leveling.**
What: every play session starts at the menu board. She or a parent picks a skill tile; "Another service" on Results repeats the same skill by default; "Change dish" returns to the menu. Dropped from the first draft (first deferred to an optional milestone M12, then removed outright by D28): Chef's Pick (an automatic recommender with a "frontier" skill, a fixed mix of orders and review slots), cross-skill 20% review, stage promotion/demotion/fast-track, mastery hats and their +10 coins, assumed-known skills. Kept: fact boxes as sampling weights (misses return sooner inside the chosen skill), requeue within a service, and the full attempt log. The menu is the first thing after Home ("Open the Café" opens it); the tile played last glows, A1 on first run.
Why: the owner knows where she is in the curriculum and wants to direct practice. The design review found that the automatic path was unpredictable for a first-time player: fast-track after one 6/6 service at S3 (where the prefilled tray and spoken counting make success near-automatic) would jump A1 to S1 and award two hats in about five minutes; the add/sub balance rule forced known facts into half of the first A1 orders; Chef's Pick had no review material on day one.
How to revisit: see D28 (the mechanics no longer exist in the docs; attempts are still logged with skill, stage and outcome, so a future adaptive layer could derive stages from history).

**D23. Stage is a fixed per-skill parent setting (default S3), stored as a `skillConfig` event.**
What: Parent → Skills lists each skill with a stage selector (S3–S0), applied from the next service. It replaces the `stageOverride` event with `skillConfig {skill, stage, ops}`, last writer per skill wins, so it syncs through merge (unlike per-device settings) and is not lost on a fresh device. Default S3 for every skill, A0 included.
Also fixes an inconsistency in the draft: requeue was written as "stage−1 (min S3)", but S3 is the *most* supported stage, so one step more support means S0→S1→S2→S3 (S3 stays). Requeued facts therefore get one step more support within the service.
Why: the scaffold must be adjustable without automatic movement, and the parent is the one who knows when to fade it.
How to revisit: if the parent wants it per device, move it to the `settings` store; if changing it is frequent, surface it on the menu board (parent-gated).

**D24. Per-skill operation filter: both / addition only / subtraction only.**
What: a parent setting in `skillConfig.ops`, shown only for skills with both operations (A1, A2, A5, A6, B1, B2). The session pool is restricted to the allowed forms; the menu tile's sample sentence matches. The ±1 add/sub balance rule applies only when `ops` is `both`.
Why: A1 addition is almost entirely known (5 of 6 canonical addition facts are in her preset; only 2+3 is new) while all 10 subtraction facts are new, so a mixed A1 spends about half its orders on facts she knows. Subtraction only is the likely setting.
Consequence: A1 with subtraction only has 10 canonical facts; a 15-minute limit, if one is enabled (2–3 services), repeats each about twice, which is practice, not a defect. The pool-size guard still prevents adjacent repeats.
How to revisit: the focus list (M7) can express the same thing per fact.

**D25. [Removed] Chef hats and the hat coin bonus.**
What: chef hats (up to three mastery badges per skill, shown on menu tiles and in Results, +10 coins each) were first deferred to an optional milestone (M12), then removed from the spec entirely by D28. There are no hats on tiles, in Results or the Progress tab, no +10 coins, no `hat` event type, and no hat SFX.
Why: hats measured mastery-driven stage progress, which the design no longer has, and the owner considered them an extra progression mechanic that is not needed for quite a while.
How to revisit: see D28. If a sense of progress on the tiles is missed in playtest, a simple effort-based marker (services completed per skill) is the cheapest substitute.

**D26. First-ever service starts with a fixed warm-up order.**
What: once per device (flag in `meta`), before the chosen skill's orders, one order `2 + 1` with cookies on one ten-frame at S3, whatever skill was picked. A ghost hand taps the bin once after 4 s idle; after the item lands and 4 more idle seconds it hovers over the bell. The bell press is always hers. It pays the usual 3 coins and writes no `attempt` event, so it cannot affect weights or stats.
Why: the draft's scripted gesture ("tap bin once, then bell once") only works for an `n + 1` fact, and the skill is now arbitrary. A scripted ghost bell tap would also be an auto-serve, which the invariants forbid.
How to revisit: if she does not need a warm-up (older player, profile M11), drop it; it is one flag.

**D27. The play-time limit is optional and off by default (owner).**
What: a fresh install has no limit. Parent → Settings → "Play time limit" is Off / 5 / 10 / 15 / 20 minutes. While Off there is no clock, no lock, no swinging-door cue, and no Start new session / Add time / Refill controls. Choosing a duration starts a full session; choosing Off at any time (even while locked) clears the lock. Everything else in SPEC §6 applies unchanged once a parent enables it.
Why: the draft (review row 33) defaulted to 15 minutes so the café would lock after a surprise amount of play. The owner wants the limit to be a deliberate hand-off tool that a parent switches on, never something that turns on by itself.
How to revisit: the default is one constant in `engine/config.ts`; the per-device `settings` store holds the choice.

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
What: (a) A first-try correct result raises a fact box only at S1 or S0; a miss or assisted resolution resets it to 0 at every stage. (b) Outcomes, spelled the same in the engine (§3.4) and the persisted `attempt` event (§11.2): `first` (right on the first serve, no Help), `afterHint` (Help pressed before the first serve, then correct; box stays), `fixed` (wrong first serve, then right on the second; box = 0, no requeue), `assisted` (worked demo + FollowMe; box = 0, requeue). Help at attempt 1 plays CountTogether and moves her to attempt 2, so Help followed by a wrong serve goes straight to Worked. (c) New facts are introduced in difficulty order, at most 3 per service; one box per unordered pair (the "half weight" wording is dropped).
Why: at S3/S2 the first operand is prefilled and the answer follows from counting out the second, so first-try success there says little about recall and would push facts out of rotation. "Wrong then fixed" was undefined, and a uniform weight of 5 for all new facts defeated D17's near-doubles-first order.
Consequence: at the default S3 boxes do not rise until a parent moves a skill to S1/S0, so sampling stays even. Supersedes the former OPEN_ITEMS #10 default (which logged the wrong-then-fixed case as `afterHint`); that item is now in OPEN_ITEMS' resolved table.
How to revisit: thresholds and the cap live in `engine/config.ts`; move S2 into the box rule if S2 turns out to be diagnostic in practice.

**D30. Tray interaction rules: remove from the end, taken-away row, tap-to-count, and a spoken plate count.**
What: (a) Removal always takes the last filled cell, whichever item she taps (the tapped item still flies away). This amends D5's "removal leaves holes". (b) For missing-subtrahend forms (A3 `10 − ? = a`, A4) the removed items stay in a small "taken away" row so the unknown stays visible; CountTogether and demos point at it. (c) In add mode, tapping a placed item hops it and says its position number; removal there is by dragging it to the bin or a single "take one back" button. In remove mode, tapping still removes. (d) After a wrong serve the monster first counts her plate aloud ("I see seven… I wanted eight. One more!"), then the model bubble plays; no red X or buzzer. (e) `frames1` capacity is 10 (`frames2`: 20), with the same bin wobble. (f) Ticket colors follow the tray: blue = prefilled/locked group, orange = the group she adds or removes, green = result; not by operand position.
Why: scattered holes break the five-wall subitizing and the back-through-ten demo; young children count by touching; the removed amount is the answer in `7 − ? = 5`; the feedback should name what she actually served.
How to revisit: PLAYTEST adds "does she count by touching?". The taken-away slot and the CountTogether bubble width are checked in the M1 layout mock (D36).

**D31. Coins are recorded per completed problem; requeues bring back the same monster.**
What: a small `coin` event is written in the same transaction as each completed problem (including the D26 warm-up order). `serviceEnd` carries only the service tip. Totals dedupe by event id. A requeued problem is the same monster returning ("Blobbo's back — still hungry!") and pays the usual 3 coins, so a service with requeues can pay up to 6 over the 23 base.
Why: coins were summed from `serviceEnd` per distinct service id, so a resumed service silently lost one set, and an app killed mid-service lost coins she had seen fly into the jar.
Consequence: a new event type, so the event shape is frozen in M1 (D36); amends D6/D15's wording on where coins live (still "in events, never recomputed").
How to revisit: if per-problem events are too chatty, batch them per service with a resume-safe id.

**D32. The S0 number pad is one row of digits.**
What: ten digit buttons 0–9 in order, one answer display that always accepts up to two digits, and a backspace. No separate tens/ones slots.
Why: the 3×4 keypad with 120 px buttons needs about 500 px of height against about 390 available, and tens|ones slots reveal whether the answer is above nine. An ordered digit row doubles as a small number line.
How to revisit: if buttons feel cramped on the phone, shrink within the 56 px minimum before changing the layout.

**D33. Allowance ending is predictable (only when the limit is enabled, D27).**
What: (a) "Last customer": when remaining time falls below about one order's length (tuned in playtest), waiting silhouettes wave and leave and the current monster is announced as the last one; no full new service starts when less than about half a service remains (a shorter one is offered). (b) The +5 tip is paid when the allowance closes the café mid-service, but not for a voluntary early exit or Take a break. Supersedes the former OPEN_ITEMS #8 "no tip on a partial service" default for this case (that item is now #7 after the renumbering). (c) The 60 s cue is the lights dimming and Pip yawning; the door sign never animates. (d) At the 90 s grace cap the monster eats happily and leaves, no `attempt` is recorded, the fact's box is unchanged, and a pending requeue is dropped without a box reset. (e) After about 20 s idle the spoken ticket repeats once per order (all stages; spoken only). (f) The "Continue dinner service?" offer is used everywhere (no silent resume) and is not shown while the café is locked; it appears after a parent unlocks.
Why: a service of 8–10 minutes against a 15-minute allowance would otherwise be cut off abruptly almost every time; closing time is not her choice and a time cutoff must never count against her.
How to revisit: the thresholds are constants in `engine/config.ts`; measure real service length at the M2 playtest (OPEN_ITEMS #7).

**D34. Addition-only start-unknown forms (`? + a = c`) stay in v1.**
What: A3 `? + a = 10` and A4 `? + a = c` remain in the pools (A3 = 36, A4 = 135). This amends D1(d): only the subtraction start-unknown form (`? − 3 = 5`) and the harder word-problem structures stay in the backlog. The Mystery Orders example becomes `? − 3 = 5`.
Why: `? + a = c` is a commuted missing addend (`a + ? = c`), not a new structure.
How to revisit: drop the forms and update the pool counts (A3 → 27, A4 → 90) if she finds them confusing.

**D35. Foods must be one obvious unit: 🍒 and 🥞 are replaced.**
What: 🍒 (two cherries) and 🥞 (a stack) leave the allowlist; 🍌 banana and 🍊 tangerine (Unicode 6.0) are added. Mimsy's favorites become 🍞 / 🍊 and Wobbleton's 🍦 / 🍌. Update SPEC §7.1/§7.2 and `scripts/emoji-versions.json`.
Why: "seven cherries" on screen would be fourteen cherries to a counting child.
How to revisit: swap any food; the allowlist is data, and `lint:content` enforces it.

**D36. Tier 1 scope and sequencing changes.**
What: (a) M3 is split into M3a (event log, replay, fact boxes, per-skill stage/operations settings, resume) and M3b (optional play-time limit and lock, parent gate and parent area, export/reset/import), each with its own playtest stop. (b) Migrations: ship `schemaVersion: 1` with an empty migration list and its test harness; the first real migration is written at the first schema change, after which the CLAUDE.md rule applies as written. One snapshot in Tier 1; rotation later. (c) M1 e2e proves tap in landscape on Chromium plus one WebKit iPad project, with `toStageCoords` unit-tested for portrait; the full device matrix and CDP drag in rotated portrait move to M2. (d) The `attempt` and `coin` event shapes (D29, D31) are fixed in M1. (e) M2 monsters are six hand-authored SVGs with expression variants (idle, delight, eat, puzzled, sleepy); the `MonsterSpec` data shape stays so art can be swapped or made procedural. (f) The easy-reader word-list lint is dropped; no word list is committed and child-facing text stays minimal by convention. (g) The first M1 step is a static layout mock (1194×834 and 844×390) that the owner approves before any interaction is built.
Why: the Tier 1 estimate was optimistic, and the cuts remove work that only protects later milestones without changing what she plays.
Consequence: the Tier 1 hour estimate is redone in `PLAN.md` (D20/D22 figures are not authoritative any more).
How to revisit: reinstate any item when its protection is needed (first schema change, first need for a word list).

**D37. Platform baseline and known platform risks.**
What: baseline iOS 15.4+ and a recent Chrome on Android; `navigator.audioSession` (iOS 17+) is a progressive enhancement. The owner's actual device list was not provided (OPEN_ITEMS "Device details" stays open). Platform risks go in `PLAN.md`: CSP emitted in production builds only with `assetsInlineLimit: 0`; the back-guard history entry is pushed from inside a tap (amends D19); the export file is shared via `canShare` with a text/plain or download fallback and a permissive `accept` on iOS; speech timeout about `clamp(1200, 400 + 90·chars/rate, 8000)`, tuned on the iPad; Noto Color Emoji in the e2e environment (emoji appearance is judged on real devices only); the 4× CPU-throttle check is a report, not a gate; "installs to Home Screen" is an owner check in PLAYTEST, not agent acceptance. Also decided: `?debug` query flag for the debug screen (production builds too), SHA-256 via SubtleCrypto for the export checksum, a README/PLAYTEST note to install to the Home Screen before first play (no detection code), and the Service screen uses the decorated café so purchases show while she plays.
Why: the old "iOS 14+" target conflicts with `100dvh` and `crypto.randomUUID`; these are known traps that are cheaper to plan for than to discover.
How to revisit: raise or lower the baseline once real devices are listed.

**D38. Family details are generalized in the public repo.**
What: current files say "the child", "a younger sibling" and "a parent's phone" instead of ages, sexes, school grade and who owns which device; D9, D16, OPEN_ITEMS, SPEC §4.2/§15, CLAUDE.md and README are reworded accordingly, keeping the design-relevant content (known facts, level) in generic terms. Git history already contains the old wording and is not rewritten.
Why: the repo is public (D14) and the docs described the owner's children.
How to revisit: scrubbing history is a separate, destructive step the owner would have to ask for explicitly.

Also decided in the walk-through without a separate entry (plain corrections or wording; see the log): FollowMe now pulses the bell and she presses it; the spoken ticket includes the food and "please"; the `+0` known toggle is removed; the "spaced practice" claim is softened; median S0 response time joins the Tier 2 Progress tab; tidy-ups C3–C5, C8, C10, C12–C14; garnish choice and monster album are Tier 2 backlog ideas; naming the monsters is deferred (placeholders through M2); diagnostic S2 and "take away" wording were rejected.

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
- (i) *D38 scope*: neutral wording ("the child", "they") in SPEC, OPEN_ITEMS, CLAUDE.md, README, KICKOFF and D9/D16. Other DECISIONS entries and SPEC_REVIEW.md keep their original wording (git history is not rewritten either).
- (j) *Housekeeping*: OPEN_ITEMS is renumbered (C14; old #3→#2 … #12→#10) and the former #10 moved to its resolved table; SPEC_REVIEW.md keeps the old numbers and says so. The export `checksum` covers the serialized `events` and `settings`. `scripts/emoji-versions.json` does not exist yet (no code); it is created with `lint:content` using the D35 allowlist.
Why: each of these closes a gap that D29–D38 left open, with the smallest rule that keeps the decided behavior intact.
How to revisit: all are spec text and `engine/config.ts` constants; change the spec line and add a decision that supersedes the item above.

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
| 25 | Her known +0/+1/doubles would make A1 and early A2 boring | Known preset (D16). The draft's assumed-known A0/A1 and Chef's Pick start were removed, D22/D28 |

### Round 3 review (play allowance and tiers)

| # | Finding | Fix |
|---|---|---|
| 26 | Both earlier timer readings let the child restart her way to endless play | Persistent lock until the parent gate acts (D7) |
| 27 | Wall-clock subtraction would let a clock change refund time; killing the app mid-interval would lose it | Monotonic active-time accumulator flushed every 5 s |
| 28 | Leaving the app open and walking away would burn the allowance | 90 s idle pause |
| 29 | Locking mid-monster would be abrupt, and a dawdling child could stall forever | Finish current monster with a 90 s hard cap |
| 30 | The shop is also play time; leaving it unmetered would defeat the lock | All child-facing screens count |
| 31 | Allowances are per device, so another device is a loophole | Documented honestly (SPEC §6.4); Guided Access / Screen Pinning suggested |
| 32 | Tier 1 without a shop gives coins nothing to do | Coins accrue as events and show in the jar; shop is the first Tier 2 item |
| 33 | Default of "no timer" contradicts the hand-off goal | Default was 15 minutes; **superseded by D27: off by default, parent opts in** |

### Residual risks the review could not close (need real devices or playtest)
- iOS Safari TTS quality/latency and `onend` reliability, silent switch behavior, audio after backgrounding.
- Whether the explicit bell press is discoverable to her unaided (tutorial mitigates).
- Whether FollowMe feels tedious after wrong-wrong (steps capped at 10; tune in playtest).
- Estimate risk: M1 and M2 are the densest; the Tier 1 estimate (target ≈ 10 h, redone in PLAN.md per D36) has no slack. Expect M1 to run over if drag, TTS, and demos all land at once.
