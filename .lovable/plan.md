## Problema

La itemii de tip Quiz din banca de evaluare (ex. „Ce se afișează?"), codul Python nu se vede nici în preview-ul din Test Builder, nici la elev în timpul testului. Din 76 de itemi „Ce se afișează?" salvați în bază, niciunul nu are cod în baza de date — codul a fost pierdut la importul CSV.

## Cauza

1. `src/components/admin/csvParser.ts` (case `"quiz"`, linia ~218) nu citește coloana `code_template` din CSV — deci la importul evaluării banca primește quiz-uri fără cod.
2. `src/components/exercises/QuizExercise.tsx` nu afișează `code_template`, chiar dacă există. Convenția implicită din celelalte quiz-uri vechi e ca tot codul să fie scris în câmpul `question` ca fenced block ```python — dar la importul nou codul a venit pe coloana separată `code_template` și a fost ignorat.
3. `src/components/admin/EvalBankEditor.tsx` (linia 478) salvează `code_template` doar pentru `fill`/`problem`, ștergându-l pentru quiz. Iar UI-ul editorului nu are câmp de cod pentru quiz.

## Plan

### 1. Render-ul către elev — `QuizExercise.tsx` și `TrueFalseExercise.tsx`

- Dacă `exercise.code_template` (sau `codeTemplate`) este non-null, afișează-l deasupra opțiunilor într-un `<pre>` cu syntax highlighting (folosind același pattern ca `RichContent` cu SyntaxHighlighter `vscDarkPlus`).

### 2. Preview-ul din Test Builder

Deja afișează `codeTemplate` pentru tipurile non-fill (`TestBuilder.tsx` linia 249). Nu necesită modificări.

### 3. Editor manual — `EvalBankEditor.tsx`

- Adaugă un `CodeBlockEditor` opțional „Cod (apare deasupra opțiunilor)" pentru tipurile `quiz`, `truefalse`, `card`, `open_answer`.
- Modifică `handleSave` (linia 478) ca să trimită `code_template` și pentru aceste tipuri (rămâne `null` dacă e gol).

### 4. Importatorul CSV — `csvParser.ts`

- În `case "quiz"`, `case "truefalse"`, `case "card"`, `case "open_answer"`: citește `row.code_template` și pune-l pe `ex.code_template`.
- Lasă neschimbat comportamentul pentru `fill`/`problem`.

### 5. Datele existente (76 quiz-uri „Ce se afișează?" fără cod)

Aceste înregistrări nu pot fi reparate fără sursa originală. Două opțiuni — decizi tu:

- **A)** Re-uploadezi CSV-ul original prin importer (cu fix-ul de la #4) și înregistrările vor primi `code_template`. Importerul face upsert după `id`?  → trebuie verificat; dacă nu, le ștergem întâi pe cele 76 (le pot identifica după `question = 'Ce se afișează?' AND code_template IS NULL`).
- **B)** Îmi atașezi CSV-ul și scriu o migrare punctuală care actualizează direct cele 76 de rânduri prin map pe `id` sau pe textul opțiunilor.

## Întrebare pentru tine (înainte să implementez pasul 5)

Ai CSV-ul original cu coloana `code_template` completată? Dacă da, preferi varianta A (re-import) sau B (migrare punctuală din CSV)?  
  
Iti incarc acum csv-urile