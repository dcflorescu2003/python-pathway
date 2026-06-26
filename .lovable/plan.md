## Modificare

În `src/components/admin/ContentEditor.tsx`, la lista de exerciții dintr-o lecție (în jurul liniei 410), când utilizatorul apasă pe iconița Edit a unui exercițiu, formularul `ExerciseEditor` se va deschide **imediat sub acel exercițiu**, în loc să apară jos după toate întrebările.

## Pași

1. În map-ul exercițiilor (`lesson.exercises.map(...)` în `DndContext`), după fiecare `<SortableExercise>` se verifică dacă `editingExercise?.lessonId === lesson.id && editingExercise.exercise?.id === ex.id`. Dacă da, se randează `<ExerciseEditor ... />` chiar sub acel rând.

2. Blocul existent de sub listă (linia ~437) rămâne pentru cazul **adăugare exercițiu nou** (`editingExercise.exercise` este `undefined`). Pentru editare, nu se mai afișează acolo — se mută inline.

3. Butoanele de „Adaugă exercițiu", CSV import etc. rămân neschimbate.

Nu se modifică logica de salvare, ștergere sau reordonare — doar locul de randare al editorului pentru editări existente.