import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChapters, type Exercise } from "@/hooks/useChapters";
import { useProgress } from "@/hooks/useProgress";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Heart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QuizExercise from "@/components/exercises/QuizExercise";
import FillExercise from "@/components/exercises/FillExercise";
import OrderExercise from "@/components/exercises/OrderExercise";
import TrueFalseExercise from "@/components/exercises/TrueFalseExercise";
import MatchExercise from "@/components/exercises/MatchExercise";
import CardExercise from "@/components/exercises/CardExercise";
import ProblemExercise from "@/components/exercises/ProblemExercise";
import LoadingScreen from "@/components/states/LoadingScreen";
import StreakCelebrationDialog from "@/components/StreakCelebrationDialog";
import RichContent from "@/components/RichContent";
import WatchAdForLivesButton from "@/components/WatchAdForLivesButton";
import { useAuth } from "@/hooks/useAuth";
import { recordCompetencyScores, type CompetencyItemResult } from "@/lib/competencyTracking";

import React from "react";

class ExerciseErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
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

const LessonPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progress, completeLesson, loseLife, setLivesFromReward, recordActivity, markLessonStarted, streakJustIncreased, newStreakCount, dismissStreakCelebration } = useProgress();
  const activityRecordedRef = useRef(false);
  const lessonStartedRef = useRef(false);
  const competencyResultsRef = useRef<CompetencyItemResult[]>([]);
  const { data: chapters, isLoading } = useChapters();

  const lesson = chapters?.flatMap((c) => c.lessons).find((l) => l.id === lessonId);
  const chapter = chapters?.find((c) => c.lessons.some((l) => l.id === lessonId));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [localLives, setLocalLives] = useState(5);
  // Inimi afișate în lecție: pentru Premium folosim contor local (nu se sincronizează cu DB);
  // pentru non-Premium e minimul dintre contor local și inimile reale (DB).
  const lives = progress.isPremium ? localLives : Math.min(localLives, progress.lives);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [lastExplanation, setLastExplanation] = useState<string | null>(null);
  const wasFirstTime = !progress.completedLessons[lessonId || ""]?.completed;

  // Lecția nu poate începe sau continua dacă userul nu are inimi (excepție: Premium)
  const noLives = !progress.isPremium && progress.lives <= 0;
  const lessonStarted = currentIndex > 0 || feedback !== null || correctCount > 0;

  const restartLesson = useCallback(() => {
    setCurrentIndex(0);
    setCorrectCount(0);
    setLocalLives(5);
    setFeedback(null);
    setLastExplanation(null);
    setIsFinished(false);
    activityRecordedRef.current = false;
    lessonStartedRef.current = false;
    competencyResultsRef.current = [];
  }, []);

  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      const exercise = lesson?.exercises[currentIndex];
      if (exercise?.type === "card") {
        setFeedback(null);
        setLastExplanation(null);
        if (!lesson) return;
        if (currentIndex + 1 >= lesson.exercises.length) {
          setIsFinished(true);
          const total = lesson.exercises.filter((e) => e.type !== "card").length;
          const percent = total === 0 ? 100 : Math.round((correctCount / total) * 100);
          completeLesson(lesson.id, lesson.xpReward, percent);
          if (user && competencyResultsRef.current.length > 0) {
            recordCompetencyScores(user.id, competencyResultsRef.current);
            competencyResultsRef.current = [];
          }
        } else {
          setCurrentIndex((i) => i + 1);
        }
        return;
      }
      // Track per-exercise result for competency scoring (skip cards)
      if (exercise && exercise.id) {
        competencyResultsRef.current.push({
          item_type: "exercise",
          item_id: exercise.id,
          score: isCorrect ? 1 : 0,
          max_score: 1,
        });
      }
      // Marcăm lecția ca începută la primul răspuns (pentru iconița Replay în ChapterPage)
      if (!lessonStartedRef.current && lesson) {
        lessonStartedRef.current = true;
        markLessonStarted(lesson.id);
      }
      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        setFeedback("correct");
        setLastExplanation(exercise?.explanation || null);
        if (!activityRecordedRef.current) {
          activityRecordedRef.current = true;
          recordActivity();
        }
      } else {
        // Scădem inima locală pentru toți (inclusiv Premium); pentru non-Premium scădem și inima reală.
        setLocalLives((l) => Math.max(0, l - 1));
        if (!progress.isPremium) {
          loseLife();
        }
        setFeedback("wrong");
        setLastExplanation(exercise?.explanation || null);
      }
    },
    [currentIndex, lesson, loseLife, recordActivity, markLessonStarted, progress.isPremium]
  );

  const handleContinue = useCallback(() => {
    setFeedback(null);
    setLastExplanation(null);
    if (!lesson) return;
    const wasCorrect = feedback === "correct";
    if (currentIndex + 1 >= lesson.exercises.length || (!wasCorrect && lives <= 0)) {
      setIsFinished(true);
      if (wasCorrect || lives > 0) {
        const total = lesson.exercises.filter((e) => e.type !== "card").length;
        const percent = total === 0 ? 100 : Math.round((correctCount / total) * 100);
        completeLesson(lesson.id, lesson.xpReward, percent);
        if (user && competencyResultsRef.current.length > 0) {
          recordCompetencyScores(user.id, competencyResultsRef.current);
          competencyResultsRef.current = [];
        }
      }
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, correctCount, lives, lesson, feedback, completeLesson, user]);

  if (isLoading || !chapters) return <LoadingScreen />;
  if (!lesson || !chapter) return <div className="p-8 text-center text-foreground">Lecție negăsită</div>;

  // Gate: nu poți începe lecția dacă nu ai inimi
  if (noLives && !lessonStarted && !isFinished) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-6 safe-top safe-bottom">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center">
          <div className="text-5xl mb-4">💔</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Nu ai inimi</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Așteaptă 20 de minute pentru a primi o inimă sau vizionează o reclamă pentru a-ți reumple toate inimile.
          </p>
          <div className="mb-4">
            <WatchAdForLivesButton
              isPremium={progress.isPremium}
              onLivesGranted={(newLives, livesUpdatedAt) => {
                setLivesFromReward(newLives, livesUpdatedAt);
              }}
            />
          </div>
          <Button variant="outline" className="w-full touch-target" onClick={() => navigate(`/chapter/${chapter.id}`)}>
            Înapoi
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isFinished) {
    const xpEarned = lives > 0 ? (wasFirstTime ? lesson.xpReward : 3) : 0;
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-6 safe-top safe-bottom">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center">
          {lives > 0 ? (
            <>
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-foreground mb-2">Lecție completă!</h2>
              <p className="text-sm text-muted-foreground mb-4">Ai răspuns corect la {correctCount}/{lesson.exercises.filter((e) => e.type !== "card").length} exerciții</p>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary font-bold mb-6">+{xpEarned} XP</div>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">💔</div>
              <h2 className="text-xl font-bold text-foreground mb-2">Ai rămas fără vieți!</h2>
              {progress.isPremium ? (
                <p className="text-sm text-muted-foreground mb-4">Reîncepe lecția cu 5 inimi noi.</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">Încearcă din nou mai târziu sau vizionează o reclamă pentru a primi 5 inimi.</p>
                  <div className="mb-4">
                    <WatchAdForLivesButton
                      isPremium={progress.isPremium}
                      onLivesGranted={(newLives, livesUpdatedAt) => {
                        setLivesFromReward(newLives, livesUpdatedAt);
                      }}
                    />
                  </div>
                </>
              )}
            </>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 touch-target" onClick={() => navigate(`/chapter/${chapter.id}`)}>Înapoi</Button>
            {lives > 0 && <Button className="flex-1 touch-target" onClick={() => navigate(`/chapter/${chapter.id}`)}>Continuă</Button>}
            {lives <= 0 && progress.isPremium && (
              <Button className="flex-1 touch-target" onClick={restartLesson}>Reîncepe</Button>
            )}
          </div>
            <StreakCelebrationDialog open={streakJustIncreased} streakCount={newStreakCount} onClose={dismissStreakCelebration} />
        </motion.div>
      </div>
    );
  }

  const exercise = lesson.exercises[currentIndex];
  const progressPercent = (currentIndex / lesson.exercises.length) * 100;
  const isSupportedExercise = ["quiz", "fill", "order", "truefalse", "match", "card", "problem"].includes(exercise.type);

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <header className="border-b border-border bg-background/80 backdrop-blur-md px-4 py-3 pt-[var(--sat)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/chapter/${chapter.id}`)} className="touch-target flex items-center justify-center">
            <X className="h-6 w-6 text-muted-foreground" />
          </button>
          <Progress value={progressPercent} className="h-2.5 flex-1" />
          <div className="flex items-center gap-1 text-destructive">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart key={i} className={`h-4 w-4 ${i < lives ? "fill-current" : "opacity-30"}`} />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={exercise.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <ExerciseErrorBoundary key={exercise.id}>
                {exercise.type === "quiz" && <QuizExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />}
                {exercise.type === "fill" && <FillExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />}
                {exercise.type === "order" && <OrderExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />}
                {exercise.type === "truefalse" && <TrueFalseExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />}
                {exercise.type === "match" && <MatchExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />}
                {exercise.type === "card" && <CardExercise exercise={exercise} onContinue={() => handleAnswer(true)} />}
                {exercise.type === "problem" && <ProblemExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />}
                {!isSupportedExercise && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
                    <p className="mb-2 font-bold text-destructive">Tip de exercițiu nerecunoscut</p>
                    <p className="text-sm text-muted-foreground">
                      Exercițiul "{exercise.question || exercise.id}" are tipul "{String(exercise.type)}".
                    </p>
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
                {feedback === "wrong" && lives <= 0 ? "Vezi rezultatul" : "Continuă"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LessonPage;
