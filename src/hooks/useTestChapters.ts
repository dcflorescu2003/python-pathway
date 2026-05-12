import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TestChapter {
  id: string;
  title: string;
  icon: string;
  sort_order: number;
}

export function useTestChapters() {
  return useQuery({
    queryKey: ["test-chapters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_chapters")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as TestChapter[];
    },
  });
}

export function useTestChapterMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["test-chapters"] });
    qc.invalidateQueries({ queryKey: ["predefined-tests"] });
  };

  const createChapter = useMutation({
    mutationFn: async (ch: TestChapter) => {
      const { error } = await supabase.from("test_chapters").insert(ch as any);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateChapter = useMutation({
    mutationFn: async ({ id, ...rest }: Partial<TestChapter> & { id: string }) => {
      const { error } = await supabase.from("test_chapters").update(rest as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteChapter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("test_chapters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createChapter, updateChapter, deleteChapter };
}
