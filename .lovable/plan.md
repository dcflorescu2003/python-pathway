# Profesorii ies din clasamente

Conturile de profesor (toate, verificate sau nu) nu mai apar în niciun clasament și nu mai sunt luate în calcul la locuri. Profesorul vede clasamentul normal, plus un card propriu cu XP-ul lui, marcat clar că nu intră în competiție.

## Ce se schimbă

- Clasamentele Clasă / Liceu / Oraș / Național afișează doar conturi de elev.
- Locurile se recalculează fără profesori (dacă un profesor era pe locul 3, elevii de sub el urcă).
- Pentru un cont de profesor: în locul rândului „Tu" cu loc, apare un card separat cu avatarul de nivel, XP-ul și streak-ul lui și textul „Nu intri în clasament (cont de profesor)".
- Pentru elevi nu se schimbă nimic: își văd locul ca acum, inclusiv sub primii 15.

## Detalii tehnice

Fișier: `src/pages/LeaderboardPage.tsx` (nu e nevoie de migrare — view-ul `public_profiles` expune deja `is_teacher`).

1. Toate cele trei interogări pe `public_profiles` (top 15, profilul propriu, numărătoarea pentru rank) primesc filtrul `.eq("is_teacher", false)`; filtrul de excludere se aplică înainte de `limit(15)`, ca lista să rămână completă.
2. `LeaderboardEntry` primește câmpul `is_teacher`.
3. Query-ul de rank: profilul propriu se citește fără filtru (ca profesorul să-și vadă XP-ul), dar dacă `is_teacher` e true nu se mai calculează `rank` — se returnează doar profilul, iar UI-ul randează cardul informativ în locul rândului cu poziție.
4. Se refolosesc stilurile existente ale rândului (border primary, imagine de tier) pentru cardul de profesor, fără culori hardcodate.
