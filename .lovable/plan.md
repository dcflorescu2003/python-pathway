## Obiectiv

În **Banca de teste**, în interiorul unei lecții, lângă butonul existent „Exercițiu nou" + „Import CSV (exerciții)", adăugăm un al doilea buton **„Import probleme CSV"** care folosește exact formatul CSV de la probleme (`title, description, difficulty, xp_reward, hint, solution, is_premium, test_cases, competencies`) și inserează rândurile în tabela `eval_exercises` ca exerciții de tip `problem`.

## De ce o componentă nouă (nu reutilizăm direct ProblemsCsvImporter)

`ProblemsCsvImporter` inserează în tabela `problems` (cu prefixe de capitol `rec/pr/...` și mapare `item_type='problem'`). În banca de teste avem nevoie de:
- target = `eval_exercises`
- ID-uri stil `eval-e-{timestamp}-{n}` (la fel ca la `EvalExerciseEditor` linia 432)
- maparea coloanelor problemă → coloane `eval_exercises`:
  - `title` → ignorat la nivel de exercițiu (sau prepended la `question`); cel mai curat: folosim `title` ca prefix bold în `question` SAU îl ignorăm. **Decizie:** îl punem ca primă linie bold în `question` (markdown `**Title**\n\n` + description), pentru că `eval_exercises` nu are coloană `title`.
  - `description` → `question` (Markdown păstrat)
  - `solution` → `solution`
  - `test_cases` (format `input>>output>>hidden;...`) → `test_cases` jsonb (`[{input, expected_output, hidden}]`)
  - `hint` → ignorat (nu există coloană în `eval_exercises`); afișăm warning în preview dacă există hint
  - `difficulty`, `xp_reward`, `is_premium` → ignorate (nu există în schema `eval_exercises`); afișăm subtle hint în preview că nu sunt importate
  - `competencies` → maps la `item_competencies` cu `item_type='eval_exercise'`
  - `type` setat fix pe `'problem'`
  - `code_template` → null (sau preluat din `solution` dacă nu e setat)

## Modificări

### 1. `src/components/admin/EvalProblemsCsvImporter.tsx` (nou)
- Componentă similară `ProblemsCsvImporter`, dar:
  - Props: `lessonId`, `existingCount`, `onSuccess`
  - Reutilizează `parseProblemsCSV` și `getProblemsTemplateCSV` din `problemsCsvParser.ts` (deja există).
  - Funcție de mapare la `eval_exercises`:
    ```ts
    {
      id: `eval-e-${Date.now()}-${i}`,
      lesson_id: lessonId,
      type: 'problem',
      question: `**${p.title}**\n\n${p.description}`,
      solution: p.solution,
      test_cases: p.test_cases, // [{input, expected_output, hidden}]
      code_template: null,
      sort_order: existingCount + i,
      // restul coloanelor null/default
    }
    ```
  - Inserează în `eval_exercises`, apoi pentru fiecare cu `competencies` non-vide → maps la `item_competencies` cu `item_type='eval_exercise'`.
  - Buton: **„Import probleme CSV"** + link „Descarcă template" (același template ca la probleme).
  - Preview: titlu, dificultate (info-only), nr. test cases, nr. competențe; avertizări pentru câmpurile ignorate (`hint`, `xp_reward`, `is_premium`, `difficulty`).

### 2. `src/components/admin/EvalBankEditor.tsx` (modificat)
- În `ExercisesList`, în footer-ul cu butoane (linia 401-406), adăugăm un al doilea buton:
  ```
  [+ Exercițiu nou]   [⬆ Import CSV exerciții]   [⬆ Import probleme CSV]
  ```
- Importăm și randăm `<EvalProblemsCsvImporter lessonId={lessonId} existingCount={exercises.length} onSuccess={invalidateAll} />`.

### 3. Nimic la backend / schema DB
- `eval_exercises` are deja toate coloanele necesare (`type`, `question`, `solution`, `test_cases`, `code_template`).
- RLS: admins pot face ALL pe `eval_exercises`; `item_competencies` admin INSERT permis.

## UX

Pe fiecare lecție extinsă, sub lista de exerciții:
```
[ + Exercițiu nou ]   [ Import CSV ]   [ Import probleme CSV ]
```

Dialog import probleme:
- Buton „Alege fișier CSV" + dropzone
- Preview: listă probleme parse-uite cu badge `Problemă`, nr. test cases, competențe
- Note vizibile: „`hint`, `xp_reward`, `difficulty`, `is_premium` nu se importă în banca de teste — folosește pagina de Probleme pentru aceste câmpuri."
- Buton final „Importă N probleme"
- Link „Descarcă template" (template comun cu cel de la probleme)

## Out of scope

- Modificări la formatul CSV de la probleme.
- Câmpuri specifice problemelor care nu există în `eval_exercises` (păstrate ca warning).
- Modificări la editorul rich text / preview existent.
