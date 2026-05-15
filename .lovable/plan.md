## Problem

În previzualizarea exercițiilor (la **Provocări** și la **Teste**), unele câmpuri lipsesc:

- **Quiz** — se afișează doar întrebarea (ex. „Ce se afișează?") fără snippet-ul de cod (`code_template`) care e contextul răspunsurilor.
- **Adevărat / Fals** — în Provocări se afișează doar „Tip: Adevărat / Fals", fără afirmația propriu-zisă (câmpul e stocat în `statement`, dar preview-ul citește doar `question`).

## Modificări

### 1. `src/components/teacher/ChallengeAssigner.tsx` — `ExercisePreview`
- Înlocuiește `exercise.question` cu `exercise.question || exercise.statement` (acoperă truefalse).
- Dacă `exercise.codeTemplate` există, randează-l ca bloc `<pre>` monospace sub enunț (pentru quiz / truefalse / orice tip cu snippet de cod).
- Folosește `RichContent` pentru enunț (consecvent cu TestBuilder).

### 2. `src/components/teacher/TestBuilder.tsx` — `renderExercisePreview`
- În prezent `codeTemplate` e afișat doar la `fill`. Mută afișarea blocului de cod înainte de switch-ul de tip, astfel încât să apară și la `quiz` și `truefalse` când există `code_template`.
- La `fill` păstrează randarea cu `___` evidențiat (nu se schimbă logica existentă, doar se evită dublarea).

Nicio modificare la backend, schemă sau la player-ul real al exercițiilor — doar la cele două componente de preview.