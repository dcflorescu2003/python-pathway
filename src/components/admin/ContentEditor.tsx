import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useChapters, Chapter, Lesson, Exercise } from "@/hooks/useChapters";
import { useQueryClient } from "@tanstack/react-query";
import ExerciseEditor from "./ExerciseEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, Edit2, Trash2, Plus, Eye, Save, X, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Sortable wrappers ---
function SortableChapter({ chapter, children }: { chapter: Chapter; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chapter.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, position: "relative" as const, zIndex: isDragging ? 50 : "auto" as any };
  return (
    <div ref={setNodeRef} style={style}>
      <div className="absolute left-0 top-0 bottom-0 flex items-center pl-1 cursor-grab active:cursor-grabbing z-10" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5 text-muted-foreground/50" />
      </div>
      <div className="pl-7">{children}</div>
    </div>
  );
}

function SortableLesson({ lesson, children }: { lesson: Lesson; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, position: "relative" as const, zIndex: isDragging ? 50 : "auto" as any };
  return (
    <div ref={setNodeRef} style={style}>
      <div className="absolute left-0 top-0 bottom-0 flex items-center pl-1 cursor-grab active:cursor-grabbing z-10" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

function SortableExercise({ exercise, children }: { exercise: Exercise; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: exercise.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, position: "relative" as const, zIndex: isDragging ? 50 : "auto" as any };
  return (
    <div ref={setNodeRef} style={style}>
      <div className="absolute left-0 top-0 bottom-0 flex items-center pl-1 cursor-grab active:cursor-grabbing z-10" {...attributes} {...listeners}>
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
      </div>
      <div className="pl-5">{children}</div>
    </div>
  );
}

const ContentEditor = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: chapters, isLoading } = useChapters();

  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<{ lessonId: string; exercise?: Exercise } | null>(null);
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [chapterForm, setChapterForm] = useState({ title: "", description: "", icon: "📘", color: "200 100% 50%" });
  const [newLessonChapter, setNewLessonChapter] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: "", description: "", xpReward: 20, isPremium: false });
  const [creatingChapter, setCreatingChapter] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["chapters"] });

  const typeLabels: Record<string, string> = { quiz: "Quiz", fill: "Completare", order: "Ordonare", truefalse: "A/F" };

  // --- Chapter reorder ---
  const handleChapterReorder = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !realChapters) return;
    const oldIndex = realChapters.findIndex(c => c.id === active.id);
    const newIndex = realChapters.findIndex(c => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(realChapters, oldIndex, newIndex);
    const updates = reordered.map((ch, i) => supabase.from("chapters").update({ number: i + 1 }).eq("id", ch.id));
    await Promise.all(updates);
    toast.success("Ordine capitole actualizată!");
    invalidate();
  };

  // --- Lesson reorder ---
  const handleLessonReorder = async (chapterId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const chapter = chapters?.find(c => c.id === chapterId);
    if (!chapter) return;
    const realLessons = chapter.lessons.filter(l => !l.id.endsWith("f"));
    const oldIndex = realLessons.findIndex(l => l.id === active.id);
    const newIndex = realLessons.findIndex(l => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(realLessons, oldIndex, newIndex);
    const updates = reordered.map((l, i) => supabase.from("lessons").update({ sort_order: i } as any).eq("id", l.id));
    await Promise.all(updates);
    toast.success("Ordine lecții actualizată!");
    invalidate();
  };

  const handleExerciseReorder = async (lessonId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const lesson = chapters?.flatMap(c => c.lessons).find(l => l.id === lessonId);
    if (!lesson) return;
    const oldIndex = lesson.exercises.findIndex(e => e.id === active.id);
    const newIndex = lesson.exercises.findIndex(e => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(lesson.exercises, oldIndex, newIndex);
    const updates = reordered.map((e, i) => supabase.from("exercises").update({ sort_order: i } as any).eq("id", e.id));
    await Promise.all(updates);
    toast.success("Ordine exerciții actualizată!");
    invalidate();
  };

  // --- Chapter CRUD ---
  const startEditChapter = (ch: Chapter) => {
    setEditingChapter(ch.id);
    setChapterForm({ title: ch.title, description: ch.description, icon: ch.icon, color: ch.color });
  };

  const saveChapter = async (id: string) => {
    const { error } = await supabase.from("chapters").update({
      title: chapterForm.title, description: chapterForm.description, icon: chapterForm.icon, color: chapterForm.color,
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Capitol salvat!");
    setEditingChapter(null);
    invalidate();
  };

  const createChapter = async () => {
    if (!chapterForm.title.trim()) return;
    const maxNumber = realChapters ? Math.max(0, ...realChapters.map(c => c.number)) : 0;
    const newId = `ch-${Date.now()}`;
    const { error } = await supabase.from("chapters").insert({
      id: newId,
      number: maxNumber + 1,
      title: chapterForm.title.trim(),
      description: chapterForm.description.trim(),
      icon: chapterForm.icon || "📘",
      color: chapterForm.color || "200 100% 50%",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Capitol creat!");
    setCreatingChapter(false);
    setChapterForm({ title: "", description: "", icon: "📘", color: "200 100% 50%" });
    invalidate();
  };

  const deleteChapter = async (chapterId: string) => {
    // Cascade: delete exercises → lessons → chapter
    const chapter = chapters?.find(c => c.id === chapterId);
    if (chapter) {
      const lessonIds = chapter.lessons.filter(l => !l.id.endsWith("f")).map(l => l.id);
      if (lessonIds.length > 0) {
        await supabase.from("exercises").delete().in("lesson_id", lessonIds);
        await supabase.from("lessons").delete().eq("chapter_id", chapterId);
      }
    }
    const { error } = await supabase.from("chapters").delete().eq("id", chapterId);
    if (error) { toast.error(error.message); return; }
    toast.success("Capitol șters!");
    invalidate();
  };

  // --- Lesson CRUD ---
  const startEditLesson = (l: Lesson) => {
    setEditingLesson(l.id);
    setLessonForm({ title: l.title, description: l.description, xpReward: l.xpReward, isPremium: l.isPremium || false });
  };

  const saveLesson = async (id: string) => {
    const { error } = await supabase.from("lessons").update({
      title: lessonForm.title, description: lessonForm.description, xp_reward: lessonForm.xpReward, is_premium: lessonForm.isPremium,
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Lecție salvată!");
    setEditingLesson(null);
    invalidate();
  };

  const createLesson = async (chapterId: string) => {
    if (!lessonForm.title.trim()) return;
    const chapter = chapters?.find(c => c.id === chapterId);
    const sortOrder = chapter ? chapter.lessons.length : 0;
    const newId = `${chapterId}-l${Date.now()}`;
    const { error } = await supabase.from("lessons").insert({
      id: newId, chapter_id: chapterId, title: lessonForm.title.trim(), description: lessonForm.description.trim(),
      xp_reward: lessonForm.xpReward, is_premium: lessonForm.isPremium, sort_order: sortOrder,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Lecție creată!");
    setNewLessonChapter(null);
    setLessonForm({ title: "", description: "", xpReward: 20, isPremium: false });
    invalidate();
  };

  const deleteLesson = async (_chapterId: string, lessonId: string) => {
    const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
    if (error) { toast.error(error.message); return; }
    toast.success("Lecție ștearsă!");
    invalidate();
  };

  // --- Exercise CRUD ---
  const handleSaveExercise = async (exercise: Exercise) => {
    if (!editingExercise) return;
    const lessonId = editingExercise.lessonId;
    const isNew = !editingExercise.exercise;
    const lesson = chapters?.flatMap(c => c.lessons).find(l => l.id === lessonId);
    const sortOrder = lesson ? lesson.exercises.length : 0;
    const row = {
      id: exercise.id, lesson_id: lessonId, type: exercise.type, question: exercise.question,
      options: exercise.options ? JSON.parse(JSON.stringify(exercise.options)) : null,
      correct_option_id: exercise.correctOptionId || null, code_template: exercise.codeTemplate || null,
      blanks: exercise.blanks ? JSON.parse(JSON.stringify(exercise.blanks)) : null,
      lines: exercise.lines ? JSON.parse(JSON.stringify(exercise.lines)) : null,
      statement: exercise.statement || null, is_true: exercise.isTrue ?? null,
      explanation: exercise.explanation || null, xp: exercise.xp, sort_order: isNew ? sortOrder : undefined,
    };
    if (isNew) {
      const { error } = await supabase.from("exercises").insert(row as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Exercițiu creat!");
    } else {
      const { sort_order, ...updateRow } = row;
      const { error } = await supabase.from("exercises").update(updateRow as any).eq("id", exercise.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Exercițiu salvat!");
    }
    setEditingExercise(null);
    invalidate();
  };

  const deleteExercise = async (exerciseId: string) => {
    const { error } = await supabase.from("exercises").delete().eq("id", exerciseId);
    if (error) { toast.error(error.message); return; }
    toast.success("Exercițiu șters!");
    invalidate();
  };

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Se încarcă...</p>;
  if (!chapters) return <p className="text-sm text-destructive p-4">Eroare la încărcare.</p>;

  const realChapters = chapters.map(ch => ({
    ...ch,
    lessons: ch.lessons.filter(l => !l.id.endsWith("f")),
  }));

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChapterReorder}>
        <SortableContext items={realChapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {realChapters.map(chapter => {
            const isExpanded = expandedChapter === chapter.id;
            const isEditing = editingChapter === chapter.id;

            return (
              <SortableChapter key={chapter.id} chapter={chapter}>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <button onClick={() => setExpandedChapter(isExpanded ? null : chapter.id)} className="flex items-center gap-3 flex-1 text-left">
                      <span className="text-xl">{chapter.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-foreground text-sm truncate">Cap. {chapter.number}: {chapter.title}</h2>
                        <p className="text-xs text-muted-foreground">{chapter.lessons.length} lecții</p>
                      </div>
                      {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    <Button variant="ghost" size="icon" onClick={() => isEditing ? setEditingChapter(null) : startEditChapter(chapter)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Șterge capitolul</AlertDialogTitle>
                          <AlertDialogDescription>Sigur vrei să ștergi "{chapter.title}"? Toate lecțiile și exercițiile asociate vor fi șterse.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anulează</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteChapter(chapter.id)}>Șterge</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {isEditing && (
                    <div className="border-t border-border p-4 space-y-3 bg-secondary/20">
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label className="text-foreground text-xs">Titlu</Label><Input value={chapterForm.title} onChange={e => setChapterForm(f => ({ ...f, title: e.target.value }))} /></div>
                        <div><Label className="text-foreground text-xs">Icon</Label><Input value={chapterForm.icon} onChange={e => setChapterForm(f => ({ ...f, icon: e.target.value }))} /></div>
                      </div>
                      <div><Label className="text-foreground text-xs">Descriere</Label><Textarea value={chapterForm.description} onChange={e => setChapterForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveChapter(chapter.id)}><Save className="h-4 w-4 mr-1" />Salvează</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingChapter(null)}><X className="h-4 w-4 mr-1" />Anulează</Button>
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border">
                        <div className="p-3 space-y-2">
                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleLessonReorder(chapter.id, e)}>
                            <SortableContext items={chapter.lessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
                              {chapter.lessons.map(lesson => {
                                const isLessonExpanded = expandedLesson === lesson.id;
                                const isLessonEditing = editingLesson === lesson.id;

                                return (
                                  <SortableLesson key={lesson.id} lesson={lesson}>
                                    <div className="rounded-lg border border-border bg-secondary/30">
                                      <div className="flex items-center gap-2 p-3">
                                        <button onClick={() => setExpandedLesson(isLessonExpanded ? null : lesson.id)} className="flex items-center gap-2 flex-1 text-left">
                                          {isLessonExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                          <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-foreground text-sm truncate">{lesson.title}</p>
                                            <p className="text-[10px] text-muted-foreground">{lesson.exercises.length} exerciții · {lesson.xpReward} XP{lesson.isPremium ? " · 💎" : ""}</p>
                                          </div>
                                        </button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => isLessonEditing ? setEditingLesson(null) : startEditLesson(lesson)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/lesson/${lesson.id}`)}><Eye className="h-3.5 w-3.5" /></Button>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Șterge lecția</AlertDialogTitle><AlertDialogDescription>Sigur vrei să ștergi "{lesson.title}"?</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Anulează</AlertDialogCancel><AlertDialogAction onClick={() => deleteLesson(chapter.id, lesson.id)}>Șterge</AlertDialogAction></AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>

                                      {isLessonEditing && (
                                        <div className="border-t border-border p-3 space-y-2 bg-primary/5">
                                          <Input value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))} placeholder="Titlu" />
                                          <Input value={lessonForm.description} onChange={e => setLessonForm(f => ({ ...f, description: e.target.value }))} placeholder="Descriere" />
                                          <div className="flex gap-2 items-center">
                                            <Input type="number" value={lessonForm.xpReward} onChange={e => setLessonForm(f => ({ ...f, xpReward: parseInt(e.target.value) || 0 }))} className="w-24" />
                                            <span className="text-xs text-muted-foreground">XP</span>
                                            <label className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                                              <input type="checkbox" checked={lessonForm.isPremium} onChange={e => setLessonForm(f => ({ ...f, isPremium: e.target.checked }))} />
                                              Premium
                                            </label>
                                          </div>
                                          <div className="flex gap-2">
                                            <Button size="sm" onClick={() => saveLesson(lesson.id)}><Save className="h-4 w-4 mr-1" />Salvează</Button>
                                            <Button size="sm" variant="outline" onClick={() => setEditingLesson(null)}>Anulează</Button>
                                          </div>
                                        </div>
                                      )}

                                      <AnimatePresence>
                                        {isLessonExpanded && (
                                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border">
                                            <div className="p-3 space-y-2">
                                              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleExerciseReorder(lesson.id, e)}>
                                                <SortableContext items={lesson.exercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
                                                  {lesson.exercises.map((ex, i) => (
                                                    <SortableExercise key={ex.id} exercise={ex}>
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

                          {newLessonChapter === chapter.id ? (
                            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                              <Input value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))} placeholder="Titlu lecție nouă..." />
                              <Input value={lessonForm.description} onChange={e => setLessonForm(f => ({ ...f, description: e.target.value }))} placeholder="Descriere scurtă..." />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => createLesson(chapter.id)} className="flex-1">Creează</Button>
                                <Button size="sm" variant="outline" onClick={() => setNewLessonChapter(null)} className="flex-1">Anulează</Button>
                              </div>
                            </div>
                          ) : (
                            <Button variant="outline" size="sm" className="w-full" onClick={() => { setNewLessonChapter(chapter.id); setLessonForm({ title: "", description: "", xpReward: 20, isPremium: false }); }}>
                              <Plus className="h-4 w-4 mr-1" /> Adaugă lecție
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </SortableChapter>
            );
          })}
        </SortableContext>
      </DndContext>

      {/* Create new chapter */}
      {creatingChapter ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <h3 className="font-bold text-foreground text-sm">Capitol nou</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-foreground text-xs">Titlu</Label><Input value={chapterForm.title} onChange={e => setChapterForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Funcții" /></div>
            <div><Label className="text-foreground text-xs">Icon (emoji)</Label><Input value={chapterForm.icon} onChange={e => setChapterForm(f => ({ ...f, icon: e.target.value }))} placeholder="📘" /></div>
          </div>
          <div><Label className="text-foreground text-xs">Descriere</Label><Textarea value={chapterForm.description} onChange={e => setChapterForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Descriere scurtă a capitolului..." /></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={createChapter} className="flex-1"><Plus className="h-4 w-4 mr-1" />Creează capitol</Button>
            <Button size="sm" variant="outline" onClick={() => { setCreatingChapter(false); setChapterForm({ title: "", description: "", icon: "📘", color: "200 100% 50%" }); }} className="flex-1"><X className="h-4 w-4 mr-1" />Anulează</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => { setCreatingChapter(true); setChapterForm({ title: "", description: "", icon: "📘", color: "200 100% 50%" }); }}>
          <Plus className="h-4 w-4 mr-1" /> Adaugă capitol
        </Button>
      )}
    </div>
  );
};

export default ContentEditor;
