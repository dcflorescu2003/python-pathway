import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useExerciseStore } from "@/hooks/useExerciseStore";
import { Exercise, Lesson } from "@/data/courses";
import ExerciseEditor from "@/components/admin/ExerciseEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Edit2, Trash2, Plus, RotateCcw, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ADMIN_EMAILS = ["dcflorescu2003@gmail.com"];

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const store = useExerciseStore();
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<{ lessonId: string; exercise?: Exercise } | null>(null);
  const [newLessonChapter, setNewLessonChapter] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDesc, setNewLessonDesc] = useState("");

  const typeLabels: Record<string, string> = {
    quiz: "Quiz",
    fill: "Completare",
    order: "Ordonare",
    truefalse: "A/F",
  };

  const handleSaveExercise = (exercise: Exercise) => {
    if (!editingExercise) return;
    const lesson = store.chapters
      .flatMap(c => c.lessons)
      .find(l => l.id === editingExercise.lessonId);
    const exists = lesson?.exercises.some(e => e.id === exercise.id);
    if (exists) {
      store.updateExercise(editingExercise.lessonId, exercise);
    } else {
      store.addExercise(editingExercise.lessonId, exercise);
    }
    setEditingExercise(null);
  };

  const handleAddLesson = (chapterId: string) => {
    if (!newLessonTitle.trim()) return;
    const chapter = store.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    const newId = `${chapterId.replace("ch", "c")}-l${chapter.lessons.length + 1}`;
    const lesson: Lesson = {
      id: newId,
      title: newLessonTitle.trim(),
      description: newLessonDesc.trim(),
      exercises: [],
      xpReward: 20,
    };
    store.addLesson(chapterId, lesson);
    setNewLessonChapter(null);
    setNewLessonTitle("");
    setNewLessonDesc("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-xl">⚙️</span>
          <h1 className="text-lg font-bold text-foreground flex-1">Editor</h1>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="touch-target">
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Resetare date</AlertDialogTitle>
                <AlertDialogDescription>
                  Această acțiune va reseta toate întrebările la valorile implicite. Nu poate fi anulată.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anulează</AlertDialogCancel>
                <AlertDialogAction onClick={store.resetToDefaults}>Resetează</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <main className="px-4 py-4 space-y-3">
        {store.chapters.map(chapter => {
          const isExpanded = expandedChapter === chapter.id;
          return (
            <div key={chapter.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setExpandedChapter(isExpanded ? null : chapter.id)}
                className="w-full flex items-center gap-3 p-4 active:bg-secondary/50 transition-colors text-left touch-target"
              >
                <span className="text-xl">{chapter.icon}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-foreground text-sm truncate">Cap. {chapter.number}: {chapter.title}</h2>
                  <p className="text-xs text-muted-foreground">{chapter.lessons.length} lecții</p>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border"
                  >
                    <div className="p-3 space-y-2">
                      {chapter.lessons.map(lesson => {
                        const isLessonExpanded = expandedLesson === lesson.id;
                        return (
                          <div key={lesson.id} className="rounded-lg border border-border bg-secondary/30">
                            <button
                              onClick={() => setExpandedLesson(isLessonExpanded ? null : lesson.id)}
                              className="w-full flex items-center gap-2 p-3 active:bg-secondary/50 transition-colors text-left touch-target"
                            >
                              {isLessonExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground text-sm truncate">{lesson.title}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {lesson.exercises.length} exerciții · {lesson.xpReward} XP
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 shrink-0"
                                onClick={(e) => { e.stopPropagation(); navigate(`/lesson/${lesson.id}`); }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-destructive shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Șterge lecția</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Sigur vrei să ștergi "{lesson.title}"? Toate exercițiile vor fi pierdute.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Anulează</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => store.deleteLesson(chapter.id, lesson.id)}>
                                      Șterge
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </button>

                            <AnimatePresence>
                              {isLessonExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-border"
                                >
                                  <div className="p-3 space-y-2">
                                    {lesson.exercises.map((ex, i) => (
                                      <div
                                        key={ex.id}
                                        className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm"
                                      >
                                        <span className="text-[10px] font-mono text-muted-foreground w-5">
                                          #{i + 1}
                                        </span>
                                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary shrink-0">
                                          {typeLabels[ex.type]}
                                        </span>
                                        <p className="flex-1 text-foreground text-xs truncate">{ex.question}</p>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-10 w-10 shrink-0"
                                          onClick={() => setEditingExercise({ lessonId: lesson.id, exercise: ex })}
                                        >
                                          <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive shrink-0">
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Șterge exercițiul</AlertDialogTitle>
                                              <AlertDialogDescription>Sigur vrei să ștergi acest exercițiu?</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Anulează</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => store.deleteExercise(lesson.id, ex.id)}>
                                                Șterge
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    ))}

                                    {editingExercise?.lessonId === lesson.id ? (
                                      <ExerciseEditor
                                        exercise={editingExercise.exercise}
                                        onSave={handleSaveExercise}
                                        onCancel={() => setEditingExercise(null)}
                                        lessonId={lesson.id}
                                        nextIndex={lesson.exercises.length + 1}
                                      />
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full touch-target"
                                        onClick={() => setEditingExercise({ lessonId: lesson.id })}
                                      >
                                        <Plus className="h-4 w-4 mr-1" /> Adaugă exercițiu
                                      </Button>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}

                      {newLessonChapter === chapter.id ? (
                        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                          <Input
                            value={newLessonTitle}
                            onChange={(e) => setNewLessonTitle(e.target.value)}
                            placeholder="Titlu lecție nouă..."
                            className="touch-target"
                          />
                          <Input
                            value={newLessonDesc}
                            onChange={(e) => setNewLessonDesc(e.target.value)}
                            placeholder="Descriere scurtă..."
                            className="touch-target"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleAddLesson(chapter.id)} className="flex-1 touch-target">
                              Creează
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setNewLessonChapter(null)} className="flex-1 touch-target">
                              Anulează
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full touch-target"
                          onClick={() => setNewLessonChapter(chapter.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Adaugă lecție
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default AdminPage;
