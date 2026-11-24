import { fetchAllPaginated } from "@/lib/supabasePagination";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeacherClasses } from "@/hooks/useTeacher";

export interface ClassActivityRow {
  classId: string;
  className: string;
  counts: number[];
  xpTotals: number[];
}

export interface ClassActivityReport {
  days: Date[];
  rows: ClassActivityRow[];
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const ID_CHUNK = 100;
/** XP awarded for a review/fixation lesson (id ending in "f"). */
export const REVIEW_LESSON_XP = 3;

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function activityXp(
  r: { lesson_id: string; score: number; solution_revealed_at: string | null },
  rewards: Map<string, number>
): number {
  if (r.solution_revealed_at && r.score === 0) return 1;
  const known = rewards.get(r.lesson_id);
  if (known !== undefined) return known;
  if (!r.lesson_id.startsWith("problem-") && r.lesson_id.endsWith("f")) return REVIEW_LESSON_XP;
  return 0;
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

      const members = await fetchAllPaginated<any>(() =>
        supabase
          .from("class_members")
          .select("id, class_id, student_id")
          .in("class_id", classIds)
          .order("id")
      );

      const memberRows = members as { class_id: string; student_id: string }[];
      const studentIds = Array.from(new Set(memberRows.map((m) => m.student_id)));

      const byStudent: Record<string, Record<string, { count: number; xp: number }>> = {};
      if (studentIds.length) {
        const completed: any[] = [];
        for (const ids of chunk(studentIds, ID_CHUNK)) {
          const part = await fetchAllPaginated<any>(() =>
            supabase
              .from("completed_lessons")
              .select("id, user_id, lesson_id, score, completed_at, solution_revealed_at")
              .in("user_id", ids)
              .gte("completed_at", from.toISOString())
              .order("id")
          );
          completed.push(...part);
        }

        const completedRows = (completed ?? []) as {
          user_id: string;
          lesson_id: string;
          score: number;
          completed_at: string | null;
          solution_revealed_at: string | null;
        }[];
        const lessonIds = Array.from(
          new Set(
            completedRows
              .filter((r) => !r.lesson_id.startsWith("problem-"))
              .map((r) => r.lesson_id)
              .filter((id) => !(id.endsWith("f") && id.length > 1))
          )
        );
        const problemIds = Array.from(
          new Set(
            completedRows
              .filter((r) => r.lesson_id.startsWith("problem-"))
              .map((r) => r.lesson_id.slice("problem-".length))
          )
        );

        const rewards = new Map<string, number>();
        for (const ids of chunk(lessonIds, ID_CHUNK)) {
          const { data } = await supabase.from("lessons").select("id, xp_reward").in("id", ids);
          (data ?? []).forEach((item) => rewards.set(item.id, item.xp_reward));
        }
        for (const ids of chunk(problemIds, ID_CHUNK)) {
          const { data } = await supabase.from("problems").select("id, xp_reward").in("id", ids);
          (data ?? []).forEach((item) => rewards.set(`problem-${item.id}`, item.xp_reward));
        }

        completedRows.forEach((r) => {
          if (!r.completed_at) return;
          const k = dayKey(new Date(r.completed_at));
          byStudent[r.user_id] = byStudent[r.user_id] || {};
          const current = byStudent[r.user_id][k] ?? { count: 0, xp: 0 };
          current.count += 1;
          current.xp += activityXp(r, rewards);
          byStudent[r.user_id][k] = current;
        });
      }

      const dayKeys = days.map(dayKey);
      const rows: ClassActivityRow[] = classes.map((cls) => {
        const studentsOfClass = memberRows.filter((m) => m.class_id === cls.id).map((m) => m.student_id);
        const counts = dayKeys.map((k) =>
          studentsOfClass.reduce((sum, sid) => sum + (byStudent[sid]?.[k]?.count ?? 0), 0)
        );
        const xpTotals: number[] = [];
        let runningXp = 0;
        dayKeys.forEach((k) => {
          runningXp += studentsOfClass.reduce((sum, sid) => sum + (byStudent[sid]?.[k]?.xp ?? 0), 0);
          xpTotals.push(runningXp);
        });
        return { classId: cls.id, className: cls.name, counts, xpTotals };
      });

      return { days, rows };
    },
  });
}
