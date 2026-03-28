

# CRUD capitole de probleme în panoul admin

## Ce facem
Adăugăm în `ProblemsEditor` posibilitatea de a crea, edita și șterge capitole de probleme (`problem_chapters`), nu doar problemele din ele.

## Modificări

### Fișier: `src/components/admin/ProblemsEditor.tsx`

**1. State nou pentru editare/creare capitole:**
- `editingChapter: string | null` — ID-ul capitolului în editare
- `creatingChapter: boolean` — flag pentru formular capitol nou
- `chapterForm: { title: string; icon: string }` — formular capitol

**2. Buton „Adaugă capitol" la sfârșitul listei:**
- Afișează un formular inline cu câmpuri Title + Icon (emoji)
- La salvare: `supabase.from("problem_chapters").insert({ id: "pc-{timestamp}", title, icon, sort_order: chapters.length })`

**3. Butoane Edit/Delete pe header-ul fiecărui capitol (lângă chevron):**
- **Edit**: Deschide formular inline cu titlu + icon pre-populat, salvare via `.update()`
- **Delete**: `AlertDialog` de confirmare, cu ștergere în cascadă (șterge mai întâi problemele din capitol, apoi capitolul)

**4. Formular capitol (inline, similar cu cel de probleme):**
- Input titlu + Input icon (emoji)
- Butoane Salvează / Anulează

Nu sunt necesare modificări DB — tabelul `problem_chapters` are deja RLS corect pentru admin CRUD.

