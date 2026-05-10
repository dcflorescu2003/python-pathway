## Multi-valoare la Input/Output în probleme

### Cum funcționează deja motorul (nu se schimbă)
- `usePyodide.ts` ia `tc.input`, îl împarte după `\n` și fiecare linie devine o valoare returnată de `input()`. Deci pentru 2 valori scrii pe 2 rânduri.
- `tc.expectedOutput` este comparat exact cu stdout-ul complet al programului (inclusiv newline-uri între `print`-uri).

### Problema în UI
În `src/components/admin/ProblemsEditor.tsx` câmpurile Input și Output sunt `<Input>` (single-line) — nu se poate apăsa Enter pentru a introduce mai multe valori.

### Modificări (doar UI)

**`src/components/admin/ProblemsEditor.tsx`** (în jurul liniilor 294-310):
1. Înlocuiesc cele două `<Input>` pentru `tc.input` și `tc.expectedOutput` cu `<Textarea>` (rows=2, font-mono, text-xs).
2. Placeholder-uri explicative:
   - Input: `O valoare pe linie (ex:\n5\n10)`
   - Output: `Stdout așteptat (ex:\n15)`
3. Adaug un mic `<p className="text-xs text-muted-foreground">` deasupra listei de teste:
   > „Pentru mai multe valori `input()`, scrie fiecare pe o linie nouă. Output-ul se compară cu tot ce printează programul."

### Ce nu se schimbă
- Schema DB (`test_cases` rămâne `{input, expectedOutput, hidden}` cu string-uri multi-line).
- `usePyodide`, `ProblemSolvePage`, `ProblemExercise` — deja tratează newline-urile corect (afișarea înlocuiește `\n` cu `↵`).
- Importul CSV (`csvParser.ts`) — rămâne cu separatorii actuali.
