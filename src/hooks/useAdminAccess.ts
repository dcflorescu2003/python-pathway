import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAdminAccess() {
  const { user } = useAuth();

  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ["admin-access", user?.email],
    queryFn: async () => {
      if (!user?.email) return false;
      const { data } = await supabase
        .from("admin_emails")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.email,
    staleTime: 1000 * 60 * 30,
  });

  return { isAdmin, isLoading };
}
