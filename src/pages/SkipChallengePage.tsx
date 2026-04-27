import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChapters, type Exercise } from "@/hooks/useChapters";
import { useProgress } from "@/hooks/useProgress";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Heart, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QuizExercise from "@/components/exercises/QuizExercise";
import FillExercise from "@/components/exercises/FillExercise";
import OrderExercise from "@/components/exercises/OrderExercise";
import TrueFalseExercise from "@/components/exercises/TrueFalseExercise";
import MatchExercise from "@/components/exercises/MatchExercise";
import LoadingScreen from "@/components/states/LoadingScreen";
import React from "react";
import RichContent from "@/components/RichContent";

const CHALLENGE_LIVES = 3;
const TOTAL_QUESTIONS = 20;
const COOLDOWN_MS = 30 * 60 * 1000;
const COOLDOWN_KEY_PREFIX = "pyro-skip-cooldown:";

class ExerciseErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { console.error("Exercise render error:", error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-bold mb-2">Eroare la afișare</p>
          <p className="text-sm text-muted-foreground">Exercițiul nu a putut fi încărcat.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SkipChallengePage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { progress, loseLife, unlockLessonViaSkip } = useProgress();
  const { data: chapters, isLoading } = useChapters();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [challengeLives, setChallengeLives] = useState(CHALLENGE_LIVES);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [lastExplanation, setLastExplanation] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"success" | "failed" | "no-lives" | null>(null);

  // Compute pool of previous exercises + lessons-to-unlock list
  const { questions, lessonsToUnlock, targetLesson, chapterId } = useMemo(() => {
    if (!chapters || !lessonId) return { questions: [] as Exercise[], lessonsToUnlock: [] as string[], targetLesson: null as any, chapterId: null as string | null };
    const allLessons = chapters.flatMap((c) => c.lessons.map((l) => ({ ...l, chapterId: c.id, chapterNumber: c.number })));
    const ordered = allLessons.sort((a, b) => a.chapterNumber - b.chapterNumber);
    const targetIdx = ordered.findIndex((l) => l.id === lessonId);
    if (targetIdx < 0) return { questions: [], lessonsToUnlock: [], targetLesson: null, chapterId: null };
    const target = ordered[targetIdx];
    const previous = ordered.slice(0, targetIdx);
    const pool = previous.flatMap((l) => l.exercises).filter((ex) => ex.type !== "card" && ex.type !== "problem");
    let selected: Exercise[];
    if (pool.length >= TOTAL_QUESTIONS) {
      selected = shuffle(pool).slice(0, TOTAL_QUESTIONS);
    } else if (pool.length > 0) {
      selected = [];
      while (selected.length < TOTAL_QUESTIONS) {
        selected = selected.concat(shuffle(pool));
      }
      selected = selected.slice(0, TOTAL_QUESTIONS);
    } else {
      selected = [];
    }

    // Lessons to unlock = all lessons from first incomplete up to and including target
    const toUnlock: string[] = [];
    for (let i = 0; i <= targetIdx; i++) {
      const l = ordered[i];
      if (!progress.completedLessons[l.id]?.completed) toUnlock.push(l.id);
    }
    return { questions: selected, lessonsToUnlock: toUnlock, targetLesson: target, chapterId: target.chapterId };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters, lessonId]);

  const finishSuccess = useCallback(() => {
    if (lessonsToUnlock.length > 0) unlockLessonViaSkip(lessonsToUnlock);
    setOutcome("success");
  }, [lessonsToUnlock, unlockLessonViaSkip]);

  const finishFailed = useCallback(() => {
    try {
      localStorage.setItem(`${COOLDOWN_KEY_PREFIX}${lessonId}`, String(Date.now() + COOLDOWN_MS));
    } catch {}
    setOutcome("failed");
  }, [lessonId]);

  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      const exercise = questions[currentIndex];
      if (isCorrect) {
        setFeedback("correct");
        setLastExplanation(exercise?.explanation || null);
      } else {
        setChallengeLives((l) => l - 1);
        loseLife();
        setFeedback("wrong");
        setLastExplanation(exercise?.explanation || null);
      }
    },
    [currentIndex, questions, loseLife]
  );

  const handleContinue = useCallback(() => {
    const wasCorrect = feedback === "correct";
    setFeedback(null);
    setLastExplanation(null);

    // Check fail conditions
    if (!wasCorrect) {
      if (challengeLives <= 0) {
        finishFailed();
        return;
      }
      if (progress.lives <= 0 && !progress.isPremium) {
        setOutcome("no-lives");
        return;
      }
    }

    if (currentIndex + 1 >= questions.length) {
      finishSuccess();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [feedback, challengeLives, currentIndex, questions.length, finishFailed, finishSuccess, progress.lives, progress.isPremium]);

  useEffect(() => {
    // If user lands here without enough pool, fail gracefully
    if (!isLoading && chapters && questions.length === 0 && lessonsToUnlock.length === 0) {
      // No lessons to unlock — already accessible, redirect
      if (chapterId) navigate(`/chapter/${chapterId}`, { replace: true });
    }
  }, [isLoading, chapters, questions.length, lessonsToUnlock.length, chapterId, navigate]);

  if (isLoading || !chapters) return <LoadingScreen />;
  if (!targetLesson) return <div className="p-8 text-center text-foreground">Lecție negăsită</div>;

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-6 safe-top safe-bottom">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Nu sunt destule întrebări</h2>
          <p className="text-sm text-muted-foreground mb-6">Nu există încă suficiente exerciții anterioare pentru a forma o provocare.</p>
          <Button className="w-full" onClick={() => navigate(`/chapter/${chapterId}`)}>Înapoi la capitol</Button>
        </div>
      </div>
    );
  }

  if (outcome === "success") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-6 safe-top safe-bottom">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm rounded-xl border border-yellow-500/40 bg-card p-6 text-center">
          <div className="text-5xl mb-4">⚡</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Lecție deblocată!</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Ai trecut provocarea. Acum poți accesa <span className="font-bold text-foreground">{targetLesson.title}</span> și lecțiile intermediare.
          </p>
          <div className="flex flex-col gap-2">
            <Button className="w-full bg-yellow-500 text-black hover:bg-yellow-600" onClick={() => navigate(`/lesson/${targetLesson.id}`)}>
              Mergi la lecție
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate(`/chapter/${chapterId}`)}>
              Înapoi la capitol
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (outcome === "failed") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-6 safe-top safe-bottom">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm rounded-xl border border-destructive/40 bg-card p-6 text-center">
          <div className="text-5xl mb-4">💔</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Provocare eșuată</h2>
          <p className="text-sm text-muted-foreground mb-6">Ai pierdut cele 3 vieți speciale. Mai poți încerca peste 30 de minute.</p>
          <Button className="w-full" onClick={() => navigate(`/chapter/${chapterId}`)}>Înapoi la capitol</Button>
        </motion.div>
      </div>
    );
  }

  if (outcome === "no-lives") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-6 safe-top safe-bottom">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm rounded-xl border border-destructive/40 bg-card p-6 text-center">
          <div className="text-5xl mb-4">💔</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Ai rămas fără vieți reale!</h2>
          <p className="text-sm text-muted-foreground mb-6">Așteaptă să se regenereze sau treci la Premium pentru vieți nelimitate.</p>
          <Button className="w-full" onClick={() => navigate(`/chapter/${chapterId}`)}>Înapoi la capitol</Button>
        </motion.div>
      </div>
    );
  }

  const exercise = questions[currentIndex];
  const progressPercent = (currentIndex / questions.length) * 100;
  const isSupported = ["quiz", "fill", "order", "truefalse", "match"].includes(exercise.type);

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <header className="border-b border-yellow-500/30 bg-background/80 backdrop-blur-md px-4 py-3 pt-[var(--sat)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/chapter/${chapterId}`)} className="touch-target flex items-center justify-center">
            <X className="h-6 w-6 text-muted-foreground" />
          </button>
          <Progress value={progressPercent} className="h-2.5 flex-1" />
          <div className="flex items-center gap-1 text-yellow-500">
            <Zap className="h-4 w-4" />
            {Array.from({ length: CHALLENGE_LIVES }).map((_, i) => (
              <Heart key={i} className={`h-4 w-4 ${i < challengeLives ? "fill-current" : "opacity-30"}`} />
            ))}
          </div>
          <div className="flex items-center gap-1 text-destructive">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart key={i} className={`h-3.5 w-3.5 ${i < progress.lives ? "fill-current" : "opacity-30"}`} />
            ))}
          </div>
        </div>
        <p className="text-center text-xs font-mono text-yellow-500/80 mt-2 uppercase tracking-wider">
          ⚡ Provocare Skip · {currentIndex + 1}/{questions.length}
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={`${currentIndex}-${exercise.id}`} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <ExerciseErrorBoundary>
                {exercise.type === "quiz" && <QuizExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />}
                {exercise.type === "fill" && <FillExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />}
                {exercise.type === "order" && <OrderExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />}
                {exercise.type === "truefalse" && <TrueFalseExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />}
                {exercise.type === "match" && <MatchExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />}
                {!isSupported && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
                    <p className="mb-2 font-bold text-destructive">Tip de exercițiu nesuportat</p>
                    <Button onClick={() => handleAnswer(true)} className="mt-3">Sari peste</Button>
                  </div>
                )}
              </ExerciseErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {feedback && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className={`border-t px-4 py-4 pb-[var(--sab)] ${
              feedback === "correct" ? "bg-primary/10 border-primary/30" : "bg-destructive/10 border-destructive/30"
            }`}>
            <div className="max-w-lg mx-auto">
              <p className={`font-bold text-center mb-1 ${feedback === "correct" ? "text-primary" : "text-destructive"}`}>
                {feedback === "correct" ? "✅ Corect!" : "❌ Greșit!"}
              </p>
              {lastExplanation && (
                <div className="text-sm text-foreground/70 text-center mb-3 flex justify-center">
                  <span className="mr-1">💡</span>
                  <RichContent inline className="prose-p:inline">{lastExplanation}</RichContent>
                </div>
              )}
              <Button onClick={handleContinue} className="w-full h-14 text-lg font-bold" variant={feedback === "correct" ? "default" : "destructive"}>
                Continuă
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SkipChallengePage;
