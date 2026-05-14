## Cauză

Eroarea reală din Postgres: `invalid input syntax for type integer: "7.5"`.

Coloana `predefined_test_items.points` (și foarte probabil și `test_items.points`) este `integer`, dar în UI ai introdus un punctaj cu zecimale (ex. `7.5`). Inserția pică, iar `catch` din `PredefinedTestEditor.handleSave` afișează doar mesajul generic „Eroare la salvare.", fără să spună de ce. Reutilizarea itemilor din bancă nu este cauza — `addItem` deja blochează duplicatele și nu există constrângere de unicitate la nivel DB.

## Fix propus

1. **Migrație DB** — schimb tipul coloanelor `points` și `max_points` din `integer` în `numeric(6,2)` pe tabelele relevante:
   - `predefined_test_items.points`
   - `test_items.points`
   - `test_answers.score`, `test_answers.max_points`
   - `test_submissions.total_score`, `test_submissions.max_score`
   - `tests.office_points`
   
   Numericul păstrează compatibilitate înapoi (orice `int` se citește OK ca `numeric`).

2. **UI** — în `PredefinedTestEditor.tsx` (și, pentru consistență, în `TestBuilder.tsx`):
   - input-ul de punctaj să accepte `step="0.5"` (sau `0.25`)
   - în `catch (e)`, afișez mesajul real: `toast.error(e?.message || "Eroare la salvare.")` ca să nu mai pierdem cauza data viitoare.

3. **Verificare** — refac salvarea cu un item de 7.5 puncte și confirm că trece, apoi verific că previzualizarea afișează corect totalul.

## Alternativă (mai simplă, dacă vrei să rămână întreg)

Dacă preferi să forțezi punctaje întregi:
- păstrăm DB integer
- în UI rotunjim la `Math.round(points)` înainte de salvare și punem `step="1"` + `min="1"` pe input
- îmbunătățim oricum `catch`-ul cu mesajul real

Spune-mi care variantă preferi și implementez.