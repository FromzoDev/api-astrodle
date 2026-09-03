import { HINT_POOL, HintDefinition } from './hint-pool';

export function pickRandomUnused(
  available: number[],
  alreadyUsed: number[],
): number | null {
  const remaining = available.filter((i) => !alreadyUsed.includes(i));
  if (remaining.length === 0) return null;
  return remaining[Math.floor(Math.random() * remaining.length)];
}

export function pickRandomHint(
  alreadyUsedKeys: string[],
): HintDefinition | null {
  const remaining = HINT_POOL.filter((h) => !alreadyUsedKeys.includes(h.key));
  if (remaining.length === 0) return null;
  return remaining[Math.floor(Math.random() * remaining.length)];
}
