

## Plan: Fix XP dublu la reluarea lecțiilor

### Problema

Două bug-uri în `LessonPage.tsx` și `useProgress.ts`:

1. **`LessonPage.tsx` linia 56**: `wasFirstTime` se calculează din `progress.completedLessons` la mount, dar `progress` pornește ca `createDefaultProgress()` (cu `completedLessons` gol). Efectul care încarcă datele locale/cloud rulează **după** primul render, deci `wasFirstTime` este mereu `true`. Afișarea arată XP complet (20) în loc de 3.

2. **`useProgress.ts` linia 113**: Starea inițială este `createDefaultProgress()` în loc de `loadLocalProgress(user.id)`. Dacă elevul termină lecția rapid, `prev.completedLessons` este gol și se acordă XP complet.

### Modificări

**`src/hooks/useProgress.ts`** — Inițializare sincronă din localStorage:
- Schimb `useState<UserProgress>(() => createDefaultProgress())` în `useState<UserProgress>(() => loadLocalProgress())` (fără userId, care nu e disponibil încă — dar funcția gestionează deja cazul)
- Alternativ, păstrez default dar mut inițializarea locală din useEffect într-un al doilea useState lazy init

**`src/pages/LessonPage.tsx`** — Fix `wasFirstTime`:
- Schimb `wasFirstTime` din `useState(() => ...)` într-un `useMemo` sau calcul derivat din `progress.completedLessons` curent, nu din snapshot-ul inițial
- Astfel, odată ce datele locale/cloud se încarcă, `wasFirstTime` se actualizează corect

### Fișiere modificate

| Fișier | Ce |
|--------|-----|
| `src/hooks/useProgress.ts` | Inițializare sincronă a stării din localStorage |
| `src/pages/LessonPage.tsx` | `wasFirstTime` derivat din starea curentă, nu snapshot inițial |

