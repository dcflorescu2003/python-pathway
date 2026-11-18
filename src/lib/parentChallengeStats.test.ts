import { describe, it, expect } from "vitest";
import { parentChallengeStats } from "./studentReportHtml";

const ch = (itemType: string, status: any, viaSolution = false) => ({ groupTitle: "G", title: "T", itemType, dueDate: null, status, score: null, viaSolution, completedAt: null });

describe("parentChallengeStats", () => {
  it("counts lessons and problems separately, with solution-viewed problems split out", () => {
    const d: any = { challenges: [
      ch("lesson", "on_time"), ch("lesson", "late"), ch("lesson", "missing"),
      ch("problem", "on_time"), ch("problem", "on_time", true), ch("problem", "missing"),
    ] };
    const s = parentChallengeStats(d);
    expect(s.lessons).toEqual({ total: 3, done: 2, late: 1, viaSolution: 0 });
    expect(s.problems).toEqual({ total: 3, done: 2, late: 0, viaSolution: 1 });
    expect(s.missing.length).toBe(2);
    expect(s.onTimePct).toBe(50);
  });
});
