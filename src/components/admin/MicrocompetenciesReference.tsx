import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Search } from "lucide-react";
import { toast } from "sonner";

interface MicroRow {
  code: string;
  title: string;
  specific_code: string;
  specific_title: string;
  general_code: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function MicrocompetenciesReference({ open, onOpenChange }: Props) {
  const [rows, setRows] = useState<MicroRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!open || rows.length > 0) return;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("microcompetencies")
        .select("code, title, sort_order, competencies_specific!inner(code, title, sort_order, competencies_general!inner(code, sort_order))")
        .order("sort_order", { ascending: true });
      if (error) {
        toast.error("Nu am putut încărca microcompetențele");
        setLoading(false);
        return;
      }
      const mapped: MicroRow[] = (data || []).map((m: any) => ({
        code: m.code,
        title: m.title,
        specific_code: m.competencies_specific?.code || "",
        specific_title: m.competencies_specific?.title || "",
        general_code: m.competencies_specific?.competencies_general?.code || "",
      }));
      // sort by general → specific → micro code
      mapped.sort((a, b) => {
        if (a.general_code !== b.general_code) return a.general_code.localeCompare(b.general_code);
        if (a.specific_code !== b.specific_code) return a.specific_code.localeCompare(b.specific_code);
        const an = parseInt(a.code.replace(/\D/g, "")) || 0;
        const bn = parseInt(b.code.replace(/\D/g, "")) || 0;
        return an - bn;
      });
      setRows(mapped);
      setLoading(false);
    })();
  }, [open, rows.length]);

  const f = filter.trim().toLowerCase();
  const filtered = !f
    ? rows
    : rows.filter(r =>
        r.code.toLowerCase().includes(f) ||
        r.title.toLowerCase().includes(f) ||
        r.specific_code.toLowerCase().includes(f) ||
        r.general_code.toLowerCase().includes(f)
      );

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success(`Copiat: ${txt}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Microcompetențe disponibile</DialogTitle>
          <DialogDescription>
            Folosește aceste coduri în coloana <code className="text-primary">competencies</code> din CSV. Mai multe coduri se separă prin <code className="text-primary">;</code> (ex: <code className="text-primary">M61;M21</code>).
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută după cod sau titlu..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="overflow-y-auto flex-1 border border-border rounded">
          {loading ? (
            <p className="text-sm text-muted-foreground p-4">Se încarcă...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">Niciun rezultat</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-secondary/50 sticky top-0">
                <tr className="text-left">
                  <th className="p-2 font-medium">Cod</th>
                  <th className="p-2 font-medium">Titlu</th>
                  <th className="p-2 font-medium">Comp. specifică</th>
                  <th className="p-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.code} className="border-t border-border hover:bg-secondary/30">
                    <td className="p-2 font-mono text-primary font-semibold">{r.code}</td>
                    <td className="p-2 text-foreground">{r.title}</td>
                    <td className="p-2 text-muted-foreground">{r.specific_code}</td>
                    <td className="p-2">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copy(r.code)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {filtered.length} din {rows.length} microcompetențe
        </p>
      </DialogContent>
    </Dialog>
  );
}
