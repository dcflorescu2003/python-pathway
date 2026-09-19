# Profesorul vede dacă elevul a apăsat „Vezi rezolvarea”

## Ce se schimbă pentru profesor

La o problemă atribuită ca temă, în lista cu elevi apare, lângă scor, un marcaj clar:
„A văzut rezolvarea” (cu dată), pentru elevii care au deschis rezolvarea gata făcută.
Elevii care au rezolvat singuri rămân afișați ca până acum.

Numărătoarea de sus a provocării rămâne neschimbată (câți au completat), dar se adaugă
și un contor scurt: câți dintre ei au apelat la rezolvare.

## Ce se schimbă pentru elev

Nimic vizibil: butonul „Vezi rezolvarea” funcționează exact ca acum, la fel și XP-ul
de 1 punct acordat prima dată. Se reține doar momentul în care a fost apăsat.

## Situația actuală

Momentul apăsării butonului nu este salvat nicăieri: apelul trimis la server marchează
problema ca finalizată cu scor 0 și acordă 1 XP, dar nu lasă nicio urmă distinctă.
De aceea profesorul vede acum doar „Best: 0%”, fără să știe dacă elevul a cerut rezolvarea.

## Detalii tehnice

1. Migrare: adaugă `public.completed_lessons.solution_revealed_at timestamptz` (nullable).
2. Actualizează `public.award_progress`: când `p_via_solution` este true, setează
   `solution_revealed_at = coalesce(solution_revealed_at, now())` la insert și la
   `ON CONFLICT DO UPDATE`. Restul logicii (XP, scor maxim, streak, stale client) rămâne identică.
3. `src/components/teacher/ClassDetail.tsx`: include `solution_revealed_at` în select-ul
   din `completed_lessons`, propagă-l prin `getStudentStatus` și afișează badge-ul
   „A văzut rezolvarea” + contorul pe cardul provocării.
4. Fără modificări de RLS — profesorii citesc deja aceste rânduri.

## Limitări

Reveal-urile de dinainte de această modificare nu pot fi recuperate (nu au fost salvate),
deci marcajul apare doar pentru apăsările de după implementare.
