

## Plan: Aplic RichContent uniform pentru cerințe + fix truefalse parser

### Diagnoză locuri unde apar `**` în loc de bold

| Locație | Problemă | Fix |
|---|---|---|
| `src/pages/ProblemSolvePage.tsx` (cerința problemei) | Folosește split manual `\n` și parsing `**` ad-hoc — nu randează corect Markdown din DB | Înlocuiesc cu `<RichContent>{problem.description}</RichContent>` |
| `src/pages/ProblemSolvePage.tsx` (hint) | `<p>{problem.hint}</p>` plain | `<RichContent>{problem.hint}</RichContent>` |
| `src/components/exercises/ProblemExercise.tsx` (hint) | `<p>{exercise.hint}</p>` plain | `<RichContent>{exercise.hint}</RichContent>` |
| `src/components/admin/csvParser.ts` linia 165 | La `truefalse` suprascrie `ex.question = ex.statement`, ignorând „Adevărat sau fals?" din coloana `question` | Păstrez `ex.question = row.question?.trim() \|\| ex.statement` |

### Locuri OK (deja folosesc RichContent)
- Toate exercițiile elev (Quiz, Fill, Order, TrueFalse, Card, Match, Problem question)
- Explicațiile feedback din `LessonPage`, `ManualLessonPage`, `SkipChallengePage`
- `CardExercise` titlu + explicație

### Locuri intenționat plain-text (nu modific)
- Listele admin (preview compact) — `truncate` rupe oricum HTML
- `TakeTestPage` / `PredefinedTestEditor` (preview profesor) — sunt doar previzualizări scurte

### Fișiere modificate (3)
1. `src/pages/ProblemSolvePage.tsx` — înlocuiesc blocul de parsing manual + hint cu `RichContent`
2. `src/components/exercises/ProblemExercise.tsx` — wrap hint în `RichContent`
3. `src/components/admin/csvParser.ts` — la case `truefalse`, păstrez question din CSV dacă e completat

### Rezultat
- Cerințele problemelor și hint-urile randează corect `**bold**`, liste, culori, cod
- A/F importate via CSV vor afișa „Adevărat sau fals?" deasupra afirmației stilizate
- Re-importarea CSV-ului lecției 12 va funcționa corect fără modificări manuale

