import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTestAssignments, useTestSubmissions, useTestAnswers } from "@/hooks/useTests";
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";

interface TestResultsProps {
  testId: string;
  onBack: () => void;
}

const TestResults = ({ testId, onBack }: TestResultsProps) => {
  const { data: assignments = [] } = useTestAssignments(testId);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  const { data: submissions = [] } = useTestSubmissions(selectedAssignmentId);
  const { data: answers = [] } = useTestAnswers(expandedSubmissionId);

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
                      onClick={() => setExpandedSubmissionId(isExpanded ? null : sub.id)}
                      className="w-full p-3 flex items-center justify-between text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {sub.profile?.display_name || "Elev"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Var. {sub.variant} · {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString("ro-RO") : "În curs"}
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
                      <div className="border-t border-border px-3 pb-3 pt-2 space-y-1.5">
                        {answers.map((ans: any, idx: number) => (
                          <div key={ans.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs">
                            <div className="flex items-center gap-2">
                              {ans.score >= ans.max_points ? (
                                <CheckCircle className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-destructive" />
                              )}
                              <span className="text-foreground">Item {idx + 1}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{ans.score}/{ans.max_points} pct</span>
                              {ans.feedback && (
                                <span className="text-muted-foreground italic max-w-[150px] truncate">{ans.feedback}</span>
                              )}
                              {ans.ai_reviewed && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">AI</span>
                              )}
                            </div>
                          </div>
                        ))}
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

export default TestResults;
