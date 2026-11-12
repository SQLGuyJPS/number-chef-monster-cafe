# Number Chef: Monster Café — Claude Code conventions

A math game for a young child. `docs/SPEC.md` is the single, current statement of the design and the source of truth; read it before changing anything. Each rule cites the decision behind it as `(Dn)`.
- `docs/DECISIONS.md` is an index (one line per decision, with status and SPEC section). Read it only when you are changing an area, to see which decisions govern it.
- `docs/archive/DECISIONS_LOG.md` holds the full text of every decision. Read an entry there by its D-number only when you need the full reasoning. Don't read anything else in `docs/archive/` (finished reviews, the kickoff prompt) unless asked.
- Do not re-litigate decided items; if you find a real problem, add a decision and ask.

## Working agreement
- Build in the milestones listed in SPEC §14. **Tier 1 (M0, M1, M2, M2b, M3a, M3b; ≈ 10 h as a guide, not a cap, D44) is the target for a playable game**; Tier 2 (M4+) is bonus work in any order the owner picks, with no hour cap. **Stop after each milestone** (M3a and M3b each count) and wait for the owner's playtest feedback. Do not start the next milestone unprompted. M1 starts with a static layout mock; stop for the owner's OK before building interaction (D36).
- First task of the project: write `docs/PLAN.md` (steps, order, risks, a redone hour estimate per milestone, D36) and wait for approval. The risks section carries the platform risks listed in D37.
- Record every assumption you make that the spec doesn't cover as a decision, numbered one higher than the highest `D<n>` in the index: append the full entry (What, Why, How to revisit) to `docs/archive/DECISIONS_LOG.md`, add its line to `docs/DECISIONS.md`, **and update SPEC.md in the same commit** (citing `(Dn)`; implementation-only decisions skip SPEC). If it replaces an earlier decision, update that one's index status too.
- The owner is technical but is the playtester, not the reviewer of every line. Keep explanations short; flag only what needs a decision.
- Windows 11 host. Scripts must be cross-platform Node (no `rm -rf`, no bash-only syntax in package.json). Use `cross-env` if env vars are needed.
- The Git repo already exists (no `git init`). Playtest builds reach the devices when the owner pushes to `main` (D44). Commit at the end of each milestone (and sensible checkpoints). Never push unless asked.

## Commands
```
npm install
npm run dev            # Vite dev server
npm run build          # production build (PWA)
npm run preview        # serve the production build
npm run typecheck | lint | test | test:e2e
npm run lint:content   # generator/content/emoji/monster validation
npm run content:table  # regenerate docs/CONTENT_REVIEW.md
npm run check          # typecheck + lint + test + lint:content  (MUST be green before every commit)
```
E2E runs against the production build with `VITE_E2E=1`; hooks at `window.__ncmc` must not exist in a normal build.

## Architecture rules
- `src/engine/**` is pure TypeScript: no React, no DOM, no `window`, no IndexedDB, no `Date.now()` / `Math.random()` (inject clock and rng). ESLint enforces this. All teaching logic, generators, scheduling, mastery, tray model, demos, and economy live here and are unit-tested.
- Everything random goes through the seeded `rng` (mulberry32). Same seed → same service.
- Generators, `toTrayTask`, `check`, and `buildDemo` are pure and must agree with each other for every pool item at every stage (tests enforce it).
- UI never computes answers; it calls the engine.
- Progress is an append-only event log (SPEC §11); derived state is `replay(events)`. Coins live in events (one `coin` event per completed problem, D31) and are never recomputed. Settings are per device.
- Hosting is GitHub Pages on a shared origin: every persistent name (IndexedDB, caches, any localStorage key) is prefixed `ncmc`; reset/cleanup code touches only `ncmc*`; never `localStorage.clear()`. Vite `base: './'`; no path-based routing.
- All pointer coordinates go through `toStageCoords` (portrait renders the stage rotated, SPEC §2.2).
- Storage access only through the `Storage` interface. Never await a non-IDB promise inside an IDB transaction. Ship `schemaVersion: 1` with an empty migration list and its test harness (D36); from the first schema change on, every change bumps `schemaVersion` and adds a migration with a fixture test.
- Speech must never block game flow (resolve on `end` or timeout). Child-facing text is always spoken as words, never digits or symbols.
- No runtime network requests. No analytics, no external links, no third-party scripts or CDN fonts. CSP stays as in SPEC §2 (`default-src 'self'` plus inline styles).
- SVG budget (SPEC §2.4, D113): at most 4,800 SVG elements on screen and 650 moving (`SVG_BUDGET`); `budget.spec.ts` enforces. Keep art that need not move still.
- Emoji: only the allowlist in SPEC §7.1 (Unicode ≤ 15.0, D111). `lint:content` enforces.

## Child-safety/UX invariants (tests exist; do not weaken)
- No buzzers, fail screens, red X's, lost coins, countdown visible to the child, streaks, daily-login rewards, ads, or external links.
- The play-time limit (SPEC §6) is optional and **off by default** (D27); nothing may lock, count down or show a cue unless a parent enabled it. When enabled, the lock is persistent: reload, relaunch and starting another service never refill it; only the parent gate (or an explicitly chosen auto-refill mode) does. Allowance time is a monotonic active-time accumulator, never wall-clock subtraction.
- Serving is always an explicit bell press; never auto-serve (FollowMe pulses the bell and the child presses it).
- A reloaded or relaunched service is only ever *offered* ("Continue dinner service?"), never resumed silently, and never offered while the café is locked or after an unlock: the lock clears the resume snapshot (D33, D40).
- Coins only ever go down through a confirmed shop purchase (or an explicit parent Reset / Replace import, D44).
- Touch hardening (SPEC §2.3): no zoom, scroll, selection, or long-press menus on the play surface; single active pointer; reduced-motion honored.
- Primary tap targets ≥ 44 CSS px at 844×390 (cells) and ≥ 56 (buttons).

## Style
- TypeScript strict; no `any` without a comment. Small modules, named exports. Prefer data tables (skill configs, phrases, shop items) over branching code.
- Comments explain *why* (pedagogy or platform quirk), not what. Cite SPEC section numbers where a rule comes from.
- CSS custom properties for the palette; one place for logical sizes (`src/app/metrics.ts`).
- Don't add dependencies beyond SPEC §2 without a DECISIONS entry.

## Testing and screenshots
- Unit/property: Vitest in `tests/unit`. E2E: Playwright in `tests/e2e` with touch emulation (iPad Pro 11 landscape, iPad gen 7 WebKit, iPhone 13 landscape, Pixel 7 landscape; M1 runs the narrower set in SPEC §13.5, D36). The e2e environment needs Noto Color Emoji. Playwright cannot drag by touch; use CDP `Input.dispatchTouchEvent` in Chromium only, and test the tap path everywhere.
- At each milestone save screenshots to `docs/screens/M<n>/` (list in SPEC §13.5) and update `docs/PLAYTEST.md` with what only the owner can judge.
- Real-device behavior (iOS audio, speech, storage eviction, silent switch, rotation, Home Screen install, emoji appearance, frame rate on a real iPad) cannot be verified here; list it in PLAYTEST.md rather than claiming it works.

## Definition of done for a milestone
`npm run check` green · e2e green · acceptance criteria in SPEC §14 ticked in PLAN.md · screenshots saved · PLAYTEST.md updated · DECISIONS.md updated · committed · then stop and report in ≤ 10 lines: what works, what's unverified, what you need from the owner.
