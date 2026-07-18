# Numerotare alfabetică vizibilă și persistentă

## Obiective
1. În `TakeTestPage`, elevul vede clar numărul lui în clasă (ex. „Nr. 7 — Varianta A") înainte și în timpul testului.
2. Numărul și varianta rămân salvate în baza de date pe `test_submissions`, ca să poți vedea alocările per clasă și sesiune (inclusiv istoric).
3. Profesorul are o listă cu alocările pentru fiecare test (număr, elev, variantă, stare).

## Ce se schimbă

### 1. Bază de date
- Adaug coloana `roster_number` (integer) pe `test_submissions` — poziția alfabetică 1‑based în clasă la momentul începerii testului.
- Extind RPC `get_assigned_variant_for_student` → devine `get_assigned_slot_for_student(p_assignment_id)` care întoarce `{ variant: 'A'|'B', roster_number: int }`. Păstrez și vechiul RPC ca wrapper pentru compatibilitate.
- Adaug RPC `get_test_roster_allocations(p_assignment_id)` (SECURITY DEFINER) — doar profesorul testului sau admin: întoarce lista `{ student_id, display_name, roster_number, variant, status, submitted_at }` sortată după `roster_number`. Combină rosterul clasei cu submissions existente; pentru elevii care încă n‑au deschis testul, calculează on‑the‑fly numărul și varianta după aceeași regulă.

### 2. TakeTestPage (elev)
- La pornirea/reluarea testului, apelez noul RPC și primesc `{ variant, roster_number }`.
- La `startSubmission` trimit și `roster_number` ca să fie salvat.
- Afișez un badge vizibil sub titlul testului: „Ești elevul **nr. 7** • Varianta **A**". Pentru submissions vechi fără număr, arăt doar varianta.

### 3. Vizualizare profesor
- În pagina cu detaliile unui assignment (unde profesorul vede submissions), adaug un tab / secțiune „Alocări" care listează toți elevii clasei cu numărul și varianta atribuite, plus starea (neînceput / în curs / întrerupt / trimis).
- Export CSV simplu (buton) pentru catalog.

## Detalii tehnice

- Migrație: `ALTER TABLE test_submissions ADD COLUMN roster_number INTEGER;` (nullable pentru istoricul existent).
- `startSubmission` (hook în `useTeacher`/wherever) primește parametrul `roster_number` și îl scrie odată cu `variant`.
- `get_test_roster_allocations` folosește același `row_number() OVER (ORDER BY lower(unaccent(...)) )` ca RPC-ul existent, ca numerotarea afișată profesorului să fie identică cu cea a elevului.
- Politica pentru RPC nou: verifică `tests.teacher_id = auth.uid() OR has_role(auth.uid(),'admin')`.

## Ce NU se schimbă
- Regula de alocare A/B rămâne aceeași (par → A, impar → B, alfabetic după `last_name` apoi `display_name`).
- Submissions vechi rămân cu `roster_number = NULL` (afișate ca „—" în vizualizarea profesorului).
