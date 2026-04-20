import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

// Lazy import to avoid loading Cordova store on web
let storeModule: any = null;
async function getStore(): Promise<any> {
  if (storeModule) return storeModule;
  if (!isAndroidNative()) return null;
  // cordova-plugin-purchase exposes globals on window: CdvPurchase
  const w = window as any;
  if (w.CdvPurchase) {
    storeModule = w.CdvPurchase;
    return storeModule;
  }
  // Wait briefly for plugin to attach
  await new Promise((r) => setTimeout(r, 200));
  storeModule = (window as any).CdvPurchase || null;
  return storeModule;
}

export const ANDROID_PRODUCTS = {
  student_monthly: { productId: "student_premium", planId: "monthly" },
  student_yearly: { productId: "student_premium", planId: "yearly" },
  teacher_monthly: { productId: "teacher_premium", planId: "monthly" },
  teacher_yearly: { productId: "teacher_premium", planId: "yearly" },
} as const;

export type PlayProductKey = keyof typeof ANDROID_PRODUCTS;

export const STRIPE_TO_ANDROID: Record<string, PlayProductKey> = {
  price_1TLKvsRontECmDbLYGMnGnZM: "student_monthly",
  price_1TLKwHRontECmDbLIKWWHQXI: "student_yearly",
  price_1TLKwiRontECmDbL4q96Kth4: "teacher_monthly",
  price_1TLKwxRontECmDbLbRNdw8GG: "teacher_yearly",
};

export function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

let initPromise: Promise<void> | null = null;

export async function initPlayBilling(userId?: string): Promise<void> {
  if (!isAndroidNative()) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const CdvPurchase = await getStore();
    if (!CdvPurchase) {
      console.warn("[playBilling] CdvPurchase not available");
      return;
    }

    const store = CdvPurchase.store;
    const Platform = CdvPurchase.Platform;
    const ProductType = CdvPurchase.ProductType;

    // Register both subscription products
    store.register([
      {
        id: "student_premium",
        type: ProductType.PAID_SUBSCRIPTION,
        platform: Platform.GOOGLE_PLAY,
      },
      {
        id: "teacher_premium",
        type: ProductType.PAID_SUBSCRIPTION,
        platform: Platform.GOOGLE_PLAY,
      },
    ]);

    if (userId) {
      store.applicationUsername = () => userId;
    }

    // Listen for approved purchases → verify with backend
    store.when().approved(async (transaction: any) => {
      try {
        const native = transaction.nativePurchase || {};
        console.log("[playBilling] raw transaction", JSON.stringify(transaction, null, 2));
        console.log("[playBilling] native keys", Object.keys(native));

        // A real Google Play purchaseToken is ~200+ chars; orderId is ~24 chars (GPA.XXXX-...).
        // Try multiple locations to find the real token.
        const candidates = [
          native.purchaseToken,
          transaction.purchaseToken,
          native.token,
          transaction.nativePurchase?.purchaseToken,
          (transaction as any).receipt?.purchaseToken,
        ].filter((t) => typeof t === "string" && t.length > 50);

        const purchaseToken = candidates[0] || native.purchaseToken || transaction.transactionId;
        const products = transaction.products || [];
        const productId =
          native.productId || products[0]?.id || products[0]?.productId;

        // Google Play wants basePlanId (e.g. "monthly"/"yearly"), NOT offerId
        let planId =
          native.basePlanId ||
          products[0]?.basePlanId ||
          products[0]?.planId ||
          "";

        // Fallback: try to infer from product offers via the matched offerId
        if (!planId) {
          const offerId = products[0]?.offerId || native.offerId;
          const product = store.get(productId, Platform.GOOGLE_PLAY);
          const matchedOffer =
            product?.offers?.find((o: any) => o.id === offerId) ||
            product?.offers?.[0];
          planId =
            matchedOffer?.basePlanId ||
            (matchedOffer?.id?.includes("yearly") ? "yearly" : "") ||
            (matchedOffer?.id?.includes("monthly") ? "monthly" : "");
        }

        console.log("[playBilling] approved tx", { productId, planId, hasToken: !!purchaseToken });

        if (purchaseToken && productId) {
          await verifyPurchaseOnServer({
            purchaseToken,
            productId,
            planId,
            orderId: native.orderId,
          });
        }
        await transaction.finish();
      } catch (err) {
        console.error("[playBilling] approval handler error:", err);
      }
    });

    await store.initialize([Platform.GOOGLE_PLAY]);
  })();

  return initPromise;
}

export async function purchaseSubscription(key: PlayProductKey): Promise<void> {
  if (!isAndroidNative()) throw new Error("Play Billing only on Android");
  await initPlayBilling();

  const CdvPurchase = await getStore();
  if (!CdvPurchase) throw new Error("Play Billing not available");

  const { productId, planId } = ANDROID_PRODUCTS[key];
  const store = CdvPurchase.store;

  const product = store.get(productId, CdvPurchase.Platform.GOOGLE_PLAY);
  if (!product) throw new Error(`Produs negăsit: ${productId}`);

  // Find offer matching planId (basePlanId)
  const offer =
    product.offers.find(
      (o: any) => o.id?.includes(planId) || o.basePlanId === planId
    ) || product.offers[0];

  if (!offer) throw new Error("Nicio ofertă disponibilă");

  await offer.order();
  // Approval handler (registered in initPlayBilling) will call verifyPurchaseOnServer
}

export async function verifyPurchaseOnServer(args: {
  purchaseToken: string;
  productId: string;
  planId: string;
  orderId?: string;
}): Promise<void> {
  const { error } = await supabase.functions.invoke("verify-play-purchase", {
    body: args,
  });
  if (error) throw error;
}

export async function restorePlayPurchases(): Promise<number> {
  if (!isAndroidNative()) return 0;
  await initPlayBilling();
  const CdvPurchase = await getStore();
  if (!CdvPurchase) return 0;

  try {
    await CdvPurchase.store.restorePurchases();
    return 1; // Approval handler will process restored items asynchronously
  } catch (err) {
    console.error("[playBilling] restore failed:", err);
    return 0;
  }
}

export async function openPlaySubscriptionManagement(productId?: string): Promise<void> {
  if (!isAndroidNative()) return;
  await initPlayBilling();
  const CdvPurchase = await getStore();
  if (!CdvPurchase) return;
  try {
    await CdvPurchase.store.manageSubscriptions();
  } catch (err) {
    console.error("[playBilling] manage failed:", err);
  }
}
