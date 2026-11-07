# Playtest checklist (owner only)

What the agent cannot verify here (CLAUDE.md, SPEC §13.6). Tick, and add notes. The agent reads this at the start of the next milestone.

**Before the first real play:** install to the Home Screen, then play from the icon. On iOS the Home Screen app and a Safari tab keep separate storage (SPEC §11.4). Playtest progress gets reset once before real use (D44).

## Always (every milestone)
- [ ] Did the child understand the ticket unaided?
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

- [x] Does the child understand the ticket unaided (S3)? Do they tap the ticket to hear it again?
  Understands fine; doesn't tap to hear it again. The automatic repeat after 20 s was annoying → removed (D81).
- [x] Is the bell press discoverable? (It looks faded until something is built.)
  Yes. Owner heard no sound on the press; a chime already exists (SPEC §8.3), so this is being checked as an audio problem (see the M1 round 2 list below).
- [x] Tap vs. drag from the bin: which does the child use?
  Always taps. Drag stays.
- [x] Does the child count by touching the placed items (they hop and say their number)?
  No; she counts by eye. Tapping an item now sends it back to the bin in every mode, and "take one back" is gone (D82).
- [x] Take-away orders (S3, remove mode): does the child tap items to take them away, and find the bin to put one back? Are number sentences the barrier for subtraction?
  Taps to take away and put back. Number sentences are not the barrier.
- [x] Wrong serve: is the monster's "I see seven… I wanted eight. One more!" clear and friendly?
  Yes.
- [x] CountTogether bubble (after a wrong serve or Pip's hat): readable on the iPad? Does the child watch it?
  Too small on the iPhone → the monster stands left of a bigger bubble, contents about twice as big (D84).
- [ ] Worked demo + FollowMe after two misses: too long? Does the child follow the pulsing cell/bin and then press the pulsing bell?
  Not reached yet (CountTogether was enough help). No change for now.
- [ ] S0 (number pad): speed versus flash-card pace? Does the child find Peek (the cloche) and the lid to go back?
  Not tried yet.
- [x] Voices: which voice did the iPad pick, is the rate (0.85) right, are lines clipped by the next line (speech timeout tuning, D37)?
  Rate and timeout fine; keep watching.
- [ ] Is anything silent with the silent switch on (SFX need iOS 17+)?
  Not tested yet.
- [x] Captions bubble (top left): readable? In the way?
  Readable, not in the way.
- [x] On the iPhone (landscape): are the digits and tray cells comfortable to hit?
  Yes.
- [x] On the iPhone/iPad: does the dashed blank on the ticket look whole? (Playwright's WebKit draws it with sparse dashes at phone size; probably an engine quirk.)
  Doesn't look whole, but that's fine.

### M1 feedback round (D75–D79)
- [x] Quick taps: does every tap now say its count, with the previous count cut off cleanly? Any stutter or dropped words on the iPad (iOS can be unreliable when speech is cancelled rapidly)?
  Consistent; cuts off cleanly.
- [x] "…cookies please!" and "Thank you chef!" (no comma pause): natural now?
  Yes.
- [x] Caption bubble next to the monster with its tail: does it read as the monster speaking? Does it hide cleanly during CountTogether and come back for FollowMe?
  Yes.
- [x] Menu: do Little Bites and Big Bites both look playable? Does Perfect Ten (dashed, faded) look "not yet"?
  Perfect Ten reads "not yet". Little/Big Bites borders differed and the last-played highlight was confusing → removed (D83).
- [x] Bin: does it look full, with nothing falling off the edges?
  Laptop (Windows Chrome) good; on iOS the emoji bunched in the middle → items placed by centre so both fill the crate (D85).

### M1 feedback round 2 (D81–D85)
- [x] Sounds: silent switch off. The bell was never heard; basket tones played only sometimes, and never when a count was spoken.
- [ ] Bell (D86): does the "ding" now ring on every press, with "Yum!" (or "I see…") right after? Is the half-second pause before the monster speaks OK?
- [ ] Tray tones (D86): with counting aloud (S3), do you now hear a short tone with each tap as well as the number? If the number still drowns the tone, say so (next step is in D86).
- [ ] At S1/S2 (no counting voice): does every basket tap make a tone?
- [ ] Order spoken once on arrival, no repeat when the child waits: better?
- [ ] Tapping an orange item in addition sends it back to the bin; tapping a blue one only wiggles it. Clear to the child?
- [ ] Menu: Little Bites and Big Bites now look identical (no glow).
- [ ] CountTogether on the iPhone: monster on the left, larger bubble. Readable now? Anything overlapping (the monster stands in front of the waiting line)?
- [ ] Bin on the iPhone/iPad: does the heap now reach the crate edges? And on the laptop, does it still look as before?

Notes:
