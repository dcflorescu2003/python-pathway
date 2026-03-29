import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ActiveChallenge {
  id: string;
  class_id: string;
  class_name: string;
  item_type: string;
  item_id: string;
  created_at: string;
}

export function useChallenges() {
  const { user } = useAuth();

  const { data: challenges = [], ...rest } = useQuery({
    queryKey: ["student-challenges", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get classes the student is a member of
      const { data: memberships } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("student_id", user.id);

      if (!memberships || memberships.length === 0) return [];

      const classIds = memberships.map((m) => m.class_id);

      // Get challenges for those classes
      const { data: challengeData } = await supabase
        .from("challenges")
        .select("*")
        .in("class_id", classIds)
        .order("created_at", { ascending: false });

      if (!challengeData || challengeData.length === 0) return [];

      // Get class names
      const { data: classes } = await supabase
        .from("teacher_classes")
        .select("id, name")
        .in("id", classIds);

      const classMap = new Map((classes || []).map((c) => [c.id, c.name]));

      return challengeData.map((ch) => ({
        ...ch,
        class_name: classMap.get(ch.class_id) || "Clasă",
      })) as ActiveChallenge[];
    },
    enabled: !!user,
  });

  // Helper to check if an item is a challenge
  const isChallenge = (itemId: string): boolean => {
    return challenges.some((c) => c.item_id === itemId);
  };

  return { challenges, isChallenge, ...rest };
}
