

# Plan: Tip nou de exercițiu — Asociere (Matching)

## Ce facem
Adăugăm un nou tip de exercițiu „match" unde utilizatorul vede 2 coloane de butoane (3-5 pe fiecare) și trebuie să asocieze fiecare element din stânga cu perechea corectă din dreapta.

## Modificări

### 1. Migrare DB — coloana `pairs` pe tabelul `exercises`
```sql
ALTER TABLE public.exercises ADD COLUMN pairs jsonb DEFAULT NULL;
```
Format: `[{ "id": "p1", "left": "len()", "right": "lungimea listei" }, ...]`

### 2. Tipuri — `src/hooks/useChapters.ts`
- Adaugă `"match"` la `ExerciseType`
- Adaugă `pairs?: { id: string; left: string; right: string }[]` la interfața `Exercise`
- În `mapExercise`, mapează `row.pairs`
- În `transformExercise`, adaugă un caz pentru `"match"` (de ex. transformă în quiz)

### 3. Componentă nouă — `src/components/exercises/MatchExercise.tsx`
- **State**: `selectedLeft: string | null`, `selectedRight: string | null`, `matchedPairs: Map<string, string>` (left→right)
- **Logică**: 
  - Click stânga → selectează; click dreapta → selectează; când ambele sunt selectate, se înregistrează perechea
  - Butoanele deja asociate devin inactive/colorate
  - Buton „Verifică" apare când toate perechile sunt formate
  - La verificare: compară `matchedPairs` cu `pairs` din exercițiu
- **UI**: 2 coloane (`grid grid-cols-2 gap-4`), butoane cu stil similar celorlalte exerciții, evidențiere la selecție, feedback corect/greșit per pereche

### 4. `src/pages/LessonPage.tsx`
- Import `MatchExercise`
- Adaugă `{exercise.type === "match" && <MatchExercise ... />}`

### 5. `src/components/admin/ExerciseEditor.tsx`
- Adaugă opțiunea `"match"` / `"Asociere"` în select-ul de tip
- `handleTypeChange` — inițializează cu 3 perechi goale
- `renderMatchFields()` — editor pentru perechi: 2 input-uri pe rând (stânga + dreapta), butoane de adăugare/ștergere

### 6. `useChapters.ts` — Fixare
- În `transformExercise`, cazul `"match"`: generează un quiz din prima pereche (ex: „Ce se asociază cu X?" cu opțiuni din valorile din dreapta)

## Detalii tehnice
- Coloanele din dreapta se afișează **amestecate** random la render
- Un buton selectat din stânga + un buton selectat din dreapta = o pereche formată (evidențiată cu aceeași culoare)
- Răspunsul e corect doar dacă **toate** perechile sunt corecte
- Minim 3, maxim 5 perechi (validat în editor)

