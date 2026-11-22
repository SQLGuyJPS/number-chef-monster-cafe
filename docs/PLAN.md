# Build plan — Number Chef: Monster Café

Status: **approved by the owner 2026-11-05** (estimate, work order and the §2 resolutions, recorded as D48–D59). **M0 done 2026-11-05.** **M1 done 2026-11-05**; M1 playtest rounds 1–7 and the gear popup recorded in PLAYTEST.md (last 2026-11-09). **M2 done 2026-11-10** (started 2026-11-09); waiting for the M2 playtest. **M2b (device speed test, D112) added by the owner and done 2026-11-12**; the iPad result set the SVG budget (D113, 2026-11-12). **Play-time limit moved from M3b to Tier 2 milestone M12, postponed indefinitely (D124, 2026-11-14).** **M3a done 2026-11-14** (D125); M3a playtest rounds 1–3 applied and merged 2026-11-19 (D126–D133). **M3b done 2026-11-19** (D134–D136); waiting for the M3b playtest. Tier 1 is complete. **M13 Recorded voices planned 2026-11-21** (D139–D142, §6). Source of truth stays `docs/SPEC.md`; this file holds the work order, the risks, the authoritative hour estimate (D36, D44) and the acceptance checklists that get ticked as each milestone closes.

---

## 1. Hour estimate (agentic build hours)

| Milestone | SPEC §14 indicative | This plan | Why it differs |
|---|---|---|---|
| M0 Foundations | 2 | **2.5** | PWA + CSP-in-prod + rotated stage + back guard + portrait e2e is a lot of plumbing to get green on two browser engines. |
| M1 Core loop (incl. layout mock) | 3.5 | **5.0** | 0.5 mock + engine (generators, tray, check, demos, attempt flow) + tray UI with drag + all four stages incl. S0 cloche help path + TTS + e2e. Densest milestone. |
| M2 Café service | 3.25 | **5.0** | Six monsters × five expressions is the single biggest art job (~1.5 h); session builder with requeue rules is test-heavy; full e2e device matrix + CDP drag. |
| M2b Device speed test | — | **1.5** | Added by the owner (D112): `?speedtest` screen, two ramps, smooth rule, report and share, unit + quick e2e. |
| M3a Persistence + fact boxes | — | **2.0** | Event log, replay ≡ applyEvent property test, IDB stores, resume, minimal Skills list. |
| M3b Hand-off ready | — | **1.5** | Gate, minimal parent area, export/replace import/reset. The play-time limit (was ≈ 1.5 h of the old 3.0) moved to M12 (D124). |
| **Tier 1 total** | ≈ 10 (guide) | **≈ 17.5** | |

The 10 h guide is exceeded (allowed by D44). The figure excludes fixes from each playtest (SPEC §14 says each milestone starts with them); budget ~0.5 h per round. The estimate is driven by what the spec requires, not by optional polish; I have not cut scope to fit. If you want it shorter, the cheapest levers are yours to choose (e.g. fewer monsters in M2, deferring the 4× CPU throttle report), and each would need a DECISIONS entry.

Tier 2 (rough, re-estimated when you pick one): M4a 3.5 (shop with stand-in art, incl. crates, D151, D155) · M4b about 3–4 over five art batches plus your reviews (D155, D156) · M6 Wish Jar 1.0 (fast follow-up to M4, D149) · M5 3.5 · M7 3.0 · M8 2.5 (incl. layout mock) · M9 1.5 · M10 2.0 · M11 2.0 · M12 1.75 (play-time limit, postponed indefinitely, D124) · M13 4.0 agent + about 2.5–3.5 h of the owner's recording and listening (§6) · M14 Deliveries & Themed Sets · M15 Monster Wardrobe · M16 Monster Album · M17 Treat Time · M18 Café Staff (D157) (estimated when picked; content-heavy, mostly art).

---

## 2. Ambiguities and gaps found (proposed resolutions)

None of these re-open a decided item. On approval I record each accepted one as a DECISIONS entry (D48+). Items marked **decision** need your answer; the rest I will just do as proposed unless you object.

1. **S0 number pad does not fit the bottom band — APPROVED by the owner 2026-11-05.** §5.4 puts ten digit buttons ≥ 112 logical px (≈ 1192 px with 8 px gaps) in the bin area, but Pip's hat sits bottom-left and the bell bottom-right, leaving ≈ 1000 px. *Proposal:* at S0 the digit row sits in the tray band (y ≈ 400–512) with the answer display, backspace and Peek above it (y ≈ 310–390); the bottom band keeps Pip's hat and the bell. When Peek, Worked or FollowMe lifts the cloche, the full-size S3 tray temporarily takes the tray band (FollowMe needs ≥ 44 CSS px cells) and the digit row returns for the final typing (D41). I add an S0 frame to the M1 layout mock so you can see it before anything is built.
2. **WebKit in the cloud environment — DECIDED 2026-11-05.** Only Playwright's Chromium is pre-installed in the cloud container. WebKit was installed and verified there (iPad gen 7 landscape touch tap passed), and the owner added `npx -y playwright@1.63.0 install --with-deps webkit` to the environment's setup script, so every new session has it next to Chromium in `/opt/pw-browsers`. The project therefore **pins `@playwright/test` to exactly 1.63.0** so it finds both pre-installed browsers (bumping it means changing the setup script line too). All Chromium and WebKit projects run in every session that has the browsers: the cloud environment (via the setup script) and the owner's Windows machine (D80). If WebKit is missing in a session (setup script failed), report that rather than skipping silently. Playwright WebKit is close to iPad Safari but not the same; real-device checks stay in PLAYTEST.
3. **`factKey` scheme for missing-amount forms.** §3.1 gives examples but no rule. *Proposal:* `skill:form:operands`; addition keys sort operands (`A2:+:3,5`); `a+?=c` and `?+a=c` share one key `A4:?add:a,c` (they are commuted partners, so they share a box per §4.1 step 4); `10−a=?` (`A3:-:10,a`) and `10−?=a` (`A3:?sub:10,a`) are separate keys. Consequence: A3's canonical add/sub share is 9 : 18, so with `ops = both` the ±1 balance target for A3 is about one third addition (D43b).
4. **Coins before M3a.** M2 shows coins in the jar but persistence is M3a. *Proposal:* M2 keeps the jar in memory (a reload resets it); M3a starts writing the frozen `coin` events. PLAYTEST.md for M2 says so. The M2 warm-up "shown once" flag already uses the `meta` store (D47i), so the warm-up does not repeat after a reload.
5. **Where the `?debug` stage/operations picker stores its values (M1–M2).** *Proposal:* in the per-device `settings` store skeleton under a `debugSkillConfig` key, so they survive reloads during playtests; M3a ignores and deletes the key once `skillConfig` events exist. *Amended by D125:* the first M3a boot turns it into `skillConfig` events, then deletes it.
6. **Home gear before M3a.** §5.2 says the gear opens the Skills list from M3a. *Proposal:* the gear renders but does nothing in M2 (long-press has no target yet); stage changes go through `?debug`. *Superseded by D94:* before M3a the gear's 2 s long-press opens the playtest tools (same content as `?debug`).
7. **"Activate the waiting service worker on Home when idle" has no threshold.** *Proposal:* activate on cold launch, or after Home has had no input for 30 s. Never on any other screen (e2e: waiting worker mid-service does not reload).
8. **Results tally "by ones, then by fives for > 10" — where it ends.** *Proposal:* ones to ten, then fives, and the last number is always the exact total ("…fifteen, twenty, twenty-three!").
9. **Tap-to-skip during the eat lock (OPEN_ITEMS #9).** Using the default: skip taps are exempt from the animation lock; every other tap is still ignored while the lock is held.
10. **Frames2 in Tier 1.** A1–A3 never exceed 10, so Tier 1 only renders `frames1` on screen. The tray model, `toTrayTask` and `check` support `frames2` from M1 (tested), and the M1 mock shows the two-frame layout so M5 has no surprises.
11. **Service-worker registration under the CSP.** `vite-plugin-pwa`'s default inline registration script would be blocked by `default-src 'self'`. *Proposal:* `injectRegister: null` and register from app code via `virtual:pwa-register` (no inline script).
12. **Dependencies beyond SPEC §2 (needs a DECISIONS entry per CLAUDE.md).** Dev-only tooling the spec implies but does not list: `tsx` (to run the TS scripts cross-platform), `cross-env`, `@vitejs/plugin-react`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-config-prettier`, `fake-indexeddb` (IDB unit tests), `@types/react*`. Icons for M0 are rasterized with the Playwright Chromium already needed for e2e, so no `sharp`. No runtime dependencies beyond §2 (`react`, `react-dom`, `idb`, `zod`, `@fontsource/andika`, `vite-plugin-pwa`). One entry covers all of them.

---

## 3. Risks

### 3.1 Platform risks (D37, all to be handled as written)
- **CSP only in production builds**, with `build.assetsInlineLimit: 0` so font subsets stay files (`font-src` falls back to `'self'`, a `data:` font would be blocked). A build test asserts the meta tag exists in `dist/index.html` and is absent in dev; an e2e asserts zero CSP violations and zero external requests.
- **Back guard must be pushed inside a user activation** (the Splash tap) and again after each in-app navigation, or Chrome skips the entry and back leaves the app.
- **Export sharing**: `navigator.canShare({files})` → file share; else `text/plain` share with a `.json` name; else download link. Must run inside the tap. Import `<input type=file>` uses a permissive `accept` so iOS Files does not grey the file out.
- **Speech timeout** `clamp(1200, 400 + 90·chars/rate, 8000)` ms; iOS may never fire `onend`. Tuned on the real iPad at M1/M2.
- **Noto Color Emoji in e2e**: present in this container; on your Windows machine Segoe UI Emoji renders instead. Emoji appearance is judged only on real devices.
- **4× CPU throttle run** (M2) is a report, not a gate.
- **"Installs to Home Screen"** is your PLAYTEST check, not agent acceptance.

### 3.2 iOS Safari audio, speech and storage
- WebAudio is suspended until a gesture and again after backgrounding → `resume()` on every `pointerdown` when not `running`.
- Silent switch mutes WebAudio unless `navigator.audioSession.type = 'playback'` (iOS 17+; every target iOS device has it since D111, feature check kept).
- `speechSynthesis` needs priming inside a gesture; `cancel()` before each non-queued line; voices arrive late (`voiceschanged` + retries). The game must stay fully playable with no voices (captions always on).
- Storage eviction after 7 days applies to Safari tabs, not Home Screen apps; tab and installed app have separate storage → "install before first play" in README and PLAYTEST (no detection code).
- `navigator.storage.persist()/estimate()` missing before Safari 17 → feature-detect, show "not available on this device" (should not happen on the D111 devices).
- Never await a non-IDB promise inside an IDB transaction (Safari auto-commits). One transaction per completed problem.

### 3.3 Touch handling
- iOS ignores `user-scalable=no` → also block `gesture*` events and use a non-passive `touchmove` `preventDefault` on the root.
- Single active pointer; palm rejection by contact size is a no-op on iOS, so the single-pointer rule is the real defence.
- Playwright has no touch drag: drag tests use CDP `Input.dispatchTouchEvent` (Chromium only); every flow also works by tap, which is what most e2e tests use.
- Flights are visual only and never lock input (D42); fast repeated taps must each count.

### 3.4 Rotated portrait stage
- All pointer math through `toStageCoords`; a stray `clientX` read breaks portrait silently → ESLint `no-restricted-properties` on `clientX/clientY/pageX/pageY` outside the input module.
- `visualViewport` resize events during rotation on iOS can arrive late or twice → derive orientation from the latest event only, never keep game state in the layout layer.
- Safe-area remap in rotated mode is easy to get backwards → unit tests for all four insets.
- The parent area is not rotated; switching between rotated stage and unrotated parent area must not lose state.

### 3.5 Other risks
- **Local testing on the iPad over the LAN** (`vite --host`, `http://192.168…`) is not a secure context: no service worker, no `crypto.randomUUID` (the spec's 128-bit fallback covers ids). Real-device checks should use the Pages URL.
- **IndexedDB open failure** (private mode, old WebKit bugs) → run on `MemoryStorage` with a parent-only banner.
- **Estimate risk**: M1 and M2 are the densest; the art in M2 is the most likely to run long.
- **E2E flakiness from animations** → `window.__ncmc` fast-forward hook (only with `VITE_E2E=1`; a test asserts no `__ncmc` in the production bundle).

---

## 4. Tier 1 work breakdown

Order inside each milestone is the order I will work in. Every milestone ends with the Definition of Done from CLAUDE.md, then a stop.

### M0 — Foundations (2.5 h)
1. Scaffold: Vite + React 18 + TS strict, `base: './'`, ES2020 target, `assetsInlineLimit: 0`; `package.json` scripts exactly as in CLAUDE.md (cross-platform Node, `cross-env` for `VITE_E2E`).
2. ESLint + Prettier: engine purity rule (`src/engine/**` may not import React or touch `window`/`document`/`indexedDB`/`Date.now`/`Math.random`), `localStorage.clear` ban, raw `clientX/Y` ban outside the input module.
3. Vitest set-up; namespacing unit test (greps `src/` for `caches.delete` / `indexedDB.deleteDatabase` / storage keys without `ncmc`).
4. Stage: 1280×720 safe box scaling, `100dvh`, safe-area insets; rotated portrait (`translateX(W) rotate(90deg)`) with the pure `toStageCoords` + unit tests (both orientations, inset remap); 6 s turn cue; `?rotate=off`.
5. Touch hardening layer (§2.3) and back guard (pushed from the Splash tap and after each navigation; `popstate` → "Take a break?" with *Keep cooking* only outside a service).
6. Andika font, palette custom properties, `src/app/metrics.ts`.
7. `Storage` interface, `MemoryStorage`, `IdbStorage` skeleton (`ncmc-v1`, all stores created, `meta` with `schemaVersion: 1`, `deviceId`), empty migration list + harness test.
8. PWA: manifest (landscape, standalone, `./` scope), `vite-plugin-pwa` with `registerType: 'prompt'`, `cacheId: 'ncmc'`, `injectRegister: null`; icons rasterized by `scripts/make-icons.ts` via Playwright Chromium from a placeholder monster SVG.
9. CSP meta injected in production builds only (small Vite plugin) + build test.
10. `?debug` screen (version, build date, storage state); `VITE_E2E` hook skeleton; production-bundle-has-no-`__ncmc` test.
11. Playwright config (`@playwright/test` pinned to 1.63.0, §2 item 2) with M0/M1 projects (Chromium + WebKit, run in every session, local or cloud, D80). E2E: portrait tap hits rotated control, rotate back keeps state, back shows dialog, offline reload (Chromium), zero external requests, no zoom/scroll/long-press menu.
12. `.github/workflows/deploy.yml` (checkout → setup-node → `npm ci` → `npm run check` → build → upload-pages-artifact → deploy-pages).
13. PLAYTEST.md created (M0 owner checks: Pages URL installs and launches standalone on iPad, iPhone, Android); screenshots; commit.

**Accept (SPEC §14 M0)**
- [x] `npm run check` green
- [x] offline reload works
- [x] no zoom / scroll / long-press menu
- [x] portrait: stage renders rotated and a tap on a rotated control hits the right target (e2e, portrait viewports)
- [x] rotating back removes the transform with no state loss
- [x] back gesture / edge-swipe does not leave the game (e2e: `popstate` shows the break dialog)
- [x] zero external requests
- [x] version shown on the `?debug` screen (production builds too, not reachable from child UI)
- [x] ESLint blocks `localStorage.clear`
- [x] Owner check (PLAYTEST, not agent acceptance): installs to Home Screen on iPad/iPhone/Android and launches standalone

### M1 — Core loop vertical slice (5.0 h)
**Step 1 — static layout mock (0.5 h), then STOP for your OK.** Static React screen with no interaction, screenshots at 1194×834 and 844×390 showing: a `frames1` task at S3 with blue prefill, orange added items and emoji on tinted cells; a `frames2` tray (for M5); the CountTogether bubble (one and two 36-px mini frames vs the 400 px monster zone); the **take one back** button slot beside the bin; the **taken-away row** slot beside a `frames1` tray; the ticket with role colours and dashed blank; the **S0 layout** from §2 item 1 with the cloche. Tap-size measurements annotated.

**Step 2 — after approval:**
1. Engine: `rng` (mulberry32), `numberToWords` (0–100, exhaustive test), phrase table v1 (words only).
2. Engine: `Problem` type, A1/A2 generators + `pool()`, `factKey` scheme (§2 item 3), strategy tags, difficulty ordering for A1/A2.
3. Engine: tray model (fill order, remove-from-end, locked prefill, tap-to-count, remove-mode undo, capacity, taken-away row), `toTrayTask`, `check`; property test: every pool item × every stage agrees with `answer`.
4. Engine: `buildDemo` for count-on, count-back, doubles, near-double; test: every demo ends in the expected tray state.
5. Engine: attempt state machine (§3.4) incl. Help paths, PlateCount line selection, the four outcomes; frozen `attempt` and `coin` event types (§11.2) in `engine/events.ts`.
6. UI: ten-frame + food emoji renderer, bin (tap and drag through `toStageCoords`), take one back, ticket, bell (400 ms guard, disabled at start state), placeholder monster, Pip's hat.
7. UI: flow screens — PlateCount, CountTogether bubble, Worked (DemoPlayer), FollowMe (pulsing steps, pulsing bell, child presses).
8. UI: S1 and S0 (digit row, two-digit display, backspace, Peek/cloche, S0 help path).
9. Audio: `speech.ts` (`speak` resolves on end or timeout, voice pick, `cancel()` quirk, latest-wins counting), minimal SFX (place, remove, bell, hm).
10. `?debug` stage/operations picker.
11. `lint:content` v1 (A1/A2 pool sizes, independent evaluator, spoken-text rules, emoji allowlist with `scripts/emoji-versions.json`).
12. E2E (Chromium landscape + one WebKit iPad project, run in every session, D80): stages, fill order, remove-from-end, locks, wrong→wrong→demo→FollowMe, Help-then-wrong → Worked, speech stubbed to never end, 844×390 tap targets; M0 portrait test still green.
13. Screenshots, PLAYTEST, DECISIONS, commit, stop.

**Accept (SPEC §14 M1)**
- [x] layout mock approved by the owner before interaction (2026-11-05, rev 4; layout in D62–D65, `SERVICE` in `src/app/metrics.ts`, shots in `docs/screens/M1/mock/`)
- [x] unit tests for generators / tray / check / demos pass (`tests/unit`: generators, tray incl. every pool item × every stage, demos end state, attempt machine, events, number words)
- [x] all four stages playable for A1 and A2 (incl. S0 help path on the cloche tray); stage/ops via the `?debug` picker
- [x] fill order, remove-from-end and lock rules (§3.3) verified by e2e (Chromium landscape + one WebKit iPad project)
- [x] `toStageCoords` unit-tested for portrait; M0 portrait tap test still green
- [x] no auto-serve (FollowMe pulses the bell, the child presses it)
- [x] wrong → wrong → demo → follow-me completes
- [x] Help at attempt 1 then a wrong serve goes straight to Worked
- [x] speech never blocks the flow (`speechSynthesis` stubbed to never fire `end`, every M1 e2e; one flow at real time)
- [x] 844×390 tap-target assertions pass (`m1-taps.spec.ts`, WebKit iPhone 13)
- [x] `attempt` and `coin` event shapes fixed (`src/engine/events.ts`, key-set test)

### M2 — Café service (5.0 h)
1. *(done 2026-11-09, D97)* Engine: session builder (§4.1): pool + ops filter, box weights, new-fact cap and difficulty order, no-repeat window (requeues exempt), food/monster rules, add/sub balance, requeue placement and append, pool-size guard; determinism tests.
2. *(done 2026-11-09, D98)* Engine: A3 generator + make-ten demo; taken-away row for `10 − ? = a`; `known` preset (in step 1).
3. *(done 2026-11-09, D99)* Service state machine: 6 orders, queue silhouettes, requeue = same monster returns, warm-up order with ghost hand (flag in `meta`), coins in memory (§2 item 4). The jar UI comes with Home in step 6.
4. *(done 2026-11-09, D100)* Art: `MonsterSpec` data + six hand-authored SVG monsters × idle/delight/eat/puzzled/sleepy, reactions, reduced-motion static poses; Pip (hand-authored art replacing the placeholder Pip from D90); café background with fallback placeholders.
5. *(done 2026-11-09, D101)* Eat sequence (≤ 4 s, skippable), coin flight, all SFX (§8.3), voice lines. On a correct serve the ticket's blank becomes the answer in green (D96; done first, 2026-11-09).
6. *(done 2026-11-09 except the art)* Screens: Home (coin jar, in memory until M3a), Open the Café), Menu board (Little Menu only, A1–A3 tiles; no last-played glow, D83), Results (CLOSED sign, spoken tally, monsters served as faces, Another service / Change dish / Home). Faces show the monsters served.
7. *(done 2026-11-09)* `lint:content` monster validation (palette contrast, bodies/extras, favourites, reactions, voice below Pip, lines, all five expressions drawn and distinct); `content:table` → `docs/CONTENT_REVIEW.md`.
8. *(done 2026-11-10)* E2E full matrix (Chromium iPad Pro 11 + Pixel 7, WebKit iPad gen 7 + iPhone 13, portrait variants), CDP drag incl. rotated portrait, ≤ 2 taps to first order, Another service / Change dish, monster screenshot grid, throttle report.
9. *(done 2026-11-10)* Screenshots, PLAYTEST (service length timing, monster appeal, voices on three devices), commit, stop.

**Accept (SPEC §14 M2)**
- [x] deterministic service from seed (`tests/unit/session.test.ts`)
- [x] no adjacent repeats; at most 3 new facts per service (500 seeds × A1/A2 × ops)
- [x] each monster renders at all five expressions (screenshot grid `docs/screens/M2/monster-grid.png`; `m2.spec.ts`; lint:content)
- [x] eat + react ≤ 4 s and skippable (`tests/unit/eat.test.ts` for every answer 1–20; `m2.spec.ts` in real time)
- [x] reduced-motion variant verified (`m2.spec.ts` gallery test: no monster animation, still poses)
- [x] 4× CPU throttle frame report produced (not a gate): `docs/perf/M2-throttle.md`
- [x] full e2e device matrix incl. CDP drag in rotated portrait (`m2-matrix.spec.ts`, six projects incl. Pixel 7)
- [x] first run reaches the first order in ≤ 2 taps after Splash (`m2-matrix.spec.ts`)
- [x] Another service repeats the skill; Change dish returns to the menu (e2e)
- [x] content table generated (`docs/CONTENT_REVIEW.md`)
- [ ] correct serve shows the answer in green in place of the dashed blank (D96, e2e)

### M2b — Device speed test (1.5 h, added by the owner, D112)
1. *(done 2026-11-12)* `speedStats.ts` (pure): plan, smooth rule, ramp verdict, budget, report text; unit tests.
2. *(done 2026-11-12)* `?speedtest` flag; `SpeedTest.tsx`: intro with warnings, the real stage with the café, a chewing monster, flying food and still/moving copies; calibration; warm-up and frame recording per step; one retry; Stop and backgrounding end the run; wake lock; results table, report text, Share / copy.
3. *(done 2026-11-12)* `countSvgElements` (`src/app/svgCount.ts`); a button in the playtest tools (`?debug` and the Home gear).
4. *(done 2026-11-12)* `speedtest.spec.ts`; screenshots in `docs/screens/M2b/`; PLAYTEST; commit, stop.

**Accept (SPEC §14 M2b)**
- [x] `check` green; unit tests for the smooth rule, budget and report (`tests/unit/speedStats.test.ts`)
- [x] quick-mode e2e runs both ramps and reports, zero external requests (Chromium iPad Pro 11, WebKit iPad gen 7, WebKit iPhone 13)
- [x] Stop ends the run early and still reports (e2e)
- [x] no link from the child UI; the playtest tools open it (e2e)
- [x] owner's iPad result recorded (`docs/perf/M2b-ipad7-speedtest.txt`); budget set by D113 and checked by `budget.spec.ts`

### Counter layout change (owner request before M3a) — mock approved 2026-11-13 (D114–D119); built, awaiting the owner's playtest
**Build (done):** the service runs on `COUNTER` (`counterLayout.ts` picks the rects per order and mirrors them for a left-handed child); the room and counter are `CounterScene` (every child screen since D123); status bar with door sign, coin jar (coins fly up into it), waiting line of real minis in plan order with requeue badges at their real places (controller `line`, D118; the line slides one place as the front monster goes to the counter and a returning one hops in, D108) and the shop door; Pip pops up from behind the counter with no box on the hat; the taken-away row replaces the basket; S0 pad in two rows; the lifted cloche shifts the tray; "Basket side" in the playtest tools (D115). The old `SERVICE` table is gone. Tests: unit (`counterLayout`, line position after a requeue), e2e tap sizes on both sides, left-handed drag and taken-away row, the returning monster's badge; shots in `docs/screens/counter/`. Open for M5: the two-frame tray at S0 has no room for the lifted lid (two-frame skills are not built yet).

**Owner review round (2026-11-14):** line flipped to walk left into the little café beside the jar, and the lifted cloche lid centred by eye (D120); push to the working branch after a change is now allowed (CLAUDE.md). **Splash and Home over the counter: mocked, not built** (`?mock&v=splash`, `?mock&v=home`; shots `docs/screens/counter-front/front-*`). Splash: the cream board is the café's name sign, Blobbo behind the counter, "Tap to start" on a paper card on the counter. Home: the board carries the coin jar in its service spot, the name and the gear (top-right as before, D95); Blobbo and Pip behind the counter; Open the Café on the counter top, with room beside it for Decorate (M4). Owner: Splash and Home look good overall. Second round: coin jar and leave sign moved to the right of the bar (D121); **Menu and Results mocked** (`?mock&v=menu`, `?mock&v=results`): Menu has "Little Menu" on the sign, the jar on the right, Blobbo and Pip in the room, and the three dishes as little chalkboards standing on the counter beside Home; Results flips the sign to CLOSED, keeps the jar, puts the coin tally in the room above the served monsters lined along the counter's far edge, and the three buttons on the counter top. Owner approved; **built** (D123): every child screen uses `CounterScene` (geometry `FRONT` in `metrics.ts`); the mock keeps only the service variants. Shots: `docs/screens/counter/` (`splash`, `home`, `menu`, `results`, `break-dialog`, `gear-hold`). Open for M5: nine menu tiles and the Big Menu tab need a layout on the counter.

Service screen seen from behind the counter. Mock: `?mock` (or the button on `?debug`); switches `v=s3|taken|frames2|s0|cloche|offer|count`, `basket=right|left`, `line=1..10`. Geometry: `COUNTER` in `src/app/metrics.ts`. Shots: `docs/screens/counter-mock/`. Fit is tested: `tests/unit/counterLayout.test.ts` (no overlaps, inside the band, both sides) and `tests/e2e/counterMock.spec.ts` (every variant and side ≥ 44/56 CSS px at 844×390; element counts within D113).

Bands: status bar y 0–120 (shop icon ← waiting line, coin jar, leave sign; D121) · room y 120–432 (door and street window, table and chairs, caption · monster · ticket) · counter y 432–720 (one row).

Owner's choices so far: monsters stand full height (the waist cut was removed after the build); the street window stays beside the door (tried behind the monster in rev 2, not kept); front-view chairs; Pip's hat with no box, just a soft shadow; two-frame option A with a two-row heap.

| Check | Fits? | Proposal |
|---|---|---|
| S3/S2/S1 one frame | yes | Pip 120 · bell 120 · tray 496 · basket 300 in one row; mirrored for left-handed |
| Two-frame tray (A5+, M5; Big Bites/A2 is one frame) | **no** as one row: 1016 + 300 + 2 buttons > 1280 | Owner's pick (A): the frames keep 88-px cells with gaps 4 and padding 8 (956 wide), Pip's hat sits on the bell in one column, the basket is an upright 172 × 200 crate with a two-row heap |
| Taken-away row | **no** beside the basket (1404 px) | The row takes the basket's place on missing-subtrahend forms: there the basket does exactly what the row does (D42a) |
| S0 number pad | yes | Pip, bell, Peek, display, backspace in the upper row; digits 0–9 below, same order on both sides |
| Cloche (Peek/Worked/FollowMe) | yes, tight | Tray shifts 64 px toward Pip; lid (112) between tray and basket |
| Help offer | yes | Two 220 buttons over the hidden tray; basket dims |
| Pip helper spot | yes | Pops up behind the counter under the caption (x 344–468) |
| CountTogether | yes | Same bubble as today; Pip and the small monster step left in front of the table; the line stays (it is in the bar) |
| 44/56 px minimums | yes | cells 47.7, Pip/bell 65, door/digits/lid 60.7 CSS px |

Waiting line: **real mini monsters, idling** (rev 1 planned head-only icons for the old 300-element budget; D113 lifts it to 4,800 on screen / 650 moving). Measured worst case, nine minis during CountTogether: 489 on screen, 300 moving. A long line squeezes its spacing to stay in the bar. A requeued monster stands at its real place (D43: 3–5 orders later) with a small circling-arrow badge, and still joins as the next monster comes in (D108).

Ticket fix found on the way (real game, not only the mock): the blank's dashed CSS border came out uneven at the corners in WebKit at phone scale (visible in `docs/screens/M2/service-s3-add-844x390.png`). The blank is now an SVG outline with 12 evenly spaced dashes (`BlankBox` in `ServiceParts.tsx`); M1/M2 e2e still green.

New per-device setting "Basket side: right (default) / left" goes in the gear tools when the layout is built. Decisions recorded: D114 layout, D115 basket side, D116 two-frame tray, D117 taken-away row in the basket's place, D118 waiting line, D119 ticket blank.

### M3a — Persistence and fact boxes (2.0 h) — built 2026-11-14, awaiting the owner's playtest
1. *(done 2026-11-14)* Engine: `replay` / `applyEvent` (`engine/replay.ts`), coin totals (§11.2), fact boxes (`nextBox`, D29 rules, preset at box 3), `skillConfig` last-writer-wins; property test applyEvent ≡ replay; `serviceEnd`/`skillConfig`/`buy` event shapes.
2. *(done)* Storage: events (read in (t, id) order), resume, state cache, settings, one snapshot; `commit` = one transaction per completed problem (`attempt` + `coin` + `resume` + cache); cache rebuilt when its count disagrees; `migrateStored` snapshots first. `Progress` (`app/progress.ts`) keeps the derived state in memory and writes in order.
3. *(done)* The service writes events through `onRecord`; the tip is `serviceEnd.tip` (not a coin event); `serviceEnd` partial on Close the café; coins persist.
4. *(done)* Resume: `engine/resume.ts` (zod-validated, plan by reference); row written at start and after each problem; offered once per launch on the first Home if < 2 h old; *Not now* clears it (D125).
5. *(done)* Grown-ups' screen: Skills list (stage + operations for A1–A3, events), simple progress list, storage status with `persist()` on open; the old `debugSkillConfig` becomes events once (D125).
6. *(done)* E2E `m3a.spec.ts`; screenshots `docs/screens/M3a/`; PLAYTEST; commit, stop.

**Accept (SPEC §14 M3a)**
- [x] `applyEvent` incremental equals full replay (property test, 300 random logs; shuffled and duplicated input too: `tests/unit/replay.test.ts`)
- [x] box transitions per outcome and stage (`nextBox`, preset 3 → 4 at S1); box weights already tested in `session.test.ts`
- [x] coins survive a resume and a killed app (`progress.test.ts`; e2e reload mid-service keeps the jar at 6 and finishes at 23)
- [x] reload mid-service offers resume; resume continues the stored order plan (same fact, monster and line; `m3a.spec.ts`)
- [x] per-skill stage and operations settings change the next service (e2e via the gear's Skills list)
- [x] migration harness test (`migrations.test.ts`; `migrateStored` with a fake migration in `progress.test.ts`)
- [x] storage persisted flag and estimate shown when available (e2e; "not available on this device" otherwise)

**M3a playtest round 1 (2026-11-17, D126, D127)**
- [x] Close the café clears the resume row; never offered back (e2e)
- [x] Support levels named and described; ops "addition and subtraction"; basket side after Progress, described, wider dropdown (e2e)
- [x] No known preset; tray (S3–S1) and number (S0) box sets; first-service new facts shared between operations; old state cache rebuilt (unit)
- [x] Chompers' teeth hang from the top lip (gallery screenshot)

### M3b — Hand-off ready (1.5 h)
The play-time limit moved to M12 (D124).
1. Parent gate (long-press 2 s, 6–9 × 7–9 on a number pad, 3 wrong → 30 s lockout, 5 min auto-lock); unrotated parent area.
2. Parent area: Skills list from M3a behind the gate; voice/speed/test; volumes; reduced motion; orders per service; basket side (already on the grown-ups' screen since D126).
3. Data: Export (SHA-256, share fallbacks), Replace-only import (snapshot first, zod, checksum, second multiplication prompt), Reset (snapshot first, keeps `snapshots`, `ncmc*` only), install help text.
4. E2E: gate lockout, export → reset → import round trip. Screenshots, PLAYTEST, commit, stop.

**Accept (SPEC §14 M3b)**
- [x] parent gate lockout and 5-minute auto-lock; not reachable during a service (`m3b.spec.ts`, `parentGate.test.ts`)
- [x] export → reset → import round trip; checksum verified (`m3b.spec.ts`: share sheet, text/plain and download paths; `backup.test.ts`)
- [x] Reset touches only `ncmc*` data and keeps `snapshots` (`m3b.spec.ts` with another app's IndexedDB and localStorage on the origin; `backup.test.ts`)
- [x] settings (orders 4/6/8, voice, speed, volumes, reduced motion) per device; install help text; screenshots in `docs/screens/M3b/`

---

## 5. Tier 2 outline (order picked by the owner)

- **M4 is two milestones (D155).** The shop's code ships first with labelled stand-in shapes, so the art can't hold it up; the art follows in batches, each one chat that stops for review. A later chat gets its context from `docs/ART_GUIDE.md`, the `?decor` contact sheet and the screenshots in `docs/screens/M4b/`, not from earlier chats.
- **M4a Coin shop** (3.5 h): `economy.ts` catalog (D148: tiers, colorways, 2,285 coins, D152, D157; the draft table and `npm run economy:sim` already exist, D150), colour-family palette tokens, shop screen with live preview and colour dots, Buy + confirm, `buy`/`equip` events, purchases visible in Service (stand-in shapes), the `?decor` contact sheet (D156); starter shelf and delivery crates (D151): crate arrival derived from the log and recorded when first seen (a `crate` event in the progress log, D154: the project's first schema change, so `schemaVersion` 2 with a migration and fixture test; export/import validation accepts it), one crate at a time from a backlog, the hold at 6 unbought, a small "a delivery arrived!" moment in the shop.
- **M4b Shop art** (about 3–4 h over five batches, D155, D156): batch 0 fills in `docs/ART_GUIDE.md` from the existing café art and draws one test piece per slot (Polka Dots, Checkerboard, String Lights, Garden window, Flower Vase, Neon OPEN), adds the decor lint check (colour families only; style is left to review, D158), then stops for your verdict on the look; batch 1 wallpaper + floor; batch 2 lights + window; batch 3 counter-top + wall art; batch 4 the guest monsters (Spindle, Drizzle). Each batch ends with the contact sheet at phone and iPad size and stops. Approved items are marked locked in the guide.
- **M6 Wish Jar** (1.0 h, D149): pin a wish, jar fill on Home and Results, Pip's generic wish line at Results (D153); how the wish is stored (event vs per-device setting) is decided when built.
- **M5 Rest of the Little Menu** (3.5 h): A0, A4–A8 generators, orderings for A4–A6, demos (teens, bridge, back-through-ten, make-ten variants), `frames2` UI, A5 whole-frame moves, FollowMe past 10. Counter-layout checks carried here: the two-frame tray has only run in the mock, so M5 must exercise it in the real service (drag and tap onto the tight cells, flights, eating, both basket sides); and the two-frame tray at S0 has no room for the lifted cloche lid (open question, decide when the first two-frame S0 skill is built); and nine menu tiles do not fit one counter row (D123).
- **M7 Full parent area + merge** (3.0 h): Merge import with dry-run summary, device label, Focus list, Starting-point editor, hide/show, heatmap, trouble spots, history, median S0 time, snapshots restore, two-context e2e.
- **M8 Big Menu** (2.5 h): static layout mock first (stop for OK), then tens shelf + ones frame, auto-bundle, two bins, B1–B2 generators/orderings/demos, two-digit pad.
- **M9 B3** (1.5 h). **M10 Polish** (2.0 h): accessibility, big-text captions, bundle report, Lighthouse (recorded voices moved to M13). **M11 Profiles** (2.0 h): `profileId` migration (first real migration), picker, per-profile preset.
- **M12 Play-time limit** (1.75 h; postponed indefinitely by the owner, D124): allowance model with injected monotonic and wall clocks (idle pause, grace cap in wall time, last customer, shorter service, tip rule, lock clears resume, boot check, refill modes, 60 s cue) and all §6.5 tests; locked Home, wind-down, lights dim + Pip yawn; limit setting with Start new session / Add time behind M3b's gate; e2e limit-off-never-locks and run-out → locked → reload → unlock → no resume offer. The `clock` IDB store already exists, so no IDB upgrade is needed.
- **M13 Recorded voices** (4.0 h agent + the owner's recording): detailed in §6.
- **Voice passes (D142).** From M13 on, every milestone that adds or changes spoken lines (M4a shop lines, M4b guest monsters, M5, M6's wish line, M8, M9, M14–M18 lines, playtest rewording) ships them on the TTS fallback, regenerates `docs/VOICE_SCRIPT.md`, and is closed by a voice pass after the owner's playtest: the owner records and builds the new clips, I check that `audio:todo` reports nothing missing for that milestone's dishes, then the next milestone starts. Budget about 0.25 h agent per pass.
- **M14 Deliveries & Themed Sets** (D149, D151): colorways round 2, four themed sets, set-complete surprises; content only, delivered by M4's crates. Re-run `economy:sim` with the real catalog.
- **M15 Monster Wardrobe** (D149): hats, skins, accessories for 8 monsters; per-monster equip; SVG budget check.
- **M16 Monster Album** (D149): album pages and friendship gifts.
- **M17 Treat Time** (D149): repeatable party treat.
- **M18 Café Staff** (D157): the Staff & pets slot moved out of M4: Pip as the free default, five animal staff drawn as characters to Pip's standard, idle loops and event reactions, up to 3 out; delivered by the crates. Re-run `economy:sim`.

---

## 6. M13 — Recorded voices for the Little Menu (D139–D142)

Goal: the monsters, Pip and the narrator speak every line the built dishes (A1–A3) use in the owner's recorded voice, stitched from clips (SPEC §8.4), with TTS only as a whole-line fallback. Numbers 0–20 are covered in full, so M5's dishes need only their new phrases.

### 6.1 Estimate

| Step | Who | Time |
|---|---|---|
| 1. Plumbing + `?debug` Voice test page, then STOP | agent | 2.5 h |
| 2. Record the spike script, build, listen on the iPad | owner | ≈ 45 min (≈ 10 min reading, labelling, one command, listening) |
| 3. Final inventory, full script, every speaker wired, then STOP | agent | 1.0 h |
| 4. Record and build the full set; check, report, STOP | owner, then agent | owner ≈ 1.5–2.5 h (≈ 150–250 clips: 25–40 min reading, the rest labelling and retakes); agent 0.5 h |

### 6.2 Step 1 — plumbing and the listening test (agent)
1. **Engine:** `PHRASE_SPEAKERS` (who says each phrase: monster, Pip or narrator) and `clipPlan(key, params)` with the clip ids of D141 and the clip transcripts; numbers carry a form (`lead` / `mid` / `end`) and pair clips are optional, so the listening-test outcome is a table change, not new code. Unit test: for every phrase key × every parameter in range (numbers 0–20, every food) and every monster line, the transcripts join to `phrase()`'s text.
2. **`npm run audio:todo`** (`scripts/audio-todo.ts`): collects every (voice, clip) the built dishes need; writes `docs/VOICE_SCRIPT.md` (sections: numbers, foods, connecting words, fixed lines, monster lines; each item a carrier sentence with the target clip in bold and numbered); lists clips missing from the manifest. `--spike` writes `docs/VOICE_SPIKE.md` instead.
3. **`npm run audio:build -- --src <folder>`** (`scripts/audio-build.ts`, pure helpers in a tested module): reads each WAV with its Audacity label export; matches label numbers to the script (reports missing, extra, duplicate); cuts with a small pad; trims silence; gentle high-pass and loudness normalization; pitch-shifts per voice; encodes AAC-LC 48 kbps mono to `public/audio/<voice>/<clipId>.m4a`; writes `public/audio/manifest.json` (durations included) and prints a size report. Adds `ffmpeg-static` as a dev dependency (D140). Masters default to a git-ignored `voice-masters/` folder.
4. **`src/audio/voice.ts`:** manifest, cache-first fetch, one-at-a-time decode queue, decoded-audio LRU capped at about 10 MB, silence trim at load, back-to-back scheduling on the audio clock with a crossfade, voice-volume gain, `interrupt`/cancel, latest-wins counting, resolve on end or a timeout from the clip durations.
5. **Line routing:** today the controller turns a phrase into text before `talk()`, and `Results`, `ResumeDialog` and `useService` call `speakText` with text. They pass a line (key, params, text) instead, so the voice layer can look up clips and fall back to `speakText` for the whole line. Captions are unchanged. The parent area's *Test the voice* stays TTS (it tests the TTS voice).
6. **PWA:** `m4a` joins the Workbox `globPatterns`; check the per-file precache limit; the e2e-only WAV test set is never in a production build.
7. **`?debug` Voice test page** (next to the sound test): for the spike lines, play side by side (a) stitched vs the one-take recording, (b) one number form vs three, (c) pair clip vs two clips; pick the voice (each monster, Pip, narrator); a crossfade slider (0–40 ms); each button shows the clips it uses; missing clips show "not recorded".
8. **Spike script** `docs/VOICE_SPIKE.md` (about 5 minutes of reading): numbers 0–10 in lead, mid and end carriers; "plus", "minus"; two food tails; "I see", "I wanted", "One more!"; "more!", "left!" and the pairs "two more!" … "five left!"; one-take references "Seven plus two cookies, please!", "Four minus one doughnuts, please!", "I see six… I wanted seven. One more!".
9. **Tests:** unit (clip plans, manifest schema, label matching, LRU cap, scheduling offsets with an injected clock); e2e `voice.spec.ts` on Chromium iPad Pro 11 and WebKit iPad gen 7 with the WAV test set: a recorded line plays its clips in order (hook), a missing clip gives whole-line TTS, a clip that never ends does not block the service, playback offline after precache (Chromium), zero external requests.
10. Commit, push, **STOP** with recording instructions for step 2.

**Step 1 status (2026-11-21): done.** Items 1–10 built and tested (D143–D147). Checks: `ffmpeg-static` installs in the cloud container; its Linux and Windows x64 binaries both have `rubberband` (D145); Playwright's Chromium and WebKit here decode AAC, e2e stays on the WAV set (D146). `npm run check` and the full e2e suite green; `tests/e2e/voice.spec.ts` on Chromium iPad Pro 11 and WebKit iPad gen 7.

### 6.3 Step 2 — the owner's listening test
1. Install Audacity (free). Record `docs/VOICE_SPIKE.md` in a quiet room, mic at a steady distance, at an even pace.
2. Mark each bold target with a region label (select it, Ctrl+B) whose text is its number; export the audio as WAV and the labels as text into `voice-masters/spike/`.
3. `npm run audio:build -- --src voice-masters/spike`, push to `main`, open `?debug` → Voice test on the iPad.
4. Tell me: is stitching acceptable next to the one take? One number form or three? Pairs or two clips for the counting lines? Which crossfade sounds best? Do the shifted voices (monsters, Pip) sound friendly, or should any pitch move?
5. I record the answers as a decision and adjust the tables.

### 6.4 Step 3 — full inventory and wiring (agent)
1. Apply the listening result to `clipPlan` and the voice pitches; settle the form for counting while building (`count.n`; the *end* form unless the test says otherwise).
2. Generate the full `docs/VOICE_SCRIPT.md` for A1–A3 and numbers 0–20, ordered for one sitting, with its clip count and estimated reading time.
3. Wire every speaker: monsters (orders, plate lines, arrive/thanks, Yum, the eaten total, the help offer, "I'm back!", the closing line), Pip (counting, CountTogether, demos, FollowMe, warm-up, resume question), narrator (Results total).
4. Recorded / TTS toggle on `?debug` (per device, an `ncmc` settings key).
5. E2E: a full service with the WAV test set, every line recorded (hook), nothing blocks; **STOP** for the owner's recording.

### 6.5 Step 4 — full recording and close
1. Owner: record `docs/VOICE_SCRIPT.md` the same way (several takes per section are fine; label only the keeper), build, push.
2. Agent: `audio:todo` reports nothing missing; `lint:content` passes the manifest; size report (per voice, total, precache) into `docs/perf/M13-voice-sizes.md`; Voice test page screenshots in `docs/screens/M13/`; PLAYTEST.md M13 section; accept boxes ticked; commit, push, **STOP**.

### 6.6 Risks
- **AAC in the test browsers:** Playwright's Chromium and its Linux WebKit may not decode AAC, so e2e uses a WAV test set; real AAC decoding is an owner check on each device (D141).
- **Pitch shift on Windows:** if `ffmpeg-static`'s build has no formant-preserving shift (the `rubberband` filter), step 1 picks another tool, records it as a decision, and says so at the stop. Large shifts (Bloop low, Pip high) may sound odd; the listening test is where pitches get tuned.
- **Joins:** encoder padding differs by browser, so the app trims silence itself; how natural the joins sound is only judged on the iPad (step 2).
- **Memory on the iPad 7th gen:** decoding one clip at a time with a capped cache; watch for reloads or stutter in the playtest.
- **iOS audio session:** recorded lines use WebAudio, not the speech engine, so the D86–D88 speech conflicts should mostly disappear; the workarounds stay for the TTS fallback. Unverified until the iPad playtest.
- **Download and repo size:** about 2–3 MB of clips on the first launch after the update; Workbox revisions mean a voice pass refetches only changed clips. Every full re-encode adds about 3 MB to git history, so re-encode only when needed.
- **Timing:** the TTS timeout formula (§8.1) does not apply to clips; they use their real durations plus a margin.

### 6.7 Accept (SPEC §14 M13)
- [ ] `check` + e2e green
- [ ] `clipPlan` transcripts join to the phrase text for every phrase and parameter in range (unit)
- [ ] `audio:todo` reports no missing clip for A1–A3 (lines never recorded by D139e excepted)
- [ ] missing clip → whole-line TTS (e2e)
- [ ] a clip that never ends does not block the flow (e2e)
- [ ] clips precached and played offline (Chromium e2e, WAV test set)
- [ ] decoded-audio cache stays under its cap (unit)
- [ ] zero external requests; CSP unchanged
- [ ] size report committed; Voice test screenshots saved; PLAYTEST.md updated
- [ ] Owner check (PLAYTEST, not agent acceptance): joins acceptable, voices distinct and friendly, nothing cut off, no clash with SFX, works after backgrounding and with the silent switch on (iPad, then iPhone and Android)

---

## 7. What I need from you

1. ~~Approve this plan~~ — approved 2026-11-05.
2. ~~WebKit~~ — answered: WebKit runs in the cloud environment via the setup script, and locally on Windows too; every session runs it (D80).
3. ~~Objections to §2~~ — none; the M0 session records the §2 resolutions as D48+ in DECISIONS.md as its first step.
4. M0 owner action: set Pages source to "GitHub Actions" once you push.
5. M13, when you pick it: two recording sessions (the spike in step 2, the full script in step 4; §6.1), each on your Windows PC with Audacity.
