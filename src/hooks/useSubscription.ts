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
  const { data, error } = await supabase.functions.invoke("check-subscription");

  if (error) throw error;

  return {
    subscribed: data?.subscribed ?? false,
    subscriptionEnd: data?.subscription_end ?? null,
    source: data?.source ?? null,
    couponExpired: data?.coupon_expired ?? false,
    loading: false,
  };
}

function invalidateCache() {
  cachedState = null;
  lastCheckAt = 0;
  lastCheckToken = null;
  inFlightCheck = null;
}

async function getSharedSubscriptionState(force = false, userId?: string): Promise<SubscriptionState> {
  // Invalidate cache when user changes
  if (userId && lastCheckToken && lastCheckToken !== userId) {
    invalidateCache();
    force = true;
  }
  if (userId) lastCheckToken = userId;

  const now = Date.now();
  const isFresh = cachedState && now - lastCheckAt < 15_000;

  if (!force && isFresh) {
    return cachedState;
  }

  if (!force && inFlightCheck) {
    return inFlightCheck;
  }

  inFlightCheck = fetchSubscriptionState("")
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
    if (!user) return;
    setState((s) => ({ ...s, loading: true }));
    try {
      const nextState = await getSharedSubscriptionState(force, user.id);
      setState(nextState);
    } catch (err) {
      console.error("check-subscription error:", err);
      setState((s) => ({ ...s, loading: false }));
    }
  }, [user]);

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
      if (!session) return;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    },
    [session]
  );

  const openPortal = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  }, [session]);

  return { ...state, checkSubscription, startCheckout, openPortal, dismissCouponExpired };
}
