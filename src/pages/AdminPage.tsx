import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExerciseStore } from "@/hooks/useExerciseStore";
import { Exercise, Lesson } from "@/data/courses";
import ExerciseEditor from "@/components/admin/ExerciseEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronDown, ChevronRight, Edit2, Trash2, Plus, RotateCcw, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AdminPage = () => {
  const navigate = useNavigate();
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
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground flex-1">⚙️ Editor Întrebări</h1>
          <Button variant="outline" size="sm" onClick={store.resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4 space-y-4">
        {store.chapters.map(chapter => {
          const isExpanded = expandedChapter === chapter.id;
          return (
            <div key={chapter.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setExpandedChapter(isExpanded ? null : chapter.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left"
              >
                <span className="text-2xl">{chapter.icon}</span>
                <div className="flex-1">
                  <h2 className="font-bold text-foreground">Cap. {chapter.number}: {chapter.title}</h2>
                  <p className="text-sm text-muted-foreground">{chapter.lessons.length} lecții</p>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
                    <div className="p-4 space-y-3">
                      {chapter.lessons.map(lesson => {
                        const isLessonExpanded = expandedLesson === lesson.id;
                        return (
                          <div key={lesson.id} className="rounded-lg border border-border bg-secondary/30">
                            <button
                              onClick={() => setExpandedLesson(isLessonExpanded ? null : lesson.id)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
                            >
                              {isLessonExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div className="flex-1">
                                <p className="font-semibold text-foreground text-sm">{lesson.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {lesson.exercises.length} exerciții · {lesson.xpReward} XP
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/lesson/${lesson.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Ștergi lecția?")) store.deleteLesson(chapter.id, lesson.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                                        className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm"
                                      >
                                        <span className="text-xs font-mono text-muted-foreground w-6">
                                          #{i + 1}
                                        </span>
                                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                                          {typeLabels[ex.type]}
                                        </span>
                                        <p className="flex-1 text-foreground truncate">{ex.question}</p>
                                        <span className="text-xs text-muted-foreground">{ex.xp} XP</span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => setEditingExercise({ lessonId: lesson.id, exercise: ex })}
                                        >
                                          <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive"
                                          onClick={() => {
                                            if (confirm("Ștergi exercițiul?")) store.deleteExercise(lesson.id, ex.id);
                                          }}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
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
                                        className="w-full"
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
                          />
                          <Input
                            value={newLessonDesc}
                            onChange={(e) => setNewLessonDesc(e.target.value)}
                            placeholder="Descriere scurtă..."
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleAddLesson(chapter.id)} className="flex-1">
                              Creează
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setNewLessonChapter(null)} className="flex-1">
                              Anulează
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
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
