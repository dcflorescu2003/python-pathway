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

  try {
    const { error } = await supabase.rpc("recalculate_competency_scores", {
      p_user_id: userId,
      p_items: items as unknown as never,
    });
    if (error) {
      console.warn("[competencyTracking] RPC failed:", error.message);
    }
  } catch (err) {
    console.warn("[competencyTracking] Unexpected error:", err);
  }
}
