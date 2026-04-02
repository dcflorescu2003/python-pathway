import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionState {
  subscribed: boolean;
  subscriptionEnd: string | null;
  source: "stripe" | "coupon" | null;
  couponExpired: boolean;
  loading: boolean;
}

const DEFAULT_STATE: SubscriptionState = {
  subscribed: false,
  subscriptionEnd: null,
  source: null,
  couponExpired: false,
  loading: false,
};

let inFlightCheck: Promise<SubscriptionState> | null = null;
let lastCheckAt = 0;
let lastCheckToken: string | null = null;
let cachedState: SubscriptionState | null = null;

async function fetchSubscriptionState(token: string): Promise<SubscriptionState> {
  const { data, error } = await supabase.functions.invoke("check-subscription", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) throw error;

  return {
    subscribed: data?.subscribed ?? false,
    subscriptionEnd: data?.subscription_end ?? null,
    source: data?.source ?? null,
    couponExpired: data?.coupon_expired ?? false,
    loading: false,
  };
}

async function getSharedSubscriptionState(token: string, force = false): Promise<SubscriptionState> {
  const now = Date.now();
  const isFresh = cachedState && lastCheckToken === token && now - lastCheckAt < 15_000;

  if (!force && isFresh) {
    return cachedState;
  }

  if (!force && inFlightCheck && lastCheckToken === token) {
    return inFlightCheck;
  }

  lastCheckToken = token;
  inFlightCheck = fetchSubscriptionState(token)
    .then((result) => {
      cachedState = result;
      lastCheckAt = Date.now();
      return result;
    })
    .finally(() => {
      inFlightCheck = null;
    });

  return inFlightCheck;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);

  const checkSubscription = useCallback(async (force = false) => {
    if (!session?.access_token) return;
    setState((s) => ({ ...s, loading: true }));
    try {
      const nextState = await getSharedSubscriptionState(session.access_token, force);
      setState(nextState);
    } catch (err) {
      console.error("check-subscription error:", err);
      setState((s) => ({ ...s, loading: false }));
    }
  }, [session?.access_token]);

  // Check on mount and every 60s
  useEffect(() => {
    if (!user) {
      setState(DEFAULT_STATE);
      return;
    }
    checkSubscription();
    const interval = setInterval(() => {
      void checkSubscription(true);
    }, 60_000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  // Check after returning from checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      setTimeout(() => {
        void checkSubscription(true);
      }, 2000);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [checkSubscription]);

  const dismissCouponExpired = useCallback(() => {
    setState((s) => ({ ...s, couponExpired: false }));
  }, []);

  const startCheckout = useCallback(
    async (priceId: string) => {
      if (!session?.access_token) return;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    },
    [session?.access_token]
  );

  const openPortal = useCallback(async () => {
    if (!session?.access_token) return;
    const { data, error } = await supabase.functions.invoke("customer-portal", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  }, [session?.access_token]);

  return { ...state, checkSubscription, startCheckout, openPortal, dismissCouponExpired };
}
