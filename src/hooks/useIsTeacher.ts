import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useIsTeacher() {
  const { user } = useAuth();

  const { data: isTeacher = false, isLoading } = useQuery({
    queryKey: ["is-teacher-flag", user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_teacher")
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data?.is_teacher;
    },
  });

  return { isTeacher, isLoading };
}
