# Optimizare Play Store — amânată pentru 15-20 octombrie

Google Play raportează "Optimizarea aplicației: Scăzută" pentru că în `android/app/build.gradle`, blocul `release` are `minifyEnabled false`, deci R8 nu rulează deloc (de aici și obscurizarea de 1%).

Activarea completă a R8 ar da scorul maxim, dar poate rupe pluginuri care folosesc reflecție (Play Billing, AdMob, Social Login, Cordova Purchase). Planul de mai jos evită complet acest risc: nu atinge codul aplicației, doar metadatele de build.

## Ce facem (zero risc funcțional)

1. **Simboluri native de debug complete**
   În `android/app/build.gradle`, în `defaultConfig`, adăugăm:
   ```
   ndk { debugSymbolLevel 'FULL' }
   ```
   Efect: Play Console primește simbolurile pentru bibliotecile native și poate dezofusca crash-urile (Android Vitals devine util). Nu schimbă nimic din cod, doar ce se încarcă alături de AAB.

2. **Reguli ProGuard pregătite din timp, fără a activa R8**
   Completăm `android/app/proguard-rules.pro` cu regulile keep pentru Capacitor, Cordova Purchase, Play Billing, AdMob, Firebase Messaging și Social Login, plus păstrarea `SourceFile,LineNumberTable`.
   Cât timp `minifyEnabled` rămâne `false`, aceste reguli sunt inerte — nu produc niciun efect asupra build-ului actual. Sunt doar pregătite pentru momentul în care vei vrea să activezi R8 și să testezi pe un build de release.

3. **Confirmăm formatul de livrare**
   Verificăm că build-ul de release iese ca **Android App Bundle (AAB)**, nu APK — Play generează atunci pachete per-device (splits pe ABI, densitate, limbă), ceea ce reduce dimensiunea descărcată fără nicio schimbare de cod.

## Ce NU facem acum

- Nu activăm `minifyEnabled` / `shrinkResources`.
- Nu obfuscăm codul (procentul de obscurizare va rămâne mic — asta e acceptat).
- Nu modificăm nimic în codul web, în backend sau în pluginuri.

## Pas următor opțional (când ai timp de testat)

Când vrei scorul complet, activăm `minifyEnabled true` + `shrinkResources true` (regulile keep sunt deja scrise) și testăm pe un build de release: login Google/Apple, abonamente Play Billing, reclame recompensate, notificări push, Pyodide.

## Note tehnice

- Fișiere modificate: `android/app/build.gradle` (o linie `ndk`), `android/app/proguard-rules.pro` (reguli inerte).
- După merge: `git pull`, `npm install`, `npm run build`, `npx cap sync android`, apoi build AAB.
- `versionCode`/`versionName` rămân neschimbate; bump separat înainte de upload.
