import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useClassMembers, useClassChallenges, useDeleteChallenge } from "@/hooks/useTeacher";
import { useChapters } from "@/hooks/useChapters";
import { useProblems } from "@/hooks/useProblems";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import ChallengeAssigner from "./ChallengeAssigner";
import ClassAnalytics from "./ClassAnalytics";
import TestResults from "./TestResults";
import StudentCompetencyView from "./StudentCompetencyView";
import { ArrowLeft, Copy, Trash2, Target, BookOpen, Code, Zap, Flame, CheckCircle, XCircle, ChevronDown, ChevronRight, BarChart3, FileText, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { sortByDisplayName } from "@/lib/sortStudents";

interface ClassDetailProps {
  classId: string;
  className: string;
  joinCode: string;
  onBack: () => void;
}

const ClassDetail = ({ classId, className: clsName, joinCode, onBack }: ClassDetailProps) => {
  const { data: members = [] } = useClassMembers(classId);
  const { data: challenges = [] } = useClassChallenges(classId);
  const deleteChallenge = useDeleteChallenge();
  const { data: chapters = [] } = useChapters();
  const { data: problemsData } = useProblems();
  const { isTeacherPremium } = useSubscription();
  const allProblems = problemsData?.problems ?? [];
  const [showAssigner, setShowAssigner] = useState(false);
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);
  const [viewingResultsTestId, setViewingResultsTestId] = useState<string | null>(null);
  const [viewingResultsTitle, setViewingResultsTitle] = useState<string>("");

  const [studentsOpen, setStudentsOpen] = useState(false);
  const [testsOpen, setTestsOpen] = useState(false);
  const [challengesOpen, setChallengesOpen] = useState(false);

  // Fetch test assignments for this class
  const { data: testAssignments = [] } = useQuery({
    queryKey: ["class-test-assignments", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_assignments")
        .select("*, tests(id, title, time_limit_minutes, created_at)")
        .eq("class_id", classId)
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch completed_lessons for all students in the class
  const studentIds = useMemo(() => members.map((m) => m.student_id), [members]);
  const sortedMembers = useMemo(() => sortByDisplayName(members), [members]);
  const { data: allCompletedLessons = [] } = useQuery({
    queryKey: ["class-completed-lessons", classId, studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const { data } = await supabase
        .from("completed_lessons")
        .select("user_id, lesson_id, score")
        .in("user_id", studentIds);
      return data || [];
    },
    enabled: studentIds.length > 0,
  });

  const copyCode = () => {
    navigator.clipboard.writeText(joinCode);
    toast.success("Cod copiat!");
  };

  const getItemName = (type: string, itemId: string): string => {
    if (type === "lesson") {
      for (const ch of chapters) {
        const lesson = ch.lessons.find((l) => l.id === itemId);
        if (lesson) return lesson.title;
      }
    } else {
      const problem = allProblems.find((p) => p.id === itemId);
      if (problem) return problem.title;
    }
    return itemId;
  };

  const handleDeleteChallenge = async (id: string) => {
    try {
      await deleteChallenge.mutateAsync(id);
      toast.success("Provocare eliminată.");
    } catch {
      toast.error("Eroare.");
    }
  };

  const completionMap = useMemo(() => {
    const map: Record<string, Record<string, { score: number }>> = {};
    for (const cl of allCompletedLessons) {
      if (!map[cl.lesson_id]) map[cl.lesson_id] = {};
      map[cl.lesson_id][cl.user_id] = { score: cl.score };
    }
    return map;
  }, [allCompletedLessons]);

  const getChallengeProgressKey = (itemType: string, itemId: string) =>
    itemType === "problem" ? `problem-${itemId}` : itemId;

  const getDisplayPercent = (_itemType: string, _itemId: string, rawScore: number): number => {
    return Math.min(100, Math.max(0, rawScore));
  };

  const existingChallengeIds = challenges.map((c) => c.item_id);

  const getStudentStatus = (itemType: string, itemId: string, studentId: string) => {
    const key = getChallengeProgressKey(itemType, itemId);
    return completionMap[key]?.[studentId] || null;
  };

  // If viewing test results, render TestResults full-screen
  if (viewingResultsTestId) {
    return (
      <TestResults
        testId={viewingResultsTestId}
        testTitle={viewingResultsTitle}
        onBack={() => { setViewingResultsTestId(null); setViewingResultsTitle(""); }}
        initialClassId={classId}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="active:scale-90 transition-transform">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">{clsName}</h2>
          <button onClick={copyCode} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <Copy className="h-3 w-3" /> Cod: {joinCode}
          </button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1">Clasă</TabsTrigger>
          {isTeacherPremium && (
            <TabsTrigger value="analytics" className="flex-1 gap-1">
              <BarChart3 className="h-3.5 w-3.5" /> Statistici
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-3">
          {/* Elevi collapsible */}
          <Collapsible open={studentsOpen} onOpenChange={setStudentsOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Elevi ({members.length})
              </span>
              {studentsOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground px-1">Niciun elev înscris încă.</p>
              ) : (
                <div className="space-y-2">
                  {sortedMembers.map((m) => (
                    <Card key={m.id}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {m.profile?.display_name || "Elev"}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-xp" /> {m.profile?.xp ?? 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-warning" /> {m.profile?.streak ?? 0}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Teste collapsible */}
          <Collapsible open={testsOpen} onOpenChange={setTestsOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Teste ({testAssignments.length})
              </span>
              {testsOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              {testAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground px-1">Niciun test distribuit.</p>
              ) : (
                <div className="space-y-2">
                  {testAssignments.map((a: any) => (
                    <Card key={a.id}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {a.tests?.title || "Test"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(a.assigned_at).toLocaleDateString("ro-RO")}
                              {a.tests?.time_limit_minutes && (
                                <span className="inline-flex items-center gap-0.5 ml-1.5">
                                  <Clock className="h-2.5 w-2.5" /> {a.tests.time_limit_minutes}min
                                </span>
                              )}
                              {!a.is_active && " · Inactiv"}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs shrink-0"
                          onClick={() => {
                            setViewingResultsTestId(a.test_id);
                            setViewingResultsTitle(a.tests?.title || "Test");
                          }}
                        >
                          Rezultate
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Provocări collapsible */}
          <Collapsible open={challengesOpen} onOpenChange={setChallengesOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Provocări ({challenges.length})
              </span>
              {challengesOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="flex justify-end mb-2">
                <Button size="sm" variant="outline" onClick={() => setShowAssigner(true)} className="gap-1">
                  <Target className="h-3.5 w-3.5" /> Atribuie
                </Button>
              </div>

              {showAssigner && (
                <Card className="mb-3">
                  <CardContent className="p-4">
                    <ChallengeAssigner
                      classId={classId}
                      existingChallengeIds={existingChallengeIds}
                      onClose={() => setShowAssigner(false)}
                    />
                  </CardContent>
                </Card>
              )}

              {challenges.length === 0 ? (
                <p className="text-sm text-muted-foreground px-1">Nicio provocare atribuită.</p>
              ) : (
                <div className="space-y-2">
                  {challenges.map((ch) => {
                    const isExpanded = expandedChallenge === ch.id;
                    const completedCount = sortedMembers.filter(
                      (m) => getStudentStatus(ch.item_type, ch.item_id, m.student_id) !== null
                    ).length;

                    return (
                      <Card key={ch.id}>
                        <CardContent className="p-0">
                          <button
                            onClick={() => setExpandedChallenge(isExpanded ? null : ch.id)}
                            className="w-full p-3 flex items-center justify-between text-left"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {ch.item_type === "lesson" ? (
                                <BookOpen className="h-4 w-4 text-primary shrink-0" />
                              ) : (
                                <Code className="h-4 w-4 text-accent-foreground shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {getItemName(ch.item_type, ch.item_id)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(ch.created_at).toLocaleDateString("ro-RO")} · {completedCount}/{members.length} completat
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteChallenge(ch.id); }}
                                className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </button>

                          {isExpanded && members.length > 0 && (
                            <div className="border-t border-border px-3 pb-3 pt-2 space-y-1.5">
                              {sortedMembers.map((m) => {
                                const status = getStudentStatus(ch.item_type, ch.item_id, m.student_id);
                                const completed = status !== null;
                                const displayScore = completed ? getDisplayPercent(ch.item_type, ch.item_id, status.score) : 0;
                                const hasMistakes = completed && displayScore < 100;
                                const mistakePoints = completed ? Math.max(0, 100 - displayScore) : 0;

                                return (
                                  <div
                                    key={m.id}
                                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm ${
                                      completed
                                        ? hasMistakes
                                          ? "bg-warning/10"
                                          : "bg-primary/5"
                                        : "bg-muted/50"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {completed ? (
                                        hasMistakes ? (
                                          <XCircle className="h-3.5 w-3.5 text-warning shrink-0" />
                                        ) : (
                                          <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                                        )
                                      ) : (
                                        <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                                      )}
                                      <span className="text-foreground text-xs font-medium">
                                        {m.profile?.display_name || "Elev"}
                                      </span>
                                    </div>
                                    <div className="text-xs">
                                      {completed ? (
                                        <span
                                          className={hasMistakes ? "text-warning font-medium" : "text-primary font-medium"}
                                          title="Cel mai bun scor obținut de elev la această provocare"
                                        >
                                          Best: {displayScore}% {hasMistakes && `· ${mistakePoints} pct. pierdute`}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">Necompletat</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>

        {isTeacherPremium && (
          <TabsContent value="analytics" className="mt-4">
            <ClassAnalytics classId={classId} className={clsName} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ClassDetail;
