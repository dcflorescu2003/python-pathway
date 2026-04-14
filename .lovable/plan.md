

## Analiză: Cod nefolosit în proiect

### Fișiere complet nefolosite (pot fi șterse)

| Fișier | Motiv |
|--------|-------|
| `src/data/problems.ts` | Nu este importat nicăieri. Problemele se încarcă din baza de date via `useProblems` hook. |
| `src/components/NavLink.tsx` | Nu este importat de niciun alt fișier. |
| `src/components/admin/MarkdownEditor.tsx` | Folosit doar de `ExerciseEditor` — **de fapt ESTE folosit**, rămâne. |

### Hook-uri cu utilizare minimă / parțială

| Hook | Observații |
|------|-----------|
| `useExerciseStore.ts` | Hook-ul `useExerciseStore()` nu este apelat nicăieri. Doar funcția exportată `getStoredChapters()` este folosită în `ChapterTheoryPage`. Totuși, `getStoredChapters` citește din localStorage capitolele din `courses.ts` — posibil legacy, dar e folosit. Putem curăța hook-ul eliminând funcționalitățile neapelate. |

### Fișiere de date potențial redundante

| Fișier | Observații |
|--------|-----------|
| `src/data/problems.ts` | ~2000+ linii, neimportat. Datele sunt în DB. **Poate fi șters.** |
| `src/data/courses.ts` | Încă folosit ca fallback offline de `useChapters` și `useExerciseStore`. Rămâne. |

### Fișiere de test/exemplu

| Fișier | Observații |
|--------|-----------|
| `src/test/example.test.ts` | Test exemplu generic — poate fi eliminat dacă nu aduce valoare. |

### Rezumat acțiuni propuse

1. **Ștergem `src/data/problems.ts`** — ~2000 linii nefolosite, date duplicate din DB
2. **Ștergem `src/components/NavLink.tsx`** — neimportat nicăieri
3. **Curățăm `src/hooks/useExerciseStore.ts`** — eliminăm hook-ul `useExerciseStore()` propriu-zis (funcțiile de add/edit/delete chapter/lesson/exercise care nu sunt apelate), păstrăm doar `getStoredChapters` folosit de `ChapterTheoryPage`
4. **Opțional: ștergem `src/test/example.test.ts`** dacă nu e necesar

**Impact estimat**: ~2100+ linii de cod eliminate, bundle size mai mic, mentenanță mai ușoară.

