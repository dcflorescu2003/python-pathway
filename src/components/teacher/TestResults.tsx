import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useTestAssignments, useTestSubmissions, useTestAnswers, useTestItems, useUpdateAnswerScore, useToggleScoresReleased } from "@/hooks/useTests";
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle, XCircle, Save, FileSpreadsheet, FileText, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface TestResultsProps {
  testId: string;
  onBack: () => void;
}

const TestResults = ({ testId, onBack }: TestResultsProps) => {
  const { data: assignments = [] } = useTestAssignments(testId);
  const { data: testItems = [] } = useTestItems(testId);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  const { data: submissions = [] } = useTestSubmissions(selectedAssignmentId);
  const { data: answers = [] } = useTestAnswers(expandedSubmissionId);
  const updateScore = useUpdateAnswerScore();
  const toggleScores = useToggleScoresReleased();

  // Enriched data: exercise/problem details keyed by source_id
  const [enrichedData, setEnrichedData] = useState<Record<string, any>>({});
  // All answers for all submissions in the selected assignment (for badge computation)
  const [allAssignmentAnswers, setAllAssignmentAnswers] = useState<any[]>([]);

  // Fetch exercise/problem details when testItems load
  useEffect(() => {
    if (testItems.length === 0) return;
    const fetchDetails = async () => {
      const exerciseIds = testItems.filter((ti: any) => ti.source_type === "exercise" && ti.source_id).map((ti: any) => ti.source_id);
      const problemIds = testItems.filter((ti: any) => ti.source_type === "problem" && ti.source_id).map((ti: any) => ti.source_id);

      const result: Record<string, any> = {};

      if (exerciseIds.length > 0) {
        const { data } = await supabase.from("exercises").select("*").in("id", exerciseIds);
        data?.forEach((ex) => { result[ex.id] = { ...ex, _sourceType: "exercise" }; });
      }
      if (problemIds.length > 0) {
        const { data } = await supabase.from("problems").select("id, title, description, test_cases, hint, difficulty").in("id", problemIds);
        data?.forEach((p) => { result[p.id] = { ...p, _sourceType: "problem" }; });
      }
      setEnrichedData(result);
    };
    fetchDetails();
  }, [testItems]);

  // Fetch all answers for all submissions to compute ungraded badges
  useEffect(() => {
    if (submissions.length === 0) { setAllAssignmentAnswers([]); return; }
    const fetchAll = async () => {
      const subIds = submissions.map((s: any) => s.id);
      const { data } = await supabase.from("test_answers").select("*").in("submission_id", subIds);
      setAllAssignmentAnswers(data || []);
    };
    fetchAll();
  }, [submissions]);

  // Identify which test_item IDs need manual grading (problem/open_answer)
  const manualGradingItemIds = useMemo(() => {
    return new Set(
      testItems
        .filter((ti: any) =>
          ti.source_type === "problem" ||
          (ti.source_type === "custom" && ti.custom_data?.type === "open_answer")
        )
        .map((ti: any) => ti.id)
    );
  }, [testItems]);

  // Count ungraded manual items per submission
  const ungradedCountBySubmission = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sub of submissions) {
      const subAnswers = allAssignmentAnswers.filter((a: any) => a.submission_id === sub.id);
      const ungraded = subAnswers.filter(
        (a: any) => manualGradingItemIds.has(a.test_item_id) && (a.score === null || a.score === 0) && !a.ai_reviewed
      ).length;
      counts[sub.id] = ungraded;
    }
    return counts;
  }, [submissions, allAssignmentAnswers, manualGradingItemIds]);

  const totalUngradedCount = useMemo(() => {
    return Object.values(ungradedCountBySubmission).reduce((sum, c) => sum + c, 0);
  }, [ungradedCountBySubmission]);

  const [scoreEdits, setScoreEdits] = useState<Record<string, string>>({});
  const [feedbackEdits, setFeedbackEdits] = useState<Record<string, string>>({});

  const handleSave = async (answerId: string, maxPoints: number) => {
    const rawScore = scoreEdits[answerId];
    const rawFeedback = feedbackEdits[answerId];
    const hasScoreEdit = rawScore !== undefined;
    const hasFeedbackEdit = rawFeedback !== undefined;
    if (!hasScoreEdit && !hasFeedbackEdit) return;

    let newScore: number | undefined;
    if (hasScoreEdit) {
      newScore = parseFloat(rawScore);
      if (isNaN(newScore) || newScore < 0 || newScore > maxPoints) {
        toast.error(`Scorul trebuie să fie între 0 și ${maxPoints}`);
        return;
      }
    }

    try {
      const currentAnswer = answers.find((a: any) => a.id === answerId);
      const finalScore = newScore !== undefined ? newScore : currentAnswer?.score ?? 0;

      await updateScore.mutateAsync({
        answerId,
        score: finalScore,
        submissionId: expandedSubmissionId!,
        feedback: hasFeedbackEdit ? rawFeedback.trim() : undefined,
      });
      toast.success("Salvat cu succes");
      setScoreEdits((prev) => { const c = { ...prev }; delete c[answerId]; return c; });
      setFeedbackEdits((prev) => { const c = { ...prev }; delete c[answerId]; return c; });
    } catch {
      toast.error("Eroare la salvare");
    }
  };

  // Build a map from test_item_id to test_item
  const itemMap = new Map<string, any>();
  testItems.forEach((ti: any) => itemMap.set(ti.id, ti));

  // Get the real question text for an item
  const getQuestionInfo = (testItem: any) => {
    if (!testItem) return { question: "", type: "" };

    if (testItem.source_type === "custom" && testItem.custom_data) {
      return {
        question: testItem.custom_data.question || "",
        type: testItem.custom_data.type || "custom",
        data: testItem.custom_data,
      };
    }

    if ((testItem.source_type === "exercise" || testItem.source_type === "problem") && testItem.source_id) {
      const detail = enrichedData[testItem.source_id];
      if (detail) {
        if (detail._sourceType === "exercise") {
          return {
            question: detail.question || detail.statement || "",
            type: detail.type || "exercise",
            data: detail,
          };
        }
        if (detail._sourceType === "problem") {
          return {
            question: detail.description || detail.title || "",
            type: "problem",
            data: detail,
          };
        }
      }
    }

    return { question: "", type: testItem.source_type || "" };
  };

  const escapeCSV = (val: any) => {
    const s = String(val ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const exportTestCSV = async () => {
    if (submissions.length === 0) return;
    try {
      // Fetch all answers for all submissions
      const subIds = submissions.map((s: any) => s.id);
      const { data: allAnswers } = await supabase
        .from("test_answers")
        .select("*")
        .in("submission_id", subIds);

      const rows: string[] = [];
      rows.push(["Elev", "Variantă", "Scor", "Maxim", "Procent", "Trimis la"].map(escapeCSV).join(","));

      submissions.forEach((sub: any) => {
        const pct = sub.max_score > 0 ? Math.round((sub.total_score / sub.max_score) * 100) : 0;
        rows.push([
          sub.profile?.display_name || "Elev",
          sub.variant,
          sub.total_score ?? 0,
          sub.max_score ?? 0,
          `${pct}%`,
          sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString("ro-RO") : "În curs",
        ].map(escapeCSV).join(","));
      });

      // Detail section
      rows.push("");
      rows.push("--- Detalii per elev ---");
      for (const sub of submissions) {
        const subAnswers = (allAnswers || []).filter((a: any) => a.submission_id === sub.id);
        rows.push("");
        rows.push(`Elev: ${sub.profile?.display_name || "Elev"} (${sub.variant})`);
        rows.push(["Item", "Tip", "Punctaj", "Maxim", "Feedback"].map(escapeCSV).join(","));
        subAnswers.forEach((ans: any, idx: number) => {
          const ti = itemMap.get(ans.test_item_id);
          const qInfo = getQuestionInfo(ti);
          rows.push([
            `Item ${idx + 1}`,
            qInfo.type,
            ans.score ?? 0,
            ans.max_points ?? 0,
            ans.feedback || "",
          ].map(escapeCSV).join(","));
        });
      }

      const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rezultate_test.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exportat!");
    } catch {
      toast.error("Eroare la export CSV");
    }
  };

  const exportTestPDF = async () => {
    if (submissions.length === 0) return;
    try {
      const subIds = submissions.map((s: any) => s.id);
      const { data: allAnswers } = await supabase
        .from("test_answers")
        .select("*")
        .in("submission_id", subIds);

      const className = assignments.find((a: any) => a.id === selectedAssignmentId)?.teacher_classes?.name || "Clasă";

      let html = `<html><head><meta charset="utf-8"><title>Rezultate Test</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 24px; color: #1a1a2e; font-size: 13px; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 15px; color: #555; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; font-size: 12px; }
          th { background: #f0f0f5; font-weight: 600; }
          .good { color: #16a34a; } .bad { color: #dc2626; }
          @media print { body { padding: 0; } }
        </style></head><body>`;
      html += `<h1>Rezultate Test — ${className}</h1>`;
      html += `<p style="color:#888;font-size:11px;">Exportat: ${new Date().toLocaleDateString("ro-RO")}</p>`;

      // Summary table
      html += `<table><tr><th>Elev</th><th>Variantă</th><th>Scor</th><th>Maxim</th><th>Procent</th><th>Trimis</th></tr>`;
      submissions.forEach((sub: any) => {
        const pct = sub.max_score > 0 ? Math.round((sub.total_score / sub.max_score) * 100) : 0;
        html += `<tr>
          <td>${sub.profile?.display_name || "Elev"}</td>
          <td>${sub.variant}</td>
          <td>${sub.total_score ?? 0}</td>
          <td>${sub.max_score ?? 0}</td>
          <td class="${pct >= 50 ? "good" : "bad"}">${pct}%</td>
          <td>${sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString("ro-RO") : "În curs"}</td>
        </tr>`;
      });
      html += `</table>`;

      // Per-student details
      for (const sub of submissions) {
        const subAnswers = (allAnswers || []).filter((a: any) => a.submission_id === sub.id);
        html += `<h2>${sub.profile?.display_name || "Elev"} (Nr. ${sub.variant})</h2>`;
        html += `<table><tr><th>Item</th><th>Tip</th><th>Punctaj</th><th>Feedback</th></tr>`;
        subAnswers.forEach((ans: any, idx: number) => {
          const ti = itemMap.get(ans.test_item_id);
          const qInfo = getQuestionInfo(ti);
          html += `<tr>
            <td>Item ${idx + 1}</td>
            <td>${typeLabel(qInfo.type)}</td>
            <td>${ans.score ?? 0}/${ans.max_points ?? 0}</td>
            <td>${ans.feedback || "—"}</td>
          </tr>`;
        });
        html += `</table>`;
      }

      html += `</body></html>`;
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(html);
        w.document.close();
        setTimeout(() => w.print(), 400);
      }
      toast.success("PDF generat!");
    } catch {
      toast.error("Eroare la export PDF");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="active:scale-90 transition-transform">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="text-lg font-bold text-foreground">Rezultate test</h2>
      </div>

      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Testul nu a fost distribuit încă.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Selectează clasa:</p>
           {assignments.map((a: any) => {
              const isSelected = selectedAssignmentId === a.id;
              return (
                <div key={a.id} className="flex items-center gap-2">
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedAssignmentId(a.id)}
                  >
                    {a.teacher_classes?.name || "Clasă"}
                  </Button>
                  {isSelected && (
                    <Button
                      variant={a.scores_released ? "default" : "outline"}
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => {
                        toggleScores.mutate({ assignmentId: a.id, released: !a.scores_released });
                      }}
                      disabled={toggleScores.isPending}
                    >
                      {a.scores_released ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      {a.scores_released ? "Note publicate" : "Publică notele"}
                    </Button>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {selectedAssignmentId && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Submiteri ({submissions.length})
              </p>
              {totalUngradedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-warning/10 border border-warning/30 text-warning font-medium">
                  <AlertCircle className="h-3 w-3" />
                  {totalUngradedCount} {totalUngradedCount === 1 ? "item neevaluat" : "itemi neevaluați"}
                </span>
              )}
            </div>
            {submissions.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={exportTestCSV}>
                  <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={exportTestPDF}>
                  <FileText className="h-3.5 w-3.5" /> PDF
                </Button>
              </div>
            )}
          </div>
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nicio submitere încă.</p>
          ) : (
            submissions.map((sub: any) => {
              const isExpanded = expandedSubmissionId === sub.id;
              const percentage = sub.max_score > 0 ? Math.round((sub.total_score / sub.max_score) * 100) : 0;
              const ungradedCount = ungradedCountBySubmission[sub.id] || 0;
              return (
                <Card key={sub.id}>
                  <CardContent className="p-0">
                    <button
                      onClick={() => {
                        setExpandedSubmissionId(isExpanded ? null : sub.id);
                        setScoreEdits({});
                        setFeedbackEdits({});
                      }}
                      className="w-full p-3 flex items-center justify-between text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {sub.profile?.display_name || "Elev"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Nr. {sub.variant === "A" ? "1" : "2"} · {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString("ro-RO") : "În curs"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {ungradedCount > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-warning/10 border border-warning/30 text-warning font-medium">
                            {ungradedCount} ✏️
                          </span>
                        )}
                        {sub.submitted_at && (
                          <span className={`text-sm font-bold ${percentage >= 50 ? "text-primary" : "text-destructive"}`}>
                            {percentage}%
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {isExpanded && answers.length > 0 && (
                      <div className="border-t border-border px-3 pb-3 pt-2 space-y-3">
                        {answers.map((ans: any, idx: number) => {
                          const testItem = itemMap.get(ans.test_item_id);
                          const qInfo = getQuestionInfo(testItem);
                          return (
                            <AnswerDetail
                              key={ans.id}
                              answer={ans}
                              index={idx}
                              questionInfo={qInfo}
                              testItem={testItem}
                              scoreEdit={scoreEdits[ans.id]}
                              onScoreEdit={(val) => setScoreEdits((p) => ({ ...p, [ans.id]: val }))}
                              feedbackEdit={feedbackEdits[ans.id]}
                              onFeedbackEdit={(val) => setFeedbackEdits((p) => ({ ...p, [ans.id]: val }))}
                              onSave={() => handleSave(ans.id, ans.max_points)}
                              saving={updateScore.isPending}
                            />
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const typeLabel = (t: string) => {
  const map: Record<string, string> = {
    quiz: "Quiz", truefalse: "A/F", fill: "Completare",
    order: "Ordonare", match: "Potrivire", problem: "Problemă",
    exercise: "Exercițiu", custom: "Custom", open_answer: "Răspuns deschis",
  };
  return map[t] || t;
};

// Always-expanded answer detail per item
const AnswerDetail = ({
  answer,
  index,
  questionInfo,
  testItem,
  scoreEdit,
  onScoreEdit,
  feedbackEdit,
  onFeedbackEdit,
  onSave,
  saving,
}: {
  answer: any;
  index: number;
  questionInfo: { question: string; type: string; data?: any };
  testItem: any;
  scoreEdit: string | undefined;
  onScoreEdit: (val: string) => void;
  feedbackEdit: string | undefined;
  onFeedbackEdit: (val: string) => void;
  onSave: () => void;
  saving: boolean;
}) => {
  const isCorrect = answer.score >= answer.max_points;
  const itemType = questionInfo.type;
  const exerciseData = questionInfo.data;
  // For custom items, use custom_data; for exercise/problem, use enriched data
  const customData = testItem?.custom_data;

  // Determine options source: enriched exercise data or custom_data
  const options = exerciseData?.options || customData?.options;
  const correctOptionId = exerciseData?.correct_option_id || customData?.correct_option_id;
  const statement = exerciseData?.statement || customData?.statement;
  const blanks = exerciseData?.blanks || customData?.blanks;
  const lines = exerciseData?.lines || customData?.lines;
  const pairs = exerciseData?.pairs || customData?.pairs;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-2.5 bg-muted/30">
        <div className="flex items-center gap-2">
          {isCorrect ? (
            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive shrink-0" />
          )}
          <span className="text-xs font-medium text-foreground">Item {index + 1}</span>
          {itemType && (
            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {typeLabel(itemType)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{answer.score}/{answer.max_points} pct</span>
          {answer.ai_reviewed && (
            <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">AI</span>
          )}
        </div>
      </div>

      {/* Always visible details */}
      <div className="p-3 space-y-3">
        {/* Question / Cerință */}
        {questionInfo.question && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cerință</p>
            <p className="text-xs text-foreground whitespace-pre-wrap">{questionInfo.question}</p>
          </div>
        )}

        {/* Problem title if applicable */}
        {itemType === "problem" && exerciseData?.title && (
          <p className="text-xs font-bold text-foreground">{exerciseData.title}</p>
        )}

        {/* Quiz options with student selection */}
        {itemType === "quiz" && options && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Variante</p>
            <div className="space-y-1">
              {(options as any[]).map((opt: any) => {
                const isSelected = answer.answer_data?.selected === opt.id;
                const isCorrectOpt = opt.id === correctOptionId;
                return (
                  <div
                    key={opt.id}
                    className={`text-xs px-2 py-1.5 rounded border ${
                      isSelected && isCorrectOpt
                        ? "border-primary bg-primary/10 text-foreground"
                        : isSelected
                          ? "border-destructive bg-destructive/10 text-foreground"
                          : isCorrectOpt
                            ? "border-primary/40 bg-primary/5 text-muted-foreground"
                            : "border-transparent text-muted-foreground"
                    }`}
                  >
                    {isSelected && "➤ "}{opt.text}
                    {isCorrectOpt && " ✓"}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* True/False */}
        {itemType === "truefalse" && (
          <div>
            {statement && (
              <p className="text-xs text-foreground mb-1 italic">„{statement}"</p>
            )}
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Răspuns elev</p>
            <p className="text-xs text-foreground">
              {answer.answer_data?.selected === true ? "Adevărat" : answer.answer_data?.selected === false ? "Fals" : "Necompletat"}
            </p>
          </div>
        )}

        {/* Fill */}
        {itemType === "fill" && answer.answer_data?.blanks && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Răspunsuri completate</p>
            {Object.entries(answer.answer_data.blanks).map(([key, val]) => (
              <p key={key} className="text-xs text-foreground font-mono bg-muted px-2 py-1 rounded mt-1">
                {val as string || "(gol)"}
              </p>
            ))}
          </div>
        )}

        {/* Order */}
        {itemType === "order" && answer.answer_data?.order && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ordinea elevului</p>
            {(answer.answer_data.order as string[]).map((lineId: string, i: number) => {
              const line = lines?.find((l: any) => l.id === lineId);
              return (
                <p key={lineId} className="text-xs font-mono bg-muted px-2 py-1 rounded mt-1">
                  {i + 1}. {line?.text || lineId}
                </p>
              );
            })}
          </div>
        )}

        {/* Match */}
        {itemType === "match" && answer.answer_data?.matches && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Potriviri elev</p>
            {Object.entries(answer.answer_data.matches).map(([pairId, val]) => {
              const pair = pairs?.find((p: any) => p.id === pairId);
              return (
                <p key={pairId} className="text-xs bg-muted px-2 py-1 rounded mt-1">
                  {pair?.left || pairId} → <span className="font-medium">{val as string || "(gol)"}</span>
                </p>
              );
            })}
          </div>
        )}

        {/* Problem (code) */}
        {(itemType === "problem" || testItem?.source_type === "problem") && answer.answer_data?.code && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cod trimis</p>
            <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
              {answer.answer_data.code}
            </pre>
          </div>
        )}

        {/* Generic text answer */}
        {answer.answer_data?.text && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Răspuns text</p>
            <p className="text-xs text-foreground bg-muted p-2 rounded">{answer.answer_data.text}</p>
          </div>
        )}

        {/* Feedback profesor */}
        <div className="pt-2 border-t border-border space-y-2">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Feedback profesor</p>
            <Textarea
              placeholder="Scrie un comentariu pentru elev..."
              value={feedbackEdit !== undefined ? feedbackEdit : (answer.feedback || "")}
              onChange={(e) => onFeedbackEdit(e.target.value)}
              className="text-xs min-h-[50px]"
              maxLength={1000}
            />
          </div>

          {/* Manual score adjustment */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-muted-foreground">Punctaj:</span>
            <Input
              type="number"
              min={0}
              max={answer.max_points}
              step={0.5}
              value={scoreEdit !== undefined ? scoreEdit : answer.score}
              onChange={(e) => onScoreEdit(e.target.value)}
              className="w-20 h-7 text-xs"
            />
            <span className="text-[10px] text-muted-foreground">/ {answer.max_points}</span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs gap-1"
              onClick={onSave}
              disabled={saving || (scoreEdit === undefined && feedbackEdit === undefined)}
            >
              <Save className="h-3 w-3" /> Salvează
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResults;
