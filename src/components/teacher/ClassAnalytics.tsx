import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClassMembers } from "@/hooks/useTeacher";
import { useChapters } from "@/hooks/useChapters";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ComposedChart, Line, CartesianGrid, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Target, AlertTriangle, CheckCircle, Award,
  FileText, FileSpreadsheet, Loader2, BookOpen, Code2, Activity, GraduationCap,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { useReportDeps } from "@/hooks/useStudentReport";
import { fetchStudentReport, type CompetencyRow } from "@/lib/studentReportData";
import { buildStudentSectionHtml, openPrintDocument, BASE_REPORT_CSS, STUDENT_SECTION_CSS } from "@/lib/studentReportHtml";
import { masteryLevelLabel } from "@/lib/studentInsights";
import {
  buildStudentRows, computeKpis, buildScoreDistribution, buildWeakLessons,
  buildChapterProgress, buildTrend, buildTestStats, buildItemDifficulty,
  aggregateClassCompetencies,
  type ClassAnalyticsInput, type StudentRow,
} from "@/lib/classAnalytics";
import { buildClassReportHtml, buildClassCsv } from "@/lib/classReportHtml";

interface Props {
  classId: string;
  className: string;
}

const BUCKET_FILL: Record<string, string> = {
  bad: "hsl(var(--destructive))",
  mid: "hsl(var(--warning, 45 93% 47%))",
  ok: "hsl(var(--primary))",
  good: "hsl(142 76% 36%)",
};

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob(["\uFEFF" + content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("ro-RO") : "-");

type SortKey = keyof Pick<
  StudentRow,
  "name" | "lessons" | "reviews" | "problems" | "avgLessonScore" | "avgTestScore" | "testsSubmitted" | "lastActivity" | "streak" | "xp"
>;

const KpiCard = ({ icon: Icon, value, label, hint, tone }: {
  icon: any; value: string | number; label: string; hint?: string; tone?: "danger" | "warn";
}) => (
  <Card>
    <CardContent className="p-3 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${
        tone === "danger" ? "bg-destructive/10" : "bg-primary/10"
      }`}>
        <Icon className={`h-4 w-4 ${tone === "danger" ? "text-destructive" : "text-primary"}`} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        {hint && <p className="text-[10px] text-muted-foreground/70 truncate">{hint}</p>}
      </div>
    </CardContent>
  </Card>
);

const ClassAnalytics = ({ classId, className: clsName }: Props) => {
  const { data: members = [] } = useClassMembers(classId);
  const { data: chapters = [] } = useChapters();
  const studentIds = useMemo(() => members.map((m) => m.student_id), [members]);

  const [sinceJoin, setSinceJoin] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("avgLessonScore");
  const [sortAsc, setSortAsc] = useState(false);
  const [buildingFull, setBuildingFull] = useState(false);

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
      const empty = { submissions: [] as any[], answers: [] as any[], sourceTitles: {} as Record<string, string>, assignmentsCount: 0 };
      const { data: assignments } = await supabase
        .from("test_assignments")
        .select("id, test_id, tests(title)")
        .eq("class_id", classId);
      if (!assignments || assignments.length === 0) return empty;

      const assignmentsCount = assignments.length;
      const assignmentIds = assignments.map((a) => a.id);
      const { data: submissions } = await supabase
        .from("test_submissions")
        .select("*")
        .in("assignment_id", assignmentIds)
        .not("submitted_at", "is", null);

      if (!submissions || submissions.length === 0) return { ...empty, assignmentsCount };

      const submissionIds = submissions.map((s) => s.id);
      const { data: answers } = await supabase
        .from("test_answers")
        .select("*, test_items(source_type, source_id, custom_data)")
        .in("submission_id", submissionIds);

      const exerciseIds = new Set<string>();
      const problemIds = new Set<string>();
      (answers || []).forEach((a: any) => {
        const it = a.test_items;
        if (!it || !it.source_id) return;
        if (it.source_type === "exercise") exerciseIds.add(it.source_id);
        else if (it.source_type === "problem") problemIds.add(it.source_id);
      });

      const sourceTitles: Record<string, string> = {};
      if (exerciseIds.size > 0) {
        const ids = Array.from(exerciseIds);
        const [{ data: exData }, { data: evalData }] = await Promise.all([
          supabase.from("exercises").select("id, question, statement").in("id", ids),
          supabase.rpc("get_eval_exercises_for_teacher", { p_ids: ids }),
        ]);
        [...(exData || []), ...((evalData as any[]) || [])].forEach((e: any) => {
          const txt = (e.question || e.statement || "").trim();
          if (txt) sourceTitles[e.id] = txt;
        });
      }
      if (problemIds.size > 0) {
        const { data: pData } = await supabase
          .from("problems")
          .select("id, title, description")
          .in("id", Array.from(problemIds));
        (pData || []).forEach((p: any) => {
          sourceTitles[p.id] = (p.title || p.description || "").trim();
        });
      }

      return {
        submissions: submissions.map((s) => ({
          ...s,
          test_title: assignments.find((a) => a.id === s.assignment_id)?.tests?.title || "Test",
        })),
        answers: answers || [],
        sourceTitles,
        assignmentsCount,
      };
    },
    enabled: studentIds.length > 0,
  });

  const submissions = testData?.submissions || [];
  const answers = testData?.answers || [];
  const sourceTitles = testData?.sourceTitles || {};
  const assignmentsCount = testData?.assignmentsCount || 0;

  // Class-level competency profile: one RPC per student, cached together.
  const { data: classCompetencies = [] } = useQuery({
    queryKey: ["class-competencies", classId, studentIds],
    enabled: studentIds.length > 0,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const results = await Promise.all(
        studentIds.map(async (id) => {
          const { data } = await (supabase as any).rpc("get_student_competency_profile", {
            p_user_id: id,
            p_mode: "blended",
          });
          return ((data ?? []) as CompetencyRow[]).map((c) => ({
            ...c,
            mastery: c.mastery === null ? null : Number(c.mastery),
          }));
        })
      );
      return aggregateClassCompetencies(results);
    },
  });

  const input: ClassAnalyticsInput = useMemo(
    () => ({
      members: members as any,
      completions: completedLessons as any,
      submissions: submissions as any,
      chapters,
      assignmentsCount,
      sinceJoin,
    }),
    [members, completedLessons, submissions, chapters, assignmentsCount, sinceJoin]
  );

  const studentRows = useMemo(() => buildStudentRows(input), [input]);
  const kpis = useMemo(() => computeKpis(input, studentRows), [input, studentRows]);
  const scoreDistribution = useMemo(() => buildScoreDistribution(input), [input]);
  const weakLessons = useMemo(() => buildWeakLessons(input, manualLessonTitles), [input, manualLessonTitles]);
  const chapterProgress = useMemo(() => buildChapterProgress(input), [input]);
  const trend = useMemo(() => buildTrend(input, 30), [input]);
  const testStats = useMemo(() => buildTestStats(input), [input]);
  const itemDifficulty = useMemo(() => buildItemDifficulty(answers, sourceTitles), [answers, sourceTitles]);
  const weakCompetencies = useMemo(() => classCompetencies.slice(0, 8), [classCompetencies]);

  const sortedRows = useMemo(() => {
    const rows = [...studentRows];
    rows.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === "string" || typeof vb === "string") {
        return String(va ?? "").localeCompare(String(vb ?? ""));
      }
      return (Number(va ?? -1) - Number(vb ?? -1));
    });
    return sortAsc ? rows : rows.reverse();
  }, [studentRows, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key === "name");
    }
  };

  const reportDeps = useReportDeps(classId);

  const handleCsv = () => {
    const date = new Date().toLocaleDateString("ro-RO");
    downloadFile(
      buildClassCsv({ className: clsName, kpis, rows: studentRows, weakLessons, testStats, chapterProgress, itemDifficulty, competencies: weakCompetencies }),
      `raport_${clsName.replace(/\s+/g, "_")}_${date}.csv`,
      "text/csv"
    );
    toast.success("CSV descărcat! 📊");
  };

  const handlePdf = () => {
    const ok = openPrintDocument(
      `Raport ${clsName}`,
      buildClassReportHtml({ className: clsName, kpis, rows: studentRows, weakLessons, testStats, chapterProgress, itemDifficulty, competencies: weakCompetencies }),
      BASE_REPORT_CSS + STUDENT_SECTION_CSS
    );
    if (!ok) toast.error("Permite pop-up-urile pentru a descărca PDF-ul.");
    else toast.success("PDF pregătit pentru descărcare! 📄");
  };

  const handleFullReport = async () => {
    setBuildingFull(true);
    try {
      const sections: string[] = [];
      for (const m of members) {
        const profile = (m as any).profile ?? { user_id: m.student_id };
        const data = await fetchStudentReport({ ...profile, user_id: m.student_id }, reportDeps);
        sections.push(buildStudentSectionHtml(data, true));
      }
      const header = buildClassReportHtml({
        className: clsName, kpis, rows: studentRows, weakLessons, testStats,
        chapterProgress, itemDifficulty, competencies: weakCompetencies,
      });
      const ok = openPrintDocument(
        `Raport complet - ${clsName}`,
        header + sections.join(""),
        BASE_REPORT_CSS + STUDENT_SECTION_CSS
      );
      if (!ok) toast.error("Permite pop-up-urile pentru a genera raportul.");
      else toast.success("Raport complet generat 📄");
    } catch (e: any) {
      toast.error(e?.message || "Nu s-a putut genera raportul.");
    } finally {
      setBuildingFull(false);
    }
  };

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Niciun elev în clasă. Statisticile vor apărea după ce se înscriu elevi.
      </p>
    );
  }

  const SortHead = ({ k, children, align = "right" }: { k: SortKey; children: React.ReactNode; align?: "left" | "right" }) => (
    <TableHead
      className={`cursor-pointer select-none whitespace-nowrap ${align === "right" ? "text-right" : ""}`}
      onClick={() => toggleSort(k)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === k ? "text-primary" : "opacity-30"}`} />
      </span>
    </TableHead>
  );

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch id="since-join" checked={sinceJoin} onCheckedChange={setSinceJoin} />
          <Label htmlFor="since-join" className="text-xs text-muted-foreground">
            Doar activitatea din clasă
          </Label>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleCsv}>
            <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handlePdf}>
            <FileText className="h-3.5 w-3.5" /> Export PDF
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" disabled={buildingFull} onClick={handleFullReport}>
            {buildingFull ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            Raport complet (fișe elevi)
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={Users}
          value={`${kpis.activeStudents}/${kpis.totalStudents}`}
          label="Elevi activi"
          hint={`${kpis.active7d} activi în 7 zile`}
        />
        <KpiCard
          icon={kpis.classAvg !== null && kpis.classAvg >= 70 ? TrendingUp : TrendingDown}
          value={kpis.classAvg !== null ? `${kpis.classAvg}%` : "-"}
          label="Medie clasă"
          hint="doar elevii cu activitate"
        />
        <KpiCard
          icon={BookOpen}
          value={kpis.lessons}
          label="Lecții finalizate"
          hint={`${kpis.lessons7d} în ultimele 7 zile`}
        />
        <KpiCard
          icon={Code2}
          value={kpis.problems}
          label="Probleme rezolvate"
          hint={`${kpis.reviews} recapitulări`}
        />
        <KpiCard
          icon={Award}
          value={kpis.submittedCount}
          label="Teste predate"
          hint={
            kpis.submissionRate !== null
              ? `${kpis.submissionRate}% din ${kpis.expectedSubmissions} posibile`
              : "niciun test asignat"
          }
        />
        <KpiCard
          icon={AlertTriangle}
          value={kpis.atRisk}
          label="Elevi cu risc"
          hint="inactivi 14+ zile sau medie sub 60%"
          tone={kpis.atRisk > 0 ? "danger" : undefined}
        />
        <KpiCard
          icon={Activity}
          value={`${chapterProgress.length ? Math.round(chapterProgress.reduce((s, c) => s + c.coverage, 0) / chapterProgress.length) : 0}%`}
          label="Parcurgere curriculum"
          hint="medie pe toate capitolele"
        />
        <KpiCard
          icon={GraduationCap}
          value={weakCompetencies.length ? `${Math.round(weakCompetencies[0].mastery * 100)}%` : "-"}
          label="Cea mai slabă competență"
          hint={weakCompetencies.length ? weakCompetencies[0].specificCode : "fără date"}
        />
      </div>

      {kpis.archived > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {kpis.archived} finalizări provin din lecții eliminate din curriculum (arhivate) și nu sunt
          incluse în analizele pe lecții și capitole.
        </p>
      )}

      {/* Student table */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Situația elevilor
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead k="name" align="left">Elev</SortHead>
                  <SortHead k="lessons">Lecții</SortHead>
                  <SortHead k="reviews">Recap.</SortHead>
                  <SortHead k="problems">Probleme</SortHead>
                  <SortHead k="avgLessonScore">Medie lecții</SortHead>
                  <SortHead k="avgTestScore">Medie teste</SortHead>
                  <SortHead k="testsSubmitted">Teste</SortHead>
                  <SortHead k="lastActivity">Ultima activ.</SortHead>
                  <SortHead k="streak">Streak</SortHead>
                  <SortHead k="xp">XP</SortHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.map((s) => (
                  <TableRow key={s.studentId} className={s.atRisk ? "bg-destructive/5" : undefined}>
                    <TableCell className="text-sm">
                      <div className="flex flex-col">
                        <span className="text-foreground">{s.name}</span>
                        {s.atRisk && (
                          <span className="text-[10px] text-destructive">{s.riskReasons.join(" · ")}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{s.lessons}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{s.reviews}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{s.problems}</TableCell>
                    <TableCell className="text-right">
                      {s.avgLessonScore === null ? (
                        <span className="text-xs text-muted-foreground">-</span>
                      ) : (
                        <Badge
                          variant={s.avgLessonScore >= 80 ? "default" : s.avgLessonScore >= 50 ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {s.avgLessonScore}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {s.avgTestScore !== null ? `${s.avgTestScore}%` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {s.testsSubmitted}{assignmentsCount > 0 ? `/${assignmentsCount}` : ""}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(s.lastActivity)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{s.streak}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{s.xp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Trend */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Evoluția clasei (30 de zile)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="lessons" name="Lecții" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="problems" name="Probleme" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="activeUsers" name="Elevi activi" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Chapter progress */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Progres pe capitole
          </h3>
          <div className="space-y-3">
            {chapterProgress.map((c) => (
              <div key={c.chapterId}>
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="text-xs text-foreground truncate">{c.title}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {c.coverage}% parcurs · {c.studentsStarted}/{kpis.totalStudents} elevi
                    {c.avgScore !== null && ` · medie ${c.avgScore}%`}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${c.coverage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Class competencies */}
      {weakCompetencies.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Competențe de consolidat (nivel clasă)
            </h3>
            <div className="space-y-2">
              {weakCompetencies.map((c) => {
                const pct = Math.round(c.mastery * 100);
                return (
                  <div key={c.specificId} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-foreground truncate">
                        {c.specificCode} · {c.specificTitle}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {c.generalCode} {c.generalTitle} · {c.evaluatedStudents} elevi evaluați
                      </p>
                    </div>
                    <Badge
                      variant={pct >= 85 ? "default" : pct >= 60 ? "secondary" : "destructive"}
                      className="text-xs flex-shrink-0"
                    >
                      {masteryLevelLabel(c.mastery)} · {pct}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score distribution */}
      {scoreDistribution.some((b) => b.count > 0) && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Distribuția scorurilor la lecții
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
                    <Cell key={idx} fill={BUCKET_FILL[entry.tone]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Weakest lessons */}
      {weakLessons.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Lecții de reluat (medie sub 80%)
            </h3>
            <div className="space-y-2">
              {weakLessons.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-foreground truncate max-w-[55%]">{l.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {l.students} elevi · {l.attempts} încercări
                    </span>
                    <Badge variant="destructive" className="text-xs">{l.avgScore}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test performance */}
      {testStats.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Performanță teste
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={testStats}>
                <XAxis dataKey="shortTitle" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value: number) => [`${value}%`, "Medie"]}
                />
                <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="overflow-x-auto mt-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead className="text-right">Medie</TableHead>
                    <TableHead className="text-right">Mediană</TableHead>
                    <TableHead className="text-right">Min–Max</TableHead>
                    <TableHead className="text-right">Sub 50%</TableHead>
                    <TableHead className="text-right">Predate</TableHead>
                    <TableHead className="text-right">Lipsă</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testStats.map((t) => (
                    <TableRow key={t.title}>
                      <TableCell className="text-xs">{t.title}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{t.avg}%</TableCell>
                      <TableCell className="text-right font-mono text-sm">{t.median}%</TableCell>
                      <TableCell className="text-right font-mono text-sm">{t.min}–{t.max}%</TableCell>
                      <TableCell className="text-right font-mono text-sm">{t.below50}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{t.count}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{t.missing}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Item difficulty */}
      {itemDifficulty.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Itemi cu cel mai mic punctaj
            </h3>
            <div className="space-y-2">
              {itemDifficulty.map((e) => (
                <div key={e.key} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-foreground truncate">{e.question}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {e.zeroCount} × 0p · {e.partialCount} × parțial · {e.fullCount} × complet
                      {" "}({e.total} răspunsuri)
                    </p>
                  </div>
                  <Badge
                    variant={e.avgPercent >= 60 ? "secondary" : "destructive"}
                    className="text-xs flex-shrink-0"
                  >
                    {e.avgPercent}% din punctaj
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
