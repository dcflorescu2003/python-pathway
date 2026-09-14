# Analiză optimizări cu risc ~0 pentru PyRo (fără implementare acum)

Recomandările Google pentru optimizarea aplicației se împart în trei zone: R8 (micșorare + ofuscare), profilurile de pornire (Baseline / Startup Profiles) și micșorarea resurselor. Mai jos ce se aplică la PyRo, ordonat după risc.

## Stare actuală verificată

- `android/app/build.gradle`: `minifyEnabled true`, `shrinkResources true`, `proguard-android-optimize.txt` + reguli proprii (testarea R8 este amânată la 4 octombrie).
- `android/gradle.properties`: `android.r8.optimizedResourceShrinking=false`, `android.r8.strictFullModeForKeepRules=false`, `org.gradle.parallel` comentat.
- `android/variables.gradle`: minSdk 24, compileSdk/targetSdk 36 (deja la zi).
- Manifest: fără `android:extractNativeLibs`/atribute problematice; deep links verificate; AdMob configurat.
- Web: paginile sunt deja încărcate „lazy”, PWA activ, Pyodide încărcat la cerere.

## Risc zero (doar build, zero cod al aplicației)

1. **Baseline Profile pentru Android** — cel mai bun raport câștig/risc: pornire mai rapidă cu ~20-30% de la prima deschidere, fără nicio schimbare de comportament. Se adaugă un modul separat de generare a profilului; dacă profilul lipsește sau e greșit, aplicația funcționează identic, doar fără accelerare.
2. **Startup Profile** — extensie a punctului 1: reordonează clasele din DEX pentru pornire. Aceleași riscuri (niciunul funcțional).
3. **Optimized resource shrinking** (`android.r8.optimizedResourceShrinking=true`) — reduce APK-ul suplimentar. Risc mic-zero, dar depinde de R8, deci se testează împreună cu R8 pe 4 octombrie.
4. **Gradle parallel + caching** — doar viteza build-ului local, zero impact pentru utilizatori.

## Risc mic, dar necesită testare pe canal intern

5. **R8 în modul complet strict pentru keep rules** — poate ofusca mai mult, dar poate rupe plugin-uri încărcate prin reflexie (Capacitor, Billing, AdMob). Se face doar după ce R8 „normal” este validat.
6. **Curățarea regulilor de keep prea largi** (`-keep class ro.pythonpathway.** { *; }`) — crește procentul de ofuscare din Play Console, dar cere testare atentă a punții native.
7. **Splitarea App Bundle pe limbă/densitate** — deja implicită la AAB; nu e nevoie de nimic.

## Optimizări web/PWA cu risc zero (independente de Android)

8. **Preîncărcarea fonturilor și a imaginii principale** din pagina de prezentare — câștig de LCP fără riscuri.
9. **Conversia imaginilor mari din `src/assets` în WebP/AVIF la build** — reduce traficul, nu schimbă nimic funcțional.
10. **Împărțirea pe „chunk-uri” a librăriilor grele** (editor de cod, PDF, grafice) — se încarcă doar când sunt folosite; risc mic, ușor de verificat în preview.

## Ce NU recomand acum

- Activarea R8 în producție înainte de 4 octombrie (decizie deja luată).
- Modificarea `MainActivity.java` sau a configurației edge-to-edge — funcționează corect.
- Upgrade de SDK-uri Google doar pentru avertismentele din Play Console — sunt recomandări, nu blocaje.

## Propunere de ordine

Pas 1: Baseline + Startup Profile (câștig real, risc zero) — se poate pregăti oricând.
Pas 2: optimizările web (preload, imagini, chunk-uri).
Pas 3: pe 4 octombrie, testarea R8 + optimized resource shrinking pe canal intern.
Pas 4: abia apoi reguli de keep mai agresive pentru procentul de ofuscare.
