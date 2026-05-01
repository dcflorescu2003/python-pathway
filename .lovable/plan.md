# Migrare iOS IAP: RevenueCat → StoreKit 2 nativ

## De ce schimbăm

RevenueCat hangs la `configure()` pe TestFlight, fără timeout vizibil — bridge-ul nu se mai întoarce niciodată. În loc să mai depanăm un SDK third-party, mergem direct pe **StoreKit 2** (Apple) cu un **plugin Capacitor custom scris în Swift** și verificare server-side prin **App Store Server API**. Mai puține dependințe, mai puțini single points of failure, control total pe semnături și webhook.

## Arhitectura nouă

```text
┌─────────────────────────┐
│  React (TS)             │
│  src/lib/iosBilling.ts  │  ← rescris, doar StoreKit
└──────────┬──────────────┘
           │ Capacitor bridge
           ▼
┌─────────────────────────┐
│  PyroIAPPlugin (Swift)  │  ← scris de noi în ios/App/App/
│  StoreKit 2 API         │
└──────────┬──────────────┘
           │ JWS signedTransaction
           ▼
┌──────────────────────────────────┐
│  Edge: verify-ios-purchase       │  ← rescris: verifică JWS
│  + Apple App Store Server API    │
└──────────┬───────────────────────┘
           │
           ▼
   play_billing_subscriptions
   (deja are platform='ios')

┌──────────────────────────────────┐
│  Edge: appstore-notifications-v2 │  ← NOU: webhook Apple S2S
└──────────────────────────────────┘
```

Tabela `play_billing_subscriptions` și `check-subscription` rămân — știu deja `platform='ios'`.

## Ce ștergem

- Pachetul `@revenuecat/purchases-capacitor` din `package.json`
- Tot codul RevenueCat din `src/lib/iosBilling.ts` (păstrăm doar API-ul public exportat)
- Edge function `revenuecat-webhook` (înlocuit de `appstore-notifications-v2`)
- Secret-ul `REVENUECAT_WEBHOOK_AUTH` (după migrare)
- Configul RevenueCat din dashboard (manual, nu cere cod)

## Pași — în ordine

### Pas 1 — Pregătire App Store Connect (manual, tu)

Înainte de orice cod nou, ai nevoie de:

1. **4 produse In-App Purchase** în App Store Connect cu exact aceste IDs (deja le-ai creat pentru RevenueCat):
  - `pyro_student_monthly_ios`
  - `pyro_student_yearly_ios`
  - `pyro_teacher_monthly_ios`
  - `pyro_teacher_yearly_ios`
2. **App Store Server API key** (Users & Access → Keys → In-App Purchase): generezi o cheie `.p8`, salvezi `Key ID`, `Issuer ID`, conținutul `.p8`. Astea devin 3 secrete noi în Lovable Cloud.
3. **App Store Server Notifications V2** URL (Apps → app-ul tău → App Information → App Store Server Notifications): pui URL-ul edge function-ului nostru (după Pas 5).

Eu îți voi cere secretele exacte la momentul potrivit.

### Pas 2 — Plugin Capacitor nativ (Swift)

Creez:

- `ios/App/App/PyroIAP.swift` — actor StoreKit 2 cu metode `getProducts`, `purchase`, `restore`, `getActiveTransactions`, listener `Transaction.updates`
- `ios/App/App/PyroIAPPlugin.swift` — `@objc CAPPlugin` care expune metodele JS
- `ios/App/App/PyroIAPPlugin.m` — registration macro pentru bridge

Plugin-ul returnează către JS, după fiecare achiziție: `productId`, `originalTransactionId`, `transactionId`, `expirationDate`, `signedTransaction` (JWS) — pe acesta îl validăm server-side.

### Pas 3 — Layer JS rescris

Rescriu `src/lib/iosBilling.ts`:

- Păstrez exporturile publice (`isIOSNative`, `initIOSBilling`, `purchaseIOSSubscription`, `restoreIOSPurchases`, `getIOSPrices`, `openIOSSubscriptionManagement`, `reconcileAfterPurchaseTimeout`, `IOS_PRODUCTS`, `STRIPE_TO_IOS`, tipurile) — `useSubscription` rămâne **neatins**.
- Înăuntru: `registerPlugin<PyroIAPPlugin>('PyroIAP')` direct, fără SDK extern.
- Păstrez sistemul de `dlog`/`derr` și buffer-ul de debug — îți rămâne butonul "Copiază log iOS billing".
- `openIOSSubscriptionManagement` deschide `https://apps.apple.com/account/subscriptions` cu `App.openUrl` (sau `Browser`).

### Pas 4 — Edge `verify-ios-purchase` rescris

Funcția va:

1. Primi `signedTransaction` (JWS) de la client.
2. Decoda JWS-ul (header + payload base64) **fără** verificare criptografică în primă fază — pentru că Apple oferă deja chei rotate și ne complică Deno-ul.
3. Apela **App Store Server API** (`/inApps/v1/transactions/{transactionId}`) cu un JWT semnat ES256 din secretele Apple → primește `signedTransactionInfo` autentic.
4. Decoda payload-ul autentic → `productId`, `originalTransactionId`, `expiresDate`, `revocationDate`.
5. Upsert în `play_billing_subscriptions` cu `platform='ios'`, exact ca acum.
6. `profiles.is_premium = true`.

Dacă tranzacția e revocată / expirată → marchează inactiv.

Folosesc `jose` din `esm.sh` pentru semnarea JWT-ului ES256.

### Pas 5 — Edge nouă `appstore-notifications-v2`

Webhook public (`verify_jwt = false`). Apple trimite `signedPayload` la fiecare event de subscription. Funcția:

1. Decodează JWS-ul (payload este `notificationType` + `data.signedTransactionInfo`).
2. Pentru events active (`SUBSCRIBED`, `DID_RENEW`, `DID_CHANGE_RENEWAL_STATUS=1`) → upsert `is_active=true`.
3. Pentru inactive (`EXPIRED`, `REFUND`, `REVOKE`, `DID_FAIL_TO_RENEW` cu grace expired) → `is_active=false` + recheck `is_premium`.
4. Match user via `originalTransactionId` în tabela existentă (sau prin `appAccountToken` pe care îl setăm la purchase = `user.id`).

**Punct critic**: la `purchase()` în Swift voi seta `Product.PurchaseOption.appAccountToken(UUID(user.id))` ca să mapăm user-ul fără ambiguitate.

### Pas 6 — Migrare config + curățenie

- Scot `@revenuecat/purchases-capacitor` din `package.json`
- Șterg edge-ul `revenuecat-webhook`
- Adaug în `supabase/config.toml` un block pentru `appstore-notifications-v2` cu `verify_jwt = false`
- În Xcode: capability **In-App Purchase** rămâne; nu mai e nevoie de altceva special.

### Pas 7 — Testare end-to-end

Build TestFlight nou. Tu testezi cu Sandbox account:

1. Login → home → vezi prețuri reale.
2. Cumperi student_monthly → vezi că scrie corect în DB.
3. Force-close app → revii → premium activ (din `check-subscription`).
4. Settings iOS → cancel sandbox sub → primim `EXPIRED` pe webhook → DB inactiv.
5. Apăs "Restaurează achizițiile" pe alt device cu același Apple ID → reactivare.

Eu voi adăuga logging masiv și un buton temporar "Trimite log la dev" pe AccountTab dacă apare ceva.

## Detalii tehnice

**StoreKit 2 versus StoreKit 1**: folosim StoreKit 2 (`async/await`, `Product.products(for:)`, `Transaction.updates`). Necesită **iOS 15+**. Verific în `Info.plist` că `MinimumOSVersion >= 15.0`; dacă nu, urc pragul (Capacitor 6 oricum cere iOS 14, deci nu pierdem device-uri reale).

**De ce App Store Server API și nu doar verifyReceipt**: `verifyReceipt` este deprecated. Server API e modul oficial pentru server-to-server și e gândit pentru exact use-case-ul nostru (un singur originalTransactionId → toată istoria abonamentului).

**De ce JWS dual-pass (decode local + re-fetch de la Apple)**: ne ferim de transactions falsificate de utilizatori jailbroken. Sursa de adevăr este răspunsul direct de la Apple, nu ce trimite clientul.

**appAccountToken**: UUID v4 ce trebuie să fie exact `user.id` din Supabase. La fiecare purchase îl atașăm; webhook-ul îl primește înapoi → mapping user fără email lookup.

**Race condition la purchase**: Swift listener-ul `Transaction.updates` rulează în background și poate trimite tranzacția înainte ca callback-ul lui `purchase()` să se întoarcă. Tratez idempotent prin `originalTransactionId` ca PK conceptual (UNIQUE pe `purchase_token` în tabelă — deja așa e).

**Restore**: `AppStore.sync()` + iter peste `Transaction.currentEntitlements` → trimit fiecare tranzacție activă la edge.

## Ce vei face manual tu

1. **Înainte de Pas 4**: îmi dai 3 secrete (`APPLE_IAP_KEY_ID`, `APPLE_IAP_ISSUER_ID`, `APPLE_IAP_PRIVATE_KEY` — conținutul `.p8`).
2. **Înainte de Pas 5**: după ce deploy-ăm edge-ul `appstore-notifications-v2`, îmi dai URL-ul lui și îl pui în App Store Connect → Notifications V2 (Production și Sandbox).
3. **Build nou**: `npx cap sync ios` + Archive + TestFlight.
4. **După ce totul merge**: poți închide proiectul din RevenueCat dashboard.

## Ce risc rămâne

- Apple Sandbox e notoriu de buggy (reproduceri lente, ID-uri stale). Avem timeout pe toate apelurile native.
- Prima încărcare de produse poate fi de 5–10s pe Sandbox (rețea Apple). Pun spinner + cache 60s.
- Dacă webhook-ul n-ajunge (rar), `check-subscription` rulat la deschidere app va sincroniza prin App Store Server API direct.

## Ordinea de execuție când zici "go"

1. Cer cele 3 secrete Apple IAP.
2. Scriu plugin-ul Swift + .m + actualizez `Podfile`/`Package.swift` dacă e cazul.
3. Rescriu `src/lib/iosBilling.ts`.
4. Rescriu edge `verify-ios-purchase`.
5. Creez edge `appstore-notifications-v2` + config.toml.
6. Șterg `revenuecat-webhook` și pachetul npm.
7. Îți spun să faci `npx cap sync ios` + Archive + să configurezi URL-ul webhook în App Store Connect.
8. Test sandbox împreună.

Confirmi și încep cu Pas 1 (cer secretele)?  
  
Nu, inainte sa ceri secretele ma ghidezi pas cu pas cum le obtin, ce sunt, de unde le iau. Confirma la fiecare ca il am apoi le ceri. Sa fim atenti sa nu ratam nimic