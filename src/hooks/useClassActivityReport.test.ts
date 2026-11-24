import { describe, it, expect } from "vitest";
import { activityXp, chunk, REVIEW_LESSON_XP } from "./useClassActivityReport";

describe("class activity report", () => {
  const rewards = new Map([["c1-l1", 10], ["problem-p1", 20]]);
  it("gives review lessons the recap XP", () => {
    expect(activityXp({ lesson_id: "c1-l1f", score: 80, solution_revealed_at: null }, rewards)).toBe(REVIEW_LESSON_XP);
  });
  it("uses lesson and problem rewards", () => {
    expect(activityXp({ lesson_id: "c1-l1", score: 80, solution_revealed_at: null }, rewards)).toBe(10);
    expect(activityXp({ lesson_id: "problem-p1", score: 100, solution_revealed_at: null }, rewards)).toBe(20);
  });
  it("splits ids into batches of at most 100", () => {
    const parts = chunk(Array.from({ length: 250 }, (_, i) => i), 100);
    expect(parts.map((p) => p.length)).toEqual([100, 100, 50]);
  });
});
