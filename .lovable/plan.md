## Diagnostic

Am confirmat în DB: problema `gs38` („Cele mai bune valori generate") **are** rezolvarea salvată (467 caractere). Deci salvarea funcționează — problema e la **încărcarea** soluției în editor.

În `startEdit` (`ProblemsEditor.tsx`), fetch-ul soluției face un `select("solution")` direct pe tabelul `problems`. Dacă apelul returnează eroare (sau soluția e filtrată de vreo politică/masking pe coloană în cache-ul PostgREST), eroarea e înghițită silențios de `if (!solErr && solData)`, iar `form.solution` rămâne "" — deci câmpul apare gol la editare.

## Fix

În `src/components/admin/ProblemsEditor.tsx`:

1. **Înlocuiesc select-ul direct cu RPC-ul existent** `get_problem_solution` (același folosit deja în `ProblemSolvePage` și care returnează soluția prin SECURITY DEFINER — garantat accesibil).
2. **Loghez erorile** (`console.error`) în loc să le înghit tăcut, ca să pot depana viitoare regresii.
3. Păstrez safety-net-ul de la salvare (`if (editingProblem && !form.solution.trim()) delete row.solution`) — deci chiar dacă fetch-ul ar eșua din nou, salvarea nu suprascrie soluția existentă cu string gol.

Nicio schimbare de schemă, RLS sau UI vizibil elevilor. Modificarea e strict în editorul admin.