

## Plan: Fix purchaseToken extraction in playBilling.ts

### Problem
The `approved` handler in `playBilling.ts` falls back to `transaction.transactionId` (which is the 24-char orderId like `GPA.33xx...`) because none of the candidates pass the `length > 50` filter. The real `purchaseToken` (~200+ chars) is likely in a location we're not checking, such as:
- `transaction.receipt` (often a JSON string on Android containing the token)
- `transaction.transactionReceipt`
- `transaction.nativePurchase.receipt` (raw JSON from Google Play)

### Changes

**1. `src/lib/playBilling.ts` — Rewrite token extraction in `approved` handler**

Expand the candidate search to include:
- Parse `transaction.receipt` as JSON if it's a string (cordova-plugin-purchase often puts the raw Google Play JSON here, which contains `purchaseToken`)
- Check `transaction.transactionReceipt` (another common field)
- Log the **full list of top-level keys** on `transaction` and `nativePurchase` so we can see exactly what fields exist
- Add a parsed receipt log so if none of the direct fields work, we can see the receipt structure

```typescript
// Parse receipt if it's a JSON string (common in cordova-plugin-purchase)
let parsedReceipt: any = {};
try {
  const rawReceipt = transaction.receipt || native.receipt;
  if (typeof rawReceipt === "string" && rawReceipt.startsWith("{")) {
    parsedReceipt = JSON.parse(rawReceipt);
  }
} catch {}

const candidates = [
  native.purchaseToken,
  transaction.purchaseToken,
  parsedReceipt.purchaseToken,
  native.token,
  transaction.transactionReceipt,
].filter((t) => typeof t === "string" && t.length > 50);
```

Also log `transaction` keys, `native` keys, and `parsedReceipt` keys for full diagnostics.

**2. No backend changes needed** — the `verify-play-purchase` edge function already handles both short and long tokens correctly.

### Expected result after rebuild
- Logcat shows `tokenLen: 200+` instead of `tokenLen: 24`
- Backend receives the real `purchaseToken` and verifies with Google Play API
- Premium is granted with proper verification

