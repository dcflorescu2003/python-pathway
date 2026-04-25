## Obiectiv

1. **Tracking competențe din testele profesorilor** — la finalul `grade-submission`, înregistrăm scorurile per item în `student_competency_scores` cu pondere **×1.5** (testele cântăresc 60% vs 40% pentru exerciții/probleme, raport 3:2 ⇒ multiplicator 1.5 pentru testele profesorului).
2. **Sursa scorului** — separăm contribuția testelor de cea a auto-învățării și permitem profesorului să comute între moduri în profilul elevului.

## Calcul ponderii (60/40)

Pentru a respecta raportul 60% teste / 40% lecții pe agregare:
- Scorurile din **exerciții, probleme, exerciții manuale, eval** se înregistrează cu `weight × 1.0` (cum este acum).
- Scorurile din **`test_item` și `predefined_test_item`** se înregistrează cu `weight × 1.5` (=3/2). Astfel, dacă un elev face același „volum" în teste vs auto-învățare, contribuția testelor în media ponderată ajunge la 1.5/(1+1.5) = 60%.

Stocăm **separat** sumele „teste" vs „self" pentru a permite filtrarea/toggle în UI fără a sacrifica datele.

## Modificări DB (migration)

1. **`student_competency_scores`**: adăugăm 4 coloane noi:
   - `test_score_sum NUMERIC NOT NULL DEFAULT 0`
   - `test_max_sum NUMERIC NOT NULL DEFAULT 0`
   - `self_score_sum NUMERIC NOT NULL DEFAULT 0`
   - `self_max_sum NUMERIC NOT NULL DEFAULT 0`
   
   Coloanele existente `score_sum`/`max_sum` rămân (= self + 1.5×test) pentru compatibilitate.

2. **`recalculate_competency_scores(p_user_id, p_items)`** actualizat:
   - Acceptă `item_type ∈ {exercise, manual_exercise, eval_exercise, problem, test_item, predefined_test_item}`.
   - Pentru `test_item`/`predefined_test_item` aplică multiplicator 1.5 la `score_sum`/`max_sum` și incrementează `test_*` (cu valoarea brută).
   - Pentru celelalte: incrementează `self_*` și `score_sum`/`max_sum` (1×).

3. **`get_student_competency_profile(p_user_id, p_mode TEXT DEFAULT 'blended')`** — al doilea parametru:
   - `'blended'` → folosește `score_sum`/`max_sum` (60/40, ce e azi).
   - `'tests_only'` → folosește `test_score_sum`/`test_max_sum` (brut, fără multiplicator).
   - `'self_only'` → folosește `self_score_sum`/`self_max_sum`.

4. **Backfill**: pentru rândurile existente, copiem `score_sum`→`self_score_sum`, `max_sum`→`self_max_sum` (toate provin din auto-învățare până acum).

## Modificări backend (edge function)

**`supabase/functions/grade-submission/index.ts`** — după `update test_submissions`:
- Construim arrayul `items` din `answers` joinat cu `test_items`, mapând `source_type`:
  - `custom` → `item_type: 'test_item'`, `item_id: test_item.id` (UUID)
  - `predefined` → `item_type: 'predefined_test_item'`, `item_id: source_id`
  - `exercise`/`eval_exercise`/`problem`/`manual_exercise` → `item_type: <source_type>`, `item_id: source_id`
- Apelăm `supabase.rpc('recalculate_competency_scores', { p_user_id: student_id, p_items: items })`.
- Eșec silențios (try/catch + log) — nu blochează grading-ul.

## Modificări frontend

1. **`CompetencyTagger`** — deja suportă `test_item` și `predefined_test_item` (verificat în `useCompetencies.ts`). Verificăm că este integrat în `TestBuilder` (pt. itemi custom) și `PredefinedTestEditor` (pt. itemi predefiniți). Dacă lipsește, îl adăugăm la editorul de item custom.

2. **`CompetencyProfileCard`** (elev) — fără schimbări (rămâne `blended`).

3. **Vedere profesor** — în `ClassDetail` (sau echivalent — locul unde profesorul vede un elev), adăugăm un nou card `StudentCompetencyView` cu:
   - Toggle (`Switch`/3 butoane): `Doar teste` / `Mediu (60/40)` / `Doar auto-învățare`
   - Default: `Doar teste` (cum a cerut userul).
   - Reutilizează vizualul din `CompetencyProfileCard` (drilldown CG → CS), dar trimite `p_mode` la RPC și folosește cheia query distinctă.
   - Acceptă `studentId` ca prop.

## Detalii tehnice

- Tipurile generate Supabase (`types.ts`) vor reflecta noul parametru `p_mode` automat după migration.
- Pentru itemii `custom` din `test_items`, mappingul în `item_competencies` folosește `item_id = test_items.id::text`. Politica RLS existentă „Teachers can insert competencies for own custom test items" permite deja acest lucru.
- Pentru `predefined_test_item`, `item_id = predefined_test_items.id::text`; admin-only management (RLS existent OK).
- `recordCompetencyScores` din `competencyTracking.ts` rămâne neschimbat (frontend trimite la fel; doar serverul aplică multiplicatorul).

## Ordine de implementare

1. Migration: schemă + RPC update + backfill.
2. Edge function `grade-submission`: apel RPC la finalul grading-ului.
3. UI profesor: card cu toggle în vederea elevului.
4. Verificare integrare `CompetencyTagger` în `TestBuilder` (item custom) + `PredefinedTestEditor`.