import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useChapters } from "@/hooks/useChapters";
import { useProblems } from "@/hooks/useProblems";
import { useCreateChallenge } from "@/hooks/useTeacher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Code, Check, ChevronDown, ChevronRight, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Exercise } from "@/hooks/useChapters";

interface ChallengeAssignerProps {
  classId: string;
  existingChallengeIds: string[];
  onClose: () => void;
}

const ExercisePreview = ({ exercise }: { exercise: Exercise }) => (
  <div className="ml-6 px-3 py-2 bg-muted/50 rounded-md text-xs text-muted-foreground space-y-0.5">
    <span className="font-medium text-foreground">{exercise.question}</span>
    {exercise.type === "quiz" && exercise.options && (
      <div className="mt-1 space-y-0.5">
        {exercise.options.map((opt) => (
          <div key={opt.id} className={`pl-2 ${opt.id === exercise.correctOptionId ? "text-primary font-medium" : ""}`}>
            {opt.id === exercise.correctOptionId ? "✓ " : "○ "}{opt.text}
          </div>
        ))}
      </div>
    )}
    {exercise.type === "truefalse" && (
      <div className="mt-1">Răspuns: {exercise.isTrue ? "Adevărat" : "Fals"}</div>
    )}
    {exercise.type === "fill" && exercise.blanks && (
      <div className="mt-1">Răspunsuri: {exercise.blanks.map(b => b.answer).join(", ")}</div>
    )}
    {exercise.type === "order" && exercise.lines && (
      <div className="mt-1">Ordine: {exercise.lines.sort((a, b) => a.order - b.order).map(l => l.text).join(" → ")}</div>
    )}
    {exercise.type === "match" && exercise.pairs && (
      <div className="mt-1">{exercise.pairs.map(p => `${p.left} ↔ ${p.right}`).join(", ")}</div>
    )}
  </div>
);

const ChallengeAssigner = ({ classId, existingChallengeIds, onClose }: ChallengeAssignerProps) => {
  const { data: chapters = [] } = useChapters();
  const { data: problemsData } = useProblems();
  const problemChapters = problemsData?.problemChapters ?? [];
  const allProblems = problemsData?.problems ?? [];
  const createChallenge = useCreateChallenge();
  const [selected, setSelected] = useState<{ type: string; id: string }[]>([]);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [previewLesson, setPreviewLesson] = useState<string | null>(null);
  const [expandedProblemChapter, setExpandedProblemChapter] = useState<string | null>(null);

  const toggle = (type: string, id: string) => {
    setSelected((prev) => {
      const exists = prev.find((s) => s.type === type && s.id === id);
      if (exists) return prev.filter((s) => !(s.type === type && s.id === id));
      return [...prev, { type, id }];
    });
  };

  const isSelected = (type: string, id: string) => selected.some((s) => s.type === type && s.id === id);
  const isExisting = (id: string) => existingChallengeIds.includes(id);

  const handleAssign = async () => {
    if (selected.length === 0) return;
    try {
      await createChallenge.mutateAsync(
        selected.map((s) => ({ class_id: classId, item_type: s.type, item_id: s.id }))
      );

      try {
        const { data: members } = await supabase
          .from("class_members")
          .select("student_id")
          .eq("class_id", classId);

        if (members && members.length > 0) {
          const studentIds = members.map((m) => m.student_id);

          const notifTitle = "📚 Provocare nouă!";
          const notifBody = `Ai primit ${selected.length} provocar${selected.length === 1 ? "e" : "i"} noi de la profesor!`;
          await supabase.from("notifications").insert(
            studentIds.map((sid) => ({ user_id: sid, title: notifTitle, body: notifBody }))
          );

          try {
            await supabase.functions.invoke("send-push", {
              body: { student_ids: studentIds, title: notifTitle, body: notifBody },
            });
          } catch (pushErr) {
            console.error("Push notification error:", pushErr);
          }
        }
      } catch (notifErr) {
        console.error("Notification error:", notifErr);
      }

      toast.success(`${selected.length} provocări atribuite!`);
      onClose();
    } catch {
      toast.error("Eroare la atribuirea provocărilor.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Atribuie provocări</h3>
        <span className="text-sm text-muted-foreground">{selected.length} selectate</span>
      </div>

      <Tabs defaultValue="lessons">
        <TabsList className="w-full">
          <TabsTrigger value="lessons" className="flex-1 gap-1">
            <BookOpen className="h-3.5 w-3.5" /> Lecții
          </TabsTrigger>
          <TabsTrigger value="problems" className="flex-1 gap-1">
            <Code className="h-3.5 w-3.5" /> Probleme
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="max-h-80 overflow-y-auto space-y-1 mt-2">
          {chapters.map((ch) => {
            const isChExpanded = expandedChapter === ch.id;
            return (
              <div key={ch.id}>
                <button
                  onClick={() => setExpandedChapter(isChExpanded ? null : ch.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-foreground hover:bg-secondary flex items-center gap-2"
                >
                  {isChExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  {ch.icon} {ch.title}
                </button>
                {isChExpanded && (
                  <div className="ml-2 space-y-1 mt-1">
                    {ch.lessons.map((lesson) => {
                      const already = isExisting(lesson.id);
                      const sel = isSelected("lesson", lesson.id);
                      const isPreviewing = previewLesson === lesson.id;
                      return (
                        <div key={lesson.id}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => !already && toggle("lesson", lesson.id)}
                              disabled={already}
                              className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                                already
                                  ? "opacity-40 cursor-not-allowed bg-muted"
                                  : sel
                                  ? "bg-primary/10 text-primary border border-primary/30"
                                  : "hover:bg-secondary"
                              }`}
                            >
                              <span>{lesson.title}</span>
                              {(sel || already) && <Check className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => setPreviewLesson(isPreviewing ? null : lesson.id)}
                              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary shrink-0"
                              title="Previzualizare"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {isPreviewing && lesson.exercises.length > 0 && (
                            <div className="space-y-1 mt-1 mb-2">
                              {lesson.exercises.map((ex) => (
                                <ExercisePreview key={ex.id} exercise={ex} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="problems" className="max-h-80 overflow-y-auto space-y-1 mt-2">
          {problemChapters.map((ch) => {
            const isChExpanded = expandedProblemChapter === ch.id;
            const chapterProblems = allProblems.filter((p) => p.chapter === ch.id);
            return (
              <div key={ch.id}>
                <button
                  onClick={() => setExpandedProblemChapter(isChExpanded ? null : ch.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-foreground hover:bg-secondary flex items-center gap-2"
                >
                  {isChExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  {ch.icon} {ch.title}
                </button>
                {isChExpanded && (
                  <div className="ml-2 space-y-1 mt-1">
                    {chapterProblems.map((problem) => {
                      const already = isExisting(problem.id);
                      const sel = isSelected("problem", problem.id);
                      return (
                        <button
                          key={problem.id}
                          onClick={() => !already && toggle("problem", problem.id)}
                          disabled={already}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                            already
                              ? "opacity-40 cursor-not-allowed bg-muted"
                              : sel
                              ? "bg-primary/10 text-primary border border-primary/30"
                              : "hover:bg-secondary"
                          }`}
                        >
                          <span>{problem.title}</span>
                          {(sel || already) && <Check className="h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>
      </Tabs>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Anulează
        </Button>
        <Button onClick={handleAssign} disabled={selected.length === 0 || createChallenge.isPending} className="flex-1">
          {createChallenge.isPending ? "Se salvează..." : `Atribuie (${selected.length})`}
        </Button>
      </div>
    </div>
  );
};

export default ChallengeAssigner;
