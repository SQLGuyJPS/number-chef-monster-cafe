# Open items — what I still need from the owner

Claude Code will use the noted default until you answer. Answer in DECISIONS.md or in chat.

## Resolved by the owner
| Topic | Answer | Recorded as |
|---|---|---|
| Hours | Playable game in ≈ 10 h; bonus features after, no upper limit | D20 (Tier 1 / Tier 2) |
| Hosting | GitHub Pages, public repo is fine | D14 |
| Orientation | Landscape; portrait should start already looking landscape so she just turns the device | D8 (rotated stage) |
| Timer | Optional, off by default; when a parent turns it on, total play time per session, after which she can't play until a parent extends | D7, D27 (SPEC §6) |
| Max services per day | Not wanted | — |
| Profiles | Older daughter (5½, Grade 1 first semester) only for now; profiles later; younger daughter is 2½ | D9, M11 |
| Her level | Knows +0, +1, doubles (1+1 … 9+9) from flash cards; learning number sentences with sums under ten; can do take-away word problems | D16 |
| Custom content | Parent focus list of specific facts (+ rename monsters) | M7 |
| Devices | iPhone, iPad, and a wife's Android phone, all used by the kids | D15 |
| Syncing | Merge by exported file is fine | D15 (M7) |
| Parent gate | Multiplication question is OK | SPEC §12 |
| Story tickets | Declined | D21 |
| Leveling | She or a parent picks the skill each session; next service repeats it by default. Automatic leveling is an optional late milestone | D22 (M12) |
| Stage control | Fixed per skill, parent-set, default S3 | D23 |
| A1 mix | Parent setting per skill: both / addition only / subtraction only | D24 |
| Hats | Deferred to the late milestone | D25 |

## Still open
| # | Question | Default used |
|---|---|---|
| 1 | **GitHub setup.** Repo name (default `number-chef-monster-cafe`). You create the public repo, set Pages source to "GitHub Actions", and push (or tell Claude Code to push). | You push |
| 3 | **Roster approval.** Monster names/personalities/favorite foods, guide "Pip the mouse", staff animals. She may enjoy naming them. | Placeholder names, SPEC §7 |
| 4 | **Coin pacing.** 23 coins per 6-monster service; shop ≈ 1,600 total (shop is Tier 2, M4). | As specified |
| 5 | **Music.** None in v1. | None |
| 6 | **Voice.** US English; you pick a voice per device in the Parent area after M3. | Auto-pick |
| 7 | **Which Tier 2 item first?** I'd suggest the shop (M4: gives coins a purpose) and the rest of the Little Menu (M5: A1–A3 will last weeks, not months). M12 (automatic leveling, hats, Chef's Pick) is last and optional. | Shop, then M5 |
| 8 | **Service length vs allowance.** The spec says 8–10 min per service; a smooth run of 6 orders looks closer to 4–6 min on paper. If a 15 min limit is enabled that is 2–3 services, and a service cut off by the lock is shorter than 6 orders. | Keep 6 orders; log the median service length at the M2 playtest; no +5 tip on a partial service. Revisit with real numbers. |
| 9 | **Coins with nothing to buy in Tier 1** (the shop is M4, D20). | As specified; playtest question at M3. If it feels empty, pull a one-slot shop forward. |
| 10 | **Wrong-then-fixed outcome.** Correct on the second try after CountTogether (which shows the answer). | Logged as `afterHint`, fact box reset to 0, no requeue. |
| 11 | **Tap-to-skip eat animation vs input lock** (SPEC §2.3 vs §5.6). | Skip taps are exempt from the animation lock. |
| 12 | **Small gaps:** who voices the ticket; where removed items fly ("fridge bin"). | Ticket read in the monster's voice (pitch/rate), Pip voices help and counting; removed items fly back to the bin. |

## Device details to send
- iPad model + iOS version; iPhone model + iOS version; the Android phone's model + Chrome version.
- Oldest device that must work.
- Whether the iPad/iPhone use rotation lock or a silent switch (affects portrait behavior and WebAudio).
- Whether you use Guided Access (iOS) / Screen Pinning (Android) — worth enabling to keep her inside the app; the optional play-time limit only controls time, not what else the device can do.

## Assets
- **None required to start.** Fonts come from `@fontsource/andika`; SFX are synthesized; art is SVG/emoji; icons are generated.
- Optional later: custom food illustrations, hand-drawn monsters, a real app icon, recorded voice lines.

## Recordings (later, optional)
Target list is produced by `scripts/audio-todo.ts` (≈ 21 numbers 0–20, 8 tens 30–100, ~35 prompt/operator phrases, ~50 monster lines ≈ 115 clips). Decide who records (a parent voice is usually best for a 5-year-old), format (m4a/mp3, mono, normalized), and when (once phrases are final).

## Needed during playtests
- A real iPad session with her at M1, M2 and M3 (15 min each). PLAYTEST.md lists what to watch. At M3, turn on a 10-minute play-time limit (Parent → Settings), hand her the device and walk away. Repeat key checks on the iPhone and Android phone at M2 and M3.
- When M7 lands: a two-device merge test (iPad → iPhone → back).
