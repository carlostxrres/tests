// Randomisation helpers. `shuffle` is plain and unseeded; `shuffledOrder` is
// deterministic, because the test runner needs an option order that survives
// re-renders, reloads and revisits.

// Fisher-Yates shuffle over a copy.
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// FNV-1a: a small, fast string hash. Ids are same-shaped UUIDs, so a weaker
// hash (a char-code sum, say) would correlate the orders of sibling questions.
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // mulberry32 degenerates on a zero seed.
  return h >>> 0 || 0x9e3779b9;
}

// A permutation of [0, length): `order[displayPosition]` is the ORIGINAL index
// to render at that position. Callers keep passing original indices around, so
// nothing downstream (`choice`, `correct_option`, the database) sees the
// display order. Inverting this mapping is the easy way to break it silently:
// the UI still works, it just ticks the wrong option.
export function shuffledOrder(seed: string, length: number): number[] {
  let state = hashSeed(seed);
  // mulberry32: 32-bit PRNG, one multiply-shift round per call.
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const order = Array.from({ length }, (_, i) => i);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
