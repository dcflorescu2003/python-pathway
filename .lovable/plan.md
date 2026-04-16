

## Investigare

Bug-ul: pentru același elev, profesor vede 100%, elev vede 8%. Aceeași provocare, două surse de adevăr diferite.

Cauza probabilă: după fix-ul anterior cu `bestScore` în `useProgress.ts`, scorul local respectă regula "best", dar:
- **Profesor**: citește direct din `completed_lessons` (cloud) — vede 100% (vechi, corect)
- **Elev**: citește din state-ul local (`progress.completedLessons`) — care s-a inițializat din localStorage cu un scor mai mic (8 = 8 exerciții corecte stocate ca raw count, nu procent), apoi `syncToCloud` a făcut UPSERT și a SUPRASCRIS 100% din cloud cu 8.

Verific maparea:
- `completeLesson(lessonId, xp, score)` — `score` vine din componente. Trebuie să văd ce trimit `LessonPage` și `ProblemSolvePage`.
- `mergeProgress` ia `Math.max` pentru lesson scores — bun.
- DAR: `syncToCloud` face upsert necondiționat cu valoarea locală. Dacă local e 8 (raw count) și cloud e 100, sync-ul scrie 8 peste 100.

Mai grav: la încărcare, `mergeProgress(local, cloud)` compară `score` direct cu `Math.max`. Local = 8 (raw), cloud = 100 (procent vechi salvat când era corect). Max = 100, deci ar trebui să fie OK... dar dacă local-ul a fost salvat ca 8 ȘI sincronizat înainte de fix, cloud-ul e acum 8.

Adevărata problemă: **scorurile sunt stocate inconsistent** — uneori ca raw count (ex: 1, 5, 8), uneori ca procent (100). UI-ul de la elev face `Math.round((score / total) * 100)` pe presupunerea că-i raw count. Dacă scorul e deja procent (100), arată `Math.round((100/8)*100) = 1250%` — clar greșit, deci probabil afișează valoarea brută.

## Plan

### 1. Standardizare: scorul stocat = mereu procent (0-100)

Modific `LessonPage.tsx` să trimită procentul calculat la `completeLesson`, nu raw count. Verific toate locurile care apelează `completeLesson`:
- `LessonPage.tsx` — lecții normale
- `ProblemSolvePage.tsx` — deja trimite 100 (corect)
- `ManualLessonPage.tsx` — verific

### 2. Migrare date existente

Run SQL: pentru `completed_lessons` cu `score < 100` care corespund unei lecții — recalculez ca procent. Problemă: nu știu câte exerciții avea lecția la momentul completării. 

Soluție mai simplă: orice scor < 20 (imposibil de procent valid pentru lecție completată) îl interpretez ca raw count și-l convertesc folosind numărul actual de exerciții din `exercises` table.

### 3. Fix UI elev/profesor

Scot logica `Math.round((score / total) * 100)` din `StudentTab.tsx`, `ClassDetail.tsx`, `ClassAnalytics.tsx`. Afișez direct `score%`.

### 4. Reset cache local pentru elevul afectat

Adaug în `useProgress.ts` o logică one-time: dacă scorul local pentru o lecție < scorul cloud, prefer cloud-ul (deja face asta cu `Math.max` în merge). Dar trebuie să mă asigur că `syncToCloud` NU suprascrie cu valoarea mai mică — adaug verificare înainte de upsert.

### Fișiere modificate

| Fișier | Schimbare |
|--------|-----------|
| `src/pages/LessonPage.tsx` | Trimite procent la `completeLesson`, nu raw count |
| `src/pages/ManualLessonPage.tsx` | La fel (verific) |
| `src/hooks/useProgress.ts` | `syncToCloud` face upsert doar dacă scor nou ≥ scor existent în cloud |
| `src/components/account/StudentTab.tsx` | Afișează direct `score%`, fără recalcul |
| `src/components/teacher/ClassDetail.tsx` | La fel |
| `src/components/teacher/ClassAnalytics.tsx` | La fel |
| Migrare SQL | Convertesc scorurile raw existente în procente |

### Rezultat
- Elev și profesor văd același procent (cel mai mare obținut)
- Datele viitoare sunt stocate consistent ca procente
- Datele istorice migrate la format corect

