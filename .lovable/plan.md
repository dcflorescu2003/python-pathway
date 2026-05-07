# Cauza ecranului negru la prima deschidere după update (Android)

## Diagnostic

La un update Android, WebView-ul Chrome trebuie să recompileze JS-ul și să reconstruiască cache-ul aplicației, iar `localStorage` poate fi reinițializat. Secvența actuală în `src/App.tsx`:

1. `capacitor.config.ts` are `launchAutoHide: true` cu `launchShowDuration: 2500` → splash-ul nativ dispare automat după 2.5s indiferent dacă webview-ul a apucat să randeze ceva.
2. În plus, în `AppComponent.useEffect` apelăm `CapSplashScreen.hide({ fadeOutDuration: 250 })` **imediat ce React montează** — adică, paradoxal, ascundem splash-ul înainte ca primul frame React să fie pictat (mai ales când Vite/asset-urile sunt încă "rece" după update).
3. Rezultat: splash dispare → JS-ul/CSS-ul mare nu e încă pictat în WebView → utilizatorul vede ecran negru. La a doua deschidere totul e cache-uit, deci nu mai apare.

În prezent există deja un watchdog care face `window.location.reload()` după 14s pe nativ, dar:
- Nu se declanșează dacă există sesiune Supabase persistată (return early).
- 14s e mult prea mult — utilizatorul deja a închis aplicația.

## Soluție

Două schimbări mici, ambele în straturi de prezentare/bootstrap (fără atingerea logicii de business):

### 1. `capacitor.config.ts` — controlăm manual ascunderea splash-ului
- `launchAutoHide: false` (sau lăsăm o plasă lungă, ex. 5000ms) ca splash-ul nativ să rămână până când JS-ul confirmă că UI-ul e pictat.
- Păstrăm restul setărilor (background, spinner) identice ca să nu se schimbe vizual.

### 2. `src/App.tsx` — ascundem splash doar după primul paint real
- Eliminăm apelul imediat `CapSplashScreen.hide()` din primul `useEffect`.
- Adăugăm un nou efect care:
  - așteaptă **2 `requestAnimationFrame`** consecutive (garantează că React a comis în DOM și browserul a făcut paint),
  - apoi apelează `CapSplashScreen.hide({ fadeOutDuration: 200 })`.
- Adăugăm o plasă de siguranță: dacă după 6s tot nu am ajuns la "ready" (auth încă încarcă), forțăm totuși `hide()` ca să nu rămână utilizatorul cu splash infinit.

### 3. Watchdog de pornire (`AppComponent`) — mai agresiv pe Android după update
- Reducem timeout-ul nativ de la **14s la 8s** și eliminăm condiția care blochează reload-ul când există chei `sb-*` în localStorage (acea condiție există ca să nu întrerupem restaurarea sesiunii, dar exact în scenariul nostru utilizatorul vede ecran negru și sesiunea e oricum în `@capacitor/preferences`, deci `installNativeAuthPersistence` o va rehidrata la reload).
- În loc să eliminăm complet protecția, înlocuim heuristica: facem reload dacă **nu există root content în DOM** (`document.getElementById('root')?.childElementCount === 0`) după 8s — semnal clar de ecran negru, nu de auth lent.

Astfel:
- Splash-ul nativ rămâne vizibil până webview-ul chiar are conținut (rezolvă cauza directă),
- Iar dacă totuși ceva eșuează (ex. cache corupt după update), watchdog-ul face automat un singur reload în 8s, fără ca utilizatorul să fie nevoit să închidă/redeschidă manual.

## Notă
După aprobare, schimbarea în `capacitor.config.ts` necesită un nou build Android (`npx cap sync android` + AAB nou) ca să intre pe device-urile reale; modificările din `App.tsx` ajung prin orice OTA/web build inclus în următorul AAB.
