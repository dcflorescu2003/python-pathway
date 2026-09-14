# Pasul 1: Baseline Profile pentru pornire mai rapidă pe Android

Scop: aplicația să pornească mai repede de la prima deschidere (Google estimează ~20-30%), fără nicio schimbare de comportament. Dacă profilul lipsește sau e ignorat, aplicația rulează exact ca acum.

## Ce se face

### A. Profil scris manual (varianta cu risc zero, nu cere dispozitiv)

Se adaugă un fișier text cu regulile de pornire pentru clasele critice: Capacitor (`BridgeActivity`, bridge, WebView), `MainActivity`, splash screen și AndroidX core. Android Gradle Plugin îl compilează automat în AAB, fără să fie nevoie de rulări pe telefon.

- fișier nou: `android/app/src/main/baseline-prof.txt`
- reguli conservative, doar clase care sigur se încarcă la pornire
- dacă o regulă nu se potrivește, e ignorată silențios — nu poate rupe buildul sau aplicația

### B. Modul de generare automată (opțional, mai târziu)

Varianta „oficială” cu modul `:baselineprofile` și teste macrobenchmark cere rulare pe emulator/telefon fizic pe calculatorul tău și un build separat. O propun ca pas ulterior, doar dacă vrei profil măsurat real. Nu o includ acum, ca să nu adăugăm complexitate la build.

### C. Verificare

- `npx cap sync android`, apoi build AAB de release
- confirmare că `assets/dexopt/baseline.prof` există în AAB
- pornirea aplicației trebuie să arate identic funcțional

## Pasul 2 (după validarea Pasului 1)

Optimizări web, toate cu risc zero funcțional:

1. Preîncărcarea fontului principal și a imaginii mari din pagina publică de prezentare (câștig de viteză la prima încărcare).
2. Împărțirea pe pachete separate a librăriilor grele (export PDF, grafice), ca să nu se descarce la pornire, ci doar când sunt folosite.

Nu se atinge nicio logică de aplicație: vieți, XP, Premium, teste, clasamente rămân neschimbate.

## Ce NU se atinge

- `MainActivity.java` și configurația edge-to-edge
- regulile R8 / `proguard-rules.pro` (testarea R8 rămâne pe 4 octombrie)
- versiunea aplicației (bump separat, când faci buildul)
