import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProblems, Problem, ProblemChapter } from "@/hooks/useProblems";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, Edit2, Trash2, Plus, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TestCaseForm {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

const emptyProblem = (chapterId: string): Omit<Problem, "id"> => ({
  title: "",
  description: "",
  difficulty: "ușor",
  xpReward: 10,
  testCases: [{ input: "", expectedOutput: "", hidden: false }],
  hint: "",
  chapter: chapterId,
  solution: "",
});

const ProblemsEditor = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useProblems();
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [editingProblem, setEditingProblem] = useState<string | null>(null);
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Problem, "id"> & { id?: string }>(emptyProblem(""));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["problems"] });

  const startEdit = (p: Problem) => {
    setEditingProblem(p.id);
    setCreatingFor(null);
    setForm({ ...p });
  };

  const startCreate = (chapterId: string) => {
    setCreatingFor(chapterId);
    setEditingProblem(null);
    setForm(emptyProblem(chapterId));
  };

  const saveProblem = async () => {
    if (!form.title.trim()) { toast.error("Titlul e obligatoriu"); return; }

    const row = {
      title: form.title,
      description: form.description,
      difficulty: form.difficulty,
      xp_reward: form.xpReward,
      test_cases: JSON.parse(JSON.stringify(form.testCases)),
      hint: form.hint || null,
      chapter_id: form.chapter,
      solution: form.solution,
    };

    if (editingProblem) {
      const { error } = await supabase.from("problems").update(row).eq("id", editingProblem);
      if (error) { toast.error(error.message); return; }
      toast.success("Problemă salvată!");
    } else {
      const newId = `p-${Date.now()}`;
      const { error } = await supabase.from("problems").insert({ ...row, id: newId } as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Problemă creată!");
    }
    setEditingProblem(null);
    setCreatingFor(null);
    invalidate();
  };

  const deleteProblem = async (id: string) => {
    const { error } = await supabase.from("problems").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Problemă ștearsă!");
    invalidate();
  };

  const updateTestCase = (index: number, field: keyof TestCaseForm, value: string | boolean) => {
    const newCases = [...form.testCases];
    newCases[index] = { ...newCases[index], [field]: value };
    setForm(f => ({ ...f, testCases: newCases }));
  };

  const addTestCase = () => setForm(f => ({ ...f, testCases: [...f.testCases, { input: "", expectedOutput: "", hidden: false }] }));
  const removeTestCase = (i: number) => setForm(f => ({ ...f, testCases: f.testCases.filter((_, j) => j !== i) }));

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Se încarcă...</p>;
  if (!data) return <p className="text-sm text-destructive p-4">Eroare la încărcare.</p>;

  const { problems, problemChapters } = data;

  const renderForm = () => (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
      <h3 className="font-bold text-foreground">{editingProblem ? "Editează problemă" : "Problemă nouă"}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-foreground text-xs">Titlu</Label>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div>
          <Label className="text-foreground text-xs">Dificultate</Label>
          <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v as any }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ușor">Ușor</SelectItem>
              <SelectItem value="mediu">Mediu</SelectItem>
              <SelectItem value="greu">Greu</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-foreground text-xs">Descriere (Markdown)</Label>
        <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className="font-mono text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-foreground text-xs">XP Reward</Label>
          <Input type="number" value={form.xpReward} onChange={e => setForm(f => ({ ...f, xpReward: parseInt(e.target.value) || 0 }))} />
        </div>
        <div>
          <Label className="text-foreground text-xs">Hint</Label>
          <Input value={form.hint || ""} onChange={e => setForm(f => ({ ...f, hint: e.target.value }))} />
        </div>
      </div>

      <div>
        <Label className="text-foreground text-xs">Soluție (cod Python)</Label>
        <Textarea value={form.solution} onChange={e => setForm(f => ({ ...f, solution: e.target.value }))} rows={4} className="font-mono text-sm" />
      </div>

      <div>
        <Label className="text-foreground text-xs">Cazuri de test</Label>
        {form.testCases.map((tc, i) => (
          <div key={i} className="flex items-start gap-2 mt-2 p-2 rounded border border-border bg-card">
            <span className="text-[10px] text-muted-foreground mt-2">#{i + 1}</span>
            <div className="flex-1 space-y-1">
              <Input value={tc.input} onChange={e => updateTestCase(i, "input", e.target.value)} placeholder="Input" className="text-xs font-mono" />
              <Input value={tc.expectedOutput} onChange={e => updateTestCase(i, "expectedOutput", e.target.value)} placeholder="Output așteptat" className="text-xs font-mono" />
              <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <input type="checkbox" checked={tc.hidden || false} onChange={e => updateTestCase(i, "hidden", e.target.checked)} />
                Ascuns
              </label>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeTestCase(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="mt-2" onClick={addTestCase}>
          <Plus className="h-4 w-4 mr-1" /> Adaugă caz de test
        </Button>
      </div>

      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={saveProblem} className="flex-1"><Save className="h-4 w-4 mr-1" />Salvează</Button>
        <Button size="sm" variant="outline" onClick={() => { setEditingProblem(null); setCreatingFor(null); }} className="flex-1">Anulează</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {problemChapters.map(ch => {
        const isExpanded = expandedChapter === ch.id;
        const chapterProblems = problems.filter(p => p.chapter === ch.id);

        return (
          <div key={ch.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setExpandedChapter(isExpanded ? null : ch.id)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              <span className="text-xl">{ch.icon}</span>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-foreground text-sm truncate">{ch.title}</h2>
                <p className="text-xs text-muted-foreground">{chapterProblems.length} probleme</p>
              </div>
              {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border">
                  <div className="p-3 space-y-2">
                    {chapterProblems.map(p => (
                      <div key={p.id} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          p.difficulty === "ușor" ? "bg-green-500/10 text-green-500" :
                          p.difficulty === "mediu" ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-red-500/10 text-red-500"
                        }`}>{p.difficulty}</span>
                        <p className="flex-1 text-sm text-foreground truncate">{p.title}</p>
                        <span className="text-[10px] text-muted-foreground">{p.xpReward}XP · {p.testCases.length} teste</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(p)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Șterge problema</AlertDialogTitle>
                              <AlertDialogDescription>Sigur vrei să ștergi "{p.title}"?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Anulează</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteProblem(p.id)}>Șterge</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}

                    {(editingProblem && problems.find(p => p.id === editingProblem)?.chapter === ch.id) || creatingFor === ch.id
                      ? renderForm()
                      : (
                        <Button variant="outline" size="sm" className="w-full" onClick={() => startCreate(ch.id)}>
                          <Plus className="h-4 w-4 mr-1" /> Adaugă problemă
                        </Button>
                      )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default ProblemsEditor;
