import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStartSubmission, useSubmitTest } from "@/hooks/useTests";
import { usePyodide, TestResult } from "@/hooks/usePyodide";
import { ArrowLeft, Clock, ChevronLeft, ChevronRight, Send, Play, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LoadingScreen from "@/components/states/LoadingScreen";

interface TestItemData {
  id: string;
  sort_order: number;
  source_type: string;
  source_id: string | null;
  points: number;
  // For exercise/problem source types, we fetch the actual data
  exercise_data?: any;
  problem_data?: any;
}

const TakeTestPage = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const startSubmission = useStartSubmission();
  const submitTest = useSubmitTest();

  const [loading, setLoading] = useState(true);
  const [testInfo, setTestInfo] = useState<any>(null);
  const [items, setItems] = useState<TestItemData[]>([]);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Load test data
  useEffect(() => {
    if (!assignmentId || !user) return;
    const load = async () => {
      try {
        // Get assignment + test info
        const { data: assignment } = await supabase
          .from("test_assignments")
          .select("*, tests(id, title, time_limit_minutes, variant_mode, allow_run_tests)")
          .eq("id", assignmentId)
          .single();

        if (!assignment) { navigate("/"); return; }
        setTestInfo(assignment);

        // Check existing submission
        const { data: existingSub } = await supabase
          .from("test_submissions")
          .select("*")
          .eq("assignment_id", assignmentId)
          .eq("student_id", user.id)
          .maybeSingle();

        if (existingSub?.submitted_at) {
          setSubmitted(true);
          setLoading(false);
          return;
        }

        // Assign random variant
        const variant = Math.random() < 0.5 ? "A" : "B";
        let subId: string;

        if (existingSub) {
          subId = existingSub.id;
        } else {
          const result = await startSubmission.mutateAsync({ assignment_id: assignmentId, variant });
          subId = result.id;
        }
        setSubmissionId(subId);

        const usedVariant = existingSub?.variant || variant;

        // Get test items via RPC (bypasses RLS)
        const { data: testItems, error: rpcError } = await supabase
          .rpc("get_test_items_for_student", {
            p_assignment_id: assignmentId,
            p_variant: usedVariant,
          });

        if (rpcError) throw rpcError;
        if (!testItems || testItems.length === 0) { setLoading(false); return; }

        // Shuffle items if shuffle mode
        let orderedItems = testItems;
        if (assignment.tests.variant_mode === "shuffle") {
          orderedItems = [...testItems].sort(() => Math.random() - 0.5);
        }

        // Fetch exercise/problem data for each item
        const enrichedItems: TestItemData[] = [];
        for (const item of orderedItems) {
          const enriched: TestItemData = {
            id: item.id,
            sort_order: item.sort_order,
            source_type: item.source_type,
            source_id: item.source_id,
            points: item.points,
          };

          if (item.source_type === "exercise" && item.source_id) {
            const { data: ex } = await supabase
              .from("exercises")
              .select("*")
              .eq("id", item.source_id)
              .single();
            enriched.exercise_data = ex;
          } else if (item.source_type === "problem" && item.source_id) {
            const { data: prob } = await supabase
              .from("problems")
              .select("id, title, description, test_cases, hint, difficulty")
              .eq("id", item.source_id)
              .single();
            enriched.problem_data = prob;
          } else if (item.source_type === "custom") {
            // RPC already returns custom data fields inline
            enriched.exercise_data = {
              type: item.item_type,
              question: item.question,
              options: item.options,
              blanks: item.blanks,
              lines: item.lines,
              pairs: item.pairs,
              statement: item.statement,
              code_template: item.code_template,
            };
          }

          enrichedItems.push(enriched);
        }

        setItems(enrichedItems);

        // Set timer
        if (assignment.tests.time_limit_minutes) {
          const startedAt = existingSub?.started_at || new Date().toISOString();
          const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
          const total = assignment.tests.time_limit_minutes * 60;
          setTimeLeft(Math.max(0, total - elapsed));
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("Eroare la încărcarea testului.");
        setLoading(false);
      }
    };
    load();
  }, [assignmentId, user]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, submitted]);

  const setAnswer = (itemId: string, data: any) => {
    setAnswers((prev) => ({ ...prev, [itemId]: data }));
  };

  const handleSubmit = useCallback(async () => {
    if (!submissionId || submitted) return;
    setSubmitted(true);
    try {
      const answersList = items.map((item) => ({
        test_item_id: item.id,
        answer_data: answers[item.id] || null,
        max_points: item.points,
      }));
      await submitTest.mutateAsync({ submission_id: submissionId, answers: answersList });
      toast.success("Test trimis! Notarea se face automat.");
    } catch {
      toast.error("Eroare la trimiterea testului.");
      setSubmitted(false);
    }
  }, [submissionId, submitted, items, answers, submitTest]);

  if (loading) return <LoadingScreen />;

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="p-6 text-center space-y-4">
            <div className="text-4xl">✅</div>
            <h2 className="text-lg font-bold text-foreground">Test trimis!</h2>
            <p className="text-sm text-muted-foreground">Vei vedea nota după ce profesorul o publică.</p>
            <Button onClick={() => navigate("/")} className="w-full">Înapoi acasă</Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const currentItem = items[currentIdx];
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/")} className="active:scale-90 transition-transform">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-foreground truncate">{testInfo?.tests?.title || "Test"}</h1>
            <p className="text-[10px] text-muted-foreground">{currentIdx + 1}/{items.length}</p>
          </div>
          {timeLeft !== null && (
            <div className={`flex items-center gap-1 text-sm font-mono font-bold ${timeLeft < 60 ? "text-destructive" : "text-foreground"}`}>
              <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
            </div>
          )}
        </div>
        <Progress value={((currentIdx + 1) / items.length) * 100} className="h-1" />
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {currentItem && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {currentItem.points} puncte
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {currentItem.source_type === "exercise" || currentItem.source_type === "custom"
                    ? "Exercițiu"
                    : currentItem.source_type === "problem" ? "Problemă" : "Exercițiu"}
                </span>
              </div>

              {/* Render based on type */}
              {(currentItem.source_type === "exercise" || currentItem.source_type === "custom") && currentItem.exercise_data && (
                <ExerciseRenderer
                  exercise={currentItem.exercise_data}
                  answer={answers[currentItem.id]}
                  onAnswer={(data) => setAnswer(currentItem.id, data)}
                />
              )}

              {currentItem.source_type === "problem" && currentItem.problem_data && (
                <ProblemRenderer
                  problem={currentItem.problem_data}
                  answer={answers[currentItem.id]}
                  onAnswer={(data) => setAnswer(currentItem.id, data)}
                  allowRunTests={testInfo?.tests?.allow_run_tests ?? false}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>

          {currentIdx < items.length - 1 ? (
            <Button size="sm" onClick={() => setCurrentIdx(currentIdx + 1)}>
              Următorul <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={submitTest.isPending} className="gap-1">
              <Send className="h-4 w-4" /> Trimite testul
            </Button>
          )}
        </div>

        {/* Quick nav dots */}
        <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
          {items.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setCurrentIdx(idx)}
              className={`w-6 h-6 rounded-full text-[10px] font-medium transition-colors ${
                idx === currentIdx
                  ? "bg-primary text-primary-foreground"
                  : answers[item.id]
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </main>
    </motion.div>
  );
};

// Exercise renderer for quiz, truefalse, fill, order, match
const ExerciseRenderer = ({ exercise, answer, onAnswer }: { exercise: any; answer: any; onAnswer: (d: any) => void }) => {
  const type = exercise.type;

  if (type === "quiz") {
    const options = (exercise.options || []) as { id: string; text: string }[];
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{exercise.question}</p>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onAnswer({ selected: opt.id })}
            className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
              answer?.selected === opt.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-foreground hover:border-primary/50"
            }`}
          >
            {opt.text}
          </button>
        ))}
      </div>
    );
  }

  if (type === "truefalse") {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">{exercise.statement || exercise.question}</p>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              onClick={() => onAnswer({ selected: val })}
              className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
                answer?.selected === val
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {val ? "Adevărat" : "Fals"}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (type === "fill") {
    const blanks = (exercise.blanks || []) as { id: string; answer: string }[];
    const codeTemplate = exercise.code_template || exercise.codeTemplate || "";
    const currentAnswers = answer?.blanks || {};

    const renderCodeWithBlanks = () => {
      if (!codeTemplate) {
        return blanks.map((blank, idx) => (
          <Input
            key={blank.id}
            placeholder={`Spațiu ${idx + 1}`}
            value={currentAnswers[blank.id] || ""}
            onChange={(e) => onAnswer({ blanks: { ...currentAnswers, [blank.id]: e.target.value } })}
            className="text-sm"
          />
        ));
      }
      const parts = codeTemplate.split("___");
      return (
        <pre className="bg-muted/50 border border-border rounded-lg p-3 mb-2 whitespace-pre-wrap font-mono text-sm text-foreground">
          {parts.map((part: string, i: number) => (
            <span key={i}>
              <span>{part}</span>
              {i < parts.length - 1 && blanks[i] && (
                <Input
                  autoCapitalize="none"
                  className="inline-block w-28 h-7 mx-1 font-mono text-sm bg-secondary border-primary/50 text-primary"
                  value={currentAnswers[blanks[i].id] || ""}
                  onChange={(e) => onAnswer({ blanks: { ...currentAnswers, [blanks[i].id]: e.target.value } })}
                  placeholder={"_".repeat(blanks[i].answer.length)}
                />
              )}
            </span>
          ))}
        </pre>
      );
    };

    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">{exercise.question}</p>
        {renderCodeWithBlanks()}
      </div>
    );
  }

  if (type === "order") {
    const lines = (exercise.lines || []) as { id: string; text: string }[];
    const ordered: string[] = answer?.order || lines.map((l) => l.id);
    const dragIdxRef = { current: null as number | null };

    const moveItem = (from: number, to: number) => {
      const newOrder = [...ordered];
      const [item] = newOrder.splice(from, 1);
      newOrder.splice(to, 0, item);
      onAnswer({ order: newOrder });
    };

    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{exercise.question}</p>
        <div className="space-y-2">
          {ordered.map((lineId: string, idx: number) => {
            const line = lines.find((l) => l.id === lineId);
            return (
              <div
                key={lineId}
                draggable
                onDragStart={() => { dragIdxRef.current = idx; }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragIdxRef.current !== null && dragIdxRef.current !== idx) {
                    moveItem(dragIdxRef.current, idx);
                    dragIdxRef.current = idx;
                  }
                }}
                onDragEnd={() => { dragIdxRef.current = null; }}
                className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card text-sm font-mono cursor-grab active:cursor-grabbing select-none touch-none"
              >
                <span className="text-muted-foreground shrink-0">≡</span>
                <code className="text-foreground whitespace-pre-wrap break-words flex-1">{line?.text || lineId}</code>
                <div className="ml-auto flex gap-1">
                  <button
                    onClick={() => idx > 0 && moveItem(idx, idx - 1)}
                    disabled={idx === 0}
                    className="text-base text-muted-foreground hover:text-foreground disabled:opacity-30 px-1"
                  >▲</button>
                  <button
                    onClick={() => idx < ordered.length - 1 && moveItem(idx, idx + 1)}
                    disabled={idx === ordered.length - 1}
                    className="text-base text-muted-foreground hover:text-foreground disabled:opacity-30 px-1"
                  >▼</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === "match") {
    const pairs = (exercise.pairs || []) as { id: string; left: string; right: string }[];
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{exercise.question}</p>
        {pairs.map((pair) => (
          <div key={pair.id} className="flex items-center gap-2 text-xs">
            <span className="bg-muted px-2 py-1 rounded flex-1">{pair.left}</span>
            <span className="text-muted-foreground">→</span>
            <Input
              value={answer?.matches?.[pair.id] || ""}
              onChange={(e) => onAnswer({ matches: { ...(answer?.matches || {}), [pair.id]: e.target.value } })}
              placeholder={pair.right}
              className="flex-1 h-7 text-xs"
            />
          </div>
        ))}
      </div>
    );
  }

  // Fallback
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{exercise.question}</p>
      <Textarea
        placeholder="Scrie răspunsul tău..."
        value={answer?.text || ""}
        onChange={(e) => onAnswer({ text: e.target.value })}
      />
    </div>
  );
};

// Problem renderer (code) — with optional Pyodide test runner
const ProblemRenderer = ({ problem, answer, onAnswer, allowRunTests }: { problem: any; answer: any; onAnswer: (d: any) => void; allowRunTests: boolean }) => {
  const { loading: pyLoading, running, runCode } = usePyodide();
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const visibleTests = (problem.test_cases || []).filter((tc: any) => !tc.hidden);

  const handleRun = async () => {
    const code = answer?.code || "";
    if (!code.trim()) { toast.error("Scrie cod înainte de a rula."); return; }
    const results = await runCode(code, visibleTests.map((tc: any) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput || tc.expected_output || tc.expected,
      hidden: false,
    })));
    setTestResults(results);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground">{problem.title}</h3>
      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{problem.description}</p>
      {problem.hint && (
        <p className="text-[10px] text-muted-foreground italic">💡 {problem.hint}</p>
      )}
      <Textarea
        placeholder="Scrie codul Python aici..."
        value={answer?.code || ""}
        onChange={(e) => onAnswer({ code: e.target.value })}
        className="font-mono text-xs min-h-[200px]"
      />
      {allowRunTests && visibleTests.length > 0 && (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRun}
            disabled={running || pyLoading}
            className="gap-1.5"
          >
            {running || pyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {pyLoading ? "Se încarcă..." : running ? "Rulează..." : "Rulează teste"}
          </Button>
          {testResults.length > 0 && (
            <div className="space-y-1.5">
              {testResults.map((r, i) => (
                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${r.passed ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                  {r.passed ? <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <p className="font-mono text-muted-foreground">Input: {r.input}</p>
                    <p className="font-mono text-muted-foreground">Așteptat: {r.expectedOutput}</p>
                    {!r.passed && <p className="font-mono text-foreground">Primit: {r.error || r.actualOutput}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TakeTestPage;
