import { useState } from "react";
import { Exercise } from "@/data/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RichContent from "@/components/RichContent";

interface Props {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
  feedback: "correct" | "wrong" | null;
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
    .replace(/\u00A0/g, " ")               // NBSP -> space
    .replace(/\s+/g, "")                   // strip ALL whitespace (s+d == s + d)
    .toLowerCase()
    .trim();

const FillExercise = ({ exercise, onAnswer, feedback }: Props) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const splitAlternatives = (acceptedAnswers: string): string[] => {
    // Separatori între variante alternative: `,`, `|`, `;`.
    // Nu împărțim în interiorul parantezelor sau al ghilimelelor —
    // altfel răspunsuri ca `range(2, n)` sau `","` ar fi sparte greșit.
    const parts: string[] = [];
    let buf = "";
    let depth = 0;
    let quote: '"' | "'" | null = null;
    for (const ch of acceptedAnswers) {
      if (quote) {
        buf += ch;
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        buf += ch;
        continue;
      }
      if (ch === "(" || ch === "[" || ch === "{") depth++;
      else if (ch === ")" || ch === "]" || ch === "}") depth = Math.max(0, depth - 1);
      if (depth === 0 && (ch === "," || ch === "|" || ch === ";")) {
        parts.push(buf);
        buf = "";
      } else {
        buf += ch;
      }
    }
    parts.push(buf);
    return parts.map((p) => p.trim()).filter(Boolean);
  };

  const stripQuotes = (s: string) => {
    const t = s.trim();
    if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) {
      return t.slice(1, -1);
    }
    return t;
  };

  const isBlankCorrect = (userAnswer: string, acceptedAnswers: string) => {
    const alternatives = splitAlternatives(acceptedAnswers).flatMap((a) => {
      const stripped = stripQuotes(a);
      return stripped === a.trim() ? [normalize(a)] : [normalize(a), normalize(stripped)];
    });
    return alternatives.includes(normalize(userAnswer));
  };



  const handleSubmit = () => {
    if (!exercise.blanks) return;
    const allCorrect = exercise.blanks.every((b) =>
      isBlankCorrect(answers[b.id] || "", b.answer)
    );
    onAnswer(allCorrect);
  };

  const renderCode = () => {
    if (!exercise.codeTemplate) return null;
    const parts = exercise.codeTemplate.split("___");
    return (
      <pre className="code-block mb-6 whitespace-pre-wrap">
        {parts.map((part, i) => (
          <span key={i}>
            <span className="text-foreground">{part}</span>
            {i < parts.length - 1 && exercise.blanks?.[i] && (
              <>
              <Input
                  autoCapitalize="none"
                  className="inline-block w-28 h-7 mx-1 font-mono text-sm bg-secondary border-primary/50 text-primary"
                  value={answers[exercise.blanks[i].id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [exercise.blanks![i].id]: e.target.value }))
                  }
                  disabled={feedback !== null}
                  placeholder={"_".repeat(exercise.blanks![i].answer.length)}
                />
                {feedback === "wrong" && (
                  <span className="text-xs text-primary ml-1">
                    ({splitAlternatives(exercise.blanks![i].answer)[0]})
                  </span>
                )}
              </>
            )}
          </span>
        ))}
      </pre>
    );
  };

  return (
    <div>
      <div className="mb-4 text-foreground font-bold"><RichContent>{exercise.question}</RichContent></div>
      {renderCode()}
      {!feedback && (
        <Button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length === 0}
          className="w-full h-14 text-lg font-bold"
        >
          Verifică
        </Button>
      )}
    </div>
  );
};

export default FillExercise;
