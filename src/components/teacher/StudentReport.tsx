import { useMemo } from "react";
import { ArrowLeft, Download, Zap, Flame, BookOpen, FileText, Code, Lightbulb, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import StudentCompetencyView from "./StudentCompetencyView";
import { useStudentReport } from "@/hooks/useStudentReport";
import { buildStudentInsights } from "@/lib/studentInsights";
import { exportStudentPdf } from "@/lib/studentReportHtml";
import type { StudentProfileLike } from "@/lib/studentReportData";

interface Props {
  classId: string;
  className: string;
  profile: StudentProfileLike;
  onBack: () => void;
}

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("ro-RO") : "-");

const scoreTone = (pct: number | null) =>
  pct === null
    ? "bg-muted text-muted-foreground"
    : pct >= 80
      ? "bg-success/15 text-success"
      : pct >= 50
        ? "bg-warning/15 text-warning"
        : "bg-destructive/15 text-destructive";

const StudentReport = ({ classId, className: clsName, profile, onBack }: Props) => {
  const { data, isLoading } = useStudentReport(classId, profile);
  const insights = useMemo(() => (data ? buildStudentInsights(data) : []), [data]);

  const name =
    profile.display_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "Elev";

  const handleExport = () => {
    if (!data) return;
    const ok = exportStudentPdf(data, clsName);
    if (!ok) toast.error("Permite pop-up-urile pentru a descărca PDF-ul.");
    else toast.success("Raport pregătit pentru descărcare 📄");
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="active:scale-90 transition-transform">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-foreground truncate">{name}</h2>
          <p className="text-xs text-muted-foreground truncate">
            {clsName}
            {data?.lastActivity ? ` · ultima activitate ${fmtDate(data.lastActivity)}` : ""}
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-1 shrink-0" onClick={handleExport} disabled={!data}>
          <Download className="h-3.5 w-3.5" /> PDF
        </Button>
      </div>

      {isLoading || !data ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "XP", value: data.xp, icon: <Zap className="h-3 w-3 text-xp" /> },
              { label: "Streak", value: data.streak, icon: <Flame className="h-3 w-3 text-warning" /> },
              { label: "Lecții", value: data.lessons.length, icon: <BookOpen className="h-3 w-3 text-primary" /> },
              { label: "Medie lecții", value: data.avgLessonScore !== null ? `${data.avgLessonScore}%` : "-" },
              { label: "Medie teste", value: data.avgTestScore !== null ? `${data.avgTestScore}%` : "-" },
              { label: "Probleme", value: data.problemsSolved, icon: <Code className="h-3 w-3 text-primary" /> },
            ].map((k) => (
              <Card key={k.label}>
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-foreground flex items-center justify-center gap-1">
                    {k.icon}
                    {k.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{k.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Insights */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-warning" /> Recomandări
              </h3>
              <ul className="space-y-1.5">
                {insights.map((i, idx) => (
                  <li key={idx} className="flex gap-2 text-xs leading-relaxed">
                    {i.tone === "good" ? (
                      <CheckCircle className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle
                        className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${i.tone === "bad" ? "text-destructive" : "text-warning"}`}
                      />
                    )}
                    <span className="text-muted-foreground">{i.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Competency profile */}
          <StudentCompetencyView studentId={data.studentId} studentName={name} />

          {/* Lessons */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Lecții finalizate ({data.lessons.length})
              </h3>
              {data.lessons.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nicio lecție finalizată.</p>
              ) : (
                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  {data.lessons.map((l) => (
                    <div key={l.lessonId} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-border/40 last:border-0">
                      <div className="min-w-0">
                        <p className="text-foreground truncate">{l.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {l.chapterTitle ?? "-"} · {fmtDate(l.completedAt)}
                        </p>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${scoreTone(l.score)}`}>
                        {l.score}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tests */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Teste ({data.tests.length})
              </h3>
              {data.tests.length === 0 ? (
                <p className="text-xs text-muted-foreground">Niciun test predat.</p>
              ) : (
                data.tests.map((t, i) => (
                  <div key={`${t.testTitle}-${i}`} className="rounded-lg bg-muted/40 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-foreground truncate">{t.testTitle}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${scoreTone(t.percent)}`}>
                        {t.percent !== null ? `${t.percent}%` : "-"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {t.totalScore ?? 0}/{t.maxScore ?? 0} puncte · {fmtDate(t.submittedAt)}
                    </p>
                    {t.wrongItems.length === 0 ? (
                      <p className="text-[10px] text-success">Toți itemii cu punctaj maxim.</p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-destructive">
                          Itemi greșiți / parțiali ({t.wrongItems.length}/{t.itemCount})
                        </p>
                        {t.wrongItems.map((it, k) => (
                          <div key={k} className="flex items-start justify-between gap-2 text-[11px]">
                            <span className="text-muted-foreground">{it.question}</span>
                            <Badge variant="outline" className="shrink-0 text-[9px]">
                              {it.score}/{it.maxPoints}p
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Problems */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" /> Probleme rezolvate ({data.problemsSolved})
              </h3>
              {data.problemsByChapter.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nicio problemă rezolvată.</p>
              ) : (
                data.problemsByChapter.map((p) => (
                  <div key={p.chapterTitle} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate">{p.chapterTitle}</span>
                    <span className="text-foreground font-semibold">{p.solved}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Missing lessons */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Lecții neparcurse ({data.missingLessons.length})
              </h3>
              {data.missingLessons.length === 0 ? (
                <p className="text-xs text-success">A parcurs toate lecțiile disponibile.</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {data.missingLessons.slice(0, 24).map((l) => (
                    <Badge key={l.lessonId} variant="secondary" className="text-[10px] font-normal">
                      {l.title}
                    </Badge>
                  ))}
                  {data.missingLessons.length > 24 && (
                    <span className="text-[10px] text-muted-foreground self-center">
                      +{data.missingLessons.length - 24}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default StudentReport;
