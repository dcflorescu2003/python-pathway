import { groupChallenges, type ChallengeGroup } from "@/lib/challengeGroups";
import { isChallengeExpired, isLastDay, formatDueDate } from "@/lib/challengeDeadline";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useChallenges } from "@/hooks/useChallenges";
import { useChapters } from "@/hooks/useChapters";
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SubmissionReviewRow } from "./SubmissionReviewRow";

interface StudentTabProps {
  memberClassName: string | null;
  onLeaveClass: () => void;
}

const StudentTab = ({ memberClassName, onLeaveClass }: StudentTabProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leavingClass, setLeavingClass] = useState(false);
  const [editingCatalogName, setEditingCatalogName] = useState(false);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  const { challenges } = useChallenges();
  const { data: chapters = [] } = useChapters();

  // Get profile display_name
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["student-profile-name", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, last_name, first_name")
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

  // Get review items (question + student answer + correct answer) for expanded test
  const { data: reviewItems = [] } = useQuery({
    queryKey: ["student-submission-review", expandedTestId],
    queryFn: async () => {
      if (!expandedTestId) return [] as any[];
      const submission = submissions.find((s) => s.assignment_id === expandedTestId && s.submitted_at);
      if (!submission) return [] as any[];
      const { data, error } = await supabase.rpc("get_submission_review", { p_submission_id: submission.id });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!expandedTestId && submissions.length > 0,
  });

  const completedLessonIds = new Set(completedLessons.map((cl) => cl.lesson_id));
  const completedLessonScores = new Map(completedLessons.map((cl) => [cl.lesson_id, cl.score]));

  // Helper: resolve the completed_lessons key for a challenge
  const getProgressKey = (ch: typeof challenges[0]) =>
    ch.item_type === "problem" ? `problem-${ch.item_id}` : ch.item_id;

  // Helper: get display percentage for a challenge
  // Scores are stored directly as percentages (0-100) for both lessons and problems.
  const getDisplayScore = (ch: typeof challenges[0]): number | null => {
    const score = completedLessonScores.get(getProgressKey(ch));
    if (score === undefined || score === null) return null;
    return Math.min(100, Math.max(0, score));
  };

  const groups = groupChallenges(challenges);
  const isDone = (ch: typeof challenges[0]) => completedLessonIds.has(getProgressKey(ch));
  const activeChallenges = groups.filter((g) => !isChallengeExpired(g.due_date) && !g.items.every(isDone));
  const completedChallenges = groups.filter((g) => !isChallengeExpired(g.due_date) && g.items.every(isDone));
  const expiredChallenges = groups.filter((g) => isChallengeExpired(g.due_date));
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [challengeHistoryOpen, setChallengeHistoryOpen] = useState(false);

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
    const ln = lastName.trim();
    const fn = firstName.trim();
    if (!user || ln.length < 2 || fn.length < 2) return;
    setSavingName(true);
    const display = `${ln} ${fn}`;
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: display, last_name: ln, first_name: fn })
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

  const renderGroup = (g: ChallengeGroup<typeof challenges[0]>) => {
    const done = g.items.filter(isDone).length;
    const total = g.items.length;
    const open = openGroup === g.key;
    const expired = isChallengeExpired(g.due_date);
    return (
      <Card key={g.key} className="border-border">
        <CardContent className="p-0">
          <button className="w-full p-3 flex items-center gap-3 text-left" onClick={() => setOpenGroup(open ? null : g.key)}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${done === total ? "bg-green-500/10" : "bg-primary/10"}`}>
              {done === total ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Trophy className="h-4 w-4 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{g.title}</p>
              <p className="text-xs text-muted-foreground">
                {done}/{total} rezolvate · {g.items[0]?.class_name}
                {g.due_date && (!expired && isLastDay(g.due_date)
                  ? <span className="ml-1 font-semibold text-warning">· Ultima zi!</span>
                  : <span> · Termen: {formatDueDate(g.due_date)}</span>)}
              </p>
              <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${(done / total) * 100}%` }} />
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="border-t border-border p-2 space-y-1.5">
              {g.items.map((ch) => {
                const finished = isDone(ch);
                const score = getDisplayScore(ch);
                return (
                  <div key={ch.id} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${finished ? "bg-primary/5" : "bg-muted/50"}`}>
                    {finished ? <CheckCircle className="h-4 w-4 text-green-600 shrink-0" /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{ch.item_title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {ch.item_type === "lesson"
                          ? `Lecție${finished && score !== null ? ` · Best: ${score}%` : ""}`
                          : `Problemă · ${finished ? "Rezolvată" : "Nerezolvată"}`}
                      </p>
                    </div>
                    <Button size="sm" variant={finished ? "outline" : "default"} className="gap-1 shrink-0 min-h-[40px]" onClick={() => handleStartChallenge(ch)}>
                      {finished ? <><RotateCcw className="h-3.5 w-3.5" /> Reia</> : <><Play className="h-3.5 w-3.5" /> Începe</>}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1" disabled={leavingClass}>
                  <DoorOpen className="h-4 w-4" />
                  {leavingClass ? "..." : "Părăsește"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Părăsești clasa?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sigur vrei să părăsești clasa {memberClassName ?? ""}? Vei pierde accesul la provocări și teste; poți reveni doar cu codul clasei.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anulează</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLeave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Părăsește clasa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Editable catalog name (Nume + Prenume) */}
          <div className="space-y-2 text-sm">
            <span className="text-muted-foreground">Nume catalog:</span>
            {editingCatalogName ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Nume (ex: Popescu)"
                    autoFocus
                  />
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Prenume (ex: Andrei)"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={savingName || lastName.trim().length < 2 || firstName.trim().length < 2}
                    onClick={handleSaveCatalogName}
                    className="text-primary hover:text-primary/80 disabled:opacity-40 flex items-center gap-1 text-xs font-medium"
                  >
                    <Check className="h-4 w-4" /> Salvează
                  </button>
                  <button onClick={() => setEditingCatalogName(false)} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs">
                    <X className="h-4 w-4" /> Anulează
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">{profile?.display_name || "—"}</span>
                <button
                  onClick={() => {
                    const existingLn = (profile as any)?.last_name || "";
                    const existingFn = (profile as any)?.first_name || "";
                    if (existingLn || existingFn) {
                      setLastName(existingLn);
                      setFirstName(existingFn);
                    } else if (profile?.display_name) {
                      // Fallback: split first space (assume "Nume Prenume")
                      const parts = profile.display_name.trim().split(/\s+/);
                      setLastName(parts[0] || "");
                      setFirstName(parts.slice(1).join(" ") || "");
                    } else {
                      setLastName("");
                      setFirstName("");
                    }
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
          {editingCatalogName && (
            <p className="text-[10px] text-muted-foreground">
              Numele apare în catalog ca „Nume Prenume" și asigură sortarea alfabetică corectă.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tests section */}
      {assignments.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Teste ({assignments.length})
          </h3>
          <div className="space-y-2">
            {assignments.map((a: any) => {
              const submission = submissions.find((s) => s.assignment_id === a.id);
              const isCompleted = !!submission?.submitted_at;
              const windowDeadline = a.window_minutes
                ? new Date(new Date(a.assigned_at).getTime() + a.window_minutes * 60000)
                : null;
              const dueDeadline = a.due_date ? new Date(a.due_date) : null;
              const effectiveDeadline = windowDeadline && dueDeadline
                ? (windowDeadline < dueDeadline ? windowDeadline : dueDeadline)
                : windowDeadline || dueDeadline;
              const isExpired = effectiveDeadline && effectiveDeadline < new Date() && !isCompleted;
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
                              ? (a.scores_released
                                  ? `Scor: ${submission?.total_score ?? 0}/${submission?.max_score ?? 0}`
                                  : "Rezultat în așteptare")
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

                        {reviewItems.length > 0 && (
                          <div className="space-y-2.5">
                            {reviewItems.map((item: any, idx: number) => (
                              <SubmissionReviewRow key={item.answer_id} item={item} index={idx} />
                            ))}
                          </div>
                        )}

                        {reviewItems.length === 0 && (
                          <p className="text-xs text-muted-foreground">Se încarcă detaliile...</p>
                        )}
                      </div>
                    )}

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

      {([
        { list: activeChallenges, label: "Provocări active", icon: <Trophy className="h-4 w-4 text-primary" /> },
        { list: completedChallenges, label: "Provocări completate", icon: <History className="h-4 w-4 text-primary" /> },
      ]).map(({ list, label, icon }) => list.length > 0 && (
        <div key={label}>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">{icon} {label} ({list.length})</h3>
          <div className="space-y-2">{list.map(renderGroup)}</div>
        </div>
      ))}

      {expiredChallenges.length > 0 && (
        <Collapsible open={challengeHistoryOpen} onOpenChange={setChallengeHistoryOpen}>
          <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            <span className="flex items-center gap-2"><History className="h-4 w-4" /> Istoric provocări ({expiredChallenges.length})</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${challengeHistoryOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">{expiredChallenges.map(renderGroup)}</CollapsibleContent>
        </Collapsible>
      )}

      {activeChallenges.length === 0 && completedChallenges.length === 0 && expiredChallenges.length === 0 && assignments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Nicio provocare sau test primit încă.</p>
        </div>
      )}
    </div>
  );
};

export default StudentTab;
