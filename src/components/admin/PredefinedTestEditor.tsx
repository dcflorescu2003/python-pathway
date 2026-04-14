import { useState } from "react";
import { usePredefinedTests, usePredefinedTestItems, usePredefinedTestMutations, PredefinedTest } from "@/hooks/usePredefinedTests";
import { useEvalChapters, useEvalLessons, useAllEvalExercises } from "@/hooks/useEvalBank";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Save, Edit2, ChevronDown, ChevronRight, BookOpen, GripVertical, Eye, ChevronLeft, Clock } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  const [previewTestId, setPreviewTestId] = useState<string | null>(null);

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
          <Button variant="ghost" size="icon" onClick={() => setPreviewTestId(test.id)} title="Previzualizare"><Eye className="h-4 w-4" /></Button>
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

      {previewTestId && (
        <TestPreviewDialog
          testId={previewTestId}
          tests={tests}
          onClose={() => setPreviewTestId(null)}
        />
      )}
    </div>
  );
};

// --- Test Preview Dialog (student view) ---
function TestPreviewDialog({ testId, tests, onClose }: { testId: string; tests: PredefinedTest[]; onClose: () => void }) {
  const test = tests.find(t => t.id === testId);
  const { data: testItems = [] } = usePredefinedTestItems(testId);
  const { data: allExercises = [] } = useAllEvalExercises();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});

  if (!test) return null;

  const items = testItems.sort((a, b) => a.sort_order - b.sort_order);
  const currentItem = items[currentIdx];
  const totalPoints = items.reduce((s, i) => s + i.points, 0);

  const getExerciseData = (item: typeof testItems[0]) => {
    if (item.source_type === "eval_exercise" && item.source_id) {
      return allExercises.find(e => e.id === item.source_id) || null;
    }
    if (item.custom_data) return item.custom_data;
    return null;
  };

  const formatTime = (mins: number) => `${mins}:00`;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Student-style header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1">
              <DialogHeader className="text-left space-y-0">
                <DialogTitle className="text-sm font-bold truncate">{test.title}</DialogTitle>
              </DialogHeader>
              <p className="text-[10px] text-muted-foreground">{items.length > 0 ? `${currentIdx + 1}/${items.length}` : "0 itemi"} — {totalPoints} puncte total</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{test.difficulty}</span>
              {test.time_limit_minutes && (
                <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                  <Clock className="h-3 w-3" /> {formatTime(test.time_limit_minutes)}
                </span>
              )}
            </div>
          </div>
          {items.length > 0 && <Progress value={((currentIdx + 1) / items.length) * 100} className="h-1" />}
        </div>

        <div className="px-4 py-4 space-y-4">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Niciun item în acest test.</p>
          )}

          {currentItem && (() => {
            const exData = getExerciseData(currentItem);
            if (!exData) return <p className="text-sm text-muted-foreground">Item nedisponibil (sursă ștearsă?).</p>;
            return (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {currentItem.points} puncte
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {exData.type === "quiz" ? "Quiz" : exData.type === "fill" ? "Completare" : exData.type === "order" ? "Ordonare" : exData.type === "truefalse" ? "Adevărat/Fals" : exData.type}
                    </span>
                  </div>
                  <PreviewExerciseRenderer exercise={exData} answer={answers[currentIdx]} onAnswer={(d) => setAnswers(prev => ({ ...prev, [currentIdx]: d }))} />
                </CardContent>
              </Card>
            );
          })()}

          {/* Navigation */}
          {items.length > 1 && (
            <>
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}>
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                <Button size="sm" onClick={() => setCurrentIdx(Math.min(items.length - 1, currentIdx + 1))} disabled={currentIdx >= items.length - 1}>
                  Următorul <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-center gap-1.5 flex-wrap">
                {items.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-6 h-6 rounded-full text-[10px] font-medium transition-colors ${
                      idx === currentIdx ? "bg-primary text-primary-foreground" : answers[idx] ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="text-[10px] text-center text-muted-foreground italic">Previzualizare — aceasta este vizualizarea elevului</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Preview Exercise Renderer (mirrors TakeTestPage renderers) ---
function PreviewExerciseRenderer({ exercise, answer, onAnswer }: { exercise: any; answer: any; onAnswer: (d: any) => void }) {
  const type = exercise.type;

  if (type === "quiz") {
    const options = (exercise.options || []) as { id: string; text: string }[];
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{exercise.question}</p>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onAnswer({ selected: opt.id })}
            className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
              answer?.selected === opt.id ? "border-primary bg-primary/10 text-foreground" : "border-border text-foreground hover:border-primary/50"
            }`}
          >
            {opt.text}
          </button>
        ))}
      </div>
    );
  }

  if (type === "truefalse") {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">{exercise.statement || exercise.question}</p>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              onClick={() => onAnswer({ selected: val })}
              className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
                answer?.selected === val ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              {val ? "Adevărat" : "Fals"}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (type === "fill") {
    const blanks = (exercise.blanks || []) as { id: string; answer: string }[];
    const codeTemplate = exercise.code_template || exercise.codeTemplate || "";
    const currentAnswers = answer?.blanks || {};

    if (!codeTemplate) {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{exercise.question}</p>
          {blanks.map((blank, idx) => (
            <Input key={blank.id} placeholder={`Spațiu ${idx + 1}`} value={currentAnswers[blank.id] || ""} onChange={(e) => onAnswer({ blanks: { ...currentAnswers, [blank.id]: e.target.value } })} className="text-sm" />
          ))}
        </div>
      );
    }

    const parts = codeTemplate.split("___");
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">{exercise.question}</p>
        <pre className="bg-muted/50 border border-border rounded-lg p-3 whitespace-pre-wrap font-mono text-sm text-foreground">
          {parts.map((part: string, i: number) => (
            <span key={i}>
              <span>{part}</span>
              {i < parts.length - 1 && blanks[i] && (
                <Input autoCapitalize="none" className="inline-block w-28 h-7 mx-1 font-mono text-sm bg-secondary border-primary/50 text-primary" value={currentAnswers[blanks[i].id] || ""} onChange={(e) => onAnswer({ blanks: { ...currentAnswers, [blanks[i].id]: e.target.value } })} placeholder={"_".repeat(blanks[i].answer.length)} />
              )}
            </span>
          ))}
        </pre>
      </div>
    );
  }

  if (type === "order") {
    const lines = (exercise.lines || []) as { id: string; text: string }[];
    const ordered: string[] = answer?.order || lines.map((l) => l.id);

    const moveItem = (from: number, to: number) => {
      const newOrder = [...ordered];
      const [item] = newOrder.splice(from, 1);
      newOrder.splice(to, 0, item);
      onAnswer({ order: newOrder });
    };

    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{exercise.question}</p>
        {ordered.map((lineId: string, idx: number) => {
          const line = lines.find((l) => l.id === lineId);
          return (
            <div key={lineId} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card text-sm font-mono">
              <span className="text-muted-foreground shrink-0">≡</span>
              <code className="text-foreground whitespace-pre-wrap break-words flex-1">{line?.text || lineId}</code>
              <div className="ml-auto flex gap-1">
                <button onClick={() => idx > 0 && moveItem(idx, idx - 1)} disabled={idx === 0} className="text-base text-muted-foreground hover:text-foreground disabled:opacity-30 px-1">▲</button>
                <button onClick={() => idx < ordered.length - 1 && moveItem(idx, idx + 1)} disabled={idx === ordered.length - 1} className="text-base text-muted-foreground hover:text-foreground disabled:opacity-30 px-1">▼</button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{exercise.question}</p>
      <Textarea placeholder="Scrie răspunsul tău..." value={answer?.text || ""} onChange={(e) => onAnswer({ text: e.target.value })} />
    </div>
  );
}

// --- Sortable Test Item ---
function SortableTestItem({ id, item, idx, ex, typeLabels, getExerciseLabel, updatePoints, updateVariant, removeItem, variantMode }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, position: "relative" as const, zIndex: isDragging ? 50 : "auto" as any };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 rounded border border-border/50 bg-secondary/20 text-xs">
      <div className="cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
      </div>
      {ex && <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{typeLabels[ex.type] || ex.type}</span>}
      <span className="flex-1 truncate text-foreground">{getExerciseLabel(item)}</span>
      <Input type="number" value={item.points} onChange={(e: any) => updatePoints(idx, Number(e.target.value))} className="w-16 h-7 text-xs text-center" min={1} />
      <span className="text-muted-foreground text-[10px]">pct</span>
      {variantMode === "manual" && (
        <Select value={item.variant} onValueChange={(v: string) => updateVariant(idx, v)}>
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
}

// --- Test Form ---
function TestForm({ testId, onBack, mutations }: { testId: string | null; onBack: () => void; mutations: ReturnType<typeof usePredefinedTestMutations> }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
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

  const handleItemReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = Number(active.id);
    const newIndex = Number(over.id);
    setItems(arrayMove(items, oldIndex, newIndex));
  };

  const getExerciseLabel = (item: TestItemDraft) => {
    if (item.source_type === "eval_exercise" && item.source_id) {
      const ex = allExercises.find(e => e.id === item.source_id);
      return ex?.question?.substring(0, 60) || item.source_id;
    }
    return item.source_id || "Custom";
  };

  const typeLabels: Record<string, string> = { quiz: "Quiz", fill: "Completare", order: "Ordonare", truefalse: "A/F", problem: "Problemă", open_answer: "Răspuns deschis" };

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

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemReorder}>
          <SortableContext items={items.map((_, i) => i)} strategy={verticalListSortingStrategy}>
            {items.map((item, idx) => {
              const ex = item.source_type === "eval_exercise" ? allExercises.find(e => e.id === item.source_id) : null;
              return <SortableTestItem key={idx} id={idx} item={item} idx={idx} ex={ex} typeLabels={typeLabels} getExerciseLabel={getExerciseLabel} updatePoints={updatePoints} updateVariant={updateVariant} removeItem={removeItem} variantMode={variantMode} />;
            })}
          </SortableContext>
        </DndContext>
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
