## De ce

Promoția „instalează PWA → Premium gratuit până 31.08.2026" a cauzat respingerea Apple (chiar și gate-uită cu `Capacitor.isNativePlatform()`, e un risc continuu și complică modelul de monetizare). O eliminăm complet și păstrăm doar fluxurile normale: Stripe pe web, IAP pe iOS, Play Billing pe Android, plus cupoanele administrate manual.

## Modificări de cod

### 1. `src/pages/Index.tsx`

- Șterg complet `useEffect`-ul de la liniile 125–168 (`grantInstallPremium`).
- Șterg importul `useInstallPrompt` și variabila `isInstalled` dacă nu mai sunt folosite altundeva în fișier (verific; `isInstalled` apare doar pentru auto-grant).

### 2. `src/hooks/useInstallPrompt.ts`

- Rămâne neschimbat ca API (e folosit eventual pentru bottom-nav / „add to home screen" prompt). Doar șterg comentariul lung de avertizare despre auto-grant — devine irelevant.

### 3. Memory

- Șterg `mem://features/premium-auto-grant` (feature-ul nu mai există).
- Scot referința din `mem://index.md`.
- Adaug o linie scurtă în Core: „Nu există auto-grant Premium pentru instalare PWA — toate upgrade-urile trec prin Stripe / IAP / Play Billing / cupoane manuale."

## Curățare date existente (opțional, recomandat)

Există useri pe web care au primit deja Premium gratuit prin acest mecanism. Două opțiuni:

- **A. Păstrăm Premium-ul deja acordat** până la 31.08.2026 (nu dezamăgim utilizatorii care l-au primit deja, doar oprim acordarea pentru viitor). Cel mai sigur.
- **B. Resetăm toți userii cu redemption pe cuponul `42b385ff-...**` la free imediat. Poate genera reclamații.

Recomand **A**. Cuponul rămâne în DB ca istoric, doar nu mai e inserat de aplicație.

## Ordine

1. Șterg `useEffect`-ul din `Index.tsx` + import-urile nefolosite.
2. Curăț comentariul din `useInstallPrompt.ts`.
3. Update memory (șterg fișier, actualizez index, adaug regulă în Core).

Confirmi (și alegi A sau B pentru userii existenți)?  
  
Confirm si aleg A