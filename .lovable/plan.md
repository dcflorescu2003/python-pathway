## Diagnostic: ecran negru la prima deschidere după install/update

Există **3 cauze probabile** care se combină pentru a produce ecranul negru. Pe a 2-a deschidere totul funcționează pentru că assets-urile sunt deja în cache și storage e cald.

### Cauzele identificate

**1. Splash-ul nativ Android se ascunde prea devreme (cauza principală)**

Capacitor folosește `androidx.core.splashscreen` (definit în `styles.xml` ca `AppTheme.NoActionBarLaunch`) care se ascunde **automat de îndată ce primul frame e desenat de WebView**. La prima rulare:
- WebView nu are bundle-ul JS în cache → arată un frame gol (negru) imediat ce se inițializează
- Splash-ul nativ se ascunde
- React încă nu s-a montat → utilizatorul vede negru până când JS-ul se încarcă, parsează și montează

La a 2-a deschidere, JS-ul e cache-uit de WebView și React montează rapid → fără gap.

**Nu e instalat pluginul `@capacitor/splash-screen`**, deci nu putem controla momentul ascunderii din JS.

**2. `SplashScreen.tsx` (React) nu se afișează la prima rulare**

În `App.tsx` (liniile 108-111):
```ts
const [showSplash, setShowSplash] = useState(() => {
  const shown = sessionStorage.getItem("pyro-splash-shown");
  return !shown;
});
```
Splash-ul React durează 1500ms, apoi setează `pyro-splash-shown` în `sessionStorage`. Problema: dacă React încă n-a apucat să se monteze, acest splash nu acoperă gap-ul nativ-WebView. E doar un cover **după** ce React e gata.

**3. Background-ul aplicației nu e setat în temele native**

În `styles.xml`:
- `AppTheme.NoActionBar` are `android:background = @null`
- Body-ul HTML / WebView nu are un background-color forțat la nivelul nativ

În timpul gap-ului, fundalul implicit Android e negru → de asta apare exact „ecran negru” în loc de fundalul aplicației (`#0f1219`).

### Plan de remediere

**Pas 1: Instalez `@capacitor/splash-screen`** și configurez în `capacitor.config.ts`:
- `launchAutoHide: false` → splash-ul nativ rămâne afișat până îl ascundem manual
- `backgroundColor: "#0f1219"` → background match cu app
- `showSpinner: true`, culoare spinner brand
- `launchShowDuration: 3000` ca fallback de siguranță (în caz că JS nu pornește)

**Pas 2: Ascund splash-ul nativ din JS la momentul corect** în `App.tsx`:
- După ce React s-a montat și `AuthProvider` a încărcat sesiunea inițială (sau cel mai târziu după ce splash-ul React intră în scenă), apelez `SplashScreen.hide()`.
- Asta elimină complet gap-ul WebView-negru.

**Pas 3: Setez fundal corect în temele Android** ca defensivă:
- În `styles.xml`, schimb `android:background` în `AppTheme.NoActionBar` din `@null` într-o culoare solidă `#0f1219` (folosită deja ca theme-color)
- Adaug `android:windowBackground` pe `AppTheme.NoActionBarLaunch` pentru a evita orice flash negru între splash și activitate

**Pas 4: Drawable-ul splash existent**
- Verific `android/app/src/main/res/drawable/splash.xml` și mă asigur că background-ul lui e `#0f1219` (nu alb sau transparent).

**Pas 5: Bump versiune la 1.72**
- `versionCode = 72`, `versionName = "1.72"` în `android/app/build.gradle` ca să poți testa pe un build nou.

### Tehnic — fișiere modificate

- `package.json` — adaug `@capacitor/splash-screen`
- `capacitor.config.ts` — config plugin SplashScreen
- `src/App.tsx` — apel `SplashScreen.hide()` din `useEffect` după mount
- `android/app/src/main/res/values/styles.xml` — fundal solid în teme
- `android/app/src/main/res/drawable/splash.xml` — verific/setez background
- `android/app/build.gradle` — bump versiune 1.72

### Ce trebuie să faci tu după

După ce aplic schimbările:
1. Pull din Git
2. `npm install` (pentru pluginul nou)
3. `npx cap sync android`
4. Build AAB nou și încarcă în Play Console pentru test

Ar trebui să rezolve ecranul negru atât la primă instalare, cât și după update. Splash-ul nativ va rămâne vizibil până React e efectiv pe ecran, fără gap.

Confirmă să implementez.