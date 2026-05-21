În `src/pages/ProblemSolvePage.tsx`:
- Elimin `showHiddenTests` și butonul de toggle.
- `visibleResults` returnează toate rezultatele, dar pentru cele cu `hidden: true` afișez doar eticheta „Test N (ascuns)" + status pass/fail, fără input, expected sau actual output.
- Contorul `passedCount/totalCount` rămâne neschimbat, deci userul știe câte au trecut total.