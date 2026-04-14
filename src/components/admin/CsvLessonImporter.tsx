import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileText, AlertCircle, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { parseLessonCSV, exerciseToDbRow, getLessonTemplateCSV, downloadCSV, type ParsedExercise } from "./csvParser";

interface CsvLessonImporterProps {
  /** "content" for lessons+exercises tables, "eval" for eval_lessons+eval_exercises */
  mode: "content" | "eval";
  chapterId: string;
  existingLessonCount: number;
  onSuccess: () => void;
}

const typeLabels: Record<string, string> = {
  quiz: "Quiz", fill: "Completare", order: "Ordonare", truefalse: "A/F",
  card: "Cartonaș", open_answer: "Răspuns deschis", problem: "Problemă",
};

export default function CsvLessonImporter({ mode, chapterId, existingLessonCount, onSuccess }: CsvLessonImporterProps) {
  const [open, setOpen] = useState(false);
  const [meta, setMeta] = useState<{ title: string; description?: string; xp_reward?: number } | null>(null);
  const [parsed, setParsed] = useState<ParsedExercise[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseLessonCSV(text);
      setMeta(result.meta);
      setParsed(result.exercises);
      setErrors(result.errors);
    };
    reader.readAsText(file);
  };

  const validExercises = parsed.filter(ex => !ex.error);

  const handleImport = async () => {
    if (!meta || validExercises.length === 0) return;
    setImporting(true);
    try {
      const lessonId = mode === "eval"
        ? `eval-l-${Date.now()}`
        : `${chapterId}-l${Date.now()}`;

      // Create lesson
      if (mode === "eval") {
        const { error } = await supabase.from("eval_lessons").insert({
          id: lessonId, chapter_id: chapterId, title: meta.title, sort_order: existingLessonCount,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lessons").insert({
          id: lessonId, chapter_id: chapterId, title: meta.title,
          description: meta.description || "", xp_reward: meta.xp_reward || 20,
          sort_order: existingLessonCount,
        });
        if (error) throw error;
      }

      // Create exercises
      const table = mode === "eval" ? "eval_exercises" : "exercises";
      const prefix = mode === "eval" ? "eval-" : `${lessonId}-`;
      const rows = validExercises.map((ex, i) => exerciseToDbRow(ex, lessonId, i, prefix));

      const cleaned = rows.map(r => {
        if (mode === "content") {
          const { solution, test_cases, ...rest } = r;
          return { ...rest, pairs: null };
        }
        return r;
      });

      if (cleaned.length > 0) {
        const { error } = await supabase.from(table).insert(cleaned as any);
        if (error) throw error;
      }

      toast.success(`Lecție "${meta.title}" creată cu ${validExercises.length} exerciții!`);
      setOpen(false);
      setMeta(null);
      setParsed([]);
      setErrors([]);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Eroare la import");
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => setOpen(true)}>
        <Upload className="h-3 w-3 mr-1" />Import lecție CSV
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setMeta(null); setParsed([]); setErrors([]); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import lecție din CSV</DialogTitle>
            <DialogDescription>
              Fișierul trebuie să conțină [META] și [EXERCISES].
            </DialogDescription>
          </DialogHeader>

          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full">
            <FileText className="h-4 w-4 mr-2" />Alege fișier CSV
          </Button>

          {meta && (
            <div className="rounded border border-border bg-secondary/20 p-3 space-y-1">
              <p className="text-sm font-medium text-foreground">📚 {meta.title}</p>
              {meta.description && <p className="text-xs text-muted-foreground">{meta.description}</p>}
              {meta.xp_reward && <p className="text-xs text-muted-foreground">{meta.xp_reward} XP</p>}
            </div>
          )}

          {parsed.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-foreground font-medium">
                {validExercises.length} exerciții valide / {parsed.length} total
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {parsed.map((ex, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded border ${ex.error ? "border-destructive/50 bg-destructive/5" : "border-border bg-secondary/20"}`}>
                    <span className="font-mono text-muted-foreground w-5">#{i + 1}</span>
                    {ex.error ? (
                      <>
                        <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
                        <span className="text-destructive">{ex.error}</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3 text-primary shrink-0" />
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{typeLabels[ex.type] || ex.type}</span>
                        <span className="truncate text-foreground">{ex.question}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {errors.length > 0 && (
                <div className="text-xs text-destructive space-y-0.5">
                  {errors.map((e, i) => <p key={i}>⚠ {e}</p>)}
                </div>
              )}

              <Button onClick={handleImport} disabled={importing || !meta || validExercises.length === 0} className="w-full">
                {importing ? "Se importă..." : `Creează lecția cu ${validExercises.length} exerciții`}
              </Button>
            </div>
          )}

          <div className="text-[10px] text-muted-foreground space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">Format: [META] + [EXERCISES]</p>
              <Button variant="link" size="sm" className="text-[10px] h-auto p-0" onClick={() => downloadCSV(getLessonTemplateCSV(), "template-lectie.csv")}>
                <Download className="h-3 w-3 mr-1" />Descarcă template
              </Button>
            </div>
            <p>[META] conține: title, description, xp_reward</p>
            <p>[EXERCISES] conține exercițiile (quiz, truefalse, fill, order, card, open_answer, problem)</p>
            <p className="text-amber-400/80 font-medium">⚠ Dacă un câmp conține virgulă, încadrați-l cu ghilimele: "text cu, virgulă"</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
