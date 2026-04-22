import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Capacitor } from "@capacitor/core";
import { AlertTriangle } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStartSubmission, useSubmitTest } from "@/hooks/useTests";
import { usePyodide, TestResult } from "@/hooks/usePyodide";
import { ArrowLeft, Clock, ChevronLeft, ChevronRight, Send, Play, CheckCircle, XCircle, Loader2, Link2, RotateCcw, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import CodeEditor from "@/components/CodeEditor";
import LoadingScreen from "@/components/states/LoadingScreen";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

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
  const [fullscreenReady, setFullscreenReady] = useState(false);

  const requireFullscreen: boolean = !!testInfo?.tests?.require_fullscreen;
  // Mobile/Capacitor fallback: Fullscreen API doesn't exist reliably; treat as ready.
  const isFullscreenSupported = typeof document !== "undefined" && !!(document.documentElement as any).requestFullscreen;
  const needsFullscreenGate = requireFullscreen && isFullscreenSupported && !fullscreenReady;

  const enterFullscreen = useCallback(async () => {
    try {
      if ((document.documentElement as any).requestFullscreen) {
        await (document.documentElement as any).requestFullscreen();
      }
      setFullscreenReady(true);
    } catch {
      toast.error("Nu am putut activa modul fullscreen. Încearcă din nou.");
    }
  }, []);

  // Load test data
  useEffect(() => {
    if (!assignmentId || !user) return;
    const load = async () => {
      try {
        // Get assignment + test info
        const { data: assignment } = await supabase
          .from("test_assignments")
          .select("*, tests(id, title, time_limit_minutes, variant_mode, allow_run_tests, require_fullscreen)")
          .eq("id", assignmentId)
          .single();

        if (!assignment) { navigate("/"); return; }

        // Check window expiration on the client side
        if (assignment.window_minutes) {
          const deadline = new Date(new Date(assignment.assigned_at).getTime() + assignment.window_minutes * 60000);
          if (deadline < new Date()) {
            toast.error("Testul a expirat.");
            navigate("/");
            return;
          }
        }

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
          handleSubmit("time_expired");
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

  // --- Draft auto-save to localStorage ---
  const draftKey = submissionId ? `test_draft_${submissionId}` : null;

  // Restore draft on load
  useEffect(() => {
    if (!draftKey || submitted) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setAnswers((prev) => ({ ...parsed, ...prev }));
        }
      }
    } catch { /* ignore corrupt data */ }
  }, [draftKey, submitted]);

  // Keep refs for use in effects/callbacks
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);
  const submittedRef = useRef(submitted);
  useEffect(() => { submittedRef.current = submitted; }, [submitted]);

  // Single in-flight guard – set synchronously before any submit path fires
  const submitInFlightRef = useRef(false);

  // Periodic save every 30s + save on visibilitychange
  useEffect(() => {
    if (!draftKey || submitted) return;
    const saveDraft = () => {
      try { localStorage.setItem(draftKey, JSON.stringify(answersRef.current)); } catch {}
    };
    const interval = setInterval(saveDraft, 30_000);
    const onVis = () => { if (document.hidden) saveDraft(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVis); };
  }, [draftKey, submitted]);

  // Clean up draft after successful submit
  useEffect(() => {
    if (submitted && draftKey) {
      try { localStorage.removeItem(draftKey); } catch {}
    }
  }, [submitted, draftKey]);

  // --- sendBeacon on beforeunload (browser close / crash) ---
  useEffect(() => {
    if (!submissionId || submitted) return;
    const onBeforeUnload = () => {
      // Skip if already submitted or another submit path is in-flight
      if (submittedRef.current || submitInFlightRef.current) return;
      // Save draft as last resort
      if (draftKey) {
        try { localStorage.setItem(draftKey, JSON.stringify(answersRef.current)); } catch {}
      }
      // Try to submit via beacon
      submitInFlightRef.current = true;
      const answersList = itemsRef.current.map((item) => ({
        test_item_id: item.id,
        answer_data: answersRef.current[item.id] || null,
        max_points: item.points,
      }));
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const payload = JSON.stringify({
        submission_id: submissionId,
        answers: answersList,
        auto_submitted_reason: "browser_closed",
      });
      try {
        navigator.sendBeacon(
          `https://${projectId}.supabase.co/functions/v1/grade-submission`,
          new Blob([payload], { type: "application/json" })
        );
      } catch {}
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [submissionId, submitted, draftKey]);

  const handleSubmit = useCallback(async (autoReason?: string) => {
    if (!submissionId || submitted || submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    setSubmitted(true);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    try {
      const answersList = items.map((item) => ({
        test_item_id: item.id,
        answer_data: answers[item.id] || null,
        max_points: item.points,
      }));
      await submitTest.mutateAsync({
        submission_id: submissionId,
        answers: answersList,
        auto_submitted_reason: autoReason ?? null,
      });
      toast.success("Test trimis! Notarea se face automat.");
    } catch {
      toast.error("Eroare la trimiterea testului.");
      setSubmitted(false);
      submitInFlightRef.current = false;
    }
  }, [submissionId, submitted, items, answers, submitTest]);

  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);

  // Auto-submit when student leaves the app for >1s
  useEffect(() => {
    if (!submissionId || submitted) return;

    let leaveTimeout: ReturnType<typeof setTimeout> | null = null;
    const hasFiredRef = { current: false };

    const triggerLeave = (reason: string) => {
      if (hasFiredRef.current) return;
      if (leaveTimeout) return;
      leaveTimeout = setTimeout(() => {
        if (hasFiredRef.current) return;
        hasFiredRef.current = true;
        toast.error("Test trimis automat — ai părăsit aplicația mai mult de 1 secundă.");
        handleSubmitRef.current(reason);
      }, 1000);
    };

    const cancelLeave = () => {
      if (leaveTimeout) {
        clearTimeout(leaveTimeout);
        leaveTimeout = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) triggerLeave("tab_hidden");
      else cancelLeave();
    };
    const onBlur = () => triggerLeave("window_blur");
    const onFocus = () => cancelLeave();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    // Polling fallback: check document.hasFocus() every 2s
    // This catches notification shade on mobile where blur/visibilitychange may not fire
    const focusPollInterval = setInterval(() => {
      if (hasFiredRef.current) return;
      if (!document.hasFocus()) {
        triggerLeave("focus_poll_lost");
      } else {
        cancelLeave();
      }
    }, 2000);

    // Fullscreen exit triggers leave (only if test requires fullscreen)
    const onFullscreenChange = () => {
      if (!requireFullscreen) return;
      if (!document.fullscreenElement) triggerLeave("fullscreen_exit");
      else cancelLeave();
    };
    if (requireFullscreen) {
      document.addEventListener("fullscreenchange", onFullscreenChange);
    }

    // Capacitor app state (mobile background) + pause/resume
    let capListener: { remove: () => void } | null = null;
    let capPauseListener: { remove: () => void } | null = null;
    let capResumeListener: { remove: () => void } | null = null;
    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", (state: { isActive: boolean }) => {
          if (!state.isActive) triggerLeave("app_background");
          else cancelLeave();
        });
        capListener = handle;
        // pause/resume fire more reliably on Android notification shade
        const pauseHandle = await App.addListener("pause" as any, () => {
          triggerLeave("app_pause");
        });
        capPauseListener = pauseHandle;
        const resumeHandle = await App.addListener("resume" as any, () => {
          cancelLeave();
        });
        capResumeListener = resumeHandle;
      } catch {
        // @capacitor/app not available (web) — ignore
      }
    })();

    // Native Android bridge: listen for window focus lost/gained from MainActivity
    const onNativeFocusLost = () => triggerLeave("native_window_focus_lost");
    const onNativeFocusGained = () => cancelLeave();
    window.addEventListener("pyro:native_focus_lost", onNativeFocusLost);
    window.addEventListener("pyro:native_focus_gained", onNativeFocusGained);

    return () => {
      cancelLeave();
      clearInterval(focusPollInterval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pyro:native_focus_lost", onNativeFocusLost);
      window.removeEventListener("pyro:native_focus_gained", onNativeFocusGained);
      if (requireFullscreen) {
        document.removeEventListener("fullscreenchange", onFullscreenChange);
      }
      capListener?.remove();
      capPauseListener?.remove();
      capResumeListener?.remove();
    };
  }, [submissionId, submitted, requireFullscreen]);

  // Block suspicious shortcuts when fullscreen mode is enforced
  useEffect(() => {
    if (!requireFullscreen || !submissionId || submitted || needsFullscreenGate) return;

    let lastWarn = 0;
    const warn = (label: string) => {
      const now = Date.now();
      if (now - lastWarn < 1500) return;
      lastWarn = now;
      toast.warning(`Shortcut interzis în timpul testului: ${label}`);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key;
      const lk = k.toLowerCase();

      // Esc — exits fullscreen
      if (k === "Escape") { e.preventDefault(); e.stopPropagation(); warn("Esc"); return; }
      // F11 — toggles fullscreen
      if (k === "F11") { e.preventDefault(); e.stopPropagation(); warn("F11"); return; }
      // F12 — DevTools
      if (k === "F12") { e.preventDefault(); e.stopPropagation(); warn("F12 (DevTools)"); return; }
      // F5 — reload
      if (k === "F5") { e.preventDefault(); e.stopPropagation(); warn("F5 (reload)"); return; }

      if (mod) {
        // Ctrl/Cmd + Shift + I/J/C — DevTools
        if (e.shiftKey && (lk === "i" || lk === "j" || lk === "c")) {
          e.preventDefault(); e.stopPropagation(); warn(`${e.metaKey ? "Cmd" : "Ctrl"}+Shift+${k.toUpperCase()} (DevTools)`); return;
        }
        // Ctrl/Cmd + T/W/N/R
        if (["t", "w", "n", "r"].includes(lk)) {
          e.preventDefault(); e.stopPropagation();
          const map: Record<string, string> = { t: "tab nou", w: "închide tab", n: "fereastră nouă", r: "reload" };
          warn(`${e.metaKey ? "Cmd" : "Ctrl"}+${k.toUpperCase()} (${map[lk]})`);
          return;
        }
        // Ctrl/Cmd + Tab
        if (k === "Tab") { e.preventDefault(); e.stopPropagation(); warn("Ctrl/Cmd+Tab"); return; }
      }

      // Alt+Tab (best-effort, OS usually wins)
      if (e.altKey && k === "Tab") { e.preventDefault(); e.stopPropagation(); warn("Alt+Tab"); return; }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      warn("click dreapta");
    };

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("contextmenu", onContextMenu, { capture: true });
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
      window.removeEventListener("contextmenu", onContextMenu, { capture: true } as any);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [requireFullscreen, submissionId, submitted, needsFullscreenGate]);

  if (loading) return <LoadingScreen />;

  // Fullscreen gate (only shown when teacher requires fullscreen and browser supports it)
  if (needsFullscreenGate && !submitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Mod fullscreen obligatoriu</h2>
            <p className="text-sm text-muted-foreground">
              Profesorul a setat acest test să fie dat în mod fullscreen. Dacă ieși din fullscreen, schimbi fereastra sau părăsești aplicația mai mult de 1 secundă, testul va fi trimis automat.
            </p>
            <Button onClick={enterFullscreen} className="w-full">
              Începe testul în fullscreen
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
              Înapoi
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

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
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs text-foreground space-y-1">
            <p>Atenție: dacă părăsești aplicația sau schimbi fereastra mai mult de 1 secundă, testul va fi trimis automat.</p>
            {requireFullscreen && (
              <p>🛑 Shortcut-urile (Esc, F11, Ctrl/Cmd+T/W/R/N, F12) sunt blocate. Orice tentativă de ieșire trimite testul automat.</p>
            )}
          </div>
        </div>
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
            <Button size="sm" onClick={() => handleSubmit()} disabled={submitTest.isPending} className="gap-1">
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
      <div className="space-y-2" role="radiogroup" aria-label={exercise.question}>
        <p className="text-sm font-medium text-foreground" id="quiz-question">{exercise.question}</p>
        {options.map((opt) => (
          <button
            key={opt.id}
            role="radio"
            aria-checked={answer?.selected === opt.id}
            onClick={() => onAnswer({ selected: opt.id })}
            className={`w-full text-left p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              answer?.selected === opt.id
                ? "border-primary bg-primary/10 text-foreground scale-[1.01]"
                : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted/50"
            } active:scale-[0.97]`}
          >
            {opt.text}
          </button>
        ))}
      </div>
    );
  }

  if (type === "truefalse") {
    return (
      <div className="space-y-3" role="radiogroup" aria-label={exercise.statement || exercise.question}>
        <p className="text-sm font-medium text-foreground">{exercise.statement || exercise.question}</p>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              role="radio"
              aria-checked={answer?.selected === val}
              onClick={() => onAnswer({ selected: val })}
              className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                answer?.selected === val
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              } active:scale-[0.97]`}
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
            aria-label={`Răspuns pentru spațiul ${idx + 1}`}
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
                  aria-label={`Completează spațiul ${i + 1}`}
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
    return <TestOrderRenderer exercise={exercise} answer={answer} onAnswer={onAnswer} />;
  }

  if (type === "match") {
    return <TestMatchRenderer exercise={exercise} answer={answer} onAnswer={onAnswer} />;
  }

  // Fallback
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{exercise.question}</p>
      <CodeEditor
        placeholder="Scrie răspunsul tău..."
        value={answer?.text || ""}
        onChange={(val) => onAnswer({ text: val })}
      />
    </div>
  );
};

// Test-specific Match renderer (two-column tap-to-match, no submit button)
const TestMatchRenderer = ({ exercise, answer, onAnswer }: { exercise: any; answer: any; onAnswer: (d: any) => void }) => {
  const pairs = (exercise.pairs || []) as { id: string; left: string; right: string }[];
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [recentlyMatched, setRecentlyMatched] = useState<string | null>(null);

  const shuffledRight = useMemo(
    () => [...pairs].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercise.question]
  );

  // Derive matched map from answer state
  const matched = useMemo(() => {
    const m = new Map<string, string>();
    if (answer?.matches) {
      for (const [k, v] of Object.entries(answer.matches)) {
        m.set(k, v as string);
      }
    }
    return m;
  }, [answer?.matches]);

  const setMatched = (updater: (prev: Map<string, string>) => Map<string, string>) => {
    const next = updater(matched);
    const obj: Record<string, string> = {};
    next.forEach((v, k) => { obj[k] = v; });
    onAnswer({ matches: obj });
  };

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
  }, [matched, onAnswer]);

  const handleLeftClick = useCallback((id: string) => {
    if (matched.has(id)) {
      setMatched(prev => { const next = new Map(prev); next.delete(id); return next; });
      return;
    }
    if (selectedRight) {
      addMatch(id, selectedRight);
    } else {
      setSelectedLeft(prev => prev === id ? null : id);
    }
  }, [matched, selectedRight, addMatch]);

  const handleRightClick = useCallback((id: string) => {
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
  }, [matched, selectedLeft, addMatch]);

  const MATCHED_STYLE = "border-muted-foreground/30 bg-muted/50 text-muted-foreground shadow-sm opacity-70";

  const getLeftStyle = (id: string) => {
    if (matched.has(id)) return MATCHED_STYLE;
    if (selectedLeft === id) return "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary bg-primary/10 scale-[1.02]";
    return "border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/30";
  };

  const getRightStyle = (id: string) => {
    const isMatched = [...matched.values()].includes(id);
    if (isMatched) return MATCHED_STYLE;
    if (selectedRight === id) return "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary bg-primary/10 scale-[1.02]";
    return "border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/30";
  };

  const matchedCount = matched.size;
  const totalPairs = pairs.length;

  // Find the matched right text for a given left pair (for aria-label)
  const getMatchedRightText = (leftId: string) => {
    const rightId = matched.get(leftId);
    if (!rightId) return null;
    return pairs.find(p => p.id === rightId)?.right || shuffledRight.find(p => p.id === rightId)?.right;
  };

  return (
    <div className="space-y-5" role="group" aria-label="Exercițiu de asociere">
      <div>
        <p className="text-sm font-medium text-foreground">{exercise.question}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Selectează un element din stânga, apoi perechea lui din dreapta.
        </p>
      </div>

      {/* Progress indicator + reset */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={matchedCount} aria-valuemin={0} aria-valuemax={totalPairs} aria-label={`${matchedCount} din ${totalPairs} perechi asociate`}>
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(matchedCount / totalPairs) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums" aria-hidden="true">
          {matchedCount}/{totalPairs}
        </span>
        {matchedCount > 0 && (
          <button
            onClick={() => onAnswer({ matches: {} })}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Resetează toate perechile"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-2.5" role="application" aria-label="Coloane de asociere — apasă stânga apoi dreapta">
        {pairs.map((p, i) => {
          const isLeftMatched = matched.has(p.id);
          const isLeftSelected = selectedLeft === p.id;
          const matchedText = getMatchedRightText(p.id);
          const rightItem = shuffledRight[i];
          const rightMatchEntry = rightItem ? [...matched.entries()].find(([, v]) => v === rightItem.id) : null;
          const isRightMatched = !!rightMatchEntry;
          const isRightSelected = rightItem ? selectedRight === rightItem.id : false;
          const matchedLeftText = rightMatchEntry ? pairs.find(pp => pp.id === rightMatchEntry[0])?.left : null;

          return (
            <div key={p.id} className="grid grid-cols-2 gap-3">
              {/* Left item */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 400, damping: 25 }}
                role="option"
                aria-selected={isLeftSelected}
                aria-label={`${p.left}${isLeftMatched ? ` — asociat cu ${matchedText}. Apasă pentru a deface.` : isLeftSelected ? " — selectat" : ""}`}
                onClick={() => handleLeftClick(p.id)}
                className={`w-full rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all duration-200 text-left relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${getLeftStyle(p.id)} cursor-pointer active:scale-[0.97]`}
              >
                <div className="flex items-center gap-2">
                  {isLeftMatched && (
                    <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 20 }} aria-hidden="true">
                      <Link2 className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    </motion.span>
                  )}
                  <span className="flex-1">{p.left}</span>
                </div>
                <AnimatePresence>
                  {recentlyMatched === p.id && (
                    <motion.div initial={{ opacity: 0.5, scale: 0.5 }} animate={{ opacity: 0, scale: 2.5 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0 rounded-xl bg-primary/20 pointer-events-none" aria-hidden="true" />
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Right item */}
              {rightItem && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 400, damping: 25 }}
                  role="option"
                  aria-selected={isRightSelected}
                  aria-label={`${rightItem.right}${isRightMatched ? ` — asociat cu ${matchedLeftText}. Apasă pentru a deface.` : isRightSelected ? " — selectat" : ""}`}
                  onClick={() => handleRightClick(rightItem.id)}
                  className={`w-full rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all duration-200 text-left relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${getRightStyle(rightItem.id)} cursor-pointer active:scale-[0.97]`}
                >
                  <div className="flex items-center gap-2">
                    {rightMatchEntry && (
                      <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 20 }} aria-hidden="true">
                        <Link2 className="h-3.5 w-3.5 shrink-0 opacity-60" />
                      </motion.span>
                    )}
                    <span className="flex-1">{rightItem.right}</span>
                  </div>
                  <AnimatePresence>
                    {recentlyMatched && rightMatchEntry && rightMatchEntry[0] === recentlyMatched && (
                      <motion.div initial={{ opacity: 0.5, scale: 0.5 }} animate={{ opacity: 0, scale: 2.5 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0 rounded-xl bg-primary/20 pointer-events-none" aria-hidden="true" />
                    )}
                  </AnimatePresence>
                </motion.button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Sortable item for DnD order renderer
const SortableOrderItem = ({ id, lineText, idx, total, onMoveUp, onMoveDown }: {
  id: string; lineText: string; idx: number; total: number;
  onMoveUp: () => void; onMoveDown: () => void;
}) => {
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="listitem"
      aria-label={`Linia ${idx + 1}: ${lineText}`}
      className={`flex items-center gap-3 rounded-lg border border-border bg-card p-3 font-mono text-sm select-none ${isDragging ? "shadow-lg ring-2 ring-primary" : ""}`}
    >
      {/* Drag handle */}
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Trage pentru a muta „${lineText}"`}
        className="touch-none min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" aria-hidden="true" />
      </button>
      <code className="text-foreground whitespace-pre-wrap break-words flex-1">{lineText}</code>
      <div className="ml-auto flex gap-1" role="group" aria-label={`Mută linia ${idx + 1}`}>
        <button
          onClick={onMoveUp}
          disabled={idx === 0}
          aria-label={`Mută „${lineText}" în sus`}
          className="text-base text-muted-foreground hover:text-foreground disabled:opacity-30 px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >▲</button>
        <button
          onClick={onMoveDown}
          disabled={idx === total - 1}
          aria-label={`Mută „${lineText}" în jos`}
          className="text-base text-muted-foreground hover:text-foreground disabled:opacity-30 px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >▼</button>
      </div>
    </div>
  );
};

// Test-specific Order renderer with drag-and-drop + arrow fallback
const TestOrderRenderer = ({ exercise, answer, onAnswer }: { exercise: any; answer: any; onAnswer: (d: any) => void }) => {
  const lines = (exercise.lines || []) as { id: string; text: string }[];
  const ordered: string[] = answer?.order || lines.map((l) => l.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = ordered.indexOf(active.id as string);
      const newIndex = ordered.indexOf(over.id as string);
      onAnswer({ order: arrayMove(ordered, oldIndex, newIndex) });
    }
  };

  const moveItem = (from: number, to: number) => {
    const newOrder = [...ordered];
    const [item] = newOrder.splice(from, 1);
    newOrder.splice(to, 0, item);
    onAnswer({ order: newOrder });
  };

  return (
    <div className="space-y-2" role="group" aria-label="Exercițiu de ordonare">
      <p className="text-sm font-medium text-foreground">{exercise.question}</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={ordered} strategy={verticalListSortingStrategy}>
          <div className="space-y-2" role="list" aria-label="Linii de cod — trage sau folosește butoanele ▲ ▼">
            {ordered.map((lineId: string, idx: number) => {
              const line = lines.find((l) => l.id === lineId);
              const lineText = line?.text || lineId;
              return (
                <SortableOrderItem
                  key={lineId}
                  id={lineId}
                  lineText={lineText}
                  idx={idx}
                  total={ordered.length}
                  onMoveUp={() => idx > 0 && moveItem(idx, idx - 1)}
                  onMoveDown={() => idx < ordered.length - 1 && moveItem(idx, idx + 1)}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
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
    <div className="space-y-3" role="group" aria-label={`Problemă: ${problem.title}`}>
      <h3 className="text-sm font-bold text-foreground">{problem.title}</h3>
      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{problem.description}</p>
      {problem.hint && (
        <p className="text-[10px] text-muted-foreground italic">💡 {problem.hint}</p>
      )}
      <CodeEditor
        placeholder="Scrie codul Python aici..."
        value={answer?.code || ""}
        onChange={(val) => onAnswer({ code: val })}
      />
      {allowRunTests && visibleTests.length > 0 && (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRun}
            disabled={running || pyLoading}
            className="gap-1.5"
            aria-label={pyLoading ? "Se încarcă motorul Python" : running ? "Se rulează testele" : "Rulează testele"}
          >
            {running || pyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
            {pyLoading ? "Se încarcă..." : running ? "Rulează..." : "Rulează teste"}
          </Button>
          {testResults.length > 0 && (
            <div className="space-y-1.5" role="list" aria-label="Rezultatele testelor">
              {testResults.map((r, i) => (
                <div key={i} role="listitem" aria-label={`Test ${i + 1}: ${r.passed ? "trecut" : "picat"}`} className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${r.passed ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
                  {r.passed ? <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" aria-hidden="true" /> : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />}
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
