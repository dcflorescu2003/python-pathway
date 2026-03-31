import { useState, useCallback } from "react";
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
import LoadingScreen from "@/components/states/LoadingScreen";

const LessonPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { progress, completeLesson, loseLife } = useProgress();
  const { data: chapters, isLoading } = useChapters();

  const lesson = chapters?.flatMap((c) => c.lessons).find((l) => l.id === lessonId);
  const chapter = chapters?.find((c) => c.lessons.some((l) => l.id === lessonId));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lives, setLives] = useState(3);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [lastExplanation, setLastExplanation] = useState<string | null>(null);

  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      const exercise = lesson?.exercises[currentIndex];
      if (exercise?.type === "card") {
        setFeedback(null);
        setLastExplanation(null);
        if (!lesson) return;
        if (currentIndex + 1 >= lesson.exercises.length) {
          setIsFinished(true);
          completeLesson(lesson.id, lesson.xpReward, correctCount);
        } else {
          setCurrentIndex((i) => i + 1);
        }
        return;
      }
      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        setFeedback("correct");
        setLastExplanation(exercise?.explanation || null);
      } else {
        setLives((l) => l - 1);
        loseLife();
        setFeedback("wrong");
        setLastExplanation(exercise?.explanation || null);
      }
    },
    [currentIndex, lesson, loseLife, correctCount, completeLesson]
  );

  const handleContinue = useCallback(() => {
    setFeedback(null);
    setLastExplanation(null);
    if (!lesson) return;
    const wasCorrect = feedback === "correct";
    if (currentIndex + 1 >= lesson.exercises.length || (!wasCorrect && lives <= 0)) {
      setIsFinished(true);
      if (wasCorrect || lives > 0) {
        completeLesson(lesson.id, lesson.xpReward, correctCount);
      }
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, correctCount, lives, lesson, feedback, completeLesson]);

  if (isLoading || !chapters) return <LoadingScreen />;
  if (!lesson || !chapter) return <div className="p-8 text-center text-foreground">Lecție negăsită</div>;

  if (isFinished) {
    const xpEarned = lives > 0 ? lesson.xpReward : 0;
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-6 safe-top safe-bottom">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center">
          {lives > 0 ? (
            <>
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-foreground mb-2">Lecție completă!</h2>
              <p className="text-sm text-muted-foreground mb-4">Ai răspuns corect la {correctCount}/{lesson.exercises.length} exerciții</p>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary font-bold mb-6">+{xpEarned} XP</div>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">💔</div>
              <h2 className="text-xl font-bold text-foreground mb-2">Ai rămas fără vieți!</h2>
              <p className="text-sm text-muted-foreground mb-6">Încearcă din nou mai târziu.</p>
            </>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 touch-target" onClick={() => navigate(`/chapter/${chapter.id}`)}>Înapoi</Button>
            {lives > 0 && <Button className="flex-1 touch-target" onClick={() => navigate(`/chapter/${chapter.id}`)}>Continuă</Button>}
          </div>
        </motion.div>
      </div>
    );
  }

  const exercise = lesson.exercises[currentIndex];
  const progressPercent = (currentIndex / lesson.exercises.length) * 100;

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <header className="border-b border-border bg-background/80 backdrop-blur-md px-4 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/chapter/${chapter.id}`)} className="touch-target flex items-center justify-center">
            <X className="h-6 w-6 text-muted-foreground" />
          </button>
          <Progress value={progressPercent} className="h-2.5 flex-1" />
          <div className="flex items-center gap-1 text-destructive">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart key={i} className={`h-5 w-5 ${i < lives ? "fill-current" : "opacity-30"}`} />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={exercise.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              {exercise.type === "quiz" && <QuizExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />}
              {exercise.type === "fill" && <FillExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />}
              {exercise.type === "order" && <OrderExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />}
              {exercise.type === "truefalse" && <TrueFalseExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />}
              {exercise.type === "match" && <MatchExercise exercise={exercise} onAnswer={handleAnswer} feedback={feedback} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {feedback && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className={`border-t px-4 py-4 pb-[max(env(safe-area-inset-bottom),16px)] ${
              feedback === "correct" ? "bg-primary/10 border-primary/30" : "bg-destructive/10 border-destructive/30"
            }`}>
            <div className="max-w-lg mx-auto">
              <p className={`font-bold text-center mb-1 ${feedback === "correct" ? "text-primary" : "text-destructive"}`}>
                {feedback === "correct" ? "✅ Corect!" : "❌ Greșit!"}
              </p>
              {lastExplanation && <p className="text-sm text-foreground/70 text-center mb-3">💡 {lastExplanation}</p>}
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

export default LessonPage;
