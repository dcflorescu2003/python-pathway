import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ItemType =
  | "exercise"
  | "eval_exercise"
  | "manual_exercise"
  | "problem"
  | "test_item"
  | "predefined_test_item";

export interface Microcompetency {
  id: string;
  code: string;
  title: string;
  description: string;
  specific_id: string;
  category: string;
  grade: number;
  sort_order: number;
}

export interface CompetencySpecific {
  id: string;
  code: string;
  title: string;
  general_id: string;
  grade: number;
  sort_order: number;
}

export interface CompetencyGeneral {
  id: string;
  code: string;
  title: string;
  sort_order: number;
}

export interface ItemCompetency {
  id: string;
  item_type: ItemType;
  item_id: string;
  microcompetency_id: string;
  weight: number;
}

/**
 * Loads the full competency catalog (CG + CS + M) once and caches it for 10 minutes.
 * The catalog is small (~136 rows total) and rarely changes, so we share it across
 * all CompetencyTagger instances.
 */
export function useCompetencyCatalog() {
  return useQuery({
    queryKey: ["competency-catalog"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const [generalRes, specificRes, microRes] = await Promise.all([
        supabase.from("competencies_general").select("*").order("sort_order"),
        supabase.from("competencies_specific").select("*").order("sort_order"),
        supabase.from("microcompetencies").select("*").order("sort_order"),
      ]);
      if (generalRes.error) throw generalRes.error;
      if (specificRes.error) throw specificRes.error;
      if (microRes.error) throw microRes.error;
      return {
        general: (generalRes.data ?? []) as CompetencyGeneral[],
        specific: (specificRes.data ?? []) as CompetencySpecific[],
        micro: (microRes.data ?? []) as Microcompetency[],
      };
    },
  });
}

/**
 * Loads the microcompetency mappings for a single item.
 * Skip the query while itemId is empty (e.g. before the parent record is saved).
 */
export function useItemCompetencies(itemType: ItemType, itemId: string | null | undefined) {
  return useQuery({
    queryKey: ["item-competencies", itemType, itemId],
    enabled: Boolean(itemId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("item_competencies")
        .select("*")
        .eq("item_type", itemType)
        .eq("item_id", itemId as string);
      if (error) throw error;
      return (data ?? []) as ItemCompetency[];
    },
  });
}

export function useSetItemCompetency(itemType: ItemType, itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      microcompetency_id,
      weight,
    }: {
      microcompetency_id: string;
      weight: number;
    }) => {
      // Upsert by unique (item_type, item_id, microcompetency_id)
      const { data: existing } = await supabase
        .from("item_competencies")
        .select("id")
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .eq("microcompetency_id", microcompetency_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("item_competencies")
          .update({ weight })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("item_competencies").insert({
          item_type: itemType,
          item_id: itemId,
          microcompetency_id,
          weight,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["item-competencies", itemType, itemId] });
    },
  });
}

export function useRemoveItemCompetency(itemType: ItemType, itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (microcompetency_id: string) => {
      const { error } = await supabase
        .from("item_competencies")
        .delete()
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .eq("microcompetency_id", microcompetency_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["item-competencies", itemType, itemId] });
    },
  });
}
