import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useChapters } from "@/hooks/useChapters";
import { useProblems } from "@/hooks/useProblems";
import { useCreateTest, useUpdateTest, useTestItems, useTeacherTests, TestItem } from "@/hooks/useTests";
import { useSubscription } from "@/hooks/useSubscription";
import { usePredefinedTests, usePredefinedTestItems } from "@/hooks/usePredefinedTests";
import { ArrowLeft, Plus, Trash2, BookOpen, Code, GripVertical, PenLine, FileCheck, Copy, ChevronDown, ChevronRight, Eye, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const MAX_AI_ITEMS_PER_TEST = 3;
const MAX_TESTS_PER_MONTH = 10;

interface TestBuilderProps {
  onBack: () => void;
  editTestId?: string | null;
  teacherStatus?: string | null;
}

// Predefined test templates are now loaded from the database

// Custom question type definitions
type CustomQuestionType = "quiz" | "truefalse" | "fill" | "order";

interface CustomOption {
  id: string;
  text: string;
}

const TestBuilder = ({ onBack, editTestId, teacherStatus }: TestBuilderProps) => {
  const { data: chapters = [] } = useChapters();
  const { data: problemsData } = useProblems();
  const allProblems = problemsData?.problems ?? [];
  const problemChapters = problemsData?.problemChapters ?? [];
  const createTest = useCreateTest();
  const updateTest = useUpdateTest();
  const { data: existingItems = [] } = useTestItems(editTestId || null);
  const { data: allTests = [] } = useTeacherTests();
  const { isTeacherPremium } = useSubscription();
  const { data: predefinedTests = [] } = usePredefinedTests();
  const isEditing = !!editTestId;

  const [title, setTitle] = useState("");
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(false);
  const [timeLimit, setTimeLimit] = useState(45);
  const [variantMode, setVariantMode] = useState<string>("shuffle");
  const [items, setItems] = useState<TestItem[]>([]);
  const [allowRunTests, setAllowRunTests] = useState(false);
  const [editLoaded, setEditLoaded] = useState(false);

  // Browser state
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [selectedProblemChapterId, setSelectedProblemChapterId] = useState<string>("");
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const [previewVariantKey, setPreviewVariantKey] = useState<string | null>(null);
  const dragIdxRef = useRef<number | null>(null);
  const variantDragRef = useRef<{ variant: string; fromIdx: number } | null>(null);

  // Custom question editor state
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [customType, setCustomType] = useState<CustomQuestionType>("quiz");
  const [customQuestion, setCustomQuestion] = useState("");
  const [customOptions, setCustomOptions] = useState<CustomOption[]>([
    { id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" },
  ]);
  const [customCorrectId, setCustomCorrectId] = useState("a");
  const [customStatement, setCustomStatement] = useState("");
  const [customIsTrue, setCustomIsTrue] = useState(true);
  const [customBlanks, setCustomBlanks] = useState<{ id: string; answer: string }[]>([{ id: "1", answer: "" }]);
  const [customLines, setCustomLines] = useState<{ id: string; text: string; order: number }[]>([
    { id: "1", text: "", order: 0 },
    { id: "2", text: "", order: 1 },
    { id: "3", text: "", order: 2 },
  ]);
  const [customFillQuestion, setCustomFillQuestion] = useState("");

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  // Count problem items (AI-graded) in current test
  const problemItemCount = items.filter(i => i.source_type === "problem").length;

  // Count tests created this month
  const testsThisMonth = allTests.filter(t => {
    const created = new Date(t.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const canCreateMoreTests = isEditing || !isTeacherPremium || testsThisMonth < MAX_TESTS_PER_MONTH;

  const addItem = (sourceType: string, sourceId: string | null, variant: string = "both", customData: any = null) => {
    if (sourceId && items.some((i) => i.source_id === sourceId && i.source_type === sourceType)) {
      toast.info("Itemul este deja adăugat.");
      return;
    }
    // Check AI item limit for problems
    if (sourceType === "problem" && isTeacherPremium && problemItemCount >= MAX_AI_ITEMS_PER_TEST) {
      toast.error(`Limita de ${MAX_AI_ITEMS_PER_TEST} probleme AI/test a fost atinsă.`);
      return;
    }
    setItems([...items, {
      variant,
      sort_order: items.length,
      source_type: sourceType,
      source_id: sourceId,
      custom_data: customData,
      points: 10,
    }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItemPoints = (idx: number, points: number) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], points };
    setItems(updated);
  };

  const updateItemVariant = (idx: number, variant: string) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], variant };
    setItems(updated);
  };

  const getItemLabel = (item: TestItem): string => {
    if (item.source_type === "custom" && item.custom_data) {
      return (item.custom_data.question || item.custom_data.statement || "Întrebare custom").substring(0, 60);
    }
    if (item.source_type === "exercise" && item.source_id) {
      for (const ch of chapters) {
        const lesson = ch.lessons.find((l) => l.exercises?.some((e) => e.id === item.source_id));
        if (lesson) {
          const ex = lesson.exercises?.find((e) => e.id === item.source_id);
          return ex?.question?.substring(0, 60) || item.source_id;
        }
      }
    }
    if (item.source_type === "problem" && item.source_id) {
      const p = allProblems.find((pr) => pr.id === item.source_id);
      return p?.title || item.source_id;
    }
    return item.source_id || "Custom";
  };

  const getItemIcon = (item: TestItem) => {
    if (item.source_type === "custom") return <PenLine className="h-3 w-3 text-warning shrink-0" />;
    if (item.source_type === "exercise") return <BookOpen className="h-3 w-3 text-primary shrink-0" />;
    return <Code className="h-3 w-3 text-accent-foreground shrink-0" />;
  };

  // Get exercise details for preview
  const getExerciseDetails = (exerciseId: string) => {
    for (const ch of chapters) {
      for (const lesson of ch.lessons) {
        const ex = lesson.exercises?.find((e) => e.id === exerciseId);
        if (ex) return ex;
      }
    }
    return null;
  };

  // Get problem details for preview
  const getProblemDetails = (problemId: string) => {
    return allProblems.find((p) => p.id === problemId) || null;
  };

  // Render exercise preview
  const renderExercisePreview = (ex: any) => {
    if (!ex) return null;
    return (
      <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50 space-y-2">
        <p className="text-xs font-medium text-foreground">{ex.question || ex.statement}</p>
        {ex.type === "quiz" && ex.options && (
          <div className="space-y-1">
            {(ex.options as any[]).map((opt: any) => (
              <div key={opt.id} className="text-[11px] px-2 py-1 text-muted-foreground">
                {opt.id?.toUpperCase?.() || "•"}) {opt.text}
              </div>
            ))}
          </div>
        )}
        {ex.type === "truefalse" && (
          <p className="text-[11px] text-muted-foreground">Adevărat / Fals</p>
        )}
        {ex.type === "fill" && ex.blanks && (
          <div className="space-y-0.5">
            {(ex.blanks as any[]).map((b: any, i: number) => (
              <p key={b.id || i} className="text-[11px] text-muted-foreground">Spațiu {i + 1}: ___</p>
            ))}
          </div>
        )}
        {ex.type === "order" && ex.lines && (
          <div className="space-y-0.5">
            {(ex.lines as any[]).map((l: any, i: number) => (
              <p key={l.id || i} className="text-[11px] font-mono text-muted-foreground">{i + 1}. {l.text}</p>
            ))}
          </div>
        )}
        {ex.type === "match" && ex.pairs && (
          <div className="space-y-0.5">
            {(ex.pairs as any[]).map((p: any) => (
              <p key={p.id} className="text-[11px] text-muted-foreground">{p.left} → ___</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render problem preview
  const renderProblemPreview = (prob: any) => {
    if (!prob) return null;
    return (
      <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50 space-y-2">
        <p className="text-xs font-bold text-foreground">{prob.title}</p>
        <p className="text-[11px] text-muted-foreground whitespace-pre-wrap line-clamp-4">{prob.description}</p>
        {prob.difficulty && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{prob.difficulty}</span>}
      </div>
    );
  };

  // Generic item preview renderer
  const renderItemPreview = (item: TestItem) => {
    if (item.source_type === "exercise" && item.source_id) {
      return renderExercisePreview(getExerciseDetails(item.source_id));
    }
    if (item.source_type === "problem" && item.source_id) {
      return renderProblemPreview(getProblemDetails(item.source_id));
    }
    if (item.source_type === "custom" && item.custom_data) {
      return renderExercisePreview(item.custom_data);
    }
    return null;
  };

  // Load existing test data when editing
  useEffect(() => {
    if (!isEditing || editLoaded) return;
    const loadTest = async () => {
      const { data: test } = await (await import("@/integrations/supabase/client")).supabase
        .from("tests")
        .select("*")
        .eq("id", editTestId)
        .single();
      if (test) {
        setTitle(test.title);
        setVariantMode(test.variant_mode);
        setAllowRunTests(test.allow_run_tests ?? false);
        if (test.time_limit_minutes) {
          setTimeLimitEnabled(true);
          setTimeLimit(test.time_limit_minutes);
        }
      }
    };
    loadTest();
  }, [isEditing, editTestId, editLoaded]);

  // Load existing items when they arrive
  useEffect(() => {
    if (!isEditing || editLoaded || existingItems.length === 0) return;
    setItems(existingItems.map((ei: any) => ({
      id: ei.id,
      test_id: ei.test_id,
      variant: ei.variant,
      sort_order: ei.sort_order,
      source_type: ei.source_type,
      source_id: ei.source_id,
      custom_data: ei.custom_data,
      points: ei.points,
    })));
    setEditLoaded(true);
  }, [isEditing, existingItems, editLoaded]);

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Adaugă un titlu."); return; }
    if (items.length === 0) { toast.error("Adaugă cel puțin un item."); return; }
    if (!isEditing && isTeacherPremium && testsThisMonth >= MAX_TESTS_PER_MONTH) {
      toast.error(`Ai atins limita de ${MAX_TESTS_PER_MONTH} teste/lună. Vei putea crea altele luna viitoare.`);
      return;
    }
    try {
      if (isEditing) {
        await updateTest.mutateAsync({
          id: editTestId!,
          title: title.trim(),
          time_limit_minutes: timeLimitEnabled ? timeLimit : null,
          variant_mode: variantMode,
          items,
        });
        toast.success("Test actualizat!");
      } else {
        await createTest.mutateAsync({
          title: title.trim(),
          time_limit_minutes: timeLimitEnabled ? timeLimit : null,
          variant_mode: variantMode,
          items,
        });
        toast.success("Test creat cu succes!");
      }
      onBack();
    } catch {
      toast.error(isEditing ? "Eroare la actualizarea testului." : "Eroare la crearea testului.");
    }
  };

  // Apply a predefined test template from the database
  const applyPredefinedTemplate = async (template: any) => {
    setTitle(template.title);
    if (template.time_limit_minutes) { setTimeLimitEnabled(true); setTimeLimit(template.time_limit_minutes); }
    setVariantMode(template.variant_mode);
    // Fetch items for this predefined test
    const { data: predefinedItems } = await (await import("@/integrations/supabase/client")).supabase
      .from("predefined_test_items")
      .select("*")
      .eq("test_id", template.id)
      .order("sort_order");
    if (!predefinedItems || predefinedItems.length === 0) {
      toast.info("Acest test nu are itemi definiți.");
      return;
    }
    // Convert eval_exercise items to exercise-compatible format
    const newItems: TestItem[] = predefinedItems.map((pi: any, i: number) => ({
      variant: pi.variant,
      sort_order: i,
      source_type: pi.source_type === "eval_exercise" ? "exercise" : pi.source_type,
      source_id: pi.source_id,
      custom_data: pi.custom_data,
      points: pi.points,
    }));
    setItems(newItems);
    toast.success(`${newItems.length} itemi adăugați din testul predefinit.`);
  };

  // Add custom question
  const addCustomQuestion = () => {
    let customData: any = null;

    if (customType === "quiz") {
      if (!customQuestion.trim() || customOptions.some((o) => !o.text.trim())) {
        toast.error("Completează întrebarea și toate opțiunile.");
        return;
      }
      customData = {
        type: "quiz",
        question: customQuestion,
        options: customOptions.map((o) => ({ id: o.id, text: o.text })),
        correct_option_id: customCorrectId,
      };
    } else if (customType === "truefalse") {
      if (!customStatement.trim()) {
        toast.error("Completează afirmația.");
        return;
      }
      customData = {
        type: "truefalse",
        question: customStatement,
        statement: customStatement,
        is_true: customIsTrue,
      };
    } else if (customType === "fill") {
      if (!customFillQuestion.trim() || customBlanks.some((b) => !b.answer.trim())) {
        toast.error("Completează întrebarea și răspunsurile.");
        return;
      }
      customData = {
        type: "fill",
        question: customFillQuestion,
        blanks: customBlanks,
      };
    } else if (customType === "order") {
      if (customLines.some((l) => !l.text.trim())) {
        toast.error("Completează toate liniile.");
        return;
      }
      customData = {
        type: "order",
        question: "Ordonează liniile de cod corect:",
        lines: customLines.map((l, i) => ({ ...l, order: i })),
      };
    }

    addItem("custom", null, "both", customData);
    resetCustomEditor();
    toast.success("Întrebare custom adăugată!");
  };

  const resetCustomEditor = () => {
    setCustomQuestion("");
    setCustomOptions([
      { id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" },
    ]);
    setCustomCorrectId("a");
    setCustomStatement("");
    setCustomIsTrue(true);
    setCustomBlanks([{ id: "1", answer: "" }]);
    setCustomLines([
      { id: "1", text: "", order: 0 },
      { id: "2", text: "", order: 1 },
      { id: "3", text: "", order: 2 },
    ]);
    setCustomFillQuestion("");
    setShowCustomEditor(false);
  };

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);
  const filteredProblems = allProblems.filter((p) => p.chapter === selectedProblemChapterId);

  // Independent variant order state
  const [variantOrderA, setVariantOrderA] = useState<number[]>([]);
  const [variantOrderB, setVariantOrderB] = useState<number[]>([]);

  // Sync variant orders when items change (add/remove/variant change)
  useEffect(() => {
    const indicesA = items.map((item, idx) => ({ item, idx })).filter(({ item }) => item.variant === "A" || item.variant === "both").map(({ idx }) => idx);
    const indicesB = items.map((item, idx) => ({ item, idx })).filter(({ item }) => item.variant === "B" || item.variant === "both").map(({ idx }) => idx);

    // Keep existing order for items that are still present, append new ones
    setVariantOrderA(prev => {
      const still = prev.filter(i => indicesA.includes(i));
      const added = indicesA.filter(i => !still.includes(i));
      return [...still, ...added];
    });
    setVariantOrderB(prev => {
      const still = prev.filter(i => indicesB.includes(i));
      const added = indicesB.filter(i => !still.includes(i));
      return [...still, ...added];
    });
  }, [items]);

  const variant1Items = variantOrderA.map(i => items[i]).filter(Boolean);
  const variant2Items = variantOrderB.map(i => items[i]).filter(Boolean);

  const reorderVariantOrder = (variant: string, fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const setter = variant === "A" ? setVariantOrderA : setVariantOrderB;
    setter(prev => {
      const reordered = [...prev];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      return reordered;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="active:scale-90 transition-transform">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="text-lg font-bold text-foreground">{isEditing ? "Editează test" : "Creează test"}</h2>
      </div>

      {/* Limits info for Profesor AI */}
      {isTeacherPremium && (
        <div className="flex flex-wrap gap-2">
          <div className={`text-xs px-2 py-1 rounded-full border ${testsThisMonth >= MAX_TESTS_PER_MONTH ? 'border-destructive/50 bg-destructive/10 text-destructive' : 'border-border bg-muted text-muted-foreground'}`}>
            Teste luna aceasta: {testsThisMonth}/{MAX_TESTS_PER_MONTH}
          </div>
          <div className={`text-xs px-2 py-1 rounded-full border ${problemItemCount >= MAX_AI_ITEMS_PER_TEST ? 'border-destructive/50 bg-destructive/10 text-destructive' : 'border-border bg-muted text-muted-foreground'}`}>
            Probleme AI: {problemItemCount}/{MAX_AI_ITEMS_PER_TEST}
          </div>
        </div>
      )}

      {/* Config */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Input
            placeholder="Titlul testului"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id="time-limit" checked={timeLimitEnabled} onCheckedChange={setTimeLimitEnabled} />
              <Label htmlFor="time-limit" className="text-sm">Limită de timp</Label>
            </div>
            {timeLimitEnabled && (
              <Input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-20 h-8 text-sm"
                min={5}
                max={180}
              />
            )}
            {timeLimitEnabled && <span className="text-xs text-muted-foreground">minute</span>}
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Variante:</Label>
            <Select value={variantMode} onValueChange={setVariantMode}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shuffle">Shuffle automat</SelectItem>
                <SelectItem value="manual">2 seturi manuale</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="allow-run-tests" checked={allowRunTests} onCheckedChange={setAllowRunTests} />
            <Label htmlFor="allow-run-tests" className="text-sm">Permite rularea testelor la probleme</Label>
          </div>
        </CardContent>

      {/* Item source tabs */}
      <Tabs defaultValue={teacherStatus === "verified" ? "templates" : "exercises"} className="w-full">
        <TabsList className="w-full">
          {teacherStatus === "verified" && (
            <TabsTrigger value="templates" className="flex-1 text-xs gap-1">
              <FileCheck className="h-3 w-3" /> Predefinite
            </TabsTrigger>
          )}
          <TabsTrigger value="exercises" className="flex-1 text-xs gap-1">
            <BookOpen className="h-3 w-3" /> Exerciții
          </TabsTrigger>
          <TabsTrigger value="problems" className="flex-1 text-xs gap-1">
            <Code className="h-3 w-3" /> Probleme
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex-1 text-xs gap-1">
            <PenLine className="h-3 w-3" /> Custom
          </TabsTrigger>
        </TabsList>

        {/* Templates tab - only for verified teachers */}
        <TabsContent value="templates" className="space-y-2 mt-2">
          <p className="text-xs text-muted-foreground">Duplică un test predefinit în testul tău. Poți personaliza itemii, punctajele și timpul după duplicare.</p>
          {predefinedTests.length === 0 && <p className="text-xs text-muted-foreground italic">Nu există teste predefinite încă.</p>}
          {predefinedTests.map((tmpl) => (
            <div
              key={tmpl.id}
              className="w-full p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{tmpl.title}</p>
                  <p className="text-[10px] text-muted-foreground">{tmpl.description}</p>
                  <div className="flex gap-1 mt-1">
                    <span className="text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary">{tmpl.difficulty}</span>
                    {tmpl.time_limit_minutes && <span className="text-[9px] px-1 py-0.5 rounded bg-accent/10 text-accent-foreground">{tmpl.time_limit_minutes} min</span>}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1 shrink-0"
                  onClick={() => applyPredefinedTemplate(tmpl)}
                >
                  <Copy className="h-3 w-3" /> Duplică
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Exercises tab - collapsible by lesson */}
        <TabsContent value="exercises" className="space-y-2 mt-2">
          <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Alege capitol" />
            </SelectTrigger>
            <SelectContent>
              {chapters.map((ch) => (
                <SelectItem key={ch.id} value={ch.id}>{ch.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedChapter?.lessons.map((lesson) => (
            <Collapsible key={lesson.id} open={expandedLessons.has(lesson.id)} onOpenChange={() => toggleLesson(lesson.id)}>
              <CollapsibleTrigger className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                {expandedLessons.has(lesson.id)
                  ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                }
                <span className="text-xs font-medium text-foreground text-left flex-1">{lesson.title}</span>
                <span className="text-[10px] text-muted-foreground">{lesson.exercises?.length || 0} ex.</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1 mt-1">
                {lesson.exercises?.map((ex) => (
                  <div key={ex.id}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => addItem("exercise", ex.id)}
                        className="flex-1 text-left px-2 py-1.5 rounded-md text-xs text-foreground hover:bg-muted/80 transition-colors flex items-center gap-2 min-w-0"
                      >
                        <Plus className="h-3 w-3 text-primary shrink-0" />
                        <span className="truncate">{ex.question?.substring(0, 80)}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-auto">{ex.type}</span>
                      </button>
                      <button
                        onClick={() => setPreviewItemId(previewItemId === ex.id ? null : ex.id)}
                        className="p-1 text-muted-foreground hover:text-primary shrink-0"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {previewItemId === ex.id && renderExercisePreview(ex)}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </TabsContent>

        {/* Problems tab */}
        <TabsContent value="problems" className="space-y-2 mt-2">
          <Select value={selectedProblemChapterId} onValueChange={setSelectedProblemChapterId}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Alege capitol" />
            </SelectTrigger>
            <SelectContent>
              {problemChapters.map((ch) => (
                <SelectItem key={ch.id} value={ch.id}>{ch.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filteredProblems.map((prob) => (
            <div key={prob.id}>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => addItem("problem", prob.id)}
                  className="flex-1 text-left px-2 py-1.5 rounded-md text-xs text-foreground hover:bg-muted/80 transition-colors flex items-center gap-2 min-w-0"
                >
                  <Plus className="h-3 w-3 text-primary shrink-0" />
                  <span className="truncate">{prob.title}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-auto">{prob.difficulty}</span>
                </button>
                <button
                  onClick={() => setPreviewItemId(previewItemId === prob.id ? null : prob.id)}
                  className="p-1 text-muted-foreground hover:text-primary shrink-0"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
              </div>
              {previewItemId === prob.id && renderProblemPreview(prob)}
            </div>
          ))}
        </TabsContent>

        {/* Custom questions tab */}
        <TabsContent value="custom" className="space-y-3 mt-2">
          <p className="text-xs text-muted-foreground">Creează propriile întrebări.</p>

          {!showCustomEditor ? (
            <Button variant="outline" className="w-full gap-2" onClick={() => setShowCustomEditor(true)}>
              <Plus className="h-4 w-4" /> Adaugă întrebare custom
            </Button>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Tip:</Label>
                  <Select value={customType} onValueChange={(v) => setCustomType(v as CustomQuestionType)}>
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quiz">Quiz (variante)</SelectItem>
                      <SelectItem value="truefalse">Adevărat / Fals</SelectItem>
                      <SelectItem value="fill">Completare spații</SelectItem>
                      <SelectItem value="order">Ordonare linii</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quiz editor */}
                {customType === "quiz" && (
                  <>
                    <Textarea
                      placeholder="Întrebarea..."
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      className="text-xs min-h-[60px]"
                    />
                    {customOptions.map((opt, idx) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <button
                          onClick={() => setCustomCorrectId(opt.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            customCorrectId === opt.id
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {opt.id.toUpperCase()}
                        </button>
                        <Input
                          value={opt.text}
                          onChange={(e) => {
                            const updated = [...customOptions];
                            updated[idx] = { ...updated[idx], text: e.target.value };
                            setCustomOptions(updated);
                          }}
                          placeholder={`Opțiunea ${opt.id.toUpperCase()}`}
                          className="h-7 text-xs"
                        />
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground">Apasă pe litera din stânga pentru a marca răspunsul corect.</p>
                  </>
                )}

                {/* True/False editor */}
                {customType === "truefalse" && (
                  <>
                    <Textarea
                      placeholder="Afirmația..."
                      value={customStatement}
                      onChange={(e) => setCustomStatement(e.target.value)}
                      className="text-xs min-h-[60px]"
                    />
                    <div className="flex items-center gap-3">
                      <Label className="text-xs">Răspuns corect:</Label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={customIsTrue ? "default" : "outline"}
                          onClick={() => setCustomIsTrue(true)}
                          className="h-7 text-xs"
                        >
                          Adevărat
                        </Button>
                        <Button
                          size="sm"
                          variant={!customIsTrue ? "default" : "outline"}
                          onClick={() => setCustomIsTrue(false)}
                          className="h-7 text-xs"
                        >
                          Fals
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Fill editor */}
                {customType === "fill" && (
                  <>
                    <Textarea
                      placeholder="Întrebarea (ex: Funcția ___ returnează lungimea unei liste)"
                      value={customFillQuestion}
                      onChange={(e) => setCustomFillQuestion(e.target.value)}
                      className="text-xs min-h-[60px]"
                    />
                    <p className="text-[10px] text-muted-foreground">Răspunsuri acceptate (separate prin virgulă pentru variante):</p>
                    {customBlanks.map((blank, idx) => (
                      <div key={blank.id} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-12 shrink-0">Spațiu {idx + 1}</span>
                        <Input
                          value={blank.answer}
                          onChange={(e) => {
                            const updated = [...customBlanks];
                            updated[idx] = { ...updated[idx], answer: e.target.value };
                            setCustomBlanks(updated);
                          }}
                          placeholder="len, len()"
                          className="h-7 text-xs"
                        />
                        {customBlanks.length > 1 && (
                          <button onClick={() => setCustomBlanks(customBlanks.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCustomBlanks([...customBlanks, { id: String(customBlanks.length + 1), answer: "" }])}
                      className="text-xs gap-1"
                    >
                      <Plus className="h-3 w-3" /> Adaugă spațiu
                    </Button>
                  </>
                )}

                {/* Order editor */}
                {customType === "order" && (
                  <>
                    <p className="text-[10px] text-muted-foreground">Scrie liniile de cod în ordinea corectă. Elevul le va primi amestecate.</p>
                    {customLines.map((line, idx) => (
                      <div key={line.id} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-6 shrink-0 text-center">{idx + 1}.</span>
                        <Input
                          value={line.text}
                          onChange={(e) => {
                            const updated = [...customLines];
                            updated[idx] = { ...updated[idx], text: e.target.value };
                            setCustomLines(updated);
                          }}
                          placeholder={`Linia ${idx + 1}`}
                          className="h-7 text-xs font-mono"
                        />
                        {customLines.length > 2 && (
                          <button onClick={() => setCustomLines(customLines.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCustomLines([...customLines, { id: String(customLines.length + 1), text: "", order: customLines.length }])}
                      className="text-xs gap-1"
                    >
                      <Plus className="h-3 w-3" /> Adaugă linie
                    </Button>
                  </>
                )}

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={resetCustomEditor} className="flex-1 text-xs">
                    Anulează
                  </Button>
                  <Button size="sm" onClick={addCustomQuestion} className="flex-1 text-xs">
                    Adaugă
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Selected items */}
      {items.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Itemi selectați ({items.length})</p>
            {items.map((item, idx) => {
              const itemKey = `sel-${idx}`;
              return (
                <div key={idx}>
                  <div
                    className="flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1.5 cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={() => { dragIdxRef.current = idx; }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragIdxRef.current === null || dragIdxRef.current === idx) return;
                      const reordered = [...items];
                      const [moved] = reordered.splice(dragIdxRef.current, 1);
                      reordered.splice(idx, 0, moved);
                      dragIdxRef.current = idx;
                      setItems(reordered.map((it, i) => ({ ...it, sort_order: i })));
                    }}
                    onDragEnd={() => { dragIdxRef.current = null; }}
                  >
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {getItemIcon(item)}
                      <span className="text-xs text-foreground truncate">{getItemLabel(item)}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewItemId(previewItemId === itemKey ? null : itemKey); }}
                      className="p-1 text-muted-foreground hover:text-primary"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    <Input
                      type="number"
                      value={item.points}
                      onChange={(e) => updateItemPoints(idx, Number(e.target.value))}
                      className="w-14 h-6 text-[10px] text-center"
                      min={1}
                    />
                    <span className="text-[10px] text-muted-foreground">pct</span>
                    {variantMode === "manual" && (
                      <Select value={item.variant} onValueChange={(v) => updateItemVariant(idx, v)}>
                        <SelectTrigger className="h-6 w-16 text-[10px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="both">Ambele</SelectItem>
                          <SelectItem value="A">Nr. 1</SelectItem>
                          <SelectItem value="B">Nr. 2</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <button onClick={() => removeItem(idx)} className="p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  {previewItemId === itemKey && renderItemPreview(item)}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Side-by-side variant preview */}
      {items.length > 0 && variantMode === "shuffle" && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              🔀 Elevii vor primi același test cu întrebările în ordine aleatorie.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Side-by-side variant preview — only for manual mode */}
      {items.length > 0 && variantMode === "manual" && (
        <div className="grid grid-cols-2 gap-3">
          {(["A", "B"] as const).map((variant) => {
            const vItems = variant === "A" ? variant1Items : variant2Items;
            const label = variant === "A" ? "Nr. 1" : "Nr. 2";
            const prefix = variant === "A" ? "v1" : "v2";
            return (
              <Card key={variant}>
                <CardContent className="p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-foreground">{label} <span className="text-muted-foreground font-normal">({vItems.length} itemi)</span></p>
                  {vItems.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic">Niciun item</p>
                  ) : (
                    vItems.map((item, idx) => {
                      const vKey = `${prefix}-${idx}`;
                      return (
                        <div key={idx}>
                          <div
                            className="flex items-center gap-1.5 text-[11px] text-foreground py-0.5 cursor-grab active:cursor-grabbing"
                            draggable
                            onDragStart={() => { variantDragRef.current = { variant, fromIdx: idx }; }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (!variantDragRef.current || variantDragRef.current.variant !== variant || variantDragRef.current.fromIdx === idx) return;
                              reorderVariantOrder(variant, variantDragRef.current.fromIdx, idx);
                              variantDragRef.current = { variant, fromIdx: idx };
                            }}
                            onDragEnd={() => { variantDragRef.current = null; }}
                          >
                            <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground w-4 shrink-0 text-right">{idx + 1}.</span>
                            {getItemIcon(item)}
                            <span className="truncate flex-1">{getItemLabel(item)}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setPreviewVariantKey(previewVariantKey === vKey ? null : vKey); }}
                              className="p-0.5 text-muted-foreground hover:text-primary shrink-0"
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                            <span className="text-[10px] text-muted-foreground shrink-0">{item.points}p</span>
                          </div>
                          {previewVariantKey === vKey && renderItemPreview(item)}
                        </div>
                      );
                    })
                  )}
                  <div className="border-t border-border pt-1 mt-1">
                    <p className="text-[10px] text-muted-foreground">Total: <span className="font-medium text-foreground">{vItems.reduce((s, i) => s + i.points, 0)} puncte</span></p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Button onClick={handleSave} disabled={createTest.isPending || updateTest.isPending} className="w-full">
        {createTest.isPending || updateTest.isPending
          ? "Se salvează..."
          : isEditing
            ? `Salvează modificările (${items.length} itemi)`
            : `Creează test (${items.length} itemi)`}
      </Button>
    </div>
  );
};

export default TestBuilder;
