# Decisions

Each entry: what was decided, why, how to revisit. D1–D14 were made during design (departures from the original proposal and resolved gaps). Round 2 added D15–D19; round 3 (owner clarifications on hours, the play allowance and story tickets) added D20–D21 and rewrote D7. Round 4 (owner: pick the skill instead of automatic leveling) added D22–D26 and amended D3, D6, D13, D16, D20. Claude Code continues from D27.

**D1. Ladder re-cut into two open tracks.**
Changes: (a) "within 10" split into A1 within 5 and A2 within 10 (a 5-year-old's within-5 and within-10 are very different jobs; pools of 20 and 70); (b) added A0 Count It Out (tray tutorial and numeral/quantity base); (c) added A6 teens ± ones without crossing, between teen numbers and bridging (the jump from 10+4 to 8+5 is otherwise too big); (d) "missing amounts" kept at A4 for missing addend/subtrahend within 10, but start-unknown (`? + 3 = 8`, `? − 3 = 5`) moved to backlog because it is the hardest word-problem structure; (e) comparing moved out of the "stretch" tail into its own P2 tile (it is a Kindergarten skill; still low priority because she likely does it in school); (f) tens work (B1/B2) is a separate track that does not depend on bridging, so a strong counter can do 30+20 before wrestling with 8+5; (g) no locks. Chef's Pick recommends; every tile is open.
Revisit: if she stalls at a skill, hide or reorder in the parent Skills tab; ladder order is data in `engine/skills.ts`.

**D2. The response is "build the answer", not "tap the food with the right number".**
Numbered choices are guessable and train numeral matching rather than quantity. Primary response is building the answer on the tray (S3–S1); numeral entry is the abstract end state (S0). Numbers on food are only counting cues.

**D3. Four support stages per skill (concrete → abstract fading).**
S3 guided, S2 prefilled, S1 build-the-answer from empty, S0 numeral. Moves automatically from first-try accuracy (6-attempt window, fast-track for strong starts) and can be overridden by the parent. Rationale: the ten-frame is a scaffold, not the goal; without fading it becomes a crutch and the game never tests recall.
*Amended by D22/D23: stages remain, but in v1 the parent sets them per skill; automatic promotion/demotion/fast-track is milestone M12.*

**D4. Serving is an explicit bell press; no auto-serve.**
Auto-serve on the correct count turns the game into "add until it dings".

**D5. Canonical tray placement.**
Items always take the first empty cell; drops anywhere on the tray work; removal leaves holes. Keeps counting consistent and removes "which cell" errors; makes "fill the ten first" automatic for bridging.

**D6. Flat effort coins.**
3 per monster, 5 per completed service, 10 once per hat. Not tied to correctness or speed. Accuracy is tracked for adaptation and the parent, not rewarded in currency.
*Amended by D25: the +10 per hat is deferred with hats (M12); a 6-monster service pays 23 coins.*

**D7. Play allowance with a parent-only unlock (owner clarification).**
Intent: hand her the device and know she can play for a defined period, not endlessly, without parent intervention to extend. Implemented as an allowance of active play time per device (none/5/10/15/20, default 15) that is not reset by closing the app or starting another service. At zero the current monster finishes, Results plays, and the café locks persistently; only the parent gate can Start new session or Add time (optional auto-refill modes exist but default is parent-only). Never a visible countdown. Two earlier readings (daily cap, then per-service limit) were wrong. Known limits: per device, and clearing site data resets it (SPEC §6.4). No "max services per day" setting (owner declined).

**D8. One landscape layout; portrait renders the stage rotated 90°.**
Owner wants the game to look landscape immediately and only require turning the device. iOS cannot force orientation, so in portrait the stage is CSS-rotated to fill the screen; physically turning the device (counter-clockwise) makes it upright, and the transform drops when the OS rotates. Works under iOS rotation lock. Installed Android PWAs are locked to landscape by the manifest. Cost: all pointer math must use one inverse-transform helper (`toStageCoords`). Replaces an earlier "turn me sideways" overlay.

**D9. Single child profile now (older daughter, 5½); `profileId` reserved; profiles are milestone M9.**
The 2½-year-old is not a target user in v1. A later profile could be limited to A0 with 1–5 via the known-facts/hidden-skills mechanisms (est. 1.5–2 h).

**D10. Foods are Unicode ≤ 9.0 emoji (allowlist); ten-packs and monsters are custom SVG.**
Renders on older tablets. Emoji are HTML-positioned, not SVG text. A swap-in SVG food path exists per food id.

**D11. No zero answers in tray stages.**
Bell is disabled when the tray is unchanged; a zero result at S1 would deadlock. Zero is deferred to a dedicated lesson.

**D12. PWA update policy: prompt + silent activation at Home.**
`autoUpdate` reloads the page under a playing child.

**D13. Hat criteria.**
Hats 1–2 reflect stage reached; hat 3 requires 90% on the last 12 S0 attempts and min(30, 70%) of canonical facts at box ≥ 2 (a flat 70% of pool is unreachable for large pools).
*Deferred to M12 by D25; the criteria stand for when hats return.*

**D14. Hosting: GitHub Pages (owner decision).**
Public repo on the free plan (code and docs public, no personal data). Deployed by a GitHub Actions workflow; Claude Code never pushes unprompted. Installable PWA is a storage-safety requirement on iOS (installed apps are exempt from the 7-day eviction of script-writable storage). Pages sends `max-age=600`, so updates can lag up to 10 minutes.

**D15. Progress is an event log that merges across devices.**
She will play on an iPad, an iPhone and an Android phone, with no backend. Local-only state would fork per device, so progress is an append-only event log; derived state is a pure replay; devices sync by exporting a file and **merging** (union by event id) on another device. Coins are carried in events (never recomputed), so merges cannot lower earned coins; duplicate hat/buy/serviceEnd events count once. Settings (voice, volume, limits) stay per device. Cost ≈ +1 h in M3 versus plain snapshots; benefit: backup, sync and migrations all become the same mechanism. Revisit: if the owner decides one device is canonical, merge becomes optional but the log stays.

**D16. Starting state from the owner's report.**
Age 5½, Grade 1 first semester; knows +0, +1 and doubles (1+1 … 9+9) from flash cards. Those facts start at box 3; A0 is assumed-known; Chef's Pick starts at A1 (short diagnostic, fast-track moves her on); she can solve take-away word problems but is still learning number sentences with sums under ten, so symbolic subtraction is treated as new. The spec's earlier claim that she would "live in A0–A5" was revised: A2–A8 is this school year's curriculum, B1–B2 likely second semester (hence the Big Menu is bonus work, M8). Editable in Parent → Skills → Starting point.
*Amended by D22: Chef's Pick, the A1 "diagnostic" and assumed-known skills are gone in v1. What remains of the preset: the known addition facts start at box 3 (less frequent), every skill starts at S3, and the first-run menu highlights A1.*

**D17. Near-doubles and 9+x are the first strategies for new facts.**
They build on her known doubles and +1. `nearDouble` strategy tag and demo; A2 and A7 difficulty ordering lead with them.

**D18. Same-origin hygiene on GitHub Pages.**
`<user>.github.io` is one origin for all of the owner's Pages projects, so IndexedDB, caches and any `localStorage` are namespaced `ncmc`, and reset/cleanup code may only touch `ncmc*`. Enforced by ESLint and a unit test.

**D19. Back guard.**
Android back gesture and iOS Safari edge-swipe would otherwise exit the game mid-service; both open the "Take a break?" dialog instead.

**D20. Build tiers instead of an hour cap (owner decision).**
The earlier "≈ 20 h" was only a scoping device. Tier 1 = a playable game in ≈ 10.5 h (M0–M3: foundations, core loop with A1–A2, café service with A3, hand-off-ready persistence + play allowance + minimal parent area). Tier 2 = bonus features M4–M11 in any order, no upper limit. *Amended by D22: Tier 1 is now ≈ 10 h (M2 ≈ 3.25, M3 ≈ 1.5).* Consequence: Tier 1 has no shop (coins accrue and show in the jar), no multi-device merge UI (the event log exists), and only A1–A3, which matches her current book.

**D21. Story tickets (word-problem phrasing of each order) declined by the owner.**
Considered: template-driven one-sentence stories beside the equation, to bridge her take-away word-problem skill to number sentences (risks: reading load blurring the mastery signal, keyword shortcuts). Removed from the spec; M6 number left unused. Revisit if she stalls on missing-addend or take-away sentences.

**D22. The owner picks the skill; automatic leveling is an optional late milestone (M12).**
What: every play session starts at the menu board. She or a parent picks a skill tile; "Another service" on Results repeats the same skill by default; "Change dish" returns to the menu. Removed from v1: Chef's Pick (frontier, composition, review slots), cross-skill 20% review, stage promotion/demotion/fast-track, mastery hats and their +10 coins, assumed-known skills. Kept: fact boxes as sampling weights (misses return sooner inside the chosen skill), requeue within a service, and the full attempt log. The menu is the first thing after Home ("Open the Café" opens it); the tile played last glows, A1 on first run.
Why: the owner knows where she is in the curriculum and wants to direct practice. The design review found that the automatic path was unpredictable for a first-time player: fast-track after one 6/6 service at S3 (where the prefilled tray and spoken counting make success near-automatic) would jump A1 to S1 and award two hats in about five minutes; the add/sub balance rule forced known facts into half of the first A1 orders; Chef's Pick had no review material on day one.
How to revisit: M12 (SPEC §14) builds the adaptive layer on top. Because attempts are logged with skill, stage and outcome, M12 can derive stages from existing history. M12 notes list the review findings it must address.

**D23. Stage is a fixed per-skill parent setting (default S3), stored as a `skillConfig` event.**
What: Parent → Skills lists each skill with a stage selector (S3–S0), applied from the next service. It replaces the `stageOverride` event with `skillConfig {skill, stage, ops}`, last writer per skill wins, so it syncs through merge (unlike per-device settings) and is not lost on a fresh device. Default S3 for every skill, A0 included.
Also fixes an inconsistency in the draft: requeue was written as "stage−1 (min S3)", but S3 is the *most* supported stage, so one step more support means S0→S1→S2→S3 (S3 stays). Requeued facts therefore get one step more support within the service.
Why: the scaffold must be adjustable without automatic movement, and the parent is the one who knows when to fade it.
How to revisit: if the parent wants it per device, move it to the `settings` store; if changing it is frequent, surface it on the menu board (parent-gated).

**D24. Per-skill operation filter: both / addition only / subtraction only.**
What: a parent setting in `skillConfig.ops`, shown only for skills with both operations (A1, A2, A5, A6, B1, B2). The session pool is restricted to the allowed forms; the menu tile's sample sentence matches. The ±1 add/sub balance rule applies only when `ops` is `both`.
Why: A1 addition is almost entirely known (5 of 6 canonical addition facts are in her preset; only 2+3 is new) while all 10 subtraction facts are new, so a mixed A1 spends about half its orders on facts she knows. Subtraction only is the likely setting.
Consequence: A1 with subtraction only has 10 canonical facts; a 15-minute allowance (2–3 services) repeats each about twice, which is practice, not a defect. The pool-size guard still prevents adjacent repeats.
How to revisit: the focus list (M7) can express the same thing per fact.

**D25. Hats and the hat coin bonus are deferred to M12.**
What: no hats on tiles, in Results or the Progress tab; no +10 coins. The `hat` event type is reserved. The hat SFX is used from M12.
Why: hats measured mastery-driven stage progress, which v1 no longer has, and the owner considers them an extra progression mechanic that is not needed for quite a while.
How to revisit: M12. Criteria D13 stand. If a sense of progress on the tiles is missed in playtest, a simple effort-based marker (services completed per skill) is the cheapest substitute.

**D26. First-ever service starts with a fixed warm-up order.**
What: once per device (flag in `meta`), before the chosen skill's orders, one order `2 + 1` with cookies on one ten-frame at S3, whatever skill was picked. A ghost hand taps the bin once after 4 s idle; after the item lands and 4 more idle seconds it hovers over the bell. The bell press is always hers. It pays the usual 3 coins and writes no `attempt` event, so it cannot affect weights or stats.
Why: the draft's scripted gesture ("tap bin once, then bell once") only works for an `n + 1` fact, and the skill is now arbitrary. A scripted ghost bell tap would also be an auto-serve, which the invariants forbid.
How to revisit: if she does not need a warm-up (older player, profile M11), drop it; it is one flag.

**D27 onward:** reserved for Claude Code.

---

## Adversarial review log (what the self-review found in the first draft, all fixed in SPEC.md)
(Rows 8 and 10 describe draft-1 mechanisms later superseded by D7 and D8; the underlying concerns are still covered.)

| # | Finding | Fix |
|---|---|---|
| 1 | Zero-result facts (e.g. 5−5) deadlock at S1: empty tray equals start state, bell disabled | D11; zero excluded, A1 pool 24 → 20 |
| 2 | `autoUpdate` PWA would reload the page mid-service | D12; `prompt` registration, e2e test |
| 3 | Hat 3 "70% of the pool" unreachable for B2 (684 facts) | D13 |
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
| 16 | A hat earned independently on two devices would pay +10 twice after a merge; same for `serviceEnd` and duplicate purchases | Earned coins dedupe by (skill, n) / svc id; spent counts distinct items |
| 17 | Replay-derived coin totals could shrink after a merge, violating "nothing is taken away" | Coin amounts are stored in events, not recomputed |
| 18 | Per-device sequence numbers in event ids can collide after a restore | Random UUID ids |
| 19 | Seeding known facts as events would double-seed two fresh devices | Preset applied implicitly before replay |
| 20 | GitHub Pages shares one origin across the owner's other apps: storage and cache cleanup could touch them | `ncmc` prefix everywhere; ESLint + test (D18) |
| 21 | Rotated portrait stage breaks raw `clientX/Y` drag math | Single `toStageCoords`, unit and e2e tests |
| 22 | Android back gesture exits the PWA mid-service | Back guard (D19) |
| 23 | Per-service clock would reset on reload | Persisted in the `resume` snapshot |
| 24 | Voice settings differ between iOS and Android; syncing settings would break one of them | Settings are per device; optional copy on import |
| 25 | Her known +0/+1/doubles would make A1 and early A2 boring | Known preset, assumed-known A0/A1, Chef's Pick starts at A2 (D16) |

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
| 33 | Default of "no timer" contradicts the hand-off goal | Default is 15 minutes |

### Residual risks the review could not close (need real devices or playtest)
- iOS Safari TTS quality/latency and `onend` reliability, silent switch behavior, audio after backgrounding.
- Whether the explicit bell press is discoverable to her unaided (tutorial mitigates).
- Whether FollowMe feels tedious after wrong-wrong (steps capped at 10; tune in playtest).
- Whether 6-attempt windows promote too fast/slow (constants in `engine/config.ts`). Deferred to M12 (D22).
- Estimate risk: M1 and M2 are the densest; the 20 h figure has no slack. Expect M1 to run over if drag, TTS, and demos all land at once.
