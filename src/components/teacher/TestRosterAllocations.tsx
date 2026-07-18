import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp, FileSpreadsheet, Users } from "lucide-react";

interface Allocation {
  student_id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  roster_number: number;
  variant: string;
  status: string;
  submitted_at: string | null;
  submission_id: string | null;
}

const statusLabel = (s: string) => {
  switch (s) {
    case "submitted": return "Trimis";
    case "in_progress": return "În curs";
    case "interrupted": return "Întrerupt";
    case "not_started":
    default: return "Neînceput";
  }
};

const statusColor = (s: string) => {
  switch (s) {
    case "submitted": return "bg-success/10 text-success border-success/30";
    case "in_progress": return "bg-primary/10 text-primary border-primary/30";
    case "interrupted": return "bg-warning/10 text-warning border-warning/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
};

interface Props {
  assignmentId: string;
  className?: string;
}

const TestRosterAllocations = ({ assignmentId, className }: Props) => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Allocation[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || rows !== null) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .rpc("get_test_roster_allocations", { p_assignment_id: assignmentId });
      if (cancelled) return;
      if (!error && Array.isArray(data)) setRows(data as any);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, assignmentId, rows]);

  // Reset when assignment changes
  useEffect(() => { setRows(null); }, [assignmentId]);

  const exportCSV = () => {
    if (!rows) return;
    const header = ["Nr.", "Nume", "Variantă", "Stare", "Trimis la"];
    const lines = rows.map((r) => {
      const name = [r.last_name, r.first_name].filter(Boolean).join(" ") || r.display_name || "—";
      const submittedAt = r.submitted_at ? new Date(r.submitted_at).toLocaleString("ro-RO") : "";
      return [r.roster_number, name, r.variant, statusLabel(r.status), submittedAt]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alocari-${className || "test"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-border">
      <CardContent className="p-3 space-y-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              Alocări elevi (numere și variante)
            </span>
          </div>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {open && (
          <div className="space-y-2">
            {loading && (
              <div className="flex items-center gap-2 py-3">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs text-muted-foreground">Se încarcă alocările…</p>
              </div>
            )}

            {!loading && rows && rows.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">Nu există elevi în această clasă.</p>
            )}

            {!loading && rows && rows.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">
                    Numerele sunt atribuite alfabetic. Varianta A/B alternează pe ordine.
                  </p>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={exportCSV}>
                    <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
                  </Button>
                </div>
                <div className="overflow-x-auto -mx-3 px-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="py-1.5 pr-2 font-medium">Nr.</th>
                        <th className="py-1.5 pr-2 font-medium">Elev</th>
                        <th className="py-1.5 pr-2 font-medium">Var.</th>
                        <th className="py-1.5 pr-2 font-medium">Stare</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const name = [r.last_name, r.first_name].filter(Boolean).join(" ")
                          || r.display_name
                          || "Elev";
                        return (
                          <tr key={r.student_id} className="border-b border-border/50">
                            <td className="py-1.5 pr-2 font-mono font-semibold text-foreground">
                              {r.roster_number}
                            </td>
                            <td className="py-1.5 pr-2 text-foreground">{name}</td>
                            <td className="py-1.5 pr-2">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                r.variant === "A"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-accent text-accent-foreground"
                              }`}>
                                {r.variant}
                              </span>
                            </td>
                            <td className="py-1.5 pr-2">
                              <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] ${statusColor(r.status)}`}>
                                {statusLabel(r.status)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestRosterAllocations;
