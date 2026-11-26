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
| D10 | Unicode ≤ 9 emoji foods; SVG packs and monsters | Partly superseded by D111 (limit now Unicode ≤ 15.0) | Renders on older tablets |
| D11 | No zero answers in tray stages | SPEC §4 | An empty-tray answer deadlocks the bell |
| D12 | PWA update by prompt + silent activation | SPEC §2, §15 | `autoUpdate` reloads under a playing child |
| D13 | Chef hat criteria | Removed (D28) | Hats no longer exist |
| D14 | Hosting on GitHub Pages | SPEC §15, §11.4 | Owner choice; installed PWA avoids iOS eviction |
| D15 | Progress is a mergeable event log | SPEC §11.1 | Several devices, no backend |
| D16 | Starting state from the owner's report | Partly superseded by D127 (no preset; stage default and subtraction-as-new stay in SPEC §4.2); amended by D43, D83 | Known +1/doubles come up less often |
| D17 | Near-doubles and 9+x are the first strategies | SPEC §1.1, §4 | Build on known doubles and +1 |
| D18 | `ncmc` namespacing on the shared Pages origin | SPEC §11.5 | Never touch the owner's other apps' storage |
| D19 | Back guard opens "Take a break?" | SPEC §2.3; amended by D37, D46 | Back gestures would exit mid-service |
| D20 | Build tiers instead of an hour cap | SPEC §0, §14; amended by D36, D44 | Playable game first, bonus work after |
| D21 | Story tickets declined (M6 number later reused for the Wish Jar, D149) | SPEC §0, §14 | Reading load; keyword shortcuts |
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
| D37 | Platform baseline iOS 15.4+ and known platform risks | Partly superseded by D111 (baseline iOS 18+); risks live in SPEC §0, §2, §2.3, §8.1, §11.4, §11.6 | Known traps are cheaper planned than found |
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
| D52 | `?debug` picker stored under `debugSkillConfig` | Implementation only; amended by D125 (turned into events, then deleted) | Per-device home before the event log |
| D53 | Home gear inert before M3a | Superseded by D94 | No target yet |
| D54 | Waiting service worker activates on cold launch or 30 s Home idle | SPEC §2, §15 | "When idle" had no threshold |
| D55 | Results tally by ones to ten, then fives, to the exact total | Superseded by D107 | End point was unspecified |
| D56 | Tap-to-skip exempt from the eat lock | SPEC §2.3, §5.6 | Skip must work during eating |
| D57 | Tier 1 renders only `frames1`; model supports `frames2` | SPEC §3.3 | A1–A3 never exceed 10 |
| D58 | Service worker registered from app code | Implementation only | Inline script blocked by CSP |
| D59 | Dev-only dependencies beyond SPEC §2 | Implementation only | Tooling the spec implies |
| D60 | Toolchain versions (TS 6.0, ESLint 9, …) | Implementation only | `typescript-eslint` support |
| D61 | M0 test and tooling assumptions | Implementation only, except (f) turn cue → SPEC §2.2 | Gaps between spec and tools |
| D62 | M1 layout geometry (S0 rows, taken-away grid, ring colors, cloche) | SPEC §3.3, §5.4; partly superseded by D63–D65, D73, D82, D84 | Bands could not hold 112 px buttons |
| D63 | Owner mock review: line by the door, bin centred, row and lid left | SPEC §5.4; ticket/bell/bubble superseded by D64, D65, D84; line, bin, row and lid superseded by D114, D117, D118 | Problem centred above the tray |
| D64 | Bell in the bottom band next to the bin; two-frame tray centred | SPEC §5.4; monster/bubble superseded by D65, D84; bell and two-frame tray superseded by D114, D116 | Bell belongs by the basket |
| D65 | Monster centred, ticket right beside it, slides right for the bubble | SPEC §5.4; bubble superseded by D84 | Off-centre monster felt wrong |
| D66 | M1 stand-in service (uniform plan, "Yum!", back to menu) | SPEC §14 (M1) | Builder, eating and Results are M2/M3a |
| D67 | S0 Peek marks Help without CountTogether or advancing | SPEC §3.4, §5.4; flow after a miss by D89 | Peek shows a model, not the script |
| D68 | CountTogether details (bell off while counting, bubble stays, count back) | SPEC §5.5 | §5.5 left these open |
| D69 | `TrayTask` refinement for S0 (`expected.typed`) | SPEC §3.1 | S0 needs both the typed answer and a tray |
| D70 | Caption slot; captions ≤ 8 words, ticket lines ≤ 12 | SPEC §13.2; slot superseded by D76 | Mock had no caption slot |
| D71 | Worked/FollowMe always on the S3 tray; FollowMe ends right | SPEC §5.5; take-back cue superseded by D82; S1 missing-number forms by D105 | No strategy visible on an empty tray |
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
| D91 | A tap gets a count or a tone; Pip steps back slowly; line waits | SPEC §1.4, §3.2, §3.3, §5.4, §7.3, §8.3; move time amended by D93; line no longer hides (D118) | Tones stepped on counts; hand-off felt abrupt |
| D92 | Decisions folded into SPEC; DECISIONS becomes an index; finished docs archived | This file; SPEC header; CLAUDE.md | Context cost and SPEC/DECISIONS contradictions |
| D93 | Monster's move between spots is 550 ms | SPEC §7.3 | Code and D91 text disagreed; owner confirmed 550 ms |
| D94 | Home gear opens playtest tools before M3a (long-press 2 s, no gate) | SPEC §2.2, §5.2, §12, §14; amended by D95 | Installed app can't open `?debug`; iOS storage is per app |
| D95 | Gear tap opens a hold-to-open popup with a filling ring; gear 88 px with real gear art | SPEC §2.2, §5.2, §12, §14 | Hold on the small gear gave no feedback and failed on devices |
| D96 | Correct serve fills the ticket blank with the answer in green | SPEC §5.4, §14 (M2); colour amended by D106 | Show the finished true sentence at the moment of success |
| D97 | Session builder gaps: balance-aware new facts, requeue fallback, in-memory seen until M3a | SPEC §4.1; new-fact reserve amended by D127 | New-fact cap and add/sub balance conflict on the first service |
| D98 | A3: make-ten demo lines, subtraction counts back, missing-subtrahend demo ends on what went away | SPEC §4, §5.5; demo counts amended by D104 | Make-ten demo and A3 subtraction strategy were open |
| D99 | Warm-up: ghost keeps pointing until touched, flag set at start, its monster and food | SPEC §5.4 | "Taps the bin once" left the idle child and the flag timing open |
| D100 | Monster art: shared face parts, still puzzled tilt, named ~1.4 s reactions, reduced motion = still poses, `?gallery`, café scene | SPEC §7.2, §7.4 | Look and motion of the five expressions were open |
| D101 | Eat sequence: eats the tray total, timings, skip to coins, service jar, greetings on first visit, monster voices, +5 tip paid | SPEC §5.6, §7.2, §9; flight amended by D103; what is eaten amended by D104 | Timings, what is eaten on missing-amount forms, and when monster lines play were open |
| D102 | Pointer guard ignores native form controls; `change` / no-finger `touchend` release it | SPEC §2.3 | Stage picker froze every tap in the app |
| D103 | Plate flies in together; monster says only the answer | SPEC §5.6 | Per-item counts tripped over each other |
| D104 | Missing-number forms: the orange group is the answer (marks, counts, PlateCount, demo, what is eaten) | SPEC §3.2, §3.3, §5.5, §5.6 | Monster wanted and ate the total, not the answer |
| D105 | S1 help on missing-number forms plays in the model bubble; CountTogether tells the make-ten story | SPEC §5.5 | Pip counted food the child never placed on an empty S1 tray |
| D106 | The solved answer takes the blank's role colour | SPEC §5.4 | Missing-number answers showed green like the total |
| D107 | Results: silent count-up by one with tings, then one spoken total; buttons after; tap skips | SPEC §5.7 | Spoken count outran the speech engine |
| D108 | A returning monster joins the line as the next monster comes in | SPEC §5.4; position amended by D118 (its real place, not the back) | Line grew during the meal for no visible reason |
| D109 | Sound effects never overlap speech | SPEC §5.6, §8.1 | iOS dropped boing, crunch and tings under speech |
| D110 | Blobbo's giggle, grounded door, string lights to the shop, Pip button art, shorter Mimsy hello | SPEC §5.4, §7.2, §7.4 | Owner playtest polish |
| D111 | Family devices recorded; baseline iOS/iPadOS 18+, emoji ≤ Unicode 15.0 | SPEC §0, §2, §2.4, §7.1, §8.1, §11.3, §13.5 | Owner listed iPad 7th gen, iPhone 17, Pixel 10 Pro |
| D112 | M2b device speed test (`?speedtest`); 300-element budget provisional until the iPad result | SPEC §2.2, §2.4, §13.5, §14; budget figure replaced by D113 | Redesigns and shop decorations need a measured budget, not a guess |
| D113 | SVG budget from the iPad: ≤ 4,800 elements on screen, ≤ 650 moving; e2e checks every screen | SPEC §2.4, §13.5, §14 | iPad 7th gen speed test: still art free past 8,000, moving smooth to ~1,100 |
| D114 | Service screen seen from behind the counter: status bar, room, one counter row; full-height monsters; window by the door | SPEC §5.4, §5.5, §7.3, §7.4 | Owner wanted to stand behind a café counter, not inside a house |
| D115 | Basket side setting (right default / left), per device; mirrors the counter row only | SPEC §5.4, §12 | The dragging hand should not cross the body |
| D116 | Two-frame tray: 88-px cells with tighter gaps, Pip on the bell, upright crate with a two-row heap | SPEC §3.3, §5.4 | Two frames, basket and two buttons did not fit one row |
| D117 | Taken-away row takes the basket's place | SPEC §3.3, §5.4 | No room beside the basket; there the basket does what the row does |
| D118 | Waiting line in the status bar: real minis, requeue at its real place with a badge, never hides | SPEC §5.4 | Owner request; D113 budget allows real monsters |
| D119 | Ticket blank drawn as an SVG outline with even dashes | implementation | Dashed CSS border uneven at the corners in WebKit at phone scale |
| D120 | Line walks left into the little café; cloche lid centred by eye | SPEC §5.4; amends D118 (direction) and D114 (cloche spacing); bar order amended by D121 | Monsters arrived from the left but queued toward the right; lid looked off centre |
| D121 | Coin jar and leave sign move to the right of the status bar | SPEC §5.4, §7.4; amends D120 (bar order) | Jar and sign sat at the end the line walks toward |
| D122 | At S0 the number pad hides during the help offer | SPEC §5.4 | Pad and picture buttons share the band; one set of targets at a time |
| D123 | Splash, Home, Menu and Results over the counter; one café scene for every child screen | SPEC §5.1–5.3, §5.7, §7.4; resolves the D121 two-scene note | Owner approved the mocks |
| D124 | Play-time limit postponed indefinitely; moved from M3b to its own Tier 2 milestone M12 | SPEC §6, §12, §14 | Owner decision before M3 |
| D125 | M3a persistence details: resume row from the start, offer once per launch, Not now clears (writing a missing serviceEnd); all orders served = finished, tipped; old picker becomes events; simple progress list | SPEC §5.8, §11.6, §12; amends D52; Close the café keeping the row superseded by D126 | SPEC left declining, re-asking and the progress list open |
| D126 | M3a playtest: Close the café is never offered back; support levels named for the screen; ops and basket side wording; Chompers' teeth | SPEC §3.2, §5.8, §7.2, §11.6, §12; amends D125; level names superseded by D128 | A deliberate close was offered back; S-names unclear to a parent |
| D127 | No starting preset; separate tray (S3–S1) and number-pad (S0) fact boxes | SPEC §4.1, §4.2, §11.2, §12; amends D16, D97 | Counting out at S1 says little about recall at S0; owner wants unbiased boxes |
| D128 | Support levels renamed Level 1–4: Most help · Some help · Little help · No help | SPEC §3.2; amends D126 (b); names superseded by D129 | Owner's second naming pass |
| D129 | Level names lose their numbers (Most · Some · Little · Least help) with new descriptions; basket side above Progress | SPEC §3.2, §12; amends D128, D126 | Owner's playtest feedback, M3a round 1 |
| D130 | Parents see fact boxes as *confidence* 0–4 (Tray / Number pad confidence), explained under the Progress table | SPEC §4.2, §12 | Parents don't know Leitner boxes; owner chose "confidence" |
| D131 | Progress list: one card per dish on a portrait phone, a tighter table elsewhere (fits landscape iPhone with the notch); rotation swaps them; Skills rows stack in portrait | SPEC §12; phone-landscape table superseded by D132 | Table was cut off on the iPhone |
| D132 | Progress on a phone in landscape: two cards per row instead of the table; confidence note and Least help wording | SPEC §3.2, §12; amends D131, D130, D129 | Owner: landscape table counts ran together |
| D133 | Sound and speed tests hidden from the grown-ups' screen; still on `?debug` and `?speedtest` | SPEC §2.2, §12 | Owner: not needed now, keep the code |
| D134 | Parent gate: new question per miss, 30 s lockout with no countdown kept for the launch; 5-minute wall-clock idle lock; leaving locks, backgrounding doesn't | Partly superseded by D137 (idle lock now 1 minute; rest in SPEC §12) | SPEC left lockout display, idle and leaving open |
| D135 | Per-device settings: keys and defaults in the `settings` store, speed scales every voice, volume products, Reduce motion forces the device rule; no schema bump | SPEC §8.2, §8.3, §11.3, §12 | Keys and combinations unspecified |
| D136 | Export checksum input and file name, file built before the tap, share fallbacks; Replace keeps `meta`; Reset clears `meta` too; app restarts after both | SPEC §11.6 | Hash input, activation and what each keeps were open |
| D137 | M3b playtest: parent area idle lock 1 minute; gate pad takes no touches and shows no pressed colour during lockout; voice picker lists each name and language once | SPEC §8.2, §12; amends D134 | Owner: phone sleeps before 5 min; keys lit while locked; iOS voices listed twice |
| D138 | Parent gate scrolls from the top in a short window (no cut-off title); the last monster of a service stays in place for the closing line instead of walking off | SPEC §5.6, §12 | Owner: gate title cut off in landscape Safari; last monster left and popped back |
| D139 | Recorded voices are M13: whole number words in lead/mid/end forms, fixed lines whole, current wording kept; listening test first; whole-line TTS fallback | SPEC §0, §8.2, §8.4, §14 | Whole sentences impossible (≈ 13,000 lines at 0–20); owner declined rewording |
| D140 | One recorded voice shifted per character; WAV masters, AAC .m4a 48 kbps mono; Audacity labels + `audio:build` (`ffmpeg-static`, dev only); voice cloning last resort | SPEC §2, §8.4 | Owner records alone; size and Safari decode support |
| D141 | Clip ids, `clipPlan` + `PHRASE_SPEAKERS`, precached clips decoded one at a time into a small cache, trim + crossfade, `speak()` contract kept, `?debug` voice test and toggle | SPEC §8.4 | Plumbing for recorded voices; iOS decode and memory limits |
| D142 | A voice pass after the owner's playtest closes each milestone that adds or changes spoken lines | SPEC §14 | Owner: record once the wording is settled |
| D143 | Clip plan details: `ask` number form, `pair.*` and `ref.*` ids, punctuation as intonation, `CLIP_POLICY` table, lines passed as `Line` | SPEC §8.4 | Questions and trailing pauses; the listening test changes a table, not code |
| D144 | Recording scripts read back by number; label matching; per-take loudness; spike for every voice, full set by inventory; manifest format and lint | SPEC §8.4 | Labels can't drift onto wrong clips; matched levels within a take |
| D145 | Pitch shift with ffmpeg-static's `rubberband` (formant-preserving; in the Linux and Windows builds); starting shifts per voice | SPEC §8.4 | PLAN §6.6 risk checked: no other tool needed |
| D146 | e2e WAV voice test set generated by a Vite plugin into `audio-e2e/` of the e2e build only | Implementation only | Offline test needs precached clips; nothing may reach production |
| D147 | Recorded playback: timeout = clip lengths + 700 ms, cut on timeout; TTS if not loaded in 1.5 s, no running audio or a frozen clock; 15 ms crossfade; Pip counts | SPEC §8.4 | §8.1 contract with real clip lengths; no silent gaps |
| D148 | Shop prices in five tiers (20/30/55/100/180) with colorways and shared colour families; M4 stock 3,105 coins (after D152), about 2 months at an hour a week | SPEC §9, §10, §7.4, §14; amended by D152, D157, D159, D160, D177, D185, D186 | Old 1,340-coin shop lasted 4–5 hours of play |
| D149 | Later shop content: M6 Wish Jar, M14 Deliveries & Themed Sets (crates of 2 every 30 monsters, held at 6 unbought), M15 Monster Wardrobe, M16 Monster Album, M17 Treat Time | SPEC §0, §10.1, §14; amended by D151 (crates move to M4), D157 (adds M18) | Owner wants the shop to last 6–9 more months without relying on art alone |
| D150 | Economy simulator `npm run economy:sim` writes `docs/ECONOMY_SIM.md` | SPEC §13.1 | Test prices against play time before committing to them |
| D151 | Delivery crates move into M4; the shop opens with a 17-entry starter shelf and the other M4 entries (38 after D152) arrive in crates | SPEC §10, §10.1, §14; amended by D152, D157, D160, D182 | 54 entries on day one is too many choices for a young child; crates keep about 7 on the shelf at no cost to lifespan |
| D152 | Wood is the free default floor (the café art already has it); Checkerboard becomes a T2 item | SPEC §10 | The free default must match the floor already drawn |
| D153 | Pip's wish line (M6) is generic: never names the item or an amount; Treat Time (M17) costs T2, 30 coins | SPEC §10.1, §14 | Item names would each need a recorded clip (D142); 40 was not a tier price |
| D154 | Crate arrivals are `crate` events `{n, next}` in the progress log, one per shop visit, pace counted from the due point, fixed crate order, merged by `n`; first schema change (`schemaVersion` 2 + migration) | SPEC §10.1, §11.2, §14; schema 3 by D179 | Must survive reloads and match across devices; `meta` is not merged |
| D155 | M4 splits into M4a (the coin shop working end to end with labelled stand-in art) and M4b (the art, in five batches that each stop for review; guest monsters are the last batch) | SPEC §14 | Code and art stop blocking each other; art review fits in one chat per batch |
| D156 | Shop art follows `docs/ART_GUIDE.md`, is reviewed on a `?decor` contact sheet, and is checked by decor lint rules (palette tokens, shared strokes, element count) | SPEC §7.4, §14; amended by D158 | Consistency must survive many separate chats; the repo, not the chat, carries the style |
| D157 | The Staff & pets slot moves out of M4 into a new M18 Café Staff; M4 is 30 items, 50 paid entries, 2,285 coins (about 1.8 months); Tiny Robot Sky and Star Chandelier replace the two staff on the starter shelf | SPEC §0, §7.3, §9, §10, §10.1, §14; totals amended by D160 | Owner: staff are characters with idle and reactions, too much for the first shop |
| D158 | The art guide sets firm limits (readability, phone size, shared colour families, SVG budget, gentle motion, child-safe, slot + fallback) and treats the house style as a starting point; experiments are welcome, flagged in the batch report, and the owner's picks become the style. Lint checks only the firm limits | SPEC §7.4, §14 | Owner: leave room for a style the agent finds that the owner likes |
| D159 | The serve bell is not a shop item: the Counter-top slot's free default is Clear Counter; new bell looks may come in a later drop | SPEC §10, §14 | The child always needs something to press to serve; it can't be swapped out |
| D160 | The Menu Board costs 20 coins (T1) and joins the starter shelf; Wall art's free default is Bare Wall. M4: 31 items, 51 paid entries, 2,305 coins; shelf 18 entries, 795 coins | SPEC §10, §14 | The menu board was never drawn, so it can't be a free default already in the café |
| D161 | M4a's "the shop counts as play time" waits for M12: no play-time clock exists yet (D124) | SPEC §14 | Owner: nothing measures play time today |
| D162 | Shop speech uses general lines; never names an item, colour or amount | SPEC §10 | Like D153: every name would need a recorded clip |
| D163 | Home's shop button reads "Shop" with a drawn paintbrush, right of Open the Café; the left side is kept for the Monster Album (M16) | SPEC §5.2, §5.7 | Owner's word; space planned for the album |
| D164 | Delivery: the box drops onto the counter, sparkles, opens on a tap or after 2 s (flaps fold out), entries rise out; Buy without enough coins is dimmed and Pip encourages | SPEC §10, §10.1; amended by D181 | Owner: an event that never waits on the child; no fail feel |
| D165 | Ticket shortened to y 172–360 so the right string of lights shows | SPEC §5.4 | Owner: the lights were always hidden behind the ticket |
| D166 | Mocks of a varying number of elements also show the maximum planned count (longest names, widest numbers) and are checked for fit | CLAUDE.md | Owner: catch overlap before it is built |
| D167 | Shop shelf: four tiles a page between two triangle arrows, page pips; no arrows with one page | SPEC §10 | Owner picked option A of four mocks |
| D168 | Caption bubble shrinks to fit its text, anchored so its tail still points at the speaker | SPEC §5.4 | Owner: less of the room covered; captions stay for reading |
| D169 | Pip says a slot's name (with caption) when its shop tab is tapped | SPEC §10 | Owner: picture-only tabs need a name |
| D170 | Results: four buttons on one line (Change dish, Another service, Shop, Home), text 38 px | SPEC §5.7 | Owner asked for Shop on Results in M4a |
| D171 | Crate order: catalog order round-robin across items (`CRATE_QUEUE`), the same as the simulator | SPEC §11.2 | Two colours of one item in a crate feel like one new thing |
| D172 | Yes! buys and equips; owned tiles and dots equip on a tap; a try-on is dropped on a tab change or leaving | SPEC §10 | Spec did not say what a purchase does to the café |
| D173 | Delivered entries rise and hang, then show starred on the shelf; no flight to the tiles | SPEC §10.1 | Their tiles are often on another tab or page |
| D174 | Delivery stars are a per-device setting, not an event | SPEC §10.1 | A cue, not progress |
| D175 | Shop captions stay at least 2.5 s; slot names end with "!" | SPEC §10 | Readable captions (D168); lint wants punctuation |
| D176 | The first crate skips the hold at 6 unbought; later crates keep it | SPEC §10.1, §11.2 | Owner wants the delivery moment on the first shop visit |
| D177 | Every colorway costs its item's price; any colorway can be bought first; M4 stock 2,505 coins | SPEC §10, §14; amended by D185, D186 | Owner: cheaper later colours made no sense once any colour could be bought first |
| D178 | iOS speech: cancel only a talking engine, then wait 150 ms (250 ms after an audio rebuild) before speaking, latest line wins; utterance held until it ends | SPEC §8.2 | iOS dropped or delayed a line tapped during another (shop tabs) |
| D179 | Grown-ups' playtest coin setting writes a signed `coinAdjust` event (balance only, not earned); `schemaVersion` 3 | SPEC §9, §11.2, §12 | Owner wants to playtest the shop without earning coins first |
| D180 | Grown-ups' playtest crates: send the next one on the next visit (no wait, no hold, pace restarts), replay the last delivery (records nothing), deliver all | SPEC §10.1, §12 | Owner wants to test deliveries repeatedly; only 17 crates in M4 |
| D181 | Delivery: entries rise slowly (1.4 s, staggered); the open box stays 8 s or until a tap anywhere (taps in its first second ignored) | SPEC §10.1 | Owner: the opening was over too quickly |
| D182 | Starter shelf cut to 10 (first colours of T1–T2 items); the 4 default recolours and 4 save-for items lead the crate queue, one of each a crate; 21 M4 crates | SPEC §10, §10.1; amended by D185 | Owner: the starter shelf was too full, crate 2 came too late |
| D183 | Art guide: the rough element allowance per item is raised by half (wallpaper and floor 60, lights 180, window, counter-top and wall art 90); only the total budget is firm | Implementation only (ART_GUIDE §5) | Owner after batch 3: the pieces' detail is welcome; Monster Portraits alone was 105 |
| D184 | Shop pictures: in all six slots, each tile, the confirm card and the delivery show the entry as the café cropped to its slot (closer for small items), drawn still; a free default shows the café as it is | SPEC §10 | Owner after batch 3: put the drawings on the tiles; reusing the café drawing keeps the picture identical to what the café will show |
| D185 | Street window redrawn as Little Shops; Town Houses, Park, Hilltop Town and Seaside sold as T3 windows (55), appended to the crate queue; M4 stock 2,725 coins, 23 crates | SPEC §10, §14; amended by D186 | Owner picked one of five new daytime streets and wanted the rest sold as their own tiles |
| D186 | The four new street windows (Town Houses, Park, Hilltop Town, Seaside) move to T4 (100); M4 stock 2,905 coins, bought out in about 9.6 weeks | SPEC §10, §14 | Owner: they are far more detailed than the other windows, so they should cost what other top-tier pieces do |
| D187 | Very slight motion (one small thing that sways, turns or rocks slowly) is acceptable on top-tier decor (T4–T5), used sparingly; Park, Hilltop Town and Seaside keep theirs | SPEC §7.4; ART_GUIDE §2, §3 | Owner after seeing them move: so slight and so small on screen that it is not distracting |
