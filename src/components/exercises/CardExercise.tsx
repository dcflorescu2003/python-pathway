import { Exercise } from "@/hooks/useChapters";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
        <div className="text-foreground/80 leading-relaxed text-[15px] prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-a:text-primary">
          <ReactMarkdown>{exercise.explanation}</ReactMarkdown>
        </div>
      )}

      {exercise.codeTemplate && (
        <pre className="bg-card text-foreground border border-border p-4 rounded-lg font-mono text-sm overflow-x-auto">
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
