# Filtru „Inactivi 14+ zile” în Admin

## Ce se adaugă

În lista de utilizatori din Admin (tabul unde există deja filtrele Premium / Free / Plătit / Cupon / Profesori) apare o opțiune nouă:

- **Inactivi 14+ zile** — arată doar utilizatorii care nu au avut nicio activitate în ultimele 14 zile (inclusiv cei care nu au fost activi niciodată).

Pentru fiecare rând se afișează în plus:

- data ultimei activități;
- numărul de zile de inactivitate (ex. „21 zile”).

Contorul de rezultate rămâne același („X din Y”), astfel încât să vezi imediat câți utilizatori sunt inactivi.

## Detalii tehnice

- `supabase/functions/admin-list-users/index.ts`: filtru nou `inactive14` aplicat pe `profiles.last_activity_date < (azi - 14 zile)` (cu `or(last_activity_date.is.null)` dacă apar valori lipsă), aplicat înainte de paginare ca să rămână corecte `total` și ordinea. Se adaugă `last_activity_date` în lista de coloane selectate și în răspunsul per utilizator.
- `src/components/admin/UsersManager.tsx`: `SelectItem value="inactive14"` cu eticheta „Inactivi 14+ zile”, plus afișarea ultimei activități și a numărului de zile de inactivitate în rândul utilizatorului.
- Ordonare: pentru acest filtru, lista se sortează crescător după `last_activity_date` (cei mai inactivi primii).
- Nicio schimbare de schemă sau RLS; totul rămâne read-only prin edge function-ul existent, care verifică deja rolul de admin.
