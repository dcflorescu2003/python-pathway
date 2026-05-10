import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileText, AlertCircle, Check, Download } from "lucide-react";
import { toast } from "sonner";
import {
  parseProblemsCSV,
  getProblemsTemplateCSV,
  downloadCSV,
  type ParsedProblem,
} from "./problemsCsvParser";

interface Props {
  lessonId: string;
  existingCount: number;
  onSuccess: () => void;
}

export default function EvalProblemsCsvImporter({ lessonId, existingCount, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<ParsedProblem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseProblemsCSV(text);
      setParsed(result.problems);
      setErrors(result.errors);
    };
    reader.readAsText(file);
  };

  const valid = parsed.filter((p) => !p.error);

  const handleImport = async () => {
    if (valid.length === 0) return;
    setImporting(true);
    try {
      const baseTs = Date.now();
      const ids = valid.map((_, i) => `eval-e-${baseTs}-${i}-${Math.random().toString(36).slice(2, 6)}`);

      const rows = valid.map((p, i) => ({
        id: ids[i],
        lesson_id: lessonId,
        type: "problem",
        question: `**${p.title}**\n\n${p.description}`,
        solution: p.solution,
        test_cases: p.test_cases.map((tc) => ({
          input: tc.input,
          expected_output: tc.expectedOutput,
          hidden: tc.hidden,
        })) as any,
        code_template: null,
        sort_order: existingCount + i,
      }));

      const { error } = await supabase.from("eval_exercises").insert(rows as any);
      if (error) throw error;

      // Map competency codes
      const allCodes = Array.from(new Set(valid.flatMap((p) => p.competencies)));
      let mappingsCreated = 0;
      const unknown: string[] = [];
      if (allCodes.length > 0) {
        const { data: micros, error: microErr } = await supabase
          .from("microcompetencies")
          .select("id, code")
          .in("code", allCodes);
        if (microErr) {
          toast.warning("Problemele importate, dar nu am putut căuta competențele: " + microErr.message);
        } else {
          const codeToId = new Map((micros || []).map((m) => [m.code.toUpperCase(), m.id]));
          for (const c of allCodes) if (!codeToId.has(c)) unknown.push(c);

          const mapRows: { item_type: string; item_id: string; microcompetency_id: string; weight: number }[] = [];
          valid.forEach((p, i) => {
            for (const code of p.competencies) {
              const microId = codeToId.get(code);
              if (microId) {
                mapRows.push({
                  item_type: "eval_exercise",
                  item_id: ids[i],
                  microcompetency_id: microId,
                  weight: 1.0,
                });
              }
            }
          });

          if (mapRows.length > 0) {
            const { error: mapErr } = await supabase.from("item_competencies").insert(mapRows);
            if (mapErr) {
              toast.warning("Probleme create, dar maparea competențelor a eșuat: " + mapErr.message);
            } else {
              mappingsCreated = mapRows.length;
            }
          }
        }
      }

      let msg = `${valid.length} probleme importate ca exerciții`;
      if (mappingsCreated > 0) msg += ` · ${mappingsCreated} mapări competențe`;
      toast.success(msg + "!");
      if (unknown.length > 0) toast.warning(`Coduri necunoscute: ${unknown.join(", ")}`);

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

  return (
    <>
      <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => setOpen(true)}>
        <Upload className="h-3 w-3 mr-1" />Import probleme
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setParsed([]); setErrors([]); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import probleme CSV</DialogTitle>
            <DialogDescription>
              Importă probleme în această lecție din banca de teste. Vor fi adăugate ca exerciții de tip <strong>Problemă</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="text-[11px] text-muted-foreground rounded-md border border-border bg-muted/30 p-2">
            <p className="font-medium text-foreground mb-1">Notă:</p>
            <p>Câmpurile <code>hint</code>, <code>xp_reward</code>, <code>difficulty</code> și <code>is_premium</code> nu se importă în banca de teste — folosește pagina de Probleme pentru ele.</p>
          </div>

          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full">
            <FileText className="h-4 w-4 mr-2" />Alege fișier CSV
          </Button>

          {parsed.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-foreground font-medium">
                Preview: {valid.length} valide / {parsed.length} total
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto">
                {parsed.map((p, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded border ${p.error ? "border-destructive/50 bg-destructive/5" : "border-border bg-secondary/20"}`}>
                    <span className="font-mono text-muted-foreground w-5">#{i + 1}</span>
                    {p.error ? (
                      <>
                        <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
                        <span className="text-destructive">{p.error}</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3 text-primary shrink-0" />
                        <span className="px-1.5 py-0.5 rounded font-medium text-[10px] bg-primary/10 text-primary">Problemă</span>
                        <span className="truncate text-foreground flex-1">{p.title}</span>
                        <span className="text-muted-foreground shrink-0">{p.test_cases.length} teste</span>
                        {p.competencies.length > 0 && (
                          <span className="flex flex-wrap gap-0.5 shrink-0">
                            {p.competencies.map((c) => (
                              <span key={c} className="px-1 py-0.5 rounded bg-accent/30 text-accent-foreground text-[9px] font-mono">{c}</span>
                            ))}
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

              <Button onClick={handleImport} disabled={importing || valid.length === 0} className="w-full">
                {importing ? "Se importă..." : `Importă ${valid.length} probleme`}
              </Button>
            </div>
          )}

          <div className="text-[10px] text-muted-foreground space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">Format CSV:</p>
              <Button variant="link" size="sm" className="text-[10px] h-auto p-0" onClick={() => downloadCSV(getProblemsTemplateCSV(), "template-probleme.csv")}>
                <Download className="h-3 w-3 mr-1" />Descarcă template
              </Button>
            </div>
            <p>Coloane: <code>title, description, difficulty, xp_reward, hint, solution, is_premium, test_cases, competencies</code></p>
            <p>test_cases: <code>input&gt;&gt;output&gt;&gt;hidden(0/1)</code> separate prin <code>;</code></p>
            <p>competencies: coduri separate prin <code>|</code> (ex: <code>M18|M20</code>)</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
