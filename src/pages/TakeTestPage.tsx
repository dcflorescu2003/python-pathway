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
import { useStartSubmission, useSubmitTest, saveSubmissionDraft, markSubmissionInterrupted, incrementLeaveCount } from "@/hooks/useTests";
import { usePyodide, TestResult } from "@/hooks/usePyodide";
import { ArrowLeft, Clock, ChevronLeft, ChevronRight, Send, Play, CheckCircle, XCircle, Loader2, Link2, RotateCcw, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import CodeEditor from "@/components/CodeEditor";
import RichContent from "@/components/RichContent";
import { shuffleOrderIds } from "@/lib/orderShuffle";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [assignedSlot, setAssignedSlot] = useState<{ variant: string; roster_number: number | null } | null>(null);
  const [noItemsReason, setNoItemsReason] = useState<"window_expired" | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator === "undefined" ? true : navigator.onLine);
  const [pendingDraftSync, setPendingDraftSync] = useState<boolean>(false);



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
        // Get assignment + test info (include anti_cheat_mode)
        const { data: assignment } = await supabase
          .from("test_assignments")
          .select("*, tests(id, title, time_limit_minutes, variant_mode, allow_run_tests, require_fullscreen, anti_cheat_mode)")
          .eq("id", assignmentId)
          .single();

        if (!assignment) { navigate("/"); return; }

        setTestInfo(assignment);

        // Check existing submission (may be in_progress / interrupted / submitted)
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

        // Client-side window check: only kick out students who haven't started yet.
        // Students with an in-progress submission continue on their own test timer.
        if (assignment.window_minutes && !existingSub) {
          const deadline = new Date(new Date(assignment.assigned_at).getTime() + assignment.window_minutes * 60000);
          if (deadline < new Date()) {
            toast.error("Testul a expirat.");
            navigate("/");
            return;
          }
        }


        // If teacher hasn't cleared an "interrupted" submission and time already ran out,
        // finalize automatically instead of letting the student open it again forever.
        if (existingSub && (existingSub as any).status === "interrupted") {
          toast.info(
            "Reluăm testul întrerupt. Răspunsurile tale sunt salvate și cronometrul continuă de unde a rămas. Dacă timpul a expirat, roagă profesorul să apese „Permite continuarea” în pagina de rezultate.",
            { duration: 8000 }
          );
        }

        // Assign variant + roster number deterministically by alphabetical position within the class
        // (first student -> nr.1/A, second -> nr.2/B, third -> nr.3/A, ...).
        let variant: string = "A";
        let rosterNumber: number | null = null;
        try {
          const { data: slotRows, error: slotErr } = await supabase
            .rpc("get_assigned_slot_for_student", { p_assignment_id: assignmentId });
          const slot = Array.isArray(slotRows) ? slotRows[0] : slotRows;
          if (!slotErr && slot) {
            if (slot.variant === "A" || slot.variant === "B") variant = slot.variant;
            if (typeof slot.roster_number === "number") rosterNumber = slot.roster_number;
          }
        } catch (e) {
          console.error("Slot assignment RPC failed, defaulting to A:", e);
        }

        let subId: string;

        if (existingSub) {
          subId = existingSub.id;
          setAssignedSlot({
            variant: existingSub.variant || variant,
            roster_number: (existingSub as any).roster_number ?? rosterNumber,
          });
        } else {
          const result = await startSubmission.mutateAsync({
            assignment_id: assignmentId,
            variant,
            roster_number: rosterNumber,
          });
          subId = result.id;
          setAssignedSlot({ variant, roster_number: rosterNumber });
        }
        setSubmissionId(subId);

        const usedVariant = existingSub?.variant || variant;


        // Hydrate answers from server-side draft (survives device swaps / cleared localStorage)
        const serverDraft = (existingSub as any)?.draft_answers;
        if (serverDraft && typeof serverDraft === "object") {
          setAnswers((prev) => ({ ...serverDraft, ...prev }));
        }

        // Get test items via RPC (bypasses RLS)
        const { data: testItems, error: rpcError } = await supabase
          .rpc("get_test_items_for_student", {
            p_assignment_id: assignmentId,
            p_variant: usedVariant,
          });

        if (rpcError) throw rpcError;
        if (!testItems || testItems.length === 0) {
          setNoItemsReason("window_expired");
          setLoading(false);
          return;
        }

        // Shuffle items if shuffle mode
        let orderedItems = testItems;
        if (assignment.tests.variant_mode === "shuffle") {
          orderedItems = [...testItems].sort(() => Math.random() - 0.5);
        }

        // Bucket source_ids by type for batched fetching
        const exerciseIds: string[] = [];
        const problemIds: string[] = [];
        const evalIds: string[] = [];
        for (const item of orderedItems) {
          const isEvalBank = typeof item.source_id === "string" && item.source_id.startsWith("eval-");
          if (!item.source_id) continue;
          if (isEvalBank) evalIds.push(item.source_id);
          else if (item.source_type === "exercise") exerciseIds.push(item.source_id);
          else if (item.source_type === "problem") problemIds.push(item.source_id);
        }

        // Fetch all in parallel
        const [exRes, probRes, evalResArr] = await Promise.all([
          exerciseIds.length
            ? supabase.rpc("get_exercises_for_student", { p_ids: exerciseIds })
            : Promise.resolve({ data: [] as any[] } as any),

          problemIds.length
            ? supabase
                .from("problems")
                .select("id, title, description, test_cases, hint, difficulty")
                .in("id", problemIds)
            : Promise.resolve({ data: [] as any[] } as any),
          // Eval bank RPC is per-id; still parallelize
          Promise.all(
            evalIds.map((id) =>
              supabase.rpc("get_eval_exercise_for_student", { p_id: id }).then((r) => ({ id, rows: r.data as any[] }))
            )
          ),
        ]);
        const exMap = new Map<string, any>((exRes.data || []).map((e: any) => [e.id, e]));
        const probMap = new Map<string, any>((probRes.data || []).map((p: any) => [p.id, p]));
        const evalMap = new Map<string, any>(
          (evalResArr as any[]).map((r) => [r.id, Array.isArray(r.rows) ? r.rows[0] : null])
        );

        const enrichedItems: TestItemData[] = orderedItems.map((item) => {
          const enriched: TestItemData = {
            id: item.id,
            sort_order: item.sort_order,
            source_type: item.source_type,
            source_id: item.source_id,
            points: item.points,
          };
          const isEvalBank = typeof item.source_id === "string" && item.source_id.startsWith("eval-");

          if (item.source_type === "exercise" && item.source_id && !isEvalBank) {
            enriched.exercise_data = exMap.get(item.source_id);
          } else if (item.source_type === "problem" && item.source_id && !isEvalBank) {
            enriched.problem_data = probMap.get(item.source_id);
          } else if (isEvalBank && item.source_id) {
            const ev = evalMap.get(item.source_id);
            if (ev) {
              if (ev.type === "problem") {
                enriched.source_type = "problem";
                enriched.problem_data = {
                  id: ev.id,
                  title: "",
                  description: ev.question,
                  test_cases: ev.test_cases,
                  hint: null,
                  difficulty: null,
                } as any;
              } else {
                enriched.source_type = "exercise";
                enriched.exercise_data = ev as any;
              }
            }
          } else if (item.source_type === "custom") {
            enriched.exercise_data = {
              type: (item as any).item_type,
              question: (item as any).question,
              options: (item as any).options,
              blanks: (item as any).blanks,
              lines: (item as any).lines,
              pairs: (item as any).pairs,
              statement: (item as any).statement,
              code_template: (item as any).code_template,
            };
          }

          return enriched;
        });

        setItems(enrichedItems);

        // Set timer using started_at (survives resume: remaining time is preserved automatically)
        if (assignment.tests.time_limit_minutes) {
          const startedAt = existingSub?.started_at || new Date().toISOString();
          const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
          const total = assignment.tests.time_limit_minutes * 60;
          setTimeLeft(Math.max(0, total - elapsed));
        }


        setLoading(false);
      } catch (err: any) {
        console.error(err);
        const msg = err?.message || err?.error_description || err?.details || "eroare necunoscută";
        toast.error(`Eroare la încărcarea testului: ${msg}`);
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
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) accessTokenRef.current = data.session?.access_token ?? null;
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      accessTokenRef.current = session?.access_token ?? null;
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Periodic save every 30s + save on visibilitychange (localStorage + server draft)
  // Marks pendingDraftSync when the server draft fails, so we can retry on reconnect.
  useEffect(() => {
    if (!draftKey || submitted || !submissionId) return;
    const saveDraft = async () => {
      try { localStorage.setItem(draftKey, JSON.stringify(answersRef.current)); } catch {}
      try {
        await saveSubmissionDraft(submissionId, answersRef.current);
        setPendingDraftSync(false);
      } catch {
        setPendingDraftSync(true);
      }
    };
    const interval = setInterval(saveDraft, 30_000);
    const onVis = () => { if (document.hidden) void saveDraft(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVis); };
  }, [draftKey, submitted, submissionId]);

  // Track network connectivity + flush pending draft on reconnect. Autosave
  // continues to update localStorage even offline; the server flush happens
  // as soon as we're back online.
  useEffect(() => {
    if (!submissionId || submitted) return;
    const onOnline = async () => {
      setIsOnline(true);
      try {
        await saveSubmissionDraft(submissionId, answersRef.current);
        setPendingDraftSync(false);
        toast.success("Conexiune restabilită. Răspunsurile au fost sincronizate.");
      } catch {
        setPendingDraftSync(true);
      }
    };
    const onOffline = () => {
      setIsOnline(false);
      toast.warning("Fără conexiune. Răspunsurile se salvează local și se vor trimite la reconectare.");
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [submissionId, submitted]);

  // Screen Wake Lock: keep the screen on during the test so a screen-off event
  // isn't misinterpreted as a leave, and so students don't lose focus mid-answer.
  useEffect(() => {
    if (!submissionId || submitted) return;
    const anyNav = navigator as any;
    if (!anyNav?.wakeLock?.request) return;
    let wakeLock: any = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        wakeLock = await anyNav.wakeLock.request("screen");
        wakeLock?.addEventListener?.("release", () => {
          // Re-acquire silently if released while the test is still active
          if (!cancelled && !document.hidden) void acquire();
        });
      } catch { /* wake lock not permitted — ignore */ }
    };
    const onVis = () => { if (!document.hidden) void acquire(); };
    void acquire();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      try { wakeLock?.release?.(); } catch {}
    };
  }, [submissionId, submitted]);

  // Block copy/paste on the test surface (except within the code editor, which
  // students legitimately need to edit). Toast the first time in each session
  // so students understand why nothing happened.
  useEffect(() => {
    if (!submissionId || submitted) return;
    let toastedPaste = false;
    let toastedCopy = false;
    const isInsideCodeEditor = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      return !!el?.closest?.("[data-code-editor]");
    };
    const onPaste = (e: ClipboardEvent) => {
      if (isInsideCodeEditor(e.target)) return;
      e.preventDefault();
      if (!toastedPaste) {
        toastedPaste = true;
        toast.warning("Lipirea din clipboard nu este permisă în timpul testului.");
      }
    };
    const onCopy = (e: ClipboardEvent) => {
      if (isInsideCodeEditor(e.target)) return;
      e.preventDefault();
      if (!toastedCopy) {
        toastedCopy = true;
        toast.warning("Copierea din enunț nu este permisă în timpul testului.");
      }
    };
    document.addEventListener("paste", onPaste, { capture: true });
    document.addEventListener("copy", onCopy, { capture: true });
    return () => {
      document.removeEventListener("paste", onPaste, { capture: true } as any);
      document.removeEventListener("copy", onCopy, { capture: true } as any);
    };
  }, [submissionId, submitted]);



  // Clean up draft after successful submit
  useEffect(() => {
    if (submitted && draftKey) {
      try { localStorage.removeItem(draftKey); } catch {}
    }
  }, [submitted, draftKey]);

  // --- sendBeacon on beforeunload (browser close / crash) ---
  useEffect(() => {
    if (!submissionId || submitted) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      // Skip prompt entirely if the test has already been submitted
      if (submittedRef.current) return;
      // Don't re-fire the beacon if a submit is already in-flight, but still prompt
      if (submitInFlightRef.current) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
      // Save draft as last resort
      if (draftKey) {
        try { localStorage.setItem(draftKey, JSON.stringify(answersRef.current)); } catch {}
      }
      // Try to submit with keepalive and auth headers. sendBeacon cannot attach
      // Authorization, so it used to leave some tests submitted-but-ungraded.
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
        const token = accessTokenRef.current;
        if (token) {
          fetch(`https://${projectId}.supabase.co/functions/v1/grade-submission`, {
            method: "POST",
            keepalive: true,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: payload,
          }).catch(() => {});
        }
      } catch {}
      window.setTimeout(() => {
        if (!submittedRef.current) submitInFlightRef.current = false;
      }, 1000);
      // Show the browser's native "Leave site?" prompt so a stray tab close /
      // gesture doesn't drop the student out of the test silently.
      e.preventDefault();
      e.returnValue = "";
      return "";
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
      // Retry submit up to 3 times on flaky networks (backoff 2s / 5s / 10s)
      const backoffs = [0, 2000, 5000, 10000];
      let lastErr: unknown = null;
      let ok = false;
      for (let attempt = 0; attempt < backoffs.length; attempt++) {
        if (backoffs[attempt] > 0) await new Promise((r) => setTimeout(r, backoffs[attempt]));
        try {
          await submitTest.mutateAsync({
            submission_id: submissionId,
            answers: answersList,
            auto_submitted_reason: autoReason ?? null,
          });
          ok = true;
          break;
        } catch (err) {
          lastErr = err;
          if (attempt < backoffs.length - 1) {
            toast.info(`Reîncerc trimiterea testului… (${attempt + 1}/${backoffs.length - 1})`);
          }
        }
      }
      if (!ok) throw lastErr ?? new Error("submit_failed");
      toast.success("Test trimis! Notarea se face automat.");
    } catch {
      // Network / server failure — preserve everything so the student can resume later
      try { if (submissionId) await saveSubmissionDraft(submissionId, answersRef.current); } catch {}
      if (submissionId) markSubmissionInterrupted(submissionId);
      toast.error(
        "Nu am putut trimite testul (probabil conexiune slabă). Răspunsurile sunt salvate pe server. Verifică internetul și încearcă din nou. Dacă timpul a expirat între timp, roagă profesorul să apese „Permite continuarea” în pagina de rezultate ca să poți finaliza.",
        { duration: 10000 }
      );
      setSubmitted(false);
      submitInFlightRef.current = false;
    }
  }, [submissionId, submitted, items, answers, submitTest]);


  // Anti-cheat mode: strict = 1s + final submit; normal = 3s + final submit;
  // relaxed = 5s + save-as-interrupted (student can resume).
  const antiCheatMode: "strict" | "normal" | "relaxed" =
    (testInfo?.tests?.anti_cheat_mode as any) || "normal";
  const leaveGraceMs = antiCheatMode === "strict" ? 1000 : antiCheatMode === "normal" ? 3000 : 5000;

  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);

  // Leave detection — behavior depends on anti_cheat_mode
  useEffect(() => {
    if (!submissionId || submitted) return;

    let leaveTimeout: ReturnType<typeof setTimeout> | null = null;
    const hasFiredRef = { current: false };

    const triggerLeave = (reason: string) => {
      if (hasFiredRef.current) return;
      if (leaveTimeout) return;
      leaveTimeout = setTimeout(async () => {
        if (hasFiredRef.current) return;
        hasFiredRef.current = true;
        // Always record the leave for teacher visibility
        incrementLeaveCount(submissionId).catch(() => {});
        if (antiCheatMode === "relaxed") {
          // Save & mark interrupted; student can resume from another device / when they return
          try { await saveSubmissionDraft(submissionId, answersRef.current); } catch {}
          await markSubmissionInterrupted(submissionId);
          toast.warning(
            "Ai părăsit testul. L-am salvat pe server — poți reveni de pe orice dispozitiv. Atenție: cronometrul continuă să ruleze. Dacă expiră între timp, cere profesorului să apese „Permite continuarea”.",
            { duration: 9000 }
          );
          navigate("/");
        } else {
          toast.error(
            antiCheatMode === "strict"
              ? "Test trimis automat — ai părăsit aplicația mai mult de 1 secundă."
              : "Test trimis automat — ai părăsit aplicația mai mult decât permite timpul de grație."
          );
          handleSubmitRef.current(reason);
        }
      }, leaveGraceMs);
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

    // Polling fallback: on web use document.hasFocus(); on native use Capacitor App.getState()
    // (Android WebView returns true from document.hasFocus() even when the notification shade is open).
    const isNative = Capacitor.isNativePlatform();
    let capAppRef: any = null;
    const focusPollInterval = setInterval(async () => {
      if (hasFiredRef.current) return;
      if (isNative) {
        try {
          if (!capAppRef) capAppRef = (await import("@capacitor/app")).App;
          const state = await capAppRef.getState();
          if (!state?.isActive) triggerLeave("app_inactive_poll");
        } catch { /* ignore */ }
      } else {
        if (!document.hasFocus()) triggerLeave("focus_poll_lost");
        else cancelLeave();
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

    // Stability-gated cancel: only cancel the leave timeout if focus stays for >500ms.
    // This prevents a quick "pull-and-release" of the notification shade from silently
    // cancelling the autosubmit timer before leaveGraceMs expires.
    let stableCancelTimeout: ReturnType<typeof setTimeout> | null = null;
    const stableCancel = () => {
      if (stableCancelTimeout) clearTimeout(stableCancelTimeout);
      stableCancelTimeout = setTimeout(() => { cancelLeave(); }, 500);
    };
    const armLeave = () => {
      if (stableCancelTimeout) { clearTimeout(stableCancelTimeout); stableCancelTimeout = null; }
    };

    // Capacitor app state (mobile background) + pause/resume + backButton
    let capListener: { remove: () => void } | null = null;
    let capPauseListener: { remove: () => void } | null = null;
    let capResumeListener: { remove: () => void } | null = null;
    let capBackListener: { remove: () => void } | null = null;
    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", (state: { isActive: boolean }) => {
          if (!state.isActive) { armLeave(); triggerLeave("app_background"); }
          else stableCancel();
        });
        capListener = handle;
        const pauseHandle = await App.addListener("pause" as any, () => {
          armLeave(); triggerLeave("app_pause");
        });
        capPauseListener = pauseHandle;
        const resumeHandle = await App.addListener("resume" as any, () => {
          stableCancel();
        });
        capResumeListener = resumeHandle;
        // Intercept hardware/gesture back so students can't accidentally exit the test.
        const backHandle = await App.addListener("backButton" as any, () => {
          setShowLeaveConfirm(true);
        });
        capBackListener = backHandle;
      } catch {
        // @capacitor/app not available (web) — ignore
      }
    })();

    // Native Android bridge: listen for window focus lost/gained from MainActivity
    const onNativeFocusLost = () => { armLeave(); triggerLeave("native_window_focus_lost"); };
    const onNativeFocusGained = () => stableCancel();
    window.addEventListener("pyro:native_focus_lost", onNativeFocusLost);
    window.addEventListener("pyro:native_focus_gained", onNativeFocusGained);

    return () => {
      cancelLeave();
      if (stableCancelTimeout) clearTimeout(stableCancelTimeout);
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
      capBackListener?.remove();
    };
  }, [submissionId, submitted, requireFullscreen, antiCheatMode, leaveGraceMs, navigate]);

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

  // Intercept browser/OS back gesture so students don't accidentally exit the test.
  useEffect(() => {
    if (!submissionId || submitted) return;
    // Push a sentinel state so the first back-gesture pops into it (staying on this page).
    try { window.history.pushState({ pyroTestGuard: true }, ""); } catch {}
    const onPopState = () => {
      // Re-push the sentinel and show the confirmation dialog.
      try { window.history.pushState({ pyroTestGuard: true }, ""); } catch {}
      setShowLeaveConfirm(true);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [submissionId, submitted]);

  const confirmLeaveTest = useCallback(async () => {
    setShowLeaveConfirm(false);
    if (submissionId) {
      try { await saveSubmissionDraft(submissionId, answersRef.current); } catch {}
      try { await markSubmissionInterrupted(submissionId); } catch {}
    }
    navigate("/");
  }, [submissionId, navigate]);

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

  if (noItemsReason === "window_expired") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Testul nu mai este disponibil</h2>
            <p className="text-sm text-muted-foreground">
              Fereastra de începere a expirat. Contactează profesorul pentru redeschidere sau prelungire.
            </p>
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
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[var(--sat)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="shrink-0 active:scale-90 transition-transform"
            aria-label="Închide testul"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-foreground truncate">{testInfo?.tests?.title || "Test"}</h1>
            <p className="text-[10px] text-muted-foreground">{currentIdx + 1}/{items.length}</p>
          </div>
          {timeLeft !== null && (
            <div className={`shrink-0 flex items-center gap-1 text-sm font-mono font-bold ${timeLeft < 60 ? "text-destructive" : "text-foreground"}`}>
              <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
            </div>
          )}
        </div>
        {assignedSlot && (
          <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
            {assignedSlot.roster_number != null && (
              <span className="text-[10px] font-semibold bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 rounded-full">
                Nr. {assignedSlot.roster_number}
              </span>
            )}
            <span className="text-[10px] font-semibold bg-accent/50 text-foreground border border-border px-2 py-0.5 rounded-full">
              Varianta {assignedSlot.variant}
            </span>
          </div>
        )}
        <Progress value={((currentIdx + 1) / items.length) * 100} className="h-1" />

      </header>

      {(!isOnline || pendingDraftSync) && (
        <div className={`sticky top-[calc(var(--sat)+52px)] z-30 px-4 py-2 text-xs font-medium flex items-center gap-2 border-b ${
          !isOnline
            ? "bg-destructive/15 text-destructive border-destructive/30"
            : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
        }`}>
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {!isOnline
              ? "Fără conexiune — răspunsurile se salvează local și vor fi trimise la reconectare."
              : "Se așteaptă sincronizarea răspunsurilor cu serverul…"}
          </span>
        </div>
      )}

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
            <Button size="sm" onClick={() => handleSubmit()} disabled={submitTest.isPending || !isOnline} className="gap-1">
              <Send className="h-4 w-4" /> {isOnline ? "Trimite testul" : "Fără conexiune"}
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

      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ieși din test?</AlertDialogTitle>
            <AlertDialogDescription>
              Răspunsurile tale sunt salvate, dar testul va fi marcat ca întrerupt. Cronometrul continuă să ruleze — dacă expiră, cere profesorului să apese „Permite continuarea" pentru a-l relua.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Rămân în test</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeaveTest}>Ies din test</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

// Exercise renderer for quiz, truefalse, fill, order, match
const ExerciseRenderer = ({ exercise, answer, onAnswer }: { exercise: any; answer: any; onAnswer: (d: any) => void }) => {
  const type = exercise.type;

  if (type === "quiz") {
    const options = (exercise.options || []) as { id: string; text: string }[];
    const codeTemplate = exercise.code_template || exercise.codeTemplate || "";
    return (
      <div className="space-y-2" role="radiogroup" aria-label={exercise.question}>
        <RichContent className="text-sm font-medium text-foreground">{exercise.question}</RichContent>
        {codeTemplate && (
          <pre className="bg-muted/50 border border-border rounded-lg p-3 whitespace-pre-wrap font-mono text-sm text-foreground">
            {codeTemplate}
          </pre>
        )}
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
    const tfCode = exercise.code_template || exercise.codeTemplate || "";
    return (
      <div className="space-y-3" role="radiogroup" aria-label={exercise.statement || exercise.question}>
        <RichContent className="text-sm font-medium text-foreground">{exercise.statement || exercise.question}</RichContent>
        {tfCode && (
          <pre className="bg-muted/50 border border-border rounded-lg p-3 whitespace-pre-wrap font-mono text-sm text-foreground">
            {tfCode}
          </pre>
        )}
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
                  placeholder="_____"
                />
              )}
            </span>
          ))}
        </pre>
      );
    };

    return (
      <div className="space-y-3">
        <RichContent className="text-sm font-medium text-foreground">{exercise.question}</RichContent>
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
      <RichContent className="text-sm font-medium text-foreground">{exercise.question}</RichContent>
      <div data-code-editor>
        <CodeEditor
          placeholder="Scrie răspunsul tău..."
          value={answer?.text || ""}
          onChange={(val) => onAnswer({ text: val })}
        />
      </div>
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
        <RichContent className="text-sm font-medium text-foreground">{exercise.question}</RichContent>
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
  const sourceIds = lines.map((l) => l.id);

  // Defensive shuffle: never show the lines in the order they arrived (which may
  // be the correct one). Seeded so it stays stable across re-renders.
  const shuffledIds = useMemo(
    () => shuffleOrderIds(sourceIds, `${exercise.id ?? ""}|${sourceIds.join(",")}`),
    [exercise.id, sourceIds.join(",")]
  );

  const ordered: string[] = answer?.order || shuffledIds;

  // Persist the initial shuffled arrangement as the draft answer, so the order
  // survives navigation between questions and draft sync.
  useEffect(() => {
    if (!answer?.order && shuffledIds.length > 0) {
      onAnswer({ order: shuffledIds });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuffledIds.join(","), answer?.order]);

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
      <RichContent className="text-sm font-medium text-foreground">{exercise.question}</RichContent>
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
  const { loading: pyLoading, running, runCode, runStaticChecks } = usePyodide();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [staticResults, setStaticResults] = useState<{ description: string; passed: boolean; hidden?: boolean }[]>([]);

  // Support both legacy array shape and wrapper { kind, testCases, staticChecks }.
  const raw = problem.test_cases;
  const isWrapper = raw && !Array.isArray(raw) && typeof raw === "object";
  const kind: "execute" | "static" = isWrapper && raw.kind === "static" ? "static" : "execute";
  const rawTestCases: any[] = isWrapper ? (raw.testCases || []) : Array.isArray(raw) ? raw : [];
  const staticChecks: any[] = isWrapper ? (raw.staticChecks || []) : [];

  const visibleTests = rawTestCases.filter((tc: any) => !tc.hidden);

  const handleRun = async () => {
    const code = answer?.code || "";
    if (!code.trim()) { toast.error("Scrie cod înainte de a rula."); return; }
    if (kind === "static") {
      setStaticResults(runStaticChecks(code, staticChecks));
      return;
    }
    const results = await runCode(code, visibleTests.map((tc: any) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput ?? tc.expected_output ?? tc.expected,
      inputFiles: tc.inputFiles,
      expectedFiles: tc.expectedFiles,
      hidden: false,
    })));
    setTestResults(results);
  };

  const canRun = allowRunTests && (kind === "static" ? staticChecks.length > 0 : visibleTests.length > 0);

  return (
    <div className="space-y-3" role="group" aria-label={`Problemă: ${problem.title}`}>
      <h3 className="text-sm font-bold text-foreground">{problem.title}</h3>
      <RichContent className="text-xs text-muted-foreground">{problem.description}</RichContent>
      {problem.hint && (
        <p className="text-[10px] text-muted-foreground italic">💡 {problem.hint}</p>
      )}
      <div data-code-editor>
        <CodeEditor
          placeholder="Scrie codul Python aici..."
          value={answer?.code || ""}
          onChange={(val) => onAnswer({ code: val })}
        />
      </div>

      {canRun && (
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
            {pyLoading ? "Se încarcă..." : running ? "Rulează..." : kind === "static" ? "Verifică" : "Rulează teste"}
          </Button>
          {kind === "execute" && testResults.length > 0 && (
            <div className="space-y-1.5" role="list" aria-label="Rezultatele testelor">
              {testResults.map((r, i) => (
                <div key={i} role="listitem" aria-label={`Test ${i + 1}: ${r.passed ? "trecut" : "picat"}`} className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${r.passed ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
                  {r.passed ? <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" aria-hidden="true" /> : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />}
                  <div className="min-w-0">
                    {r.input && <p className="font-mono text-muted-foreground">Input: {r.input}</p>}
                    {r.expectedOutput && <p className="font-mono text-muted-foreground">Așteptat: {r.expectedOutput}</p>}
                    {r.fileResults && r.fileResults.map((f, j) => (
                      <p key={j} className={`font-mono ${f.passed ? "text-muted-foreground" : "text-destructive"}`}>
                        {f.name}: {f.passed ? "OK" : f.missing ? "lipsește" : "diferit"}
                      </p>
                    ))}
                    {!r.passed && <p className="font-mono text-foreground">{r.error ? `Eroare: ${r.error}` : `Primit: ${r.actualOutput || "(gol)"}`}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {kind === "static" && staticResults.length > 0 && (
            <div className="space-y-1.5" role="list" aria-label="Verificări statice">
              {staticResults.filter((s) => !s.hidden).map((s, i) => (
                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${s.passed ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
                  {s.passed ? <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /> : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />}
                  <p className="text-foreground">{s.description}</p>
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
