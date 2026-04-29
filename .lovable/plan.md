
# Fix respingere App Store — 3 probleme

Apple a respins build-ul din 3 motive distincte. Le iau pe rând. **Doar #3 e cod**; #1 și #2 sunt pași în App Store Connect / pe Mac, pe care ți-i explic dar nu-i pot face eu.

## 1. Screenshots cu status bar Android (Guideline 2.3.3)

**Ce e:** Screenshots-urile uploadate în App Store Connect sunt cele de pe Android (status bar cu baterie/oră în stil Android, sau eventual chenarul Android). Apple respinge orice metadata care arată alt OS.

**Ce ai de făcut tu (nu pot face din cod):**
- În App Store Connect → App → 1.0 Pregătit pentru trimitere → Previews and Screenshots → "View All Sizes in Media Manager"
- Șterge screenshots-urile actuale
- Generează screenshots noi **de pe iPhone real / Simulator iOS** (Xcode → Simulator → Device → 6.9" iPhone 17 Pro Max + 6.7" iPhone 15 Pro Max). Dimensiuni cerute:
  - 6.9" (1320×2868) — obligatoriu
  - 6.5" (1284×2778) — recomandat
  - iPad 13" dacă suporți iPad (poți declara "iPhone only" și scapi)
- Cmd+S în Simulator pentru fiecare ecran (Home, Lecție, Code Editor, Leaderboard, Premium dialog, Cont) → 5–10 imagini

**Recomandare:** Declară aplicația **iPhone-only** în target-ul Xcode (Devices: iPhone) ca să nu mai trebuiască și screenshots iPad. Pot face asta în cod (modific `project.pbxproj` `TARGETED_DEVICE_FAMILY = "1"`).

## 2. IAP-urile nu sunt submitted for review (Guideline 2.1)

**Ce e:** Apple vede în UI-ul tău butoane de "Premium" / "Abonament", dar în App Store Connect nu există niciun In-App Purchase trimis spre review odată cu binarul.

**Ce ai de făcut tu în App Store Connect (nu pot face din cod):**
1. App Store Connect → App → **In-App Purchases** (în meniul stâng) → "+"
2. Creează **Auto-Renewable Subscription**:
   - Reference Name: `Elev Premium Lunar`
   - Product ID: `ro.pythonpathway.app.premium.monthly` (notează-l!)
   - Subscription Group: `PyRo Premium` (creezi unul)
   - Duration: 1 Month
   - Price: tier-ul dorit (ex. RON 19.99)
3. Adaugă **Localization** (RO + EN): display name "Elev Premium" + descriere
4. Urcă **screenshot review IAP** (1024×1024 sau screenshot din app cu paywall) — obligatoriu, altfel nu poți submit-ui
5. Repetă pentru plan anual dacă ai (ex. `ro.pythonpathway.app.premium.yearly`)
6. Confirmă **Paid Apps Agreement** semnat în App Store Connect → Business
7. Când urci binar nou, bifează IAP-urile pentru a fi incluse în review

**Spune-mi product ID-urile finale** ca să le pun în cod la pasul 3.

## 3. Click pe Premium nu pornește purchase flow pe iOS — FIX ÎN COD

**Ce e:** În `useSubscription.ts`, `startCheckout` testează doar `isAndroidNative()` și pe iOS cade pe Stripe (`window.open(data.url, "_blank")`). În aplicația nativă iOS, `window.open` nu deschide nimic util, deci Apple a văzut "se încarcă scurt și nu pornește". În plus, **Apple interzice categoric Stripe pentru subscripții digitale** — trebuie StoreKit/IAP.

**Ce voi face în cod:**

### 3a. Adaug plugin StoreKit
Folosesc același `cordova-plugin-purchase` (`CdvPurchase`) pe care îl ai deja pentru Android — suportă și Apple App Store nativ. E deja instalat (`CordovaPluginPurchase` apare în `Package.swift`). Refactor `src/lib/playBilling.ts` într-un modul `iapBilling.ts` agnostic care:
- Detectează platforma (`getPlatform() === "ios"` vs `"android"`)
- Înregistrează produsele cu `Platform.APPLE_APPSTORE` sau `Platform.GOOGLE_PLAY` corespunzător
- La approve, trimite la backend receipt-ul (`appStoreReceipt` / `purchaseToken`) cu un câmp `platform: "ios" | "android"`

### 3b. Mapping produs Stripe → iOS
Adaug `STRIPE_TO_IOS` cu product ID-urile pe care le creezi la pasul 2 (ex. `ro.pythonpathway.app.premium.monthly`).

### 3c. Edge function `verify-ios-purchase`
Creez o funcție nouă (sau extind `verify-play-purchase` → `verify-purchase`) care:
- Pe iOS: trimite `receipt-data` la `https://buy.itunes.apple.com/verifyReceipt` (cu fallback la sandbox URL pentru TestFlight). Necesită un **App-Specific Shared Secret** din App Store Connect → App → App Information → App-Specific Shared Secret. Îl voi cere ca secret `APPLE_SHARED_SECRET`.
- Validează că product_id e cunoscut, expirația e în viitor → marchează `profiles.is_premium = true` și salvează în tabelul de subscripții.
- Pe Android: păstrează logica existentă.

### 3d. Update `useSubscription.startCheckout` și `openPortal`
- `startCheckout`: dacă iOS native → `purchaseSubscription` cu mapping iOS, dacă Android → ce face acum, altfel Stripe (web).
- `openPortal`: pe iOS deschide `itms-apps://apps.apple.com/account/subscriptions` (deep link Settings → Subscriptions).
- `restorePurchases`: extind să meargă și pe iOS.

### 3e. Update `PremiumDialog`
Schimb textul "Gestionează în Google Play" → afișează "Gestionează în App Store" pe iOS. Adaug buton "Restaurează cumpărăturile" și pe iOS (cerut de Apple Guideline 3.1.1).

### 3f. Capabilities iOS
Verific că în Xcode, target App → Signing & Capabilities → **In-App Purchase** e adăugat. Dacă nu, îți spun să-l adaugi (1 click) — nu pot edita `.pbxproj` capabilities din cod sigur, dar pot ghida.

## După implementare

Pași pe care îi faci tu:
1. `git pull` + `npm i` + `npx cap sync ios`
2. În Xcode → Capabilities → adaugă **In-App Purchase** dacă nu e
3. Creează IAP-urile în App Store Connect (pasul 2)
4. Adaugă secret `APPLE_SHARED_SECRET` în Lovable Cloud
5. Generează screenshots noi din Simulator
6. Bump build number în Xcode → Archive → Upload → submit cu IAP-urile bifate, răspuns la review în care explici "Apple Sign In with Apple în loc de email"
7. Test în Sandbox cu un Sandbox Tester înainte de submit

## Ce ai de confirmat acum

1. **Product ID-urile IAP** pe care le vei crea (sugestie: `ro.pythonpathway.app.premium.monthly` și `.yearly`) — sau să folosesc ăstea?
2. **Vrei să declar aplicația iPhone-only** (scapi de iPad screenshots)?
3. Confirmi că pot crea edge function nouă `verify-purchase` care înlocuiește `verify-play-purchase` (sau prefer să adaug separat `verify-ios-purchase` și să le păstrez decuplate)?
