
# Secțiune „Manual" în Admin — lecții publice fără autentificare

## Context
Vrei un editor de lecții în Admin (tab „Manual") identic ca funcționalitate cu editorul existent, dar lecțiile salvate acolo au pagini publice accesibile fără cont. Pagina publică arată logo-ul PyRo sus, titlul lecției cu buton „Start", exerciții (fără XP — doar scor), și un banner jos de înregistrare.

## Structură bază de date

Două tabele noi: `manual_lessons` și `manual_exercises`, cu RLS public (SELECT fără autentificare, CRUD doar admin).

### Migrare SQL
```sql
CREATE TABLE public.manual_lessons (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.manual_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read manual_lessons" ON public.manual_lessons
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert manual_lessons" ON public.manual_lessons
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update manual_lessons" ON public.manual_lessons
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete manual_lessons" ON public.manual_lessons
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TABLE public.manual_exercises (
  id text PRIMARY KEY,
  lesson_id text NOT NULL REFERENCES public.manual_lessons(id) ON DELETE CASCADE,
  type text NOT NULL,
  question text NOT NULL,
  options jsonb,
  correct_option_id text,
  code_template text,
  blanks jsonb,
  lines jsonb,
  statement text,
  is_true boolean,
  explanation text,
  pairs jsonb,
  xp integer NOT NULL DEFAULT 5,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.manual_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read manual_exercises" ON public.manual_exercises
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert manual_exercises" ON public.manual_exercises
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update manual_exercises" ON public.manual_exercises
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete manual_exercises" ON public.manual_exercises
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
```

## Fișiere noi

### 1. `src/components/admin/ManualEditor.tsx`
Editor identic structural cu `ContentEditor.tsx`, dar simplificat:
- Fără capitole — doar o listă de lecții cu exerciții
- CRUD pe tabelele `manual_lessons` / `manual_exercises`
- Drag-and-drop pentru reordonare lecții și exerciții
- Reutilizează `ExerciseEditor` existent pentru editarea exercițiilor
- Fiecare lecție afișează un link copiabil către pagina publică (`/manual/{lessonId}`)

### 2. `src/pages/ManualLessonPage.tsx`
Pagina publică pentru o lecție din manual:
- **Header**: logo PyRo (`/Logo_Patrat-2.png`) centrat
- **Ecran inițial**: titlul lecției + buton „Începe"
- **Exerciții**: identice ca în `LessonPage.tsx` (quiz, fill, order, truefalse, match, card) dar fără vieți și fără XP
- **Ecran final**: „Ai răspuns corect la X/Y întrebări" (fără XP)
- **Banner jos**: „Vrei să înveți mai mult? Creează-ți un cont gratuit pe PyRo!" cu buton către `/auth`
- Fetch date direct din Supabase cu clientul anonim (RLS permite SELECT pentru `anon`)

### 3. `src/hooks/useManualLessons.ts`
Hook cu `useQuery` care fetchează lecțiile și exercițiile din `manual_lessons` + `manual_exercises`, returnat ca o listă de lecții cu exerciții nested.

## Fișiere modificate

### 4. `src/pages/AdminPage.tsx`
- Adăugare tab „Manual" cu icon `FileText` în `TabsList`
- Import și render `ManualEditor` în `TabsContent`

### 5. `src/App.tsx`
- Adăugare rută `/manual/:lessonId` → `ManualLessonPage`
- Ruta este **în afara** `AuthProvider` guard-ului (accesibilă fără login)

## Flux utilizator

1. Admin deschide tab-ul „Manual", creează o lecție cu exerciții
2. Copiază link-ul public (ex: `pyro-learn.lovable.app/manual/ml-123456`)
3. Oricine deschide link-ul vede logo + titlu + „Începe"
4. Rezolvă exercițiile, la final vede scorul (fără XP)
5. Banner-ul de jos îl invită să-și facă cont

## Notă
Ruta `/manual/:lessonId` nu necesită autentificare. Clientul Supabase folosește cheia `anon` care are acces SELECT pe tabelele `manual_*` conform RLS-ului configurat.
