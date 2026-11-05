# Playtest checklist (owner only)

What the agent cannot verify here (CLAUDE.md, SPEC §13.6). Tick, and add notes. The agent reads this at the start of the next milestone.

**Before the first real play:** install to the Home Screen, then play from the icon. On iOS the Home Screen app and a Safari tab keep separate storage (SPEC §11.4). Playtest progress gets reset once before real use (D44).

## Always (every milestone)
- [ ] Did the child understand the ticket unaided?
- [ ] Does the child count by touching the placed items?
- [ ] Tap vs. drag preference?
- [ ] Is the bell press discoverable?
- [ ] Any voice line scary or annoying?
- [ ] Pace of requeue / FollowMe: too much?
- [ ] Does the child look at the monster or the math?
- [ ] Are tap targets comfortable?
- [ ] Anything the child does that the app doesn't handle (two fingers, resting palm, mashing)?
- [ ] Do the emoji foods each read as one unit on the real devices?
- [ ] Smoothness acceptable on the real iPad?
- [ ] Any freeze after backgrounding or rotation on the real iPad?
- [ ] Audio working with the silent switch on?

## M0 — Foundations (no child needed)
Owner action first: in the GitHub repo, Settings → Pages → Source = **GitHub Actions**, then push `main`. The workflow runs `npm run check` and deploys `dist/`. URL: `https://<user>.github.io/number-chef-monster-cafe/`.

- [x] The Pages URL loads (Splash: monster, "Tap to start").
- [x] **iPad:** Share → Add to Home Screen; the icon is the green monster; it launches standalone (no Safari bars).
- [x] **iPhone:** same; launches standalone; landscape fills the screen (notch side has no clipped buttons).
- [x] **Android:** Chrome menu → Install app; launches standalone and stays landscape.
- [x] Portrait (rotation lock on): the café shows sideways with a curved-arrow cue for ~6 s; turning the device makes it upright; buttons work both ways. (iPad, 2026-11-05)
- [x] Pinch, double-tap and long-press do nothing (no zoom, no text selection, no callout menu).
- [x] Android back gesture / iOS edge swipe shows "Take a break?" instead of leaving; *Keep cooking* closes it.
- [x] Airplane mode after one visit: the installed app still opens.
- [x] `…/number-chef-monster-cafe/?debug` shows the version and "Storage idb" (Persisted / Usage may say "not available on this device" on older iOS; that's expected).

Notes:
- 2026-11-05 (iPad): Splash → Home → Little Menu → Home all work; art and animation fine for M0.
- In a Safari tab, landscape shows Safari's tab and address bars and noticeably shrinks the game. The installed Home Screen app has no bars and looks better. Decision: stay landscape and play from the Home Screen app (D8; installing is also what protects storage on iOS, SPEC §11.4).
- Re-opening the installed app resumes where it was (iOS keeps it in memory); "Tap to start" appears only after a real quit. Expected (SPEC §2.3).


## M1 — Core loop (5 minutes with the child on the real iPad)
How to set it up: open `…/number-chef-monster-cafe/?debug`, pick the stage and operations for A1/A2 under **Skills** (applies from the next service), then open the app normally. Menu → **Little Bites** (A1) or **Big Bites** (A2). One placeholder monster, 6 orders, then back to the menu. No coins, eating animation or Results yet (M2).

- [ ] Does the child understand the ticket unaided (S3)? Do they tap the ticket to hear it again?
- [ ] Is the bell press discoverable? (It looks faded until something is built.)
- [ ] Tap vs. drag from the bin: which does the child use?
- [ ] Does the child count by touching the placed items (they hop and say their number)?
- [ ] Take-away orders (S3, remove mode): does the child tap items to take them away, and find the bin to put one back? Are number sentences the barrier for subtraction?
- [ ] Wrong serve: is the monster's "I see seven… I wanted eight. One more!" clear and friendly?
- [ ] CountTogether bubble (after a wrong serve or Pip's hat): readable on the iPad? Does the child watch it?
- [ ] Worked demo + FollowMe after two misses: too long? Does the child follow the pulsing cell/bin and then press the pulsing bell?
- [ ] S0 (number pad): speed versus flash-card pace? Does the child find Peek (the cloche) and the lid to go back?
- [ ] Voices: which voice did the iPad pick, is the rate (0.85) right, are lines clipped by the next line (speech timeout tuning, D37)?
- [ ] Is anything silent with the silent switch on (SFX need iOS 17+)?
- [ ] Captions bubble (top left): readable? In the way?
- [ ] On the iPhone (landscape): are the digits and tray cells comfortable to hit?
- [ ] On the iPhone/iPad: does the dashed blank on the ticket look whole? (Playwright's WebKit draws it with sparse dashes at phone size; probably an engine quirk.)

Notes:
