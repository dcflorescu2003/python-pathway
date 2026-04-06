import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Exercise } from "@/hooks/useChapters";

export interface ManualLesson {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  exercises: Exercise[];
}

function mapExercise(row: any): Exercise {
  return {
    id: row.id,
    type: row.type,
    question: row.question,
    options: row.options ?? undefined,
    correctOptionId: row.correct_option_id ?? undefined,
    codeTemplate: row.code_template ?? undefined,
    blanks: row.blanks ?? undefined,
    lines: row.lines ?? undefined,
    statement: row.statement ?? undefined,
    isTrue: row.is_true ?? undefined,
    explanation: row.explanation ?? undefined,
    pairs: row.pairs ?? undefined,
    testCases: row.test_cases ?? undefined,
    hint: row.hint ?? undefined,
    solution: row.solution ?? undefined,
    xp: row.xp,
  };
}

async function fetchManualLessons(): Promise<ManualLesson[]> {
  const { data: lessons, error: lErr } = await supabase
    .from("manual_lessons")
    .select("*")
    .order("sort_order");
  if (lErr) throw lErr;

  const { data: exercises, error: eErr } = await supabase
    .from("manual_exercises")
    .select("*")
    .order("sort_order");
  if (eErr) throw eErr;

  const byLesson: Record<string, Exercise[]> = {};
  for (const ex of exercises || []) {
    if (!byLesson[ex.lesson_id]) byLesson[ex.lesson_id] = [];
    byLesson[ex.lesson_id].push(mapExercise(ex));
  }

  return (lessons || []).map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    sortOrder: l.sort_order,
    exercises: byLesson[l.id] || [],
  }));
}

export function useManualLessons() {
  return useQuery({
    queryKey: ["manual-lessons"],
    queryFn: fetchManualLessons,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
