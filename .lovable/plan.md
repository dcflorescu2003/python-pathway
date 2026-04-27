## Problema

În `src/hooks/useChapters.ts` se aplică `addFixareLessons()` peste lecțiile încărcate din baza de date, ceea ce generează automat un duplicat „Fixare: …" (cu id `<id>f`) după fiecare lecție din DB. Vrem ca DB-ul să fie sursa unică de adevăr.

## Modificări

### 1. `src/hooks/useChapters.ts`
- Eliminăm apelul `addFixareLessons(result)` și returnăm direct `result`.
- Eliminăm importul `addFixareLessons` din `@/data/courses` (păstrăm `chapters as localChapters` pentru fallback-ul nativ).

### 2. Fallback nativ (`getNativeFallbackChapters`)
- Rămâne `localChapters` din `courses.ts`, care deja are Fixare aplicat la export (`export const chapters = addFixareLessons(rawChapters)`). Fallback-ul offline pe Android va continua să funcționeze identic.

### 3. Compatibilitate cu lecții vechi „Fixare" deja completate
- Păstrăm `addFixareLessons` exportat din `courses.ts` (folosit la fallback și de adminul `ContentEditor`).
- Păstrăm logica din `src/lib/lessonTitles.ts` care rezolvă id-urile vechi terminate în `f` la titlu „Fixare: …" — astfel, în istoricul `completed_lessons`, intrările vechi cu sufix `f` continuă să afișeze un titlu lizibil.
- Păstrăm normalizarea din `src/lib/competencyTracking.ts` (sufix `f` → id de bază) din același motiv de retrocompatibilitate.

## Rezultat

- Pe web și pe orice platformă cu DB disponibilă: lecțiile apar exact așa cum sunt în Supabase, fără duplicate „Fixare".
- Pe nativ fără rețea: fallback-ul local continuă să afișeze Fixare auto-generat din `courses.ts` (curriculum static).
- Istoricul vechi cu id-uri `<id>f` rămâne afișabil corect în profil/leaderboard.
