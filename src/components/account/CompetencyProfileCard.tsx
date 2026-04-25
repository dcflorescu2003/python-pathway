import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Target, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

export type CompetencyMode = "blended" | "tests_only" | "self_only";

type Row = {
  general_id: string;
  general_code: string;
  general_title: string;
  specific_id: string;
  specific_code: string;
  specific_title: string;
  attempts: number;
  score_sum: number;
  max_sum: number;
  mastery: number | null;
};

const masteryLabel = (m: number | null) => {
  if (m === null) return { label: "Neevaluat", tone: "muted" as const };
  if (m >= 0.85) return { label: "Stăpânit", tone: "primary" as const };
  if (m >= 0.6) return { label: "În progres", tone: "secondary" as const };
  if (m >= 0.3) return { label: "Început", tone: "warning" as const };
  return { label: "Necesită exersare", tone: "destructive" as const };
};

interface CompetencyProfileCardProps {
  /** When provided, view this student's profile (teacher mode). Defaults to current user. */
  studentId?: string;
  /** Scoring mode. Defaults to 'blended' (60/40). */
  mode?: CompetencyMode;
  /** Override default header label. */
  title?: string;
  /** Override default subtitle. */
  subtitle?: string;
  /** Start expanded. */
  defaultExpanded?: boolean;
}

const CompetencyProfileCard = ({
  studentId,
  mode = "blended",
  title = "Profil de competențe",
  subtitle = "Programa școlară · CG & CS",
  defaultExpanded = false,
}: CompetencyProfileCardProps) => {
  const { user } = useAuth();
  const targetId = studentId ?? user?.id;
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [openCG, setOpenCG] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const autoBackfillTriedRef = useRef(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["competency-profile", targetId, mode],
    queryFn: async () => {
      if (!targetId) return [] as Row[];
      const { data, error } = await supabase.rpc("get_student_competency_profile", {
        p_user_id: targetId,
        p_mode: mode,
      } as any);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    enabled: !!targetId && expanded,
    staleTime: 60_000,
  });

  const isOwnProfile = !studentId || studentId === user?.id;

  const runBackfill = async () => {
    if (!targetId || backfilling) return;
    setBackfilling(true);
    try {
      const { data: res, error } = await supabase.rpc("backfill_competency_scores", {
        p_user_id: targetId,
      } as any);
      if (error) throw error;
      const items = (res as any)?.items_processed ?? 0;
      toast({ title: "Profil recalculat", description: `${items} elemente procesate.` });
      qc.invalidateQueries({ queryKey: ["competency-profile", targetId] });
    } catch (e: any) {
      toast({ title: "Eroare", description: e?.message ?? "Recalcularea a eșuat.", variant: "destructive" });
    } finally {
      setBackfilling(false);
    }
  };

  // Auto-backfill once if profile is empty but user has completed lessons
  useEffect(() => {
    if (!expanded || !isOwnProfile || !user?.id || isLoading || !data) return;
    if (autoBackfillTriedRef.current) return;
    const flagKey = `competency-backfill-v1-${user.id}`;
    if (localStorage.getItem(flagKey)) return;
    const hasAnyData = data.some((r) => Number(r.max_sum) > 0);
    if (hasAnyData) {
      localStorage.setItem(flagKey, "1");
      return;
    }
    autoBackfillTriedRef.current = true;
    (async () => {
      const { count } = await supabase
        .from("completed_lessons")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if ((count ?? 0) > 0) {
        await runBackfill();
        localStorage.setItem(flagKey, "1");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, isOwnProfile, user?.id, isLoading, data]);


  const generals = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { id: string; code: string; title: string; rows: Row[] }>();
    for (const r of data) {
      if (!map.has(r.general_id)) {
        map.set(r.general_id, { id: r.general_id, code: r.general_code, title: r.general_title, rows: [] });
      }
      map.get(r.general_id)!.rows.push(r);
    }
    return Array.from(map.values()).map((g) => {
      const score = g.rows.reduce((s, r) => s + Number(r.score_sum || 0), 0);
      const max = g.rows.reduce((s, r) => s + Number(r.max_sum || 0), 0);
      const attempts = g.rows.reduce((s, r) => s + Number(r.attempts || 0), 0);
      const mastery = max > 0 ? score / max : null;
      return { ...g, score, max, attempts, mastery };
    });
  }, [data]);

  const overall = useMemo(() => {
    if (!generals.length) return null;
    const score = generals.reduce((s, g) => s + g.score, 0);
    const max = generals.reduce((s, g) => s + g.max, 0);
    return max > 0 ? score / max : null;
  }, [generals]);

  return (
    <Card className="border-border">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-4 flex items-center justify-between gap-3 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">{title}</div>
            <div className="text-[11px] text-muted-foreground truncate">{subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {overall !== null && (
            <Badge variant="secondary" className="text-[10px] font-mono">
              {Math.round(overall * 100)}%
            </Badge>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0 pb-4 px-4 space-y-3">
              {isLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              )}

              {!isLoading && (generals.length === 0 || generals.every((g) => g.max === 0)) && (
                <div className="text-xs text-muted-foreground text-center py-4 space-y-3">
                  <p>
                    {backfilling
                      ? "Se recalculează profilul din istoric…"
                      : "Profilul se va popula pe măsură ce sunt rezolvate exerciții și teste."}
                  </p>
                  {isOwnProfile && !backfilling && (
                    <Button size="sm" variant="outline" onClick={runBackfill} className="gap-1.5">
                      <RefreshCw className="h-3 w-3" />
                      Recalculează din istoric
                    </Button>
                  )}
                </div>
              )}

              {!isLoading && generals.length > 0 && generals.some((g) => g.max > 0) && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-muted-foreground flex items-start gap-1.5 flex-1">
                      <Sparkles className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                      <span>
                        Vezi pe scurt cum stai pe fiecare competență generală (CG). Apasă pentru detalii pe competențe specifice (CS).
                      </span>
                    </p>
                    {isOwnProfile && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={runBackfill}
                        disabled={backfilling}
                        className="h-6 px-2 gap-1 text-[10px] shrink-0"
                        title="Recalculează din întreg istoricul"
                      >
                        <RefreshCw className={`h-3 w-3 ${backfilling ? "animate-spin" : ""}`} />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {generals.map((g) => {
                      const isOpen = openCG === g.id;
                      const m = g.mastery;
                      const meta = masteryLabel(m);
                      return (
                        <div key={g.id} className="rounded-lg border border-border bg-muted/30">
                          <button
                            type="button"
                            onClick={() => setOpenCG(isOpen ? null : g.id)}
                            className="w-full p-3 flex items-center gap-2 text-left"
                          >
                            <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                              {g.code}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-foreground truncate">
                                {g.title}
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <Progress
                                  value={m !== null ? m * 100 : 0}
                                  className="h-1.5 flex-1"
                                />
                                <span className="text-[10px] font-mono text-muted-foreground w-9 text-right">
                                  {m !== null ? `${Math.round(m * 100)}%` : "—"}
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant={meta.tone === "primary" ? "default" : "secondary"}
                              className="text-[9px] shrink-0"
                            >
                              {meta.label}
                            </Badge>
                            {isOpen ? (
                              <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                            )}
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="overflow-hidden"
                              >
                                <div className="px-3 pb-3 space-y-1.5">
                                  {g.rows.map((r) => {
                                    const cm = r.max_sum > 0 ? Number(r.score_sum) / Number(r.max_sum) : null;
                                    return (
                                      <div
                                        key={r.specific_id}
                                        className="flex items-center gap-2 rounded-md bg-background/60 px-2 py-1.5"
                                      >
                                        <Badge variant="outline" className="font-mono text-[9px] shrink-0">
                                          {r.specific_code}
                                        </Badge>
                                        <span className="flex-1 text-[11px] text-foreground/90 truncate">
                                          {r.specific_title}
                                        </span>
                                        <div className="flex items-center gap-1.5 w-28 shrink-0">
                                          <Progress
                                            value={cm !== null ? cm * 100 : 0}
                                            className="h-1 flex-1"
                                          />
                                          <span className="text-[9px] font-mono text-muted-foreground w-7 text-right">
                                            {cm !== null ? `${Math.round(cm * 100)}%` : "—"}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default CompetencyProfileCard;
