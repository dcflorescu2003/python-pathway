import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEvalChapters, useEvalLessons, useEvalExercises, useEvalBankMutations, EvalExercise, EvalChapter } from "@/hooks/useEvalBank";
import { exportEvalLessonToPdf } from "@/lib/testPdfExport";
import CsvImporter from "./CsvImporter";
import CsvLessonImporter from "./CsvLessonImporter";
import EvalProblemsCsvImporter from "./EvalProblemsCsvImporter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "./RichTextEditor";
import CodeBlockEditor from "./CodeBlockEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, Edit2, Trash2, Plus, Save, X, GripVertical, FileDown, Loader2, Play, Code2 } from "lucide-react";
import { usePyodide, type TestResult } from "@/hooks/usePyodide";
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
import { CompetencyTagger } from "./CompetencyTagger";

const typeLabels: Record<string, string> = { quiz: "Quiz", fill: "Completare", order: "Ordonare", truefalse: "A/F", problem: "Problemă", open_answer: "Răspuns deschis" };

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
  const [exportingLessonId, setExportingLessonId] = useState<string | null>(null);


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
            invalidateAll={invalidateAll}
            exportingLessonId={exportingLessonId}
            setExportingLessonId={setExportingLessonId}
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
function ChapterBlock({ chapter, isExpanded, onToggle, isEditing, onStartEdit, onCancelEdit, editForm, setEditForm, onSaveEdit, onDelete, expandedLesson, setExpandedLesson, creatingLesson, setCreatingLesson, lessonForm, setLessonForm, editingLesson, setEditingLesson, editingExercise, setEditingExercise, mutations, sensors, invalidateAll, exportingLessonId, setExportingLessonId }: any) {
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
                chapterTitle={chapter.title}
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
                invalidateAll={invalidateAll}
                exportingLessonId={exportingLessonId}
                setExportingLessonId={setExportingLessonId}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// --- Lessons List ---
function LessonsList({ chapterId, chapterTitle, expandedLesson, setExpandedLesson, creatingLesson, setCreatingLesson, lessonForm, setLessonForm, editingLesson, setEditingLesson, editingExercise, setEditingExercise, mutations, sensors, invalidateAll, exportingLessonId, setExportingLessonId }: any) {
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
    invalidateAll();
  };

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLessonReorder}>
        <SortableContext items={lessons.map((l: any) => l.id)} strategy={verticalListSortingStrategy}>
          {lessons.map((lesson: any) => (
            <SortableItem key={lesson.id} id={lesson.id} gripSize="h-4 w-4">
              <LessonBlock
                lesson={lesson}
                chapterTitle={chapterTitle}
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
                invalidateAll={invalidateAll}
                exportingLessonId={exportingLessonId}
                setExportingLessonId={setExportingLessonId}
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => { setCreatingLesson(chapterId); setLessonForm({ title: "" }); }}>
            <Plus className="h-3 w-3 mr-1" />Lecție nouă
          </Button>
          <CsvLessonImporter mode="eval" chapterId={chapterId} existingLessonCount={lessons.length} onSuccess={invalidateAll} />
        </div>
      )}
    </>
  );
}


// --- Lesson Block ---
function LessonBlock({ lesson, chapterTitle, isExpanded, onToggle, isEditing, onStartEdit, onCancelEdit, editForm, setEditForm, onSaveEdit, onDelete, editingExercise, setEditingExercise, mutations, sensors, invalidateAll, exportingLessonId, setExportingLessonId }: any) {
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
                lesson={lesson}
                chapterTitle={chapterTitle}
                editingExercise={editingExercise}
                setEditingExercise={setEditingExercise}
                mutations={mutations}
                sensors={sensors}
                invalidateAll={invalidateAll}
                exportingLessonId={exportingLessonId}
                setExportingLessonId={setExportingLessonId}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// --- Exercises List ---
function ExercisesList({ lesson, chapterTitle, editingExercise, setEditingExercise, mutations, sensors, invalidateAll, exportingLessonId, setExportingLessonId }: any) {
  const lessonId = lesson.id;
  const { data: exercises = [] } = useEvalExercises(lessonId);
  const isExporting = exportingLessonId === lessonId;
  const [openSolutions, setOpenSolutions] = useState<Set<string>>(new Set());

  // Recitim exercițiul direct din baza de date la editare, ca formularul să
  // pornească mereu cu soluția și cazurile de test reale (nu dintr-un cache).
  const startEditExercise = async (ex: any) => {
    try {
      const { data, error } = await supabase.rpc("get_eval_exercises_for_teacher", { p_ids: [ex.id] });
      if (error) throw error;
      const fresh = (data as any[] | null)?.[0];
      setEditingExercise({ lessonId, exercise: fresh ?? ex });
      if (!fresh) toast.warning("Nu am putut reciti exercițiul; se folosesc datele din listă.");
    } catch (e: any) {
      console.error("Reload eval exercise error:", e);
      toast.warning("Nu am putut reciti exercițiul; se folosesc datele din listă.");
      setEditingExercise({ lessonId, exercise: ex });
    }
  };


  const handleExerciseReorder = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = exercises.findIndex((e: any) => e.id === active.id);
    const newIndex = exercises.findIndex((e: any) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(exercises, oldIndex, newIndex);
    await Promise.all(reordered.map((e: any, i: number) => supabase.from("eval_exercises").update({ sort_order: i } as any).eq("id", e.id)));
    toast.success("Ordine exerciții actualizată!");
    invalidateAll();
  };

  const handleExportPdf = async () => {
    if (exercises.length === 0) return;
    setExportingLessonId(lessonId);
    try {
      await exportEvalLessonToPdf(lesson, chapterTitle || null, exercises);
      toast.success("PDF generat!");
    } catch (e: any) {
      console.error("Export PDF lecție error:", e);
      toast.error(e?.message || "Eroare la generarea PDF-ului.");
    } finally {
      setExportingLessonId(null);
    }
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
              <div className="rounded border border-border/50 bg-background/50 text-xs">
                <div className="flex items-center gap-2 p-2">
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{typeLabels[ex.type] || ex.type}</span>
                  <span className="flex-1 truncate text-foreground">{ex.question}</span>
                  {ex.type === "problem" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      title="Vezi soluția propusă"
                      onClick={() => setOpenSolutions(prev => {
                        const n = new Set(prev);
                        n.has(ex.id) ? n.delete(ex.id) : n.add(ex.id);
                        return n;
                      })}
                    >
                      <Code2 className="h-3 w-3" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEditExercise(ex)}>
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
                {ex.type === "problem" && openSolutions.has(ex.id) && (
                  <div className="border-t border-border/50 p-2 space-y-1 bg-muted/20">
                    <p className="text-[10px] font-bold text-muted-foreground">
                      Soluție propusă · {Array.isArray(ex.test_cases) ? ex.test_cases.length : 0} cazuri de test
                    </p>
                    <pre className="whitespace-pre-wrap font-mono text-[11px] text-foreground">
                      {ex.solution?.trim() ? ex.solution : "(fără soluție salvată)"}
                    </pre>
                  </div>
                )}
              </div>
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>

      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => setEditingExercise({ lessonId })}>
          <Plus className="h-3 w-3 mr-1" />Exercițiu nou
        </Button>
        <CsvImporter targetTable="eval_exercises" lessonId={lessonId} existingCount={exercises.length} existingExercises={exercises} onSuccess={invalidateAll} />
        <EvalProblemsCsvImporter lessonId={lessonId} existingCount={exercises.length} onSuccess={invalidateAll} />
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1"
          onClick={handleExportPdf}
          disabled={isExporting || exercises.length === 0}
          title={exercises.length === 0 ? "Lecția nu are exerciții" : "Export PDF cu răspunsuri corecte"}
        >
          {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
          PDF
        </Button>
      </div>
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
  const [lines, setLines] = useState(exercise?.lines || [{ id: "l1", text: "", order: 1, group: undefined as number | undefined }]);
  const [statement, setStatement] = useState(exercise?.statement || "");
  const [isTrue, setIsTrue] = useState(exercise?.is_true ?? true);
  const [explanation, setExplanation] = useState(exercise?.explanation || "");
  const [codeTemplate, setCodeTemplate] = useState(exercise?.code_template || "");
  const [solution, setSolution] = useState(exercise?.solution || "");
  const [testCases, setTestCases] = useState<{ input: string; expected_output: string; hidden: boolean; inputFiles?: Record<string, string>; expectedFiles?: Record<string, string> }[]>(
    exercise?.test_cases && Array.isArray(exercise.test_cases) && exercise.test_cases.length > 0
      ? exercise.test_cases
      : [{ input: "", expected_output: "", hidden: false }]
  );
  const { loading: pyLoading, running: pyRunning, runCode } = usePyodide();
  const [runResults, setRunResults] = useState<TestResult[] | null>(null);

  const updateTestFiles = (index: number, bucket: "inputFiles" | "expectedFiles", files: Record<string, string>) => {
    const n = [...testCases];
    n[index] = { ...n[index], [bucket]: files };
    setTestCases(n);
  };

  const handleRunSolution = async () => {
    if (!solution.trim()) {
      toast.error("Scrie o soluție înainte de a rula testele.");
      return;
    }
    try {
      const results = await runCode(
        solution,
        testCases.map(tc => {
          const expectedFiles = tc.expectedFiles && Object.keys(tc.expectedFiles).length > 0 ? tc.expectedFiles : undefined;
          const expectedOut = (tc.expected_output || "").replace(/\r\n/g, "\n");
          return {
            input: (tc.input || "").replace(/\r\n/g, "\n"),
            // Dacă nu există stdout așteptat dar există fișiere așteptate,
            // validăm doar pe fișiere.
            expectedOutput: !expectedOut.trim() && expectedFiles ? undefined : expectedOut,
            inputFiles: tc.inputFiles && Object.keys(tc.inputFiles).length > 0 ? tc.inputFiles : undefined,
            expectedFiles,
            hidden: tc.hidden,
          };
        })
      );
      setRunResults(results);
      const passed = results.filter(r => r.passed).length;
      if (passed === results.length) toast.success(`Toate testele trec (${passed}/${results.length})`);
      else toast.error(`${passed}/${results.length} teste trecute`);
    } catch (e: any) {
      toast.error(e?.message || "Eroare la rularea codului");
    }
  };

  // Pre-generăm un ID stabil pentru exercițiile noi, ca să putem atașa
  // microcompetențe înainte de prima salvare. La Anulare facem cleanup.
  const [stableId] = useState(
    () => exercise?.id || `eval-e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  );
  const isNew = !exercise;

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === "quiz") { setOptions([{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" }]); setCorrectOptionId("a"); }
    if (newType === "fill") { setBlanks([{ id: "b1", answer: "" }]); setCodeTemplate(""); }
    if (newType === "order") { setLines([{ id: "l1", text: "", order: 1, group: undefined }]); }
    if (newType === "truefalse") { setStatement(""); setIsTrue(true); }
    if (newType === "problem") { setCodeTemplate(""); setSolution(""); setTestCases([{ input: "", expected_output: "", hidden: false }]); }
  };

  const handleCancel = async () => {
    // Dacă e exercițiu nou și am atașat deja microcompetențe pe stableId,
    // le ștergem ca să nu rămână mapări orfane.
    if (isNew) {
      try {
        await supabase
          .from("item_competencies")
          .delete()
          .eq("item_type", "eval_exercise")
          .eq("item_id", stableId);
      } catch {
        // ignore – cleanup best-effort
      }
    }
    onCancel();
  };

  const handleSave = () => {
    if (type === "open_answer" && !question.trim()) { toast.error("Completează întrebarea."); return; }
    if (!question.trim() && type !== "truefalse" && type !== "open_answer") { toast.error("Completează întrebarea."); return; }
    if (type === "truefalse" && !statement.trim()) { toast.error("Completează afirmația."); return; }
    if (type === "problem" && !solution.trim()) { toast.error("Completează soluția."); return; }
    // Schimbarea tipului dintr-o problemă în alt tip ar șterge soluția și testele.
    if (exercise?.type === "problem" && type !== "problem") {
      const ok = window.confirm(
        "Ai schimbat tipul din „Problemă” în alt tip. Soluția propusă și cazurile de test vor fi șterse. Continui?"
      );
      if (!ok) return;
    }
    onSave({
      id: stableId, type, question: type === "truefalse" ? statement : question,
      options: type === "quiz" ? options : null,
      correct_option_id: type === "quiz" ? correctOptionId : null,
      blanks: type === "fill" ? blanks : null,
      lines: type === "order" ? lines : null,
      statement: type === "truefalse" ? statement : null,
      is_true: type === "truefalse" ? isTrue : null,
      explanation: explanation || null,
      code_template: (type === "fill" || type === "problem" || type === "quiz" || type === "truefalse" || type === "card" || type === "open_answer") ? (codeTemplate || null) : null,
      solution: type === "problem" ? solution : null,
      test_cases: type === "problem"
        ? testCases.map(tc => {
            const normFiles = (files?: Record<string, string>) => {
              if (!files) return undefined;
              const entries = Object.entries(files).filter(([name]) => name.trim());
              if (entries.length === 0) return undefined;
              return Object.fromEntries(entries.map(([name, content]) => [name, (content || "").replace(/\r\n/g, "\n")]));
            };
            const out: any = {
              input: (tc.input || "").replace(/\r\n/g, "\n"),
              expected_output: (tc.expected_output || "").replace(/\r\n/g, "\n"),
              hidden: !!tc.hidden,
            };
            const inF = normFiles(tc.inputFiles);
            const outF = normFiles(tc.expectedFiles);
            if (inF) out.inputFiles = inF;
            if (outF) out.expectedFiles = outF;
            return out;
          })
        : null,

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
              <SelectItem value="problem">💻 Problemă</SelectItem>
              <SelectItem value="open_answer">💬 Răspuns deschis</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {type !== "truefalse" && (
        <div><Label className="text-xs text-foreground">Întrebare</Label><RichTextEditor value={question} onChange={setQuestion} rows={3} /></div>
      )}

      {(type === "quiz" || type === "truefalse" || type === "card" || type === "open_answer") && (
        <div>
          <Label className="text-xs text-foreground">Cod (opțional, apare deasupra opțiunilor)</Label>
          <CodeBlockEditor value={codeTemplate} onChange={setCodeTemplate} rows={4} placeholder={'x = 2 + 3 * 4\nprint(x)'} />
        </div>
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
          <div>
            <Label className="text-xs text-foreground">Șablon cod (folosește ___ pentru spații goale)</Label>
            <CodeBlockEditor value={codeTemplate} onChange={setCodeTemplate} rows={4} placeholder={'x = ___\nprint(___)'} />
          </div>
          <Label className="text-xs text-foreground">Răspunsuri (variante separate prin virgulă)</Label>
          {blanks.map((b: any, i: number) => (
            <div key={b.id} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">#{i + 1}</span>
              <Input value={b.answer} onChange={e => { const n = [...blanks]; n[i] = { ...n[i], answer: e.target.value }; setBlanks(n); }} placeholder="răspuns1, răspuns2" />
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
              <Input value={l.text} onChange={e => { const n = [...lines]; n[i] = { ...n[i], text: e.target.value }; setLines(n); }} className="font-mono text-sm flex-1" />
              <Input
                type="number"
                value={l.group ?? ""}
                onChange={e => { const n = [...lines]; n[i] = { ...n[i], group: e.target.value ? Number(e.target.value) : undefined }; setLines(n); }}
                className="w-16 text-xs"
                placeholder="Grup"
                title="Linii cu același grup sunt interschimbabile"
              />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLines(lines.filter((_: any, j: number) => j !== i).map((l: any, j: number) => ({ ...l, order: j + 1 })))}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setLines([...lines, { id: `l${lines.length + 1}`, text: "", order: lines.length + 1, group: undefined }])}><Plus className="h-3 w-3 mr-1" />Linie</Button>
        </div>
      )}

      {type === "truefalse" && (
        <div className="space-y-2">
          <div><Label className="text-xs text-foreground">Afirmație</Label><RichTextEditor value={statement} onChange={setStatement} rows={3} /></div>
          <div>
            <Label className="text-xs text-foreground">Răspuns corect</Label>
            <Select value={isTrue ? "true" : "false"} onValueChange={v => setIsTrue(v === "true")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="true">Adevărat</SelectItem><SelectItem value="false">Fals</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      )}

      {type === "problem" && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-foreground">Cod inițial (opțional)</Label>
            <CodeBlockEditor value={codeTemplate} onChange={setCodeTemplate} rows={3} placeholder="def rezolva(n):" />
          </div>
          <div>
            <Label className="text-xs text-foreground">Soluție propusă (rulabilă)</Label>
            <Textarea value={solution} onChange={e => setSolution(e.target.value)} rows={4} className="font-mono text-sm" placeholder="def rezolva(n):&#10;    return n * 2" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-foreground">Cazuri de test</Label>
            <p className="text-[10px] text-muted-foreground">Poți scrie mai multe valori pe rânduri separate, atât la intrare cât și la ieșire.</p>
            {testCases.map((tc, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-start">
                <Textarea rows={2} value={tc.input} onChange={e => { const n = [...testCases]; n[i] = { ...n[i], input: e.target.value }; setTestCases(n); }} placeholder={"Intrare (stdin)\n5\n1 2 3"} className="font-mono text-xs min-h-0" />
                <Textarea rows={2} value={tc.expected_output} onChange={e => { const n = [...testCases]; n[i] = { ...n[i], expected_output: e.target.value }; setTestCases(n); }} placeholder={"Ieșire așteptată\n6"} className="font-mono text-xs min-h-0" />
                <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer mt-2">
                  <input type="checkbox" checked={tc.hidden} onChange={e => { const n = [...testCases]; n[i] = { ...n[i], hidden: e.target.checked }; setTestCases(n); }} />
                  Ascuns
                </label>
                <Button variant="ghost" size="icon" className="h-7 w-7 mt-1" onClick={() => setTestCases(testCases.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setTestCases([...testCases, { input: "", expected_output: "", hidden: false }])}><Plus className="h-3 w-3 mr-1" />Caz de test</Button>
          </div>

          <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleRunSolution} disabled={pyLoading || pyRunning}>
                {(pyLoading || pyRunning) ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                {pyLoading ? "Se încarcă Python..." : pyRunning ? "Se rulează..." : "Rulează soluția"}
              </Button>
              {runResults && (
                <span className={`text-xs font-bold ${runResults.every(r => r.passed) ? "text-emerald-500" : "text-destructive"}`}>
                  {runResults.filter(r => r.passed).length}/{runResults.length} teste trecute
                </span>
              )}
            </div>
            {runResults && (
              <div className="space-y-2">
                {runResults.map((r, i) => (
                  <div key={i} className={`rounded border p-2 text-[11px] font-mono whitespace-pre-wrap ${r.passed ? "border-emerald-500/40 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5"}`}>
                    <div className="font-sans font-bold mb-1">Test #{i + 1} — {r.passed ? "trecut" : "picat"}{r.hidden ? " (ascuns)" : ""}</div>
                    <div className="text-muted-foreground">Intrare: {r.input || "(gol)"}</div>
                    <div className="text-muted-foreground">Așteptat: {r.expectedOutput || "(gol)"}</div>
                    <div className={r.passed ? "text-muted-foreground" : "text-destructive"}>Obținut: {r.actualOutput || "(gol)"}</div>
                    {r.error && <div className="text-destructive">Eroare: {r.error}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {type !== "problem" && (
        <div><Label className="text-xs text-foreground">Explicație (opțional)</Label><RichTextEditor value={explanation} onChange={setExplanation} rows={3} /></div>
      )}

      <div className="rounded-md border border-border bg-muted/30 p-3">
        <CompetencyTagger
          itemType="eval_exercise"
          itemId={stableId}
        />
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" />Salvează</Button>
        <Button size="sm" variant="outline" onClick={handleCancel}><X className="h-4 w-4 mr-1" />Anulează</Button>
      </div>
    </div>
  );
}

export default EvalBankEditor;
