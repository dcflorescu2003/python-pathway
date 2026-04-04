

# Adaptare edge-to-edge pentru Android 15

## Context
Android 15 forțează modul edge-to-edge: status bar-ul și navigation bar-ul devin transparente, iar conținutul se desenează în spatele lor. Aplicația ta (Capacitor WebView) trebuie să gestioneze corect „safe area insets" — altfel elemente UI vor fi acoperite de barele de sistem.

## Ce avem deja bine
- `viewport-fit=cover` în `index.html` — activează expunerea insets-urilor CSS
- `env(safe-area-inset-top)` și `env(safe-area-inset-bottom)` folosite în header-uri sticky și BottomNav
- Splash screen cu `core-splashscreen:1.2.0` (versiunea corectă pentru Android 15)

## Ce trebuie îmbunătățit

### 1. Stiluri Android native — status bar și navigation bar transparente
**Fișier:** `android/app/src/main/res/values/styles.xml`

Adăugăm atribute la tema `AppTheme.NoActionBar` pentru a activa corect edge-to-edge:
- `android:windowDrawsSystemBarBackgrounds = true`
- `android:statusBarColor = @android:color/transparent`
- `android:navigationBarColor = @android:color/transparent`
- `android:windowLayoutInDisplayCutoutMode = always` (necesită values-v28)

Creăm `res/values-v28/styles.xml` pentru `layoutInDisplayCutoutMode`.

### 2. MainActivity — activare edge-to-edge programatic
**Fișier:** `android/app/src/main/java/ro/pythonpathway/app/MainActivity.java`

În `onCreate()`, apelăm `WindowCompat.setDecorFitsSystemWindows(getWindow(), false)` și setăm barele de sistem transparente prin `WindowInsetsControllerCompat`. Aceasta asigură compatibilitate completă cu Android 15.

### 3. CSS — protejare conținut în spatele navigation bar
**Fișier:** `src/index.css`

- Adăugăm `padding-top: env(safe-area-inset-top)` pe `body` sau pe wrapper-ul principal
- BottomNav folosește deja `pb-[env(safe-area-inset-bottom)]` — este corect

### 4. LessonPage — safe area pe header-ul cu progress bar
**Fișier:** `src/pages/LessonPage.tsx`

Header-ul din LessonPage (cu buton X, inimi, progress bar) nu are safe-area-inset-top. Adăugăm `pt-[env(safe-area-inset-top)]` ca pe celelalte pagini.

### 5. LeaderboardPage — safe area pe header
**Fișier:** `src/pages/LeaderboardPage.tsx`

Similar, verificăm și adăugăm safe-area-inset pe header dacă lipsește.

### 6. Index.tsx — safe area pe header
**Fișier:** `src/pages/Index.tsx`

Header-ul paginii principale trebuie să aibă aceeași protecție safe-area.

## Fișiere modificate
1. `android/app/src/main/res/values/styles.xml` — atribute transparență bare
2. `android/app/src/main/res/values-v28/styles.xml` — nou, cutout mode
3. `android/app/src/main/java/ro/pythonpathway/app/MainActivity.java` — edge-to-edge programatic
4. `src/pages/LessonPage.tsx` — safe-area pe header
5. `src/pages/LeaderboardPage.tsx` — safe-area pe header
6. `src/pages/Index.tsx` — safe-area pe header (dacă lipsește)

