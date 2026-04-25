
## Problema 1 — Titluri „ciudate" în rapoarte (ex: `c1-l1f`, `ch1-l1776...`)

### Cauză
În `ClassAnalytics.tsx → weakestLessons`, când nu găsește lecția în lista de capitole, afișează direct `lesson_id`. Două surse de ID-uri „crude":
- `c1-l1f`, `c1-l3f` etc. → lecții de **„Fixare"** auto-generate din `courses.ts` (sufix `f`). Sunt prezente doar în fallback-ul static, nu și în DB încărcat de `useChapters`, deci lookup-ul eșuează.
- `ch1-l1776...` → lecții **manuale/publice** create de admin, ținute într-un alt store (`useManualLessons`), nu în `chapters`.

### Soluție
1. În `useChapters.ts`: aplică aceeași transformare „Fixare" pe rezultatul din DB (refolosește `addFixareLessons` din `courses.ts` exportându-l), astfel încât lecțiile `*f` să fie cunoscute peste tot în app.
2. În `ClassAnalytics.tsx → weakestLessons`:
   - Încarcă în paralel `manual_lessons` (titlu) și mapează `ch1-l...` → titlu lecție manuală.
   - Dacă tot nu găsim, afișează un fallback uman: numele capitolului + „(lecție arhivată)" în loc de ID brut.
3. Aplică același helper de „rezolvare titlu lecție" și în:
   - `PersonalizedSummary.tsx` (sumar elev)
   - oricare alt loc care iterează `completed_lessons` și afișează ID-uri (verific la implementare).

## Problema 2 — Toate competențele apar neevaluate pe profilul curent

### Diagnostic
- `item_competencies` are **1512 maparări** — ok.
- `student_competency_scores` are **0 rânduri** pentru toți utilizatorii, deși sunt 73 lecții finalizate în ultimele 2h.
- `recordCompetencyScores` e apelat în `LessonPage.tsx`, dar pentru acest cont specific nu s-a finalizat nicio lecție de când integrarea a fost adăugată (sau există o tăcere de eroare).

Două probleme reale identificate:
1. **Niciun backfill**: lecțiile finalizate înainte de integrare nu sunt punctate niciodată → utilizatorii activi văd „neevaluat" peste tot.
2. **Tracking lipsă pentru anumite căi**:
   - Lecțiile de „Fixare" (`*f`) au ID-uri de exerciții cu sufix `f` (ex: `c1-l1-e1f`) generate în `transformExercise` — nu există maparări `item_competencies` pentru ele, deci nu produc scor.
   - `ManualLessonPage` (lecții publice) nu apelează deloc `recordCompetencyScores`.

### Soluție
1. **RPC de backfill** `backfill_competency_scores(p_user_id uuid)`:
   - Iterează `completed_lessons` ale userului → pentru fiecare lecție recuperează exercițiile și calculează `score = round((cl.score/100) * total_exercises)`, `max = total_exercises`, apoi cheamă logica internă de `recalculate` cu `item_type='exercise'`.
   - Iterează `problem_attempts` (sau echivalent) → punctaj proporțional pe `item_type='problem'`.
   - Iterează `test_submissions` finalizate → `test_item` / `predefined_test_item`.
   - Securizat: doar pentru `auth.uid() = p_user_id` sau admin.
2. **Trigger automat la login / la deschiderea profilului de competențe**:
   - În `CompetencyProfileCard`, dacă `student_competency_scores` e gol pentru user dar `completed_lessons` nu e → apelează backfill o singură dată (flag în `localStorage`: `competency-backfill-v1-<userId>`).
3. **Mapare ID-uri „Fixare" → exercițiu părinte**:
   - În `competencyTracking.ts`: dacă `item_id` se termină cu `f`, trimite și varianta fără `f` ca fallback (sau curățăm sufixul înainte de RPC). Astfel maparările existente acoperă și sesiunile de fixare.
4. **`ManualLessonPage`**: adaugă același pattern de tracking ca `LessonPage` cu `item_type='manual_exercise'`.

## Files to change

- `supabase/migrations/...` — nou RPC `backfill_competency_scores`
- `src/data/courses.ts` — exportă `addFixareLessons`
- `src/hooks/useChapters.ts` — aplică `addFixareLessons` și pe datele din DB
- `src/components/teacher/ClassAnalytics.tsx` — rezolvă titluri lecții (manual + fixare + fallback uman)
- `src/components/PersonalizedSummary.tsx` — același helper de titluri
- `src/lib/competencyTracking.ts` — normalizează sufix `f` pe `item_id`
- `src/components/account/CompetencyProfileCard.tsx` — declanșează backfill la primul deschis
- `src/pages/ManualLessonPage.tsx` — integrează `recordCompetencyScores`

## Notă pentru utilizator
Sufixul `f` vine de la lecțiile auto-generate de „Fixare" (recapitulare după fiecare lecție) — sunt reale, doar că titlurile nu erau rezolvate în rapoarte. După fix vei vedea „Fixare: <titlu lecție>" în loc de `c1-l1f`.
