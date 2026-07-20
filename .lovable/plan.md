## Ce vrei

1. Când un profesor distribuie un test unei clase, testul să apară și pe pagina principală (Home) a elevului — nu doar în tab-ul „Cont", ca să-l poată începe cu un tap.
2. Timpul rămas să fie afișat pe card, calculat din momentul distribuirii.

## Ce este deja în cod

- `test_assignments` are `assigned_at` + `window_minutes` (fereastra de disponibilitate).
- `TakeTestPage` deja calculează deadline-ul ferestrei ca `assigned_at + window_minutes` (linia 132–133), deci partea de "timp de când a fost distribuit" există deja în backend/logică.
- Există hook-ul `useStudentAssignments()` în `src/hooks/useTests.ts` care întoarce assignments active + submission-ul elevului (join pe `tests` + `teacher_classes`).
- Pe Home (`src/pages/Index.tsx`) nu se afișează nimic legat de testele profesorului.
- În `StudentTab` (Cont) testele apar deja într-o listă simplă.

## Ce construiesc

### 1. Card „Teste de la profesor" pe Home

Component nou `src/components/home/TeacherTestsCard.tsx`:
- Folosește `useStudentAssignments()`.
- Filtrează:
  - fereastra activă (`window_minutes` null SAU `assigned_at + window_minutes > now`),
  - fără submission trimis (`submission.submitted_at` null) — dar afișează și cele „în progres" (draft) cu buton „Continuă".
- Sortare: cele care expiră cel mai curând primele, apoi cele fără deadline după `assigned_at desc`.
- Limitat la max 3 carduri vizibile; dacă sunt mai multe, buton „Vezi toate" care duce la `/auth?tab=student` (tab-ul Cont).
- Fiecare card afișează: titlu test, numele clasei, timp rămas din fereastră (countdown live la fiecare 30s, formatat „2h 15m rămase" / „12 min rămase" / „expiră curând"), badge dacă e „în progres", buton `Începe testul` / `Continuă` care navighează la `/test/{assignmentId}`.
- Dacă nu există assignments active, cardul nu se randează (nu ocupă spațiu).

Culori/stilistică: reutilizez tokens (`bg-card`, `text-primary`, badge `bg-warning/10 text-warning` pentru <30 min). Fără culori hardcodate.

### 2. Integrare în Home

În `src/pages/Index.tsx`, plasez `<TeacherTestsCard />` imediat sub header (după banner-uri de notificări/premium, înainte de „Continuă capitolul"). Aparține doar dacă elevul e membru într-o clasă (hook-ul returnează gol altfel — nu se randează).

### 3. Timp rămas — deja corect

Deadline-ul se calculează din `assigned_at + window_minutes`, deci timpul „curge" de când profesorul a distribuit testul. Nu modific logica din `TakeTestPage`. Cardul de pe Home folosește aceeași formulă.

## Ce NU fac

- Nu modific `TestManager` (partea profesorului).
- Nu schimb schema DB.
- Nu ating logica de scoring/grading.
- Nu adaug notificări push suplimentare (există deja pentru distribuire).

## Detalii tehnice

- Countdown: `useEffect` cu `setInterval(30_000)` care setează un `now` local; format ajutător `formatTimeLeft(ms)` (h+m, apoi doar m sub 1h).
- Cache invalidation: `useStudentAssignments` folosește deja query key `["student-test-assignments", user?.id]`, se actualizează prin submit/unsubmit existent.
- Fără date noi de fetch — reutilizez hook-ul existent.
