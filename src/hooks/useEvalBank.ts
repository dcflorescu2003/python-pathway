import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EvalChapter {
  id: string;
  title: string;
  icon: string;
  sort_order: number;
}

export interface EvalLesson {
  id: string;
  chapter_id: string;
  title: string;
  sort_order: number;
}

export interface EvalExercise {
  id: string;
  lesson_id: string;
  type: string;
  question: string;
  options: any;
  correct_option_id: string | null;
  blanks: any;
  lines: any;
  statement: string | null;
  is_true: boolean | null;
  explanation: string | null;
  sort_order: number;
}

export function useEvalChapters() {
  return useQuery({
    queryKey: ["eval-chapters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eval_chapters")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as EvalChapter[];
    },
  });
}

export function useEvalLessons(chapterId: string | null) {
  return useQuery({
    queryKey: ["eval-lessons", chapterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eval_lessons")
        .select("*")
        .eq("chapter_id", chapterId!)
        .order("sort_order");
      if (error) throw error;
      return data as EvalLesson[];
    },
    enabled: !!chapterId,
  });
}

export function useEvalExercises(lessonId: string | null) {
  return useQuery({
    queryKey: ["eval-exercises", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eval_exercises")
        .select("*")
        .eq("lesson_id", lessonId!)
        .order("sort_order");
      if (error) throw error;
      return data as EvalExercise[];
    },
    enabled: !!lessonId,
  });
}

export function useAllEvalExercises() {
  return useQuery({
    queryKey: ["eval-exercises-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eval_exercises")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as EvalExercise[];
    },
  });
}

export function useEvalBankMutations() {
  const qc = useQueryClient();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["eval-chapters"] });
    qc.invalidateQueries({ queryKey: ["eval-lessons"] });
    qc.invalidateQueries({ queryKey: ["eval-exercises"] });
    qc.invalidateQueries({ queryKey: ["eval-exercises-all"] });
  };

  const createChapter = useMutation({
    mutationFn: async (ch: Omit<EvalChapter, "sort_order"> & { sort_order?: number }) => {
      const { error } = await supabase.from("eval_chapters").insert(ch as any);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const updateChapter = useMutation({
    mutationFn: async ({ id, ...rest }: Partial<EvalChapter> & { id: string }) => {
      const { error } = await supabase.from("eval_chapters").update(rest as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const deleteChapter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("eval_chapters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const createLesson = useMutation({
    mutationFn: async (l: Omit<EvalLesson, "sort_order"> & { sort_order?: number }) => {
      const { error } = await supabase.from("eval_lessons").insert(l as any);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const updateLesson = useMutation({
    mutationFn: async ({ id, ...rest }: Partial<EvalLesson> & { id: string }) => {
      const { error } = await supabase.from("eval_lessons").update(rest as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("eval_lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const createExercise = useMutation({
    mutationFn: async (ex: any) => {
      const { error } = await supabase.from("eval_exercises").insert(ex);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const updateExercise = useMutation({
    mutationFn: async ({ id, ...rest }: any) => {
      const { error } = await supabase.from("eval_exercises").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const deleteExercise = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("eval_exercises").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  return {
    createChapter, updateChapter, deleteChapter,
    createLesson, updateLesson, deleteLesson,
    createExercise, updateExercise, deleteExercise,
  };
}
