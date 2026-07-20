## Problema

Un elev a răspuns corect la un item quiz din bancă (a selectat opțiunea `a` = „7"), profesorul vede răspunsul evidențiat ca fiind cel corect (✓), dar punctajul apare `0/10`.

Am investigat în baza de date:
- Submisia `76a07a4c…` are `submitted_at` setat, dar `status = 'in_progress'`, `auto_graded = false`, `total_score = 0`.
- Toate cele 10 răspunsuri au `score = 0`, deși comparate manual sunt corecte (`answer_data.selected` = `correct_option_id`).

Concluzie: **funcția `grade-submission` nu a rulat niciodată până la capăt pentru această submisie** (probabil pierdere de rețea la finalul testului sau eșec pe calea `sendBeacon`, care nu poate atașa `Authorization` și primește 401). Logica quiz din grader este corectă — problema e că notarea nu a fost declanșată. Rămân submisii „orfane" cu 0 puncte până când cineva le renotează manual.

## Ce vom construi

1. **Buton „Renotează" în pagina de rezultate a profesorului** (`TestResults.tsx`)
   - Apare lângă fiecare submisie care are `submitted_at` setat dar `auto_graded = false` (sau `total_score = 0 && max_score = 0`).
   - Invocă `grade-submission` cu `submission_id`.
   - Rulează cu tokenul profesorului, deci trece de verificarea `Authorization`.

2. **Permite grader-ului să fie invocat de profesor**
   - În `supabase/functions/grade-submission/index.ts`, verificarea actuală respinge orice caller care nu este `student_id`. Extindem verificarea: acceptă și profesorul testului (`tests.teacher_id`) pentru cazul de renotare manuală.
   - Restul logicii rămâne neschimbat (folosește deja service role pentru citiri).

3. **Auto-retry la deschiderea rezultatelor**
   - Când profesorul deschide un submission expandat care e `submitted_at IS NOT NULL` și `auto_graded = false`, apelăm automat `grade-submission` o singură dată în background și reîncărcăm răspunsurile.

4. **Repară submisia existentă**
   - Migrație one-shot: pentru submisia `76a07a4c-b508-4826-88c8-7590be65c9a9`, seta `status = 'submitted'` (rămâne `auto_graded = false` până când profesorul apasă „Renotează").
   - Nu recalculăm scorurile în SQL — le lăsăm pe grader să le facă via butonul nou (păstrează consistența cu logica AI / office_points).

## Detalii tehnice

- `TestResults.tsx`: adăugăm în cardul submisiei un mic buton `RotateCcw` „Renotează" ce apelează `supabase.functions.invoke("grade-submission", { body: { submission_id } })` și apoi `qc.invalidateQueries` pentru answers + submissions.
- `grade-submission/index.ts`, blocul de la liniile 58–69: după `owner` check, dacă `callerId !== student_id`, verificăm dacă `callerId` e profesorul testului (`tests.teacher_id`) și abia apoi întoarcem 403.
- Nu modificăm fluxul studentului sau logica de grading pentru quiz/fill/etc — a fost confirmată corectă.

## Ce NU facem

- Nu schimbăm `gradeExercise` (quiz-ul e corect).
- Nu atingem fluxul `sendBeacon` (subiect separat, mai riscant).
- Nu forțăm renotarea automată din edge function fără trigger explicit.
