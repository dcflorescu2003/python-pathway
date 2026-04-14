import { useState } from "react";
import { usePredefinedTests, usePredefinedTestItems, usePredefinedTestMutations, PredefinedTest } from "@/hooks/usePredefinedTests";
import { useEvalChapters, useEvalLessons, useAllEvalExercises } from "@/hooks/useEvalBank";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, Save, Edit2, ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TestItemDraft {
  variant: string;
  source_type: string;
  source_id: string | null;
  custom_data: any;
  points: number;
}

const PredefinedTestEditor = () => {
  const { data: tests = [], isLoading } = usePredefinedTests();
  const mutations = usePredefinedTestMutations();
  const [editingTest, setEditingTest] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Se încarcă...</p>;

  if (editingTest || creating) {
    return (
      <TestForm
        testId={editingTest}
        onBack={() => { setEditingTest(null); setCreating(false); }}
        mutations={mutations}
      />
    );
  }

  return (
    <div className="space-y-3">
      {tests.map(test => (
        <div key={test.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-sm truncate">{test.title}</h3>
            <p className="text-xs text-muted-foreground">{test.description || "Fără descriere"}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{test.difficulty}</span>
              {test.time_limit_minutes && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent-foreground">{test.time_limit_minutes} min</span>}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{test.variant_mode}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setEditingTest(test.id)}><Edit2 className="h-4 w-4" /></Button>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Șterge testul?</AlertDialogTitle><AlertDialogDescription>Această acțiune este ireversibilă.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Anulează</AlertDialogCancel><AlertDialogAction onClick={async () => { await mutations.deleteTest.mutateAsync(test.id); toast.success("Test șters!"); }}>Șterge</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}

      <Button variant="outline" className="w-full" onClick={() => setCreating(true)}>
        <Plus className="h-4 w-4 mr-2" />Test predefinit nou
      </Button>
    </div>
  );
};

// --- Test Form ---
function TestForm({ testId, onBack, mutations }: { testId: string | null; onBack: () => void; mutations: ReturnType<typeof usePredefinedTestMutations> }) {
  const { data: existingTest } = usePredefinedTests();
  const test = testId ? existingTest?.find(t => t.id === testId) : null;
  const { data: existingItems = [] } = usePredefinedTestItems(testId);

  const [title, setTitle] = useState(test?.title || "");
  const [description, setDescription] = useState(test?.description || "");
  const [difficulty, setDifficulty] = useState(test?.difficulty || "mediu");
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(!!test?.time_limit_minutes);
  const [timeLimit, setTimeLimit] = useState(test?.time_limit_minutes || 45);
  const [variantMode, setVariantMode] = useState(test?.variant_mode || "shuffle");
  const [items, setItems] = useState<TestItemDraft[]>(
    existingItems.map(i => ({ variant: i.variant, source_type: i.source_type, source_id: i.source_id, custom_data: i.custom_data, points: i.points }))
  );
  const [loaded, setLoaded] = useState(!testId);

  // Load existing items
  if (testId && existingItems.length > 0 && !loaded) {
    setItems(existingItems.map(i => ({ variant: i.variant, source_type: i.source_type, source_id: i.source_id, custom_data: i.custom_data, points: i.points })));
    if (test) { setTitle(test.title); setDescription(test.description); setDifficulty(test.difficulty); setTimeLimitEnabled(!!test.time_limit_minutes); setTimeLimit(test.time_limit_minutes || 45); setVariantMode(test.variant_mode); }
    setLoaded(true);
  }

  // Bank browser
  const { data: evalChapters = [] } = useEvalChapters();
  const { data: allExercises = [] } = useAllEvalExercises();
  const [browseChapter, setBrowseChapter] = useState<string | null>(null);
  const [browseLessonId, setBrowseLessonId] = useState<string | null>(null);

  const addItem = (sourceType: string, sourceId: string) => {
    if (items.some(i => i.source_id === sourceId && i.source_type === sourceType)) {
      toast.info("Itemul este deja adăugat.");
      return;
    }
    setItems([...items, { variant: "both", source_type: sourceType, source_id: sourceId, custom_data: null, points: 10 }]);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updatePoints = (idx: number, points: number) => { const n = [...items]; n[idx] = { ...n[idx], points }; setItems(n); };
  const updateVariant = (idx: number, variant: string) => { const n = [...items]; n[idx] = { ...n[idx], variant }; setItems(n); };

  const getExerciseLabel = (item: TestItemDraft) => {
    if (item.source_type === "eval_exercise" && item.source_id) {
      const ex = allExercises.find(e => e.id === item.source_id);
      return ex?.question?.substring(0, 60) || item.source_id;
    }
    return item.source_id || "Custom";
  };

  const typeLabels: Record<string, string> = { quiz: "Quiz", fill: "Completare", order: "Ordonare", truefalse: "A/F" };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Adaugă un titlu."); return; }
    try {
      let id = testId;
      if (!id) {
        const created = await mutations.createTest.mutateAsync({
          title: title.trim(), description: description.trim(), difficulty,
          time_limit_minutes: timeLimitEnabled ? timeLimit : null, variant_mode: variantMode,
        });
        id = created.id;
      } else {
        await mutations.updateTest.mutateAsync({
          id, title: title.trim(), description: description.trim(), difficulty,
          time_limit_minutes: timeLimitEnabled ? timeLimit : null, variant_mode: variantMode,
        });
      }
      await mutations.saveItems.mutateAsync({
        testId: id!,
        items: items.map((item, i) => ({ ...item, test_id: id!, sort_order: i })),
      });
      toast.success(testId ? "Test actualizat!" : "Test creat!");
      onBack();
    } catch {
      toast.error("Eroare la salvare.");
    }
  };

  const totalPoints = items.reduce((s, i) => s + i.points, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h2 className="text-lg font-bold text-foreground">{testId ? "Editează test predefinit" : "Test predefinit nou"}</h2>
      </div>

      {/* Metadata */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div><Label className="text-xs text-foreground">Titlu</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div><Label className="text-xs text-foreground">Descriere</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-foreground">Dificultate</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ușor">Ușor</SelectItem>
                <SelectItem value="mediu">Mediu</SelectItem>
                <SelectItem value="avansat">Avansat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-foreground">Variante</Label>
            <Select value={variantMode} onValueChange={setVariantMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="shuffle">Shuffle</SelectItem>
                <SelectItem value="manual">Manual A/B</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Switch checked={timeLimitEnabled} onCheckedChange={setTimeLimitEnabled} />
              <Label className="text-xs text-foreground">Timp limitat</Label>
            </div>
            {timeLimitEnabled && <Input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} min={5} max={180} />}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Itemi ({items.length}) — {totalPoints} puncte</h3>
        </div>

        {items.map((item, idx) => {
          const ex = item.source_type === "eval_exercise" ? allExercises.find(e => e.id === item.source_id) : null;
          return (
            <div key={idx} className="flex items-center gap-2 p-2 rounded border border-border/50 bg-secondary/20 text-xs">
              {ex && <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{typeLabels[ex.type] || ex.type}</span>}
              <span className="flex-1 truncate text-foreground">{getExerciseLabel(item)}</span>
              <Input type="number" value={item.points} onChange={e => updatePoints(idx, Number(e.target.value))} className="w-16 h-7 text-xs text-center" min={1} />
              <span className="text-muted-foreground text-[10px]">pct</span>
              {variantMode === "manual" && (
                <Select value={item.variant} onValueChange={v => updateVariant(idx, v)}>
                  <SelectTrigger className="w-16 h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">A+B</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(idx)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          );
        })}
      </div>

      {/* Bank browser */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><BookOpen className="h-4 w-4" />Adaugă din bancă</h3>

        <div className="space-y-2">
          {evalChapters.map(ch => (
            <div key={ch.id}>
              <button
                className="flex items-center gap-2 w-full text-left p-2 rounded hover:bg-secondary/50 transition-colors"
                onClick={() => { setBrowseChapter(browseChapter === ch.id ? null : ch.id); setBrowseLessonId(null); }}
              >
                <span>{ch.icon}</span>
                <span className="text-sm font-medium text-foreground flex-1">{ch.title}</span>
                {browseChapter === ch.id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
              {browseChapter === ch.id && (
                <BrowseLessons
                  chapterId={ch.id}
                  browseLessonId={browseLessonId}
                  setBrowseLessonId={setBrowseLessonId}
                  allExercises={allExercises}
                  onAdd={(sourceId: string) => addItem("eval_exercise", sourceId)}
                  addedIds={new Set(items.filter(i => i.source_type === "eval_exercise").map(i => i.source_id!))}
                  typeLabels={typeLabels}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} className="flex-1"><Save className="h-4 w-4 mr-2" />Salvează testul</Button>
        <Button variant="outline" onClick={onBack}>Anulează</Button>
      </div>
    </div>
  );
}

// --- Browse Lessons in Bank ---
function BrowseLessons({ chapterId, browseLessonId, setBrowseLessonId, allExercises, onAdd, addedIds, typeLabels }: any) {
  const { data: lessons = [] } = useEvalLessons(chapterId);

  return (
    <div className="ml-6 space-y-1">
      {lessons.map((lesson: any) => {
        const lessonExercises = allExercises.filter((e: any) => e.lesson_id === lesson.id);
        const isOpen = browseLessonId === lesson.id;
        return (
          <div key={lesson.id}>
            <button
              className="flex items-center gap-2 w-full text-left p-1.5 rounded hover:bg-secondary/30 transition-colors text-xs"
              onClick={() => setBrowseLessonId(isOpen ? null : lesson.id)}
            >
              <span className="font-medium text-foreground flex-1">{lesson.title}</span>
              <span className="text-muted-foreground">{lessonExercises.length}</span>
              {isOpen ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </button>
            {isOpen && (
              <div className="ml-4 space-y-1 mt-1">
                {lessonExercises.map((ex: any) => (
                  <div key={ex.id} className="flex items-center gap-2 p-1.5 rounded border border-border/30 bg-background/50 text-[11px]">
                    <span className="px-1 py-0.5 rounded bg-primary/10 text-primary">{typeLabels[ex.type] || ex.type}</span>
                    <span className="flex-1 truncate text-foreground">{ex.question}</span>
                    <Button
                      variant={addedIds.has(ex.id) ? "secondary" : "outline"}
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      disabled={addedIds.has(ex.id)}
                      onClick={() => onAdd(ex.id)}
                    >
                      {addedIds.has(ex.id) ? "Adăugat" : "+ Adaugă"}
                    </Button>
                  </div>
                ))}
                {lessonExercises.length === 0 && <p className="text-[10px] text-muted-foreground p-1">Niciun exercițiu.</p>}
              </div>
            )}
          </div>
        );
      })}
      {lessons.length === 0 && <p className="text-[10px] text-muted-foreground p-1">Nicio lecție.</p>}
    </div>
  );
}

export default PredefinedTestEditor;
