# Build plan — Number Chef: Monster Café

Status: **approved by the owner 2026-11-05** (estimate, work order and the §2 resolutions, recorded as D48–D59). **M0 done 2026-11-05**, waiting for the owner's M0 checks. Source of truth stays `docs/SPEC.md`; this file holds the work order, the risks, the authoritative hour estimate (D36, D44) and the acceptance checklists that get ticked as each milestone closes.

---

## 1. Hour estimate (agentic build hours)

| Milestone | SPEC §14 indicative | This plan | Why it differs |
|---|---|---|---|
| M0 Foundations | 2 | **2.5** | PWA + CSP-in-prod + rotated stage + back guard + portrait e2e is a lot of plumbing to get green on two browser engines. |
| M1 Core loop (incl. layout mock) | 3.5 | **5.0** | 0.5 mock + engine (generators, tray, check, demos, attempt flow) + tray UI with drag + all four stages incl. S0 cloche help path + TTS + e2e. Densest milestone. |
| M2 Café service | 3.25 | **5.0** | Six monsters × five expressions is the single biggest art job (~1.5 h); session builder with requeue rules is test-heavy; full e2e device matrix + CDP drag. |
| M3a Persistence + fact boxes | — | **2.0** | Event log, replay ≡ applyEvent property test, IDB stores, resume, minimal Skills list. |
| M3b Hand-off ready | — | **3.0** | §6.5 alone is ~20 test cases with fake monotonic and wall clocks; plus gate, parent area, export/replace import/reset. |
| **Tier 1 total** | ≈ 10 (guide) | **≈ 17.5** | |

The 10 h guide is exceeded (allowed by D44). The figure excludes fixes from each playtest (SPEC §14 says each milestone starts with them); budget ~0.5 h per round. The estimate is driven by what the spec requires, not by optional polish; I have not cut scope to fit. If you want it shorter, the cheapest levers are yours to choose (e.g. fewer monsters in M2, deferring the 4× CPU throttle report), and each would need a DECISIONS entry.

Tier 2 (rough, re-estimated when you pick one): M4 2.0 · M5 3.5 · M7 3.0 · M8 2.5 (incl. layout mock) · M9 1.5 · M10 2.0 · M11 2.0.

---

## 2. Ambiguities and gaps found (proposed resolutions)

None of these re-open a decided item. On approval I record each accepted one as a DECISIONS entry (D48+). Items marked **decision** need your answer; the rest I will just do as proposed unless you object.

1. **S0 number pad does not fit the bottom band — APPROVED by the owner 2026-11-05.** §5.4 puts ten digit buttons ≥ 112 logical px (≈ 1192 px with 8 px gaps) in the bin area, but Pip's hat sits bottom-left and the bell bottom-right, leaving ≈ 1000 px. *Proposal:* at S0 the digit row sits in the tray band (y ≈ 400–512) with the answer display, backspace and Peek above it (y ≈ 310–390); the bottom band keeps Pip's hat and the bell. When Peek, Worked or FollowMe lifts the cloche, the full-size S3 tray temporarily takes the tray band (FollowMe needs ≥ 44 CSS px cells) and the digit row returns for the final typing (D41). I add an S0 frame to the M1 layout mock so you can see it before anything is built.
2. **WebKit in the cloud environment — DECIDED 2026-11-05.** Only Playwright's Chromium is pre-installed in the cloud container. WebKit was installed and verified there (iPad gen 7 landscape touch tap passed), and the owner added `npx -y playwright@1.63.0 install --with-deps webkit` to the environment's setup script, so every new session has it next to Chromium in `/opt/pw-browsers`. The project therefore **pins `@playwright/test` to exactly 1.63.0** so it finds both pre-installed browsers (bumping it means changing the setup script line too). All Chromium and WebKit projects run in the cloud; the owner's Windows machine is the fallback (`npm run test:e2e -- --project=<name>`). If WebKit is missing in a session (setup script failed), report that rather than skipping silently. Playwright WebKit is close to iPad Safari but not the same; real-device checks stay in PLAYTEST.
3. **`factKey` scheme for missing-amount forms.** §3.1 gives examples but no rule. *Proposal:* `skill:form:operands`; addition keys sort operands (`A2:+:3,5`); `a+?=c` and `?+a=c` share one key `A4:?add:a,c` (they are commuted partners, so they share a box per §4.1 step 4); `10−a=?` (`A3:-:10,a`) and `10−?=a` (`A3:?sub:10,a`) are separate keys. Consequence: A3's canonical add/sub share is 9 : 18, so with `ops = both` the ±1 balance target for A3 is about one third addition (D43b).
4. **Coins before M3a.** M2 shows coins in the jar but persistence is M3a. *Proposal:* M2 keeps the jar in memory (a reload resets it); M3a starts writing the frozen `coin` events. PLAYTEST.md for M2 says so. The M2 warm-up "shown once" flag already uses the `meta` store (D47i), so the warm-up does not repeat after a reload.
5. **Where the `?debug` stage/operations picker stores its values (M1–M2).** *Proposal:* in the per-device `settings` store skeleton under a `debugSkillConfig` key, so they survive reloads during playtests; M3a ignores and deletes the key once `skillConfig` events exist.
6. **Home gear before M3a.** §5.2 says the gear opens the Skills list from M3a. *Proposal:* the gear renders but does nothing in M2 (long-press has no target yet); stage changes go through `?debug`.
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
- Silent switch mutes WebAudio unless `navigator.audioSession.type = 'playback'` (iOS 17+ only; older iOS stays silent with the switch on → documented in parent Help).
- `speechSynthesis` needs priming inside a gesture; `cancel()` before each non-queued line; voices arrive late (`voiceschanged` + retries). The game must stay fully playable with no voices (captions always on).
- Storage eviction after 7 days applies to Safari tabs, not Home Screen apps; tab and installed app have separate storage → "install before first play" in README and PLAYTEST (no detection code).
- `navigator.storage.persist()/estimate()` missing before Safari 17 → feature-detect, show "not available on this device".
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
11. Playwright config (`@playwright/test` pinned to 1.63.0, §2 item 2) with M0/M1 projects (Chromium + WebKit, both run in the cloud). E2E: portrait tap hits rotated control, rotate back keeps state, back shows dialog, offline reload (Chromium), zero external requests, no zoom/scroll/long-press menu.
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
12. E2E (Chromium landscape + one WebKit iPad project, both in the cloud): stages, fill order, remove-from-end, locks, wrong→wrong→demo→FollowMe, Help-then-wrong → Worked, speech stubbed to never end, 844×390 tap targets; M0 portrait test still green.
13. Screenshots, PLAYTEST, DECISIONS, commit, stop.

**Accept (SPEC §14 M1)**
- [ ] layout mock approved by the owner before interaction
- [ ] unit tests for generators / tray / check / demos pass
- [ ] all four stages playable for A1 and A2 (incl. S0 help path on the cloche tray)
- [ ] fill order, remove-from-end and lock rules (§3.3) verified by e2e (Chromium landscape + one WebKit iPad project)
- [ ] `toStageCoords` unit-tested for portrait; M0 portrait tap test still green
- [ ] no auto-serve (FollowMe pulses the bell, the child presses it)
- [ ] wrong → wrong → demo → follow-me completes
- [ ] Help at attempt 1 then a wrong serve goes straight to Worked
- [ ] speech never blocks the flow (`speechSynthesis` stubbed to never fire `end`)
- [ ] 844×390 tap-target assertions pass
- [ ] `attempt` and `coin` event shapes fixed

### M2 — Café service (5.0 h)
1. Engine: session builder (§4.1): pool + ops filter, box weights, new-fact cap and difficulty order, no-repeat window (requeues exempt), food/monster rules, add/sub balance, requeue placement and append, pool-size guard; determinism tests.
2. Engine: A3 generator + make-ten demo; taken-away row for `10 − ? = a`; `known` preset.
3. Service state machine: 6 orders, queue silhouettes, requeue = same monster returns, warm-up order with ghost hand (flag in `meta`), coins in memory (§2 item 4).
4. Art: `MonsterSpec` data + six hand-authored SVG monsters × idle/delight/eat/puzzled/sleepy, reactions, reduced-motion static poses; Pip; café background with fallback placeholders.
5. Eat sequence (≤ 4 s, skippable), coin flight, all SFX (§8.3), voice lines.
6. Screens: Home (coin jar, Open the Café), Menu board (Little Menu only, A1–A3 tiles, last-played glow, A1 on first run), Results (tally, Another service / Change dish / Home).
7. `lint:content` monster validation; `content:table` → `docs/CONTENT_REVIEW.md`.
8. E2E full matrix (Chromium iPad Pro 11 + Pixel 7, WebKit iPad gen 7 + iPhone 13, portrait variants), CDP drag incl. rotated portrait, ≤ 2 taps to first order, Another service / Change dish, monster screenshot grid, throttle report.
9. Screenshots, PLAYTEST (service length timing, monster appeal, voices on three devices), commit, stop.

**Accept (SPEC §14 M2)**
- [ ] deterministic service from seed
- [ ] no adjacent repeats; at most 3 new facts per service
- [ ] each monster renders at all five expressions (screenshot grid)
- [ ] eat + react ≤ 4 s and skippable
- [ ] reduced-motion variant verified
- [ ] 4× CPU throttle frame report produced (not a gate)
- [ ] full e2e device matrix incl. CDP drag in rotated portrait
- [ ] first run reaches the first order in ≤ 2 taps after Splash
- [ ] Another service repeats the skill; Change dish returns to the menu
- [ ] content table generated

### M3a — Persistence and fact boxes (2.0 h)
1. Engine: `replay` / `applyEvent`, coin totals (§11.2), fact boxes (D29 rules), `skillConfig` last-writer-wins; property test applyEvent ≡ replay.
2. Storage: `IdbStorage` events/state/settings/resume/snapshots; one transaction per completed problem (`attempt` + `coin` + `resume`); derived-state cache rebuild; snapshot write.
3. Wire the service to write events; `serviceEnd` (partial on Close the café); coins now persist.
4. Resume: snapshot stores the planned order list; boot offers "Continue dinner service?" if < 2 h old.
5. Minimal Skills list (stage + operations for A1–A3) opened by the gear without a gate; simple progress list; persisted flag + estimate (feature-detected).
6. E2E: reload mid-service offers resume and continues the plan; settings change the next service. Screenshots, PLAYTEST, commit, stop.

**Accept (SPEC §14 M3a)**
- [ ] `applyEvent` incremental equals full replay (property test)
- [ ] box transitions per outcome and stage; box-weight tests
- [ ] coins survive a resume and a killed app
- [ ] reload mid-service offers resume; resume continues the stored order plan
- [ ] per-skill stage and operations settings change the next service (e2e)
- [ ] migration harness test
- [ ] storage persisted flag and estimate shown when available

### M3b — Hand-off ready (3.0 h)
1. Engine: allowance model with injected monotonic and wall clocks (idle pause, grace cap in wall time, last-customer, shorter service, tip rule, lock clears resume, boot check, refill modes, 60 s cue); all §6.5 tests.
2. UI: locked Home, wind-down silhouettes, last-customer line, lights dim + Pip yawn.
3. Parent gate (long-press 2 s, 6–9 × 7–9 on a number pad, 3 wrong → 30 s lockout, 5 min auto-lock); unrotated parent area.
4. Parent area: play-time limit (Off default) + Start new session / Add time / refill mode; voice/speed/test; volumes; reduced motion; orders per service.
5. Data: Export (SHA-256, share fallbacks), Replace-only import (snapshot first, zod, checksum, second multiplication prompt), Reset (snapshot first, keeps `snapshots`), install help text.
6. E2E: limit-off-never-locks, allowance run-out flow (wind-down → locked → reload → unlock → no resume offer), gate lockout, export → reset → import round trip. Screenshots, PLAYTEST (10-minute walk-away test), commit, stop.

**Accept (SPEC §14 M3b)**
- [ ] limit off by default (a fresh install never locks)
- [ ] §6.5 behaviour when enabled: lock after reload, boot check, lock outside a service, 90 s grace cap (no coins), tip rule, no resume offer after a lock
- [ ] parent gate lockout
- [ ] export → reset → import round trip; checksum verified

---

## 5. Tier 2 outline (order picked by the owner)

- **M4 Shop** (2.0 h): `economy.ts` tables (sum 1,340), shop screen with live preview, Buy + confirm, `buy`/`equip` events, staff reactions, guest monsters, purchases visible in Service.
- **M5 Rest of the Little Menu** (3.5 h): A0, A4–A8 generators, orderings for A4–A6, demos (teens, bridge, back-through-ten, make-ten variants), `frames2` UI, A5 whole-frame moves, FollowMe past 10.
- **M7 Full parent area + merge** (3.0 h): Merge import with dry-run summary, device label, Focus list, Starting-point editor, hide/show, heatmap, trouble spots, history, median S0 time, snapshots restore, two-context e2e.
- **M8 Big Menu** (2.5 h): static layout mock first (stop for OK), then tens shelf + ones frame, auto-bundle, two bins, B1–B2 generators/orderings/demos, two-digit pad.
- **M9 B3** (1.5 h). **M10 Polish** (2.0 h): accessibility, big-text captions, bundle report, Lighthouse, audio manifest + `audio-todo.ts`. **M11 Profiles** (2.0 h): `profileId` migration (first real migration), picker, per-profile preset.

---

## 6. What I need from you

1. ~~Approve this plan~~ — approved 2026-11-05.
2. ~~WebKit~~ — answered: WebKit runs in the cloud environment via the setup script; Windows is the fallback.
3. ~~Objections to §2~~ — none; the M0 session records the §2 resolutions as D48+ in DECISIONS.md as its first step.
4. M0 owner action: set Pages source to "GitHub Actions" once you push.
