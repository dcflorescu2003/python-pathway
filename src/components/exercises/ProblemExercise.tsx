import { useState } from "react";
import { Play, Loader2, CheckCircle2, XCircle, Lightbulb, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CodeEditor from "@/components/CodeEditor";
import { usePyodide, type TestResult } from "@/hooks/usePyodide";
import { toast } from "sonner";

interface TestCase {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

interface ProblemExerciseProps {
  exercise: {
    id: string;
    question: string;
    explanation?: string;
    codeTemplate?: string;
    testCases?: TestCase[];
    hint?: string;
    solution?: string;
  };
  onAnswer: (isCorrect: boolean) => void;
  feedback: "correct" | "wrong" | null;
}

const ProblemExercise = ({ exercise, onAnswer, feedback }: ProblemExerciseProps) => {
  const { loading, running, runCode } = usePyodide();
  const [code, setCode] = useState(exercise.codeTemplate || "");
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const testCases = exercise.testCases || [];

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error("Scrie cod înainte de a rula testele!");
      return;
    }

    const testResults = await runCode(code, testCases);
    setResults(testResults);
    setShowSolution(false);

    const passed = testResults.filter((r) => r.passed).length;
    const total = testResults.length;

    if (passed === total) {
      onAnswer(true);
    } else {
      toast.error(`${passed}/${total} teste trecute`);
    }
  };

  const visibleResults = results ? results.filter((r) => !r.hidden) : null;
  const passedCount = results?.filter((r) => r.passed).length ?? 0;
  const totalCount = results?.length ?? 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">{exercise.question}</h2>

      {exercise.explanation && (
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="prose prose-invert prose-sm max-w-none">
              {exercise.explanation.split("\n").map((line, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {exercise.hint && (
        <button
          onClick={() => setShowHint(!showHint)}
          className="flex items-center gap-2 text-sm text-warning/80 hover:text-warning transition-colors"
        >
          <Lightbulb className="h-4 w-4" /> {showHint ? "Ascunde indiciul" : "Arată indiciu"}
        </button>
      )}
      {showHint && exercise.hint && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-3">
            <p className="text-sm text-warning">{exercise.hint}</p>
          </CardContent>
        </Card>
      )}

      <CodeEditor value={code} onChange={setCode} disabled={running || feedback !== null} />

      {!feedback && (
        <Button onClick={handleRun} disabled={running || loading} className="w-full gap-2" size="lg">
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Se încarcă Python...</>
          ) : running ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Se rulează...</>
          ) : (
            <><Play className="h-4 w-4" /> Rulează teste</>
          )}
        </Button>
      )}

      {results && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Rezultate</h3>
            <Badge
              variant={passedCount === totalCount ? "default" : "destructive"}
              className={passedCount === totalCount ? "bg-primary/20 text-primary border-0" : ""}
            >
              {passedCount}/{totalCount}
            </Badge>
          </div>

          {visibleResults?.map((result, i) => (
            <Card
              key={i}
              className={`border ${result.passed ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}
            >
              <CardContent className="p-3 space-y-1">
                <div className="flex items-center gap-2">
                  {result.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-foreground">Test {i + 1}</span>
                </div>
                <div className="pl-6 space-y-1">
                  <p className="text-xs text-muted-foreground font-mono">Intrare: {result.input.replace(/\n/g, " ↵ ")}</p>
                  <p className="text-xs text-muted-foreground font-mono">Așteptat: {result.expectedOutput}</p>
                  {!result.passed && (
                    <p className="text-xs font-mono text-destructive">
                      {result.error ? `Eroare: ${result.error}` : `Primit: ${result.actualOutput || "(gol)"}`}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {passedCount < totalCount && exercise.solution && (
            <div className="space-y-3 pt-2">
              <Button
                onClick={() => setShowSolution(!showSolution)}
                variant="outline"
                className="w-full gap-2 border-accent/30 text-accent hover:bg-accent/10"
              >
                <BookOpen className="h-4 w-4" /> {showSolution ? "Ascunde rezolvarea" : "Vezi rezolvarea"}
              </Button>
              {showSolution && (
                <Card className="border-accent/30 bg-accent/5">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">O posibilă rezolvare:</p>
                    <pre className="bg-muted/50 p-3 rounded-lg font-mono text-sm overflow-x-auto text-foreground whitespace-pre-wrap">
                      <code>{exercise.solution}</code>
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProblemExercise;
