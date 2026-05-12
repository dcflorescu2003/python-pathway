## Capitole pentru testele predefinite

Adaug suport pentru gruparea testelor predefinite pe capitole, similar cu exercițiile (`eval_chapters`) și problemele (`problem_chapters`).

### 1. Bază de date (migrație)

**Tabel nou `test_chapters**`

```text
id text PK | title text | icon text default '📘' | sort_order int default 0
```

- RLS: `SELECT` pentru `authenticated`; `ALL` pentru admin (același pattern ca `eval_chapters`).

**Modificare `predefined_tests**`

- Adaug coloana `chapter_id text` (nullable inițial pentru migrare lină).
- Seed: insert capitol `recapitulare` cu titlu „Recapitulare" și update `predefined_tests.chapter_id = 'recapitulare'` pentru toate testele existente.

### 2. Admin

`**PredefinedTestEditor.tsx**`

- Lista testelor devine grupată pe capitol (collapsible per capitol, cu titlu + icon + count), aceeași abordare ca `ProblemsEditor`.
- Buton „Capitol nou" + edit/delete inline pe fiecare capitol (dialog simplu cu titlu + icon + sort_order).
- Reordonare capitole + teste cu @dnd-kit (existent în fișier).
- În `TestForm`: select obligatoriu „Capitol" lângă titlu/dificultate. Se salvează în `chapter_id`.

### 3. Hook nou

`**useTestChapters.ts**` — hook similar cu `useEvalChapters`:

- `useTestChapters()` → listă capitole sortate
- `useTestChapterMutations()` → create / update / delete

`usePredefinedTests` rămâne la fel; consumatorii filtrează pe `chapter_id` în memorie.

### 4. UI profesor — `TestBuilder.tsx`

În subtab-ul „Banca testare" → „Teste":

- Adaug `<Select>` „Capitol" deasupra listei, populat din `useTestChapters`.
- Filtrez `predefinedTests` după `selectedTestChapterId`. Default: primul capitol (sau toate, dacă nu există capitol).
- State nou: `selectedBankTestChapterId`.

Restul logicii (gating verificat, duplicare test, preview) rămâne neschimbat.

### Fișiere atinse

- migrație SQL nouă (tabel + coloană + seed Recapitulare + assign teste existente)
- `src/hooks/useTestChapters.ts` (nou)
- `src/integrations/supabase/types.ts` — regenerat automat după migrare
- `src/components/admin/PredefinedTestEditor.tsx`
- `src/components/teacher/TestBuilder.tsx`

### Întrebări

1. Pentru icon-ul implicit pe capitole de teste vrei ceva specific (📝 / 🧪 / 📊) sau e ok 📘 ca la probleme?
2. Capitolul devine **obligatoriu** la crearea unui test nou, sau permit „Fără capitol" (afișat ca grup separat)? Implicit aleg **obligatoriu** după migrare.  
  
1) Ca la probleme  
2) Permitem Fără categorie