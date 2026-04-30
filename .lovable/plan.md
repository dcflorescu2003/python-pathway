Problema raportată („Achiziția App Store nu a răspuns”) vine din timeout-ul de 45s pus peste `purchaseIOSSubscription`. Asta înseamnă că apelul `Purchases.purchasePackage(...)` nu a returnat nici succes, nici eroare în timp util. Nu e un caz în care Secret API Key ajută direct: purchase sheet-ul și cumpărarea se fac cu SDK-ul iOS și cheia publică RevenueCat. Secretul poate fi util doar pentru verificări server-side/API RevenueCat, nu pentru a porni/rezolva sheet-ul de cumpărare de pe device.

Plan de remediere:

1. Schimb fallback-ul de achiziție iOS ca să nu depindă exclusiv de `purchasePackage`
   - În `src/lib/iosBilling.ts`, după ce găsim package-ul din Offering, extrag `storeProduct/product`.
   - Încerc achiziția prin `Purchases.purchaseStoreProduct({ product })`, care pe iOS folosește direct Product ID-ul și evită blocajele legate de `presentedOfferingContext/package`.
   - Dacă `purchaseStoreProduct` nu e disponibil sau eșuează imediat din motiv de shape/API, fac fallback la `purchasePackage({ aPackage: pkg })`.

2. Adaug timeout intern mai clar pe etapele RevenueCat
   - Separ logurile pentru:
     - `purchase:getOfferings`
     - `purchase:product-selected`
     - `purchase:purchaseStoreProduct-call`
     - `purchase:purchasePackage-fallback-call`
     - `purchase:customerInfo-after-timeout`
   - Dacă achiziția pare blocată, verific imediat `getCustomerInfo()` înainte să arunc eroarea către UI. Dacă utilizatorul a cumpărat dar callback-ul a întârziat, sincronizez backend-ul și nu afișez eroare falsă.

3. Îmbunătățesc mesajul din UI pentru timeout
   - În `src/hooks/useSubscription.ts`, schimb mesajul generic „Achiziția App Store nu a răspuns” într-un mesaj de diagnostic mai util:
     - „App Store nu a returnat răspunsul la timp. Verific achiziția; dacă plata s-a finalizat, abonamentul se activează automat sau poți apăsa Restaurează achizițiile.”
   - După timeout, declanșez un `restoreIOSPurchases()` / `checkSubscription(true)` de siguranță, ca să prindem cazurile în care Apple/RevenueCat finalizează lent.

4. Adaug UI de debug minimal în dialogul Premium pentru iOS
   - În `PremiumDialog.tsx`, pentru iOS native, adaug un buton discret „Debug iOS billing” / „Copiază log iOS billing”.
   - Va afișa/copia ultimele loguri din `getIOSBillingDebugLog()`, ca să putem vedea exact ultima etapă atinsă pe TestFlight fără Xcode.

5. Verific integrarea nativă iOS
   - Confirm că pluginul `@revenuecat/purchases-capacitor` rămâne prezent în Swift Package Manager.
   - Nu ating cheia publică RevenueCat și nu introduc Secret API Key în client.

Ce NU voi face:
- Nu voi pune Secret API Key în aplicația iOS/client. Ar fi nesigur și nu rezolvă blocajul purchase sheet-ului.
- Nu voi reveni la Stripe pe iOS native, pentru că Apple nu permite asta pentru abonamente digitale în aplicații native.

După aprobare implementez schimbările în `iosBilling.ts`, `useSubscription.ts` și `PremiumDialog.tsx`.