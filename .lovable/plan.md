## Problema

Când profesorul importă un test predefinit în TestBuilder:

1. **Preview-ul nu afișează nimic** — `getExerciseDetails`/`getProblemDetails` caută doar în `chapters`/`allProblems` locale, dar itemii din testul predefinit au `source_id` de tip `eval-...` (din `eval_exercises`), care nu există acolo.
2. **Problemele nu sunt marcate ca AI-gradable** — `applyPredefinedTemplate` convertește toți itemii `eval_exercise` în `source_type: "exercise"`, deci o problemă reală (din eval_exercises cu `type='problem'`) ajunge cu `source_type='exercise'` și nu intră în `aiItemCount` (care numără doar `source_type==='problem'` sau `custom.type==='open_answer'`).
3. **Edge function-ul `grade-submission`** caută în tabelul `problems`/`exercises` după `source_id`, deci itemii cu prefix `eval-` nu sunt găsiți și nu primesc evaluare AI.

`TakeTestPage` are deja logica care detectează prefixul `eval-` și interoghează `eval_exercises` (rezolvat anterior), dar TestBuilder + grade-submission nu.

## Soluție

### 1. `src/components/teacher/TestBuilder.tsx`

- În `applyPredefinedTemplate`: înainte de a construi `newItems`, fetch în bulk `eval_exercises` pentru toate `source_id`-urile cu prefix `eval-`. Mapează:
  - `ev.type === "problem"` → `source_type: "problem"` (păstrează `source_id` cu prefix `eval-`)
  - altfel → `source_type: "exercise"`
- Stochează lista de eval_exercises încărcate într-un state (`evalItemsCache`) ca să fie disponibile pentru preview.
- Extinde `getExerciseDetails` și `getProblemDetails` să caute mai întâi în `evalItemsCache` când `source_id` începe cu `eval-`. Pentru itemii eval cu type='problem', construiește un obiect compatibil cu `renderProblemPreview` (`title`, `description: ev.question`, `difficulty: null`).
- La încărcarea testului existent (`useEffect` cu `existingItems`), fetch-uiește la fel `eval_exercises` pentru toate `source_id`-urile cu prefix `eval-` din itemi, ca preview-ul să funcționeze și la editare.

Nu sunt necesare alte modificări la AI-counting: odată ce eval problems devin `source_type='problem'`, `aiItemCount` le include automat.

### 2. `supabase/functions/grade-submission/index.ts`

În bucla de grading, detectează prefixul `eval-` pe `source_id`:
- Dacă `source_type === "exercise"` și `source_id` începe cu `eval-` → fetch din `eval_exercises` în loc de `exercises`, apoi treci la `gradeExercise(ev, answer.answer_data, item.points)` (forma este compatibilă, doar verificat).
- Dacă `source_type === "problem"` și `source_id` începe cu `eval-` → fetch din `eval_exercises` (`test_cases`, `solution`, `question`), folosește `question` ca `title` pentru ramura AI și treci prin aceeași logică `gradeProblemBasic` + `itemsForAI`.

Astfel, pentru profesorii cu Profesor AI, problemele și răspunsurile deschise importate din testul predefinit primesc evaluare AI, iar profesorul vede în builder cerința și variantele de răspuns la fiecare item, inclusiv în preview.

## Fișiere atinse

- `src/components/teacher/TestBuilder.tsx` (preview lookup + import mapping pentru eval-bank)
- `supabase/functions/grade-submission/index.ts` (suport eval- prefix la fetch)
