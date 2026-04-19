

## Diagnoză

Userul a editat conținut în admin (ex: cerințe lecții cu **bold**, culori), dar online (în lecții/probleme) nu vede modificările. În preview/dev funcționa.

### Cauze posibile (în ordine de probabilitate)

**1. Cache React Query agresiv** — `useExerciseStore`, `useChapters`, `useProblems` etc. au probabil `staleTime` mare sau cache local (localStorage) care servește date vechi. Vezi `mem://technical/persistence-strategy`: „cache de 5 minute" — deci după edit în admin, online vede vechi până la expirare/refresh.

**2. Lipsă invalidare după mutație în admin** — `ExerciseEditor` / `ContentEditor` salvează în Supabase dar nu apelează `queryClient.invalidateQueries` pentru cheile folosite în paginile publice (`["exercises"]`, `["lessons"]`, `["problems"]`).

**3. Snapshot local fallback** — `getStoredChapters()` (folosit în `ChapterTheoryPage`) și `useExerciseStore` citesc din `localStorage` când Supabase răspunde gol; dacă snapshot-ul e vechi, suprascrie datele proaspete.

**4. NU e problemă de RLS** — `exercises`, `lessons`, `problems` au policy „Authenticated users can read" → admin logat citește OK.

**5. NU e problemă de realtime** — fix-ul cu `supabase_realtime` din stack-overflow NU e necesar; un simplu refetch la focus + invalidare la save rezolvă.

### Investigare necesară (înainte să propun fix)

Trebuie să verific:
- `src/hooks/useExerciseStore.ts` — staleTime, structură cache, fallback localStorage
- `src/hooks/useChapters.ts`, `useProblems.ts`, `useManualLessons.ts` — staleTime + refetch policy
- `src/components/admin/ExerciseEditor.tsx` și `ContentEditor.tsx` — ce invalidări fac după save
- `src/pages/ChapterPage.tsx` / `LessonPage.tsx` — cum consumă datele

### Plan reparare (după inspecție)

1. **Reduc `staleTime` pe queries publice de conținut** la `0` (sau max 30s), păstrez `gcTime` mare → afișare instant a editărilor
2. **Activez `refetchOnWindowFocus: true`** pentru hook-urile de conținut (lessons/exercises/problems/chapters) → când admin revine din tab admin, datele se reîmprospătează
3. **Invalidare explicită după save în admin** — în `ExerciseEditor`, `ContentEditor`, `ProblemsEditor`, `ManualEditor`: `queryClient.invalidateQueries({ queryKey: ["exercises"] })` etc.
4. **Bust cache local snapshot** la save — `localStorage.removeItem("pyro-chapters-snapshot")` (sau echivalent) când admin modifică conținut, ca să nu se servească snapshot vechi
5. **Buton „Reîmprospătează" în AdminPage** (opțional) — invalidează tot cache-ul de conținut manual

### Ce voi face în următoarea fază (default mode)

Inspectez fișierele de mai sus, identific cheile React Query exacte și cache-urile localStorage, apoi aplic fix-urile minime care păstrează performanța dar fac editările vizibile imediat (max 1-2 secunde de propagare).

### Fișiere probabile de modificat (estimare)

- `src/hooks/useExerciseStore.ts`
- `src/hooks/useChapters.ts`
- `src/hooks/useProblems.ts`
- `src/hooks/useManualLessons.ts`
- `src/components/admin/ExerciseEditor.tsx`
- `src/components/admin/ContentEditor.tsx`
- `src/components/admin/ProblemsEditor.tsx`
- `src/components/admin/ManualEditor.tsx`

Nu modific RLS, nu activez realtime (overkill).

