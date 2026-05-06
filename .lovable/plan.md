# Conformare Apple Guideline 3.1.1 — ascundere cupoane pe iOS

## Context
Apple a respins build-ul pentru că aplicația deblochează funcționalități plătite prin coduri promo (cupoane PYRO-/PROF-) — mecanism alternativ la In-App Purchase. Modificările trebuie să afecteze **doar versiunea iOS nativă**. Pe Android și pe web (Stripe) cupoanele rămân exact ca acum.

## Strategie
Apple verifică **ce vede utilizatorul în app**. Backend-ul (edge function `redeem-coupon`, tabela `coupons`, logica din `check-subscription`) rămâne intact — îl folosim în continuare pentru web/Android/admin. Ascundem doar UI-ul de introducere cupon când rulează pe iOS nativ.

## Modificări

### 1. `src/components/CouponRedemption.tsx`
- Import `Capacitor` din `@capacitor/core`.
- La începutul componentei: dacă `Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios"` → `return null`.
- Restul logicii rămâne neschimbat.

Aceasta acoperă singurul punct din UI unde userul poate introduce un cod (folosit doar în `AccountProfileTab.tsx`).

### 2. Verificare suplimentară — căi indirecte
Verific și ascund pe iOS, dacă există:
- Orice CTA „Ai un cod?" / „Activează cupon" în `PremiumDialog.tsx`, `TeacherPremiumDialog.tsx`, `CouponExpiredDialog.tsx`. Dacă apare text/buton care îndeamnă la introducere cod, îl ascund pe iOS. (Le inspectez înainte de modificare; dacă nu există referințe la cupon, nu schimb nimic.)
- Admin coupon manager (`src/components/admin/CouponManager.tsx`) — rămâne accesibil pentru admin (nu e o cale de unlock pentru user final, dar pe iOS îl ascund din precauție dacă e accesibil din app — verific dacă pagina admin e linkată în UI nativ).

### 3. Ce NU schimb
- Edge functions `redeem-coupon`, `check-subscription` — rămân (folosite pe Android/web).
- Tabelele `coupons`, `coupon_redemptions` — rămân.
- Logica Stripe / IAP iOS / Play Billing — neatinsă.
- Cupoanele rămân 100% funcționale pe Android și web.

## Detalii tehnice
Pattern folosit deja în proiect (consistent cu `RealEmailSetupCard.tsx`, `AuthPage.tsx`):
```ts
import { Capacitor } from "@capacitor/core";
const isNativeIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
if (isNativeIOS) return null;
```

## Testare
- iOS nativ (TestFlight rebuild după `npx cap sync ios`): cardul „Ai un cupon?" nu mai apare în Account.
- Android / web: cupoanele funcționează normal.
- Admin: gestionarea cupoanelor neafectată.

## Memorie
Actualizez `mem://features/coupon-system` cu nota: „UI-ul de redemption este ascuns pe iOS nativ pentru conformitate Apple 3.1.1; backend-ul rămâne activ pentru web/Android."
