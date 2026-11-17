import { describe, it, expect } from "vitest";
import { competencyLevel } from "./competencyLevel";

const cov = (l: number, lt: number, p: number, pt: number) => ({ lessonsDone: l, lessonsTotal: lt, problemsDone: p, problemsTotal: pt });

describe("competencyLevel", () => {
  it("Avansat needs 90% of related lessons and 30% of related problems", () => {
    expect(competencyLevel(0.95, cov(9, 10, 3, 10))).toBe("Avansat");
  });
  it("100% accuracy with only 8 of 100 lessons is not Avansat", () => {
    expect(competencyLevel(1, cov(8, 100, 0, 20))).toBe("În curs de dobândire");
  });
  it("89% of lessons is not enough for Avansat", () => {
    expect(competencyLevel(0.95, cov(89, 100, 10, 10))).toBe("Consolidat");
  });
  it("29% of problems is not enough for Avansat", () => {
    expect(competencyLevel(0.95, cov(10, 10, 29, 100))).toBe("Consolidat");
  });
  it("no data is Neevaluat", () => {
    expect(competencyLevel(null, cov(0, 10, 0, 10))).toBe("Neevaluat");
  });
});
