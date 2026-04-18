

## Diagnostic

Pagina `/probleme` afișează gol pentru conturi noi, dar conține date pentru conturi vechi. Verific din cod și RLS:

**Cauza probabilă**: `useProblems.ts` interogheză `problems_public` (un view), dar în `<supabase-tables>` văd doar tabela `problems` cu policy SELECT pentru `{authenticated}`. Pentru conturi noi, sesiunea poate să nu fie încă propagată complet la primul fetch (race condition cu `useAuth`), iar React Query cache-uiește rezultatul gol cu `staleTime: 1h` → utilizatorul nu mai vede niciodată problemele decât după refresh manual sau o oră.

În plus, view-ul `problems_public` nu apare în lista de tabele/RLS expusă, deci e posibil să fie un view fără `security_invoker` sau cu permisiuni implicite care eșuează silentios pentru utilizatori abia creați.

## Verificări necesare (în mod default după aprobare)

1. Confirm cu `supabase--read_query` că view-ul `problems_public` există și ce întoarce pentru un user authenticated.
2. Verific dacă `problem_chapters` se încarcă corect (capitolele apar?) sau și ele lipsesc — îmi spune dacă e problemă RLS sau doar la `problems_public`.
3. Verific dacă există vreo dependență de `is_premium` sau `school_id` care ar filtra rândurile.

## Soluție propusă

### A. Cache mai sigur în `useProblems.ts`
- Reduc `staleTime` de la 1h la 5min pentru a evita blocarea unui rezultat gol cache-uit.
- Adaug `enabled: !!user` ca query-ul să nu ruleze înainte ca sesiunea să fie disponibilă.
- Adaug `retry: 2` pentru a recupera din race conditions tranzitorii.

### B. Fallback pe tabela `problems` directă
Dacă view-ul `problems_public` are probleme de permisiuni, schimb fetch-ul pe `problems` (care are RLS clar: `Authenticated users can read problems`). Selectez explicit toate coloanele necesare **fără `solution`** (rămâne pe RPC `get_problem_solution`).

### C. Refetch la focus
Adaug `refetchOnWindowFocus: true` și `refetchOnMount: "always"` pe pagina Probleme pentru conturi noi care intră imediat după signup.

### Fișiere modificate

| Fișier | Schimbare |
|---|---|
| `src/hooks/useProblems.ts` | `enabled: !!user`, `staleTime: 5min`, `retry: 2`, fallback pe `problems` direct (fără coloana `solution`) |

### Pași
1. Rulez query SQL pentru a confirma cauza exactă (view vs tabel, RLS).
2. Aplic fix-ul minim necesar bazat pe ce găsesc.

