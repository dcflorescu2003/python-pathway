import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChapters } from "@/hooks/useChapters";
import { useProblems } from "@/hooks/useProblems";
import { useCreateTest, TestItem } from "@/hooks/useTests";
import { ArrowLeft, Plus, Trash2, BookOpen, Code, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface TestBuilderProps {
  onBack: () => void;
}

const TestBuilder = ({ onBack }: TestBuilderProps) => {
  const { data: chapters = [] } = useChapters();
  const { data: problemsData } = useProblems();
  const allProblems = problemsData?.problems ?? [];
  const problemChapters = problemsData?.problemChapters ?? [];
  const createTest = useCreateTest();

  const [title, setTitle] = useState("");
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(false);
  const [timeLimit, setTimeLimit] = useState(45);
  const [variantMode, setVariantMode] = useState<string>("shuffle");
  const [items, setItems] = useState<TestItem[]>([]);

  // Browser state
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [selectedProblemChapterId, setSelectedProblemChapterId] = useState<string>("");

  const addItem = (sourceType: string, sourceId: string, variant: string = "both") => {
    // Avoid duplicates
    if (items.some((i) => i.source_id === sourceId && i.source_type === sourceType)) {
      toast.info("Itemul este deja adăugat.");
      return;
    }
    setItems([...items, {
      variant,
      sort_order: items.length,
      source_type: sourceType,
      source_id: sourceId,
      custom_data: null,
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

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("Adaugă un titlu."); return; }
    if (items.length === 0) { toast.error("Adaugă cel puțin un item."); return; }
    try {
      await createTest.mutateAsync({
        title: title.trim(),
        time_limit_minutes: timeLimitEnabled ? timeLimit : null,
        variant_mode: variantMode,
        items,
      });
      toast.success("Test creat cu succes!");
      onBack();
    } catch {
      toast.error("Eroare la crearea testului.");
    }
  };

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);
  const selectedProblemChapter = problemChapters.find((c) => c.id === selectedProblemChapterId);
  const filteredProblems = allProblems.filter((p) => p.chapter === selectedProblemChapterId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="active:scale-90 transition-transform">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="text-lg font-bold text-foreground">Creează test</h2>
      </div>

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
        </CardContent>
      </Card>

      {/* Item browser */}
      <Tabs defaultValue="exercises" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="exercises" className="flex-1 text-xs">Exerciții</TabsTrigger>
          <TabsTrigger value="problems" className="flex-1 text-xs">Probleme</TabsTrigger>
        </TabsList>

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
            <div key={lesson.id} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground px-1">{lesson.title}</p>
              {lesson.exercises?.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => addItem("exercise", ex.id)}
                  className="w-full text-left px-2 py-1.5 rounded-md text-xs text-foreground hover:bg-muted/80 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-3 w-3 text-primary shrink-0" />
                  <span className="truncate">{ex.question?.substring(0, 80)}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-auto">{ex.type}</span>
                </button>
              ))}
            </div>
          ))}
        </TabsContent>

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
            <button
              key={prob.id}
              onClick={() => addItem("problem", prob.id)}
              className="w-full text-left px-2 py-1.5 rounded-md text-xs text-foreground hover:bg-muted/80 transition-colors flex items-center gap-2"
            >
              <Plus className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate">{prob.title}</span>
              <span className="text-[10px] text-muted-foreground shrink-0 ml-auto">{prob.difficulty}</span>
            </button>
          ))}
        </TabsContent>
      </Tabs>

      {/* Selected items */}
      {items.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Itemi selectați ({items.length})</p>
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1.5">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {item.source_type === "exercise" ? (
                    <BookOpen className="h-3 w-3 text-primary shrink-0" />
                  ) : (
                    <Code className="h-3 w-3 text-accent-foreground shrink-0" />
                  )}
                  <span className="text-xs text-foreground truncate">{getItemLabel(item)}</span>
                </div>
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
                      <SelectItem value="A">Var. A</SelectItem>
                      <SelectItem value="B">Var. B</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <button onClick={() => removeItem(idx)} className="p-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button onClick={handleCreate} disabled={createTest.isPending} className="w-full">
        {createTest.isPending ? "Se creează..." : `Creează test (${items.length} itemi)`}
      </Button>
    </div>
  );
};

export default TestBuilder;
