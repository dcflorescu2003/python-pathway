import { useState } from "react";
import { Exercise } from "@/data/courses";
import { Button } from "@/components/ui/button";
import RichContent from "@/components/RichContent";

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

  const codeTemplate = (exercise as any).code_template || exercise.codeTemplate || "";

  return (
    <div>
      <div className="mb-4 text-foreground"><RichContent>{exercise.question}</RichContent></div>
      {codeTemplate && (
        <pre className="mb-4 bg-muted/50 border border-border rounded-lg p-3 whitespace-pre-wrap font-mono text-sm text-foreground">
          {codeTemplate}
        </pre>
      )}
      <div className="space-y-3 mb-6">
        {exercise.options?.map((opt) => {
          const isCorrectOption = opt.id === exercise.correctOptionId;
          const isSelected = selected === opt.id;

          let classes = "border-border bg-card text-foreground hover:border-muted-foreground";
          if (feedback) {
            if (isCorrectOption) {
              classes = "border-primary bg-primary/10 text-primary";
            } else if (isSelected) {
              classes = "border-destructive bg-destructive/10 text-destructive";
            } else {
              classes = "border-border bg-card text-muted-foreground opacity-50";
            }
          } else if (isSelected) {
            classes = "border-primary bg-primary/10 text-foreground";
          }

          return (
            <button
              key={opt.id}
              disabled={feedback !== null}
              onClick={() => setSelected(opt.id)}
              className={`w-full text-left rounded-lg border p-4 font-mono text-sm transition-all ${classes}`}
            >
              <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs">
                {opt.id.toUpperCase()}
              </span>
              {opt.text}
              {feedback && isCorrectOption && " ✅"}
            </button>
          );
        })}
      </div>
      {!feedback && (
        <Button onClick={handleSubmit} disabled={!selected} className="w-full h-14 text-lg font-bold">
          Verifică
        </Button>
      )}
    </div>
  );
};

export default QuizExercise;
