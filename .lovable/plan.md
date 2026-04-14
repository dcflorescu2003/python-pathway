

## Plan: Bancă de itemi pentru evaluare + Teste predefinite (Admin)

### Ideea

Două tab-uri noi în panoul Admin:

1. **Bancă de itemi** — structură Capitole → Lecții → Exerciții (similar cu ContentEditor, dar dedicat evaluărilor). Adminul definește capitole tematice, creează lecții în fiecare capitol, apoi adaugă exerciții (quiz, fill, order, truefalse) la fiecare lecție. Acestea formează banca din care se asamblează testele.

2. **Teste predefinite** — adminul asamblează teste complete selectând itemi din bancă, setând punctaje, timp, nivel de dificultate și mod variante (shuffle/manual). Aceste teste înlocuiesc array-ul hardcodat `TEMPLATES` din TestBuilder și devin accesibile profesorilor verificați.

### Îmbunătățiri propuse

- **Nivel de dificultate pe test** (ușor/mediu/avansat) — ajută profesorii să filtreze rapid
- **Taguri pe itemi** (opțional) — pentru căutare/filtrare în bancă
- **Duplicare test predefint** — profesorul verificat poate duplica un test predefinit în propriile teste și apoi îl poate personaliza
- **Previzualizare completă** — adminul poate previzualiza testul exact cum îl va vedea elevul

### Tabele noi (migrare SQL)

```sql
-- Capitole din banca de evaluare
CREATE TABLE public.eval_chapters (
  id text PRIMARY KEY,
  title text NOT NULL,
  icon text NOT NULL DEFAULT '📝',
  sort_order integer NOT NULL DEFAULT 0
);

-- Lecții din banca de evaluare  
CREATE TABLE public.eval_lessons (
  id text PRIMARY KEY,
  chapter_id text NOT NULL REFERENCES eval_chapters(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

-- Exerciții din banca de evaluare
CREATE TABLE public.eval_exercises (
  id text PRIMARY KEY,
  lesson_id text NOT NULL REFERENCES eval_lessons(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('quiz','fill','order','truefalse')),
  question text NOT NULL,
  options jsonb,
  correct_option_id text,
  blanks jsonb,
  lines jsonb,
  statement text,
  is_true boolean,
  explanation text,
  sort_order integer NOT NULL DEFAULT 0
);

-- Teste predefinite (template-uri)
CREATE TABLE public.predefined_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'mediu',
  time_limit_minutes integer,
  variant_mode text NOT NULL DEFAULT 'shuffle',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Itemii unui test predefinit
CREATE TABLE public.predefined_test_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES predefined_tests(id) ON DELETE CASCADE,
  variant text NOT NULL DEFAULT 'both',
  sort_order integer NOT NULL DEFAULT 0,
  source_type text NOT NULL, -- 'eval_exercise', 'exercise', 'problem'
  source_id text,
  custom_data jsonb,
  points integer NOT NULL DEFAULT 10
);
```

RLS: toate tabelele — CRUD doar admin, SELECT pentru authenticated (profesorii verificați filtrează client-side, deja implementat).

### Componente noi

| Fișier | Descriere |
|--------|-----------|
| `src/components/admin/EvalBankEditor.tsx` | Editor capitole → lecții → exerciții (reutilizează pattern-ul din ContentEditor cu DnD, CRUD inline) |
| `src/components/admin/PredefinedTestEditor.tsx` | Asamblare teste: selectare itemi din bancă, setare punctaje/timp/dificultate/variante |
| `src/hooks/useEvalBank.ts` | Hook-uri pentru query/mutații pe eval_chapters, eval_lessons, eval_exercises |
| `src/hooks/usePredefinedTests.ts` | Hook-uri pentru query/mutații pe predefined_tests și predefined_test_items |

### Modificări existente

| Fișier | Ce se schimbă |
|--------|---------------|
| `src/pages/AdminPage.tsx` | +2 tab-uri: „Bancă Evaluare" și „Teste Predefinite" |
| `src/components/teacher/TestBuilder.tsx` | Înlocuire array TEMPLATES cu date din `predefined_tests`. Profesorul verificat poate selecta un test predefinit → se copiază itemii în testul propriu |

### Flux

1. **Admin**: creează capitole și lecții în Banca de Evaluare → adaugă exerciții
2. **Admin**: în tab-ul Teste Predefinite → creează test → selectează itemi din bancă (sau din lecțiile/problemele existente) → setează punctaje, timp, dificultate, variante
3. **Profesor verificat**: în TestBuilder vede lista testelor predefinite (în loc de TEMPLATES hardcodate) → selectează unul → itemii se copiază automat în testul nou → poate personaliza punctaje/timp/itemi suplimentari

