

## Plan: Filtrare tipuri nepermise la import lecție content

### Problema
Tabelul `exercises` permite doar: `quiz`, `fill`, `order`, `truefalse`, `match`, `card`. Tipurile `open_answer` și `problem` cauzează eroare la INSERT.

### Soluție

**1. `csvParser.ts`** — adaug constante per tabel:
```typescript
export const CONTENT_TYPES = ["quiz", "truefalse", "fill", "order", "card", "match"];
export const EVAL_TYPES = ["quiz", "truefalse", "fill", "order", "card", "open_answer", "problem"];
export const MANUAL_TYPES = ["quiz", "truefalse", "fill", "order", "card", "open_answer", "problem", "match"];
```

Actualizez `getLessonTemplateCSV()` să nu includă exemple `open_answer`/`problem` (acestea sunt doar pentru eval/manual).

**2. `CsvLessonImporter.tsx`** — când `mode === "content"`, filtrez exercițiile cu tipuri nepermise din `validExercises` și afișez un warning vizibil cu câte au fost excluse și de ce.

**3. `CsvImporter.tsx`** — aceeași filtrare pe baza `targetTable`: dacă e `exercises`, exclud `open_answer`/`problem`.

### Fișiere modificate

| Fișier | Ce |
|--------|-----|
| `csvParser.ts` | Constante tipuri per tabel, template actualizat |
| `CsvLessonImporter.tsx` | Filtrare + warning UI |
| `CsvImporter.tsx` | Filtrare + warning UI |

