import { useState } from "react";
import { Exercise } from "@/data/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
  feedback: "correct" | "wrong" | null;
}

const FillExercise = ({ exercise, onAnswer, feedback }: Props) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    if (!exercise.blanks) return;
    const allCorrect = exercise.blanks.every(
      (b) => answers[b.id]?.trim().toLowerCase() === b.answer.toLowerCase()
    );
    onAnswer(allCorrect);
  };

  // Render code with blanks
  const renderCode = () => {
    if (!exercise.codeTemplate) return null;
    const parts = exercise.codeTemplate.split("___");
    return (
      <pre className="code-block mb-6 whitespace-pre-wrap">
        {parts.map((part, i) => (
          <span key={i}>
            <span className="text-foreground">{part}</span>
            {i < parts.length - 1 && exercise.blanks?.[i] && (
              <Input
                className="inline-block w-28 h-7 mx-1 font-mono text-sm bg-secondary border-primary/50 text-primary"
                value={answers[exercise.blanks[i].id] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [exercise.blanks![i].id]: e.target.value }))
                }
                disabled={feedback !== null}
                placeholder="___"
              />
            )}
          </span>
        ))}
      </pre>
    );
  };

  return (
    <div>
      <p className="text-foreground font-bold mb-4">{exercise.question}</p>
      {renderCode()}
      <Button
        onClick={handleSubmit}
        disabled={Object.keys(answers).length === 0 || feedback !== null}
        className="w-full"
      >
        Verifică
      </Button>
    </div>
  );
};

export default FillExercise;
