import { supabase } from "@/integrations/supabase/client";
import type { Chapter } from "@/hooks/useChapters";
import { resolveLessonTitle } from "@/lib/lessonTitles";

export interface CompetencyRow {
  general_id: string;
  general_code: string;
  general_title: string;
  specific_id: string;
  specific_code: string;
  specific_title: string;
  attempts: number;
  score_sum: number;
  max_sum: number;
  mastery: number | null;
}

export interface LessonScore {
  lessonId: string;
  title: string;
  chapterTitle: string | null;
  score: number;
  completedAt: string | null;
}

export interface MissingLesson {
  lessonId: string;
  title: string;
  chapterTitle: string;
}

export interface TestItemResult {
  question: string;
  itemType: string | null;
  score: number;
  maxPoints: number;
}

export interface TestResultSummary {
  testTitle: string;
  submittedAt: string | null;
  totalScore: number | null;
  maxScore: number | null;
  percent: number | null;
  wrongItems: TestItemResult[];
  itemCount: number;
}

export interface ProblemsByChapter {
  chapterTitle: string;
  solved: number;
}

export interface StudentReportData {
  studentId: string;
  name: string;
  xp: number;
  streak: number;
  lastActivity: string | null;
  avgLessonScore: number | null;
  avgTestScore: number | null;
  lessons: LessonScore[];
  weakLessons: LessonScore[];
  missingLessons: MissingLesson[];
  tests: TestResultSummary[];
  problemsSolved: number;
  problemsByChapter: ProblemsByChapter[];
  competencies: CompetencyRow[];
}

export interface StudentProfileLike {
  user_id: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  xp?: number | null;
  streak?: number | null;
}

function stripHtml(text: unknown): string {
  return String(text ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shorten(text: string, max = 120): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Assignments of a class, cached by callers via react-query. */
export async function fetchClassAssignments(classId: string) {
  const { data } = await supabase
    .from("test_assignments")
    .select("id, test_id, tests(title)")
    .eq("class_id", classId);
  return (data ?? []) as any[];
}

export async function fetchManualLessonTitles(): Promise<Record<string, string>> {
  const { data } = await supabase.from("manual_lessons").select("id, title");
  const map: Record<string, string> = {};
  (data ?? []).forEach((l: any) => {
    map[l.id] = l.title;
  });
  return map;
}

interface FetchOpts {
  chapters: Chapter[];
  manualTitles: Record<string, string>;
  assignments: any[];
  problemChapterTitleById?: Record<string, string>;
}

/**
 * Aggregates everything a teacher needs about one student: lesson scores,
 * missing lessons, per-item test results, solved problems and the competency
 * profile. All reads go through RPCs/tables the teacher is already allowed
 * to see (get_students_for_teacher / get_submission_review scoped by class).
 */
export async function fetchStudentReport(
  profile: StudentProfileLike,
  opts: FetchOpts
): Promise<StudentReportData> {
  const { chapters, manualTitles, assignments, problemChapterTitleById = {} } = opts;
  const studentId = profile.user_id;

  const assignmentIds = assignments.map((a) => a.id);

  const [{ data: completed }, { data: competencies }, submissionsRes] = await Promise.all([
    supabase
      .from("completed_lessons")
      .select("lesson_id, score, completed_at")
      .eq("user_id", studentId),
    (supabase as any).rpc("get_student_competency_profile", {
      p_user_id: studentId,
      p_mode: "blended",
    }),
    assignmentIds.length
      ? supabase
          .from("test_submissions")
          .select("id, assignment_id, total_score, max_score, submitted_at")
          .eq("student_id", studentId)
          .in("assignment_id", assignmentIds)
          .not("submitted_at", "is", null)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const rows = (completed ?? []) as { lesson_id: string; score: number; completed_at: string | null }[];

  const chapterTitleByLesson: Record<string, string> = {};
  chapters.forEach((ch) => ch.lessons.forEach((l) => { chapterTitleByLesson[l.id] = ch.title; }));

  const lessonRows = rows.filter((r) => !r.lesson_id.startsWith("problem-"));
  const problemRows = rows.filter((r) => r.lesson_id.startsWith("problem-"));

  const lessons: LessonScore[] = lessonRows
    .map((r) => ({
      lessonId: r.lesson_id,
      title: resolveLessonTitle(r.lesson_id, chapters, manualTitles),
      chapterTitle:
        chapterTitleByLesson[r.lesson_id] ??
        chapterTitleByLesson[r.lesson_id.replace(/f$/, "")] ??
        null,
      score: Math.min(100, Math.max(0, r.score ?? 0)),
      completedAt: r.completed_at,
    }))
    .sort((a, b) => a.score - b.score);

  const doneIds = new Set(lessonRows.map((r) => r.lesson_id));
  const missingLessons: MissingLesson[] = [];
  chapters.forEach((ch) =>
    ch.lessons.forEach((l) => {
      if (!doneIds.has(l.id)) {
        missingLessons.push({ lessonId: l.id, title: l.title, chapterTitle: ch.title });
      }
    })
  );

  const avgLessonScore = lessons.length
    ? Math.round(lessons.reduce((s, l) => s + l.score, 0) / lessons.length)
    : null;

  // Problems grouped by chapter title
  const problemCounts: Record<string, number> = {};
  problemRows.forEach((r) => {
    const pid = r.lesson_id.replace(/^problem-/, "");
    const chTitle = problemChapterTitleById[pid] ?? "Alte probleme";
    problemCounts[chTitle] = (problemCounts[chTitle] ?? 0) + 1;
  });
  const problemsByChapter = Object.entries(problemCounts)
    .map(([chapterTitle, solved]) => ({ chapterTitle, solved }))
    .sort((a, b) => b.solved - a.solved);

  // Tests + per-item detail
  const submissions = (submissionsRes as any)?.data ?? [];
  const titleByAssignment: Record<string, string> = {};
  assignments.forEach((a) => { titleByAssignment[a.id] = a.tests?.title || "Test"; });

  const tests: TestResultSummary[] = [];
  for (const sub of submissions) {
    let wrongItems: TestItemResult[] = [];
    let itemCount = 0;
    try {
      const { data: review } = await (supabase as any).rpc("get_submission_review", {
        p_submission_id: sub.id,
      });
      const items = (review ?? []) as any[];
      itemCount = items.length;
      wrongItems = items
        .map((it) => ({
          question: shorten(stripHtml(it.question || it.statement || "Item")),
          itemType: it.item_type ?? null,
          score: Number(it.score ?? 0),
          maxPoints: Number(it.max_points ?? 0),
        }))
        .filter((it) => it.maxPoints > 0 && it.score < it.maxPoints)
        .sort((a, b) => a.score / (a.maxPoints || 1) - b.score / (b.maxPoints || 1));
    } catch {
      // ignore — test detail is best-effort
    }
    const percent =
      sub.max_score && sub.max_score > 0
        ? Math.round(((sub.total_score ?? 0) / sub.max_score) * 100)
        : null;
    tests.push({
      testTitle: titleByAssignment[sub.assignment_id] ?? "Test",
      submittedAt: sub.submitted_at,
      totalScore: sub.total_score ?? null,
      maxScore: sub.max_score ?? null,
      percent,
      wrongItems,
      itemCount,
    });
  }
  tests.sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));

  const testPercents = tests.map((t) => t.percent).filter((p): p is number => p !== null);
  const avgTestScore = testPercents.length
    ? Math.round(testPercents.reduce((s, v) => s + v, 0) / testPercents.length)
    : null;

  const lastActivity = rows.reduce<string | null>((acc, r) => {
    if (!r.completed_at) return acc;
    return !acc || r.completed_at > acc ? r.completed_at : acc;
  }, null);

  const name =
    profile.display_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "Elev";

  return {
    studentId,
    name,
    xp: profile.xp ?? 0,
    streak: profile.streak ?? 0,
    lastActivity,
    avgLessonScore,
    avgTestScore,
    lessons,
    weakLessons: lessons.filter((l) => l.score < 80),
    missingLessons,
    tests,
    problemsSolved: problemRows.length,
    problemsByChapter,
    competencies: ((competencies ?? []) as CompetencyRow[]).map((c) => ({
      ...c,
      mastery: c.mastery === null ? null : Number(c.mastery),
    })),
  };
}
