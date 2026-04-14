

## Plan: Opțiune „Rulare teste" pentru probleme în teste

### Ce se schimbă

**1. Coloană nouă pe tabela `tests`**

Se adaugă `allow_run_tests boolean NOT NULL DEFAULT false` — profesorul alege dacă elevii pot rula teste pe probleme înainte de trimitere.

**2. TestBuilder — switch nou (`TestBuilder.tsx`)**

Alături de switch-ul de timp, se adaugă un switch „Permite rularea testelor la probleme" (implicit dezactivat). Valoarea se salvează/citește din `allow_run_tests`.

**3. TakeTestPage — ProblemRenderer cu Pyodide (`TakeTestPage.tsx`)**

- Se citește `allow_run_tests` din `tests` (deja preluat prin join pe assignment).
- Dacă `allow_run_tests = true`: ProblemRenderer folosește `CodeEditor` + `usePyodide` pentru a permite elevului să ruleze testele vizibile (similar cu `ProblemExercise` din lecții), apoi trimite codul.
- Dacă `allow_run_tests = false` (implicit): rămâne interfața actuală cu `Textarea` simplă.

**4. RPC `get_test_items_for_student`** — nu necesită modificări (flag-ul e pe test, nu pe item).

### Fișiere modificate

| Fișier | Ce se schimbă |
|--------|---------------|
| Migrare SQL | `ALTER TABLE tests ADD COLUMN allow_run_tests boolean NOT NULL DEFAULT false` |
| `src/components/teacher/TestBuilder.tsx` | Switch nou + salvare/citire `allow_run_tests` |
| `src/hooks/useTests.ts` | Adaugă `allow_run_tests` la create/update params |
| `src/pages/TakeTestPage.tsx` | Citire flag din testInfo, ProblemRenderer condiționat cu CodeEditor + usePyodide |

### Detalii tehnice

- `ProblemRenderer` primește prop `allowRunTests: boolean`
- Când `true`: importă `CodeEditor` și `usePyodide`, afișează editor de cod + buton „Rulează teste" care arată rezultatele vizibile (fără cele hidden), apoi elevul trimite codul ca `answer.code`
- Când `false`: textarea simplu, ca acum

