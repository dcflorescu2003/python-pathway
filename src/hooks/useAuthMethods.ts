import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AuthMethodsInfo {
  hasApple: boolean;
  hasGoogle: boolean;
  hasPassword: boolean;
  email: string | null;
  isPrivateRelay: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useAuthMethods(): AuthMethodsInfo {
  const { user } = useAuth();
  const [identities, setIdentities] = useState<any[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    setIdentities((u?.identities as any[]) || []);
    const provs = ((u?.app_metadata as any)?.providers as string[]) || [];
    setProviders(provs);
    setEmail(u?.email || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) refresh();
    else setLoading(false);
  }, [user?.id, refresh]);

  const hasApple =
    identities.some((i) => i.provider === "apple") || providers.includes("apple");
  const hasGoogle =
    identities.some((i) => i.provider === "google") || providers.includes("google");
  const hasPassword =
    identities.some((i) => i.provider === "email") || providers.includes("email");
  const isPrivateRelay = !!email && email.endsWith("@privaterelay.appleid.com");

  return { hasApple, hasGoogle, hasPassword, email, isPrivateRelay, loading, refresh };
}
