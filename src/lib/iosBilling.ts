import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

// ============= Aggressive logging helpers =============
// These send logs both to console AND to a visible toast on the screen
// so we can debug RevenueCat issues without Xcode.

const DEBUG_LOG_BUFFER: string[] = [];

function dlog(stage: string, data?: any) {
  const ts = new Date().toISOString().slice(11, 23);
  let payload = "";
  if (data !== undefined) {
    try {
      payload = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    } catch {
      payload = String(data);
    }
  }
  const line = `[${ts}] ${stage}${payload ? `: ${payload}` : ""}`;
  console.log("[iosBilling]", line);
  DEBUG_LOG_BUFFER.push(line);
  // keep only the last 50 entries
  if (DEBUG_LOG_BUFFER.length > 50) DEBUG_LOG_BUFFER.shift();
}

function derr(stage: string, err: any) {
  const ts = new Date().toISOString().slice(11, 23);
  const msg = err?.message || err?.toString?.() || String(err);
  const code = err?.code || err?.errorCode || "";
  const userInfo = err?.userInfo ? JSON.stringify(err.userInfo) : "";
  const line = `[${ts}] ❌ ${stage} | code=${code} | msg=${msg} ${userInfo}`;
  console.error("[iosBilling]", line, err);
  DEBUG_LOG_BUFFER.push(line);
  if (DEBUG_LOG_BUFFER.length > 50) DEBUG_LOG_BUFFER.shift();
  // surface as visible toast on iOS only (don't spam web)
  if (isIOSNative()) {
    toast.error(`RC: ${stage}`, {
      description: `${code ? `[${code}] ` : ""}${msg}`.slice(0, 240),
      duration: 8000,
    });
  }
}

/** Returns the in-memory debug log buffer (for an "Show debug" UI). */
export function getIOSBillingDebugLog(): string[] {
  return [...DEBUG_LOG_BUFFER];
}

export function isIOSNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

let PurchasesPlugin: any = null;
async function getPurchases(): Promise<any> {
  if (PurchasesPlugin) {
    dlog("getPurchases:cached");
    return PurchasesPlugin;
  }
  if (!isIOSNative()) {
    dlog("getPurchases:not-ios", {
      isNative: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform(),
    });
    return null;
  }
  try {
    dlog("getPurchases:importing-module");
    const mod = await import("@revenuecat/purchases-capacitor");
    PurchasesPlugin = (mod as any).Purchases || (mod as any).default;
    dlog("getPurchases:loaded", {
      hasPurchases: !!(mod as any).Purchases,
      hasDefault: !!(mod as any).default,
      keys: Object.keys(mod as any).slice(0, 20),
      pluginKeys: PurchasesPlugin ? Object.keys(PurchasesPlugin).slice(0, 20) : [],
    });
    return PurchasesPlugin;
  } catch (err) {
    derr("getPurchases:import-failed", err);
    return null;
  }
}

let initPromise: Promise<void> | null = null;
let configuredUserId: string | null = null;

export async function initIOSBilling(userId?: string): Promise<void> {
  if (!isIOSNative()) {
    dlog("init:skip-not-ios");
    return;
  }

  // If already configured for the same user, no-op
  if (initPromise && configuredUserId === (userId ?? null)) {
    dlog("init:already-configured", { userId: userId ?? null });
    return initPromise;
  }

  dlog("init:start", { userId: userId ?? null });

  initPromise = (async () => {
    const Purchases = await getPurchases();
    if (!Purchases) {
      derr("init:no-plugin", new Error("Purchases plugin not available"));
      return;
    }

    try {
      dlog("init:configure-call", {
        apiKeyPrefix: REVENUECAT_PUBLIC_API_KEY_IOS.slice(0, 6),
        hasUserId: !!userId,
      });
      await Purchases.configure({
        apiKey: REVENUECAT_PUBLIC_API_KEY_IOS,
        appUserID: userId || null,
      });
      configuredUserId = userId ?? null;
      dlog("init:configured-ok");

      // Try to fetch customer info to confirm SDK is alive
      try {
        const info = await Purchases.getCustomerInfo();
        dlog("init:customerInfo", {
          appUserID: info?.customerInfo?.originalAppUserId || info?.originalAppUserId,
          activeEntitlements: Object.keys(
            info?.customerInfo?.entitlements?.active || info?.entitlements?.active || {}
          ),
        });
      } catch (infoErr) {
        derr("init:getCustomerInfo-failed", infoErr);
      }
    } catch (err) {
      derr("init:configure-failed", err);
      initPromise = null; // allow retry
    }
  })();

  return initPromise;
}

/**
 * Trigger Apple Pay purchase flow for the given product via RevenueCat.
 */
export async function purchaseIOSSubscription(key: IOSProductKey, userId?: string): Promise<void> {
  if (!isIOSNative()) throw new Error("Apple IAP only on iOS");
  dlog("purchase:start", { key, userId });
  await initIOSBilling(userId);

  const Purchases = await getPurchases();
  if (!Purchases) throw new Error("Apple IAP not available");

  const { productId } = IOS_PRODUCTS[key];

  // Fetch current offering and find package matching our product id
  dlog("purchase:getOfferings");
  const offeringsRes = await Purchases.getOfferings();
  const current =
    offeringsRes?.current ||
    offeringsRes?.offerings?.current ||
    null;

  dlog("purchase:offerings-result", {
    hasCurrent: !!current,
    currentId: current?.identifier,
    packagesCount: current?.availablePackages?.length || 0,
    allOfferings: Object.keys(offeringsRes?.all || offeringsRes?.offerings?.all || {}),
  });

  const allPackages: any[] = current?.availablePackages || [];
  const pkg = allPackages.find(
    (p: any) =>
      p?.product?.identifier === productId ||
      p?.storeProduct?.identifier === productId
  );

  if (!pkg) {
    derr(
      "purchase:package-not-found",
      new Error(
        `No package for ${productId}. Available: ${allPackages
          .map((p) => p?.product?.identifier || p?.storeProduct?.identifier)
          .join(",")}`
      )
    );
    throw new Error(
      `Pachet RevenueCat negăsit pentru ${productId}. Verifică Offerings în RevenueCat.`
    );
  }

  dlog("purchase:purchasePackage-call", { productId });
  try {
    const result = await Purchases.purchasePackage({ aPackage: pkg });
    dlog("purchase:purchasePackage-ok");
    await syncPurchaseWithBackend(result);
  } catch (err: any) {
    // RevenueCat user cancellation should not be a hard error
    if (err?.userCancelled || err?.code === "1" || /cancel/i.test(err?.message || "")) {
      dlog("purchase:user-cancelled");
      return;
    }
    derr("purchase:purchasePackage-failed", err);
    throw err;
  }
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
    dlog("syncBackend:ok", { productIdentifier, expirationISO });
  } catch (err) {
    derr("syncBackend:failed", err);
  }
}

export interface IOSPriceInfo {
  productId: string;
  priceString: string;
  price: number;
  currencyCode: string;
}

export async function getIOSPrices(userId?: string): Promise<Partial<Record<IOSProductKey, IOSPriceInfo>>> {
  const result: Partial<Record<IOSProductKey, IOSPriceInfo>> = {};
  if (!isIOSNative()) {
    dlog("getPrices:skip-not-ios");
    return result;
  }
  dlog("getPrices:start", { userId });
  await initIOSBilling(userId);
  const Purchases = await getPurchases();
  if (!Purchases) {
    derr("getPrices:no-plugin", new Error("Purchases plugin not available"));
    return result;
  }

  try {
    dlog("getPrices:getOfferings-call");
    const offeringsRes = await Purchases.getOfferings();
    const current =
      offeringsRes?.current ||
      offeringsRes?.offerings?.current ||
      null;
    const allPackages: any[] = current?.availablePackages || [];

    dlog("getPrices:offerings-result", {
      hasCurrent: !!current,
      currentId: current?.identifier,
      packagesCount: allPackages.length,
      packageIds: allPackages
        .map((p) => p?.product?.identifier || p?.storeProduct?.identifier)
        .filter(Boolean),
      allOfferings: Object.keys(offeringsRes?.all || offeringsRes?.offerings?.all || {}),
    });

    if (allPackages.length === 0) {
      derr(
        "getPrices:no-packages",
        new Error(
          "RevenueCat returned 0 packages. Check that 'current' Offering has packages attached in RevenueCat dashboard."
        )
      );
    }

    (Object.keys(IOS_PRODUCTS) as IOSProductKey[]).forEach((key) => {
      const { productId } = IOS_PRODUCTS[key];
      const pkg = allPackages.find(
        (p: any) =>
          p?.product?.identifier === productId ||
          p?.storeProduct?.identifier === productId
      );
      if (!pkg) {
        dlog(`getPrices:missing-product`, { productId });
        return;
      }
      const sp = pkg.product || pkg.storeProduct || {};
      result[key] = {
        productId,
        priceString: sp.priceString || sp.price_string || "",
        price: typeof sp.price === "number" ? sp.price : Number(sp.price) || 0,
        currencyCode: sp.currencyCode || sp.currency_code || "",
      };
    });
    dlog("getPrices:loaded", result);
  } catch (err) {
    derr("getPrices:failed", err);
  }
  return result;
}

export async function restoreIOSPurchases(): Promise<number> {
  if (!isIOSNative()) return 0;
  dlog("restore:start");
  await initIOSBilling();
  const Purchases = await getPurchases();
  if (!Purchases) return 0;

  try {
    const result = await Purchases.restorePurchases();
    dlog("restore:ok");
    await syncPurchaseWithBackend(result);
    return 1;
  } catch (err) {
    derr("restore:failed", err);
    return 0;
  }
}

/**
 * Opens iOS Settings → Apple ID → Subscriptions so the user can manage/cancel.
 */
export async function openIOSSubscriptionManagement(): Promise<void> {
  if (!isIOSNative()) return;
  try {
    window.open("itms-apps://apps.apple.com/account/subscriptions", "_blank");
  } catch (err) {
    derr("manage:failed", err);
  }
}
