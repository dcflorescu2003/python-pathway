import { Capacitor } from "@capacitor/core";
import { CapacitorPurchases } from "@capgo/capacitor-purchases";
import { supabase } from "@/integrations/supabase/client";

export const ANDROID_PRODUCTS = {
  student_monthly: { productId: "student_premium", planId: "monthly" },
  student_yearly: { productId: "student_premium", planId: "yearly" },
  teacher_monthly: { productId: "teacher_premium", planId: "monthly" },
  teacher_yearly: { productId: "teacher_premium", planId: "yearly" },
} as const;

export type PlayProductKey = keyof typeof ANDROID_PRODUCTS;

// Map web Stripe price IDs → Android product keys
export const STRIPE_TO_ANDROID: Record<string, PlayProductKey> = {
  price_1TLKvsRontECmDbLYGMnGnZM: "student_monthly",
  price_1TLKwHRontECmDbLIKWWHQXI: "student_yearly",
  price_1TLKwiRontECmDbL4q96Kth4: "teacher_monthly",
  price_1TLKwxRontECmDbLbRNdw8GG: "teacher_yearly",
};

export function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

let initialized = false;

export async function initPlayBilling(userId: string): Promise<void> {
  if (!isAndroidNative() || initialized) return;
  try {
    // @capgo/capacitor-purchases uses RevenueCat-style API; for direct Play Billing,
    // we wrap the underlying BillingClient. The plugin auto-initializes on first use.
    await CapacitorPurchases.setupPurchases({ apiKey: "play_billing_native", appUserID: userId });
    initialized = true;
  } catch (err) {
    console.warn("[playBilling] init failed (non-fatal):", err);
  }
}

export async function purchaseSubscription(key: PlayProductKey): Promise<{
  purchaseToken: string;
  productId: string;
  planId: string;
  orderId?: string;
}> {
  if (!isAndroidNative()) throw new Error("Play Billing only on Android");

  const { productId, planId } = ANDROID_PRODUCTS[key];

  // Trigger native purchase flow
  const result: any = await CapacitorPurchases.purchasePackage({
    identifier: `${productId}:${planId}`,
    offeringIdentifier: productId,
  } as any);

  const transaction = result?.transaction || result?.purchase || result;
  const purchaseToken = transaction?.purchaseToken || transaction?.transactionIdentifier;
  const orderId = transaction?.orderId || transaction?.transactionId;

  if (!purchaseToken) throw new Error("Lipsește token-ul de achiziție");

  return { purchaseToken, productId, planId, orderId };
}

export async function verifyPurchaseOnServer(args: {
  purchaseToken: string;
  productId: string;
  planId: string;
  orderId?: string;
}): Promise<void> {
  const { error } = await supabase.functions.invoke("verify-play-purchase", { body: args });
  if (error) throw error;
}

export async function restorePlayPurchases(): Promise<number> {
  if (!isAndroidNative()) return 0;
  try {
    const result: any = await CapacitorPurchases.restorePurchases();
    const transactions: any[] =
      result?.customerInfo?.nonSubscriptionTransactions ||
      result?.purchases ||
      [];

    let restored = 0;
    for (const tx of transactions) {
      const purchaseToken = tx?.purchaseToken || tx?.transactionIdentifier;
      const productId = tx?.productIdentifier || tx?.productId;
      if (!purchaseToken || !productId) continue;
      try {
        await verifyPurchaseOnServer({
          purchaseToken,
          productId,
          planId: tx?.planId || "",
          orderId: tx?.orderId,
        });
        restored++;
      } catch (e) {
        console.warn("[playBilling] restore item failed:", e);
      }
    }
    return restored;
  } catch (err) {
    console.error("[playBilling] restore failed:", err);
    return 0;
  }
}
