# Kickoff prompt for Claude Code

Paste this as the first message in a Claude Code session opened in this folder.

---

You're building "Number Chef Monsters", a math game for my 5½-year-old, in this repo. The design is finished and lives in files; read them fully before doing anything:

1. `CLAUDE.md` (conventions, commands, invariants)
2. `docs/SPEC.md` (the source of truth)
3. `docs/DECISIONS.md` (why the design departs from my original idea; don't re-litigate)
4. `docs/OPEN_ITEMS.md` (what I've answered and what is still open; use the defaults noted there until I answer)

Your first deliverable is `docs/PLAN.md` only. No code yet. It should contain: your task breakdown for **Tier 1 (M0–M3, the playable game, target ≈ 10 h)** following SPEC §14, a lighter outline for the Tier 2 milestones (M4+), the order of work inside each milestone, risks you see (especially iOS Safari audio/speech/storage, touch handling, and the rotated portrait stage), anything in the spec you think is ambiguous or contradictory (list, with your proposed resolution), and an hour estimate per milestone. Then stop and wait for my approval.

After I approve, build one milestone at a time. At the end of each milestone: `npm run check` and e2e green, acceptance criteria from SPEC §14 verified (tick them in PLAN.md), screenshots saved under `docs/screens/M<n>/`, `docs/PLAYTEST.md` updated with what only I can judge, `docs/DECISIONS.md` updated for any assumption you made, work committed locally. Then stop, report in 10 lines or fewer (works / unverified / what you need from me), and wait for my playtest feedback before starting the next milestone. Tier 2 milestones are chosen by me one at a time; there is no hour cap on them.

Constraints worth repeating: I'm on Windows; scripts must be cross-platform. `src/engine` stays pure. No network at runtime. Speech must never block the flow. The play-time limit is optional and off by default; when a parent enables it, the lock must survive reloads and only a parent can lift it. Don't claim anything works on a real iPad that you could only test in an emulator.
