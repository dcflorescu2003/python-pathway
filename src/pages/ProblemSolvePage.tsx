import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Loader2, CheckCircle2, XCircle, Lightbulb, BookOpen, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CodeEditor from "@/components/CodeEditor";
import RichContent from "@/components/RichContent";
import { useProblems } from "@/hooks/useProblems";
import { usePyodide, type TestResult, type StaticCheckResult } from "@/hooks/usePyodide";
import { useProgress } from "@/hooks/useProgress";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LoadingScreen from "@/components/states/LoadingScreen";
import StreakCelebrationDialog from "@/components/StreakCelebrationDialog";
import { useAuth } from "@/hooks/useAuth";
import { recordCompetencyScores } from "@/lib/competencyTracking";

const ProblemSolvePage = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromChapter = (location.state as { fromChapter?: string } | null)?.fromChapter;
  const { data, isLoading: problemsLoading, refetch: refetchProblems } = useProblems();
  const problem = data?.problems.find((p) => p.id === problemId);
  const { loading, running, runCode, runStaticChecks } = usePyodide();
  const { progress, completeLesson, revealSolution, recordActivity, streakJustIncreased, newStreakCount, dismissStreakCelebration } = useProgress();
  const { subscribed, checkSubscription } = useSubscription();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [staticResults, setStaticResults] = useState<StaticCheckResult[] | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solutionText, setSolutionText] = useState<string | null>(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const premiumRetryDone = useRef(false);

  const fetchSolution = useCallback(async () => {
    if (!problem) return;
    // Marcăm problema ca rezolvată prin ajutor: 1 XP, fără XP integral.
    revealSolution(`problem-${problem.id}`);
    if (solutionText !== null) return;
    setLoadingSolution(true);
    const { data, error } = await supabase.rpc("get_problem_solution", { p_id: problem.id });
    if (!error && data) setSolutionText(data as string);
    setLoadingSolution(false);
  }, [problem, solutionText, revealSolution]);


  useEffect(() => {
    if (problem && problem.isPremium && !subscribed) {
      toast.error("Această problemă este disponibilă doar cu un cont Premium.");
      navigate("/problems", { state: { fromChapter: fromChapter ?? problem?.chapter } });
    }
  }, [problem, subscribed, navigate]);

  // Abonat activ, dar catalogul a venit fără cazuri de test (flag premium
  // nesincronizat pe server). Reîmprospătăm abonamentul o singură dată și
  // reîncărcăm catalogul, ca să nu rămână problema imposibil de rulat.
  useEffect(() => {
    if (!problem || !problem.isPremium || !subscribed) return;
    const hasContent =
      (problem.testCases?.length ?? 0) > 0 || (problem.staticChecks?.length ?? 0) > 0;
    if (hasContent || premiumRetryDone.current) return;
    premiumRetryDone.current = true;
    void (async () => {
      await checkSubscription(true);
      await refetchProblems();
    })();
  }, [problem, subscribed, checkSubscription, refetchProblems]);


  if (problemsLoading) return <LoadingScreen />;

  if (!problem) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Problemă negăsită.</p>
      </div>
    );
  }

  const solved = progress.completedLessons[`problem-${problem.id}`]?.completed;
  const isStatic = problem.kind === "static";

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error("Scrie cod înainte de a verifica!");
      return;
    }

    if (isStatic) {
      const checks = problem.staticChecks || [];
      const res = runStaticChecks(code, checks);
      setStaticResults(res);
      setShowSolution(false);
      const passed = res.filter((r) => r.passed).length;
      const total = res.length;

      if (user && total > 0) {
        recordCompetencyScores(user.id, [
          { item_type: "problem", item_id: problem.id, score: passed, max_score: total },
        ]);
      }

      if (passed === total && total > 0) {
        if (solved) {
          toast.success("Toate cerințele sunt îndeplinite! ✅", {
            description: "Ai rezolvat deja această problemă, așa că nu primești XP suplimentar.",
          });
        } else {
          recordActivity();
          completeLesson(`problem-${problem.id}`, problem.xpReward, 100);
          toast.success(`Felicitări! Ai câștigat ${problem.xpReward} XP! 🎉`);
        }
      } else {
        toast.error(`${passed}/${total} cerințe îndeplinite`);
      }
      return;
    }

    const testResults = await runCode(code, problem.testCases);
    setResults(testResults);
    setShowSolution(false);

    const passed = testResults.filter((r) => r.passed).length;
    const total = testResults.length;

    if (user && total > 0) {
      recordCompetencyScores(user.id, [
        { item_type: "problem", item_id: problem.id, score: passed, max_score: total },
      ]);
    }

    if (passed === total) {
      if (solved) {
        toast.success("Toate testele au trecut! ✅");
      } else {
        completeLesson(`problem-${problem.id}`, problem.xpReward, 100);
        toast.success(`Felicitări! Ai câștigat ${problem.xpReward} XP! 🎉`);
      }
    } else {
      toast.error(`${passed}/${total} teste trecute`);
    }
  };

  const passedCount = isStatic
    ? (staticResults?.filter((r) => r.passed).length ?? 0)
    : (results?.filter((r) => r.passed).length ?? 0);
  const totalCount = isStatic
    ? (staticResults?.length ?? 0)
    : (results?.length ?? 0);
  const hasAnyResults = isStatic ? !!staticResults : !!results;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-screen bg-background pb-[calc(var(--sab)+16px)]">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border pt-[var(--sat)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/problems", { state: { fromChapter: fromChapter ?? problem.chapter } })} className="active:scale-90 transition-transform">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">{problem.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">{problem.difficulty}</Badge>
              <span className="text-xs text-muted-foreground">{problem.xpReward} XP</span>
              {isStatic && <Badge variant="outline" className="text-[10px] border-accent/40 text-accent">verificare statică</Badge>}
              {solved && <span className="text-xs text-primary">✓ Rezolvată</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="text-sm text-foreground">
              <RichContent>{problem.description}</RichContent>
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
            <CardContent className="p-3">
              <div className="text-sm text-warning">
                <RichContent>{problem.hint}</RichContent>
              </div>
            </CardContent>
          </Card>
        )}

        <CodeEditor value={code} onChange={setCode} disabled={running} />

        <Button onClick={handleRun} disabled={running || (loading && !isStatic)} className="w-full gap-2" size="lg">
          {loading && !isStatic ? (<><Loader2 className="h-4 w-4 animate-spin" /> Se încarcă Python...</>) :
           running ? (<><Loader2 className="h-4 w-4 animate-spin" /> Se rulează...</>) :
           isStatic ? (<><FileSearch className="h-4 w-4" /> Verifică cod</>) :
           (<><Play className="h-4 w-4" /> Rulează teste</>)}
        </Button>

        {hasAnyResults && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{isStatic ? "Cerințe" : "Rezultate"}</h3>
              <Badge variant={passedCount === totalCount ? "default" : "destructive"} className={passedCount === totalCount ? "bg-primary/20 text-primary border-0" : ""}>
                {passedCount}/{totalCount}
              </Badge>
            </div>

            {isStatic && staticResults?.map((r, i) => (
              <Card key={i} className={`border ${r.passed ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    {r.passed ? <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />}
                    <span className="text-sm text-foreground">
                      {r.hidden ? `Cerință ${i + 1} (ascunsă)` : r.description}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {!isStatic && results?.map((result, i) => (
              <Card key={i} className={`border ${result.passed ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    {result.passed ? <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" /> : <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                    <span className="text-sm font-medium text-foreground">Test {i + 1} {result.hidden ? "(ascuns)" : ""}</span>
                  </div>
                  {!result.hidden && (
                    <div className="pl-6 space-y-1">
                      {(result.input || result.expectedOutput) && (
                        <>
                          {result.input && <p className="text-xs text-muted-foreground font-mono">Intrare: {result.input.replace(/\n/g, " ↵ ")}</p>}
                          {result.expectedOutput && <p className="text-xs text-muted-foreground font-mono">Așteptat: {result.expectedOutput}</p>}
                          {!result.passed && result.error && (
                            <p className="text-xs font-mono text-destructive">Eroare: {result.error}</p>
                          )}
                          {!result.passed && !result.error && result.expectedOutput && (
                            <p className="text-xs font-mono text-destructive">Primit: {result.actualOutput || "(gol)"}</p>
                          )}
                        </>
                      )}
                      {result.fileResults?.map((f) => (
                        <div key={f.name} className="mt-1 rounded border border-border/60 bg-muted/30 p-2 space-y-0.5">
                          <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                            📄 {f.name} {f.passed ? <CheckCircle2 className="h-3 w-3 text-primary" /> : <XCircle className="h-3 w-3 text-destructive" />}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground">Așteptat: {f.expected.replace(/\n/g, " ↵ ")}</p>
                          {!f.passed && (
                            <p className="text-[10px] font-mono text-destructive">
                              {f.missing ? "Fișierul nu a fost creat" : `Primit: ${f.actual.replace(/\n/g, " ↵ ") || "(gol)"}`}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {passedCount < totalCount && (
              <div className="space-y-3 pt-2">
                <Button onClick={() => { setShowSolution(!showSolution); if (!showSolution) fetchSolution(); }} variant="outline" className="w-full gap-2 border-accent/30 text-accent hover:bg-accent/10">
                  <BookOpen className="h-4 w-4" /> {showSolution ? "Ascunde rezolvarea" : "Vezi rezolvarea"}
                </Button>
                {showSolution && (
                  <Card className="border-accent/30 bg-accent/5">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">O posibilă rezolvare:</p>
                      {loadingSolution ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <pre className="bg-muted/50 p-3 rounded-lg font-mono text-sm overflow-x-auto text-foreground whitespace-pre-wrap"><code>{solutionText || ""}</code></pre>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
        <StreakCelebrationDialog open={streakJustIncreased} streakCount={newStreakCount} onClose={dismissStreakCelebration} />
      </div>
    </motion.div>
  );
};

export default ProblemSolvePage;
