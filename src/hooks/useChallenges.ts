import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ActiveChallenge {
  id: string;
  class_id: string;
  class_name: string;
  item_type: string;
  item_id: string;
  item_title: string;
  created_at: string;
}

export function useChallenges() {
  const { user } = useAuth();

  const { data: challenges = [], ...rest } = useQuery({
    queryKey: ["student-challenges", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: memberships } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("student_id", user.id);

      if (!memberships || memberships.length === 0) return [];

      const classIds = memberships.map((m) => m.class_id);

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

      // Collect item IDs by type for title lookup
      const lessonIds = challengeData.filter(c => c.item_type === "lesson").map(c => c.item_id);
      const problemIds = challengeData.filter(c => c.item_type === "problem").map(c => c.item_id);

      const titleMap = new Map<string, string>();

      if (lessonIds.length > 0) {
        const { data: lessons } = await supabase
          .from("lessons")
          .select("id, title")
          .in("id", lessonIds);
        (lessons || []).forEach(l => titleMap.set(l.id, l.title));
      }

      if (problemIds.length > 0) {
        const { data: problems } = await supabase
          .from("problems")
          .select("id, title")
          .in("id", problemIds);
        (problems || []).forEach(p => titleMap.set(p.id, p.title));
      }

      return challengeData.map((ch) => ({
        ...ch,
        class_name: classMap.get(ch.class_id) || "Clasă",
        item_title: titleMap.get(ch.item_id) || ch.item_id,
      })) as ActiveChallenge[];
    },
    enabled: !!user,
  });

  const isChallenge = (itemId: string): boolean => {
    return challenges.some((c) => c.item_id === itemId);
  };

  return { challenges, isChallenge, ...rest };
}
