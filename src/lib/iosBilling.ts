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
const REVENUECAT_PUBLIC_API_KEY_IOS = "appl_HJzjSqAtmWWTejEByusfNbnrLaD";

// ============= Aggressive logging helpers =============
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
  if (DEBUG_LOG_BUFFER.length > 80) DEBUG_LOG_BUFFER.shift();
}

function derr(stage: string, err: any) {
  const ts = new Date().toISOString().slice(11, 23);
  const msg = err?.message || err?.toString?.() || String(err);
  const code = err?.code || err?.errorCode || "";
  const userInfo = err?.userInfo ? JSON.stringify(err.userInfo) : "";
  const line = `[${ts}] ❌ ${stage} | code=${code} | msg=${msg} ${userInfo}`;
  console.error("[iosBilling]", line, err);
  DEBUG_LOG_BUFFER.push(line);
  if (DEBUG_LOG_BUFFER.length > 80) DEBUG_LOG_BUFFER.shift();
  if (isIOSNative()) {
    toast.error(`RC: ${stage}`, {
      description: `${code ? `[${code}] ` : ""}${msg}`.slice(0, 240),
      duration: 8000,
    });
  }
}

export function getIOSBillingDebugLog(): string[] {
  return [...DEBUG_LOG_BUFFER];
}

export function isIOSNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

// ============= Promise helpers =============

function withTimeout<T>(promise: Promise<T> | T, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      reject(new Error(`TIMEOUT_${label}_${ms}ms`));
    }, ms);
    Promise.resolve(promise).then(
      (v) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

function callNativeWithTimeout<T>(
  call: () => Promise<T> | T,
  ms: number,
  label: string,
  stage: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      reject(new Error(`TIMEOUT_${label}_${ms}ms`));
    }, ms);

    let nativeResult: Promise<T> | T;
    try {
      dlog(`${stage}:before-native-call`, { ms });
      nativeResult = call();
      dlog(`${stage}:after-native-call`, {
        returned: nativeResult !== undefined,
        thenable: typeof (nativeResult as any)?.then === "function",
      });
    } catch (err) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      reject(err);
      return;
    }

    Promise.resolve(nativeResult).then(
      (value) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// ============= Plugin loader =============

let PurchasesPlugin: any = null;
async function getPurchases(): Promise<any> {
  if (PurchasesPlugin) return PurchasesPlugin;
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
    });
    // Bridge check: do critical methods exist?
    const requiredMethods = [
      "configure",
      "getOfferings",
      "getCustomerInfo",
      "purchasePackage",
      "restorePurchases",
    ];
    const bridgeStatus: Record<string, string> = {};
    const missing: string[] = [];
    for (const m of requiredMethods) {
      const t = typeof PurchasesPlugin?.[m];
      bridgeStatus[m] = t;
      if (t !== "function") missing.push(m);
    }
    // optional method
    bridgeStatus["purchaseStoreProduct"] = typeof PurchasesPlugin?.purchaseStoreProduct;
    dlog("init:bridge-check", bridgeStatus);
    if (missing.length > 0) {
      derr(
        "bridge-missing-methods",
        new Error(`Native bridge incomplet — lipsesc: ${missing.join(", ")}`)
      );
    }
    return PurchasesPlugin;
  } catch (err) {
    derr("getPurchases:import-failed", err);
    return null;
  }
}

// ============= Init (deduplicat) =============

let initPromise: Promise<boolean> | null = null;
let initCompleted = false;
let configuredUserId: string | null = null;

const INIT_TIMEOUT_MS = 5000;
const OFFERINGS_TIMEOUT_MS = 8000;
const CUSTOMER_INFO_TIMEOUT_MS = 8000;

/**
 * Init RevenueCat. Returns true if SDK is usable, false otherwise.
 * Multiple parallel callers share the same promise (true deduplication).
 */
export async function initIOSBilling(userId?: string): Promise<boolean> {
  if (!isIOSNative()) return false;

  // Already initialized for this user — instant return, no log spam
  if (initCompleted && configuredUserId === (userId ?? null)) {
    return true;
  }

  // Init in flight — share it
  if (initPromise) {
    return initPromise;
  }

  dlog("init:start", { userId: userId ?? null });

  initPromise = (async () => {
    const Purchases = await getPurchases();
    dlog("init:plugin-ready", { hasPlugin: !!Purchases });
    if (!Purchases) {
      derr("init:no-plugin", new Error("Purchases plugin not available"));
      initPromise = null;
      return false;
    }

    if (typeof Purchases.configure !== "function") {
      derr(
        "init:configure-missing",
        new Error("Purchases.configure nu există — bridge-ul nativ nu e link-uit")
      );
      initPromise = null;
      return false;
    }

    try {
      dlog("init:configure-call", {
        apiKeyPrefix: REVENUECAT_PUBLIC_API_KEY_IOS.slice(0, 6),
        hasUserId: !!userId,
      });
      // configure() can hang natively if StoreKit can't reach App Store
      // (no Sandbox account, no internet, etc). Force a timeout.
      await callNativeWithTimeout(
        () => Purchases.configure({
          apiKey: REVENUECAT_PUBLIC_API_KEY_IOS,
          appUserID: userId || null,
        }),
        INIT_TIMEOUT_MS,
        "INIT_CONFIGURE",
        "init:configure"
      );
      configuredUserId = userId ?? null;
      initCompleted = true;
      dlog("init:configured-ok");

      // Try to fetch customer info to confirm SDK is alive — also with timeout
      try {
        const info = await withTimeout(
          Purchases.getCustomerInfo(),
          CUSTOMER_INFO_TIMEOUT_MS,
          "INIT_CUSTOMER_INFO"
        );
        dlog("init:customerInfo", {
          appUserID:
            (info as any)?.customerInfo?.originalAppUserId ||
            (info as any)?.originalAppUserId,
          activeEntitlements: Object.keys(
            (info as any)?.customerInfo?.entitlements?.active ||
              (info as any)?.entitlements?.active ||
              {}
          ),
        });
      } catch (infoErr) {
        derr("init:getCustomerInfo-failed", infoErr);
        // not fatal — configure succeeded
      }

      return true;
    } catch (err) {
      derr("init:configure-failed-or-timeout", err);
      initPromise = null; // allow retry
      initCompleted = false;
      return false;
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

  if (!initCompleted) {
    const ok = await initIOSBilling(userId);
    if (!ok) {
      throw new Error(
        "RevenueCat nu e inițializat. Verifică Sandbox Apple ID în Settings → App Store și conexiunea la internet."
      );
    }
  }

  const Purchases = await getPurchases();
  if (!Purchases) throw new Error("Apple IAP not available");

  if (typeof Purchases.getOfferings !== "function") {
    throw new Error("getOfferings lipsește din bridge — reinstalează appul");
  }

  const { productId } = IOS_PRODUCTS[key];

  dlog("purchase:getOfferings");
  let offeringsRes: any;
  try {
    offeringsRes = await withTimeout(
      Purchases.getOfferings(),
      OFFERINGS_TIMEOUT_MS,
      "GET_OFFERINGS"
    );
  } catch (err) {
    derr("purchase:getOfferings-failed", err);
    throw new Error(
      "App Store Connect nu a răspuns cu produsele. Verifică că produsele sunt aprobate și că Offering-ul „current” are pachete în RevenueCat."
    );
  }

  const current =
    offeringsRes?.current || offeringsRes?.offerings?.current || null;

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

  const storeProduct = pkg.product || pkg.storeProduct || null;
  dlog("purchase:product-selected", {
    productId,
    hasStoreProduct: !!storeProduct,
    spIdentifier: storeProduct?.identifier,
  });

  const isCancellation = (err: any) =>
    err?.userCancelled ||
    err?.code === "1" ||
    err?.errorCode === "1" ||
    /cancel/i.test(err?.message || "");

  // Try purchaseStoreProduct first (more reliable on iOS)
  if (storeProduct && typeof Purchases.purchaseStoreProduct === "function") {
    dlog("purchase:purchaseStoreProduct-call", { productId });
    try {
      const result = await Purchases.purchaseStoreProduct({ product: storeProduct });
      dlog("purchase:purchaseStoreProduct-ok");
      await syncPurchaseWithBackend(result);
      return;
    } catch (err: any) {
      if (isCancellation(err)) {
        dlog("purchase:user-cancelled");
        return;
      }
      derr("purchase:purchaseStoreProduct-failed", err);
      // fall through to purchasePackage fallback
    }
  }

  if (typeof Purchases.purchasePackage !== "function") {
    throw new Error("purchasePackage lipsește din bridge — reinstalează appul");
  }

  dlog("purchase:purchasePackage-fallback-call", { productId });
  try {
    const result = await Purchases.purchasePackage({ aPackage: pkg });
    dlog("purchase:purchasePackage-ok");
    await syncPurchaseWithBackend(result);
  } catch (err: any) {
    if (isCancellation(err)) {
      dlog("purchase:user-cancelled");
      return;
    }
    derr("purchase:purchasePackage-failed", err);
    throw err;
  }
}

/**
 * If a purchase call timed out client-side, ask RevenueCat for the latest
 * CustomerInfo. If an entitlement is now active, sync backend silently.
 */
export async function reconcileAfterPurchaseTimeout(): Promise<boolean> {
  if (!isIOSNative()) return false;
  const Purchases = await getPurchases();
  if (!Purchases || typeof Purchases.getCustomerInfo !== "function") return false;
  try {
    dlog("reconcile:getCustomerInfo");
    const info = await withTimeout(
      Purchases.getCustomerInfo(),
      CUSTOMER_INFO_TIMEOUT_MS,
      "RECONCILE_CUSTOMER_INFO"
    );
    const customerInfo = (info as any)?.customerInfo || info;
    const active = customerInfo?.entitlements?.active || {};
    const hasActive = Object.keys(active).length > 0;
    dlog("reconcile:result", { hasActive, keys: Object.keys(active) });
    if (hasActive) {
      await syncPurchaseWithBackend({ customerInfo });
      return true;
    }
    return false;
  } catch (err) {
    derr("reconcile:failed", err);
    return false;
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
  if (!isIOSNative()) return result;
  dlog("getPrices:start", { userId });

  if (!initCompleted) {
    const ok = await initIOSBilling(userId);
    if (!ok) {
      derr("getPrices:init-failed", new Error("Init RevenueCat eșuat"));
      return result;
    }
  }

  const Purchases = await getPurchases();
  if (!Purchases) return result;
  if (typeof Purchases.getOfferings !== "function") {
    derr("getPrices:no-getOfferings", new Error("getOfferings lipsește din bridge"));
    return result;
  }

  try {
    dlog("getPrices:getOfferings-call");
    const offeringsRes = await withTimeout(
      Purchases.getOfferings(),
      OFFERINGS_TIMEOUT_MS,
      "GET_PRICES_OFFERINGS"
    );
    const current =
      (offeringsRes as any)?.current ||
      (offeringsRes as any)?.offerings?.current ||
      null;
    const allPackages: any[] = current?.availablePackages || [];

    dlog("getPrices:offerings-result", {
      hasCurrent: !!current,
      currentId: current?.identifier,
      packagesCount: allPackages.length,
      packageIds: allPackages
        .map((p) => p?.product?.identifier || p?.storeProduct?.identifier)
        .filter(Boolean),
      allOfferings: Object.keys(
        (offeringsRes as any)?.all || (offeringsRes as any)?.offerings?.all || {}
      ),
    });

    if (allPackages.length === 0) {
      derr(
        "getPrices:no-packages",
        new Error(
          "RevenueCat returned 0 packages. Verifică Offering 'current' în RevenueCat dashboard."
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

  if (!initCompleted) {
    const ok = await initIOSBilling();
    if (!ok) return 0;
  }

  const Purchases = await getPurchases();
  if (!Purchases || typeof Purchases.restorePurchases !== "function") return 0;

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
