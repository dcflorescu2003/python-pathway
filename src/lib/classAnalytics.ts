import type { Chapter } from "@/hooks/useChapters";
import type { CompetencyRow } from "@/lib/studentReportData";
import { resolveLessonTitle } from "@/lib/lessonTitles";

// ─── Input shapes (loose on purpose: mirror the Supabase rows) ───

export interface RawCompletion {
  user_id: string;
  lesson_id: string;
  score: number | null;
  completed_at: string | null;
}

export interface MemberLike {
  student_id: string;
  joined_at?: string | null;
  profile?: {
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    xp?: number | null;
    streak?: number | null;
  } | null;
}

export interface SubmissionLike {
  id: string;
  student_id: string;
  assignment_id: string;
  total_score: number | null;
  max_score: number | null;
  submitted_at: string | null;
  test_title?: string;
}

export interface AnswerLike {
  test_item_id: string;
  score: number | null;
  max_points: number | null;
  test_items?: {
    source_type?: string | null;
    source_id?: string | null;
    custom_data?: any;
  } | null;
}

export type ItemKind = "lesson" | "review" | "problem" | "archived";

export const clampPct = (v: number | null | undefined): number =>
  Math.min(100, Math.max(0, Math.round(Number(v ?? 0))));

const dayKey = (iso: string) => iso.slice(0, 10);

/**
 * Classifies a `completed_lessons.lesson_id`:
 *  - `problem-*`          → problem solved
 *  - `<lessonId>f`        → "Fixare" (review) run of a real lesson
 *  - known lesson id      → lesson
 *  - anything else        → archived (curriculum id no longer exists)
 */
export function classifyCompletion(lessonId: string, knownLessonIds: Set<string>): ItemKind {
  if (lessonId.startsWith("problem-")) return "problem";
  if (knownLessonIds.has(lessonId)) return "lesson";
  if (lessonId.endsWith("f") && knownLessonIds.has(lessonId.slice(0, -1))) return "review";
  return "archived";
}

export function buildKnownLessonIds(chapters: Chapter[]): Set<string> {
  const set = new Set<string>();
  chapters.forEach((ch) => ch.lessons.forEach((l) => set.add(l.id)));
  return set;
}

export interface StudentRow {
  studentId: string;
  name: string;
  lessons: number;
  reviews: number;
  problems: number;
  archived: number;
  avgLessonScore: number | null;
  avgTestScore: number | null;
  testsSubmitted: number;
  lastActivity: string | null;
  daysInactive: number | null;
  xp: number;
  streak: number;
  atRisk: boolean;
  riskReasons: string[];
}

export interface ClassAnalyticsInput {
  members: MemberLike[];
  completions: RawCompletion[];
  submissions: SubmissionLike[];
  chapters: Chapter[];
  assignmentsCount: number;
  /** When true, only activity recorded after the student joined the class counts. */
  sinceJoin: boolean;
  now?: Date;
}

const daysBetween = (from: Date, to: Date) =>
  Math.floor((to.getTime() - from.getTime()) / 86_400_000);

/** Filters completions to the ones that count for the class view. */
export function scopedCompletions(input: ClassAnalyticsInput): RawCompletion[] {
  const joinedBy = new Map<string, string | null>();
  input.members.forEach((m) => joinedBy.set(m.student_id, m.joined_at ?? null));
  return input.completions.filter((c) => {
    if (!joinedBy.has(c.user_id)) return false;
    if (!input.sinceJoin) return true;
    const joined = joinedBy.get(c.user_id);
    if (!joined || !c.completed_at) return true;
    return c.completed_at >= joined;
  });
}

export function buildStudentRows(input: ClassAnalyticsInput): StudentRow[] {
  const now = input.now ?? new Date();
  const known = buildKnownLessonIds(input.chapters);
  const rows = scopedCompletions(input);

  return input.members
    .map((m) => {
      const mine = rows.filter((r) => r.user_id === m.student_id);
      const counts = { lesson: 0, review: 0, problem: 0, archived: 0 };
      const lessonScores: number[] = [];
      let last: string | null = null;

      mine.forEach((r) => {
        const kind = classifyCompletion(r.lesson_id, known);
        counts[kind]++;
        if (kind !== "problem") lessonScores.push(clampPct(r.score));
        if (r.completed_at && (!last || r.completed_at > last)) last = r.completed_at;
      });

      const subs = input.submissions.filter((s) => s.student_id === m.student_id);
      const testPercents = subs
        .filter((s) => Number(s.max_score) > 0)
        .map((s) => clampPct((Number(s.total_score) / Number(s.max_score)) * 100));

      const avgLessonScore = lessonScores.length
        ? Math.round(lessonScores.reduce((a, b) => a + b, 0) / lessonScores.length)
        : null;
      const avgTestScore = testPercents.length
        ? Math.round(testPercents.reduce((a, b) => a + b, 0) / testPercents.length)
        : null;

      const daysInactive = last ? daysBetween(new Date(last), now) : null;

      const riskReasons: string[] = [];
      if (last === null) riskReasons.push("nicio activitate");
      else if ((daysInactive ?? 0) >= 14) riskReasons.push(`inactiv ${daysInactive} zile`);
      if (avgLessonScore !== null && avgLessonScore < 60) riskReasons.push(`medie ${avgLessonScore}%`);
      if (input.assignmentsCount > 0 && subs.length === 0) riskReasons.push("niciun test predat");

      const name =
        m.profile?.display_name ||
        [m.profile?.last_name, m.profile?.first_name].filter(Boolean).join(" ") ||
        "Elev";

      return {
        studentId: m.student_id,
        name,
        lessons: counts.lesson,
        reviews: counts.review,
        problems: counts.problem,
        archived: counts.archived,
        avgLessonScore,
        avgTestScore,
        testsSubmitted: subs.length,
        lastActivity: last,
        daysInactive,
        xp: m.profile?.xp ?? 0,
        streak: m.profile?.streak ?? 0,
        atRisk: riskReasons.length > 0,
        riskReasons,
      } satisfies StudentRow;
    })
    .sort((a, b) => (b.avgLessonScore ?? -1) - (a.avgLessonScore ?? -1));
}

export interface ClassKpis {
  totalStudents: number;
  activeStudents: number;
  active7d: number;
  /** Average of per-student lesson averages, computed only over students with data. */
  classAvg: number | null;
  lessons: number;
  reviews: number;
  problems: number;
  archived: number;
  lessons7d: number;
  atRisk: number;
  submittedCount: number;
  expectedSubmissions: number;
  submissionRate: number | null;
}

export function computeKpis(input: ClassAnalyticsInput, rows: StudentRow[]): ClassKpis {
  const now = input.now ?? new Date();
  const known = buildKnownLessonIds(input.chapters);
  const scoped = scopedCompletions(input);
  const cutoff7 = new Date(now.getTime() - 6 * 86_400_000).toISOString().slice(0, 10);

  const counts = { lesson: 0, review: 0, problem: 0, archived: 0 };
  let lessons7d = 0;
  const active7 = new Set<string>();

  scoped.forEach((c) => {
    const kind = classifyCompletion(c.lesson_id, known);
    counts[kind]++;
    if (c.completed_at && dayKey(c.completed_at) >= cutoff7) {
      active7.add(c.user_id);
      if (kind !== "problem") lessons7d++;
    }
  });

  const withData = rows.filter((r) => r.avgLessonScore !== null);
  const classAvg = withData.length
    ? Math.round(withData.reduce((s, r) => s + (r.avgLessonScore ?? 0), 0) / withData.length)
    : null;

  const submittedCount = input.submissions.length;
  const expectedSubmissions = input.assignmentsCount * input.members.length;

  return {
    totalStudents: input.members.length,
    activeStudents: rows.filter((r) => r.lessons + r.reviews + r.problems > 0).length,
    active7d: active7.size,
    classAvg,
    lessons: counts.lesson,
    reviews: counts.review,
    problems: counts.problem,
    archived: counts.archived,
    lessons7d,
    atRisk: rows.filter((r) => r.atRisk).length,
    submittedCount,
    expectedSubmissions,
    submissionRate: expectedSubmissions > 0 ? Math.round((submittedCount / expectedSubmissions) * 100) : null,
  };
}

export interface ScoreBucket {
  range: string;
  count: number;
  tone: "bad" | "mid" | "ok" | "good";
}

/** Distribution over lesson + review completions (problems excluded). */
export function buildScoreDistribution(input: ClassAnalyticsInput): ScoreBucket[] {
  const known = buildKnownLessonIds(input.chapters);
  const buckets: ScoreBucket[] = [
    { range: "0-49%", count: 0, tone: "bad" },
    { range: "50-69%", count: 0, tone: "mid" },
    { range: "70-89%", count: 0, tone: "ok" },
    { range: "90-100%", count: 0, tone: "good" },
  ];
  scopedCompletions(input).forEach((c) => {
    if (classifyCompletion(c.lesson_id, known) === "problem") return;
    const pct = clampPct(c.score);
    if (pct < 50) buckets[0].count++;
    else if (pct < 70) buckets[1].count++;
    else if (pct < 90) buckets[2].count++;
    else buckets[3].count++;
  });
  return buckets;
}

export interface WeakLesson {
  id: string;
  name: string;
  avgScore: number;
  attempts: number;
  students: number;
}

/**
 * Lessons where the class scores under 80%. Archived ids are excluded (they
 * are reported separately as a single aggregate).
 */
export function buildWeakLessons(
  input: ClassAnalyticsInput,
  manualTitles: Record<string, string>
): WeakLesson[] {
  const known = buildKnownLessonIds(input.chapters);
  const acc: Record<string, { total: number; count: number; students: Set<string> }> = {};

  scopedCompletions(input).forEach((c) => {
    const kind = classifyCompletion(c.lesson_id, known);
    if (kind === "problem" || kind === "archived") return;
    const entry = (acc[c.lesson_id] ??= { total: 0, count: 0, students: new Set() });
    entry.total += clampPct(c.score);
    entry.count++;
    entry.students.add(c.user_id);
  });

  return Object.entries(acc)
    .map(([id, v]) => ({
      id,
      name: resolveLessonTitle(id, input.chapters, manualTitles),
      avgScore: Math.round(v.total / v.count),
      attempts: v.count,
      students: v.students.size,
    }))
    .filter((l) => l.avgScore < 80)
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 8);
}

export interface ChapterProgress {
  chapterId: string;
  title: string;
  totalLessons: number;
  /** Average share of the chapter completed across all class members (%). */
  coverage: number;
  avgScore: number | null;
  studentsStarted: number;
  studentsCompleted: number;
}

export function buildChapterProgress(input: ClassAnalyticsInput): ChapterProgress[] {
  const scoped = scopedCompletions(input);
  const memberIds = input.members.map((m) => m.student_id);

  return input.chapters.map((ch) => {
    const lessonIds = new Set(ch.lessons.map((l) => l.id));
    let scoreSum = 0;
    let scoreCount = 0;
    const doneByStudent = new Map<string, Set<string>>();

    scoped.forEach((c) => {
      if (!lessonIds.has(c.lesson_id)) return;
      scoreSum += clampPct(c.score);
      scoreCount++;
      const set = doneByStudent.get(c.user_id) ?? new Set<string>();
      set.add(c.lesson_id);
      doneByStudent.set(c.user_id, set);
    });

    const total = lessonIds.size || 1;
    const coverage = memberIds.length
      ? Math.round(
          (memberIds.reduce((s, id) => s + (doneByStudent.get(id)?.size ?? 0) / total, 0) /
            memberIds.length) *
            100
        )
      : 0;

    return {
      chapterId: ch.id,
      title: ch.title,
      totalLessons: lessonIds.size,
      coverage,
      avgScore: scoreCount ? Math.round(scoreSum / scoreCount) : null,
      studentsStarted: [...doneByStudent.values()].filter((s) => s.size > 0).length,
      studentsCompleted: [...doneByStudent.values()].filter((s) => s.size >= lessonIds.size).length,
    };
  });
}

export interface TrendPoint {
  day: string;
  label: string;
  lessons: number;
  problems: number;
  activeUsers: number;
}

export function buildTrend(input: ClassAnalyticsInput, days = 30): TrendPoint[] {
  const now = input.now ?? new Date();
  const known = buildKnownLessonIds(input.chapters);
  const scoped = scopedCompletions(input);

  const byDay = new Map<string, { lessons: number; problems: number; users: Set<string> }>();
  scoped.forEach((c) => {
    if (!c.completed_at) return;
    const key = dayKey(c.completed_at);
    const entry = byDay.get(key) ?? { lessons: 0, problems: 0, users: new Set<string>() };
    if (classifyCompletion(c.lesson_id, known) === "problem") entry.problems++;
    else entry.lessons++;
    entry.users.add(c.user_id);
    byDay.set(key, entry);
  });

  const out: TrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    const e = byDay.get(key);
    out.push({
      day: key,
      label: key.slice(5),
      lessons: e?.lessons ?? 0,
      problems: e?.problems ?? 0,
      activeUsers: e?.users.size ?? 0,
    });
  }
  return out;
}

export interface TestStat {
  title: string;
  shortTitle: string;
  avg: number;
  median: number;
  min: number;
  max: number;
  below50: number;
  count: number;
  missing: number;
}

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
};

export function buildTestStats(input: ClassAnalyticsInput): TestStat[] {
  const groups = new Map<string, number[]>();
  input.submissions.forEach((s) => {
    if (!(Number(s.max_score) > 0)) return;
    const title = s.test_title || "Test";
    const arr = groups.get(title) ?? [];
    arr.push(clampPct((Number(s.total_score) / Number(s.max_score)) * 100));
    groups.set(title, arr);
  });

  return [...groups.entries()].map(([title, scores]) => ({
    title,
    shortTitle: title.length > 18 ? `${title.slice(0, 18)}…` : title,
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    median: median(scores),
    min: Math.min(...scores),
    max: Math.max(...scores),
    below50: scores.filter((v) => v < 50).length,
    count: scores.length,
    missing: Math.max(0, input.members.length - scores.length),
  }));
}

export interface ItemDifficulty {
  key: string;
  question: string;
  itemType: string | null;
  avgPercent: number;
  zeroCount: number;
  partialCount: number;
  fullCount: number;
  total: number;
}

/**
 * Per-item difficulty: average earned share of the points, plus how many
 * students got 0, partial credit or full marks (partial matters for AI-graded
 * code items, where "wrong" was previously misleading).
 */
export function buildItemDifficulty(
  answers: AnswerLike[],
  sourceTitles: Record<string, string>,
  limit = 8
): ItemDifficulty[] {
  const acc: Record<string, ItemDifficulty & { sum: number }> = {};

  answers.forEach((a) => {
    const item = a.test_items;
    if (!item) return;
    const key = item.source_id || a.test_item_id;
    const max = Number(a.max_points ?? 0);
    if (!(max > 0)) return;
    const score = Number(a.score ?? 0);

    let question = "Item șters";
    if (item.source_type === "custom" && item.custom_data?.question) question = item.custom_data.question;
    else if (item.source_id && sourceTitles[item.source_id]) question = sourceTitles[item.source_id];

    const entry = (acc[key] ??= {
      key,
      question: question.length > 70 ? `${question.slice(0, 70)}…` : question,
      itemType: (item.source_type as string) ?? null,
      avgPercent: 0,
      zeroCount: 0,
      partialCount: 0,
      fullCount: 0,
      total: 0,
      sum: 0,
    });

    entry.total++;
    entry.sum += (score / max) * 100;
    if (score <= 0) entry.zeroCount++;
    else if (score < max) entry.partialCount++;
    else entry.fullCount++;
  });

  return Object.values(acc)
    .map(({ sum, ...rest }) => ({ ...rest, avgPercent: Math.round(sum / rest.total) }))
    .filter((e) => e.avgPercent < 100)
    .sort((a, b) => a.avgPercent - b.avgPercent)
    .slice(0, limit);
}

export interface ClassCompetency {
  specificId: string;
  generalCode: string;
  generalTitle: string;
  specificCode: string;
  specificTitle: string;
  mastery: number;
  evaluatedStudents: number;
}

/** Averages each specific competency across the students that have data. */
export function aggregateClassCompetencies(perStudent: CompetencyRow[][]): ClassCompetency[] {
  const acc = new Map<string, ClassCompetency & { sum: number }>();

  perStudent.forEach((rows) => {
    (rows ?? []).forEach((c) => {
      if (c.mastery === null || !(Number(c.max_sum) > 0)) return;
      const entry =
        acc.get(c.specific_id) ??
        ({
          specificId: c.specific_id,
          generalCode: c.general_code,
          generalTitle: c.general_title,
          specificCode: c.specific_code,
          specificTitle: c.specific_title,
          mastery: 0,
          evaluatedStudents: 0,
          sum: 0,
        } as ClassCompetency & { sum: number });
      entry.sum += Number(c.mastery);
      entry.evaluatedStudents++;
      acc.set(c.specific_id, entry);
    });
  });

  return [...acc.values()]
    .map(({ sum, ...rest }) => ({ ...rest, mastery: sum / rest.evaluatedStudents }))
    .sort((a, b) => a.mastery - b.mastery);
}
