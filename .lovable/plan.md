## Problemă

Supabase taie implicit orice query la 1000 de rânduri. La fel ca la `exercises`, mai avem trei query-uri "globale" (fără filtru per părinte) care vor pierde date silențios când depășim 1000:

1. **`src/hooks/useProblems.ts`** (~linia 43) — `from("problems").select(...).order("sort_order")` — folosit în pagina `/probleme` și în `TestResults`. Probleme cu `sort_order` mare nu vor mai apărea în listă.
2. **`src/hooks/useEvalBank.ts` → `useAllEvalExercises`** (linia 82) — `from("eval_exercises").select("*").order("sort_order")` — folosit în `TestBuilder` (interfața profesorului de creare test) și în `PredefinedTestEditor` (admin). Itemii din banca de evaluare nu vor mai apărea integral.
3. **`src/hooks/useEvalBank.ts` → `useAllEvalLessons`** (linia 96) — același risc pentru lecțiile din banca eval (mai puțin probabil să depășim, dar e gratuit să-l protejăm odată ce avem helper).

Query-urile filtrate strict (`useEvalExercises(lessonId)`, `useTestItems(testId)`, `.in("id", ids)`) sunt mărginite natural per lecție/test, deci OK.

## Soluție

Aceeași tehnică ca la `useChapters.ts`: paginare cu `.range(from, from + PAGE_SIZE - 1)` într-un `for` până când o pagină vine cu mai puțin de 1000 de rânduri.

### Pași

1. **Adaug helper reutilizabil** `fetchAllPaginated(query, pageSize=1000)` în `src/lib/supabasePagination.ts` care primește un builder Supabase și returnează toate rândurile. Sortarea și filtrele rămân responsabilitatea apelantului; helper-ul aplică doar `.range()`.

2. **`src/hooks/useProblems.ts`** — înlocuiesc `await supabase.from("problems").select(...).order("sort_order")` cu paginare. Sortez după `(sort_order, id)` pentru ordine deterministă între pagini (același truc ca la exercises).

3. **`src/hooks/useEvalBank.ts`** — paginez `useAllEvalExercises` și `useAllEvalLessons` cu același helper, sort `(sort_order, id)`.

4. **Verificare**:
   - Citesc count-urile actuale în `problems`, `eval_exercises`, `eval_lessons` ca să confirm pragul.
   - După modificare, deschid `/probleme` și interfața de creare test în preview și verific că numărul afișat se potrivește cu DB.

## Detalii tehnice

- Păstrez `staleTime`/`gcTime` existente; doar `queryFn` se schimbă.
- Pe parcursul paginării opresc bucla la prima pagină < `PAGE_SIZE` (la fel ca `useChapters`).
- Erorile per pagină se aruncă imediat (fără fallback parțial), ca să nu afișăm date trunchiate fără să știm.
- Nu schimb nimic în `useEvalExercises(lessonId)` / `useTestItems(testId)` — sunt deja filtrate pe părinte; le-aș paginației doar dacă o singură lecție/test depășește 1000 de itemi (puțin probabil).
