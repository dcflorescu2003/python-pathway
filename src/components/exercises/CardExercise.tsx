import { Exercise } from "@/hooks/useChapters";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import RichContent from "@/components/RichContent";

interface Props {
  exercise: Exercise;
  onContinue: () => void;
}

const CardExercise = ({ exercise, onContinue }: Props) => {
  return (
    <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 space-y-4">
      <div className="flex items-start gap-2 text-primary">
        <BookOpen className="h-6 w-6 mt-1 shrink-0" />
        <div className="text-xl font-bold flex-1">
          <RichContent inline>{exercise.question}</RichContent>
        </div>
      </div>

      {exercise.explanation && (
        <div className="text-foreground/80 leading-relaxed text-[15px]">
          <RichContent>{exercise.explanation}</RichContent>
        </div>
      )}

      {exercise.codeTemplate && (
        <div className="rounded-lg overflow-hidden border border-border">
          <SyntaxHighlighter
            language="python"
            style={vscDarkPlus}
            customStyle={{ margin: 0, fontSize: "0.85rem", background: "hsl(var(--card))" }}
          >
            {exercise.codeTemplate}
          </SyntaxHighlighter>
        </div>
      )}

      <Button onClick={onContinue} className="w-full h-12 text-base font-bold mt-2">
        Am înțeles — Continuă
      </Button>
    </div>
  );
};

export default CardExercise;
