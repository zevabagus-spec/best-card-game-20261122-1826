// AURORA CLASH — a tiny seeded random source so a screenshot seed always
// stages the same duel, and a replayed game deals the same cards.
export function createRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle driven by the seeded source, in place. */
export function shuffleInPlace(items, random) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    const held = items[index];
    items[index] = items[other];
    items[other] = held;
  }
  return items;
}
