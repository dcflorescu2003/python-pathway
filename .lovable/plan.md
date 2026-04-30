
# Integrare Apple In-App Purchases pentru PyRo iOS

## Context
App-ul are deja **dual-billing** funcțional:
- **Web** → Stripe (`create-checkout`, `customer-portal`, `check-subscription`)
- **Android** → Google Play Billing (`src/lib/playBilling.ts` + edge `verify-play-purchase`)

Lipsește **iOS**. Apple cere obligatoriu IAP pentru bunuri digitale (refuză submit-ul altfel). Voi replica fix pattern-ul Android, fără să ating Stripe/Play.

Plugin ales: **`@capgo/capacitor-purchases`** (RevenueCat). Motive:
- Free până la $10k/lună revenue
- Validare receipt + restore purchases automat
- Webhook unificat → un singur edge function `revenuecat-webhook` actualizează `is_premium` în Supabase
- Funcționează și pe iOS, și pe Android (dar pentru Android păstrez Google Play direct ca să nu rup ce merge — RevenueCat o folosesc DOAR pe iOS)

## Plan de implementare

### 1. Instalare dependență
```
@capgo/capacitor-purchases
```
Necesar `npx cap sync ios` după export pe GitHub (nu ruleaz în sandbox).

### 2. Fișier nou: `src/lib/iosBilling.ts`
Replica `playBilling.ts`, dar pentru iOS. Conține:
- `IOS_PRODUCTS` map cu Product ID-urile **deja** create în App Store Connect:
  ```ts
  pyro_student_monthly_ios
  pyro_student_yearly_ios
  pyro_teacher_monthly_ios
  pyro_teacher_yearly_ios
  ```
- `STRIPE_TO_IOS` map (price_id Stripe → product_id iOS) pentru paritate cu Android
- `isIOSNative()` helper
- `initIOSBilling(userId)` — inițializează RevenueCat cu `appUserID = supabase user.id` (asta leagă achiziția de user-ul nostru)
- `purchaseIOSSubscription(key)` — declanșează popup-ul nativ Apple
- `restoreIOSPurchases()` — pentru utilizatorii care reinstalează
- `openIOSSubscriptionManagement()` — deschide pagina iOS Settings → Subscriptions

### 3. Modificare `src/hooks/useSubscription.ts`
Extind logica existentă pentru a detecta și iOS:
- `startCheckout(priceId)` → dacă iOS native → folosește `purchaseIOSSubscription`, altfel păstrează logica curentă (Android/Stripe)
- `openPortal()` → pe iOS deschide subscription management Apple
- `restorePurchases()` → funcționează pe ambele platforme native
- `useEffect` inițializare → adaug `initIOSBilling(user.id)` lângă `initPlayBilling`

### 4. Edge Function nou: `supabase/functions/revenuecat-webhook/index.ts`
- Endpoint public (fără JWT verify) pentru RevenueCat webhook
- Validare cu `REVENUECAT_WEBHOOK_AUTH` (Bearer secret) — secret nou de adăugat
- Handler pentru events: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`, `BILLING_ISSUE`, `PRODUCT_CHANGE`
- Mapare: `product_id` → tier (student/teacher) + extragere `expires_date`
- Update `profiles.is_premium = true/false` și `premium_source = 'ios_iap'`, `premium_until = expires_date`
- Update `app_user_id` (= supabase user.id, trimis prin RevenueCat appUserID)

### 5. Edge Function nou: `supabase/functions/verify-ios-purchase/index.ts` (fallback client-side)
- Apelat de app DUPĂ purchase, ca fallback dacă webhook-ul întârzie
- Primește `customerInfoEntitlements` de la RevenueCat (returnat după purchase)
- Marchează imediat user-ul ca Premium → UX instant
- Webhook-ul rămâne sursa de adevăr; acest endpoint doar accelerează feedback-ul vizual

### 6. Update `check-subscription` edge function
Adaug detecție pentru `premium_source = 'ios_iap'`:
- Dacă user are intrare în profiles cu source iOS și `premium_until > now()` → returnează `subscribed: true, source: 'ios_iap'`
- Mențin precedența: Stripe > coupon > play_billing > ios_iap (sau invers — ce e activ contează)

### 7. Migrație DB (mică)
- Adaug coloane în `profiles` (dacă nu există deja):
  - `premium_source TEXT` (`stripe`, `coupon`, `play_billing`, `ios_iap`)
  - `premium_until TIMESTAMPTZ`
  - `app_store_original_transaction_id TEXT` (pentru restore)
- Sau, dacă există deja un tabel `subscriptions`, voi verifica și extind acolo în loc de profiles.

### 8. Secrets noi necesari (vor fi cerute la momentul potrivit)
- `REVENUECAT_PUBLIC_API_KEY_IOS` — folosit în client (de fapt e public, merge hardcodat dar îl punem ca secret pentru flexibilitate)
- `REVENUECAT_WEBHOOK_AUTH` — Bearer token pentru validare webhook

## Fluxul complet (iOS)

```
User apasă "Cumpără Premium"
    ↓
useSubscription.startCheckout(priceId)
    ↓ (iOS detectat)
purchaseIOSSubscription(productKey)
    ↓
RevenueCat → popup nativ Apple Pay → user confirmă
    ↓
[A] App primește customerInfo → POST verify-ios-purchase → update profile imediat
[B] RevenueCat trimite webhook → revenuecat-webhook → update profile (sursa de adevăr)
    ↓
Frontend: setTimeout 2.5s → checkSubscription(true) → UI se actualizează cu Premium ✅
```

## Ce NU schimb
- Nimic din Stripe (web continuă identic)
- Nimic din `playBilling.ts` (Android continuă identic)
- Nimic din UI-ul paginii de subscription — `startCheckout` are același semnătură

## Pași pe care îi faci tu DUPĂ ce termin codul

1. **Cont RevenueCat gratuit** (revenuecat.com) → creez aplicație → leg cu App Store Connect (dau pași concreti)
2. **Adaug Product ID-urile** în RevenueCat (copy-paste din App Store Connect)
3. **Configurez webhook** în RevenueCat → URL: `https://gcilflssbcswmgkrznot.supabase.co/functions/v1/revenuecat-webhook`
4. **Pas 2** (cum am promis): Export pe GitHub → `npx cap add ios` → `npx cap sync ios` → build în Xcode → upload TestFlight
5. **Pas 3**: Atașez build + screenshot-uri în App Store Connect → Submit for Review

## Confirmare

Dacă aprobi planul, voi:
1. Genera migrația DB
2. Crea `src/lib/iosBilling.ts`
3. Modifica `useSubscription.ts`
4. Crea cele 2 edge functions
5. Cere secret-urile RevenueCat (după ce-mi confirmi că ai creat contul)

Aprobi să trec la implementare?
