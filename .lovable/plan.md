

# Plan: Reordonare probleme și capitole de probleme (drag-and-drop)

## Ce facem
Adăugăm drag-and-drop reordering în `ProblemsEditor` — atât pentru capitolele de probleme, cât și pentru problemele din fiecare capitol. Urmăm exact pattern-ul existent din `ContentEditor` (care folosește `@dnd-kit`).

## Modificări

### 1. Migrare DB — coloane `sort_order`
```sql
ALTER TABLE public.problem_chapters ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.problems ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
```

### 2. `src/hooks/useProblems.ts`
- Adăugăm `sort_order` pe interfețele `Problem` și `ProblemChapter`
- Sortăm rezultatele după `sort_order` ascendent în `fetchProblems`

### 3. `src/components/admin/ProblemsEditor.tsx`
- Import `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (deja instalate în proiect)
- Creăm componente `SortableProblemChapter` și `SortableProblem` (identic ca pattern din ContentEditor)
- Adăugăm `DndContext` + `SortableContext` pentru lista de capitole
- Adăugăm `DndContext` + `SortableContext` pentru lista de probleme din fiecare capitol expandat
- Handler-ele `onDragEnd` fac `arrayMove` + update `sort_order` în DB via `supabase.from("problem_chapters").update(...)` / `supabase.from("problems").update(...)`
- Adăugăm iconița `GripVertical` pe fiecare element sortabil

## Detalii tehnice
- Pattern identic cu cel din `ContentEditor` — `SortableChapter` / `SortableLesson`
- `@dnd-kit` e deja instalat, nu trebuie dependențe noi
- Salvarea ordinii se face instant la `onDragEnd` (batch update pe fiecare element cu noul `sort_order`)

