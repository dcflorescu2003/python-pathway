import { describe, it, expect } from "vitest";
import { computeKpis, buildStudentRows } from "./classAnalytics";

const now = new Date("2026-11-23T12:00:00Z");
const chapters: any = [{ id: "c1", title: "C1", lessons: [{ id: "c1-l1" }] }];
const members: any = [{ student_id: "a", joined_at: "2026-09-01T00:00:00Z", profile: { display_name: "A" } }];
const completions: any = [
  { user_id: "a", lesson_id: "c1-l1", score: 90, completed_at: "2026-11-20T10:00:00Z" },
  { user_id: "a", lesson_id: "problem-1", score: 100, completed_at: "2026-11-22T10:00:00Z" },
  { user_id: "a", lesson_id: "problem-2", score: 100, completed_at: "2026-10-01T10:00:00Z" },
];
const input: any = { members, completions, submissions: [], chapters, assignmentsCount: 0, sinceJoin: true, now };

describe("class KPIs", () => {
  it("counts a student active when they finished something in the last 7 days", () => {
    const k = computeKpis(input, buildStudentRows(input));
    expect(k.active7d).toBe(1);
    expect(k.lessons7d).toBe(1);
  });
  it("counts every solved problem", () => {
    expect(computeKpis(input, buildStudentRows(input)).problems).toBe(2);
  });
});
