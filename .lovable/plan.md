# Optimizare aplicație pentru Google Play

Google Play raportează "Optimizarea aplicației: Scăzută" și "Procentul de obscurizare: 1%" pentru că build-ul Android livrează codul neminificat: în `android/app/build.gradle`, blocul `release` are `minifyEnabled false`, iar `proguard-rules.pro` nu conține nicio regulă (doar comentarii). Fără R8, codul nu e nici micșorat, nici obfuscat.

## Ce schimbăm

1. **Activăm R8 pe build-ul de release**
   - `minifyEnabled true` și `shrinkResources true` în `buildTypes.release`.
   - Păstrăm `proguard-android-optimize.txt` ca bază.

2. **Adăugăm reguli keep în `proguard-rules.pro`** ca aplicația să nu se strice după obfuscare:
   - Capacitor: clasele de plugin și metodele adnotate `@CapacitorPlugin` / `@PluginMethod` (reflecție la runtime).
   - Cordova (`cordova-plugin-purchase`) și interfețele JavaScript expuse către WebView (`@JavascriptInterface`).
   - Google Play Billing (`com.android.billingclient`).
   - AdMob / Google Mobile Ads și Firebase Messaging.
   - Sign in with Apple / Google Social Login plugin.
   - Păstrăm adnotări, semnături generice și `SourceFile,LineNumberTable` + `-renamesourcefileattribute` ca stack-trace-urile din Play Console să rămână citibile.

3. **Simboluri de debug native** — activăm `ndk { debugSymbolLevel 'FULL' }` (sau `androidResources`/`bundle` echivalent) ca Play să poată dezofusca crash-urile native.

4. **Verificare** — reamintim pașii: `git pull`, `npm install`, `npm run build`, `npx cap sync android`, apoi un build de release local și testare pe device pentru: login Google/Apple, cumpărare abonament (Play Billing), reclame recompensate, notificări push, Pyodide.

## Riscuri

R8 poate rupe funcționalități bazate pe reflecție dacă lipsesc reguli keep. De aceea regulile de mai sus sunt incluse din start, iar testarea pe un build de release (nu debug) înainte de publicare este obligatorie — mai ales fluxurile de plată și autentificare.

## Note tehnice

- Fișiere modificate: `android/app/build.gradle`, `android/app/proguard-rules.pro`.
- Nicio modificare în codul web sau în backend.
- `versionCode`/`versionName` rămân neschimbate; bump-ul se face separat înainte de upload.
