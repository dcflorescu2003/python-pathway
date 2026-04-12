import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClassMembers } from "@/hooks/useTeacher";
import { useChapters } from "@/hooks/useChapters";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Target, AlertTriangle, CheckCircle, Award,
} from "lucide-react";

interface Props {
  classId: string;
  className: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--warning, 45 93% 47%))",
  "hsl(var(--muted-foreground))",
];

const ClassAnalytics = ({ classId, className: clsName }: Props) => {
  const { data: members = [] } = useClassMembers(classId);
  const { data: chapters = [] } = useChapters();
  const studentIds = useMemo(() => members.map((m) => m.student_id), [members]);

  // Fetch all completed lessons for class students
  const { data: completedLessons = [] } = useQuery({
    queryKey: ["analytics-completed", classId, studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const { data } = await supabase
        .from("completed_lessons")
        .select("user_id, lesson_id, score, completed_at")
        .in("user_id", studentIds);
      return data || [];
    },
    enabled: studentIds.length > 0,
  });

  // Fetch test submissions + answers for this class
  const { data: testData } = useQuery({
    queryKey: ["analytics-tests", classId],
    queryFn: async () => {
      // Get assignments for this class
      const { data: assignments } = await supabase
        .from("test_assignments")
        .select("id, test_id, tests(title)")
        .eq("class_id", classId);
      if (!assignments || assignments.length === 0) return { submissions: [], answers: [] };

      const assignmentIds = assignments.map((a) => a.id);
      const { data: submissions } = await supabase
        .from("test_submissions")
        .select("*")
        .in("assignment_id", assignmentIds)
        .not("submitted_at", "is", null);

      if (!submissions || submissions.length === 0) return { submissions: [], answers: [] };

      const submissionIds = submissions.map((s) => s.id);
      const { data: answers } = await supabase
        .from("test_answers")
        .select("*, test_items(source_type, source_id, custom_data)")
        .in("submission_id", submissionIds);

      return {
        submissions: submissions.map((s) => ({
          ...s,
          test_title: assignments.find((a) => a.id === s.assignment_id)?.tests?.title || "Test",
        })),
        answers: answers || [],
      };
    },
    enabled: studentIds.length > 0,
  });

  const submissions = testData?.submissions || [];
  const answers = testData?.answers || [];

  // ─── Computed Analytics ───

  // 1. Per-student lesson scores
  const studentStats = useMemo(() => {
    return members.map((m) => {
      const lessons = completedLessons.filter((cl) => cl.user_id === m.student_id);
      const avgScore = lessons.length > 0
        ? Math.round(lessons.reduce((s, l) => s + l.score, 0) / lessons.length)
        : 0;
      const testSubs = submissions.filter((s: any) => s.student_id === m.student_id);
      const avgTestScore = testSubs.length > 0
        ? Math.round(
            testSubs.reduce((s: number, t: any) => s + (t.max_score > 0 ? (t.total_score / t.max_score) * 100 : 0), 0) / testSubs.length
          )
        : null;
      return {
        name: m.profile?.display_name || "Elev",
        lessonsCompleted: lessons.length,
        avgScore,
        avgTestScore,
        xp: m.profile?.xp || 0,
        streak: m.profile?.streak || 0,
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [members, completedLessons, submissions]);

  // 2. Score distribution
  const scoreDistribution = useMemo(() => {
    const buckets = [
      { range: "0-49%", count: 0, fill: "hsl(var(--destructive))" },
      { range: "50-69%", count: 0, fill: "hsl(var(--warning, 45 93% 47%))" },
      { range: "70-89%", count: 0, fill: "hsl(var(--primary))" },
      { range: "90-100%", count: 0, fill: "hsl(142 76% 36%)" },
    ];
    completedLessons.forEach((cl) => {
      if (cl.score < 50) buckets[0].count++;
      else if (cl.score < 70) buckets[1].count++;
      else if (cl.score < 90) buckets[2].count++;
      else buckets[3].count++;
    });
    return buckets;
  }, [completedLessons]);

  // 3. Weakest lessons (most errors)
  const weakestLessons = useMemo(() => {
    const lessonScores: Record<string, { total: number; count: number; id: string }> = {};
    completedLessons.forEach((cl) => {
      if (!lessonScores[cl.lesson_id]) {
        lessonScores[cl.lesson_id] = { total: 0, count: 0, id: cl.lesson_id };
      }
      lessonScores[cl.lesson_id].total += cl.score;
      lessonScores[cl.lesson_id].count++;
    });

    return Object.values(lessonScores)
      .map((ls) => {
        const avg = Math.round(ls.total / ls.count);
        // Find lesson name
        let name = ls.id;
        for (const ch of chapters) {
          const lesson = ch.lessons.find((l) => l.id === ls.id);
          if (lesson) { name = lesson.title; break; }
        }
        return { name, avgScore: avg, attempts: ls.count, id: ls.id };
      })
      .filter((l) => l.avgScore < 80)
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 8);
  }, [completedLessons, chapters]);

  // 4. Test performance overview
  const testPerformance = useMemo(() => {
    const testMap: Record<string, { title: string; scores: number[] }> = {};
    submissions.forEach((s: any) => {
      if (!testMap[s.test_title]) testMap[s.test_title] = { title: s.test_title, scores: [] };
      if (s.max_score > 0) testMap[s.test_title].scores.push((s.total_score / s.max_score) * 100);
    });
    return Object.values(testMap).map((t) => ({
      name: t.title.length > 15 ? t.title.slice(0, 15) + "…" : t.title,
      avg: Math.round(t.scores.reduce((s, v) => s + v, 0) / t.scores.length),
      count: t.scores.length,
    }));
  }, [submissions]);

  // 5. Frequent wrong answer patterns from test answers
  const frequentErrors = useMemo(() => {
    const errorMap: Record<string, { question: string; wrongCount: number; totalCount: number }> = {};
    answers.forEach((a: any) => {
      const item = a.test_items;
      if (!item) return;
      const key = item.source_id || a.test_item_id;
      const question =
        item.source_type === "custom" && item.custom_data?.question
          ? item.custom_data.question
          : key;
      if (!errorMap[key]) errorMap[key] = { question, wrongCount: 0, totalCount: 0 };
      errorMap[key].totalCount++;
      if (Number(a.score) < Number(a.max_points)) errorMap[key].wrongCount++;
    });
    return Object.values(errorMap)
      .filter((e) => e.wrongCount > 0)
      .map((e) => ({
        question: e.question.length > 50 ? e.question.slice(0, 50) + "…" : e.question,
        errorRate: Math.round((e.wrongCount / e.totalCount) * 100),
        total: e.totalCount,
      }))
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 6);
  }, [answers]);

  // Summary stats
  const classAvg = studentStats.length > 0
    ? Math.round(studentStats.reduce((s, st) => s + st.avgScore, 0) / studentStats.length)
    : 0;
  const totalLessonsCompleted = completedLessons.length;
  const activeStudents = studentStats.filter((s) => s.lessonsCompleted > 0).length;

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Niciun elev în clasă. Statisticile vor apărea după ce se înscriu elevi.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{activeStudents}/{members.length}</p>
              <p className="text-[10px] text-muted-foreground">Elevi activi</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              {classAvg >= 70 ? (
                <TrendingUp className="h-4 w-4 text-primary" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{classAvg}%</p>
              <p className="text-[10px] text-muted-foreground">Medie clasă</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{totalLessonsCompleted}</p>
              <p className="text-[10px] text-muted-foreground">Lecții completate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{submissions.length}</p>
              <p className="text-[10px] text-muted-foreground">Teste trimise</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student ranking */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Clasament elevi
          </h3>
          <div className="space-y-2">
            {studentStats.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                  <span className="text-sm text-foreground">{s.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{s.lessonsCompleted} lecții</span>
                  <Badge
                    variant={s.avgScore >= 80 ? "default" : s.avgScore >= 50 ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {s.avgScore}%
                  </Badge>
                  {s.avgTestScore !== null && (
                    <span className="text-muted-foreground">Test: {s.avgTestScore}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Score distribution chart */}
      {completedLessons.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Distribuția scorurilor
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={scoreDistribution}>
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value: number) => [`${value} rezultate`, "Total"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {scoreDistribution.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Weakest lessons */}
      {weakestLessons.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Lecții cu cele mai multe greșeli
            </h3>
            <div className="space-y-2">
              {weakestLessons.map((l, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-foreground truncate max-w-[60%]">{l.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{l.attempts} încercări</span>
                    <Badge variant="destructive" className="text-xs">{l.avgScore}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test performance */}
      {testPerformance.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Performanță teste
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={testPerformance}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value: number) => [`${value}%`, "Medie"]}
                />
                <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Frequent errors from tests */}
      {frequentErrors.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Erori frecvente în teste
            </h3>
            <div className="space-y-2">
              {frequentErrors.map((e, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-foreground truncate max-w-[65%]">{e.question}</span>
                  <Badge variant="destructive" className="text-xs flex-shrink-0">
                    {e.errorRate}% greșit ({e.total})
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClassAnalytics;
