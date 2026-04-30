## Problema

În screenshot-ul din TestFlight (iOS) se văd două lucruri:

1. **Prețul afișat este `14,99 RON`** — același cu Android/Stripe. Pe iOS prețul trebuie să vină din App Store Connect (prin RevenueCat), pentru că Apple afișează prețul în moneda locală a contului App Store și prețul real configurat în App Store Connect poate fi diferit (de ex. tier-ul ales în USD/EUR).
2. **La apăsarea pe cardul de preț** apare doar un spinner verde și nu se deschide nimic — nicio foaie Apple Pay, nicio eroare vizibilă. Cel mai probabil `getOfferings()` din RevenueCat nu returnează pachetul `pyro_student_monthly_ios`, iar eroarea apare doar în consolă.

## Cauza

În `src/components/PremiumDialog.tsx`, prețul este scris hardcodat în JSX:
```
<p>14,99 <span>RON</span></p>
```
Pe iOS, RevenueCat returnează `storeProduct.priceString` localizat (ex. `"$2.99"`, `"2,99 €"`, `"14,99 lei"`), care trebuie folosit în locul textului fix.

Pentru butonul care nu răspunde, eroarea „Pachet RevenueCat negăsit" sau orice eșec de configure este aruncată în `purchaseIOSSubscription` și prinsă în `handlePurchase`, dar nu este afișată utilizatorului — doar `console.error`. În TestFlight nu se vede consola, deci pare blocat.

## Modificări

### 1. `src/lib/iosBilling.ts` — expune prețul localizat și pachetele

Adaugă o funcție nouă care returnează prețurile App Store pentru fiecare produs iOS:

```ts
export interface IOSPriceInfo {
  productId: string;
  priceString: string;     // ex. "14,99 lei", "$2.99"
  price: number;           // valoare numerică
  currencyCode: string;    // ex. "RON", "USD"
}

export async function getIOSPrices(): Promise<Partial<Record<IOSProductKey, IOSPriceInfo>>>
```
Funcția:
- Apelează `Purchases.getOfferings()`.
- Pentru fiecare cheie din `IOS_PRODUCTS`, găsește pachetul după `productId` și extrage `storeProduct.priceString / price / currencyCode`.
- Loghează clar dacă un produs lipsește din offering (ajută diagnosticul TestFlight).

### 2. `src/hooks/useSubscription.ts` — adaugă state pentru prețuri iOS

- Adaugă `iosPrices` în state-ul hook-ului.
- În `useEffect`-ul care apelează `initIOSBilling`, după inițializare apelează `getIOSPrices()` și salvează rezultatul.
- Returnează `iosPrices` din hook.

### 3. `src/components/PremiumDialog.tsx` — afișaj și diagnostic

- Citește `iosPrices` și `isIOSNative` din `useSubscription`.
- Construiește `displayPrice` astfel:
  - Dacă `isIOSNative` și `iosPrices.student_monthly?.priceString` există → folosește `priceString` localizat (înlocuiește integral `"14,99 RON"`).
  - Altfel → fallback la `"14,99 RON"` (Android + web Stripe au același preț în RON).
- În `handlePurchase`, dacă `startCheckout` aruncă eroare pe iOS, afișează `toast.error(err.message ?? "Achiziția nu a putut fi inițiată")` ca să se vadă cauza în TestFlight (ex. „Pachet RevenueCat negăsit pentru pyro_student_monthly_ios").

### 4. Fără modificări de backend

Nu se ating funcțiile edge sau RLS. Prețul afișat este pur cosmetic; sursa de adevăr pentru ce plătește utilizatorul rămâne App Store (Apple confirmă prețul final în foaia de plată).

## Pași după deploy

1. În App Store Connect verifică ca produsul `pyro_student_monthly_ios` să fie `Ready to Submit` / `Approved` și să fie atașat în RevenueCat la Offering-ul `current`.
2. Rulează local `npx cap sync ios` și rebuild în Xcode pentru ca pluginul `@revenuecat/purchases-capacitor` să fie inclus.
3. În TestFlight, dacă apare toast-ul „Pachet RevenueCat negăsit", problema e în Offerings RevenueCat, nu în cod — știm exact unde să intervenim.

## Rezultat așteptat

- Pe iOS prețul afișat în dialog devine cel real din App Store (ex. `14,99 lei` sau echivalent în moneda contului App Store), nu un text hardcodat.
- La apăsare, dacă RevenueCat nu poate iniția achiziția, utilizatorul vede un toast cu motivul în loc de spinner infinit.
- Pe Android și web, comportamentul rămâne identic cu cel actual.