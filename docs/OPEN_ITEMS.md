# Open items — what I still need from the owner

Claude Code will use the noted default until you answer. Answer in DECISIONS.md or in chat.

## Resolved by the owner
| Topic | Answer | Recorded as |
|---|---|---|
| Hours | Playable game in ≈ 10 h; bonus features after, no upper limit | D20 (Tier 1 / Tier 2) |
| Hosting | GitHub Pages, public repo is fine | D14 |
| Orientation | Landscape; portrait should start already looking landscape so she just turns the device | D8 (rotated stage) |
| Timer | Total play time per session; after it, she can't play until a parent extends | D7 (play allowance + lock, SPEC §6) |
| Max services per day | Not wanted | — |
| Profiles | Older daughter (5½, Grade 1 first semester) only for now; profiles later; younger daughter is 2½ | D9, M11 |
| Her level | Knows +0, +1, doubles (1+1 … 9+9) from flash cards; learning number sentences with sums under ten; can do take-away word problems | D16 |
| Custom content | Parent focus list of specific facts (+ rename monsters) | M7 |
| Devices | iPhone, iPad, and a wife's Android phone, all used by the kids | D15 |
| Syncing | Merge by exported file is fine | D15 (M7) |
| Parent gate | Multiplication question is OK | SPEC §12 |
| Story tickets | Declined | D21 |

## Still open
| # | Question | Default used |
|---|---|---|
| 1 | **GitHub setup.** Repo name (default `number-chef-monster-cafe`). You create the public repo, set Pages source to "GitHub Actions", and push (or tell Claude Code to push). | You push |
| 3 | **Roster approval.** Monster names/personalities/favorite foods, guide "Pip the mouse", staff animals. She may enjoy naming them. | Placeholder names, SPEC §7 |
| 4 | **Coin pacing.** 23 coins per 6-monster service; shop ≈ 1,600 total (shop is Tier 2, M4). | As specified |
| 5 | **Music.** None in v1. | None |
| 6 | **Voice.** US English; you pick a voice per device in the Parent area after M3. | Auto-pick |
| 7 | **Which Tier 2 item first?** I'd suggest the shop (M4: gives coins a purpose) and the rest of the Little Menu (M5: A1–A3 will last weeks, not months). | Shop, then M5 |

## Device details to send
- iPad model + iOS version; iPhone model + iOS version; the Android phone's model + Chrome version.
- Oldest device that must work.
- Whether the iPad/iPhone use rotation lock or a silent switch (affects portrait behavior and WebAudio).
- Whether you use Guided Access (iOS) / Screen Pinning (Android) — worth enabling to keep her inside the app; the play allowance only controls time, not what else the device can do.

## Assets
- **None required to start.** Fonts come from `@fontsource/andika`; SFX are synthesized; art is SVG/emoji; icons are generated.
- Optional later: custom food illustrations, hand-drawn monsters, a real app icon, recorded voice lines.

## Recordings (later, optional)
Target list is produced by `scripts/audio-todo.ts` (≈ 21 numbers 0–20, 8 tens 30–100, ~35 prompt/operator phrases, ~50 monster lines ≈ 115 clips). Decide who records (a parent voice is usually best for a 5-year-old), format (m4a/mp3, mono, normalized), and when (once phrases are final).

## Needed during playtests
- A real iPad session with her at M1, M2 and M3 (15 min each). PLAYTEST.md lists what to watch. At M3, hand her the device with a 10-minute allowance and walk away. Repeat key checks on the iPhone and Android phone at M2 and M3.
- When M7 lands: a two-device merge test (iPad → iPhone → back).
