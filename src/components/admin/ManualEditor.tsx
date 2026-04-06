import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useManualLessons, type ManualLesson } from "@/hooks/useManualLessons";
import { useQueryClient } from "@tanstack/react-query";
import ExerciseEditor from "./ExerciseEditor";
import { Exercise } from "@/hooks/useChapters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, Edit2, Trash2, Plus, Save, X, GripVertical, Link2 } from "lucide-react";
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

function SortableLesson({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, position: "relative" as const, zIndex: isDragging ? 50 : ("auto" as any) };
  return (
    <div ref={setNodeRef} style={style}>
      <div className="absolute left-0 top-0 bottom-0 flex items-center pl-1 cursor-grab active:cursor-grabbing z-10" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5 text-muted-foreground/50" />
      </div>
      <div className="pl-7">{children}</div>
    </div>
  );
}

function SortableExercise({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, position: "relative" as const, zIndex: isDragging ? 50 : ("auto" as any) };
  return (
    <div ref={setNodeRef} style={style}>
      <div className="absolute left-0 top-0 bottom-0 flex items-center pl-1 cursor-grab active:cursor-grabbing z-10" {...attributes} {...listeners}>
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
      </div>
      <div className="pl-5">{children}</div>
    </div>
  );
}

const ManualEditor = () => {
  const queryClient = useQueryClient();
  const { data: lessons, isLoading } = useManualLessons();

  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<{ lessonId: string; exercise?: Exercise } | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: "", description: "" });
  const [creatingLesson, setCreatingLesson] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["manual-lessons"] });

  const typeLabels: Record<string, string> = { quiz: "Quiz", fill: "Completare", order: "Ordonare", truefalse: "A/F", match: "Asociere", card: "📖 Cartonaș" };

  // Lesson reorder
  const handleLessonReorder = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !lessons) return;
    const oldIdx = lessons.findIndex(l => l.id === active.id);
    const newIdx = lessons.findIndex(l => l.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(lessons, oldIdx, newIdx);
    await Promise.all(reordered.map((l, i) => supabase.from("manual_lessons").update({ sort_order: i } as any).eq("id", l.id)));
    toast.success("Ordine lecții actualizată!");
    invalidate();
  };

  // Exercise reorder
  const handleExerciseReorder = async (lessonId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const lesson = lessons?.find(l => l.id === lessonId);
    if (!lesson) return;
    const oldIdx = lesson.exercises.findIndex(e => e.id === active.id);
    const newIdx = lesson.exercises.findIndex(e => e.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(lesson.exercises, oldIdx, newIdx);
    await Promise.all(reordered.map((e, i) => supabase.from("manual_exercises").update({ sort_order: i } as any).eq("id", e.id)));
    toast.success("Ordine exerciții actualizată!");
    invalidate();
  };

  // Lesson CRUD
  const createLesson = async () => {
    if (!lessonForm.title.trim()) return;
    const maxSort = lessons?.length ? Math.max(...lessons.map(l => l.sortOrder)) : -1;
    const newId = `ml-${Date.now()}`;
    const { error } = await supabase.from("manual_lessons").insert({
      id: newId, title: lessonForm.title.trim(), description: lessonForm.description.trim(), sort_order: maxSort + 1,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Lecție manuală creată!");
    setCreatingLesson(false);
    setLessonForm({ title: "", description: "" });
    invalidate();
  };

  const startEditLesson = (l: ManualLesson) => {
    setEditingLesson(l.id);
    setLessonForm({ title: l.title, description: l.description });
  };

  const saveLesson = async (id: string) => {
    const { error } = await supabase.from("manual_lessons").update({
      title: lessonForm.title, description: lessonForm.description,
    } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Lecție salvată!");
    setEditingLesson(null);
    invalidate();
  };

  const deleteLesson = async (id: string) => {
    const { error } = await supabase.from("manual_lessons").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Lecție ștearsă!");
    invalidate();
  };

  // Exercise CRUD
  const handleSaveExercise = async (exercise: Exercise) => {
    if (!editingExercise) return;
    const lessonId = editingExercise.lessonId;
    const isNew = !editingExercise.exercise;
    const lesson = lessons?.find(l => l.id === lessonId);
    const sortOrder = lesson ? lesson.exercises.length : 0;
    const row = {
      id: exercise.id, lesson_id: lessonId, type: exercise.type, question: exercise.question,
      options: exercise.options ? JSON.parse(JSON.stringify(exercise.options)) : null,
      correct_option_id: exercise.correctOptionId || null, code_template: exercise.codeTemplate || null,
      blanks: exercise.blanks ? JSON.parse(JSON.stringify(exercise.blanks)) : null,
      lines: exercise.lines ? JSON.parse(JSON.stringify(exercise.lines)) : null,
      statement: exercise.statement || null, is_true: exercise.isTrue ?? null,
      explanation: exercise.explanation || null, xp: exercise.xp, sort_order: isNew ? sortOrder : undefined,
      pairs: exercise.pairs ? JSON.parse(JSON.stringify(exercise.pairs)) : null,
    };
    if (isNew) {
      const { error } = await supabase.from("manual_exercises").insert(row as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Exercițiu creat!");
    } else {
      const { sort_order, ...updateRow } = row;
      const { error } = await supabase.from("manual_exercises").update(updateRow as any).eq("id", exercise.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Exercițiu salvat!");
    }
    setEditingExercise(null);
    invalidate();
  };

  const deleteExercise = async (id: string) => {
    const { error } = await supabase.from("manual_exercises").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Exercițiu șters!");
    invalidate();
  };

  const copyLink = (lessonId: string) => {
    const url = `${window.location.origin}/manual/${lessonId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiat!");
  };

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Se încarcă...</p>;

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLessonReorder}>
        <SortableContext items={(lessons || []).map(l => l.id)} strategy={verticalListSortingStrategy}>
          {(lessons || []).map(lesson => {
            const isExpanded = expandedLesson === lesson.id;
            const isEditing = editingLesson === lesson.id;

            return (
              <SortableLesson key={lesson.id} id={lesson.id}>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 p-4">
                    <button onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)} className="flex items-center gap-2 flex-1 text-left">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm truncate">{lesson.title}</p>
                        <p className="text-[10px] text-muted-foreground">{lesson.exercises.length} exerciții</p>
                      </div>
                    </button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyLink(lesson.id)} title="Copiază link public">
                      <Link2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => isEditing ? setEditingLesson(null) : startEditLesson(lesson)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Șterge lecția</AlertDialogTitle><AlertDialogDescription>Sigur vrei să ștergi "{lesson.title}"? Toate exercițiile asociate vor fi șterse.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Anulează</AlertDialogCancel><AlertDialogAction onClick={() => deleteLesson(lesson.id)}>Șterge</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {isEditing && (
                    <div className="border-t border-border p-4 space-y-3 bg-secondary/20">
                      <div><Label className="text-foreground text-xs">Titlu</Label><Input value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))} /></div>
                      <div><Label className="text-foreground text-xs">Descriere</Label><Input value={lessonForm.description} onChange={e => setLessonForm(f => ({ ...f, description: e.target.value }))} /></div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveLesson(lesson.id)}><Save className="h-4 w-4 mr-1" />Salvează</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingLesson(null)}><X className="h-4 w-4 mr-1" />Anulează</Button>
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border">
                        <div className="p-3 space-y-2">
                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleExerciseReorder(lesson.id, e)}>
                            <SortableContext items={lesson.exercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
                              {lesson.exercises.map((ex, i) => (
                                <SortableExercise key={ex.id} id={ex.id}>
                                  <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm">
                                    <span className="text-[10px] font-mono text-muted-foreground w-5">#{i + 1}</span>
                                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary shrink-0">{typeLabels[ex.type]}</span>
                                    <p className="flex-1 text-foreground text-xs truncate">{ex.question}</p>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingExercise({ lessonId: lesson.id, exercise: ex })}><Edit2 className="h-3.5 w-3.5" /></Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Șterge exercițiul</AlertDialogTitle><AlertDialogDescription>Sigur vrei să ștergi acest exercițiu?</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Anulează</AlertDialogCancel><AlertDialogAction onClick={() => deleteExercise(ex.id)}>Șterge</AlertDialogAction></AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </SortableExercise>
                              ))}
                            </SortableContext>
                          </DndContext>

                          {editingExercise?.lessonId === lesson.id ? (
                            <ExerciseEditor exercise={editingExercise.exercise} onSave={handleSaveExercise} onCancel={() => setEditingExercise(null)} lessonId={lesson.id} nextIndex={lesson.exercises.length + 1} />
                          ) : (
                            <Button variant="outline" size="sm" className="w-full" onClick={() => setEditingExercise({ lessonId: lesson.id })}><Plus className="h-4 w-4 mr-1" /> Adaugă exercițiu</Button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </SortableLesson>
            );
          })}
        </SortableContext>
      </DndContext>

      {creatingLesson ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <h3 className="font-bold text-foreground text-sm">Lecție manuală nouă</h3>
          <div><Label className="text-foreground text-xs">Titlu</Label><Input value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Introducere în Python" /></div>
          <div><Label className="text-foreground text-xs">Descriere</Label><Input value={lessonForm.description} onChange={e => setLessonForm(f => ({ ...f, description: e.target.value }))} placeholder="Scurtă descriere..." /></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={createLesson} className="flex-1"><Plus className="h-4 w-4 mr-1" />Creează</Button>
            <Button size="sm" variant="outline" onClick={() => { setCreatingLesson(false); setLessonForm({ title: "", description: "" }); }} className="flex-1"><X className="h-4 w-4 mr-1" />Anulează</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => { setCreatingLesson(true); setLessonForm({ title: "", description: "" }); }}>
          <Plus className="h-4 w-4 mr-1" /> Adaugă lecție manuală
        </Button>
      )}
    </div>
  );
};

export default ManualEditor;
