/**
 * Deterministic shuffle for "order the lines" exercises.
 *
 * Used as a defensive layer in tests: even if the backend returns the lines in
 * their original (correct) order, the student never sees the answer key laid out
 * for them. The shuffle is seeded so it stays stable across re-renders, question
 * navigation and draft re-sync.
 */

function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a shuffled copy of `ids`, deterministic for a given `seed`.
 * If the shuffle happens to reproduce the source order (likely with 2-3 items),
 * the array is rotated by one so the student never starts from the correct
 * arrangement. Arrays shorter than 2 items are returned unchanged.
 */
export function shuffleOrderIds(ids: string[], seed: string): string[] {
  if (ids.length < 2) return [...ids];

  const rand = mulberry32(hashSeed(seed));
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }

  const unchanged = out.every((id, i) => id === ids[i]);
  if (unchanged) {
    // Rotate by one — guaranteed different from the source order.
    out.push(out.shift() as string);
  }
  return out;
}
