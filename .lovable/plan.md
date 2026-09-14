# Testare build cu Pasul 1 + Pasul 2 împreună

Recomandare: un singur build de release care conține ambii pași. Modificările sunt independente și cu risc aproape zero; în caz de problemă, rollback-ul din History se face per-modificare, deci nu e nevoie de builduri separate pentru izolare.

## De ce împreună e sigur

- Pasul 1 (baseline profile) afectează doar viteza de pornire pe Android; dacă profilul e ignorat, aplicația rulează exact ca înainte.
- Pasul 2 (web: preîncărcare fonturi, grafice și PDF pe pachete separate) afectează doar modul de încărcare, nu logica.
- Pachetele lazy (grafice, PDF) sunt singurul punct cu risc mic — un import care nu se încarcă corect. Se verifică explicit mai jos.

## Pași

1. Pe calculator: `git pull`, `npm install`, `npx cap sync android`, build AAB de release.
2. Verificare rapidă a AAB: `assets/dexopt/baseline.prof` prezent în arhivă.
3. Instalare pe canal intern (internal / closed testing).

## Lista de test pe Android (în ordinea riscului)

- Pornirea aplicației — trebuie să arate identic funcțional (doar mai rapid, ideal).
- Login Google / Apple.
- O lecție completă: exerciții, viață consumată, XP, progres salvat.
- Graficele de clasă (analytics profesor) — pachet nou încărcat separat.
- Exportul PDF al unui raport — pachet nou încărcat separat.
- Reclame rewarded pentru vieți (AdMob).
- Achiziție Premium de test (sau verificarea dialogului de prețuri 17,99 RON pe Android).
- Notificări push, deep link din site (pyroskill.info).

## Lista de test pe web (pyroskill.info)

- Prima încărcare a paginii publice (fonturi pornesc mai devreme).
- Grafice și export PDF funcționează la prima utilizare.

## Dacă ceva nu merge

- Identificăm pasul afectat (profil de pornire vs. pachet web) după simptom.
- Rollback per-modificare din History sau butonul de revert de sub mesaj — fără editare manuală.
- R8 rămâne neatins și programat pe 4 octombrie.

## Ce NU se face acum

- Nicio modificare de cod — doar build, testare și eventual rollback.
- Nu se atinge `MainActivity.java`, regulile R8 / `proguard-rules.pro`, versiunea aplicației (1.122 deja pregătită).
