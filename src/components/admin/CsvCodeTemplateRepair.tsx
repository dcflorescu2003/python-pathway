import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Wrench, FileText, AlertCircle, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { parseLessonCSV, parseExercisesCSV, type ParsedExercise } from "./csvParser";
import { normalizeQuestion } from "./codeTemplateRepair";
import type { Exercise } from "@/hooks/useChapters";

interface Props {
  lessonId: string;
  existingExercises: Exercise[];
  onSuccess: () => void;
}

type Plan =
  | { kind: "fix"; dbId: string; type: string; question: string; newCode: string }
  | { kind: "skip"; reason: string; csvQuestion: string };

export default function CsvCodeTemplateRepair({ lessonId, existingExercises, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<Plan[]>([]);
  const [parsedCount, setParsedCount] = useState(0);
  const [running, setRunning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setPlan([]); setParsedCount(0); };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) || "";
      // Accept both lesson CSV ([META]/[EXERCISES]) and flat exercise CSV.
      let parsed: ParsedExercise[] = [];
      if (text.includes("[EXERCISES]")) {
        parsed = parseLessonCSV(text).exercises;
      } else {
        parsed = parseExercisesCSV(text).exercises;
      }
      const valid = parsed.filter(p => !p.error);
      setParsedCount(valid.length);
      setPlan(buildPlan(valid, existingExercises));
      // reset file input so reselecting same file works
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const fixCount = plan.filter(p => p.kind === "fix").length;
  const skipCount = plan.filter(p => p.kind === "skip").length;

  const handleRun = async () => {
    const fixes = plan.filter((p): p is Extract<Plan, { kind: "fix" }> => p.kind === "fix");
    if (fixes.length === 0) return;
    setRunning(true);
    try {
      // UPDATE only WHERE code_template IS NULL — never overwrite existing code.
      const results = await Promise.all(
        fixes.map(f =>
          supabase
            .from("exercises")
            .update({ code_template: f.newCode } as any)
            .eq("id", f.dbId)
            .is("code_template", null)
            .select("id")
        )
      );
      const updated = results.reduce((n, r) => n + (r.data?.length ?? 0), 0);
      const errs = results.filter(r => r.error);
      if (errs.length > 0) {
        toast.error(`${errs.length} update-uri au eșuat: ${errs[0].error?.message}`);
      } else {
        toast.success(`${updated} exerciții reparate (din ${fixes.length} planificate)`);
      }
      setOpen(false);
      reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Eroare la reparare");
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs h-7 px-2 text-amber-500 hover:text-amber-400"
        onClick={() => setOpen(true)}
        title="Repară code_template lipsă din CSV-ul original"
      >
        <Wrench className="h-3 w-3 mr-1" />Repară cod
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Repară code_template din CSV</DialogTitle>
            <DialogDescription>
              Încarcă CSV-ul original al acestei lecții. Se va actualiza <code className="text-primary">code_template</code> doar
              pentru exercițiile care îl au gol. Nimic altceva nu este modificat.
            </DialogDescription>
          </DialogHeader>

          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full">
            <FileText className="h-4 w-4 mr-2" />Alege fișier CSV
          </Button>

          {parsedCount > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">
                Plan: <span className="text-primary">{fixCount} de reparat</span>
                {" · "}
                <span className="text-muted-foreground">{skipCount} sărite</span>
                {" · "}
                <span className="text-muted-foreground">{parsedCount} în CSV</span>
              </div>

              <div className="space-y-1 max-h-72 overflow-y-auto">
                {plan.map((p, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 text-xs p-2 rounded border ${
                      p.kind === "fix"
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-secondary/20"
                    }`}
                  >
                    {p.kind === "fix" ? (
                      <>
                        <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="px-1 rounded bg-primary/10 text-primary text-[10px] font-bold">{p.type}</span>
                            <span className="truncate text-foreground">{p.question}</span>
                          </div>
                          <pre className="mt-1 text-[10px] text-muted-foreground bg-background/60 p-1.5 rounded border border-border max-h-20 overflow-y-auto whitespace-pre-wrap font-mono">{p.newCode.slice(0, 200)}{p.newCode.length > 200 ? "…" : ""}</pre>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="text-muted-foreground truncate block">{p.csvQuestion}</span>
                          <span className="text-[10px] text-muted-foreground/70">{p.reason}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <Button onClick={handleRun} disabled={running || fixCount === 0} className="w-full">
                {running ? "Se repară..." : `Repară ${fixCount} exerciții`}
                {fixCount > 0 && !running && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          )}

          <div className="text-[10px] text-muted-foreground border-t border-border pt-3 space-y-1">
            <p className="font-medium text-foreground">Cum se face match-ul:</p>
            <p>• Tipul (quiz/truefalse/…) trebuie să fie identic.</p>
            <p>• Întrebarea trebuie să se potrivească (normalizată: lowercase, fără markdown).</p>
            <p>• Dacă mai multe exerciții au exact aceeași întrebare, se folosește ordinea din CSV/DB.</p>
            <p>• UPDATE-ul rulează doar pe rândurile cu <code>code_template IS NULL</code>.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function buildPlan(parsed: ParsedExercise[], existing: Exercise[]): Plan[] {
  // Index existing exercises by (type, normalized question) → array of ids, in DB order.
  const dbBuckets = new Map<string, { id: string; hasCode: boolean }[]>();
  for (const ex of existing) {
    const key = `${ex.type}::${normalizeQuestion(ex.question)}`;
    if (!dbBuckets.has(key)) dbBuckets.set(key, []);
    dbBuckets.get(key)!.push({
      id: ex.id,
      hasCode: !!(ex.codeTemplate && ex.codeTemplate.trim().length > 0),
    });
  }

  const plan: Plan[] = [];
  for (const p of parsed) {
    const csvCode = (p.code_template || "").trim();
    if (!csvCode) continue; // nothing to repair from
    const key = `${p.type}::${normalizeQuestion(p.question)}`;
    const bucket = dbBuckets.get(key);
    if (!bucket || bucket.length === 0) {
      plan.push({ kind: "skip", reason: "Nu există în DB cu acest tip/întrebare", csvQuestion: truncate(p.question) });
      continue;
    }
    // Take the first DB exercise without code; otherwise the first one.
    const idx = bucket.findIndex(b => !b.hasCode);
    if (idx === -1) {
      plan.push({ kind: "skip", reason: "Toate match-urile au deja code_template în DB", csvQuestion: truncate(p.question) });
      // pop one so multiple identical questions consume entries in order
      bucket.shift();
      continue;
    }
    const target = bucket[idx];
    plan.push({ kind: "fix", dbId: target.id, type: p.type, question: truncate(p.question), newCode: csvCode });
    bucket.splice(idx, 1);
  }
  return plan;
}

function truncate(s: string, n = 70) {
  const t = (s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}
