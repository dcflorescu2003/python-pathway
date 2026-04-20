

## Integrare Google Play Billing nativă pentru Android

Cele 4 planuri sunt active în Play Console. Acum legăm aplicația de ele, păstrând Stripe pentru web.

### Strategia

- **Web (browser/PWA)**: rămâne Stripe — flux neschimbat
- **Android nativ (Capacitor)**: Google Play Billing prin plugin nativ
- Detectare runtime: `Capacitor.getPlatform() === 'android'` → ascunde butoanele Stripe, arată butoanele Play Billing
- iOS: rămâne Stripe momentan (vom adăuga StoreKit ulterior, separat)

### Plugin recomandat

`@capgo/capacitor-purchases` (RevenueCat-free, gratuit, mentenanță activă, suportă Billing Library 7.x — exact versiunea pe care o avem deja în `build.gradle`).

Alternativă: `cordova-plugin-purchase` — mai vechi dar bine testat. Aleg `@capgo/capacitor-purchases` pentru API modern Capacitor 6.

### Modificări

**1. Instalare plugin**
```
npm install @capgo/capacitor-purchases
npx cap sync android
```

**2. `src/lib/playBilling.ts`** (nou)
- Wrapper peste plugin
- Funcții: `initPlayBilling()`, `getProducts()`, `purchaseSubscription(productId, planId)`, `restorePurchases()`
- Mapare produse:
  ```ts
  ANDROID_PRODUCTS = {
    student_monthly: { productId: 'student_premium', planId: 'monthly' },
    student_yearly:  { productId: 'student_premium', planId: 'yearly' },
    teacher_monthly: { productId: 'teacher_premium', planId: 'monthly' },
    teacher_yearly:  { productId: 'teacher_premium', planId: 'yearly' },
  }
  ```

**3. `supabase/functions/verify-play-purchase/index.ts`** (nou edge function)
- Primește `purchaseToken` + `productId` de la app după achiziție
- Validează tokenul cu Google Play Developer API (server-to-server)
- La verificare reușită → upsert în `subscribers` cu `source = 'play_billing'`, `subscribed = true`, `subscription_end = expiryTime`, `product_id = student_premium` sau `teacher_premium`
- Necesită secret nou: **`GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`** (cheie service account din Google Cloud Console cu rol „Pub/Sub Subscriber" + acces „Financial data, orders, and cancellation survey responses" în Play Console)

**4. `src/hooks/useSubscription.ts`** — extindere
- `startCheckout(priceId)` devine smart:
  - Dacă `Capacitor.getPlatform() === 'android'` → apelează `purchaseSubscription()` din `playBilling.ts` în loc de Stripe checkout
  - Altfel → Stripe (comportament actual)
- După achiziție Play Billing reușită → invocă `verify-play-purchase` → apoi `checkSubscription(true)` pentru refresh
- Adaug funcție `restorePurchases()` (Android only) pentru recuperare achiziții (cerință Google Play)

**5. `supabase/functions/check-subscription/index.ts`** — extindere
- Verifică ÎNAINTE de Stripe dacă există abonament `source='play_billing'` activ în tabelul `subscribers`
- Dacă da și nu e expirat → returnează direct fără query la Stripe
- Pentru Play Billing nu reinterogăm Google la fiecare check (e rate-limited) — ne bazăm pe `subscription_end` și pe webhook-uri viitoare

**6. UI — `PremiumDialog.tsx` + `TeacherPremiumDialog.tsx`**
- Detectează platforma; pe Android afișează: „Plătește cu Google Play"
- Adaugă buton „Restaurează achiziții" (obligatoriu pentru policy Google Play)
- Mesaj informativ pe Android: „Achiziție gestionată de Google Play"

**7. `android/app/src/main/AndroidManifest.xml`**
- Permisiunea `BILLING` deja adăugată — ok

### Despre verificarea server-side cu Google Play API

Necesită setup în Google Cloud Console:
1. Creează proiect Google Cloud (sau folosește existing)
2. Activează „Google Play Android Developer API"
3. Service account → cheie JSON → adaug ca secret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` în Lovable Cloud
4. În Play Console → Setări → Acces API → invită service account-ul → acordă permisiune „Vizualizare date financiare"

Te ghidez pas cu pas când ajungem acolo.

### Ordinea de implementare

1. Instalez plugin + wrapper `playBilling.ts`
2. Extind `useSubscription` cu detectare platformă
3. Modific dialoguri Premium pentru UI Android
4. Creez edge function `verify-play-purchase` (cu placeholder validare până configurezi service account)
5. Extind `check-subscription` să citească Play Billing din DB
6. Bump versionCode → 58, build AAB, test pe Internal Testing track

### Ce rămâne pentru tine după implementare

- Setup Google Cloud service account (te ghidez)
- Adăugare secret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
- Build AAB v58 + upload pe Internal Testing
- Test flux complet de cumpărare cu cont de test (adaugi licență tester în Play Console → Setări → Testare licențiere)

### Note importante

- **iOS rămâne pe Stripe** momentan. Apple cere StoreKit pentru abonamente în-app — vom face asta separat (alt set de produse în App Store Connect, alt plugin).
- **Web rămâne pe Stripe** — nicio schimbare pentru utilizatorii din browser.
- **Cupoanele** (sistem coupon existent) rămân nealterate — funcționează pe toate platformele.
- **Premium auto-grant pentru PWA** rămâne neatins.

