## Tagging microcompetențe înainte de salvare la probleme

La lecții (`ExerciseEditor.tsx`), ID-ul exercițiului se generează la deschiderea formularului, deci `CompetencyTagger` poate fi folosit imediat. La probleme, ID-ul se generează abia în `saveProblem`, așa că taggerul afișează „Salvează problema, apoi revino aici…”.

### Modificări în `src/components/admin/ProblemsEditor.tsx`

1. **Generează ID-ul la creare**: `emptyProblem(chapterId)` returnează acum și un `id` precompletat (`p-${Date.now()}-${rand}`). Tipul devine `Problem` (cu id), nu `Omit<Problem, "id">`.

2. **Pasează ID-ul la `CompetencyTagger`**:
   - Schimbă `itemId={editingProblem}` → `itemId={form.id}` (existent atât la creare, cât și la editare).
   - Elimină `emptyHint` (nu mai e nevoie).

3. **Folosește ID-ul existent la salvare**:
   - În `saveProblem`, ramura de creare folosește `form.id` în loc de `p-${Date.now()}`. Astfel mapările deja atașate rămân legate de problema nouă.

4. **Cleanup la anulare** (ca la lecții):
   - În handler-ul „Anulează” pentru o problemă nouă (`creatingFor && !editingProblem`), rulează `supabase.from("item_competencies").delete().eq("item_type", "problem").eq("item_id", form.id)` best-effort.

### Ce nu se schimbă
- Schema DB, RLS, hook-urile `useCompetencies` — toate rămân identice.
- Editarea unei probleme existente funcționează deja, doar că acum și varianta de creare se aliniază.

### Fișiere atinse
- `src/components/admin/ProblemsEditor.tsx`