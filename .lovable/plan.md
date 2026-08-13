# Verificare: XP-ul rămâne corect și pe mobil

## Răspuns scurt
Nu ar trebui să se mai umfle. XP-ul este acum decis exclusiv pe server, iar corecția a fost făcută în cloud (17.600 XP, 576 itemi completați, toți cu scor 100).

De ce mobilul nu mai poate strica valoarea:
- Aplicația nu mai scrie niciodată XP direct în profil; singura cale este funcția de pe server, protejată prin trigger.
- Reluările nu mai dau XP decât dacă scorul chiar crește. Toate cele 576 de intrări au deja scor 100, deci o resincronizare a istoricului dă 0 XP.
- La unificarea datelor telefon/cloud, XP-ul, streak-ul și viețile se iau din cloud (nu se mai păstrează valoarea locală mai mare), deci snapshot-ul vechi de 33.218 de pe telefon va fi înlocuit, nu adoptat.

## Singurul risc rămas
Telefonul are o versiune veche instalată, cu snapshot local de 33.218 XP. Dacă acea versiune a fost compilată înainte de corecțiile de merge, poate afișa temporar valoarea locală până la prima citire din cloud.

## Pași de verificare (după aprobare)
1. Pe telefon: deschide aplicația, intră în Cont și apasă „Resincronizează progresul din cloud”, apoi verifică afișarea 17.600 XP.
2. Dacă tot apare 33.218: delogare + logare (delogarea șterge datele locale) și verificare din nou.
3. Verific în baza de date, după sesiunea de pe telefon, că XP-ul a rămas 17.600 și numărul de itemi 576.
4. Dacă se constată o creștere, identific apelul care a produs-o din jurnalele funcției și blochez cazul rămas.

## Note tehnice
- Sursa autoritară: `profiles.xp` actualizat doar din `award_progress` / `record_activity`.
- `award_progress`: XP la redo doar dacă `scor_nou > scor_anterior`.
- `mergeProgress` în `src/hooks/useProgress.ts`: `xp`, `streak`, `lives` sunt luate din cloud.
- Recomandat un build nou (bump de versiune) pentru ca telefonul să ruleze codul cu merge-ul corectat.
