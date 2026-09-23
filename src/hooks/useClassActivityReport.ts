import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeacherClasses } from "@/hooks/useTeacher";

export interface ClassActivityRow {
  classId: string;
  className: string;
  counts: number[];
}

export interface ClassActivityReport {
  days: Date[];
  rows: ClassActivityRow[];
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useClassActivityReport() {
  const { data: classes = [] } = useTeacherClasses();
  const classIds = classes.map((c) => c.id).sort();

  return useQuery<ClassActivityReport>({
    queryKey: ["class-activity-report", classIds.join(",")],
    enabled: classIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const days: Date[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d);
      }
      const from = days[0];

      const { data: members } = await supabase
        .from("class_members")
        .select("class_id, student_id")
        .in("class_id", classIds);

      const memberRows = (members ?? []) as { class_id: string; student_id: string }[];
      const studentIds = Array.from(new Set(memberRows.map((m) => m.student_id)));

      const byStudent: Record<string, Record<string, number>> = {};
      if (studentIds.length) {
        const { data: completed } = await supabase
          .from("completed_lessons")
          .select("user_id, completed_at")
          .in("user_id", studentIds)
          .gte("completed_at", from.toISOString());

        ((completed ?? []) as { user_id: string; completed_at: string | null }[]).forEach((r) => {
          if (!r.completed_at) return;
          const k = dayKey(new Date(r.completed_at));
          byStudent[r.user_id] = byStudent[r.user_id] || {};
          byStudent[r.user_id][k] = (byStudent[r.user_id][k] ?? 0) + 1;
        });
      }

      const dayKeys = days.map(dayKey);
      const rows: ClassActivityRow[] = classes.map((cls) => {
        const studentsOfClass = memberRows.filter((m) => m.class_id === cls.id).map((m) => m.student_id);
        const counts = dayKeys.map((k) =>
          studentsOfClass.reduce((sum, sid) => sum + (byStudent[sid]?.[k] ?? 0), 0)
        );
        return { classId: cls.id, className: cls.name, counts };
      });

      return { days, rows };
    },
  });
}
