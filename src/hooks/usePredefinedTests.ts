import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PredefinedTest {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  time_limit_minutes: number | null;
  variant_mode: string;
  sort_order: number;
  created_at: string;
}

export interface PredefinedTestItem {
  id: string;
  test_id: string;
  variant: string;
  sort_order: number;
  source_type: string;
  source_id: string | null;
  custom_data: any;
  points: number;
}

export function usePredefinedTests() {
  return useQuery({
    queryKey: ["predefined-tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predefined_tests")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as PredefinedTest[];
    },
  });
}

export function usePredefinedTestItems(testId: string | null) {
  return useQuery({
    queryKey: ["predefined-test-items", testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predefined_test_items")
        .select("*")
        .eq("test_id", testId!)
        .order("sort_order");
      if (error) throw error;
      return data as PredefinedTestItem[];
    },
    enabled: !!testId,
  });
}

export function usePredefinedTestMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["predefined-tests"] });
    qc.invalidateQueries({ queryKey: ["predefined-test-items"] });
  };

  const createTest = useMutation({
    mutationFn: async (test: Omit<PredefinedTest, "id" | "created_at" | "sort_order"> & { sort_order?: number }) => {
      const { data, error } = await supabase.from("predefined_tests").insert(test as any).select().single();
      if (error) throw error;
      return data as PredefinedTest;
    },
    onSuccess: invalidate,
  });

  const updateTest = useMutation({
    mutationFn: async ({ id, ...rest }: Partial<PredefinedTest> & { id: string }) => {
      const { error } = await supabase.from("predefined_tests").update(rest as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("predefined_tests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const saveItems = useMutation({
    mutationFn: async ({ testId, items }: { testId: string; items: Omit<PredefinedTestItem, "id">[] }) => {
      // Delete existing items then insert new ones
      await supabase.from("predefined_test_items").delete().eq("test_id", testId);
      if (items.length > 0) {
        const { error } = await supabase.from("predefined_test_items").insert(
          items.map((item, i) => ({ ...item, test_id: testId, sort_order: i })) as any
        );
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  return { createTest, updateTest, deleteTest, saveItems };
}
