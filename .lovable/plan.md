## Diagnostic confirmat

Din log-ul de pe iPhone:
- Plugin RevenueCat **se încarcă corect** (`hasPurchases: true`, e v13.0.1, listat în `Package.swift`)
- `pluginKeys: []` e fals-pozitiv (metodele statice nu apar în `Object.keys`)
- `init:start` se apelează **de 10+ ori în paralel** în primele 5 secunde
- Log-ul se oprește la `getPurchases:cached` — **niciun `init:configure-call`, `init:configure-ok` sau `init:configure-failed`**

Concluzie: primul apel `Purchases.configure()` **face hang la nivel nativ** (probabil StoreKit nu răspunde — sandbox account neconfigurat pe device, produse neaprobate în App Store Connect, sau bundle ID mismatch). Toate celelalte apeluri așteaptă pe același `initPromise` și nimic nu se mai întâmplă, inclusiv `purchasePackage`.

## Ce schimbăm

### 1. `src/lib/iosBilling.ts`

**a) Timeout dur pe `configure()`** (5s):
- Înfășurăm `Purchases.configure(...)` cu `Promise.race([call, timeout(5000)])`
- Dacă timeout, marcăm SDK-ul ca "degraded" dar **continuăm** — `configure` în RevenueCat poate fi sync intern și să nu rezolve niciodată Promise-ul

**b) Timeout pe `getOfferings()` și `getCustomerInfo()`** (8s fiecare):
- Dacă oricare face hang, log explicit + throw cu mesaj clar
- Important: `purchaseStoreProduct` / `purchasePackage` nu primesc timeout (utilizatorul interacționează cu sheet-ul Apple)

**c) Detecție explicită de metode înainte de apel**:
```ts
if (typeof Purchases.configure !== "function") {
  throw new Error("RevenueCat SDK incomplet — reinstalează appul");
}
```
Pentru fiecare metodă critică: `configure`, `getOfferings`, `purchaseStoreProduct`, `purchasePackage`, `getCustomerInfo`, `restorePurchases`. Asta ne spune **direct** dacă bridge-ul nativ lipsește, în loc să așteptăm timeout.

**d) Deduplicare reală a `initIOSBilling`**:
- Log-ul curent arată 10 invocări — toate ar trebui să cadă pe `initPromise` cached, dar producem `init:start` log de 10 ori. Mutăm log-ul **după** verificarea cache-ului.
- Adăugăm `initCompleted: boolean` — dacă e deja `true`, returnăm imediat fără să așteptăm vreun Promise.

**e) Log nou `init:bridge-check`** care printează `typeof` pentru fiecare metodă critică imediat după `getPurchases`. Asta confirmă dacă bridge-ul e prezent înainte să apelăm orice.

### 2. `src/hooks/useSubscription.ts`

**a) Mesaj de eroare îmbunătățit pentru timeout pe init**:
- Dacă `initIOSBilling` face timeout, afișăm: "RevenueCat nu a putut iniția. Verifică: (1) ești logat cu un Sandbox Apple ID în Settings → App Store, (2) ai conexiune la internet, (3) reinstalează appul."

**b) Apelăm `initIOSBilling` o singură dată** la mount, nu o lăsăm să fie re-apelată din `getIOSPrices` și `purchaseIOSSubscription`:
- În `iosBilling.ts`, în loc ca fiecare funcție publică să cheme `await initIOSBilling(userId)`, verificăm doar `if (!initCompleted) throw`. Init-ul se face **exclusiv** la mount în `useSubscription`.

### 3. `src/components/PremiumDialog.tsx` (existent)

- Butonul "Copiază log iOS billing" rămâne. Nimic nou aici.

## Ce NU e cauza (excludem)

- ❌ Plugin lipsă nativ — e în `Package.swift`
- ❌ API key greșit — log-ul arată `apiKeyPrefix: "appl_H"` corect
- ❌ Frontend bug în `purchasePackage` — niciodată nu ajungem acolo, init e blocat

## După deploy — ce verifici pe device

După `npx cap sync ios` + rebuild TestFlight, deschizi Premium dialog. Vei vedea unul din trei rezultate clare:

1. **Toast roșu `RC: bridge-check`** cu listă de metode care lipsesc → plugin-ul nativ chiar nu e link-uit corect (puțin probabil, dar definitiv)
2. **Toast roșu `RC: init:configure-timeout`** → `configure()` face hang nativ. Cauza 99% e: nu ești logat cu Sandbox Apple ID pe device în `Settings → App Store → Sandbox Account`. Fix: te deloghezi de la Apple ID-ul real, te loghezi cu un Sandbox tester creat în App Store Connect.
3. **Init reușește, dar `getOfferings` timeout** → produsele nu sunt aprobate în App Store Connect sau Offering-ul "current" e gol în RevenueCat dashboard

În oricare caz, vei avea un mesaj **acționabil** în loc de "App Store nu a răspuns".

## Fișiere modificate

- `src/lib/iosBilling.ts` — timeouts, bridge-check, deduplicare init reală
- `src/hooks/useSubscription.ts` — mesaj eroare init, fără re-init implicit