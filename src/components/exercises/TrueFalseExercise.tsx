import { useState } from "react";
import { Exercise } from "@/data/courses";
import { Button } from "@/components/ui/button";

interface Props {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
  feedback: "correct" | "wrong" | null;
}

const TrueFalseExercise = ({ exercise, onAnswer, feedback }: Props) => {
  const [selected, setSelected] = useState<boolean | null>(null);

  const handleSubmit = () => {
    if (selected === null) return;
    onAnswer(selected === exercise.isTrue);
  };

  return (
    <div>
      <p className="text-foreground font-bold mb-2">{exercise.question}</p>
      <div className="code-block mb-6">
        <p className="text-foreground">{exercise.statement}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          disabled={feedback !== null}
          onClick={() => setSelected(true)}
          className={`rounded-lg border p-4 text-center font-bold transition-all ${
            selected === true
              ? feedback === "correct"
                ? "border-primary bg-primary/10 text-primary"
                : feedback === "wrong"
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-foreground hover:border-muted-foreground"
          }`}
        >
          ✅ Adevărat
        </button>
        <button
          disabled={feedback !== null}
          onClick={() => setSelected(false)}
          className={`rounded-lg border p-4 text-center font-bold transition-all ${
            selected === false
              ? feedback === "correct"
                ? "border-primary bg-primary/10 text-primary"
                : feedback === "wrong"
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-foreground hover:border-muted-foreground"
          }`}
        >
          ❌ Fals
        </button>
      </div>

      {feedback && exercise.explanation && (
        <div className="mb-4 rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
          💡 {exercise.explanation}
        </div>
      )}

      <Button onClick={handleSubmit} disabled={selected === null || feedback !== null} className="w-full">
        Verifică
      </Button>
    </div>
  );
};

export default TrueFalseExercise;
