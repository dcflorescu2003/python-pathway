import { Exercise } from "@/hooks/useChapters";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

interface Props {
  exercise: Exercise;
  onContinue: () => void;
}

const CardExercise = ({ exercise, onContinue }: Props) => {
  return (
    <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <BookOpen className="h-6 w-6" />
        <h2 className="text-xl font-bold">{exercise.question}</h2>
      </div>

      {exercise.explanation && (
        <p className="text-foreground/80 whitespace-pre-line leading-relaxed text-[15px]">
          {exercise.explanation}
        </p>
      )}

      {exercise.codeTemplate && (
        <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <code>{exercise.codeTemplate}</code>
        </pre>
      )}

      <Button onClick={onContinue} className="w-full h-12 text-base font-bold mt-2">
        Am înțeles — Continuă
      </Button>
    </div>
  );
};

export default CardExercise;
