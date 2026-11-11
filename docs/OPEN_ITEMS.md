# Open items — what I still need from the owner

Claude Code will use the noted default until you answer. Answer in DECISIONS.md or in chat.

## Resolved by the owner
| Topic | Answer | Recorded as |
|---|---|---|
| Hours | Playable game in ≈ 10 h; bonus features after, no upper limit. The per-milestone estimate is redone in PLAN.md after the M3 split | D20 (Tier 1 / Tier 2), D36 |
| Hosting | GitHub Pages, public repo is fine | D14 |
| Orientation | Landscape; portrait should start already looking landscape so the child just turns the device | D8 (rotated stage) |
| Timer | Optional, off by default; when a parent turns it on, total play time per session, after which the child can't play until a parent extends | D7, D27 (SPEC §6) |
| Max services per day | Not wanted | — |
| Profiles | One child profile for now; a profile for a younger sibling later | D9, M11 |
| The child's level | Knows +1 and doubles (1+1 … 9+9) from flash cards; learning number sentences with sums under ten; can do take-away word problems | D16 |
| Custom content | Parent focus list of specific facts (+ rename monsters) | M7 |
| Devices | iPad 7th gen (primary), iPhone 17, Pixel 10 Pro, all used by the child | D15, D111 |
| Platform baseline | iOS/iPadOS 18+ (the iPad 7th gen's newest) and a recent Chrome on Android; emoji up to Unicode 15.0 | D37, D111 |
| Syncing | Merge by exported file is fine | D15 (M7) |
| Parent gate | Multiplication question is OK | SPEC §12 |
| Story tickets | Declined | D21 |
| Skill choice | The child or a parent picks the skill each session; next service repeats it by default | D22 |
| Stage control | Fixed per skill, parent-set, default S3 | D23 |
| A1 mix | Parent setting per skill: both / addition only / subtraction only | D24 |
| Wrong-then-fixed outcome | Four outcomes `first` / `afterHint` / `fixed` / `assisted`; a wrong first serve then a correct one is `fixed`: box 0, no requeue | D29 |
| Tip when time runs out | The +5 tip is paid when the allowance closes the café mid-service; none for a voluntary exit | D33 |
| Family details in the repo | Generalized in current files | D38 |
| GitHub setup (former #1) | The public repo `number-chef-monster-cafe` exists; owner sets Pages source to "GitHub Actions" and pushes | D47 |
| App name | Number Chef: Monster Café (export id `number-chef-monster-cafe`) | D47 |
| Playtest builds | Owner pushes to `main` (the real app); reset playtest progress once before real use | D44 |
| Tier 1 hours | ≈ 10 h is a guide; PLAN.md may exceed it | D44 |
| Restore in Tier 1 | Replace-only import ships in M3b; Merge in M7 | D44 |
| Second spec review (2026-11-04) | All findings decided | D40–D47 |

## Still open
| # | Question | Default used |
|---|---|---|
| 1 | ~~GitHub setup~~ — resolved: the repo exists (see the resolved table; number kept so references stay stable). | — |
| 2 | **Roster approval.** Monster names/personalities/favorite foods, guide "Pip the mouse", staff animals. The child may enjoy naming them; deferred, so placeholders stay through M2 and in-app renaming comes with M7. | Placeholder names, SPEC §7 |
| 3 | **Coin pacing.** 23 coins per 6-monster service (up to 29 with requeues); shop is 1,340 total, about 58 services at 23 coins (shop is Tier 2, M4). | As specified |
| 4 | **Music.** None in v1. | None |
| 5 | **Voice.** US English; you pick a voice per device in the Parent area after M3b. | Auto-pick |
| 6 | **Which Tier 2 item first?** I'd suggest the shop (M4: gives coins a purpose) and the rest of the Little Menu (M5: A1–A3 will last weeks, not months). | Shop, then M5 |
| 7 | **Service length vs allowance.** The spec says about 5–10 min per service; a smooth run of 6 orders looks closer to 4–6 min on paper. If a 15 min limit is enabled that is 2–3 services. The last-customer wind-down (D33) shortens the final service instead of cutting it off. | Keep 6 orders; log the median service length at the M2 playtest and use it to set `lastCustomerMs` and `minServiceMs`. |
| 8 | **Coins with nothing to buy in Tier 1** (the shop is M4, D20). | As specified; playtest question at M3b. If it feels empty, pull a one-slot shop forward. |
| 9 | **Tap-to-skip eat animation vs input lock** (SPEC §2.3 vs §5.6). | Skip taps are exempt from the animation lock. |
| 10 | **Small gaps:** who voices the ticket; where removed items go. | Ticket read in the monster's voice (pitch/rate), Pip voices help and counting; removed items fly to the bin, except for missing-subtrahend forms where they stay in the taken-away row (D30). |

## Device details to send
- Models recorded (D111). Still useful: confirm the iPad is on iPadOS 18 (Settings → General → About).
- Whether the iPad/iPhone use rotation lock or a silent switch (affects portrait behavior and WebAudio).
- Whether you use Guided Access (iOS) / Screen Pinning (Android) — worth enabling to keep the child inside the app; the optional play-time limit only controls time, not what else the device can do.

## Assets
- **None required to start.** Fonts come from `@fontsource/andika`; SFX are synthesized; art is SVG/emoji; icons are generated.
- Optional later: custom food illustrations, hand-drawn monsters, a real app icon, recorded voice lines.

## Recordings (later, optional)
Target list is produced by `scripts/audio-todo.ts` (≈ 21 numbers 0–20, 8 tens 30–100, ~35 prompt/operator phrases, ~50 monster lines ≈ 115 clips). Decide who records (a parent voice is usually best for a young child), format (m4a/mp3, mono, normalized), and when (once phrases are final).

## Needed during playtests
- A real iPad session with the child at M1 (about 5 min), M2, M3a and M3b (about 15 min each). Builds reach the devices when you push to `main`; reset playtest progress once before the child's real use (D44). PLAYTEST.md lists what to watch. At M3b, turn on a 10-minute play-time limit (Parent → Settings), hand the child the device and walk away. Repeat key checks on the iPhone and Android phone at M2 and M3b.
- At M0: install to the Home Screen on each device and confirm it launches standalone (an owner check; the agent cannot verify it). Install **before** first play, because Safari-tab and Home-Screen storage are separate on iOS.
- At M1: approve the static layout mock before interaction is built.
- When M7 lands: a two-device merge test (iPad → iPhone → back).
