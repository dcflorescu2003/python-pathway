import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useChallenges } from "@/hooks/useChallenges";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  BookOpen, DoorOpen, Trophy, Clock, CheckCircle, FileText,
  Play, History, Pencil, Check, X, ChevronDown, ChevronRight,
  AlertCircle, RotateCcw
} from "lucide-react";
import { toast } from "sonner";

interface StudentTabProps {
  memberClassName: string | null;
  onLeaveClass: () => void;
}

const StudentTab = ({ memberClassName, onLeaveClass }: StudentTabProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leavingClass, setLeavingClass] = useState(false);
  const [editingCatalogName, setEditingCatalogName] = useState(false);
  const [catalogName, setCatalogName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  const { challenges } = useChallenges();

  // Get profile display_name
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["student-profile-name", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Get student's class membership
  const { data: membership } = useQuery({
    queryKey: ["student-membership", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("student_id", user.id)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Get completed lessons for this user (with score)
  const { data: completedLessons = [] } = useQuery({
    queryKey: ["student-completed-lessons", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("completed_lessons")
        .select("lesson_id, score")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Get test assignments for the student's class
  const { data: assignments = [] } = useQuery({
    queryKey: ["student-assignments", membership?.class_id],
    queryFn: async () => {
      if (!membership?.class_id) return [];
      const { data, error } = await supabase
        .from("test_assignments")
        .select("*, tests(title, time_limit_minutes)")
        .eq("class_id", membership.class_id)
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!membership?.class_id,
  });

  // Get student's submissions
  const { data: submissions = [] } = useQuery({
    queryKey: ["student-submissions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("test_submissions")
        .select("*")
        .eq("student_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get test answers for expanded test
  const { data: testAnswers = [] } = useQuery({
    queryKey: ["student-test-answers", expandedTestId],
    queryFn: async () => {
      if (!expandedTestId) return [];
      const submission = submissions.find((s) => s.assignment_id === expandedTestId && s.submitted_at);
      if (!submission) return [];
      const { data, error } = await supabase
        .from("test_answers")
        .select("*, test_items:test_item_id(sort_order, points, source_type, custom_data)")
        .eq("submission_id", submission.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!expandedTestId && submissions.length > 0,
  });

  const completedLessonIds = new Set(completedLessons.map((cl) => cl.lesson_id));
  const completedLessonScores = new Map(completedLessons.map((cl) => [cl.lesson_id, cl.score]));

  // Helper: resolve the completed_lessons key for a challenge
  const getProgressKey = (ch: typeof challenges[0]) =>
    ch.item_type === "problem" ? `problem-${ch.item_id}` : ch.item_id;

  // Split challenges into active vs completed
  const activeChallenges = challenges.filter((ch) => !completedLessonIds.has(getProgressKey(ch)));

  const completedChallenges = challenges.filter((ch) => completedLessonIds.has(getProgressKey(ch)));

  const handleLeave = async () => {
    if (!user) return;
    setLeavingClass(true);
    try {
      const { error } = await supabase
        .from("class_members")
        .delete()
        .eq("student_id", user.id);
      if (error) {
        toast.error("Eroare la părăsirea clasei.");
      } else {
        toast.success("Ai părăsit clasa.");
        onLeaveClass();
      }
    } finally {
      setLeavingClass(false);
    }
  };

  const handleSaveCatalogName = async () => {
    if (!user || catalogName.trim().length < 3) return;
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: catalogName.trim() })
      .eq("user_id", user.id);
    setSavingName(false);
    if (error) {
      toast.error("Nu am putut salva numele.");
    } else {
      toast.success("Numele din catalog a fost actualizat!");
      setEditingCatalogName(false);
      refetchProfile();
    }
  };

  const handleStartChallenge = (ch: typeof challenges[0]) => {
    if (ch.item_type === "lesson") {
      // Find the chapter for this lesson to build correct route
      navigate(`/lesson/${ch.item_id}`);
    } else if (ch.item_type === "problem") {
      navigate(`/problem/${ch.item_id}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Class info + catalog name */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{memberClassName ?? "Clasa ta"}</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1"
              disabled={leavingClass}
              onClick={handleLeave}
            >
              <DoorOpen className="h-4 w-4" />
              {leavingClass ? "..." : "Părăsește"}
            </Button>
          </div>

          {/* Editable catalog name */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Nume catalog:</span>
            {editingCatalogName ? (
              <div className="flex items-center gap-1.5 flex-1">
                <Input
                  value={catalogName}
                  onChange={(e) => setCatalogName(e.target.value)}
                  className="h-7 text-sm flex-1"
                  placeholder="Prenume Nume"
                  autoFocus
                />
                <button
                  disabled={savingName || catalogName.trim().length < 3}
                  onClick={handleSaveCatalogName}
                  className="text-primary hover:text-primary/80 disabled:opacity-40"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => setEditingCatalogName(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">{profile?.display_name || "—"}</span>
                <button
                  onClick={() => {
                    setCatalogName(profile?.display_name || "");
                    setEditingCatalogName(true);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">🔒 Vizibil doar profesorului tău</p>
        </CardContent>
      </Card>

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Provocări active ({activeChallenges.length})
          </h3>
          <div className="space-y-2">
            {activeChallenges.map((ch) => (
              <Card key={ch.id} className="border-border">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ch.item_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ch.item_type === "lesson" ? "Lecție" : ch.item_type === "problem" ? "Problemă" : ch.item_type}
                    </p>
                  </div>
                  <Button size="sm" className="gap-1" onClick={() => handleStartChallenge(ch)}>
                    <Play className="h-3.5 w-3.5" /> Începe
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* History section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <History className="h-4 w-4 text-primary" /> Istoric
        </h3>

        {/* Completed challenges */}
        {completedChallenges.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Provocări completate ({completedChallenges.length})
            </p>
            <div className="space-y-1.5">
              {completedChallenges.map((ch) => {
                const rawScore = completedLessonScores.get(getProgressKey(ch));
                // For problems score is already 100; for lessons it's raw correct count
                const score = ch.item_type === "problem" ? rawScore : rawScore;
                return (
                  <Card key={ch.id} className="border-border">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{ch.item_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {ch.item_type === "lesson" ? "Lecție" : "Problemă"} — completată
                          {score !== undefined && score !== null && ` • Scor: ${ch.item_type === "problem" ? score : score}%`}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1 shrink-0" onClick={() => handleStartChallenge(ch)}>
                        <RotateCcw className="h-3.5 w-3.5" /> Reia
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Tests history */}
        {assignments.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Teste ({assignments.length})
            </p>
            <div className="space-y-2">
              {assignments.map((a: any) => {
                const submission = submissions.find((s) => s.assignment_id === a.id);
                const isCompleted = !!submission?.submitted_at;
                const isExpired = a.due_date && new Date(a.due_date) < new Date() && !isCompleted;
                const isExpanded = expandedTestId === a.id;

                return (
                  <Card key={a.id} className="border-border">
                    <CardContent className="p-0">
                      <button
                        className="w-full p-3 flex items-center justify-between text-left"
                        onClick={() => {
                          if (isCompleted) {
                            setExpandedTestId(isExpanded ? null : a.id);
                          } else if (!isExpired) {
                            navigate(`/test/${a.id}`);
                          }
                        }}
                        disabled={isExpired && !isCompleted}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isCompleted ? "bg-green-500/10" : isExpired ? "bg-destructive/10" : "bg-primary/10"
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : isExpired ? (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            ) : (
                              <FileText className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{a.tests?.title || "Test"}</p>
                            <p className="text-xs text-muted-foreground">
                              {isCompleted
                                ? `Scor: ${submission?.total_score ?? 0}/${submission?.max_score ?? 0}`
                                : isExpired
                                  ? "Expirat"
                                  : "Activ — începe testul"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {a.tests?.time_limit_minutes && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {a.tests.time_limit_minutes}min
                            </span>
                          )}
                          {isCompleted && (
                            isExpanded
                              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {/* Expanded test details — only when scores_released */}
                      {isCompleted && isExpanded && a.scores_released && (
                        <div className="border-t border-border px-3 pb-3 pt-2 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Scor total</span>
                            <span className="font-semibold text-foreground">
                              {submission?.total_score ?? 0} / {submission?.max_score ?? 0}
                            </span>
                          </div>

                          {testAnswers.length > 0 && (
                            <div className="space-y-2.5">
                              {testAnswers
                                .sort((a: any, b: any) => (a.test_items?.sort_order ?? 0) - (b.test_items?.sort_order ?? 0))
                                .map((answer: any, idx: number) => {
                                  const customData = answer.test_items?.custom_data;
                                  const sourceType = answer.test_items?.source_type;
                                  const isAutoGraded = sourceType === 'custom' && customData;
                                  const question = customData?.question || `Exercițiul ${idx + 1}`;
                                  const answerData = answer.answer_data;
                                  const itemType = customData?.type;
                                  const isQuiz = itemType === 'quiz';

                                  // For quiz: find selected and correct options
                                  const selectedOptionId = answerData?.selected_option_id;
                                  const correctOptionId = customData?.correct_option_id;
                                  const options = customData?.options as any[] | undefined;
                                  const isCorrectQuiz = isQuiz && selectedOptionId === correctOptionId;

                                  return (
                                    <div key={answer.id} className="rounded-md bg-muted/50 p-3 space-y-2">
                                      {/* Question/requirement */}
                                      <div className="flex items-start justify-between gap-2">
                                        <pre className="text-xs text-foreground font-medium whitespace-pre-wrap flex-1">
                                          {idx + 1}. {question}
                                        </pre>
                                        <span className={`text-xs font-semibold whitespace-nowrap ${
                                          Number(answer.score) >= Number(answer.max_points)
                                            ? "text-green-600"
                                            : Number(answer.score) > 0
                                              ? "text-yellow-600"
                                              : "text-destructive"
                                        }`}>
                                          {answer.score ?? 0}/{answer.max_points ?? 0}p
                                        </span>
                                      </div>

                                      {/* Quiz: show options with colors */}
                                      {isQuiz && options && (
                                        <div className="space-y-1 pl-2 border-l-2 border-border">
                                          {options.map((opt: any) => {
                                            const isSelected = opt.id === selectedOptionId;
                                            const isCorrect = opt.id === correctOptionId;
                                            let optClass = "text-muted-foreground";
                                            if (isCorrect) optClass = "text-green-600 font-medium";
                                            else if (isSelected && !isCorrect) optClass = "text-destructive font-medium";

                                            return (
                                              <div key={opt.id} className={`text-xs flex items-center gap-1.5 ${optClass}`}>
                                                <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                                                  isCorrect ? "border-green-600 bg-green-500/10" :
                                                  isSelected ? "border-destructive bg-destructive/10" :
                                                  "border-border"
                                                }`}>
                                                  {opt.id?.toUpperCase?.() || ""}
                                                </span>
                                                {opt.text}
                                                {isCorrect && " ✅"}
                                                {isSelected && !isCorrect && " ❌"}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Non-quiz: show answer as text */}
                                      {!isQuiz && answerData && (
                                        <div className="text-xs pl-2 border-l-2 border-border">
                                          <span className="text-muted-foreground">Răspunsul tău: </span>
                                          <span className="text-foreground">
                                            {typeof answerData === 'string'
                                              ? answerData
                                              : answerData.selected_option_text || answerData.answer || answerData.code || JSON.stringify(answerData)}
                                          </span>
                                        </div>
                                      )}

                                      {/* Correct answer for non-quiz auto-graded items */}
                                      {!isQuiz && isAutoGraded && Number(answer.score) < Number(answer.max_points) && (
                                        <div className="text-xs pl-2 border-l-2 border-green-600/30">
                                          <span className="text-muted-foreground">Răspuns corect: </span>
                                          <span className="text-green-600 font-medium">
                                            {customData.correct_answer
                                              || (customData.blanks ? customData.blanks.map((b: any) => b.answer).join(', ') : null)
                                              || "—"}
                                          </span>
                                        </div>
                                      )}

                                      {answer.feedback && (
                                        <p className="text-xs text-muted-foreground italic pl-2">
                                          💬 {answer.feedback}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          )}

                          {testAnswers.length === 0 && (
                            <p className="text-xs text-muted-foreground">Se încarcă detaliile...</p>
                          )}
                        </div>
                      )}

                      {/* Scores not yet released */}
                      {isCompleted && isExpanded && !a.scores_released && (
                        <div className="border-t border-border px-3 pb-3 pt-2">
                          <p className="text-xs text-muted-foreground italic">
                            Rezultatele nu au fost publicate încă de către profesor.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {completedChallenges.length === 0 && assignments.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Niciun istoric încă.</p>
          </div>
        )}
      </div>

      {activeChallenges.length === 0 && completedChallenges.length === 0 && assignments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Nicio provocare sau test primit încă.</p>
        </div>
      )}
    </div>
  );
};

export default StudentTab;
