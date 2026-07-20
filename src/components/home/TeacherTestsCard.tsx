import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudentAssignments } from "@/hooks/useTests";

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "expiră curând";
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin} min rămase`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h < 24) return m > 0 ? `${h}h ${m}m rămase` : `${h}h rămase`;
  const d = Math.floor(h / 24);
  const hh = h % 24;
  return hh > 0 ? `${d}z ${hh}h rămase` : `${d}z rămase`;
}

const TeacherTestsCard = () => {
  const { data: assignments = [] } = useStudentAssignments();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const visible = useMemo(() => {
    const active = (assignments as any[]).filter((a) => {
      if (a.submission?.submitted_at) return false;
      if (!a.window_minutes) return true;
      const deadline = new Date(a.assigned_at).getTime() + a.window_minutes * 60000;
      return deadline > now;
    });
    active.sort((a, b) => {
      const da = a.window_minutes ? new Date(a.assigned_at).getTime() + a.window_minutes * 60000 : Infinity;
      const db = b.window_minutes ? new Date(b.assigned_at).getTime() + b.window_minutes * 60000 : Infinity;
      if (da !== db) return da - db;
      return new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime();
    });
    return active;
  }, [assignments, now]);

  if (visible.length === 0) return null;

  const shown = visible.slice(0, 3);
  const more = visible.length - shown.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 rounded-xl border border-primary/30 bg-card p-3 space-y-2"
    >
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Teste de la profesor</p>
      </div>

      <div className="space-y-2">
        {shown.map((a: any) => {
          const inProgress = !!a.submission && !a.submission.submitted_at;
          const deadlineMs = a.window_minutes
            ? new Date(a.assigned_at).getTime() + a.window_minutes * 60000
            : null;
          const msLeft = deadlineMs ? deadlineMs - now : null;
          const soon = msLeft !== null && msLeft < 30 * 60000;
          return (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {a.tests?.title || "Test"}
                </p>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="text-[10px] text-muted-foreground truncate">
                    {a.teacher_classes?.name || "Clasa ta"}
                  </span>
                  {inProgress && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      în progres
                    </span>
                  )}
                  {msLeft !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
                        soon
                          ? "bg-warning/10 text-warning"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Clock className="h-2.5 w-2.5" />
                      {formatTimeLeft(msLeft)}
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                className="shrink-0 h-8 text-xs"
                onClick={() => navigate(`/test/${a.id}`)}
              >
                {inProgress ? "Continuă" : "Începe"}
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </div>
          );
        })}
      </div>

      {more > 0 && (
        <button
          onClick={() => navigate("/auth")}
          className="w-full text-xs text-muted-foreground hover:text-foreground py-1"
        >
          +{more} alte teste — vezi toate
        </button>
      )}
    </motion.div>
  );
};

export default TeacherTestsCard;
