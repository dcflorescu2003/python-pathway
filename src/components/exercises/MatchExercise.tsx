import { useState, useMemo, useCallback, useEffect } from "react";
import { Exercise } from "@/hooks/useChapters";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Link2, RotateCcw } from "lucide-react";

const MATCHED_STYLE = "border-primary bg-primary/10 text-primary shadow-md shadow-primary/10";

interface Props {
  exercise: Exercise;
  onAnswer: (isCorrect: boolean) => void;
  feedback: "correct" | "wrong" | null;
}

const MatchExercise = ({ exercise, onAnswer, feedback }: Props) => {
  const pairs = exercise.pairs || [];
  const [recentlyMatched, setRecentlyMatched] = useState<string | null>(null);

  const shuffledRight = useMemo(
    () => [...pairs].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercise.id]
  );

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matched, setMatched] = useState<Map<string, string>>(new Map());
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Map<string, boolean>>(new Map());

  // Flash animation for recently matched pair
  useEffect(() => {
    if (recentlyMatched) {
      const timer = setTimeout(() => setRecentlyMatched(null), 600);
      return () => clearTimeout(timer);
    }
  }, [recentlyMatched]);

  const addMatch = useCallback((leftId: string, rightId: string) => {
    setMatched(prev => {
      const next = new Map(prev);
      next.set(leftId, rightId);
      return next;
    });
    setSelectedLeft(null);
    setSelectedRight(null);
    setRecentlyMatched(leftId);
  }, []);

  const handleLeftClick = useCallback((id: string) => {
    if (submitted) return;
    if (matched.has(id)) {
      setMatched(prev => { const next = new Map(prev); next.delete(id); return next; });
      return;
    }
    if (selectedRight) {
      addMatch(id, selectedRight);
    } else {
      setSelectedLeft(prev => prev === id ? null : id);
    }
  }, [submitted, matched, selectedRight, addMatch]);

  const handleRightClick = useCallback((id: string) => {
    if (submitted) return;
    const matchedRight = [...matched.values()];
    if (matchedRight.includes(id)) {
      setMatched(prev => {
        const next = new Map(prev);
        for (const [k, v] of next) { if (v === id) { next.delete(k); break; } }
        return next;
      });
      return;
    }
    if (selectedLeft) {
      addMatch(selectedLeft, id);
    } else {
      setSelectedRight(prev => prev === id ? null : id);
    }
  }, [submitted, matched, selectedLeft, addMatch]);

  const getMatchIndex = (leftId: string): number => [...matched.keys()].indexOf(leftId);

  const getLeftStyle = (id: string) => {
    if (submitted && results.size > 0) {
      const isCorrect = results.get(id);
      if (isCorrect) return "border-primary bg-primary/10 text-primary shadow-md shadow-primary/10";
      return "border-destructive bg-destructive/10 text-destructive shadow-md shadow-destructive/10";
    }
    if (matched.has(id)) {
      const idx = getMatchIndex(id);
      const c = PAIR_COLORS[idx % PAIR_COLORS.length];
      return `${c.bg} ${c.border} ${c.text} shadow-md ${c.glow}`;
    }
    if (selectedLeft === id) return "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary bg-primary/10 scale-[1.02]";
    return "border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/30";
  };

  const getRightStyle = (id: string) => {
    if (submitted && results.size > 0) {
      const entry = [...matched.entries()].find(([, v]) => v === id);
      if (entry) {
        const isCorrect = results.get(entry[0]);
        if (isCorrect) return "border-primary bg-primary/10 text-primary shadow-md shadow-primary/10";
        return "border-destructive bg-destructive/10 text-destructive shadow-md shadow-destructive/10";
      }
      return "border-border bg-card opacity-50";
    }
    const entry = [...matched.entries()].find(([, v]) => v === id);
    if (entry) {
      const idx = getMatchIndex(entry[0]);
      const c = PAIR_COLORS[idx % PAIR_COLORS.length];
      return `${c.bg} ${c.border} ${c.text} shadow-md ${c.glow}`;
    }
    if (selectedRight === id) return "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary bg-primary/10 scale-[1.02]";
    return "border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/30";
  };

  const allMatched = matched.size === pairs.length;

  const handleSubmit = () => {
    setSubmitted(true);
    const resultMap = new Map<string, boolean>();
    pairs.forEach(p => {
      resultMap.set(p.id, matched.get(p.id) === p.id);
    });
    setResults(resultMap);
    const isCorrect = pairs.every(p => matched.get(p.id) === p.id);
    onAnswer(isCorrect);
  };

  const matchedCount = matched.size;
  const totalPairs = pairs.length;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-foreground">{exercise.question}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Selectează un element din stânga, apoi perechea lui din dreapta.
        </p>
      </div>

      {/* Progress indicator + reset */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(matchedCount / totalPairs) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {matchedCount}/{totalPairs}
        </span>
        {matchedCount > 0 && !submitted && (
          <button
            onClick={() => { setMatched(new Map()); setSelectedLeft(null); setSelectedRight(null); }}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Resetează perechile"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2.5">
          {pairs.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 400, damping: 25 }}
              disabled={submitted}
              onClick={() => handleLeftClick(p.id)}
              className={`w-full rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all duration-200 text-left relative overflow-hidden ${getLeftStyle(p.id)} ${submitted ? "cursor-default" : "cursor-pointer active:scale-[0.97]"}`}
            >
              <div className="flex items-center gap-2">
                {submitted && results.has(p.id) && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    {results.get(p.id) ? (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-destructive shrink-0" />
                    )}
                  </motion.span>
                )}
                {matched.has(p.id) && !submitted && (
                  <motion.span
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    <Link2 className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  </motion.span>
                )}
                <span className="flex-1">{p.left}</span>
              </div>

              {/* Flash animation on match */}
              <AnimatePresence>
                {recentlyMatched === p.id && (
                  <motion.div
                    initial={{ opacity: 0.5, scale: 0.5 }}
                    animate={{ opacity: 0, scale: 2.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 rounded-xl bg-primary/20 pointer-events-none"
                  />
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-2.5">
          {shuffledRight.map((p, i) => {
            const matchEntry = [...matched.entries()].find(([, v]) => v === p.id);
            return (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 400, damping: 25 }}
                disabled={submitted}
                onClick={() => handleRightClick(p.id)}
                className={`w-full rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all duration-200 text-left relative overflow-hidden ${getRightStyle(p.id)} ${submitted ? "cursor-default" : "cursor-pointer active:scale-[0.97]"}`}
              >
                <div className="flex items-center gap-2">
                  {submitted && matchEntry && results.has(matchEntry[0]) && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.1 }}
                    >
                      {results.get(matchEntry[0]) ? (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-destructive shrink-0" />
                      )}
                    </motion.span>
                  )}
                  {matchEntry && !submitted && (
                    <motion.span
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <Link2 className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    </motion.span>
                  )}
                  <span className="flex-1">{p.right}</span>
                </div>

                {/* Flash animation on match */}
                <AnimatePresence>
                  {recentlyMatched && matchEntry && matchEntry[0] === recentlyMatched && (
                    <motion.div
                      initial={{ opacity: 0.5, scale: 0.5 }}
                      animate={{ opacity: 0, scale: 2.5 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 rounded-xl bg-primary/20 pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Submit button */}
      <AnimatePresence>
        {allMatched && !submitted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Button onClick={handleSubmit} className="w-full h-12 text-base font-bold">
              Verifică
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post-submit result summary */}
      <AnimatePresence>
        {submitted && results.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-3 text-center text-sm font-medium ${
              [...results.values()].every(Boolean)
                ? "bg-primary/10 text-primary"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {[...results.values()].every(Boolean)
              ? `🎯 Toate cele ${totalPairs} perechi sunt corecte!`
              : `${[...results.values()].filter(Boolean).length}/${totalPairs} perechi corecte`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchExercise;
