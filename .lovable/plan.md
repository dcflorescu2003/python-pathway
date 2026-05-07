# Plan: Fix iOS post-update + bump versiune + AdMob iOS

## 1. Fix ecran negru iOS după update (similar cu Android)

Aceeași cauză posibilă pe iOS: după update, WKWebView trebuie să recompileze JS și `localStorage` poate fi evacuat. Fix-ul actual din `src/App.tsx` (2× `requestAnimationFrame` înainte de a ascunde splash + watchdog 8s pe nativ + reload heuristic) **se aplică deja și pe iOS** — folosește `Capacitor.isNativePlatform()`, nu doar Android.

Ce mai trebuie configurat specific pentru iOS:

### `ios/App/App/Info.plist`

Adăugăm chei pentru ca `SplashScreen` plugin-ul Capacitor să respecte aceleași setări ca Android (în prezent splash-ul iOS folosește doar `LaunchScreen.storyboard` și dispare imediat ce primul ViewController e gata, înainte ca WKWebView să fi pictat React):

- `UILaunchStoryboardName` = `LaunchScreen` (deja există) — OK.
- Confirmăm că `capacitor.config.ts` are `launchAutoHide: false` (deja este) — această setare e respectată și de iOS plugin, deci splash-ul nativ va aștepta apelul manual `CapSplashScreen.hide()` declanșat de cele 2 rAF din `App.tsx`. Astfel, dacă WKWebView e lent la primul boot post-update, splash-ul rămâne vizibil până React pictează — nu mai apare ecran negru.

Concluzie: **logica JS din `App.tsx` rezolvă deja iOS automat**, fără modificări de cod. Singurul lucru de făcut e să generăm un build nou cu setările actuale (care nu erau încă în binarul iOS publicat).

## 2. Activare AdMob iOS cu production unit ID (preventiv)

Chiar dacă nu lansezi încă reclamele pe iOS, includem deja codul corect ca să nu fim nevoiți la un viitor build. Plan:

### `src/hooks/useAdMob.ts`

- Schimbăm `PROD_REWARDED_IOS = TEST_REWARDED_IOS` în:
  ```ts
  // Set when iOS Rewarded Ad Unit is created in AdMob.
  // Until then, fall back to test ID so iOS users see test ads (not crashes).
  const PROD_REWARDED_IOS = "" /* completat când îl ai */;
  ```
- Funcția `getAdUnitId()` devine: dacă pe iOS `PROD_REWARDED_IOS` e gol → folosește `TEST_REWARDED_IOS` (deci utilizatorul vede test ads, exact ca acum). Când completezi ID-ul real, doar îl pui în string fără build nou? **Nu** — e cod compilat în bundle-ul JS, deci tot ai nevoie de build. Dar pentru OTA prin Lovable/Capacitor Live Updates ar funcționa; momentan nu folosim Live Updates, deci tot un AAB/IPA nou.

**Recomandare onestă**: lăsăm acum un `PROD_REWARDED_IOS` placeholder care cade pe test ID, ca scheletul să fie acolo. Când ai ID-ul real, îl înlocuiești într-un viitor build (oricum vei mai face cel puțin un build pentru orice schimbare de cod). **Nu te scutește 100% de un build viitor, dar reduce riscul** dacă schimbi între timp altceva.

Alternativă mai bună: **citim `PROD_REWARDED_IOS` din variabilă de mediu** (`import.meta.env.VITE_ADMOB_IOS_REWARDED`) cu fallback la test ID. Avantaj: poți schimba ID-ul fără să atingi cod, doar prin `.env`. Dezavantaj: tot ai nevoie de build (Vite injectează env la build time).

→ **Concluzie**: nu există o cale care să elimine complet nevoia de un build când vei avea ID-ul iOS real. Dar putem pregăti scheletul corect acum.

## 3. Bump versiune

Curent: `versionCode 102` / `versionName "1.102"` (Android), `MARKETING_VERSION 1.102` / `CURRENT_PROJECT_VERSION 102` (iOS).

Bump la **103 / 1.103** pentru ambele:

- `android/app/build.gradle`: `versionCode 103`, `versionName "1.103"`.
- `ios/App/App.xcodeproj/project.pbxproj`: `CURRENT_PROJECT_VERSION = 103;`, `MARKETING_VERSION = 1.103;`.

## Ce NU schimb

- Logica `App.tsx`/`capacitor.config.ts` (deja fixate la iterația trecută, se aplică automat și iOS).
- Nu adaug iOS App ID în `Info.plist` — există deja (`GADApplicationIdentifier`).
- Nu modific `AndroidManifest` — fix-ul Android e deja livrat.

## Pași după aprobare

1. Edit `useAdMob.ts` — placeholder iOS prod ID cu fallback la test.
2. Bump versiune Android (`build.gradle`) și iOS (`project.pbxproj`).
3. Tu rulezi: `npx cap sync ios && npx cap sync android` apoi build AAB Android + Archive iOS.

Confirmi să implementez?  
Confirm daca implementarea legata anunturi nu afectaza functionalitatea viitorului build. Trebuie sa apara totusi niste reclame pentru refill. Daca afecteaza renuntam momentan la asta si facem in viitoare versiune