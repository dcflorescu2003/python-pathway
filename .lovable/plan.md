## Problemă

În `ProblemsEditor`, când admin-ul editează o problemă, câmpul „Rezolvare (cod Python)" apare gol pentru că `useProblems` nu selectează coloana `solution` din baza de date (aceasta e ascunsă elevilor și e accesată doar prin RPC `get_problem_solution` în pagina de rezolvare). La salvare, `solution: ""` din formular suprascrie rezolvarea reală din DB — deci orice editare a unei probleme șterge rezolvarea.

## Fix

În `src/components/admin/ProblemsEditor.tsx`:

1. **Fetch la deschiderea editorului**: modific `startEdit(p)` să facă un `select("solution").eq("id", p.id).single()` direct din tabelul `problems` (admin-ul are acces prin RLS) și să populeze `form.solution` cu valoarea reală înainte de afișarea formularului.
2. **Safety net la salvare**: dacă din orice motiv `form.solution` e gol la `saveProblem` pe un edit existent, nu includ câmpul `solution` în payload-ul de `update` — evită overwrite accidental.

Nicio schimbare de schemă, RLS, RPC sau UI vizibil elevilor. Modificarea e strict în editorul admin.