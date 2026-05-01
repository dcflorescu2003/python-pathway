import { Capacitor, registerPlugin } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ============= Plugin interface =============

interface PyroIAPProductInfo {
  productId: string;
  priceString: string;
  price: number;
  currencyCode: string;
  title?: string;
  description?: string;
}

interface PyroIAPTransaction {
  productId: string;
  transactionId: string;
  originalTransactionId: string;
  signedTransaction: string;
  purchaseDate: number;
  expirationDate?: number;
  expirationISO?: string;
  appAccountToken?: string;
  revocationDate?: number;
  userCancelled?: boolean;
  pending?: boolean;
}

interface PyroIAPPlugin {
  ping(): Promise<{ ok: boolean; platform: string; storeKit2Available: boolean }>;
  loadProducts(): Promise<{ products: PyroIAPProductInfo[] }>;
  purchase(opts: { productId: string; appAccountToken?: string }): Promise<PyroIAPTransaction>;
  restore(): Promise<{ transactions: PyroIAPTransaction[] }>;
  getActiveTransactions(): Promise<{ transactions: PyroIAPTransaction[] }>;
  openManageSubscriptions(): Promise<void>;
  addListener(
    event: "transactionUpdated",
    cb: (tx: PyroIAPTransaction) => void
  ): Promise<{ remove: () => Promise<void> }>;
}

// ============= Public product config =============

export const IOS_PRODUCTS = {
  student_monthly: { productId: "pyro_student_monthly_ios" },
  student_yearly: { productId: "pyro_student_yearly_ios" },
  teacher_monthly: { productId: "pyro_teacher_monthly_ios" },
  teacher_yearly: { productId: "pyro_teacher_yearly_ios" },
} as const;

export type IOSProductKey = keyof typeof IOS_PRODUCTS;

export const STRIPE_TO_IOS: Record<string, IOSProductKey> = {
  price_1TLKvsRontECmDbLYGMnGnZM: "student_monthly",
  price_1TLKwHRontECmDbLIKWWHQXI: "student_yearly",
  price_1TLKwiRontECmDbL4q96Kth4: "teacher_monthly",
  price_1TLKwxRontECmDbLbRNdw8GG: "teacher_yearly",
};

export interface IOSPriceInfo {
  productId: string;
  priceString: string;
  price: number;
  currencyCode: string;
}

// ============= Logging =============

const DEBUG_LOG_BUFFER: string[] = [];

function dlog(stage: string, data?: any) {
  const ts = new Date().toISOString().slice(11, 23);
  let payload = "";
  if (data !== undefined) {
    try {
      payload = typeof data === "string" ? data : JSON.stringify(data);
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
  const line = `[${ts}] ❌ ${stage} | code=${code} | msg=${msg}`;
  console.error("[iosBilling]", line, err);
  DEBUG_LOG_BUFFER.push(line);
  if (DEBUG_LOG_BUFFER.length > 80) DEBUG_LOG_BUFFER.shift();
  if (isIOSNative()) {
    toast.error(`IAP: ${stage}`, {
      description: `${code ? `[${code}] ` : ""}${msg}`.slice(0, 240),
      duration: 8000,
    });
  }
}

export function getIOSBillingDebugLog(): string[] {
  return [...DEBUG_LOG_BUFFER];
}

// ============= Platform check =============

export function isIOSNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

// ============= Plugin instance =============

let pluginInstance: PyroIAPPlugin | null = null;
function getPlugin(): PyroIAPPlugin | null {
  if (!isIOSNative()) return null;
  if (pluginInstance) return pluginInstance;
  try {
    pluginInstance = registerPlugin<PyroIAPPlugin>("PyroIAP");
    return pluginInstance;
  } catch (err) {
    derr("getPlugin:register-failed", err);
    return null;
  }
}

// ============= Init =============

let initPromise: Promise<boolean> | null = null;
let initCompleted = false;
let initUserId: string | null = null;
let listenerAttached = false;

export async function initIOSBilling(userId?: string): Promise<boolean> {
  if (!isIOSNative()) return false;

  if (initCompleted && initUserId === (userId ?? null)) return true;
  if (initPromise) return initPromise;

  dlog("init:start", { userId: userId ?? null });

  initPromise = (async () => {
    const plugin = getPlugin();
    if (!plugin) {
      derr("init:no-plugin", new Error("PyroIAP plugin not registered"));
      initPromise = null;
      return false;
    }

    try {
      const ping = await plugin.ping();
      dlog("init:ping-ok", ping);
      if (!ping.storeKit2Available) {
        derr("init:storekit2-unavailable", new Error("Necesită iOS 15+"));
        initPromise = null;
        return false;
      }
    } catch (err) {
      derr("init:ping-failed", err);
      initPromise = null;
      return false;
    }

    // Attach background transaction listener once
    if (!listenerAttached) {
      try {
        await plugin.addListener("transactionUpdated", (tx) => {
          dlog("listener:transactionUpdated", {
            productId: tx.productId,
            originalTransactionId: tx.originalTransactionId,
          });
          // Background transaction (renewal, etc) — sync to backend silently
          void syncTransactionWithBackend(tx);
        });
        listenerAttached = true;
      } catch (err) {
        derr("init:listener-failed", err);
      }
    }

    // Reconcile any active entitlements (covers app reopen after renewal)
    try {
      const { transactions } = await plugin.getActiveTransactions();
      dlog("init:active-transactions", { count: transactions.length });
      for (const tx of transactions) {
        void syncTransactionWithBackend(tx);
      }
    } catch (err) {
      derr("init:active-transactions-failed", err);
      // not fatal
    }

    initCompleted = true;
    initUserId = userId ?? null;
    dlog("init:complete");
    return true;
  })();

  return initPromise;
}

// ============= Purchase =============

export async function purchaseIOSSubscription(
  key: IOSProductKey,
  userId?: string
): Promise<void> {
  if (!isIOSNative()) throw new Error("Apple IAP only on iOS");

  if (!initCompleted) {
    const ok = await initIOSBilling(userId);
    if (!ok) {
      throw new Error(
        "Magazinul Apple nu este disponibil. Verifică conexiunea la internet și contul Apple ID."
      );
    }
  }

  const plugin = getPlugin();
  if (!plugin) throw new Error("PyroIAP plugin not available");

  const { productId } = IOS_PRODUCTS[key];
  dlog("purchase:start", { key, productId, hasUserId: !!userId });

  try {
    const result = await plugin.purchase({
      productId,
      appAccountToken: userId,
    });

    if (result.userCancelled) {
      dlog("purchase:user-cancelled");
      return;
    }
    if (result.pending) {
      dlog("purchase:pending");
      toast.info("Plata e în așteptare", {
        description: "Vei primi premium imediat ce Apple finalizează plata.",
      });
      return;
    }

    dlog("purchase:success", {
      productId: result.productId,
      originalTransactionId: result.originalTransactionId,
    });
    await syncTransactionWithBackend(result);
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (/cancel/i.test(msg)) {
      dlog("purchase:user-cancelled");
      return;
    }
    derr("purchase:failed", err);
    throw err;
  }
}

// ============= Reconcile after timeout (kept for compat with useSubscription) =============

export async function reconcileAfterPurchaseTimeout(): Promise<boolean> {
  if (!isIOSNative()) return false;
  const plugin = getPlugin();
  if (!plugin) return false;
  try {
    const { transactions } = await plugin.getActiveTransactions();
    if (transactions.length === 0) return false;
    for (const tx of transactions) {
      await syncTransactionWithBackend(tx);
    }
    return true;
  } catch (err) {
    derr("reconcile:failed", err);
    return false;
  }
}

// ============= Restore =============

export async function restoreIOSPurchases(): Promise<number> {
  if (!isIOSNative()) return 0;
  dlog("restore:start");

  if (!initCompleted) {
    const ok = await initIOSBilling();
    if (!ok) return 0;
  }

  const plugin = getPlugin();
  if (!plugin) return 0;

  try {
    const { transactions } = await plugin.restore();
    dlog("restore:result", { count: transactions.length });
    let synced = 0;
    for (const tx of transactions) {
      await syncTransactionWithBackend(tx);
      synced++;
    }
    return synced;
  } catch (err) {
    derr("restore:failed", err);
    return 0;
  }
}

// ============= Prices =============

let priceCache: Partial<Record<IOSProductKey, IOSPriceInfo>> | null = null;
let priceCacheAt = 0;

export async function getIOSPrices(
  userId?: string
): Promise<Partial<Record<IOSProductKey, IOSPriceInfo>>> {
  if (!isIOSNative()) return {};

  // 60s cache
  if (priceCache && Date.now() - priceCacheAt < 60_000) {
    return priceCache;
  }

  if (!initCompleted) {
    const ok = await initIOSBilling(userId);
    if (!ok) return {};
  }

  const plugin = getPlugin();
  if (!plugin) return {};

  const result: Partial<Record<IOSProductKey, IOSPriceInfo>> = {};
  try {
    const { products } = await plugin.loadProducts();
    dlog("getPrices:loaded", { count: products.length });

    (Object.keys(IOS_PRODUCTS) as IOSProductKey[]).forEach((key) => {
      const { productId } = IOS_PRODUCTS[key];
      const p = products.find((pp) => pp.productId === productId);
      if (!p) {
        dlog("getPrices:missing", { productId });
        return;
      }
      result[key] = {
        productId: p.productId,
        priceString: p.priceString,
        price: p.price,
        currencyCode: p.currencyCode,
      };
    });

    priceCache = result;
    priceCacheAt = Date.now();
  } catch (err) {
    derr("getPrices:failed", err);
  }
  return result;
}

// ============= Manage subscriptions =============

export async function openIOSSubscriptionManagement(): Promise<void> {
  if (!isIOSNative()) return;
  const plugin = getPlugin();
  if (!plugin) return;
  try {
    await plugin.openManageSubscriptions();
  } catch (err) {
    derr("manage:failed", err);
    // Fallback: open via window
    try {
      window.open("itms-apps://apps.apple.com/account/subscriptions", "_blank");
    } catch {
      // ignore
    }
  }
}

// ============= Backend sync =============

async function syncTransactionWithBackend(tx: PyroIAPTransaction): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("verify-ios-purchase", {
      body: {
        productId: tx.productId,
        transactionId: tx.transactionId,
        originalTransactionId: tx.originalTransactionId,
        signedTransaction: tx.signedTransaction,
        expirationISO: tx.expirationISO,
        appAccountToken: tx.appAccountToken,
      },
    });
    if (error) {
      derr("syncBackend:error", error);
      return;
    }
    dlog("syncBackend:ok", {
      productId: tx.productId,
      originalTransactionId: tx.originalTransactionId,
    });
  } catch (err) {
    derr("syncBackend:failed", err);
  }
}
