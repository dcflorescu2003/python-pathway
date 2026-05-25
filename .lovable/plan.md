## Problemă
Pe `ProblemSolvePage`, butonul „înapoi" duce mereu la `/problems` (lista de capitole), pierzând capitolul din care utilizatorul a intrat. `ProblemsPage` ține capitolul selectat în state local (`selectedChapter`), nu în URL.

## Soluție
Transmite capitolul prin `location.state` la navigarea către problemă și folosește-l la întoarcere pentru a redeschide capitolul corect.

### Modificări

**`src/pages/ProblemsPage.tsx`**
- În `handleProblemClick`, pasează `{ fromChapter: problem.chapter }` ca state la `navigate(\`/problem/${problem.id}\`, { state: ... })`.
- La montare, inițializează `selectedChapter` din `location.state?.fromChapter` (dacă există) pentru cazul revenirii.

**`src/pages/ProblemSolvePage.tsx`**
- Citește `location.state?.fromChapter` (sau `problem.chapter` ca fallback).
- Butonul „înapoi" (și `navigate("/problems")` din guard-ul Premium) navighează la `/problems` cu `state: { fromChapter }`, astfel încât lista să se deschidă direct pe capitolul respectiv.

Niciun alt comportament nu se schimbă; este pur navigare frontend.