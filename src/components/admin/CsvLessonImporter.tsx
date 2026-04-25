import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileText, AlertCircle, Check, Download, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { parseLessonCSV, exerciseToDbRow, getLessonTemplateCSV, getContentLessonTemplateCSV, downloadCSV, CONTENT_TYPES, EVAL_TYPES, type ParsedExercise } from "./csvParser";
import MicrocompetenciesReference from "./MicrocompetenciesReference";

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
  const [refOpen, setRefOpen] = useState(false);
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

  const allowedTypes = mode === "content" ? CONTENT_TYPES : EVAL_TYPES;
  const validExercises = parsed.filter(ex => !ex.error);
  const importableExercises = validExercises.filter(ex => allowedTypes.includes(ex.type));
  const skippedExercises = validExercises.filter(ex => !allowedTypes.includes(ex.type));
  const totalCompetencyTags = importableExercises.reduce((acc, ex) => acc + (ex.competencies?.length || 0), 0);

  const handleImport = async () => {
    if (!meta || importableExercises.length === 0) return;
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

      // Build exercise rows + capture id ↔ competency codes
      const table = mode === "eval" ? "eval_exercises" : "exercises";
      const prefix = mode === "eval" ? "eval-" : `${lessonId}-`;
      const rows = importableExercises.map((ex, i) => {
        const dbRow = exerciseToDbRow(ex, lessonId, i, prefix);
        return { dbRow, competencies: ex.competencies || [] };
      });

      const cleaned = rows.map(({ dbRow }) => {
        if (mode === "content") {
          const { solution, test_cases, ...rest } = dbRow;
          return { ...rest, pairs: null };
        }
        return dbRow;
      });

      if (cleaned.length > 0) {
        const { error } = await supabase.from(table).insert(cleaned as any);
        if (error) throw error;
      }

      // ===== Map competency codes → microcompetency UUIDs and insert item_competencies =====
      let mappingsCreated = 0;
      const unknownCodes = new Set<string>();
      const allCodes = Array.from(new Set(rows.flatMap(r => r.competencies)));

      if (allCodes.length > 0) {
        const { data: micros, error: microErr } = await supabase
          .from("microcompetencies")
          .select("id, code")
          .in("code", allCodes);

        if (microErr) {
          toast.warning("Lecția a fost creată, dar nu am putut căuta competențele: " + microErr.message);
        } else {
          const codeToId = new Map((micros || []).map(m => [m.code.toUpperCase(), m.id]));
          for (const c of allCodes) {
            if (!codeToId.has(c.toUpperCase())) unknownCodes.add(c);
          }

          const mappingRows: { item_type: string; item_id: string; microcompetency_id: string; weight: number }[] = [];
          for (const { dbRow, competencies } of rows) {
            for (const code of competencies) {
              const microId = codeToId.get(code.toUpperCase());
              if (microId) {
                mappingRows.push({
                  item_type: "exercise",
                  item_id: dbRow.id,
                  microcompetency_id: microId,
                  weight: 1.0,
                });
              }
            }
          }

          if (mappingRows.length > 0) {
            const { error: mapErr } = await supabase.from("item_competencies").insert(mappingRows);
            if (mapErr) {
              toast.warning("Exercițiile au fost create, dar maparea competențelor a eșuat: " + mapErr.message);
            } else {
              mappingsCreated = mappingRows.length;
            }
          }
        }
      }

      let successMsg = `Lecție "${meta.title}" creată cu ${importableExercises.length} exerciții`;
      if (mappingsCreated > 0) successMsg += ` și ${mappingsCreated} mapări de competențe`;
      toast.success(successMsg + "!");

      if (unknownCodes.size > 0) {
        toast.warning(`Coduri necunoscute (ignorate): ${Array.from(unknownCodes).join(", ")}`);
      }

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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import lecție din CSV</DialogTitle>
            <DialogDescription>
              Fișierul trebuie să conțină secțiunile <code className="text-primary">[META]</code> și <code className="text-primary">[EXERCISES]</code>.
              Poți include și competențele direct în CSV.
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
                {importableExercises.length} exerciții importabile / {parsed.length} total
                {totalCompetencyTags > 0 && (
                  <span className="ml-2 text-primary">• {totalCompetencyTags} mapări de competențe</span>
                )}
              </div>

              {skippedExercises.length > 0 && (
                <div className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded p-2">
                  ⚠ {skippedExercises.length} exerciții excluse (tipuri nepermise: {skippedExercises.map(e => typeLabels[e.type] || e.type).join(", ")})
                </div>
              )}

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
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium shrink-0">{typeLabels[ex.type] || ex.type}</span>
                        <span className="truncate text-foreground flex-1">{ex.question}</span>
                        {ex.competencies && ex.competencies.length > 0 && (
                          <span className="font-mono text-[10px] text-primary/80 bg-primary/5 border border-primary/20 px-1 rounded shrink-0">
                            {ex.competencies.join(",")}
                          </span>
                        )}
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

              <Button onClick={handleImport} disabled={importing || !meta || importableExercises.length === 0} className="w-full">
                {importing ? "Se importă..." : `Creează lecția cu ${importableExercises.length} exerciții`}
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-foreground">Format CSV</p>
              <div className="flex gap-1">
                <Button variant="link" size="sm" className="text-[10px] h-auto p-0" onClick={() => setRefOpen(true)}>
                  <BookOpen className="h-3 w-3 mr-1" />Vezi microcompetențele
                </Button>
                <Button variant="link" size="sm" className="text-[10px] h-auto p-0" onClick={() => downloadCSV(mode === "content" ? getContentLessonTemplateCSV() : getLessonTemplateCSV(), "template-lectie.csv")}>
                  <Download className="h-3 w-3 mr-1" />Template
                </Button>
              </div>
            </div>

            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li><code className="text-primary">[META]</code>: <code>title</code>, <code>description</code>, <code>xp_reward</code></li>
              <li><code className="text-primary">[EXERCISES]</code>: tipuri permise — quiz, truefalse, fill, order, card{mode === "eval" ? ", open_answer, problem" : ""}</li>
              <li>
                <strong className="text-foreground">Coloana <code className="text-primary">competencies</code></strong> (opțională): coduri de microcompetențe separate prin <code className="text-primary">;</code>
                <br />
                <span className="ml-0">Exemplu: <code className="text-primary">M61;M21;M29</code></span>
              </li>
              <li>Codurile necunoscute sunt ignorate cu avertisment — restul importului continuă.</li>
              <li className="text-amber-400/80">Dacă un câmp conține virgulă, încadrează-l cu ghilimele: <code>"text cu, virgulă"</code></li>
            </ul>

            <div className="bg-secondary/30 border border-border rounded p-2 mt-2">
              <p className="text-[10px] font-medium text-foreground mb-1">Exemplu rând cu competențe:</p>
              <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-all leading-tight">
quiz,"Ce este o listă?",a,b,c,d,b,"explicație",,,,,,,,,M61;M21
              </pre>
              <p className="text-[10px] text-muted-foreground mt-1">
                Ultima coloană = două competențe (M61 și M21) cu pondere egală.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <MicrocompetenciesReference open={refOpen} onOpenChange={setRefOpen} />
    </>
  );
}
