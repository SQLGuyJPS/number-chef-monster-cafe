# Build plan — Number Chef: Monster Café

Status: **approved by the owner 2026-11-05** (estimate, work order and the §2 resolutions, recorded as D48–D59). **M0 done 2026-11-05.** **M1 done 2026-11-05**; M1 playtest rounds 1–7 and the gear popup recorded in PLAYTEST.md (last 2026-11-09). **M2 done 2026-11-10** (started 2026-11-09); waiting for the M2 playtest. **M2b (device speed test, D112) added by the owner and done 2026-11-12**; the iPad result set the SVG budget (D113, 2026-11-12). **Play-time limit moved from M3b to Tier 2 milestone M12, postponed indefinitely (D124, 2026-11-14).** **M3a done 2026-11-14** (D125); waiting for the M3a playtest. Source of truth stays `docs/SPEC.md`; this file holds the work order, the risks, the authoritative hour estimate (D36, D44) and the acceptance checklists that get ticked as each milestone closes.

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

Tier 2 (rough, re-estimated when you pick one): M4 2.0 · M5 3.5 · M7 3.0 · M8 2.5 (incl. layout mock) · M9 1.5 · M10 2.0 · M11 2.0 · M12 1.75 (play-time limit, postponed indefinitely, D124).

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

### M3b — Hand-off ready (1.5 h)
The play-time limit moved to M12 (D124).
1. Parent gate (long-press 2 s, 6–9 × 7–9 on a number pad, 3 wrong → 30 s lockout, 5 min auto-lock); unrotated parent area.
2. Parent area: Skills list from M3a behind the gate; voice/speed/test; volumes; reduced motion; orders per service; basket side moves here from the playtest tools.
3. Data: Export (SHA-256, share fallbacks), Replace-only import (snapshot first, zod, checksum, second multiplication prompt), Reset (snapshot first, keeps `snapshots`, `ncmc*` only), install help text.
4. E2E: gate lockout, export → reset → import round trip. Screenshots, PLAYTEST, commit, stop.

**Accept (SPEC §14 M3b)**
- [ ] parent gate lockout and 5-minute auto-lock; not reachable during a service
- [ ] export → reset → import round trip; checksum verified
- [ ] Reset touches only `ncmc*` data and keeps `snapshots`

---

## 5. Tier 2 outline (order picked by the owner)

- **M4 Shop** (2.0 h): `economy.ts` tables (sum 1,340), shop screen with live preview, Buy + confirm, `buy`/`equip` events, staff reactions, guest monsters, purchases visible in Service.
- **M5 Rest of the Little Menu** (3.5 h): A0, A4–A8 generators, orderings for A4–A6, demos (teens, bridge, back-through-ten, make-ten variants), `frames2` UI, A5 whole-frame moves, FollowMe past 10. Counter-layout checks carried here: the two-frame tray has only run in the mock, so M5 must exercise it in the real service (drag and tap onto the tight cells, flights, eating, both basket sides); and the two-frame tray at S0 has no room for the lifted cloche lid (open question, decide when the first two-frame S0 skill is built); and nine menu tiles do not fit one counter row (D123).
- **M7 Full parent area + merge** (3.0 h): Merge import with dry-run summary, device label, Focus list, Starting-point editor, hide/show, heatmap, trouble spots, history, median S0 time, snapshots restore, two-context e2e.
- **M8 Big Menu** (2.5 h): static layout mock first (stop for OK), then tens shelf + ones frame, auto-bundle, two bins, B1–B2 generators/orderings/demos, two-digit pad.
- **M9 B3** (1.5 h). **M10 Polish** (2.0 h): accessibility, big-text captions, bundle report, Lighthouse, audio manifest + `audio-todo.ts`. **M11 Profiles** (2.0 h): `profileId` migration (first real migration), picker, per-profile preset.
- **M12 Play-time limit** (1.75 h; postponed indefinitely by the owner, D124): allowance model with injected monotonic and wall clocks (idle pause, grace cap in wall time, last customer, shorter service, tip rule, lock clears resume, boot check, refill modes, 60 s cue) and all §6.5 tests; locked Home, wind-down, lights dim + Pip yawn; limit setting with Start new session / Add time behind M3b's gate; e2e limit-off-never-locks and run-out → locked → reload → unlock → no resume offer. The `clock` IDB store already exists, so no IDB upgrade is needed.

---

## 6. What I need from you

1. ~~Approve this plan~~ — approved 2026-11-05.
2. ~~WebKit~~ — answered: WebKit runs in the cloud environment via the setup script, and locally on Windows too; every session runs it (D80).
3. ~~Objections to §2~~ — none; the M0 session records the §2 resolutions as D48+ in DECISIONS.md as its first step.
4. M0 owner action: set Pages source to "GitHub Actions" once you push.
