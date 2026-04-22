

## Plan: Puncte din oficiu (bonus points per test)

### Ce se schimba

Se adauga un camp "Puncte din oficiu" la fiecare test, cu valoare implicita 10. Aceste puncte se aduna automat la scorul total al elevului la notare. Profesorul poate modifica valoarea in TestBuilder.

### 1. Migrare DB -- coloana `office_points` pe `tests`

```sql
ALTER TABLE public.tests ADD COLUMN office_points integer NOT NULL DEFAULT 10;
```

### 2. TestBuilder -- camp UI sub titlu

In `src/components/teacher/TestBuilder.tsx`:
- Adauga state `officePoints` (default 10), initializat din test la editare
- Adauga un `Input` de tip number sub titlu, cu label "Puncte din oficiu"
- Trimite `office_points` in `handleSave` catre `createTest` / `updateTest`

### 3. useTests.ts -- include `office_points` in mutations

In `src/hooks/useTests.ts`:
- Adauga `office_points?: number` la parametrii `useCreateTest` si `useUpdateTest`
- Include campul in `.insert()` si `.update()` catre tabelul `tests`

### 4. grade-submission -- adauga punctele din oficiu la scor

In `supabase/functions/grade-submission/index.ts`:
- Dupa ce se obtine testul (linia ~101), se citeste `office_points`
- Se adauga `office_points` la `totalScore` si `maxScore` inainte de update-ul final pe `test_submissions`

### 5. TestResults -- afiseaza punctele din oficiu

In `src/components/teacher/TestResults.tsx`:
- Citeste `office_points` din testul curent
- Afiseaza in rezumat ca linie separata (ex: "Din oficiu: 10p")

### Fisiere modificate

| Fisier | Modificare |
|--------|-----------|
| Migrare DB | `ALTER TABLE tests ADD COLUMN office_points integer NOT NULL DEFAULT 10` |
| `src/components/teacher/TestBuilder.tsx` | State + Input + pass to save |
| `src/hooks/useTests.ts` | `office_points` in create/update params |
| `supabase/functions/grade-submission/index.ts` | Adauga office_points la totalScore/maxScore |
| `src/components/teacher/TestResults.tsx` | Afiseaza "Din oficiu: Xp" |

