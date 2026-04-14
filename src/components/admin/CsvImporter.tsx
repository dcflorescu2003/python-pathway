import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileText, AlertCircle, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { parseExercisesCSV, exerciseToDbRow, generateExportCSV, type ParsedExercise } from "./csvParser";

interface CsvImporterProps {
  targetTable: "exercises" | "eval_exercises" | "manual_exercises";
  lessonId: string;
  existingCount: number;
  existingExercises?: any[];
  onSuccess: () => void;
}

const typeLabels: Record<string, string> = {
  quiz: "Quiz", fill: "Completare", order: "Ordonare", truefalse: "A/F",
  card: "Cartonaș", open_answer: "Răspuns deschis", problem: "Problemă", match: "Asociere",
};

export default function CsvImporter({ targetTable, lessonId, existingCount, existingExercises, onSuccess }: CsvImporterProps) {
  const [open, setOpen] = useState(false);
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
      const result = parseExercisesCSV(text);
      setParsed(result.exercises);
      setErrors(result.errors);
    };
    reader.readAsText(file);
  };

  const validExercises = parsed.filter(ex => !ex.error);

  const handleImport = async () => {
    if (validExercises.length === 0) return;
    setImporting(true);
    try {
      const prefix = targetTable === "eval_exercises" ? "eval-" : `${lessonId}-`;
      const rows = validExercises.map((ex, i) =>
        exerciseToDbRow(ex, lessonId, existingCount + i, prefix)
      );

      // Remove/add fields based on target table
      const cleaned = rows.map(r => {
        if (targetTable === "exercises") {
          const { solution, test_cases, ...rest } = r;
          return { ...rest, pairs: null };
        }
        if (targetTable === "manual_exercises") {
          return { ...r, pairs: null, hint: null, solution: r.solution || "", test_cases: r.test_cases || [] };
        }
        return r;
      });

      const { error } = await supabase.from(targetTable).insert(cleaned as any);
      if (error) throw error;
      toast.success(`${validExercises.length} exerciții importate!`);
      setOpen(false);
      setParsed([]);
      setErrors([]);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Eroare la import");
    } finally {
      setImporting(false);
    }
  };

  const handleExport = () => {
    if (!existingExercises || existingExercises.length === 0) {
      toast.error("Nu există exerciții de exportat");
      return;
    }
    const csv = generateExportCSV(existingExercises);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exercises-${lessonId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => setOpen(true)}>
          <Upload className="h-3 w-3 mr-1" />Import CSV
        </Button>
        {existingExercises && existingExercises.length > 0 && (
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={handleExport}>
            <Download className="h-3 w-3 mr-1" />Export
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setParsed([]); setErrors([]); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import CSV exerciții</DialogTitle>
            <DialogDescription>
              Încarcă un fișier CSV cu exerciții. Se adaugă la cele existente.
            </DialogDescription>
          </DialogHeader>

          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full">
            <FileText className="h-4 w-4 mr-2" />Alege fișier CSV
          </Button>

          {parsed.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-foreground font-medium">
                Preview: {validExercises.length} valide / {parsed.length} total
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto">
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

              <Button onClick={handleImport} disabled={importing || validExercises.length === 0} className="w-full">
                {importing ? "Se importă..." : `Importă ${validExercises.length} exerciții`}
              </Button>
            </div>
          )}

          <div className="text-[10px] text-muted-foreground space-y-1 border-t border-border pt-3">
            <p className="font-medium">Format CSV:</p>
            <p>Coloane: type, question, option_a, option_b, option_c, option_d, correct, explanation, code_template, blanks, lines, statement, is_true, groups, solution, test_cases</p>
            <p>Tipuri: quiz, truefalse, fill, order, card, open_answer, problem</p>
            <p>Blanks: variante separate prin „;" (mai multe blank-uri) și răspunsuri prin „,"</p>
            <p>Lines/Groups: separate prin „|"</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
