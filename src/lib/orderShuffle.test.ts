import { describe, it, expect } from "vitest";
import { shuffleOrderIds } from "./orderShuffle";

describe("shuffleOrderIds", () => {
  const ids = ["a", "b", "c", "d", "e"];

  it("never returns the source order", () => {
    for (let i = 0; i < 50; i++) {
      const out = shuffleOrderIds(ids, `seed-${i}`);
      expect(out).not.toEqual(ids);
    }
    // also for short arrays where a shuffle can easily be identity
    for (let i = 0; i < 50; i++) {
      expect(shuffleOrderIds(["a", "b"], `s${i}`)).not.toEqual(["a", "b"]);
    }
  });

  it("keeps the same items", () => {
    const out = shuffleOrderIds(ids, "seed");
    expect([...out].sort()).toEqual([...ids].sort());
  });

  it("is deterministic for a given seed", () => {
    expect(shuffleOrderIds(ids, "x")).toEqual(shuffleOrderIds(ids, "x"));
  });

  it("differs between seeds", () => {
    const seen = new Set(
      Array.from({ length: 20 }, (_, i) => shuffleOrderIds(ids, `seed-${i}`).join(","))
    );
    expect(seen.size).toBeGreaterThan(1);
  });

  it("handles 0 and 1 item arrays", () => {
    expect(shuffleOrderIds([], "s")).toEqual([]);
    expect(shuffleOrderIds(["a"], "s")).toEqual(["a"]);
  });
});
