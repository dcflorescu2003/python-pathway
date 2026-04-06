import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Loader2, CheckCircle2, XCircle, Lightbulb, Eye, EyeOff, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CodeEditor from "@/components/CodeEditor";
import { useProblems } from "@/hooks/useProblems";
import { usePyodide, type TestResult } from "@/hooks/usePyodide";
import { useProgress } from "@/hooks/useProgress";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import LoadingScreen from "@/components/states/LoadingScreen";

const ProblemSolvePage = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading: problemsLoading } = useProblems();
  const problem = data?.problems.find((p) => p.id === problemId);
  const { loading, running, runCode } = usePyodide();
  const { progress, completeLesson } = useProgress();
  const { subscribed } = useSubscription();

  const [code, setCode] = useState("");
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showHiddenTests, setShowHiddenTests] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  // Guard: redirect non-premium users from premium problems
  useEffect(() => {
    if (problem && problem.isPremium && !subscribed) {
      toast.error("Această problemă este disponibilă doar cu un cont Premium.");
      navigate("/problems");
    }
  }, [problem, subscribed, navigate]);

  if (problemsLoading) return <LoadingScreen />;

  if (!problem) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Problemă negăsită.</p>
      </div>
    );
  }

  const solved = progress.completedLessons[`problem-${problem.id}`]?.completed;

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error("Scrie cod înainte de a rula testele!");
      return;
    }

    const testResults = await runCode(code, problem.testCases);
    setResults(testResults);
    setShowSolution(false);

    const passed = testResults.filter((r) => r.passed).length;
    const total = testResults.length;

    if (passed === total && !solved) {
      completeLesson(`problem-${problem.id}`, problem.xpReward, 100);
      toast.success(`Felicitări! Ai câștigat ${problem.xpReward} XP! 🎉`);
    } else if (passed === total) {
      toast.success("Toate testele au trecut! ✅");
    } else {
      toast.error(`${passed}/${total} teste trecute`);
    }
  };

  const visibleResults = results
    ? showHiddenTests ? results : results.filter((r) => !r.hidden)
    : null;

  const passedCount = results?.filter((r) => r.passed).length ?? 0;
  const totalCount = results?.length ?? 0;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-screen bg-background pb-8">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/problems")} className="active:scale-90 transition-transform">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">{problem.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">{problem.difficulty}</Badge>
              <span className="text-xs text-muted-foreground">{problem.xpReward} XP</span>
              {solved && <span className="text-xs text-primary">✓ Rezolvată</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="prose prose-invert prose-sm max-w-none">
              {problem.description.split("\n").map((line, i) => {
                if (line.startsWith("```")) return null;
                if (line.startsWith("**")) {
                  return <p key={i} className="text-sm text-foreground"><strong dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong class='text-accent'>$1</strong>") }} /></p>;
                }
                return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>;
              })}
            </div>
          </CardContent>
        </Card>

        {problem.hint && (
          <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-2 text-sm text-warning/80 hover:text-warning transition-colors">
            <Lightbulb className="h-4 w-4" /> {showHint ? "Ascunde indiciul" : "Arată indiciu"}
          </button>
        )}
        {showHint && problem.hint && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-3"><p className="text-sm text-warning">{problem.hint}</p></CardContent>
          </Card>
        )}

        <CodeEditor value={code} onChange={setCode} disabled={running} />

        <Button onClick={handleRun} disabled={running || loading} className="w-full gap-2" size="lg">
          {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Se încarcă Python...</>) : running ? (<><Loader2 className="h-4 w-4 animate-spin" /> Se rulează...</>) : (<><Play className="h-4 w-4" /> Rulează teste</>)}
        </Button>

        {results && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">Rezultate</h3>
                <Badge variant={passedCount === totalCount ? "default" : "destructive"} className={passedCount === totalCount ? "bg-primary/20 text-primary border-0" : ""}>
                  {passedCount}/{totalCount}
                </Badge>
              </div>
              {results.some((r) => r.hidden) && (
                <button onClick={() => setShowHiddenTests(!showHiddenTests)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {showHiddenTests ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showHiddenTests ? "Ascunde" : "Arată"} teste ascunse
                </button>
              )}
            </div>

            {visibleResults?.map((result, i) => (
              <Card key={i} className={`border ${result.passed ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    {result.passed ? <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" /> : <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                    <span className="text-sm font-medium text-foreground">Test {i + 1} {result.hidden ? "(ascuns)" : ""}</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    <p className="text-xs text-muted-foreground font-mono">Intrare: {result.input.replace(/\n/g, " ↵ ")}</p>
                    <p className="text-xs text-muted-foreground font-mono">Așteptat: {result.expectedOutput}</p>
                    {!result.passed && (
                      <p className="text-xs font-mono text-destructive">{result.error ? `Eroare: ${result.error}` : `Primit: ${result.actualOutput || "(gol)"}`}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {passedCount < totalCount && (
              <div className="space-y-3 pt-2">
                <Button onClick={() => setShowSolution(!showSolution)} variant="outline" className="w-full gap-2 border-accent/30 text-accent hover:bg-accent/10">
                  <BookOpen className="h-4 w-4" /> {showSolution ? "Ascunde rezolvarea" : "Vezi rezolvarea"}
                </Button>
                {showSolution && (
                  <Card className="border-accent/30 bg-accent/5">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">O posibilă rezolvare:</p>
                      <pre className="bg-muted/50 p-3 rounded-lg font-mono text-sm overflow-x-auto text-foreground whitespace-pre-wrap"><code>{problem.solution}</code></pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProblemSolvePage;
