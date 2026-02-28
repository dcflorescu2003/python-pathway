import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { chapters, Exercise } from "@/data/courses";
import { useProgress } from "@/hooks/useProgress";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QuizExercise from "@/components/exercises/QuizExercise";
import FillExercise from "@/components/exercises/FillExercise";
import OrderExercise from "@/components/exercises/OrderExercise";
import TrueFalseExercise from "@/components/exercises/TrueFalseExercise";

const LessonPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { progress, completeLesson, loseLife } = useProgress();

  const lesson = chapters.flatMap((c) => c.lessons).find((l) => l.id === lessonId);
  const chapter = chapters.find((c) => c.lessons.some((l) => l.id === lessonId));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lives, setLives] = useState(progress.lives);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        setFeedback("correct");
      } else {
        setLives((l) => l - 1);
        loseLife();
        setFeedback("wrong");
      }

      setTimeout(() => {
        setFeedback(null);
        if (!lesson) return;
        if (currentIndex + 1 >= lesson.exercises.length || (!isCorrect && lives <= 1)) {
          setIsFinished(true);
          if (lesson && (isCorrect || lives > 1)) {
            const finalCorrect = isCorrect ? correctCount + 1 : correctCount;
            completeLesson(lesson.id, lesson.xpReward, finalCorrect);
          }
        } else {
          setCurrentIndex((i) => i + 1);
        }
      }, 1500);
    },
    [currentIndex, correctCount, lives, lesson, completeLesson, loseLife]
  );

  if (!lesson || !chapter) {
    return <div className="p-8 text-center text-foreground">Lecție negăsită</div>;
  }

  if (isFinished) {
    const xpEarned = lives > 0 ? lesson.xpReward : 0;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center"
        >
          {lives > 0 ? (
            <>
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Lecție completă!</h2>
              <p className="text-muted-foreground mb-4">
                Ai răspuns corect la {correctCount}/{lesson.exercises.length} exerciții
              </p>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary font-bold mb-6">
                +{xpEarned} XP
              </div>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">💔</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Ai rămas fără vieți!</h2>
              <p className="text-muted-foreground mb-6">Încearcă din nou mai târziu.</p>
            </>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate(`/chapter/${chapter.id}`)}>
              Înapoi
            </Button>
            {lives > 0 && (
              <Button className="flex-1" onClick={() => navigate(`/chapter/${chapter.id}`)}>
                Continuă
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  const exercise = lesson.exercises[currentIndex];
  const progressPercent = ((currentIndex) / lesson.exercises.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button onClick={() => navigate(`/chapter/${chapter.id}`)}>
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>
          <Progress value={progressPercent} className="h-2 flex-1" />
          <div className="flex items-center gap-1 text-destructive">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`h-5 w-5 ${i < lives ? "fill-current" : "opacity-30"}`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Exercise */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              {exercise.type === "quiz" && (
                <QuizExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />
              )}
              {exercise.type === "fill" && (
                <FillExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />
              )}
              {exercise.type === "order" && (
                <OrderExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />
              )}
              {exercise.type === "truefalse" && (
                <TrueFalseExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Feedback overlay */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-4 rounded-lg p-4 text-center font-bold ${
                  feedback === "correct"
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-destructive/10 text-destructive border border-destructive/30"
                }`}
              >
                {feedback === "correct" ? "✅ Corect!" : "❌ Greșit!"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default LessonPage;
