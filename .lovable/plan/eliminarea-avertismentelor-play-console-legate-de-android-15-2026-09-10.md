# Eliminarea avertismentelor Play Console legate de Android 15 (edge-to-edge)

## Ce spun cele 2 mesaje

Ambele sunt **avertismente, nu erori** — nu blochează publicarea și nu afectează utilizatorii actuali:

1. **„Formatul fără margini"** — Google recomandă testarea pe Android 15 pentru că aplicația țintește SDK 35+. Aplicația noastră **este deja pregătită**: `MainActivity.java` activează corect edge-to-edge și injectează marginile de siguranță în interfață. Acest mesaj apare oricum automat.
2. **„API-uri învechite"** — API-urile semnalate (`setStatusBarColor`, `setNavigationBarColor` etc.) **nu sunt în codul nostru**, ci în două biblioteci Google incluse de plugin-uri:
   - `androidbrowserhelper:2.5.0` — adus de pluginul de login Google (`@capgo/capacitor-social-login`, folosit la fallback-ul de autentificare în WebView)
   - `play-services-ads` — intern în SDK-ul AdMob (plugin `@capacitor-community/admob 8.0.0`)

## Soluția: actualizarea bibliotecilor

### 1. Actualizare plugin AdMob
- `@capacitor-community/admob`: 8.0.0 → **8.1.0** (aduce versiuni mai noi de `play-services-ads`, unde Google a eliminat o parte din API-urile învechite)

### 2. Actualizare plugin Social Login
- `@capgo/capacitor-social-login`: 8.3.9 → **8.5.7** (ultima versiune compatibilă Capacitor 8)

### 3. Forțare androidbrowserhelper la versiunea nouă
- În `android/build.gradle`, adăugăm o regulă Gradle (`resolutionStrategy`) care forțează `com.google.androidbrowserhelper:androidbrowserhelper` de la 2.5.0 la **2.7.3** (ultima versiune, cu API-urile învechite eliminate)

### Ce NU schimbăm
- Nicio modificare de cod în aplicație, la login, reclame sau plăți
- `MainActivity.java` rămâne neschimbat (este deja conform Android 15)

## Notă de așteptări realiste
Este posibil ca după actualizare să rămână 1-2 mențiuni legate de SDK-ul AdMob intern (Google le rezolvă treptat, de la versiune la versiune). Avertismentele sunt **recomandări**, nu blocaje — aplicația poate fi publicată indiferent. Avertismentul 1 (edge-to-edge) nu dispare din consolă, pentru că e o recomandare generică de testare.

## Pași pentru tine (după implementare)
1. `git pull` pe calculatorul tău
2. `npm install`
3. `npx cap sync android`
4. Build nou de release (AAB) — versiunea este deja 1.121 / 121
5. **Testează pe canal intern** înainte de production: login Google, reclame rewarded (vieți), achiziții
6. Publică în production doar după ce totul funcționează
