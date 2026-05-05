
## Cauza reală a respingerii Apple

Reviewer-ul a apăsat „Upgrade" pe iPad și appul a confirmat Premium fără să deschidă fereastra StoreKit. Am găsit de ce.

În `src/pages/Index.tsx` (liniile 125-163) avem un efect care, dacă `useInstallPrompt().isInstalled === true`, inserează automat un `coupon_redemptions` cu `premium_until = 2026-08-31` și setează `is_premium = true`. Apoi afișează toast-ul „Premium activat! 🎉".

Problema: în `src/hooks/useInstallPrompt.ts`, `isInstalled` este `true` și pentru WKWebView-ul Capacitor de pe iOS (raportează `display-mode: standalone` și `navigator.standalone === true`). Deci, în momentul în care reviewer-ul s-a logat în build-ul nativ TestFlight, contul lui a primit instant Premium gratuit. Când a apăsat ulterior „Upgrade", `subscribed === true` → `PremiumDialog` a afișat ecranul „Ești Premium!" în loc să deschidă StoreKit.

Asta este exact ce descrie Apple: „the app confirmed a successful upgrade without loading a purchase flow".

Promoția „instalează PWA = Premium până 31.08.2026" trebuie să rămână doar pentru web/PWA, niciodată pentru build-uri din App Store sau Google Play (acolo bypass-ul plății contravine inclusiv Guideline 3.1.1).

## Verificare împotriva linkurilor Apple

- **2.1(b) App Completeness** → flux de IAP rupt. Rezolvat prin fix-ul de mai jos.
- **Paid Apps Agreement** (link 2 + 3) → trebuie verificat manual de tine în App Store Connect → Business → Agreements. Nu pot verifica din cod, dar îți spun unde să te uiți.
- **Configure In-App Purchase / View IAP info** (link 4 + 5) → cele 4 product ID-uri (`pyro_student_monthly_ios`, `pyro_student_yearly_ios`, `pyro_teacher_monthly_ios`, `pyro_teacher_yearly_ios`) trebuie să fie „Ready to Submit" și atașate la build-ul submis.
- **Sandbox testing** (link 6) → reviewer-ul trebuie să poată face cumpărarea sandbox; flow-ul nostru e ok (StoreKit 2 + verify-ios-purchase), problema era că nu ajungea niciodată acolo.

## Modificări de cod

### 1. `src/pages/Index.tsx` — gate auto-grant pe non-native
Schimbă efectul de la linia 125 ca să iasă imediat dacă `Capacitor.isNativePlatform()` este true. Auto-grant rămâne doar pentru web/PWA.

```ts
import { Capacitor } from "@capacitor/core";
...
useEffect(() => {
  if (Capacitor.isNativePlatform()) return; // nu pe iOS/Android nativ
  if (!isInstalled || !user) return;
  ...
}, [isInstalled, user]);
```

### 2. `src/hooks/useInstallPrompt.ts` — clarificare
`isInstalled` rămâne ca acum (folosit și pentru bottom-nav), dar adaugă un comentariu că pe Capacitor returnează `true` și nu trebuie folosit pentru a acorda beneficii plătite.

### 3. Curăță conturile deja afectate (reviewer Apple + alți useri din TestFlight)
Migrare SQL care șterge `coupon_redemptions` cu `coupon_id = '42b385ff-eb24-4604-8e36-595e9424387b'` create de pe iOS (sau, mai sigur, toate intrările pentru acel cupon care nu au venit dintr-o redemption explicită — adăugăm o coloană `auto_granted` sau folosim simplu `created_at` pentru intervalul TestFlight). Discutăm exact criteriul când ajungem la pas.

Pentru reviewer, soluția curată: șterge redemption-ul lor și pune `is_premium = false` (dacă nu au alt motiv să fie premium). Următoarea oară când deschid appul, „Upgrade" va deschide StoreKit corect.

### 4. `src/components/TeacherPremiumDialog.tsx` — buton Restore și pe iOS
Acum butonul „Restaurează achizițiile" e afișat doar dacă `isAndroidNative`. Apple cere ca orice ecran de subscription să aibă Restore. Schimbă condiția în `(isAndroidNative || isIOSNative)`, identic cu `PremiumDialog.tsx`.

### 5. `src/components/PremiumDialog.tsx` — îndepărtează butonul „Copiază log iOS billing"
Apple poate flagua butonul de debug în UI-ul de plată (Guideline 4.0). E util la noi în dezvoltare, dar pentru producție îl ascundem dacă nu suntem în development. Gate-uim cu `import.meta.env.DEV`.

### 6. Memory update
Actualizez `mem://features/premium-auto-grant` ca să spună explicit: „Auto-grant pentru instalare standalone se aplică DOAR pe web/PWA, NICIODATĂ pe Capacitor (iOS/Android nativ)".

## Pași non-cod pe care îi faci tu în App Store Connect (în paralel cu fix-ul)

1. **Business → Agreements, Tax, and Banking** → confirmă că „Paid Apps" e „Active" (nu „Action Required"). Dacă scrie altceva, semnează-l.
2. **My Apps → PyRo → In-App Purchases** → verifică că toate cele 4 produse au status „Ready to Submit", au screenshot de review, descriere, preț în Tier valid.
3. La submit-ul următor, în secțiunea „App Review Information" → „Notes", scrie:
   > „IAP products are visible after login on the home screen via the crown icon (top-right). The reviewer can also test from Account → Become Premium. Use a sandbox Apple ID."
4. Lasă reviewer-ul să folosească contul demo cu un user nou (sau resetează contul demo în Sandbox Testers).

## Ordinea implementării

1. Fix `Index.tsx` (cel mai important — rezolvă root cause-ul)
2. Migrare cleanup pentru reviewer + useri TestFlight afectați
3. Restore button în `TeacherPremiumDialog`
4. Gate debug button în `PremiumDialog`
5. Comentariu în `useInstallPrompt`
6. Update memory

Confirmi planul și trecem la implementare?
