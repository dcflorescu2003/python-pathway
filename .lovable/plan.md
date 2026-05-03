## Plan aprobat

### 1. `src/components/admin/csvParser.ts` — rescriere `getExercisesTemplateCSV()`

Header cu 17 coloane. Fiecare exemplu cu exact 16 virgule, cu comentarii `#` deasupra. Tipuri: quiz, truefalse, fill, order, card, open_answer, problem. Fiecare cu coloana `competencies` populată (ex. `M21`, `M61;M82`). Plasare corectă a `lines` (col 11), `solution` (col 15), `test_cases` (col 16).

### 2. `src/components/admin/EvalBankEditor.tsx` — `EvalExerciseEditor`

- Pre-generează `id`-ul în `useState` la mount (în loc de la submit).
- Pasează `itemId={preGeneratedId}` către `<CompetencyTagger>` ca să poți tag-ui microcompetențe înainte de prima salvare.
- Pe `onCancel` la creare nouă (când nu există `exercise` prop): dacă userul a adăugat tag-uri, le ștergem din `item_competencies` (cleanup orfani).
- Pe `handleSave` folosim acel id pre-generat.

### 3. `src/components/admin/ExerciseEditor.tsx` — același tratament

Aceeași schimbare (id pre-generat + CompetencyTagger activ înainte de salvare + cleanup pe cancel) pentru editorul folosit la lecții normale și manual.

### Rezultat

- Template CSV descărcat din dialogul „Import CSV exerciții" (eval bank) e valid și include exemple corecte pentru toate tipurile, inclusiv `problem` și `open_answer`, plus `competencies`.
- Importul mapează automat codurile micro la `item_competencies` (logica există deja în `CsvImporter.tsx`).
- La adăugare manuală a unui exercițiu, poți seta microcompetențele înainte de Save.
