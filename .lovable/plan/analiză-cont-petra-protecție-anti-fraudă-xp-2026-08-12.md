# Analiză cont „Petra" + protecție anti-fraudă XP

## Concluzia analizei (date verificate în baza de date)

Contul Petra Berindea (creat 8 aug 2026, profesor verificat, Premium) are 7909 XP. Am verificat activitatea reală:

- 374 înregistrări de finalizare, toate distincte: 133 lecții (din 203 existente) și 241 probleme (din 373).
- Distribuție pe zile: 87 (8 aug), 91 (9 aug), 92 (10 aug), 62 (11 aug), 42 (12 aug), între orele 04:00 și 21:00.
- Interval mediu între finalizări: ~17 minute. Zero finalizări la mai puțin de 10 secunde una după alta; doar 6 sub 30 de secunde.
- XP așteptat din activitatea înregistrată: 2685 (lecții) + 5345 (probleme) = 8030. XP real în profil: 7909, adică ușor mai mic — consistent cu regula „fără XP la reluarea unei probleme deja rezolvate".

**Nu există semne de fraudă.** XP-ul corespunde activității efective, iar ritmul (un profesor care parcurge intensiv curriculumul de clasa a IX-a, ~90 itemi/zi la scoruri de 96-99%) este plauzibil pentru cineva care știe deja Python.

## Riscul real descoperit

Deși acest cont e curat, sistemul **permite** trișarea trivială: politica RLS „Users can update their own profile" lasă orice utilizator autentificat să scrie direct coloanele `xp`, `streak`, `best_streak` din profil. Triggerul existent `protect_profile_privileged_columns` protejează doar `is_premium`, `is_teacher`, `teacher_status`. Un utilizator cu tokenul din browser poate seta `xp = 999999` printr-un singur apel.

De asemenea, `completed_lessons` acceptă INSERT/UPDATE direct din client cu orice `lesson_id` și `score`, fără validare că lecția există sau că scorul e plauzibil.

## Ce propun să construim

1. **Blocarea scrierii directe pe XP**
  - Extinderea triggerului `protect_profile_privileged_columns` astfel încât `xp`, `streak`, `best_streak` să nu mai poată fi modificate direct de client (se păstrează valoarea veche), cu excepția adminilor și a funcțiilor server marcate ca de încredere.
2. **Funcție server pentru acordarea XP** (`award_progress`, SECURITY DEFINER)
  - Primește `lesson_id`/`problem-<id>` și scorul; verifică pe server că itemul există, calculează XP-ul din `lessons.xp_reward` / `problems.xp_reward`, refuză XP la reluare, scrie `completed_lessons` și incrementează `profiles.xp` atomic.
  - Frontend-ul (`useProgress.ts`, `LessonPage`, `ManualLessonPage`, `ProblemSolvePage`) apelează această funcție în loc să scrie direct XP-ul.
3. **Validare pe `completed_lessons**`
  - Trigger care respinge `lesson_id` inexistent și scoruri în afara intervalului 0-100, plus blocarea rescrierii scorului în sus fără trecere prin funcția server.
4. **Detecție pentru admin (tab Statistici)**
  - Un card „Semnale suspecte": conturi unde XP-ul din profil diferă de XP-ul calculat din activitate cu peste 10%, conturi cu peste N finalizări/oră sau cu intervale sub 10 secunde între itemi. Astfel viitoarele anomalii se văd imediat, fără interogări manuale.

## Detalii tehnice

- Migrare SQL: `ALTER FUNCTION protect_profile_privileged_columns` (adaugă xp/streak/best_streak, cu bypass prin `app.bypass_profile_protection`), funcție nouă `public.award_progress(p_item_id text, p_score int)` cu `SECURITY DEFINER` și `search_path=public`, trigger `validate_completed_lesson` pe `completed_lessons` (BEFORE INSERT OR UPDATE).
- `award_progress` face UPSERT pe `completed_lessons` (constrângerea unică existentă user_id+lesson_id) și `UPDATE profiles SET xp = xp + delta` în aceeași tranzacție; returnează XP-ul acordat pentru afișarea în UI.
- Frontend: `src/hooks/useProgress.ts` rămâne sursa unică — se înlocuiesc scrierile directe de XP cu `supabase.rpc("award_progress", ...)`; logica offline/retry existentă se păstrează (coada de sincronizare apelează RPC-ul la revenire online).
- Admin: extindere `admin_get_stats` cu o secțiune `anomalies` și un card nou în `src/components/admin/StatsDashboard.tsx`.
- Fără modificări asupra XP-ului existent al conturilor; nu se resetează nimic pentru Petra, activitatea ei fiind validă.

Mai vreau ca daca in sectiunea de pribleme cineva apasa pe rezolvare, sa se marcheze cumva ca rezolvata pentru user si sa primeasca 1 xp pentru ca a apelat la rezolvare

&nbsp;