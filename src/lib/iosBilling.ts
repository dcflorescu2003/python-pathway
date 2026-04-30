import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

// iOS Product IDs (must match exactly the Product IDs created in App Store Connect)
export const IOS_PRODUCTS = {
  student_monthly: { productId: "pyro_student_monthly_ios" },
  student_yearly: { productId: "pyro_student_yearly_ios" },
  teacher_monthly: { productId: "pyro_teacher_monthly_ios" },
  teacher_yearly: { productId: "pyro_teacher_yearly_ios" },
} as const;

export type IOSProductKey = keyof typeof IOS_PRODUCTS;

// Mapping from Stripe price IDs to iOS product keys, mirroring STRIPE_TO_ANDROID
export const STRIPE_TO_IOS: Record<string, IOSProductKey> = {
  price_1TLKvsRontECmDbLYGMnGnZM: "student_monthly",
  price_1TLKwHRontECmDbLIKWWHQXI: "student_yearly",
  price_1TLKwiRontECmDbL4q96Kth4: "teacher_monthly",
  price_1TLKwxRontECmDbLbRNdw8GG: "teacher_yearly",
};

// RevenueCat public iOS API key (publishable, safe in client code).
// Source: RevenueCat Dashboard → Project Settings → API Keys → Pyro (App Store).
const REVENUECAT_PUBLIC_API_KEY_IOS = "appl_HJzjSqAtmWWTejEByusfNbnrLaD";

export function isIOSNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

let PurchasesPlugin: any = null;
async function getPurchases(): Promise<any> {
  if (PurchasesPlugin) return PurchasesPlugin;
  if (!isIOSNative()) return null;
  try {
    const mod = await import("@revenuecat/purchases-capacitor");
    PurchasesPlugin = (mod as any).Purchases || (mod as any).default;
    return PurchasesPlugin;
  } catch (err) {
    console.warn("[iosBilling] Failed to load @revenuecat/purchases-capacitor", err);
    return null;
  }
}

let initPromise: Promise<void> | null = null;
let configuredUserId: string | null = null;

export async function initIOSBilling(userId?: string): Promise<void> {
  if (!isIOSNative()) return;

  // If already configured for the same user, no-op
  if (initPromise && configuredUserId === (userId ?? null)) return initPromise;

  initPromise = (async () => {
    const Purchases = await getPurchases();
    if (!Purchases) {
      console.warn("[iosBilling] Purchases plugin not available");
      return;
    }

    try {
      await Purchases.configure({
        apiKey: REVENUECAT_PUBLIC_API_KEY_IOS,
        appUserID: userId || null,
      });
      configuredUserId = userId ?? null;
      console.log("[iosBilling] RevenueCat initialized", { hasUserId: !!userId });
    } catch (err) {
      console.error("[iosBilling] init failed:", err);
      initPromise = null; // allow retry
    }
  })();

  return initPromise;
}

/**
 * Trigger Apple Pay purchase flow for the given product via RevenueCat.
 * After completion, the customerInfo is sent to our backend so we mark the user
 * as Premium immediately (RevenueCat webhook is the long-term source of truth).
 */
export async function purchaseIOSSubscription(key: IOSProductKey): Promise<void> {
  if (!isIOSNative()) throw new Error("Apple IAP only on iOS");
  await initIOSBilling();

  const Purchases = await getPurchases();
  if (!Purchases) throw new Error("Apple IAP not available");

  const { productId } = IOS_PRODUCTS[key];

  // Fetch current offering and find package matching our product id
  const offeringsRes = await Purchases.getOfferings();
  const current =
    offeringsRes?.current ||
    offeringsRes?.offerings?.current ||
    null;

  const allPackages: any[] = current?.availablePackages || [];
  const pkg = allPackages.find(
    (p: any) =>
      p?.product?.identifier === productId ||
      p?.storeProduct?.identifier === productId
  );

  if (!pkg) {
    throw new Error(
      `Pachet RevenueCat negăsit pentru ${productId}. Verifică Offerings în RevenueCat.`
    );
  }

  const result = await Purchases.purchasePackage({ aPackage: pkg });
  await syncPurchaseWithBackend(result);
}

async function syncPurchaseWithBackend(result: any): Promise<void> {
  try {
    const customerInfo = result?.customerInfo || result?.purchaserInfo || result;
    const productIdentifier =
      result?.productIdentifier ||
      Object.keys(customerInfo?.activeSubscriptions || {})[0] ||
      (Array.isArray(customerInfo?.activeSubscriptions)
        ? customerInfo.activeSubscriptions[0]
        : null);
    const originalAppUserId =
      customerInfo?.originalAppUserId || customerInfo?.appUserID;
    const entitlements = customerInfo?.entitlements?.active || {};
    const firstEntitlement = Object.values(entitlements)[0] as
      | { expirationDate?: string; productIdentifier?: string }
      | undefined;
    const expirationISO =
      firstEntitlement?.expirationDate ||
      customerInfo?.allExpirationDates?.[productIdentifier as string] ||
      null;

    await supabase.functions.invoke("verify-ios-purchase", {
      body: {
        productId: productIdentifier || firstEntitlement?.productIdentifier,
        originalTransactionId:
          customerInfo?.originalApplicationVersion || originalAppUserId,
        revenuecatUserId: originalAppUserId,
        expirationISO,
        entitlements,
        rawCustomerInfo: customerInfo,
      },
    });
    console.log("[iosBilling] backend sync ok", {
      productIdentifier,
      expirationISO,
    });
  } catch (err) {
    console.error("[iosBilling] backend sync failed:", err);
  }
}

export async function restoreIOSPurchases(): Promise<number> {
  if (!isIOSNative()) return 0;
  await initIOSBilling();
  const Purchases = await getPurchases();
  if (!Purchases) return 0;

  try {
    const result = await Purchases.restorePurchases();
    await syncPurchaseWithBackend(result);
    return 1;
  } catch (err) {
    console.error("[iosBilling] restore failed:", err);
    return 0;
  }
}

/**
 * Opens iOS Settings → Apple ID → Subscriptions so the user can manage/cancel.
 * Apple does not allow in-app cancellation; this deep-link is the official path.
 */
export async function openIOSSubscriptionManagement(): Promise<void> {
  if (!isIOSNative()) return;
  try {
    window.open("itms-apps://apps.apple.com/account/subscriptions", "_blank");
  } catch (err) {
    console.error("[iosBilling] manage failed:", err);
  }
}
