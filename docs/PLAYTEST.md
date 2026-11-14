# Playtest checklist (owner only)

What the agent cannot verify here (CLAUDE.md, SPEC §13.6). Tick, and add notes. The agent reads this at the start of the next milestone.

**Before the first real play:** check the iPad is on iPadOS 18 (Settings → General → About; the baseline, D111), install to the Home Screen, then play from the icon. On iOS the Home Screen app and a Safari tab keep separate storage (SPEC §11.4). Playtest progress gets reset once before real use (D44).

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
How to set it up: in the installed app, tap the gear (top right of Home), then press and hold the blue circle until the ring closes (two seconds) to open the playtest tools; pick the stage and operations for A1/A2 under **Skills** (applies from the next service), or use the **Sound test**; **Back to the café** returns to Home. (`?debug` in a browser still works, but on iOS it has separate storage from the Home Screen app.) Menu → **Little Bites** (A1) or **Big Bites** (A2). One placeholder monster, 6 orders, then back to the menu. No coins, eating animation or Results yet (M2).

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
- [x] After D86: bell still silent; tones played for a short while, sounded clipped, then stopped for good; voices fine (A1/A2, add and sub).

### M1 feedback round 3: sound (D87)
Play first, then use the sound test if anything is silent.
- [ ] In a service: does the bell ding on every press now? Do basket/tray tones keep playing for a whole service, and are they still clipped?
- [ ] If sound still stops: open `…/number-chef-monster-cafe/?debug` (in Safari is fine), scroll to **Sound test**, and tell me:
  1. Tap **Bell** a few times. Heard? What do *Context*, *Clock* and *Tones* say?
  2. Tap **Speak, then bell**. Does the bell ring after "one, two, three"? Then tap **Bell** again: heard? Did *Contexts built* go up?
  3. Tap **Bell, then speak**. Both heard?
  4. If nothing works: switch *audioSession type* to `ambient`, then `auto`, and repeat 1–3 each time (`ambient` follows the silent switch, so keep it off).
  5. The *audioSession* row: what does it say (it shows whether the device is on iOS 17+)?
- [ ] Order spoken once on arrival, no repeat when the child waits: better?
- [ ] Tapping an orange item in addition sends it back to the bin; tapping a blue one only wiggles it. Clear to the child?
- [ ] Menu: Little Bites and Big Bites now look identical (no glow).
- [ ] CountTogether on the iPhone: monster on the left, larger bubble. Readable now? Anything overlapping (the monster stands in front of the waiting line)?
- [ ] Bin on the iPhone/iPad: does the heap now reach the crate edges? And on the laptop, does it still look as before?

Notes:

- [x] After D87: tray/basket tones work; the bell rings, then the monster says "Yum!" after a pause. But a tap while the monster was talking cut the line off, the next order was silent, and speech came back only after a long while. Tapping food while the order was read did nothing, then "caught up" when the line ended.

### M1 feedback round 4: talking and tapping (D88)
- [ ] Start tapping food while the monster is still reading the order: does it stop talking at once, with the tones, counting and food moving immediately?
- [ ] Tap around (tray, basket, anywhere) while the monster says "Yum!" or "I see…": does speech carry on, and is the next order spoken?
- [ ] Over a whole service: any order that stays silent? If one does, note roughly when it happened, and whether it spoke again after about 1–2 seconds (a stuck line is retried once).
- [ ] Do the tones and the bell still work as in round 3?

### M1 feedback round 5: fixing a mistake (D89)
- [x] One wrong serve: the monster says what it wanted, then the child can fix the tray and ring at once. Is that enough for a single slip?
  Yes.
- [ ] Is the pulsing Pip hat after a miss noticed? Is it tempting enough, or too distracting?
  Not noticed. Owner will revisit at a later milestone; no change now.
- [x] Second wrong serve: "Want Pip to help? Or try again?" Does the child understand the two pictures (Pip = help, the circling tray = try again) without explanation?
  Pip wasn't read as "help" at first, but was after one help sequence. Pip needs a proper introduction later (M2 Pip work) so a cold child knows Pip helps.
- [x] Does the child pick "try again" every time? If so, the third miss plays the help anyway; is that third try one too many?
  Usually picks try again and usually gets it right then. The third-miss help is good; the next try is always right.
- [ ] Help before serving still plays the count-together bubble. Is it still useful there?
  Retest once Pip is more fully developed.

### M1 feedback round 6: Pip helps (D90)
- [x] When the monster asks "Want Pip to help?", Pip pops up on the counter. Does the child connect Pip on the counter, the Pip button in the offer and the hat button?
  Yes, after seeing the help sequence once.
- [x] Pip's voice (same voice, higher): clearly a different character on the iPad and iPhone? Not squeaky or hard to understand? (iOS voices react to pitch differently.)
  Yes. But Pip's voice and the food place/remove tones stepped on each other → tones only where nothing is counted aloud (D91).
- [x] Count-together with Pip: is it clear Pip is counting (bubble pointing at Pip, monster shrunk to the far left)?
  Yes; the monster fades into the background.
- [x] Does Pip stepping back when the child serves feel natural?
  A hair too quick → slowed (D91). The waiting line reappeared under the monster as it walked back after count-together → line stays hidden until the monster is home (D91).

### M1 feedback round 7: quieter counting, slower hand-off (D91)
- [x] Pip's demo: only Pip's counting is heard as food goes in or out (no tones). Clear?
  Yes, only Pip's voice. Known issue, left as is by the owner: tapping the next food item before the previous count has finished cuts the counting off, and counting stays silent until the bell is pressed. Speech cancelling/sticking is accepted until recorded voice-overs replace TTS (OPEN_ITEMS, Recordings).
- [x] Counting-on / counting-back orders (S3): each tap says its number with no tone under it. Does the child still get enough feedback from a tap? Other orders (no counting) keep their tones.
  Yes.
- [x] Pip sinking back behind the counter and the monster walking back: the right pace now, or still too quick / now too slow?
  Good pace.
- [x] After count-together on the first order: does the waiting line stay away until the monster is back in its spot, then fade in without overlapping it?
  Yes, looks good.

## M1 — Playtest tools from the gear (D94)
2026-11-09: the hold on the gear did nothing and gave no feedback; the gear was too small to tell → D95.
- [ ] In the installed app on the iPad, iPhone and Android: holding the gear 2 s opens the playtest tools.
- [ ] A short tap on the gear does nothing.
- [ ] A stage/operations change there reaches the next service.
- [ ] The sound test there behaves as it did in a Safari tab (note any differences).
- [ ] **Back to the café** and the back gesture (Android back, iOS edge swipe) both return to Home.
- [ ] The child doesn't stumble into it.

## M1 — Gear popup and hold ring (D95)
2026-11-09 playtest:
- [x] The gear is easy to find and hit, and looks like a gear.
- [x] A tap on the gear opens the popup at once.
- [x] Holding the circle fills the ring clockwise from the top and opens the tools when it closes (iPad, iPhone, Android).
  Confirmed on the iPhone; iPad and Android not reported.
- [x] Lifting early empties the ring and nothing opens.
- [x] **Close**, tapping outside and the back gesture all close the popup.
- [ ] What does the child do when she taps the gear?
  Not tested yet.

The D94 list above is covered by this round (the hold now goes through the popup).

## M2 — Café service
- [ ] Correct serve: the dashed blank on the ticket turns into the answer in green (D96). Does the child notice it and read the finished sentence? Does it help, or is it noise during the eating?
- [ ] **Perfect Ten (A3)** is now playable from the menu. Do the `7 + ? = 10` orders make sense to the child (blue part on the tray, fill to ten)? Is the ticket read aloud ("Seven plus what equals ten?") understood?
- [ ] `10 − ? = 6`: the items taken off stay in the small grid left of the tray. Does the child see that grid as the answer? Does tapping it to put one back occur to her?
- [ ] Pip's make-ten help ("Seven." … "Three empty spots." … "Seven and three more makes ten!"): clear, too long?
- [ ] Services now pick facts by how well they're known and bring in at most 3 new ones (D97). Until M3a this is remembered only while the app stays open. Do the first services with both operations feel too subtraction-heavy?
- [ ] **Warm-up (first service on a device only):** a `2 + 1` cookie order comes first. If she waits, a pale hand taps the basket, then (once the cookie is on) points at the bell while Pip says "Ring the bell to serve!". To see it again on a device, it needs a fresh install or storage reset (the reset arrives in M3b). Does the hand help or confuse?
- [ ] **A monster comes back:** after Pip's full help (the follow-me path), that monster returns 3–5 orders later saying "I'm back! Still hungry!", with one step more support, and the waiting line grows by one. Natural, or confusing?
- [ ] **Results (closing time):** after the last monster the CLOSED sign flips, the coins count up aloud ("one, two, … ten, fifteen, eighteen!"), and the monsters served stand in a row. Pace of the count right? Does she pick **Another service** (ringed in gold), **Change dish** or **Home**?
- [ ] **Coin jar on Home:** shows every coin earned since the app was opened (also from a café closed early). It resets on reload until M3a saves it.
- [ ] **The six monsters** (Blobbo, Gruffles, Zibbit, Mimsy, Chompers, Wobbleton) and the new Pip. Open `…/?gallery` to see all of them with every face. Which does the child like or avoid? Any that look scary? Do the puzzled faces (head tilt, raised brow) read as "hmm", never cross?
- [ ] Each monster's happy reaction after a correct serve (melts, stomps, spins, floats with hearts, burp bubble, wobbles into a puddle): fun, too long, distracting?
- [ ] Café background (wallpaper, string lights, window, floor): cosy, or too busy behind the ticket and tray?
- [ ] With the device's Reduce Motion on, the monsters stand still in their poses (no bob, no reactions).
- [ ] **Eating:** the food flies into the monster's mouth (changed in round 1 below, D103), it chews, reacts and thanks her, then 3 coins fly to the jar at the bottom right. Too long, or just right? Does she tap to skip it? On `7 + ? = 10` orders the monster eats all ten: does that read right?
- [ ] **Monster voices:** each monster has its own pitch (Gruffles deep, Mimsy and Zibbit high). Do they sound different enough on the iPad, iPhone and Android? Any voice that sounds odd or hard to understand?
- [ ] Each monster says hello the first time it comes in a service ("Hee hee. Hello!"). Charming, or does it slow the orders down?
- [ ] Sounds: a "boing" when a monster arrives, crunching while it chews, a "ting" for each coin, Chompers' burp. Any too loud or annoying?
- [ ] A finished service now ends with a 5-coin tip: a 6-monster service shows 23 coins on the closing sign.
- [ ] **Service length:** time a few whole services (6 monsters) from the first order to the CLOSED sign. This sets the play-time limit's "last customer" timing in M12 (D124).
- [ ] Smoothness on the real iPad: food and coin flights, monster reactions, the café background. (A 4× slowed desktop CPU showed no dropped frames, `docs/perf/M2-throttle.md`, but only the device can tell.)
- [ ] Not yet in M2, so not a bug: progress and coins reset on reload (M3a saves them); no shop yet (M4).
### M2 feedback round 1 (D102, D103)
- [ ] On the grown-ups' screen, change a stage (e.g. Perfect Ten S3 → S1) and an operations picker, then tap *Back to the café*: does it respond? Do *Open the Café* and the gear work afterwards, also after leaving with the back gesture?
- [ ] **Eating:** all the food now flies into the mouth together and the monster says just the answer ("Eight!"). Clear, and no more voices tripping over each other? On `7 + ? = 10` it says "Three!" while eating all ten: right, or should it say "Ten!"?

- [ ] Skim `docs/CONTENT_REVIEW.md` (sample orders, spoken lines and Pip's demos for A1–A3, and the monsters' lines). Anything that reads oddly aloud?


Notes (owner, 2026-11-10, rounds 0–1): green answer on the ticket: keep. Subtraction balance: fine for now, keep watching. Warm-up ghost hand: needs more testing. Coin jar, monsters, voices, tip (23), service length and smoothness: fine. Stage picker fix works. "Three!" (the answer) is right. Content review: nothing odd. Reduced Motion: not tested yet. Acted on in round 2 below (D104–D110).

### M2 feedback round 2 (D104–D110)
- [ ] **Perfect Ten at S3/S2, missing numbers** (`7 + ? = 10`, `? + 5 = 10`, `10 − ? = 6`): the empty spots up to ten have a dashed orange outline (for `10 − ?` the items to take away have orange rings). S3 counts only the orange group, from one. A wrong serve says "Two more… I wanted three. One more!" / "Three taken away… I wanted four.", and the monster eats only the orange group and says its number. Does it make sense now, or should these orders appear only at S1/S0 (D104)?
- [ ] **Pip's help on these orders:** CountTogether and the demo now go "Seven." / "Three empty spots." / "one, two, three" / "Seven and three more makes ten!". At **S1**, Pip shows this in the bubble, the tray stays empty, then she builds just the three (D105). Clear?
- [ ] The filled-in answer is now orange on missing-number orders (green on the others), so the 10 stays the only green (D106).
- [ ] **Closing time:** the coin number ticks up by one with a ting each, slowly then faster (≈ 4 s for 23), then "You earned twenty-three coins! Great job, chef!". The buttons appear only afterwards; a tap during the count jumps to the total with no speech (D107). Pace right? Are the tings heard on the iPad?
- [ ] **Returning monster:** the line now grows only when the next monster comes in: the silhouettes shuffle right and a new one walks in from the door (D108). Does it read as "someone got back in line"?
- [ ] **Sounds (D109):** a boing before each monster speaks, a crunch after it says the answer, a ting per coin after its thanks. Do you hear all three on the iPad, iPhone and Android now? (If not, tell me which and on which device.)
- [ ] **Art (D110):** Blobbo's new reaction (blushes, giggle-hops, tiny hearts and bubbles) vs. Wobbleton's puddle; the new door on the left wall and the hanging wooden sign (leave button); no string lights (they return as a shop item); the full-body Pip on the Help button; Mimsy's shorter hello ("Hello, dear chef!").
- [ ] At the end of a service the eaten food no longer comes back on the tray during "All done!".

## Counter layout (D114–D123; before M3a)
Screens: `docs/screens/counter/`. Play one service on the iPad and one on a phone.
- [ ] Does it feel like standing behind the counter? Is the monster easy to see full height, and does the ticket still read as its order?
- [ ] Waiting line in the top bar: can the child tell how many are left? After a Pip-helped order, does the returning monster (blue arrow badge) hop in at its place as the next monster comes in, and does it come back when expected?
- [ ] Coins fly up into the jar at the top right: easy to follow? The line walks left into the little café, away from the jar and the leave sign (D120, D121): does that read right?
- [ ] Pip pops up from behind the counter (no box on the hat button) and sinks back; the line stays put.
- [ ] Basket side: set it to Left in the playtest tools (gear), start a service: basket left, Pip and the bell right, digits still 0–9 left to right. Is dragging from the basket comfortable for each hand?
- [ ] A3 subtraction `10 − ? = n`: the taken-away row sits where the basket was; is it clear where the removed food went?
- [ ] S0: Pip and the bell above the digits; Peek lifts the cloche with the lid between tray and basket. After two misses at S0, only the two picture choices show (the pad hides, D122).
- [ ] Frame rate on the real iPad with the idling minis (speed test budget D113).
- [ ] Splash, Home, Menu and Results over the counter (D123; shots `docs/screens/counter/splash|home|menu|results-*`): does going Home → Menu → service → Results feel like one café? Are the chalkboard dish tiles easy to read and tap? Is the gear still easy for a grown-up to find, and hard for the child to hit by accident?

## M2b — Device speed test (D112; no child needed, about 2 minutes per device)
How to run: open the app from the **Home Screen icon**, tap the gear, hold the circle for 2 s, scroll to **Speed test**, tap *Open the speed test*, then *Start*. Before starting: Low Power Mode off, Reduce Motion off (Settings → Accessibility → Motion), landscape, don't touch the screen until the results show. When done, tap *Share results* and send me the text (or paste it here).
- [x] **iPad 7th gen** (this one sets the budget): results text sent 2026-11-12 → budget 4,800 on screen, 650 moving (D113). It also showed iPadOS 18.7, so the D111 baseline check is done.
- [ ] iPhone 17 (for information): results text sent.
- [ ] Pixel 10 Pro (for information; open the gear the same way): results text sent.
- [ ] Did the screen dim or lock during the run, or did anything else go wrong?
- [ ] While it ran, did the moving monsters look smooth to your eye at the step it called "smooth"?


## M3a — Progress is kept; stage and operations per dish
Use the **Home Screen app** on each device (a Safari tab keeps separate progress on iOS). The first time this build opens, the stage/operations you set in the old playtest picker carry over (D125).
- [ ] **Coins stay.** Play two or three orders, then swipe the app away (kill it) and reopen. The jar shows the coins the child saw fly in. Notes:
- [ ] **Continue dinner service?** After that reopen, the question appears on Home (Pip asks it aloud). *Keep cooking* picks up at the next monster in the same line-up; *Not now* gives a normal Home, and it does not ask again. Is the question clear to the child, and should she answer it or you? Notes:
- [ ] **Close the café** (door sign → Close the café) keeps the coins and goes Home without asking at once; the next launch asks. Is that the right moment, or should it ask every time Home opens? Notes:
- [ ] **Stage and operations knobs.** Gear → hold the circle → *Skills*: change a dish's stage (S3 Guided … S0 Numeral) and operations (both / addition only / subtraction only). The next service of that dish uses it; a running service does not change. Are these the right knobs, named so you understand them? Notes:
- [ ] **Progress list** (same screen): after a few services, do the numbers match what you saw (services, problems, first try, Pip helped)? Boxes move only for a right first answer at S1/S0 (so at S3 they stay put). Is anything missing that you would check every week? Notes:
- [ ] **Storage** (same screen): "Kept safe by the browser" should say *yes* for the Home Screen app on the iPad and iPhone (it may say *no* in a Safari tab), and "Space used" shows a size. Notes per device:
- [ ] **Two devices stay separate.** Progress on the iPad does not appear on the phone (syncing is Export/Import, M3b and M7).
