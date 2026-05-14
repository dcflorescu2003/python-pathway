## Problemă

În dialogul „Atribuie provocări" din `ChallengeAssigner.tsx`, lecțiile au buton de previzualizare (iconița ochi) care arată exercițiile lecției. Problemele nu au această opțiune — vezi doar titlul, fără context.

## Soluție

În `src/components/teacher/ChallengeAssigner.tsx`, secțiunea „Probleme" (liniile 200–220):

1. Adaug state `previewProblem` (similar cu `previewLesson`).
2. Refactor butonul problemei într-un wrapper cu două butoane: principal (toggle selecție) + secundar (iconița `Eye`, toggle preview).
3. Adaug componentă `ProblemPreview` care arată sub item:
   - Dificultate + XP reward (badge-uri)
   - Descrierea problemei (trunchiată la ~3 rânduri sau scroll)
   - Hint dacă există
   - Numărul de test cases (ex. „3 teste, 1 ascuns")
   - Primul test case vizibil ca exemplu (input → output) în font mono

Stilizare identică cu `ExercisePreview` (bg-muted/50, text-xs, ml-6) ca să arate consistent.

Niciun alt fișier nu trebuie atins. `useProblems` deja întoarce toate câmpurile necesare (`description`, `difficulty`, `xpReward`, `testCases`, `hint`).

## Verificare

- Ca profesor → Clasă → „Atribuie provocări" → tab Probleme → expand un capitol → click pe iconița ochi lângă o problemă → apare preview cu descriere, dificultate, exemplu test case.
