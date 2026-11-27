// Play-time report (D189): how long orders, services and sittings take, read from a backup file
// (Grown-ups > Data > Export), with the measured values to feed `npm run economy:sim`.
//   npm run play:report -- path/to/number-chef-backup.json            (prints Markdown)
//   npm run play:report -- path/to/backup.json --out docs/PLAY_TIME.md
// The backup is the child's own progress; nothing is written unless --out is given.
import { readFileSync, writeFileSync } from 'node:fs';
import { SKILL_TITLES, STAGE_NAMES } from '../src/engine/labels';
import { playTime, SITTING_GAP_MIN, type Spread } from '../src/engine/playTime';
import type { SkillId, Stage } from '../src/engine/types';
import { parseImport } from '../src/storage/backup';

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const file = process.argv
  .slice(2)
  .find((a, i, all) => !a.startsWith('--') && !all[i - 1]?.startsWith('--'));
if (!file) {
  console.error('Usage: npm run play:report -- <backup.json> [--out file.md] [--gap 15]');
  process.exit(1);
}

const parsed = await parseImport(readFileSync(file, 'utf8'));
const gap = Number(flag('gap') ?? SITTING_GAP_MIN);
const r = playTime(parsed.events, gap);

const dish = (s: SkillId) => SKILL_TITLES[s]?.name ?? s;
const stage = (s: Stage | null) => (s === null ? '—' : `S${s} ${STAGE_NAMES[s]}`);
const f1 = (x: number) => x.toFixed(1);
const sp = (s: Spread, fmt = f1) => `${fmt(s.median)} (${fmt(s.p10)}–${fmt(s.p90)})`;
const when = (t: number) => new Date(t).toISOString().slice(0, 16).replace('T', ' ');

const lines: string[] = [];
const out = (s = '') => lines.push(s);

out('# Play time');
out();
out(
  `From a backup exported ${when(parsed.exportedAt)} UTC: ${parsed.events.length} events, ${r.sittings.length} sittings. ` +
    `Figures are the median with the 10th–90th percentile in brackets. A sitting is play with no gap over ${gap} min; ` +
    'it ends at the last recorded moment (a service ending, a purchase), so time spent after that is not counted.',
);
out();
out('## Overall');
out();
out('| | |');
out('|---|---|');
out(
  `| Play (sittings) | ${f1(r.totals.sittingMinutes)} min, of which ${f1(r.totals.serviceMinutes)} min in services |`,
);
out(`| Services finished | ${r.totals.services} |`);
out(`| Monsters served | ${r.totals.monsters} |`);
out(`| Coins earned (tips included) | ${r.totals.coins} |`);
out(
  `| Coins per minute of play | ${r.totals.coinsPerMinute === null ? '—' : f1(r.totals.coinsPerMinute)} |`,
);
out(
  `| Coins per 60 min | ${r.totals.coinsPerMinute === null ? '—' : Math.round(r.totals.coinsPerMinute * 60)} |`,
);
out(
  `| Play per week | ${r.totals.minutesPerWeek === null ? 'needs two weeks of play' : `${Math.round(r.totals.minutesPerWeek)} min`} |`,
);
out(`| Coins in the jar now | ${parsed.coins} |`);
out();
out('## Orders, by dish and support level');
out();
out('Seconds from the monster arriving to the order served. The warm-up order is not timed.');
out();
out('| Dish | Support | Orders | Seconds | First try |');
out('|---|---|---|---|---|');
for (const o of r.orders) {
  out(
    `| ${dish(o.skill)} | ${stage(o.stage)} | ${o.seconds.n} | ${sp(o.seconds)} | ${Math.round(o.firstTry * 100)}% |`,
  );
}
out();
out('## Services, by dish and support level');
out();
out(
  'Finished services only, first order to the end. "Per 6 orders" scales each to the simulation\'s 6-order service.',
);
out();
out('| Dish | Support | Services | Minutes | Per 6 orders |');
out('|---|---|---|---|---|');
for (const s of r.services) {
  out(
    `| ${dish(s.skill)} | ${stage(s.stage)} | ${s.minutes.n} | ${sp(s.minutes)} | ${sp(s.minutesPer6)} |`,
  );
}
out();
out('## Between services');
out();
out('| Gap | Count | Minutes |');
out('|---|---|---|');
out(
  `| Results and menu only | ${r.between.plain?.n ?? 0} | ${r.between.plain ? sp(r.between.plain) : '—'} |`,
);
out(
  `| With a shop visit | ${r.between.withShop?.n ?? 0} | ${r.between.withShop ? sp(r.between.withShop) : '—'} |`,
);
out();
out('## Sittings');
out();
out('| Started (UTC) | Minutes | Services | Monsters | Coins | Purchases |');
out('|---|---|---|---|---|---|');
for (const s of r.sittings) {
  out(
    `| ${when(s.start)} | ${f1(s.minutes)} | ${s.services} | ${s.monsters} | ${s.coins} | ${s.purchases} |`,
  );
}
out();
out('## For the economy simulation');
out();
const g = r.suggest;
const args = [
  g.serviceMinutes && `--service ${g.serviceMinutes.join('-')}`,
  g.sessionMinutes && `--session ${g.sessionMinutes.join('-')}`,
  g.betweenServicesMinutes !== null && `--between ${g.betweenServicesMinutes}`,
  g.shopMinutes !== null && `--shop ${g.shopMinutes}`,
  r.totals.minutesPerWeek !== null && `--minutes ${Math.round(r.totals.minutesPerWeek)}`,
].filter(Boolean);
out(
  "Measured in place of the simulation's assumptions (a 6-order service 3–4 min, 0.5 min between services, 1.5 min in the shop, sittings of 15–20 min, 60 min a week):",
);
out();
out('```');
out(`npm run economy:sim -- ${args.join(' ')} --out -`);
out('```');
out();
out('Few services make a rough measure; harder dishes and less help will change it.');

const text = lines.join('\n') + '\n';
const outFlag = flag('out');
if (outFlag) {
  writeFileSync(outFlag, text);
  console.log(`Wrote ${outFlag}`);
} else process.stdout.write(text);
