## Aliniem editorul de probleme cu cel de lecții

În `src/components/admin/ProblemsEditor.tsx`, câmpurile **Descriere** și **Soluție** folosesc acum `Textarea` simplu — fără bold, fără preview. La lecții (`ExerciseEditor.tsx`) se folosește `RichTextEditor` (cu toolbar bold/italic/cod + preview Markdown) pentru text și `CodeBlockEditor` pentru cod Python.

### Modificări

**1. Descriere problemă (Markdown)** → înlocuim `Textarea` cu `RichTextEditor` (același folosit la întrebări de lecții).
   - Toolbar: bold, italic, cod inline, code block, preview live.
   - Păstrăm `rows={4}`.

**2. Hint** → înlocuim `Input` cu `RichTextEditor` (`rows={2}`), ca să poată avea bold/cod ca explicațiile din lecții.

**3. Soluție (cod Python)** → înlocuim `Textarea` cu `CodeBlockEditor` (același folosit la cartonașe în lecții pentru cod Python). Are highlight, indentare auto și preview cod.

### Ce NU schimbăm
- Câmpurile de cazuri de test rămân `Input` simplu (sunt input/output brut, nu Markdown).
- Restul logicii (save, validare, structură DB) rămâne identic — `RichTextEditor` și `CodeBlockEditor` returnează string, exact ca `Textarea`.
- Renderingul în `ProblemSolvePage` și `ProblemExercise` deja folosește `RichContent` pentru `description`/`hint`, deci bold-ul va apărea corect fără alte modificări.

### Fișiere atinse
- `src/components/admin/ProblemsEditor.tsx` (3 câmpuri schimbate + 2 importuri)