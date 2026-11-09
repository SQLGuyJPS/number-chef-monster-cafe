# Decisions — index

`docs/SPEC.md` is the single statement of the current design; every live decision is folded into it and cited there as `(Dn)`. This file is only an index: one line per decision with where it lives now. The full text of each entry (What / Why / How to revisit, amendments, review logs) is in `docs/archive/DECISIONS_LOG.md`; read an entry there by its number only when you need the full reasoning.

**Status:** *SPEC §x* = live, stated in that section · *Partly superseded* = live in SPEC, but parts were replaced by the decision named · *Implementation only* = toolchain, tests, CI or code structure; not design, so not in SPEC · *Superseded* = replaced entirely by the decision named; not in SPEC · *Removed* = the feature no longer exists; do not flag its absence.

**Adding a decision:** number it one higher than the highest D below; append the full entry (What, Why, How to revisit) to `docs/archive/DECISIONS_LOG.md`; add one line here; **and update SPEC.md in the same commit**, citing `(Dn)`. When a decision replaces an earlier one, update that line's status here too.

| D | Title | Status | Why (one line) |
|---|---|---|---|
| D1 | Ladder re-cut into two open tracks (A0–A8, B1–B4) | SPEC §1.2 | Within-5 vs within-10 and teens needed their own steps; tens track independent of bridging |
| D2 | Respond by building the answer, not tapping a numbered food | SPEC §1.4 | Numbered choices are guessable and train numeral matching |
| D3 | Four support stages S3–S0 per skill | SPEC §3.2 | The frame is a scaffold that must fade to recall |
| D4 | Serving is an explicit bell press | SPEC §1.3, §3.3 | Auto-serve becomes "add until it dings" |
| D5 | Canonical tray placement (first empty cell) | SPEC §3.3; partly superseded by D30 | Consistent counting; "fill the ten first" for free |
| D6 | Flat effort coins (3 per monster, 5 tip) | SPEC §9; amended by D31 | Reward effort, not accuracy or speed |
| D7 | Play allowance with parent-only unlock | SPEC §6 | Hand over the device for a defined period without nagging |
| D8 | One landscape layout; portrait rotates the stage | SPEC §2.2 | iOS cannot lock orientation; looks landscape at once |
| D9 | Single profile now; profiles in M11 | SPEC §11.3, §14 | A sibling is not a v1 user |
| D10 | Unicode ≤ 9 emoji foods; SVG packs and monsters | SPEC §7.1 | Renders on older tablets |
| D11 | No zero answers in tray stages | SPEC §4 | An empty-tray answer deadlocks the bell |
| D12 | PWA update by prompt + silent activation | SPEC §2, §15 | `autoUpdate` reloads under a playing child |
| D13 | Chef hat criteria | Removed (D28) | Hats no longer exist |
| D14 | Hosting on GitHub Pages | SPEC §15, §11.4 | Owner choice; installed PWA avoids iOS eviction |
| D15 | Progress is a mergeable event log | SPEC §11.1 | Several devices, no backend |
| D16 | Starting state from the owner's report | SPEC §4.2; amended by D43, D83 | Known +1/doubles come up less often |
| D17 | Near-doubles and 9+x are the first strategies | SPEC §1.1, §4 | Build on known doubles and +1 |
| D18 | `ncmc` namespacing on the shared Pages origin | SPEC §11.5 | Never touch the owner's other apps' storage |
| D19 | Back guard opens "Take a break?" | SPEC §2.3; amended by D37, D46 | Back gestures would exit mid-service |
| D20 | Build tiers instead of an hour cap | SPEC §0, §14; amended by D36, D44 | Playable game first, bonus work after |
| D21 | Story tickets declined (M6 unused) | SPEC §0, §14 | Reading load; keyword shortcuts |
| D22 | The owner picks the skill; no automatic leveling | SPEC §1.2, §4.1 | Owner directs practice; automatic path was unpredictable |
| D23 | Stage is a per-skill parent setting (`skillConfig`) | SPEC §3.2, §11.2 | Adjustable scaffold that syncs through merge |
| D24 | Per-skill operations filter | SPEC §4.1, §12; amended by D43 | A1 addition is mostly known |
| D25 | Chef hats and hat coins | Removed (D28) | Extra progression not needed |
| D26 | First-ever service starts with a warm-up order | SPEC §5.4 | Teach bin and bell without auto-serving |
| D27 | Play-time limit optional, off by default | SPEC §6 | A deliberate hand-off tool, never on by surprise |
| D28 | Automatic leveling, Chef's Pick and chef hats removed from the docs | Removed | Dormant mechanics kept causing reports; full rules in git history |
| D29 | Boxes move only on S1/S0 first tries; four outcomes; ≤ 3 new facts | SPEC §3.4, §4.1, §4.2; flow amended by D89 | Success at S3/S2 says little about recall |
| D30 | Remove from the end; taken-away row; PlateCount; role colors | SPEC §3.3, §5.4, §5.5; tap-to-count superseded by D82 | Holes break subitizing; feedback names what was served |
| D31 | Coins recorded per problem; requeue = same monster | SPEC §9, §11.2; amended by D40 | Resumed or killed services lost coins |
| D32 | S0 pad is one row of digits | SPEC §5.4 | Fits the height; slots would leak the answer size |
| D33 | Allowance ending is predictable (last customer, tip, cue, grace) | SPEC §6.2; idle repeat superseded by D81, resume by D40 | Avoid abrupt cutoffs; never count time against the child |
| D34 | `? + a = c` stays in A3/A4 | SPEC §1.2, §4 | It is a commuted missing addend |
| D35 | Foods must be one obvious unit (no 🍒 🥞) | SPEC §7.1 | Two cherries would be counted as two |
| D36 | Tier 1 scope: M3a/M3b split, migrations harness, layout mock first | SPEC §11.3, §13.5, §14 | Estimate was optimistic |
| D37 | Platform baseline iOS 15.4+ and known platform risks | SPEC §0, §2, §2.3, §8.1, §11.4, §11.6 | Known traps are cheaper planned than found |
| D38 | Family details generalized in the public repo | SPEC §15 | The repo is public |
| D39 | Assumptions applying D29–D38 (event shapes, guard, PlateCount, colors) | SPEC §4.1, §5.5, §6.2, §11.2; take-one-back superseded by D82, resume window by D40 | Close gaps with the smallest rule |
| D40 | Lock clears resume; lock outside a service; grace cutoff pays nothing | SPEC §5.8, §6.2 | The post-unlock offer could never fire; missing cases |
| D41 | S0 help path on the cloche tray | SPEC §5.4, §5.5 | S0 has no tray for demos |
| D42 | Put back in remove mode; demo wording; non-blocking flights | SPEC §2.3, §3.3, §5.5 | Undo for over-removal; fast taps must count |
| D43 | Session builder data: requeue window, balance targets, stored plan | SPEC §4.1, §4.2, §11.6 | Requeues broke the window; resume diverged |
| D44 | Replace-only import in M3b, Reset, debug picker, guide not cap | SPEC §11.6, §12, §14 | A backup with no restore protects nothing |
| D45 | Bigger reaction after a first-try serve | SPEC §5.6 | Owner wants the delight; visual only |
| D46 | Exits and back guard on every child screen | SPEC §2.3, §5.4 | Results and Shop were unguarded |
| D47 | Tier 2 fixes, naming and housekeeping | SPEC §1.2, §3.3, §6.4, §11.3, §12, §14 | Contradictions found in the second review |
| D48 | S0 number pad lives in the tray band | SPEC §5.4; geometry by D62 | Ten 112 px buttons don't fit beside the hat and bell |
| D49 | Playwright pinned to 1.63.0; WebKit in the cloud setup | Implementation only | Match the pre-installed browsers |
| D50 | `factKey` scheme for missing-amount forms | SPEC §3.1, §4 | Persisted identifier needed a rule |
| D51 | Coins stay in memory until M3a | SPEC §11.2, §14 | Persistence is M3a's job |
| D52 | `?debug` picker stored under `debugSkillConfig` | Implementation only | Per-device home before the event log |
| D53 | Home gear inert before M3a | Superseded by D94 | No target yet |
| D54 | Waiting service worker activates on cold launch or 30 s Home idle | SPEC §2, §15 | "When idle" had no threshold |
| D55 | Results tally by ones to ten, then fives, to the exact total | SPEC §5.7 | End point was unspecified |
| D56 | Tap-to-skip exempt from the eat lock | SPEC §2.3, §5.6 | Skip must work during eating |
| D57 | Tier 1 renders only `frames1`; model supports `frames2` | SPEC §3.3 | A1–A3 never exceed 10 |
| D58 | Service worker registered from app code | Implementation only | Inline script blocked by CSP |
| D59 | Dev-only dependencies beyond SPEC §2 | Implementation only | Tooling the spec implies |
| D60 | Toolchain versions (TS 6.0, ESLint 9, …) | Implementation only | `typescript-eslint` support |
| D61 | M0 test and tooling assumptions | Implementation only, except (f) turn cue → SPEC §2.2 | Gaps between spec and tools |
| D62 | M1 layout geometry (S0 rows, taken-away grid, ring colors, cloche) | SPEC §3.3, §5.4; partly superseded by D63–D65, D73, D82, D84 | Bands could not hold 112 px buttons |
| D63 | Owner mock review: line by the door, bin centred, row and lid left | SPEC §5.4; ticket/bell/bubble superseded by D64, D65, D84 | Problem centred above the tray |
| D64 | Bell in the bottom band next to the bin; two-frame tray centred | SPEC §5.4; monster/bubble superseded by D65, D84 | Bell belongs by the basket |
| D65 | Monster centred, ticket right beside it, slides right for the bubble | SPEC §5.4; bubble superseded by D84 | Off-centre monster felt wrong |
| D66 | M1 stand-in service (uniform plan, "Yum!", back to menu) | SPEC §14 (M1) | Builder, eating and Results are M2/M3a |
| D67 | S0 Peek marks Help without CountTogether or advancing | SPEC §3.4, §5.4; flow after a miss by D89 | Peek shows a model, not the script |
| D68 | CountTogether details (bell off while counting, bubble stays, count back) | SPEC §5.5 | §5.5 left these open |
| D69 | `TrayTask` refinement for S0 (`expected.typed`) | SPEC §3.1 | S0 needs both the typed answer and a tray |
| D70 | Caption slot; captions ≤ 8 words, ticket lines ≤ 12 | SPEC §13.2; slot superseded by D76 | Mock had no caption slot |
| D71 | Worked/FollowMe always on the S3 tray; FollowMe ends right | SPEC §5.5; take-back cue superseded by D82 | No strategy visible on an empty tray |
| D72 | A1/A2 strategy tags, difficulty and doubles wording | SPEC §4, §5.5 | Mapping was unspecified; caption limit |
| D73 | Layout mock removed; service controller is a plain class | Implementation only; controller noted in SPEC §2 | Avoid a drifting second layout; hooks lint |
| D74 | CI actions on current majors | Implementation only | Node 20 deprecation |
| D75 | A tap's count cuts off the previous count | SPEC §3.3, §8.1, §8.2 | Counts went silent on quick taps |
| D76 | Caption bubble beside the monster with a tail | SPEC §5.4; Pip's lines by D90 | Caption read as nobody's speech |
| D77 | Commas dropped from spoken text only | SPEC §8.2, §5.5 | Engines pause on commas like full stops |
| D78 | Playable tiles solid, unplayable dashed | SPEC §5.3; glow superseded by D83 | Dashed looked disabled |
| D79 | Fuller two-row bin heap | SPEC §5.4; layout by D85 | Items clipped, heap sparse |
| D80 | WebKit e2e runs locally too | Implementation only | Cloud-only note was a misreading |
| D81 | The order is not re-spoken on idle | SPEC §5.4 | The repeat annoyed the child |
| D82 | Tapping an item always sends one back; no take-one-back button | SPEC §3.3, §5.4 | One meaning for a tap everywhere |
| D83 | No last-played glow or first-run highlight on the menu | SPEC §1.2, §5.3 | The highlight confused the child |
| D84 | CountTogether: monster left of a larger bubble | SPEC §5.5 | Bubble unreadable on the iPhone |
| D85 | Bin items placed by their centres | SPEC §5.4 | Apple emoji bunched in the middle |
| D86 | Bell rings before the monster speaks; SFX wait for audio resume | SPEC §5.6, §8.1 | iOS swallowed the ding and tones |
| D87 | Stuck audio context rebuilt on tap; debug sound test | SPEC §2.2, §8.1, §8.3 | iOS WebAudio stuck after speech |
| D88 | Building cuts the order; no audio rebuild during speech; line retry | SPEC §5.4, §8.1 | Rebuilds stole the audio session; eager child |
| D89 | First miss names the number; second offers help; third demos | SPEC §1.1, §3.4, §5.5 | One slip needs no long interruption |
| D90 | Pip is the visible helper (placeholder Pip, own voice and caption) | SPEC §5.4, §5.5, §7.3 | "Want Pip to help?" named someone who never helped |
| D91 | A tap gets a count or a tone; Pip steps back slowly; line waits | SPEC §1.4, §3.2, §3.3, §5.4, §7.3, §8.3; move time amended by D93 | Tones stepped on counts; hand-off felt abrupt |
| D92 | Decisions folded into SPEC; DECISIONS becomes an index; finished docs archived | This file; SPEC header; CLAUDE.md | Context cost and SPEC/DECISIONS contradictions |
| D93 | Monster's move between spots is 550 ms | SPEC §7.3 | Code and D91 text disagreed; owner confirmed 550 ms |
| D94 | Home gear opens playtest tools before M3a (long-press 2 s, no gate) | SPEC §2.2, §5.2, §12, §14 | Installed app can't open `?debug`; iOS storage is per app |
