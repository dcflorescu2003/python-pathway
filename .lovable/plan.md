## Problema

Pe iOS se deschide Stripe checkout în loc de RevenueCat/Apple IAP. Există două cauze în cod:

1. `PremiumDialog.tsx` verifică doar `isAndroidNative` — textul arată "Stripe" și butonul "Restaurează" lipsește pentru iOS
2. `useSubscription.ts` are logica corectă (ramifică pe iOS spre RevenueCat), dar dacă `npx cap sync ios` nu a fost rulat după înlocuirea plugin-ului, Capacitor returnează `false` pentru `isNativePlatform()` și cade în fallback Stripe

## Ce schimbăm în cod

**`src/components/PremiumDialog.tsx`**
- Textul de jos: `isIOSNative() ? "Plata se procesează prin App Store" : isAndroidNative ? "Google Play" : "Stripe"`
- Butonul "Restaurează achizițiile" apare și pentru iOS (nu doar Android)
- Import `isIOSNative` din `@/lib/iosBilling`

**`src/hooks/useSubscription.ts`**
- Adaugă log explicit când `isIOSNative()` este `true` înainte de a apela RevenueCat, pentru debugging
- Dacă RevenueCat aruncă eroare pe iOS, nu mai cade silențios în Stripe — afișează toast cu eroarea

## Ce trebuie să faci tu (obligatoriu după approve)

Dupa ce aprobți și codul e actualizat, pe mașina ta:
```
git pull
npx cap sync ios
```
Fără `npx cap sync ios`, plugin-ul `@revenuecat/purchases-capacitor` nu ajunge în proiectul nativ Xcode și Capacitor nu îl recunoaște — tocmai de aceea `isIOSNative()` probabil returnează `false` sau plugin-ul nu se încarcă.
