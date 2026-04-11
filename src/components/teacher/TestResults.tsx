import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTestAssignments, useTestSubmissions, useTestAnswers, useTestItems, useUpdateAnswerScore } from "@/hooks/useTests";
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle, XCircle, Save } from "lucide-react";
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

  // Local score overrides
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
      // If only feedback changed, we still need a score value — use existing
      const scoreToSend = newScore !== undefined ? newScore : undefined;
      // We need to get current score if not editing it
      const currentAnswer = answers.find((a: any) => a.id === answerId);
      const finalScore = scoreToSend !== undefined ? scoreToSend : currentAnswer?.score ?? 0;

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

  // Build a map from test_item_id to test_item for question info
  const itemMap = new Map<string, any>();
  testItems.forEach((ti: any) => itemMap.set(ti.id, ti));

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
          {assignments.map((a: any) => (
            <Button
              key={a.id}
              variant={selectedAssignmentId === a.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedAssignmentId(a.id)}
              className="mr-2"
            >
              {a.teacher_classes?.name || "Clasă"}
            </Button>
          ))}
        </div>
      )}

      {selectedAssignmentId && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Submiteri ({submissions.length})
          </p>
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nicio submitere încă.</p>
          ) : (
            submissions.map((sub: any) => {
              const isExpanded = expandedSubmissionId === sub.id;
              const percentage = sub.max_score > 0 ? Math.round((sub.total_score / sub.max_score) * 100) : 0;
              return (
                <Card key={sub.id}>
                  <CardContent className="p-0">
                    <button
                      onClick={() => {
                        setExpandedSubmissionId(isExpanded ? null : sub.id);
                        setScoreEdits({});
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
                          return (
                            <AnswerDetail
                              key={ans.id}
                              answer={ans}
                              index={idx}
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

// Detailed answer view per item
const AnswerDetail = ({
  answer,
  index,
  testItem,
  scoreEdit,
  onScoreEdit,
  onSave,
  saving,
}: {
  answer: any;
  index: number;
  testItem: any;
  scoreEdit: string | undefined;
  onScoreEdit: (val: string) => void;
  onSave: () => void;
  saving: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const isCorrect = answer.score >= answer.max_points;

  // Extract question info from test_item
  const customData = testItem?.custom_data;
  const sourceType = testItem?.source_type;
  const questionText = customData?.question || `Item ${index + 1}`;
  const itemType = customData?.type || sourceType;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2.5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isCorrect ? (
            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive shrink-0" />
          )}
          <span className="text-xs font-medium text-foreground">Item {index + 1}</span>
          {itemType && (
            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {itemType === "quiz" ? "Quiz" : itemType === "truefalse" ? "A/F" : itemType === "fill" ? "Completare" : itemType === "order" ? "Ordonare" : itemType === "match" ? "Potrivire" : itemType === "problem" ? "Problemă" : itemType}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{answer.score}/{answer.max_points} pct</span>
          {answer.ai_reviewed && (
            <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">AI</span>
          )}
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border p-3 space-y-3 bg-muted/20">
          {/* Question */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cerință</p>
            <p className="text-xs text-foreground">{questionText}</p>
          </div>

          {/* Show options for quiz items */}
          {itemType === "quiz" && customData?.options && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Variante</p>
              <div className="space-y-1">
                {(customData.options as any[]).map((opt: any) => {
                  const isSelected = answer.answer_data?.selected === opt.id;
                  const isCorrectOption = opt.id === customData.correct_option_id;
                  return (
                    <div
                      key={opt.id}
                      className={`text-xs px-2 py-1.5 rounded border ${
                        isSelected && isCorrectOption
                          ? "border-primary bg-primary/10 text-foreground"
                          : isSelected
                            ? "border-destructive bg-destructive/10 text-foreground"
                            : isCorrectOption
                              ? "border-primary/40 bg-primary/5 text-muted-foreground"
                              : "border-transparent text-muted-foreground"
                      }`}
                    >
                      {isSelected && "➤ "}{opt.text}
                      {isCorrectOption && " ✓"}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* True/False */}
          {itemType === "truefalse" && (
            <div>
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
                const line = customData?.lines?.find((l: any) => l.id === lineId);
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
                const pair = customData?.pairs?.find((p: any) => p.id === pairId);
                return (
                  <p key={pairId} className="text-xs bg-muted px-2 py-1 rounded mt-1">
                    {pair?.left || pairId} → <span className="font-medium">{val as string || "(gol)"}</span>
                  </p>
                );
              })}
            </div>
          )}

          {/* Problem (code) */}
          {(itemType === "problem" || sourceType === "problem") && answer.answer_data?.code && (
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

          {/* Feedback */}
          {answer.feedback && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Feedback</p>
              <p className="text-xs text-muted-foreground italic">{answer.feedback}</p>
            </div>
          )}

          {/* Manual score adjustment */}
          <div className="flex items-center gap-2 pt-1 border-t border-border">
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
              disabled={saving || scoreEdit === undefined}
            >
              <Save className="h-3 w-3" /> Salvează
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResults;
