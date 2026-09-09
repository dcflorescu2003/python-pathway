# Creșterea procentului de cod ofuscat în Play Console fără risc pentru utilizatori

## Context

Utilizatorul tocmai a lansat aplicația și vrea să crească procentul de cod ofuscat raportat de Play Console peste 25%, dar fără să riște stabilitatea aplicației pentru utilizatorii activi.

## Concluzie preliminară

În Android Gradle Plugin 9 (stack-ul curent), **R8 este singurul tool care ofuscarează codul**. Nu există o alternativă reală la R8 pentru a crește procentul de cod ofuscat din Play Console. Fără R8, procentul rămâne 0%.

R8 este deja activat în `android/app/build.gradle` (`minifyEnabled true`, `shrinkResources true`) și există un set de keep rules în `android/app/proguard-rules.pro` care protejează plugin-urile Capacitor, Firebase, AdMob, Google Play Billing și social login.

## Plan propus: activare treptată, cu testare înainte de production

### 1. Validare pe build de test, nu pe production

- Se generează un **AAB release** cu R8 activat.
- Se urcă într-un canal intern sau closed testing, NU în production.
- Se testează manual pe cel puțin 2-3 dispozitive reale sau emulatoare.

### 2. Scenarii obligatorii de testat înainte de promovare

- Login și înregistrare (email, Google, Apple pe iOS nu este afectat de R8 Android).
- Plăți / abonamente (Google Play Billing, `playBilling.ts`, `CdvPurchase`).
- Reclame rewarded AdMob.
- Notificări push (Firebase).
- Deschidere lecții, rezolvare probleme, salvare progres în cloud.
- Deep links / verificare domeniu.
- Profesor: creare clasă, test, înscriere elevi.

### 3. Backup și rollback

- Se păstrează AAB-ul anterior fără R8 (sau cu R8 dezactivat) într-un loc sigur.
- Dacă apar crash-uri sau funcționalități compromise, se reface release-ul cu `minifyEnabled false` și `shrinkResources false`.
- Se poate reveni oricând la o versiune anterioară din Play Console (app bundle explorer → promote previous release).

### 4. Dacă testul trece

- Se promovează AAB-ul cu R8 în production.
- Se monitorizează crash-urile și ANR-urile în Play Console timp de 24-48h.
- Se verifică procentul de ofuscare după ce Google procesează noul build (poate dura câteva zile).

## Variante alternative (nu înlocuiesc R8)

- **Reducerea suprafeței de cod neofuscat**: se pot elimina dependințe nefolosite, dar impactul asupra procentului este mic.
- **Code splitting / lazy loading în web**: ajută performanța web, nu procentul de ofuscare Android.
- **Ajustarea keep rules**: se pot face regulile mai permisive pentru a ofusca mai mult, dar asta crește riscul de runtime crash.

## Decizie necesară

Vrei să mergem mai departe cu generarea unui AAB de test cu R8 activat și testarea pe canal intern/closed testing, sau preferi să amânăm până la următorul release planificat?

Amanam pentru 4 octombrie

&nbsp;