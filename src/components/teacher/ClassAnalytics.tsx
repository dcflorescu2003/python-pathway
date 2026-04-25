import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClassMembers } from "@/hooks/useTeacher";
import { useChapters } from "@/hooks/useChapters";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Target, AlertTriangle, CheckCircle, Award,
  Download, FileText, FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { resolveLessonTitle } from "@/lib/lessonTitles";

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

// ─── Export Helpers ───

function escapeCSV(val: string | number | null | undefined): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadFile(content: string, filename: string, type: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface StudentStat {
  name: string;
  lessonsCompleted: number;
  avgScore: number;
  avgTestScore: number | null;
  xp: number;
  streak: number;
}

function exportCSV(className: string, studentStats: StudentStat[], classAvg: number, totalLessons: number, weakestLessons: any[], testPerformance: any[]) {
  const lines: string[] = [];
  const date = new Date().toLocaleDateString("ro-RO");
  
  lines.push(`Raport clasă: ${className}`);
  lines.push(`Data: ${date}`);
  lines.push(`Medie clasă: ${classAvg}%`);
  lines.push(`Total lecții completate: ${totalLessons}`);
  lines.push("");
  
  // Student table
  lines.push("Elev,Lecții completate,Medie lecții (%),Medie teste (%),XP,Streak");
  studentStats.forEach((s) => {
    lines.push([
      escapeCSV(s.name),
      s.lessonsCompleted,
      s.avgScore,
      s.avgTestScore ?? "-",
      s.xp,
      s.streak,
    ].join(","));
  });
  
  if (weakestLessons.length > 0) {
    lines.push("");
    lines.push("Lecții problematice (medie < 80%)");
    lines.push("Lecție,Medie (%),Încercări");
    weakestLessons.forEach((l) => {
      lines.push([escapeCSV(l.name), l.avgScore, l.attempts].join(","));
    });
  }
  
  if (testPerformance.length > 0) {
    lines.push("");
    lines.push("Performanță teste");
    lines.push("Test,Medie (%),Submisiuni");
    testPerformance.forEach((t) => {
      lines.push([escapeCSV(t.name), t.avg, t.count].join(","));
    });
  }
  
  downloadFile(lines.join("\n"), `raport_${className.replace(/\s+/g, "_")}_${date}.csv`, "text/csv");
  toast.success("CSV descărcat! 📊");
}

function exportPDF(className: string, studentStats: StudentStat[], classAvg: number, totalLessons: number, totalTests: number, weakestLessons: any[], testPerformance: any[], frequentErrors: any[]) {
  const date = new Date().toLocaleDateString("ro-RO");
  
  // Build HTML content for PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Raport ${className}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 12px; line-height: 1.5; }
  .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #6d28d9; }
  .header h1 { font-size: 22px; color: #6d28d9; margin-bottom: 4px; }
  .header p { color: #666; font-size: 11px; }
  .kpis { display: flex; gap: 12px; margin-bottom: 20px; }
  .kpi { flex: 1; background: #f8f5ff; border-radius: 8px; padding: 12px; text-align: center; border: 1px solid #e9e0f7; }
  .kpi .value { font-size: 24px; font-weight: bold; color: #6d28d9; }
  .kpi .label { font-size: 10px; color: #666; }
  .section { margin-bottom: 20px; }
  .section h2 { font-size: 14px; color: #1a1a1a; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f3f0ff; color: #6d28d9; text-align: left; padding: 6px 8px; font-weight: 600; }
  td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; }
  tr:nth-child(even) td { background: #fafafa; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
  .badge-good { background: #dcfce7; color: #166534; }
  .badge-mid { background: #fef3c7; color: #92400e; }
  .badge-bad { background: #fee2e2; color: #991b1b; }
  .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 8px; }
</style>
</head>
<body>
  <div class="header">
    <h1>📊 Raport clasă: ${className}</h1>
    <p>Generat pe ${date} • Python Pathway</p>
  </div>
  
  <div class="kpis">
    <div class="kpi">
      <div class="value">${studentStats.filter(s => s.lessonsCompleted > 0).length}/${studentStats.length}</div>
      <div class="label">Elevi activi</div>
    </div>
    <div class="kpi">
      <div class="value">${classAvg}%</div>
      <div class="label">Medie clasă</div>
    </div>
    <div class="kpi">
      <div class="value">${totalLessons}</div>
      <div class="label">Lecții completate</div>
    </div>
    <div class="kpi">
      <div class="value">${totalTests}</div>
      <div class="label">Teste trimise</div>
    </div>
  </div>
  
  <div class="section">
    <h2>🏆 Clasament elevi</h2>
    <table>
      <thead>
        <tr><th>#</th><th>Elev</th><th>Lecții</th><th>Medie lecții</th><th>Medie teste</th><th>XP</th><th>Streak</th></tr>
      </thead>
      <tbody>
        ${studentStats.map((s, i) => {
          const badgeClass = s.avgScore >= 80 ? "badge-good" : s.avgScore >= 50 ? "badge-mid" : "badge-bad";
          return `<tr>
            <td>${i + 1}</td>
            <td>${s.name}</td>
            <td>${s.lessonsCompleted}</td>
            <td><span class="badge ${badgeClass}">${s.avgScore}%</span></td>
            <td>${s.avgTestScore !== null ? `${s.avgTestScore}%` : "-"}</td>
            <td>${s.xp}</td>
            <td>${s.streak} 🔥</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
  </div>
  
  ${weakestLessons.length > 0 ? `
  <div class="section">
    <h2>⚠️ Lecții problematice (medie &lt; 80%)</h2>
    <table>
      <thead><tr><th>Lecție</th><th>Medie</th><th>Încercări</th></tr></thead>
      <tbody>
        ${weakestLessons.map(l => `<tr><td>${l.name}</td><td><span class="badge badge-bad">${l.avgScore}%</span></td><td>${l.attempts}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}
  
  ${testPerformance.length > 0 ? `
  <div class="section">
    <h2>📝 Performanță teste</h2>
    <table>
      <thead><tr><th>Test</th><th>Medie</th><th>Submisiuni</th></tr></thead>
      <tbody>
        ${testPerformance.map(t => {
          const bc = t.avg >= 80 ? "badge-good" : t.avg >= 50 ? "badge-mid" : "badge-bad";
          return `<tr><td>${t.name}</td><td><span class="badge ${bc}">${t.avg}%</span></td><td>${t.count}</td></tr>`;
        }).join("")}
      </tbody>
    </table>
  </div>` : ""}
  
  ${frequentErrors.length > 0 ? `
  <div class="section">
    <h2>❌ Erori frecvente în teste</h2>
    <table>
      <thead><tr><th>Întrebare</th><th>Rată eroare</th><th>Total răspunsuri</th></tr></thead>
      <tbody>
        ${frequentErrors.map(e => `<tr><td>${e.question}</td><td><span class="badge badge-bad">${e.errorRate}%</span></td><td>${e.total}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}
  
  <div class="footer">
    Raport generat automat de Python Pathway • ${date}
  </div>
</body>
</html>`;

  // Open print dialog for PDF
  const win = window.open("", "_blank");
  if (!win) {
    toast.error("Permite pop-up-urile pentru a descărca PDF-ul.");
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.print();
  }, 500);
  toast.success("PDF pregătit pentru descărcare! 📄");
}

const ClassAnalytics = ({ classId, className: clsName }: Props) => {
  const { data: members = [] } = useClassMembers(classId);
  const { data: chapters = [] } = useChapters();
  const studentIds = useMemo(() => members.map((m) => m.student_id), [members]);

  const { data: manualLessonTitles = {} } = useQuery({
    queryKey: ["manual-lesson-titles"],
    queryFn: async () => {
      const { data } = await supabase.from("manual_lessons").select("id, title");
      const map: Record<string, string> = {};
      (data || []).forEach((l: any) => { map[l.id] = l.title; });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

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

  const { data: testData } = useQuery({
    queryKey: ["analytics-tests", classId],
    queryFn: async () => {
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

  // Build a map of lesson_id -> exercise count for score normalization
  const exerciseCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ch of chapters) {
      for (const lesson of ch.lessons) {
        map[lesson.id] = lesson.exercises.length;
      }
    }
    return map;
  }, [chapters]);

  // Scores are stored directly as percentages (0-100) for both lessons and problems.
  const normalizeScore = (_lessonId: string, rawScore: number): number => {
    return Math.min(100, Math.max(0, rawScore));
  };

  const studentStats = useMemo(() => {
    return members.map((m) => {
      const lessons = completedLessons.filter((cl) => cl.user_id === m.student_id);
      const avgScore = lessons.length > 0
        ? Math.round(lessons.reduce((s, l) => s + normalizeScore(l.lesson_id, l.score), 0) / lessons.length)
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
  }, [members, completedLessons, submissions, exerciseCountMap]);

  const scoreDistribution = useMemo(() => {
    const buckets = [
      { range: "0-49%", count: 0, fill: "hsl(var(--destructive))" },
      { range: "50-69%", count: 0, fill: "hsl(var(--warning, 45 93% 47%))" },
      { range: "70-89%", count: 0, fill: "hsl(var(--primary))" },
      { range: "90-100%", count: 0, fill: "hsl(142 76% 36%)" },
    ];
    completedLessons.forEach((cl) => {
      const pct = normalizeScore(cl.lesson_id, cl.score);
      if (pct < 50) buckets[0].count++;
      else if (pct < 70) buckets[1].count++;
      else if (pct < 90) buckets[2].count++;
      else buckets[3].count++;
    });
    return buckets;
  }, [completedLessons, exerciseCountMap]);

  const weakestLessons = useMemo(() => {
    const lessonScores: Record<string, { total: number; count: number; id: string }> = {};
    completedLessons.forEach((cl) => {
      if (!lessonScores[cl.lesson_id]) {
        lessonScores[cl.lesson_id] = { total: 0, count: 0, id: cl.lesson_id };
      }
      lessonScores[cl.lesson_id].total += normalizeScore(cl.lesson_id, cl.score);
      lessonScores[cl.lesson_id].count++;
    });

    return Object.values(lessonScores)
      .map((ls) => {
        const avg = Math.round(ls.total / ls.count);
        const name = resolveLessonTitle(ls.id, chapters, manualLessonTitles);
        return { name, avgScore: avg, attempts: ls.count, id: ls.id };
      })
      .filter((l) => l.avgScore < 80)
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 8);
  }, [completedLessons, chapters, manualLessonTitles]);

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
      {/* Export buttons */}
      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => exportCSV(clsName, studentStats, classAvg, totalLessonsCompleted, weakestLessons, testPerformance)}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => exportPDF(clsName, studentStats, classAvg, totalLessonsCompleted, submissions.length, weakestLessons, testPerformance, frequentErrors)}
        >
          <FileText className="h-3.5 w-3.5" /> Export PDF
        </Button>
      </div>

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
