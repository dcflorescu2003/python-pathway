import { supabase } from "@/integrations/supabase/client";

export type CompetencyItemType = "exercise" | "manual_exercise" | "problem" | "eval_exercise";

export interface CompetencyItemResult {
  item_type: CompetencyItemType;
  item_id: string;
  score: number;
  max_score: number;
}

/**
 * Calls the recalculate_competency_scores RPC to update the student's
 * micro-competency mastery based on completed items.
 *
 * Fails silently — competency tracking should never block lesson/problem
 * completion UX.
 */
export async function recordCompetencyScores(
  userId: string,
  items: CompetencyItemResult[]
): Promise<void> {
  if (!userId || items.length === 0) return;

  // Normalize "Fixare" exercise ids (suffix `f`) to their base exercise id so
  // that competency mappings on the original exercise are credited.
  const normalized = items.map((it) => {
    if (it.item_type === "exercise" && it.item_id.endsWith("f")) {
      return { ...it, item_id: it.item_id.slice(0, -1) };
    }
    return it;
  });

  try {
    const { error } = await supabase.rpc("recalculate_competency_scores", {
      p_user_id: userId,
      p_items: normalized as unknown as never,
    });
    if (error) {
      console.warn("[competencyTracking] RPC failed:", error.message);
    }
  } catch (err) {
    console.warn("[competencyTracking] Unexpected error:", err);
  }
}
