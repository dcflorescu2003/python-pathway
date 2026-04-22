import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTeacherTests, useDeleteTest, useAssignTest, useTestAssignments, useTestItems } from "@/hooks/useTests";
import { useTeacherClasses } from "@/hooks/useTeacher";
import { Plus, Trash2, FileText, Clock, Send, ChevronDown, ChevronUp, Users, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import TestResults from "./TestResults";

interface TestManagerProps {
  onCreateTest: () => void;
  onEditTest: (testId: string) => void;
}

const TestManager = ({ onCreateTest, onEditTest }: TestManagerProps) => {
  const { data: tests = [], isLoading } = useTeacherTests();
  const deleteTest = useDeleteTest();
  const assignTest = useAssignTest();
  const { data: classes = [] } = useTeacherClasses();
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [assigningTestId, setAssigningTestId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [windowMinutes, setWindowMinutes] = useState<string>("");
  const [viewingResultsTestId, setViewingResultsTestId] = useState<string | null>(null);

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Testele mele ({tests.length})</h3>
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

      <Button variant="outline" className="w-full gap-2" onClick={onCreateTest}>
        <Plus className="h-4 w-4" /> Creează test nou
      </Button>
    </div>
  );
};

export default TestManager;
