import { useState } from "react";
import { Exercise } from "@/data/courses";
import { Button } from "@/components/ui/button";
import RichContent from "@/components/RichContent";

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

  const getButtonClasses = (value: boolean) => {
    const isCorrectAnswer = value === exercise.isTrue;
    const isSelected = selected === value;

    if (feedback) {
      if (isCorrectAnswer) return "border-primary bg-primary/10 text-primary";
      if (isSelected) return "border-destructive bg-destructive/10 text-destructive";
      return "border-border bg-card text-muted-foreground opacity-50";
    }
    if (isSelected) return "border-primary bg-primary/10 text-primary";
    return "border-border bg-card text-foreground hover:border-muted-foreground";
  };

  return (
    <div>
      <div className="text-foreground font-bold mb-2"><RichContent>{exercise.question}</RichContent></div>
      <div className="code-block mb-6 text-foreground">
        <RichContent>{exercise.statement}</RichContent>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          disabled={feedback !== null}
          onClick={() => setSelected(true)}
          className={`rounded-lg border p-4 text-center font-bold transition-all ${getButtonClasses(true)}`}
        >
          {feedback && exercise.isTrue === true && "✅ "}Adevărat
        </button>
        <button
          disabled={feedback !== null}
          onClick={() => setSelected(false)}
          className={`rounded-lg border p-4 text-center font-bold transition-all ${getButtonClasses(false)}`}
        >
          {feedback && exercise.isTrue === false && "✅ "}Fals
        </button>
      </div>

      {!feedback && (
        <Button onClick={handleSubmit} disabled={selected === null} className="w-full h-14 text-lg font-bold">
          Verifică
        </Button>
      )}
    </div>
  );
};

export default TrueFalseExercise;
