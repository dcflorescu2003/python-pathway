import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchAllPaginated } from "@/lib/supabasePagination";

export interface TestCase {
  input?: string;
  expectedOutput?: string;
  inputFiles?: Record<string, string>;
  expectedFiles?: Record<string, string>;
  hidden?: boolean;
}

export interface StaticCheck {
  description: string;
  type: "import" | "call" | "regex";
  pattern: string;
  hidden?: boolean;
}

export type ProblemKind = "execute" | "static";

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "ușor" | "mediu" | "greu";
  xpReward: number;
  testCases: TestCase[];
  staticChecks?: StaticCheck[];
  kind: ProblemKind;
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

  const { data: catalog, error: problemsError } = await supabase.rpc("get_problems_catalog");
  if (problemsError) throw problemsError;
  const problemsData = (catalog || []) as any[];

  const problemChapters: ProblemChapter[] = (chaptersData || []).map((ch: any) => ({
    id: ch.id,
    title: ch.title,
    icon: ch.icon,
    sortOrder: ch.sort_order,
  }));

  const problems: Problem[] = (problemsData || []).map((p: any) => {
    // test_cases JSONB can be either:
    //   - legacy: TestCase[]
    //   - new wrapper: { kind: "static"|"execute", testCases?: [], staticChecks?: [] }
    const raw = p.test_cases;
    let kind: ProblemKind = "execute";
    let testCases: TestCase[] = [];
    let staticChecks: StaticCheck[] | undefined;

    if (Array.isArray(raw)) {
      testCases = raw as TestCase[];
    } else if (raw && typeof raw === "object") {
      kind = (raw.kind as ProblemKind) || "execute";
      testCases = Array.isArray(raw.testCases) ? (raw.testCases as TestCase[]) : [];
      staticChecks = Array.isArray(raw.staticChecks) ? (raw.staticChecks as StaticCheck[]) : undefined;
    }

    return {
      id: p.id,
      title: p.title,
      description: p.description,
      difficulty: p.difficulty as "ușor" | "mediu" | "greu",
      xpReward: p.xp_reward,
      testCases,
      staticChecks,
      kind,
      hint: p.hint ?? undefined,
      chapter: p.chapter_id,
      solution: "",
      sortOrder: p.sort_order,
      isPremium: p.is_premium ?? false,
    };
  });

  return { problems, problemChapters };
}

export function useProblems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["problems", user?.id],
    queryFn: fetchProblems,
    enabled: !!user,
    staleTime: 30 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });
}
