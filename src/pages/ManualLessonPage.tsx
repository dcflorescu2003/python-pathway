import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { Exercise } from "@/hooks/useChapters";
import { useAuth } from "@/hooks/useAuth";
import { recordCompetencyScores, type CompetencyItemResult } from "@/lib/competencyTracking";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import QuizExercise from "@/components/exercises/QuizExercise";
import FillExercise from "@/components/exercises/FillExercise";
import OrderExercise from "@/components/exercises/OrderExercise";
import TrueFalseExercise from "@/components/exercises/TrueFalseExercise";
import MatchExercise from "@/components/exercises/MatchExercise";
import CardExercise from "@/components/exercises/CardExercise";
import ProblemExercise from "@/components/exercises/ProblemExercise";
import RichContent from "@/components/RichContent";
import LoadingScreen from "@/components/states/LoadingScreen";
import PyroLogo from "@/components/brand/PyroLogo";
import React from "react";

class ExerciseErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-bold mb-2">Eroare la afișare</p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface ManualLessonData {
  id: string;
  title: string;
  description: string;
  exercises: Exercise[];
}

function mapExercise(row: any): Exercise {
  return {
    id: row.id,
    type: row.type,
    question: row.question,
    options: row.options ?? undefined,
    correctOptionId: row.correct_option_id ?? undefined,
    codeTemplate: row.code_template ?? undefined,
    blanks: row.blanks ?? undefined,
    lines: row.lines ?? undefined,
    statement: row.statement ?? undefined,
    isTrue: row.is_true ?? undefined,
    explanation: row.explanation ?? undefined,
    pairs: row.pairs ?? undefined,
    testCases: row.test_cases ?? undefined,
    hint: row.hint ?? undefined,
    solution: row.solution ?? undefined,
    xp: row.xp,
  };
}

const Header = () => (
  <header className="border-b border-border bg-card/80 backdrop-blur-md">
    <div className="flex items-center justify-center py-4 px-6">
      <PyroLogo size="md" />
    </div>
  </header>
);

const Footer = ({ onNavigate }: { onNavigate: () => void }) => (
  <footer className="border-t border-border bg-card/60 backdrop-blur-md">
    <div className="max-w-lg mx-auto px-6 py-5 flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🐍</span>
        <p className="text-sm text-muted-foreground text-center">
          Învață Python pas cu pas cu <span className="font-bold text-foreground">PyRo</span> — cursuri interactive, probleme și mult mai mult!
        </p>
      </div>
      <Button
        onClick={onNavigate}
        className="h-11 px-6 font-bold bg-gradient-to-r from-primary to-accent text-primary-foreground"
      >
        🚀 Creează cont gratuit
      </Button>
    </div>
  </footer>
);

const ManualLessonPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const { data: lesson, isLoading } = useQuery<ManualLessonData | null>({
    queryKey: ["manual-lesson", lessonId],
    queryFn: async () => {
      const { data: l, error: lErr } = await supabase
        .from("manual_lessons")
        .select("*")
        .eq("id", lessonId!)
        .maybeSingle();
      if (lErr || !l) return null;

      const { data: exs } = await supabase
        .from("manual_exercises")
        .select("*")
        .eq("lesson_id", lessonId!)
        .order("sort_order");

      return {
        id: l.id,
        title: l.title,
        description: l.description,
        exercises: (exs || []).map(mapExercise),
      };
    },
    enabled: !!lessonId,
  });

  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [lastExplanation, setLastExplanation] = useState<string | null>(null);
  const { user } = useAuth();
  const competencyResultsRef = useRef<CompetencyItemResult[]>([]);

  const goToAuth = () => navigate("/auth");

  const flushCompetencies = useCallback(() => {
    if (user && competencyResultsRef.current.length > 0) {
      recordCompetencyScores(user.id, competencyResultsRef.current);
      competencyResultsRef.current = [];
    }
  }, [user]);

  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      if (!lesson) return;
      const exercise = lesson.exercises[currentIndex];
      if (exercise?.type === "card") {
        setFeedback(null);
        setLastExplanation(null);
        if (currentIndex + 1 >= lesson.exercises.length) {
          setIsFinished(true);
          flushCompetencies();
        } else {
          setCurrentIndex(i => i + 1);
        }
        return;
      }
      // Track per-exercise result
      if (exercise && exercise.id) {
        competencyResultsRef.current.push({
          item_type: "manual_exercise",
          item_id: exercise.id,
          score: isCorrect ? 1 : 0,
          max_score: 1,
        });
      }
      if (isCorrect) {
        setCorrectCount(c => c + 1);
        setFeedback("correct");
      } else {
        setFeedback("wrong");
      }
      setLastExplanation(exercise?.explanation || null);
    },
    [currentIndex, lesson, flushCompetencies]
  );

  const handleContinue = useCallback(() => {
    setFeedback(null);
    setLastExplanation(null);
    if (!lesson) return;
    if (currentIndex + 1 >= lesson.exercises.length) {
      setIsFinished(true);
      flushCompetencies();
    } else {
      setCurrentIndex(i => i + 1);
    }
  }, [currentIndex, lesson, flushCompetencies]);

  if (isLoading) return <LoadingScreen />;
  if (!lesson) return <div className="p-8 text-center text-foreground">Lecție negăsită</div>;

  // Start screen
  if (!started) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-sm w-full"
          >
            <div className="rounded-2xl border border-border bg-card p-8 glow-primary">
              <h1 className="text-2xl font-bold text-foreground mb-2">{lesson.title}</h1>
              {lesson.description && (
                <p className="text-muted-foreground mb-4">{lesson.description}</p>
              )}
              <p className="text-sm text-muted-foreground mb-6 font-mono">
                📝 {lesson.exercises.length} exerciții
              </p>
              <Button
                onClick={() => setStarted(true)}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-accent text-primary-foreground"
              >
                🚀 Începe
              </Button>
            </div>
          </motion.div>
        </main>
        <Footer onNavigate={goToAuth} />
      </div>
    );
  }

  // Finished screen
  if (isFinished) {
    const total = lesson.exercises.filter(e => e.type !== "card").length;
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm"
          >
            <div className="rounded-2xl border border-border bg-card p-8 text-center glow-primary">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-foreground mb-2">Lecție completă!</h2>
              <p className="text-3xl font-bold text-gradient-primary mb-2">
                {correctCount}/{total}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                răspunsuri corecte
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStarted(false);
                  setCurrentIndex(0);
                  setCorrectCount(0);
                  setIsFinished(false);
                }}
              >
                🔄 Încearcă din nou
              </Button>
            </div>
          </motion.div>
        </main>
        <Footer onNavigate={goToAuth} />
      </div>
    );
  }

  // Exercise screen
  const exercise = lesson.exercises[currentIndex];
  const progressPercent = (currentIndex / lesson.exercises.length) * 100;
  const isSupportedExercise = ["quiz", "fill", "order", "truefalse", "match", "card", "problem"].includes(exercise.type);

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-md px-4 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="flex items-center gap-3">
          <button onClick={() => setStarted(false)} className="touch-target flex items-center justify-center">
            <PyroLogo size="sm" showWordmark={false} />
          </button>
          <Progress value={progressPercent} className="h-2.5 flex-1" />
          <span className="text-xs text-muted-foreground font-mono">
            {currentIndex + 1}/{lesson.exercises.length}
          </span>
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
                  </div>
                )}
              </ExerciseErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className={`border-t px-4 py-4 pb-[max(env(safe-area-inset-bottom),16px)] ${
              feedback === "correct" ? "bg-primary/10 border-primary/30" : "bg-destructive/10 border-destructive/30"
            }`}
          >
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
              <Button
                onClick={handleContinue}
                className="w-full h-14 text-lg font-bold"
                variant={feedback === "correct" ? "default" : "destructive"}
              >
                Continuă
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManualLessonPage;
