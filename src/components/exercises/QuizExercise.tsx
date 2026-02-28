import { useState } from "react";
import { Exercise } from "@/data/courses";
import { Button } from "@/components/ui/button";

interface Props {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
  feedback: "correct" | "wrong" | null;
}

const QuizExercise = ({ exercise, onAnswer, feedback }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!selected) return;
    onAnswer(selected === exercise.correctOptionId);
  };

  return (
    <div>
      <pre className="code-block mb-6 whitespace-pre-wrap text-foreground">{exercise.question}</pre>
      <div className="space-y-3 mb-6">
        {exercise.options?.map((opt) => (
          <button
            key={opt.id}
            disabled={feedback !== null}
            onClick={() => setSelected(opt.id)}
            className={`w-full text-left rounded-lg border p-4 font-mono text-sm transition-all ${
              selected === opt.id
                ? feedback === "correct"
                  ? "border-primary bg-primary/10 text-primary"
                  : feedback === "wrong"
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-foreground hover:border-muted-foreground"
            }`}
          >
            <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs">
              {opt.id.toUpperCase()}
            </span>
            {opt.text}
          </button>
        ))}
      </div>
      <Button onClick={handleSubmit} disabled={!selected || feedback !== null} className="w-full">
        Verifică
      </Button>
    </div>
  );
};

export default QuizExercise;
