import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTeacherTests, useDeleteTest, useAssignTest, useTestAssignments, useTestItems } from "@/hooks/useTests";
import { useTeacherClasses } from "@/hooks/useTeacher";
import { Plus, Trash2, FileText, Clock, Send, ChevronDown, ChevronUp, Users, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import TestResults from "./TestResults";
import { useSubscription } from "@/hooks/useSubscription";
import { getTeacherTestLimit, TEACHER_TIER_LABEL } from "@/lib/teacherLimits";
import TestLimitReachedDialog from "./TestLimitReachedDialog";
import TeacherPremiumDialog from "@/components/TeacherPremiumDialog";

interface TestManagerProps {
  onCreateTest: () => void;
  onEditTest: (testId: string) => void;
  teacherStatus?: string | null;
}

const TestManager = ({ onCreateTest, onEditTest, teacherStatus }: TestManagerProps) => {
  const { data: tests = [], isLoading } = useTeacherTests();
  const deleteTest = useDeleteTest();
  const assignTest = useAssignTest();
  const { data: classes = [] } = useTeacherClasses();
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [assigningTestId, setAssigningTestId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [windowMinutes, setWindowMinutes] = useState<string>("");
  const [viewingResultsTestId, setViewingResultsTestId] = useState<string | null>(null);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [premiumDialogOpen, setPremiumDialogOpen] = useState(false);
  const warnedRef = useRef<{ p80: boolean; p95: boolean }>({ p80: false, p95: false });

  const { isTeacherPremium } = useSubscription();
  const { limit: testLimit, tier: teacherTier } = getTeacherTestLimit({ teacherStatus, isTeacherPremium });
  const totalTests = tests.length;
  const ratio = testLimit > 0 ? totalTests / testLimit : 0;
  const atLimit = totalTests >= testLimit;

  useEffect(() => {
    if (isLoading) return;
    if (ratio >= 0.95 && ratio < 1 && !warnedRef.current.p95) {
      warnedRef.current.p95 = true;
      toast.warning(`Aproape ai atins limita (${totalTests}/${testLimit} teste salvate).`);
    } else if (ratio >= 0.8 && ratio < 0.95 && !warnedRef.current.p80) {
      warnedRef.current.p80 = true;
      const remaining = testLimit - totalTests;
      toast.message(`Mai ai ${remaining} teste până la limita de ${testLimit}.`);
    }
  }, [ratio, totalTests, testLimit, isLoading]);

  const handleCreateClick = () => {
    if (atLimit) {
      setLimitDialogOpen(true);
      return;
    }
    onCreateTest();
  };

  const { data: assignments = [] } = useTestAssignments(expandedTestId);
  const { data: items = [] } = useTestItems(expandedTestId);

  const handleDelete = async (e: React.MouseEvent, testId: string) => {
    e.stopPropagation();
    if (!confirm("Sigur vrei să ștergi acest test?")) return;
    try {
      await deleteTest.mutateAsync(testId);
      toast.success("Test șters.");
    } catch {
      toast.error("Eroare la ștergerea testului.");
    }
  };

  const handleAssign = async (testId: string, testTitle: string) => {
    if (!selectedClassId) return;
    try {
      const wm = windowMinutes ? parseInt(windowMinutes, 10) : undefined;
      await assignTest.mutateAsync({ test_id: testId, class_id: selectedClassId, testTitle, window_minutes: wm && wm > 0 ? wm : undefined });
      toast.success("Test distribuit!");
      setAssigningTestId(null);
      setSelectedClassId("");
      setWindowMinutes("");
    } catch {
      toast.error("Eroare la distribuire.");
    }
  };

  if (viewingResultsTestId) {
    return (
      <TestResults
        testId={viewingResultsTestId}
        testTitle={tests?.find((t: any) => t.id === viewingResultsTestId)?.title}
        onBack={() => setViewingResultsTestId(null)}
      />
    );
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Se încarcă...</p>;

  const counterCls = ratio >= 0.95
    ? 'border-destructive/50 bg-destructive/10 text-destructive'
    : ratio >= 0.8
    ? 'border-warning/50 bg-warning/10 text-warning'
    : 'border-border bg-muted text-muted-foreground';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-muted-foreground">Testele mele ({tests.length})</h3>
        <div className={`text-[11px] px-2 py-0.5 rounded-full border ${counterCls}`} title={TEACHER_TIER_LABEL[teacherTier]}>
          {totalTests}/{testLimit} teste salvate
        </div>
      </div>

      {tests.map((test) => {
        const isExpanded = expandedTestId === test.id;
        return (
          <Card key={test.id}>
            <CardContent className="p-0">
              <button
                onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                className="w-full p-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{test.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(test.created_at).toLocaleDateString("ro-RO")}
                      {test.time_limit_minutes && (
                        <span className="ml-1">· <Clock className="h-2.5 w-2.5 inline" /> {test.time_limit_minutes} min</span>
                      )}
                      {" · "}{test.variant_mode === "shuffle" ? "Shuffle" : "Manual"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => handleDelete(e, test.id)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border px-3 pb-3 pt-2 space-y-3">
                  <p className="text-xs text-muted-foreground">{items.length} itemi</p>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => onEditTest(test.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Editează
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => {
                        if (assigningTestId === test.id) {
                          setAssigningTestId(null);
                        } else {
                          setAssigningTestId(test.id);
                          setWindowMinutes(test.time_limit_minutes ? String(test.time_limit_minutes) : "");
                        }
                      }}
                    >
                      <Send className="h-3.5 w-3.5" /> Distribuie
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => setViewingResultsTestId(test.id)}
                    >
                      <Users className="h-3.5 w-3.5" /> Rezultate
                    </Button>
                  </div>

                  {assigningTestId === test.id && (
                    <div className="space-y-2 bg-muted/50 rounded-lg p-2">
                      <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Alege clasa" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Disponibil timp de (minute)</label>
                        <Input
                          type="number"
                          min={1}
                          className="h-8 text-xs"
                          placeholder="ex: 60"
                          value={windowMinutes}
                          onChange={(e) => setWindowMinutes(e.target.value)}
                        />
                      </div>
                      <Button size="sm" onClick={() => handleAssign(test.id, test.title)} disabled={!selectedClassId || assignTest.isPending} className="w-full">
                        {assignTest.isPending ? "Se distribuie..." : "Confirmă"}
                      </Button>
                    </div>
                  )}

                  {assignments.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Distribuit la:</p>
                      {assignments.map((a: any) => (
                        <p key={a.id} className="text-xs text-foreground">
                          • {a.teacher_classes?.name || "Clasă"} — {new Date(a.assigned_at).toLocaleDateString("ro-RO")}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Button
        variant="outline"
        className={`w-full gap-2 ${atLimit ? 'border-destructive/50 text-destructive hover:bg-destructive/10' : ''}`}
        onClick={handleCreateClick}
      >
        <Plus className="h-4 w-4" /> {atLimit ? 'Limită atinsă — vezi opțiuni' : 'Creează test nou'}
      </Button>

      <TestLimitReachedDialog
        open={limitDialogOpen}
        onOpenChange={setLimitDialogOpen}
        tier={teacherTier}
        limit={testLimit}
        onUpgrade={() => setPremiumDialogOpen(true)}
      />
      <TeacherPremiumDialog open={premiumDialogOpen} onOpenChange={setPremiumDialogOpen} />
    </div>
  );
};

export default TestManager;
