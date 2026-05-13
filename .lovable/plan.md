## Problema

La import CSV cu 15 exerciții, doar 13 ajung în lecție. Cauza: în `src/components/admin/csvParser.ts` (funcția `exerciseToDbRow`), ID-ul este generat așa:

```ts
const id = `${idPrefix}e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
```

Toate cele 15 rânduri sunt procesate sincron în același tick → `Date.now()` identic. Unicitatea depinde de 4 caractere random, iar `Math.random().toString(36)` poate produce mai puțin de 4 caractere (zerouri tăiate la final). Două ID-uri identice → Postgres respinge rândurile, restul ajung în DB.

## Soluție

Generez ID-uri garantat unice folosind:
- `idPrefix` + `e-` + `Date.now()` + indexul în batch + sufix random robust (`crypto.randomUUID().slice(0, 8)` cu fallback la `Math.random` zero-padded la 6 caractere).

### Modificări

**`src/components/admin/csvParser.ts`** — `exerciseToDbRow`:
- Adaug parametru opțional `index?: number` care contribuie la ID.
- Înlocuiesc sufixul fragil cu `crypto.randomUUID()` (suportat în toate browserele moderne) cu fallback la `Math.random().toString(36).padStart(8, "0").slice(-6)`.
- ID nou: `${idPrefix}e-${Date.now()}-${index}-${randomSuffix}` — combinație garantat unică între rânduri din același batch și între batch-uri.

**`src/components/admin/CsvImporter.tsx`**:
- Pasez indexul `i` la `exerciseToDbRow(ex, lessonId, existingCount + i, prefix, i)`.

**Verificare**: Caut alți consumatori ai `exerciseToDbRow` (probabil `CsvLessonImporter.tsx`) și pasez și acolo indexul.

### De ce nu doar lungesc sufixul random

Indexul în batch elimină complet posibilitatea de coliziune între rândurile aceluiași import (cazul real raportat). Sufixul random previne coliziuni între importuri rapide succesive sau cu ID-uri existente.

## Out of scope

Nu modific schema DB, nu migrez ID-urile existente, nu schimb comportamentul vizual al importerului.
