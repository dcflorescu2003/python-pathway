import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEvalChapters, useEvalLessons, useEvalExercises, useEvalBankMutations, EvalExercise, EvalChapter } from "@/hooks/useEvalBank";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, Edit2, Trash2, Plus, Save, X, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const typeLabels: Record<string, string> = { quiz: "Quiz", fill: "Completare", order: "Ordonare", truefalse: "A/F" };

// --- Sortable wrappers ---
function SortableItem({ id, children, gripSize = "h-4 w-4" }: { id: string; children: React.ReactNode; gripSize?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, position: "relative" as const, zIndex: isDragging ? 50 : "auto" as any };
  return (
    <div ref={setNodeRef} style={style}>
      <div className="absolute left-0 top-0 bottom-0 flex items-center pl-1 cursor-grab active:cursor-grabbing z-10" {...attributes} {...listeners}>
        <GripVertical className={`${gripSize} text-muted-foreground/50`} />
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

const EvalBankEditor = () => {
  const { data: chapters = [], isLoading } = useEvalChapters();
  const mutations = useEvalBankMutations();
  const queryClient = useQueryClient();

  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [creatingChapter, setCreatingChapter] = useState(false);
  const [chapterForm, setChapterForm] = useState({ title: "", icon: "📝" });
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [creatingLesson, setCreatingLesson] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: "" });
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<{ lessonId: string; exercise?: EvalExercise } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["eval-chapters"] });
    queryClient.invalidateQueries({ queryKey: ["eval-lessons"] });
    queryClient.invalidateQueries({ queryKey: ["eval-exercises"] });
    queryClient.invalidateQueries({ queryKey: ["eval-exercises-all"] });
  };

  const handleChapterReorder = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = chapters.findIndex(c => c.id === active.id);
    const newIndex = chapters.findIndex(c => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(chapters, oldIndex, newIndex);
    await Promise.all(reordered.map((ch, i) => supabase.from("eval_chapters").update({ sort_order: i } as any).eq("id", ch.id)));
    toast.success("Ordine capitole actualizată!");
    invalidateAll();
  };

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Se încarcă...</p>;

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChapterReorder}>
        <SortableContext items={chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {chapters.map(chapter => (
            <SortableItem key={chapter.id} id={chapter.id} gripSize="h-5 w-5">
              <ChapterBlock
                chapter={chapter}
                isExpanded={expandedChapter === chapter.id}
                onToggle={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}
                isEditing={editingChapter === chapter.id}
                onStartEdit={() => { setEditingChapter(chapter.id); setChapterForm({ title: chapter.title, icon: chapter.icon }); }}
                onCancelEdit={() => setEditingChapter(null)}
                editForm={chapterForm}
                setEditForm={setChapterForm}
                onSaveEdit={async () => {
                  await mutations.updateChapter.mutateAsync({ id: chapter.id, title: chapterForm.title, icon: chapterForm.icon });
                  toast.success("Capitol salvat!"); setEditingChapter(null);
                }}
                onDelete={async () => { await mutations.deleteChapter.mutateAsync(chapter.id); toast.success("Capitol șters!"); }}
                expandedLesson={expandedLesson}
                setExpandedLesson={setExpandedLesson}
                creatingLesson={creatingLesson}
                setCreatingLesson={setCreatingLesson}
                lessonForm={lessonForm}
                setLessonForm={setLessonForm}
                editingLesson={editingLesson}
                setEditingLesson={setEditingLesson}
                editingExercise={editingExercise}
                setEditingExercise={setEditingExercise}
                mutations={mutations}
                sensors={sensors}
              />
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>

      {creatingChapter ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-foreground">Titlu</Label><Input value={chapterForm.title} onChange={e => setChapterForm(f => ({ ...f, title: e.target.value }))} placeholder="Numele capitolului" /></div>
            <div><Label className="text-xs text-foreground">Icon</Label><Input value={chapterForm.icon} onChange={e => setChapterForm(f => ({ ...f, icon: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={async () => {
              if (!chapterForm.title.trim()) return;
              const newId = `eval-ch-${Date.now()}`;
              await mutations.createChapter.mutateAsync({ id: newId, title: chapterForm.title.trim(), icon: chapterForm.icon || "📝", sort_order: chapters.length });
              toast.success("Capitol creat!"); setCreatingChapter(false); setChapterForm({ title: "", icon: "📝" });
            }}><Save className="h-4 w-4 mr-1" />Salvează</Button>
            <Button size="sm" variant="outline" onClick={() => { setCreatingChapter(false); setChapterForm({ title: "", icon: "📝" }); }}><X className="h-4 w-4 mr-1" />Anulează</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setCreatingChapter(true)}>
          <Plus className="h-4 w-4 mr-2" />Capitol nou
        </Button>
      )}
    </div>
  );
};

// --- Chapter Block ---
function ChapterBlock({ chapter, isExpanded, onToggle, isEditing, onStartEdit, onCancelEdit, editForm, setEditForm, onSaveEdit, onDelete, expandedLesson, setExpandedLesson, creatingLesson, setCreatingLesson, lessonForm, setLessonForm, editingLesson, setEditingLesson, editingExercise, setEditingExercise, mutations, sensors }: any) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <button onClick={onToggle} className="flex items-center gap-3 flex-1 text-left">
          <span className="text-xl">{chapter.icon}</span>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-foreground text-sm truncate">{chapter.title}</h2>
          </div>
          {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
        </button>
        <Button variant="ghost" size="icon" onClick={onStartEdit}><Edit2 className="h-4 w-4" /></Button>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Șterge capitolul</AlertDialogTitle><AlertDialogDescription>Se vor șterge toate lecțiile și exercițiile asociate.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Anulează</AlertDialogCancel><AlertDialogAction onClick={onDelete}>Șterge</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {isEditing && (
        <div className="border-t border-border p-4 space-y-3 bg-secondary/20">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-foreground">Titlu</Label><Input value={editForm.title} onChange={e => setEditForm((f: any) => ({ ...f, title: e.target.value }))} /></div>
            <div><Label className="text-xs text-foreground">Icon</Label><Input value={editForm.icon} onChange={e => setEditForm((f: any) => ({ ...f, icon: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={onSaveEdit}><Save className="h-4 w-4 mr-1" />Salvează</Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit}><X className="h-4 w-4 mr-1" />Anulează</Button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border">
            <div className="p-3 space-y-2">
              <LessonsList
                chapterId={chapter.id}
                expandedLesson={expandedLesson}
                setExpandedLesson={setExpandedLesson}
                creatingLesson={creatingLesson}
                setCreatingLesson={setCreatingLesson}
                lessonForm={lessonForm}
                setLessonForm={setLessonForm}
                editingLesson={editingLesson}
                setEditingLesson={setEditingLesson}
                editingExercise={editingExercise}
                setEditingExercise={setEditingExercise}
                mutations={mutations}
                sensors={sensors}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Lessons List ---
function LessonsList({ chapterId, expandedLesson, setExpandedLesson, creatingLesson, setCreatingLesson, lessonForm, setLessonForm, editingLesson, setEditingLesson, editingExercise, setEditingExercise, mutations, sensors }: any) {
  const { data: lessons = [] } = useEvalLessons(chapterId);

  const handleLessonReorder = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = lessons.findIndex((l: any) => l.id === active.id);
    const newIndex = lessons.findIndex((l: any) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(lessons, oldIndex, newIndex);
    await Promise.all(reordered.map((l: any, i: number) => supabase.from("eval_lessons").update({ sort_order: i } as any).eq("id", l.id)));
    toast.success("Ordine lecții actualizată!");
    mutations.updateLesson.mutateAsync({ id: reordered[0].id, sort_order: 0 });
  };

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLessonReorder}>
        <SortableContext items={lessons.map((l: any) => l.id)} strategy={verticalListSortingStrategy}>
          {lessons.map((lesson: any) => (
            <SortableItem key={lesson.id} id={lesson.id} gripSize="h-4 w-4">
              <LessonBlock
                lesson={lesson}
                isExpanded={expandedLesson === lesson.id}
                onToggle={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                isEditing={editingLesson === lesson.id}
                onStartEdit={() => { setEditingLesson(lesson.id); setLessonForm({ title: lesson.title }); }}
                onCancelEdit={() => setEditingLesson(null)}
                editForm={lessonForm}
                setEditForm={setLessonForm}
                onSaveEdit={async () => {
                  await mutations.updateLesson.mutateAsync({ id: lesson.id, title: lessonForm.title });
                  toast.success("Lecție salvată!"); setEditingLesson(null);
                }}
                onDelete={async () => { await mutations.deleteLesson.mutateAsync(lesson.id); toast.success("Lecție ștearsă!"); }}
                editingExercise={editingExercise}
                setEditingExercise={setEditingExercise}
                mutations={mutations}
                sensors={sensors}
              />
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>

      {creatingLesson === chapterId ? (
        <div className="rounded-lg border border-border p-3 space-y-2 bg-secondary/20">
          <Input value={lessonForm.title} onChange={e => setLessonForm({ title: e.target.value })} placeholder="Titlul lecției" />
          <div className="flex gap-2">
            <Button size="sm" onClick={async () => {
              if (!lessonForm.title.trim()) return;
              const newId = `eval-l-${Date.now()}`;
              await mutations.createLesson.mutateAsync({ id: newId, chapter_id: chapterId, title: lessonForm.title.trim(), sort_order: lessons.length });
              toast.success("Lecție creată!"); setCreatingLesson(null); setLessonForm({ title: "" });
            }}><Save className="h-4 w-4 mr-1" />Salvează</Button>
            <Button size="sm" variant="outline" onClick={() => { setCreatingLesson(null); setLessonForm({ title: "" }); }}><X className="h-4 w-4 mr-1" />Anulează</Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setCreatingLesson(chapterId); setLessonForm({ title: "" }); }}>
          <Plus className="h-3 w-3 mr-1" />Lecție nouă
        </Button>
      )}
    </>
  );
}

// --- Lesson Block ---
function LessonBlock({ lesson, isExpanded, onToggle, isEditing, onStartEdit, onCancelEdit, editForm, setEditForm, onSaveEdit, onDelete, editingExercise, setEditingExercise, mutations, sensors }: any) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30">
      <div className="flex items-center gap-2 p-3">
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 text-left">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{lesson.title}</p>
          </div>
          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onStartEdit}><Edit2 className="h-3 w-3" /></Button>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Șterge lecția</AlertDialogTitle><AlertDialogDescription>Se vor șterge toate exercițiile asociate.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Anulează</AlertDialogCancel><AlertDialogAction onClick={onDelete}>Șterge</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {isEditing && (
        <div className="border-t border-border p-3 space-y-2 bg-secondary/10">
          <Input value={editForm.title} onChange={e => setEditForm({ title: e.target.value })} />
          <div className="flex gap-2">
            <Button size="sm" onClick={onSaveEdit}><Save className="h-3 w-3 mr-1" />Salvează</Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit}><X className="h-3 w-3 mr-1" />Anulează</Button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border">
            <div className="p-3 space-y-2">
              <ExercisesList
                lessonId={lesson.id}
                editingExercise={editingExercise}
                setEditingExercise={setEditingExercise}
                mutations={mutations}
                sensors={sensors}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Exercises List ---
function ExercisesList({ lessonId, editingExercise, setEditingExercise, mutations, sensors }: any) {
  const { data: exercises = [] } = useEvalExercises(lessonId);

  const handleExerciseReorder = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = exercises.findIndex((e: any) => e.id === active.id);
    const newIndex = exercises.findIndex((e: any) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(exercises, oldIndex, newIndex);
    await Promise.all(reordered.map((e: any, i: number) => supabase.from("eval_exercises").update({ sort_order: i } as any).eq("id", e.id)));
    toast.success("Ordine exerciții actualizată!");
    mutations.updateExercise.mutateAsync({ id: reordered[0].id, sort_order: 0 });
  };

  if (editingExercise?.lessonId === lessonId) {
    return (
      <EvalExerciseEditor
        exercise={editingExercise.exercise}
        lessonId={lessonId}
        nextIndex={exercises.length}
        onSave={async (ex: any) => {
          const isNew = !editingExercise.exercise;
          if (isNew) {
            await mutations.createExercise.mutateAsync({ ...ex, lesson_id: lessonId, sort_order: exercises.length });
          } else {
            const { sort_order, lesson_id, ...rest } = ex;
            await mutations.updateExercise.mutateAsync({ id: ex.id, ...rest });
          }
          toast.success(isNew ? "Exercițiu creat!" : "Exercițiu salvat!");
          setEditingExercise(null);
        }}
        onCancel={() => setEditingExercise(null)}
      />
    );
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleExerciseReorder}>
        <SortableContext items={exercises.map((e: any) => e.id)} strategy={verticalListSortingStrategy}>
          {exercises.map((ex: any) => (
            <SortableItem key={ex.id} id={ex.id} gripSize="h-3.5 w-3.5">
              <div className="flex items-center gap-2 p-2 rounded border border-border/50 bg-background/50 text-xs">
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{typeLabels[ex.type] || ex.type}</span>
                <span className="flex-1 truncate text-foreground">{ex.question}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingExercise({ lessonId, exercise: ex })}>
                  <Edit2 className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"><Trash2 className="h-3 w-3" /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Șterge exercițiul?</AlertDialogTitle></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Anulează</AlertDialogCancel><AlertDialogAction onClick={async () => { await mutations.deleteExercise.mutateAsync(ex.id); toast.success("Exercițiu șters!"); }}>Șterge</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
      <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setEditingExercise({ lessonId })}>
        <Plus className="h-3 w-3 mr-1" />Exercițiu nou
      </Button>
    </>
  );
}

// --- Eval Exercise Editor (simplified from ExerciseEditor) ---
function EvalExerciseEditor({ exercise, lessonId, nextIndex, onSave, onCancel }: { exercise?: EvalExercise; lessonId: string; nextIndex: number; onSave: (ex: any) => void; onCancel: () => void }) {
  const [type, setType] = useState(exercise?.type || "quiz");
  const [question, setQuestion] = useState(exercise?.question || "");
  const [options, setOptions] = useState(exercise?.options || [{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" }]);
  const [correctOptionId, setCorrectOptionId] = useState(exercise?.correct_option_id || "a");
  const [blanks, setBlanks] = useState(exercise?.blanks || [{ id: "b1", answer: "" }]);
  const [lines, setLines] = useState(exercise?.lines || [{ id: "l1", text: "", order: 1 }]);
  const [statement, setStatement] = useState(exercise?.statement || "");
  const [isTrue, setIsTrue] = useState(exercise?.is_true ?? true);
  const [explanation, setExplanation] = useState(exercise?.explanation || "");

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === "quiz") { setOptions([{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" }]); setCorrectOptionId("a"); }
    if (newType === "fill") { setBlanks([{ id: "b1", answer: "" }]); }
    if (newType === "order") { setLines([{ id: "l1", text: "", order: 1 }]); }
    if (newType === "truefalse") { setStatement(""); setIsTrue(true); }
  };

  const handleSave = () => {
    if (!question.trim() && type !== "truefalse") { toast.error("Completează întrebarea."); return; }
    if (type === "truefalse" && !statement.trim()) { toast.error("Completează afirmația."); return; }
    const id = exercise?.id || `eval-e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    onSave({
      id, type, question: type === "truefalse" ? statement : question,
      options: type === "quiz" ? options : null,
      correct_option_id: type === "quiz" ? correctOptionId : null,
      blanks: type === "fill" ? blanks : null,
      lines: type === "order" ? lines : null,
      statement: type === "truefalse" ? statement : null,
      is_true: type === "truefalse" ? isTrue : null,
      explanation: explanation || null,
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h4 className="text-sm font-bold text-foreground">{exercise ? "Editează exercițiu" : "Exercițiu nou"}</h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-foreground">Tip</Label>
          <Select value={type} onValueChange={handleTypeChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="quiz">Quiz</SelectItem>
              <SelectItem value="fill">Completare</SelectItem>
              <SelectItem value="order">Ordonare</SelectItem>
              <SelectItem value="truefalse">Adevărat/Fals</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {type !== "truefalse" && (
        <div><Label className="text-xs text-foreground">Întrebare</Label><Textarea value={question} onChange={e => setQuestion(e.target.value)} rows={2} /></div>
      )}

      {type === "quiz" && (
        <div className="space-y-2">
          <Label className="text-xs text-foreground">Opțiuni</Label>
          {options.map((opt: any, i: number) => (
            <div key={opt.id} className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground w-5">{opt.id.toUpperCase()}</span>
              <Input value={opt.text} onChange={e => { const n = [...options]; n[i] = { ...n[i], text: e.target.value }; setOptions(n); }} placeholder={`Opțiunea ${opt.id.toUpperCase()}`} />
            </div>
          ))}
          <div>
            <Label className="text-xs text-foreground">Răspuns corect</Label>
            <Select value={correctOptionId} onValueChange={setCorrectOptionId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{options.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.id.toUpperCase()}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      )}

      {type === "fill" && (
        <div className="space-y-2">
          <Label className="text-xs text-foreground">Răspunsuri blanks</Label>
          {blanks.map((b: any, i: number) => (
            <div key={b.id} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">#{i + 1}</span>
              <Input value={b.answer} onChange={e => { const n = [...blanks]; n[i] = { ...n[i], answer: e.target.value }; setBlanks(n); }} />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setBlanks(blanks.filter((_: any, j: number) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setBlanks([...blanks, { id: `b${blanks.length + 1}`, answer: "" }])}><Plus className="h-3 w-3 mr-1" />Blank</Button>
        </div>
      )}

      {type === "order" && (
        <div className="space-y-2">
          <Label className="text-xs text-foreground">Linii (ordinea corectă)</Label>
          {lines.map((l: any, i: number) => (
            <div key={l.id} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{i + 1}.</span>
              <Input value={l.text} onChange={e => { const n = [...lines]; n[i] = { ...n[i], text: e.target.value }; setLines(n); }} className="font-mono text-sm" />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLines(lines.filter((_: any, j: number) => j !== i).map((l: any, j: number) => ({ ...l, order: j + 1 })))}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setLines([...lines, { id: `l${lines.length + 1}`, text: "", order: lines.length + 1 }])}><Plus className="h-3 w-3 mr-1" />Linie</Button>
        </div>
      )}

      {type === "truefalse" && (
        <div className="space-y-2">
          <div><Label className="text-xs text-foreground">Afirmație</Label><Textarea value={statement} onChange={e => setStatement(e.target.value)} rows={2} /></div>
          <div>
            <Label className="text-xs text-foreground">Răspuns corect</Label>
            <Select value={isTrue ? "true" : "false"} onValueChange={v => setIsTrue(v === "true")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="true">Adevărat</SelectItem><SelectItem value="false">Fals</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div><Label className="text-xs text-foreground">Explicație (opțional)</Label><Textarea value={explanation} onChange={e => setExplanation(e.target.value)} rows={2} /></div>

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" />Salvează</Button>
        <Button size="sm" variant="outline" onClick={onCancel}><X className="h-4 w-4 mr-1" />Anulează</Button>
      </div>
    </div>
  );
}

export default EvalBankEditor;
