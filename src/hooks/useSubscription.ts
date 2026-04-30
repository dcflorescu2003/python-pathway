import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  isAndroidNative,
  initPlayBilling,
  purchaseSubscription,
  restorePlayPurchases,
  openPlaySubscriptionManagement,
  STRIPE_TO_ANDROID,
} from "@/lib/playBilling";
import {
  isIOSNative,
  initIOSBilling,
  purchaseIOSSubscription,
  restoreIOSPurchases,
  openIOSSubscriptionManagement,
  getIOSPrices,
  STRIPE_TO_IOS,
  type IOSPriceInfo,
  type IOSProductKey,
} from "@/lib/iosBilling";

// Stripe product IDs for subscription type detection
export const STUDENT_PRODUCT_IDS = [
  "prod_UJytlzfmO6QOWq",
  "prod_UJyuPMfGUzX6VG",
  "prod_SKTMeV1Qx2QN9V",
];

export const TEACHER_PRODUCT_IDS = [
  "prod_UJyuT97MzPvyj8",
  "prod_UJyudq2JiikIbg",
];

// Price IDs for checkout
export const STUDENT_MONTHLY_PRICE = "price_1TLKvsRontECmDbLYGMnGnZM";
export const STUDENT_YEARLY_PRICE = "price_1TLKwHRontECmDbLIKWWHQXI";
export const TEACHER_MONTHLY_PRICE = "price_1TLKwiRontECmDbL4q96Kth4";
export const TEACHER_YEARLY_PRICE = "price_1TLKwxRontECmDbLbRNdw8GG";

interface SubscriptionState {
  subscribed: boolean;
  subscriptionEnd: string | null;
  source: "stripe" | "coupon" | "play_billing" | "ios_iap" | null;
  couponExpired: boolean;
  couponType: string | null;
  couponDaysRemaining: number | null;
  loading: boolean;
  productId: string | null;
}

const DEFAULT_STATE: SubscriptionState = {
  subscribed: false,
  subscriptionEnd: null,
  source: null,
  couponExpired: false,
  couponType: null,
  couponDaysRemaining: null,
  loading: false,
  productId: null,
};

let inFlightCheck: Promise<SubscriptionState> | null = null;
let lastCheckAt = 0;
let lastCheckToken: string | null = null;
let cachedState: SubscriptionState | null = null;

async function fetchSubscriptionState(): Promise<SubscriptionState> {
  const { data, error } = await supabase.functions.invoke("check-subscription");

  if (error) throw error;

  return {
    subscribed: data?.subscribed ?? false,
    subscriptionEnd: data?.subscription_end ?? null,
    source: data?.source ?? null,
    couponExpired: data?.coupon_expired ?? false,
    couponType: data?.coupon_type ?? null,
    couponDaysRemaining: data?.coupon_days_remaining ?? null,
    loading: false,
    productId: data?.product_id ?? null,
  };
}

function invalidateCache() {
  cachedState = null;
  lastCheckAt = 0;
  lastCheckToken = null;
  inFlightCheck = null;
}

async function getSharedSubscriptionState(force = false, userId?: string): Promise<SubscriptionState> {
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

  inFlightCheck = fetchSubscriptionState()
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
  const [state, setState] = useState<SubscriptionState>(cachedState ?? { ...DEFAULT_STATE, loading: !!user });
  const [iosPrices, setIosPrices] = useState<Partial<Record<IOSProductKey, IOSPriceInfo>>>({});

  const isTeacherPremium = state.productId
    ? TEACHER_PRODUCT_IDS.includes(state.productId)
    : (state.source === "coupon" && state.couponType === "teacher" && state.subscribed);
  const isStudentPremium = state.subscribed && !isTeacherPremium;

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

  useEffect(() => {
    if (!user) {
      setState(DEFAULT_STATE);
      invalidateCache();
      return;
    }
    checkSubscription();
    if (isAndroidNative()) {
      void initPlayBilling(user.id);
    }
    if (isIOSNative()) {
      void initIOSBilling(user.id).then(async () => {
        try {
          const prices = await getIOSPrices();
          setIosPrices(prices);
        } catch (err) {
          console.warn("[useSubscription] getIOSPrices failed", err);
        }
      });
    }
    const interval = setInterval(() => {
      void checkSubscription(true);
    }, 60_000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

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

      const android = isAndroidNative();
      const ios = isIOSNative();
      console.log("[startCheckout]", { android, ios, priceId });

      if (android) {
        const productKey = STRIPE_TO_ANDROID[priceId];
        if (!productKey) throw new Error("Produsul nu este disponibil pe Android");
        await purchaseSubscription(productKey);
        setTimeout(() => void checkSubscription(true), 2500);
        return;
      }

      if (ios) {
        const productKey = STRIPE_TO_IOS[priceId];
        if (!productKey) throw new Error("Produsul nu este disponibil pe iOS");
        console.log("[startCheckout] Using iOS RevenueCat for", productKey);
        try {
          await purchaseIOSSubscription(productKey);
          setTimeout(() => void checkSubscription(true), 2500);
        } catch (err) {
          console.error("[startCheckout] iOS purchase failed:", err);
          // NU mai cădem pe Stripe pe iOS — Apple interzice asta în aplicații native.
          throw err;
        }
        return;
      }

      console.log("[startCheckout] Falling back to Stripe checkout (web only)");

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    },
    [session, checkSubscription]
  );

  const openPortal = useCallback(async () => {
    if (!session) return;

    if (isAndroidNative()) {
      await openPlaySubscriptionManagement();
      return;
    }

    if (isIOSNative()) {
      await openIOSSubscriptionManagement();
      return;
    }

    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  }, [session]);

  const restorePurchases = useCallback(async () => {
    let count = 0;
    if (isAndroidNative()) {
      count = await restorePlayPurchases();
    } else if (isIOSNative()) {
      count = await restoreIOSPurchases();
    } else {
      return 0;
    }
    setTimeout(() => void checkSubscription(true), 1500);
    return count;
  }, [checkSubscription]);

  return {
    ...state,
    isTeacherPremium,
    isStudentPremium,
    isAndroidNative: isAndroidNative(),
    isIOSNative: isIOSNative(),
    iosPrices,
    checkSubscription,
    startCheckout,
    openPortal,
    restorePurchases,
    dismissCouponExpired,
  };
}
