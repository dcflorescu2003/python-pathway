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
  const [hasRealPassword, setHasRealPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    setIdentities((u?.identities as any[]) || []);
    const provs = ((u?.app_metadata as any)?.providers as string[]) || [];
    setProviders(provs);
    setEmail(u?.email || null);

    if (u?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("has_real_password")
        .eq("user_id", u.id)
        .maybeSingle();
      setHasRealPassword(!!profile?.has_real_password);
    } else {
      setHasRealPassword(false);
    }
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
  // Source of truth: explicit flag set after the user actually sets a password.
  // We do NOT derive this from auth.identities because Supabase auto-adds an
  // `email` identity for Apple Hide-My-Email users who never set a password.
  const hasPassword = hasRealPassword;
  const isPrivateRelay = !!email && email.endsWith("@privaterelay.appleid.com");

  return { hasApple, hasGoogle, hasPassword, email, isPrivateRelay, loading, refresh };
}
