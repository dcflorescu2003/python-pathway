import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { RefreshCw, Users, Crown, GraduationCap, BookOpen, Code2, ClipboardList, Flame } from "lucide-react";

interface StatsData {
  days: number;
  summary: {
    total_users: number; premium_users: number; teachers: number; verified_teachers: number;
    active_today: number; active_7d: number; active_30d: number; active_period: number; new_users_period: number;
  };
  activity: {
    lessons_today: number; lessons_7d: number; lessons_period: number;
    problems_today: number; problems_7d: number; problems_period: number;
    avg_score_period: number;
  };
  submissions: { total: number; period: number; submitted_period: number };
  daily: { day: string; lessons: number; problems: number; active_users: number }[];
  top_lessons: { id: string; title: string; count: number; avg_score: number }[];
  top_problems: { id: string; title: string; count: number }[];
  by_chapter: { chapter: string; count: number; avg_score: number }[];
  top_users: {
    user_id: string; name: string; nickname: string | null; xp: number; streak: number;
    is_premium: boolean; is_teacher: boolean; last_activity_date: string; items_period: number;
    active_days: number;
  }[];
}

const StatCard = ({ icon: Icon, label, value, hint }: {
  icon: any; label: string; value: string | number; hint?: string;
}) => (
  <Card className="border-border">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground font-mono">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </CardContent>
  </Card>
);

interface Anomaly {
  user_id: string; name: string; nickname: string | null; xp: number;
  expected_xp: number; xp_gap: number; items: number; bursts: number; max_per_hour: number;
}

const StatsDashboard = () => {
  const [days, setDays] = useState("30");

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["admin-stats", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_stats" as any, {
        p_days: parseInt(days),
      });
      if (error) throw error;
      return data as unknown as StatsData;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: anomalies = [] } = useQuery({
    queryKey: ["admin-anomalies"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_anomalies" as any);
      if (error) throw error;
      return (data ?? []) as unknown as Anomaly[];
    },
    staleTime: 1000 * 60 * 5,
  });


  const s = data?.summary;
  const a = data?.activity;

  const chartData = (data?.daily || []).map((d) => ({
    ...d,
    label: d.day.slice(5),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Azi</SelectItem>
            <SelectItem value="7">Ultimele 7 zile</SelectItem>
            <SelectItem value="30">Ultimele 30 zile</SelectItem>
            <SelectItem value="90">Ultimele 90 zile</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-sm text-destructive">
            Eroare la încărcarea statisticilor: {(error as Error).message}
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="text-sm text-muted-foreground py-8 text-center">Se încarcă statisticile...</div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={Users}
              label={data.days === 1 ? "Activi azi" : `Activi în ${data.days} zile`}
              value={data.days === 1 ? s!.active_today : s!.active_period}
              hint={`azi: ${s!.active_today} · 7 zile: ${s!.active_7d} · 30 zile: ${s!.active_30d}`}
            />
            <StatCard
              icon={Users} label="Total conturi" value={s!.total_users}
              hint={`+${s!.new_users_period} noi în perioadă`}
            />
            <StatCard
              icon={Crown} label="Premium" value={s!.premium_users}
              hint={`${((s!.premium_users / Math.max(s!.total_users, 1)) * 100).toFixed(1)}% din total`}
            />
            <StatCard
              icon={GraduationCap} label="Profesori" value={s!.teachers}
              hint={`${s!.verified_teachers} verificați`}
            />
            <StatCard
              icon={BookOpen} label="Lecții finalizate" value={a!.lessons_period}
              hint={`${a!.lessons_today} azi · ${a!.lessons_7d} în 7 zile`}
            />
            <StatCard
              icon={Code2} label="Probleme rezolvate" value={a!.problems_period}
              hint={`${a!.problems_today} azi · ${a!.problems_7d} în 7 zile`}
            />
            <StatCard
              icon={Flame} label="Scor mediu lecții" value={`${a!.avg_score_period}%`}
              hint="în perioada selectată"
            />
            <StatCard
              icon={ClipboardList} label="Teste începute" value={data.submissions.period}
              hint={`${data.submissions.submitted_period} predate · ${data.submissions.total} total`}
            />
          </div>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Activitate zilnică</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px] px-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="lessons" name="Lecții" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="problems" name="Probleme" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} />
                  <Line type="monotone" dataKey="active_users" name="Utilizatori activi" stroke="#22d3ee" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top lecții</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lecție</TableHead>
                      <TableHead className="text-right">Finalizări</TableHead>
                      <TableHead className="text-right">Scor mediu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.top_lessons.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-sm">{l.title}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{l.count}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{l.avg_score}%</TableCell>
                      </TableRow>
                    ))}
                    {data.top_lessons.length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">Fără date</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top probleme</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Problemă</TableHead>
                      <TableHead className="text-right">Rezolvări</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.top_problems.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{p.title}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{p.count}</TableCell>
                      </TableRow>
                    ))}
                    {data.top_problems.length === 0 && (
                      <TableRow><TableCell colSpan={2} className="text-center text-sm text-muted-foreground py-6">Fără date</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Activitate pe capitole</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Capitol</TableHead>
                    <TableHead className="text-right">Finalizări</TableHead>
                    <TableHead className="text-right">Scor mediu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.by_chapter.map((c) => (
                    <TableRow key={c.chapter}>
                      <TableCell className="text-sm">{c.chapter}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{c.count}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{c.avg_score}%</TableCell>
                    </TableRow>
                  ))}
                  {data.by_chapter.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">Fără date</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Cei mai activi utilizatori
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (doar cei activi în perioada selectată)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilizator</TableHead>
                    <TableHead className="text-right">Activitate</TableHead>
                    <TableHead className="text-right">XP</TableHead>
                    <TableHead className="text-right">Streak</TableHead>
                    <TableHead className="text-right">Ultima activitate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.top_users.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm text-foreground">{u.name}</span>
                          <div className="flex gap-1 items-center">
                            {u.nickname && <span className="text-xs text-muted-foreground">@{u.nickname}</span>}
                            {u.is_premium && <Badge className="bg-amber-500 text-amber-50 text-[10px] px-1 py-0">Premium</Badge>}
                            {u.is_teacher && <Badge variant="outline" className="text-[10px] px-1 py-0">Profesor</Badge>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{u.items_period}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{u.xp}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{u.streak}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{u.last_activity_date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.top_users.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  Niciun utilizator activ în perioada selectată.
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Semnale suspecte</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilizator</TableHead>
                    <TableHead className="text-right">XP</TableHead>
                    <TableHead className="text-right">XP estimat</TableHead>
                    <TableHead className="text-right">Diferență</TableHead>
                    <TableHead className="text-right">Itemi</TableHead>
                    <TableHead className="text-right">Sub 10s</TableHead>
                    <TableHead className="text-right">Max/oră</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anomalies.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="text-sm">
                        {u.name}
                        {u.nickname && <span className="text-xs text-muted-foreground ml-1">@{u.nickname}</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{u.xp}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{u.expected_xp}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-destructive">{u.xp_gap}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{u.items}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{u.bursts}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{u.max_per_hour}</TableCell>
                    </TableRow>
                  ))}
                  {anomalies.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">Niciun semnal suspect</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>

      )}
    </div>
  );
};

export default StatsDashboard;
