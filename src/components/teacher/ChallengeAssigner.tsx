import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useChapters } from "@/hooks/useChapters";
import { useProblems } from "@/hooks/useProblems";
import { useCreateChallenge } from "@/hooks/useTeacher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Code, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ChallengeAssignerProps {
  classId: string;
  existingChallengeIds: string[];
  onClose: () => void;
}

const ChallengeAssigner = ({ classId, existingChallengeIds, onClose }: ChallengeAssignerProps) => {
  const { data: chapters = [] } = useChapters();
  const { data: problemsData } = useProblems();
  const problemChapters = problemsData?.problemChapters ?? [];
  const allProblems = problemsData?.problems ?? [];
  const createChallenge = useCreateChallenge();
  const [selected, setSelected] = useState<{ type: string; id: string }[]>([]);

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

        <TabsContent value="lessons" className="max-h-64 overflow-y-auto space-y-2 mt-2">
          {chapters.map((ch) => (
            <div key={ch.id}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                {ch.icon} {ch.title}
              </p>
              {ch.lessons.map((lesson) => {
                const already = isExisting(lesson.id);
                const sel = isSelected("lesson", lesson.id);
                return (
                  <button
                    key={lesson.id}
                    onClick={() => !already && toggle("lesson", lesson.id)}
                    disabled={already}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
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
                );
              })}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="problems" className="max-h-64 overflow-y-auto space-y-2 mt-2">
          {problemChapters.map((ch) => (
            <div key={ch.id}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                {ch.icon} {ch.title}
              </p>
              {allProblems.filter((p) => p.chapter === ch.id).map((problem) => {
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
          ))}
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
