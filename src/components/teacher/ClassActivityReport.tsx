import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useClassActivityReport } from "@/hooks/useClassActivityReport";

const MONTHS = ["IAN", "FEB", "MAR", "APR", "MAI", "IUN", "IUL", "AUG", "SEP", "OCT", "NOI", "DEC"];

const ClassActivityReport = () => {
  const { data, isLoading } = useClassActivityReport();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground px-1">Se încarcă raportul...</p>;
  }
  if (!data || data.rows.length === 0) return null;

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Activitate în ultimele 7 zile</span>
        </div>

        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left font-medium text-muted-foreground border border-border px-2 py-1.5 sticky left-0 bg-card">
                  Clasa
                </th>
                {data.days.map((d) => (
                  <th
                    key={d.toISOString()}
                    className="font-medium text-muted-foreground border border-border px-2 py-1.5 whitespace-nowrap"
                  >
                    {d.getDate()} {MONTHS[d.getMonth()]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.classId}>
                  <td className="text-left font-medium text-foreground border border-border px-2 py-1.5 sticky left-0 bg-card max-w-[140px] truncate">
                    {row.className}
                  </td>
                  {row.counts.map((c, i) => (
                    <td
                      key={i}
                      className={`text-center border border-border px-2 py-1.5 whitespace-nowrap ${
                        c === 0 ? "text-muted-foreground" : "text-foreground font-medium"
                      }`}
                    >
                      <span className="block">{c}</span>
                      <span className="block mt-0.5 text-[10px] font-normal text-primary">
                        {row.xpTotals[i]} XP
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          Lecții și probleme finalizate, cu XP-ul obținut de elevii clasei.
        </p>
      </CardContent>
    </Card>
  );
};

export default ClassActivityReport;
