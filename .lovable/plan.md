

## Plan: Platformă de testare pentru profesori

### Concept general

Profesorii pot crea teste din 3 surse, le distribuie la clase, iar notarea se face automat. Fiecare test generează 2 variante. Punctajul parțial la probleme de cod: test cases + output parțial (gratuit) sau test cases + AI review (Premium profesor).

### Tabele noi (migrări)

**`tests`** — testul creat de profesor
- `id` uuid PK, `teacher_id` uuid, `title` text, `time_limit_minutes` int (nullable), `variant_mode` text (`shuffle` | `manual`), `created_at`, `updated_at`

**`test_items`** — itemii din test
- `id` uuid PK, `test_id` uuid FK→tests, `variant` text (`A` | `B` | `both`), `sort_order` int
- `source_type` text (`exercise` | `problem` | `custom`) — de unde vine itemul
- `source_id` text (nullable) — referință la exercises/problems dacă e din DB
- `custom_data` jsonb (nullable) — pentru întrebări custom (tip, question, options, etc.)
- `points` int default 10

**`test_assignments`** — distribuirea la clase
- `id` uuid PK, `test_id` uuid FK→tests, `class_id` uuid FK→teacher_classes, `assigned_at`, `due_date` (nullable), `is_active` bool

**`test_submissions`** — răspunsurile elevilor
- `id` uuid PK, `assignment_id` uuid FK→test_assignments, `student_id` uuid, `variant` text (`A` | `B`), `started_at`, `submitted_at`, `total_score` numeric, `max_score` numeric, `auto_graded` bool

**`test_answers`** — răspunsul per item
- `id` uuid PK, `submission_id` uuid FK→test_submissions, `test_item_id` uuid FK→test_items, `answer_data` jsonb, `score` numeric, `max_points` numeric, `feedback` text (nullable), `ai_reviewed` bool default false

### RLS
- Profesorii: CRUD pe propriile teste, vizualizare submissions din clasele lor
- Elevii: SELECT pe assignments din clasele lor, INSERT/UPDATE pe propriile submissions/answers
- Notă: elevii NU pot vedea `custom_data` cu răspunsurile corecte — se va folosi un view sau o funcție RPC care filtrează câmpurile sensibile

### Logica de punctaj parțial (Edge Function: `grade-submission`)

1. **Quiz/TrueFalse/Match** — corect/incorect, punctaj binar
2. **Fill** — deja suportă variante multiple cu virgulă, punctaj per blank
3. **Order** — procent de linii în poziția corectă
4. **Problem (cod)** — două niveluri:
   - **Bază (toți)**: scor = (test_cases trecute / total) × punctaj. Plus bonus pentru output parțial corect (comparare linie cu linie)
   - **Premium profesor**: dacă scorul < 100%, trimite codul + soluția la Lovable AI (gemini-2.5-flash) pentru evaluare 0-100 cu feedback textual. Feedback-ul se salvează în `test_answers.feedback`

### Variante anti-fraudă

- **Shuffle automat**: aceleași itemi, ordine randomizată per elev. Varianta A/B se atribuie aleator la start
- **2 seturi manuale**: profesorul creează itemii cu `variant = 'A'` sau `variant = 'B'`. Itemii cu `variant = 'both'` apar în ambele

### Fluxul UI

**1. Creare test** (`src/pages/CreateTestPage.tsx`)
- 3 tab-uri: "Test predefinit" (alege din teste template), "Din baza de date" (browse capitole/lecții/probleme), "Întrebări custom" (editor inline)
- Configurare: titlu, limită timp, mod variante, punctaj per item
- Preview varianta A și B

**2. Distribuire** — din detaliul testului, buton "Distribuie" → alege clasa → setează deadline opțional

**3. Rezolvare test** (`src/pages/TakeTestPage.tsx`)
- Elevul primește varianta atribuită, timer vizibil, navigare între itemi
- Submit → grade-submission se invocă automat

**4. Rezultate** — profesorul vede nota fiecărui elev, poate vedea răspunsurile detaliate, feedback AI (dacă Premium)

### Fișiere noi/modificate

- Migrare: 5 tabele noi + RLS + view securizat
- `supabase/functions/grade-submission/index.ts` — edge function de notare
- `src/pages/CreateTestPage.tsx` — creare test
- `src/pages/TakeTestPage.tsx` — rezolvare test  
- `src/components/teacher/TestManager.tsx` — listă teste + distribuire
- `src/components/teacher/TestBuilder.tsx` — builder cu 3 moduri
- `src/components/teacher/TestResults.tsx` — vizualizare rezultate
- `src/hooks/useTests.ts` — queries + mutations
- `src/App.tsx` — rute noi
- `src/pages/TeacherPage.tsx` — link către teste

### Estimare complexitate
Aceasta este o funcționalitate mare (~15 fișiere, 5 tabele). Recomand implementarea în etape:
1. **Etapa 1**: Tabele + creare test din DB + distribuire + rezolvare cu notare automată (fără AI)
2. **Etapa 2**: Întrebări custom + teste predefinite
3. **Etapa 3**: AI review pentru Premium

