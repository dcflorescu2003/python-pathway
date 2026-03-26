import { useState, useMemo, useCallback } from "react";
import { Exercise } from "@/hooks/useChapters";
import { Button } from "@/components/ui/button";

const PAIR_COLORS = [
  "bg-primary/20 border-primary text-primary",
  "bg-accent/20 border-accent text-accent-foreground",
  "bg-secondary/30 border-secondary text-secondary-foreground",
  "bg-destructive/20 border-destructive text-destructive",
  "bg-muted border-muted-foreground text-muted-foreground",
];

interface Props {
  exercise: Exercise;
  onAnswer: (isCorrect: boolean) => void;
  feedback: "correct" | "wrong" | null;
}

const MatchExercise = ({ exercise, onAnswer, feedback }: Props) => {
  const pairs = exercise.pairs || [];

  const shuffledRight = useMemo(
    () => [...pairs].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercise.id]
  );

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matched, setMatched] = useState<Map<string, string>>(new Map());
  const [submitted, setSubmitted] = useState(false);

  const handleLeftClick = useCallback((id: string) => {
    if (submitted) return;
    if (matched.has(id)) {
      // Unlink
      setMatched(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      return;
    }
    setSelectedLeft(id);
  }, [submitted, matched]);

  const handleRightClick = useCallback((id: string) => {
    if (submitted) return;
    // Check if already matched
    const matchedRight = [...matched.values()];
    if (matchedRight.includes(id)) {
      // Unlink
      setMatched(prev => {
        const next = new Map(prev);
        for (const [k, v] of next) {
          if (v === id) { next.delete(k); break; }
        }
        return next;
      });
      return;
    }
    if (selectedLeft) {
      setMatched(prev => {
        const next = new Map(prev);
        next.set(selectedLeft, id);
        return next;
      });
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setSelectedRight(id);
    }
  }, [submitted, matched, selectedLeft]);

  // If right is selected first, then left
  const handleLeftAfterRight = useCallback((leftId: string) => {
    if (selectedRight && !matched.has(leftId)) {
      setMatched(prev => {
        const next = new Map(prev);
        next.set(leftId, selectedRight);
        return next;
      });
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      handleLeftClick(leftId);
    }
  }, [selectedRight, matched, handleLeftClick]);

  const getLeftColor = (id: string) => {
    if (matched.has(id)) {
      const idx = [...matched.keys()].indexOf(id);
      return PAIR_COLORS[idx % PAIR_COLORS.length];
    }
    if (selectedLeft === id) return "ring-2 ring-primary border-primary bg-primary/10";
    return "border-border bg-card hover:bg-muted/50";
  };

  const getRightColor = (id: string) => {
    const matchedEntries = [...matched.entries()];
    const entry = matchedEntries.find(([, v]) => v === id);
    if (entry) {
      const idx = [...matched.keys()].indexOf(entry[0]);
      return PAIR_COLORS[idx % PAIR_COLORS.length];
    }
    if (selectedRight === id) return "ring-2 ring-primary border-primary bg-primary/10";
    return "border-border bg-card hover:bg-muted/50";
  };

  const allMatched = matched.size === pairs.length;

  const handleSubmit = () => {
    setSubmitted(true);
    const isCorrect = pairs.every(p => matched.get(p.id) === p.id);
    onAnswer(isCorrect);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground">{exercise.question}</h3>
      <p className="text-sm text-muted-foreground">Selectează un element din stânga, apoi perechea lui din dreapta.</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {pairs.map(p => (
            <button
              key={p.id}
              disabled={submitted}
              onClick={() => selectedRight ? handleLeftAfterRight(p.id) : handleLeftClick(p.id)}
              className={`w-full rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all text-left ${getLeftColor(p.id)} ${submitted ? "opacity-70 cursor-default" : "cursor-pointer"}`}
            >
              {p.left}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {shuffledRight.map(p => (
            <button
              key={p.id}
              disabled={submitted}
              onClick={() => handleRightClick(p.id)}
              className={`w-full rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all text-left ${getRightColor(p.id)} ${submitted ? "opacity-70 cursor-default" : "cursor-pointer"}`}
            >
              {p.right}
            </button>
          ))}
        </div>
      </div>

      {allMatched && !submitted && (
        <Button onClick={handleSubmit} className="w-full h-12 text-base font-bold">
          Verifică
        </Button>
      )}
    </div>
  );
};

export default MatchExercise;
