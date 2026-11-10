import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useTestItems } from "@/hooks/useTests";
import { useChapters } from "@/hooks/useChapters";
import { useProblems } from "@/hooks/useProblems";

interface Props {
  testId: string | null;
  title?: string;
  onOpenChange: (open: boolean) => void;
}

/** Read-only preview of a test shared by a colleague. */
const SharedTestPreviewDialog = ({ testId, title, onOpenChange }: Props) => {
  const { data: items = [] } = useTestItems(testId);
  const { data: chapters = [] } = useChapters();
  const { data: problemsData } = useProblems();
  const allProblems: any[] = (problemsData as any)?.problems ?? (Array.isArray(problemsData) ? problemsData : []);
  const [evalCache, setEvalCache] = useState<Record<string, any>>({});

  useEffect(() => {
    const missing = items
      .map((i: any) => i.source_id)
      .filter((id: any): id is string => typeof id === "string" && id.startsWith("eval-") && !evalCache[id]);
    if (!missing.length) return;
    supabase.rpc("get_eval_exercises_for_teacher", { p_ids: missing } as any).then(({ data }) => {
      if (data?.length) setEvalCache((p) => { const n = { ...p }; for (const e of data as any[]) n[e.id] = e; return n; });
    });
  }, [items, evalCache]);

  const describe = (item: any): { label: string; body?: string; options?: string[]; code?: string } => {
    const sid: string | null = item.source_id;
    if (item.source_type === "custom" || !sid) {
      const c = item.custom_data ?? {};
      return { label: c.question || c.title || "Item personalizat", body: c.statement || c.description, options: c.options?.map((o: any) => o.text ?? o), code: c.code_template };
    }
    if (evalCache[sid]) {
      const e = evalCache[sid];
      return { label: e.question, body: e.statement, options: e.options?.map((o: any) => o.text ?? o), code: e.code_template };
    }
    if (item.source_type === "problem") {
      const p = allProblems.find((x) => x.id === sid);
      return { label: p?.title ?? "Problemă", body: p?.description };
    }
    for (const ch of chapters) for (const l of ch.lessons) {
      const ex: any = l.exercises?.find((e) => e.id === sid);
      if (ex) return { label: ex.question, body: ex.statement, options: ex.options?.map((o: any) => o.text ?? o), code: ex.codeTemplate ?? ex.code_template };
    }
    return { label: "Item" };
  };

  const variants = Array.from(new Set(items.map((i: any) => i.variant))).sort();

  return (
    <Dialog open={!!testId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title || "Previzualizare test"}</DialogTitle>
          <p className="text-xs text-muted-foreground">{items.length} itemi · doar vizualizare</p>
        </DialogHeader>
        <div className={variants.length > 1 ? "grid md:grid-cols-2 gap-4" : "space-y-3"}>
          {variants.map((v) => {
            const vItems = items.filter((i: any) => i.variant === v);
            return (
              <Card key={v}>
                <CardContent className="p-3 space-y-3">
                  {variants.length > 1 && (
                    <p className="text-sm font-semibold text-foreground">
                      Varianta {v} <span className="text-muted-foreground font-normal">({vItems.length} itemi · {vItems.reduce((s: number, i: any) => s + Number(i.points), 0)}p)</span>
                    </p>
                  )}
                  {vItems.map((item: any, idx: number) => {
                    const d = describe(item);
                    return (
                      <div key={item.id} className="border border-border rounded-md p-2 space-y-1 text-xs">
                        <div className="flex gap-1.5 text-foreground">
                          <span className="text-muted-foreground">{idx + 1}.</span>
                          <span className="flex-1 whitespace-pre-wrap">{d.label}</span>
                          <span className="text-[10px] text-muted-foreground">{item.points}p</span>
                        </div>
                        {d.body && <p className="text-muted-foreground whitespace-pre-wrap">{d.body}</p>}
                        {d.options && <ul className="list-disc ml-5 text-muted-foreground">{d.options.map((o, k) => <li key={k}>{String(o)}</li>)}</ul>}
                        {d.code && <pre className="font-mono bg-muted/50 rounded p-1.5 whitespace-pre-wrap">{d.code}</pre>}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SharedTestPreviewDialog;
