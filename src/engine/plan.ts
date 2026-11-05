// M1 order plan (D66): a stand-in until the §4.1 session builder (M2). Uniform over the skill's
// filtered pool, honouring the no-repeat window and "same food not twice in a row".
import { REPEAT_WINDOW } from './config';
import { FOOD_IDS, type FoodId } from './foods';
import { filterOps, pool } from './generators';
import type { Rng } from './rng';
import type { Ops, Problem, SkillId, Stage } from './types';

export interface Order {
  problem: Problem;
  food: FoodId;
  stage: Stage;
}

export function planOrders(
  rng: Rng,
  skill: SkillId,
  ops: Ops,
  stage: Stage,
  count: number,
): Order[] {
  const items = filterOps(pool(skill), ops);
  const distinct = new Set(items.map((p) => p.factKey)).size;
  // SPEC §4.1 steps 5 and 9: the window shrinks when few facts are available.
  const window = Math.max(1, Math.min(REPEAT_WINDOW, distinct - 1));
  const out: Order[] = [];
  for (let i = 0; i < count; i++) {
    const recent = new Set(out.slice(-window).map((o) => o.problem.factKey));
    const choices = items.filter((p) => !recent.has(p.factKey));
    const problem = rng.pick(choices.length > 0 ? choices : items);
    const lastFood = out.at(-1)?.food;
    const food = rng.pick(FOOD_IDS.filter((f) => f !== lastFood));
    out.push({ problem, food, stage });
  }
  return out;
}
