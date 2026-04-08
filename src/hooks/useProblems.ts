import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TestCase {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "ușor" | "mediu" | "greu";
  xpReward: number;
  testCases: TestCase[];
  hint?: string;
  chapter: string;
  solution: string;
  sortOrder: number;
  isPremium: boolean;
}

export interface ProblemChapter {
  id: string;
  title: string;
  icon: string;
  sortOrder: number;
}

async function fetchProblems(): Promise<{ problems: Problem[]; problemChapters: ProblemChapter[] }> {
  const { data: chaptersData, error: chaptersError } = await supabase
    .from("problem_chapters")
    .select("*")
    .order("sort_order", { ascending: true });

  if (chaptersError) throw chaptersError;

  const { data: problemsData, error: problemsError } = await supabase
    .from("problems_public" as any)
    .select("id, title, description, difficulty, xp_reward, test_cases, hint, chapter_id, sort_order, is_premium")
    .order("sort_order", { ascending: true }) as { data: any[] | null; error: any };

  if (problemsError) throw problemsError;

  const problemChapters: ProblemChapter[] = chaptersData.map(ch => ({
    id: ch.id,
    title: ch.title,
    icon: ch.icon,
    sortOrder: ch.sort_order,
  }));

  const problems: Problem[] = (problemsData || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    difficulty: p.difficulty as "ușor" | "mediu" | "greu",
    xpReward: p.xp_reward,
    testCases: (p.test_cases as any[] || []) as TestCase[],
    hint: p.hint ?? undefined,
    chapter: p.chapter_id,
    solution: "", // fetched on-demand via get_problem_solution RPC
    sortOrder: p.sort_order,
    isPremium: p.is_premium ?? false,
  }));

  return { problems, problemChapters };
}

export function useProblems() {
  return useQuery({
    queryKey: ["problems"],
    queryFn: fetchProblems,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  });
}
