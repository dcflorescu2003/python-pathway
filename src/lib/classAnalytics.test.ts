import { describe, it, expect } from "vitest";
import type { Chapter } from "@/hooks/useChapters";
import {
  classifyCompletion, buildKnownLessonIds, buildStudentRows, computeKpis,
  buildChapterProgress, buildTestStats, buildItemDifficulty, aggregateClassCompetencies,
  buildWeakLessons, buildTrend,
  type ClassAnalyticsInput,
} from "@/lib/classAnalytics";

const lesson = (id: string) => ({ id, title: `Lecția ${id}`, description: "", exercises: [], xpReward: 10 });

const chapters: Chapter[] = [
  { id: "c1", number: 1, title: "Capitolul 1", description: "", icon: "", color: "", lessons: [lesson("c1-l1"), lesson("c1-l2")] },
  { id: "c2", number: 2, title: "Capitolul 2", description: "", icon: "", color: "", lessons: [lesson("c2-l1")] },
];

const NOW = new Date("2026-08-25T12:00:00Z");
const iso = (daysAgo: number) => new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString();

const baseInput = (over: Partial<ClassAnalyticsInput> = {}): ClassAnalyticsInput => ({
  members: [
    { student_id: "s1", joined_at: iso(30), profile: { display_name: "Ana", xp: 500, streak: 3 } },
    { student_id: "s2", joined_at: iso(30), profile: { display_name: "Bogdan", xp: 100, streak: 0 } },
  ],
  completions: [
    { user_id: "s1", lesson_id: "c1-l1", score: 100, completed_at: iso(1) },
    { user_id: "s1", lesson_id: "c1-l2", score: 60, completed_at: iso(2) },
    { user_id: "s1", lesson_id: "c1-l1f", score: 90, completed_at: iso(2) },
    { user_id: "s1", lesson_id: "problem-p1", score: 100, completed_at: iso(3) },
    { user_id: "s1", lesson_id: "old-lesson-x", score: 40, completed_at: iso(4) },
    { user_id: "s2", lesson_id: "c1-l1", score: 40, completed_at: iso(20) },
  ],
  submissions: [
    { id: "sub1", student_id: "s1", assignment_id: "a1", total_score: 8, max_score: 10, submitted_at: iso(1), test_title: "Test 1" },
    { id: "sub2", student_id: "s2", assignment_id: "a1", total_score: 3, max_score: 10, submitted_at: iso(1), test_title: "Test 1" },
  ],
  chapters,
  assignmentsCount: 1,
  sinceJoin: true,
  now: NOW,
  ...over,
});

describe("classifyCompletion", () => {
  const known = buildKnownLessonIds(chapters);
  it("detects problems, lessons, reviews and archived ids", () => {
    expect(classifyCompletion("problem-p1", known)).toBe("problem");
    expect(classifyCompletion("c1-l1", known)).toBe("lesson");
    expect(classifyCompletion("c1-l1f", known)).toBe("review");
    expect(classifyCompletion("gone-123", known)).toBe("archived");
  });
});

describe("buildStudentRows", () => {
  it("splits counts by kind and computes averages", () => {
    const rows = buildStudentRows(baseInput());
    const ana = rows.find((r) => r.name === "Ana")!;
    expect(ana.lessons).toBe(2);
    expect(ana.reviews).toBe(1);
    expect(ana.problems).toBe(1);
    expect(ana.archived).toBe(1);
    // lesson-like scores: 100, 60, 90, 40 (archived counts toward score avg)
    expect(ana.avgLessonScore).toBe(73);
    expect(ana.avgTestScore).toBe(80);
    expect(ana.atRisk).toBe(false);
  });

  it("flags inactive and low-average students", () => {
    const rows = buildStudentRows(baseInput());
    const bogdan = rows.find((r) => r.name === "Bogdan")!;
    expect(bogdan.daysInactive).toBe(20);
    expect(bogdan.atRisk).toBe(true);
    expect(bogdan.riskReasons.join()).toMatch(/inactiv/);
  });

  it("ignores activity from before joining when sinceJoin is on", () => {
    const input = baseInput({
      members: [{ student_id: "s1", joined_at: iso(5), profile: { display_name: "Ana" } }],
      completions: [
        { user_id: "s1", lesson_id: "c1-l1", score: 100, completed_at: iso(10) },
        { user_id: "s1", lesson_id: "c1-l2", score: 50, completed_at: iso(1) },
      ],
      submissions: [],
      assignmentsCount: 0,
    });
    expect(buildStudentRows(input)[0].lessons).toBe(1);
    expect(buildStudentRows({ ...input, sinceJoin: false })[0].lessons).toBe(2);
  });
});

describe("computeKpis", () => {
  it("excludes students without data from the class average", () => {
    const input = baseInput({
      members: [
        { student_id: "s1", joined_at: iso(30), profile: { display_name: "Ana" } },
        { student_id: "s3", joined_at: iso(30), profile: { display_name: "Fără activitate" } },
      ],
      completions: [{ user_id: "s1", lesson_id: "c1-l1", score: 80, completed_at: iso(1) }],
      submissions: [],
      assignmentsCount: 0,
    });
    const rows = buildStudentRows(input);
    const k = computeKpis(input, rows);
    expect(k.classAvg).toBe(80);
    expect(k.activeStudents).toBe(1);
    expect(k.totalStudents).toBe(2);
  });

  it("computes 7-day activity and submission rate", () => {
    const input = baseInput();
    const k = computeKpis(input, buildStudentRows(input));
    expect(k.active7d).toBe(1);
    expect(k.lessons7d).toBe(4); // lessons + review + archived within 7 days
    expect(k.expectedSubmissions).toBe(2);
    expect(k.submissionRate).toBe(100);
    expect(k.archived).toBe(1);
  });
});

describe("buildWeakLessons", () => {
  it("excludes problems and archived ids", () => {
    const weak = buildWeakLessons(baseInput(), {});
    // weakest first: c1-l2 (60%) before c1-l1 (70%)
    expect(weak.map((w) => w.id)).toEqual(["c1-l2", "c1-l1"]);
    expect(weak.find((w) => w.id === "c1-l1")!.avgScore).toBe(70); // (100 + 40) / 2
  });
});

describe("buildChapterProgress", () => {
  it("computes average coverage across all members", () => {
    const progress = buildChapterProgress(baseInput());
    const c1 = progress.find((c) => c.chapterId === "c1")!;
    // Ana 2/2, Bogdan 1/2 → (100 + 50) / 2
    expect(c1.coverage).toBe(75);
    expect(c1.studentsStarted).toBe(2);
    expect(c1.studentsCompleted).toBe(1);
    expect(progress.find((c) => c.chapterId === "c2")!.coverage).toBe(0);
  });
});

describe("buildTestStats", () => {
  it("computes median, spread and missing submissions", () => {
    const [t] = buildTestStats(baseInput());
    expect(t.avg).toBe(55);
    expect(t.min).toBe(30);
    expect(t.max).toBe(80);
    expect(t.below50).toBe(1);
    expect(t.missing).toBe(0);
  });
});

describe("buildItemDifficulty", () => {
  it("separates zero, partial and full credit", () => {
    const out = buildItemDifficulty(
      [
        { test_item_id: "i1", score: 0, max_points: 4, test_items: { source_type: "exercise", source_id: "e1" } },
        { test_item_id: "i1", score: 2, max_points: 4, test_items: { source_type: "exercise", source_id: "e1" } },
        { test_item_id: "i2", score: 5, max_points: 5, test_items: { source_type: "exercise", source_id: "e2" } },
      ],
      { e1: "Întrebarea 1", e2: "Întrebarea 2" }
    );
    expect(out).toHaveLength(1);
    expect(out[0].question).toBe("Întrebarea 1");
    expect(out[0].avgPercent).toBe(25);
    expect(out[0].zeroCount).toBe(1);
    expect(out[0].partialCount).toBe(1);
    expect(out[0].fullCount).toBe(0);
  });
});

describe("aggregateClassCompetencies", () => {
  it("averages mastery over students with data, weakest first", () => {
    const row = (specific: string, mastery: number) => ({
      general_id: "g", general_code: "CG1", general_title: "G",
      specific_id: specific, specific_code: specific, specific_title: "S",
      attempts: 2, score_sum: 1, max_sum: 2, mastery,
    });
    const out = aggregateClassCompetencies([
      [row("CS1", 0.8), row("CS2", 0.2)],
      [row("CS1", 0.6), { ...row("CS2", 0), mastery: null }],
    ]);
    expect(out[0].specificCode).toBe("CS2");
    expect(out[0].evaluatedStudents).toBe(1);
    expect(out[1].mastery).toBeCloseTo(0.7);
  });
});

describe("buildTrend", () => {
  it("returns one point per day including empty days", () => {
    const trend = buildTrend(baseInput(), 7);
    expect(trend).toHaveLength(7);
    expect(trend[trend.length - 1].day).toBe("2026-08-25");
    expect(trend.reduce((s, p) => s + p.lessons + p.problems, 0)).toBe(5);
  });
});
