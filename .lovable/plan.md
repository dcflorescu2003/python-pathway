

User provided AdMob App ID: `ca-app-pub-8441862030200888~2393829276`. Need to:
1. Replace test App ID in AndroidManifest.xml and Info.plist with this real one.
2. Give detailed step-by-step instructions on what to do next in AdMob console (create ad units), and locally (npm install, cap sync, rebuild).

Ad Unit IDs (rewarded) — user hasn't provided yet. Will keep Google test rewarded unit IDs in `useAdMob.ts` until they create the rewarded ad units in AdMob console. That's safe and recommended.

## Plan: Configurare AdMob App ID + pași următori

### 1. Înlocuire App ID în cod (fac eu)

Înlocuiesc App ID-ul de test cu cel real (`ca-app-pub-8441862030200888~2393829276`) în:

- **`android/app/src/main/AndroidManifest.xml`** — meta-data `com.google.android.gms.ads.APPLICATION_ID`
- **`ios/App/App/Info.plist`** — cheia `GADApplicationIdentifier`

Las **Ad Unit IDs** (din `src/hooks/useAdMob.ts`) pe **test IDs Google** pentru moment — reclamele reale apar doar după ce creezi unități de reclamă în consola AdMob (pas 3 mai jos) și mi le trimiți.

### 2. Ce trebuie să faci tu local (după ce dau git push)

```bash
git pull
npm install
npm run build
npx cap sync android
npx cap sync ios   # doar dacă ai Mac cu Xcode
```

`cap sync` copiază App ID-ul nou în proiectele native. Fără el, schimbarea din `Info.plist` / `AndroidManifest.xml` nu se propagă.

### 3. Ce trebuie să faci în consola AdMob (https://apps.admob.com)

Acum ai aplicația creată. Mai trebuie să creezi **unități de reclamă rewarded**:

1. AdMob → **Apps** → selectează aplicația PyRo (Android)
2. Click **Ad units** → **Add ad unit**
3. Alege **Rewarded** (NU rewarded interstitial, NU banner)
4. Nume: `PyRo Rewarded Lives` (sau orice)
5. Tipul recompensei: `Lives` cu valoare `5`
6. Salvează → primești un ID de forma `ca-app-pub-8441862030200888/XXXXXXXXXX`
7. **Repetă** pentru iOS dacă publici și pe App Store

Trimite-mi cele 1-2 ID-uri (`ca-app-pub-8441862030200888/...`) și le pun în `useAdMob.ts` în locul ID-urilor de test.

### 4. Linkează aplicația cu Google Play (recomandat)

În AdMob: **Apps → PyRo → App settings → Link to app store**.

- Necesar ca AdMob să-ți afișeze reclame reale în producție (altfel rămân la fill rate redus)
- Funcționează doar după ce app-ul tău e listat în Google Play Console (chiar și internal testing e ok)

### 5. Testare

**În development (acum, cu test IDs):**
- Build app, instalează pe telefon → în dialogul „Fără inimi" apare butonul „Vizionează o reclamă pentru +5 inimi"
- Reclama afișată are eticheta **„Test Ad"** — normal, înseamnă că funcționează corect
- După vizionare → +5 vieți, contor `ads_watched_today` incrementat în DB

**În producție (după ce-mi trimiți Ad Unit IDs reale):**
- Înlocuiesc constantele `PROD_REWARDED_ANDROID` / `PROD_REWARDED_IOS` în `useAdMob.ts`
- Build release AAB → upload Google Play

### 6. ⚠️ Atenție important

- **NU** da click pe propriile reclame reale (te banează AdMob permanent). Pentru testare folosește mereu test IDs până ești în Play Store.
- Plățile AdMob încep doar după ce atingi pragul de 100 USD acumulați.
- Politica Google Play: Rewarded ads sunt **permise și încurajate** (vs interstitiale care irită utilizatorii).

### Fișiere modificate (pasul 1, fac eu acum după aprobare)

- `android/app/src/main/AndroidManifest.xml`
- `ios/App/App/Info.plist`

Atât. Restul rămâne identic — backend-ul (`reward-life`), butonul, hook-ul sunt deja gata.

