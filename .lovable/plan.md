

## Sortare alfabetică elevi după nume + format „Nume Prenume"

### Context

`display_name` din `profiles` e folosit în 4 locuri pentru afișarea elevilor unei clase: ClassDetail (Elevi + Provocări expanse), TestResults (rezultate teste), ClassAnalytics (charts/leaderboard). Datele vin neordonate din DB.

Format dorit: utilizatorul își introduce numele ca **„Nume Prenume" (ex: Popescu Andrei)**, iar listele sunt sortate alfabetic după numele complet (care începe cu numele de familie).

### Modificări

**1) `src/components/account/StudentTab.tsx`** (intrare nume catalog elev)
- Schimb placeholder-ul Input-ului din linia 225: `"Prenume Nume"` → `"Nume Prenume (ex: Popescu Andrei)"`
- Adaug sub input un `<p className="text-[10px] text-muted-foreground">` cu hint: „Folosește formatul Nume Prenume pentru a apărea corect sortat în catalog."

**2) `src/components/account/TeacherWizard.tsx`** (intrare nume profesor în wizard)
- Verific și actualizez placeholder-ul/hint-ul pentru `fullName` cu același format „Nume Prenume".

**3) Helper de sortare partajat** — creez `src/lib/sortStudents.ts`:
```ts
export function sortByDisplayName<T extends { profile?: { display_name?: string | null } | null }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const nameA = (a.profile?.display_name || "Elev").trim();
    const nameB = (b.profile?.display_name || "Elev").trim();
    return nameA.localeCompare(nameB, "ro", { sensitivity: "base" });
  });
}
```

**4) `src/components/teacher/ClassDetail.tsx`**
- Sortez `members` alfabetic înainte de toate randările (Elevi list + per-student status în Provocări):
  ```ts
  const sortedMembers = useMemo(() => sortByDisplayName(members), [members]);
  ```
- Înlocuiesc toate `members.map(...)` cu `sortedMembers.map(...)` (linia 138 + linia 254). Și `members.filter(...)` din `completedCount` (linia 199) → `sortedMembers.filter(...)`.

**5) `src/components/teacher/TestResults.tsx`**
- Sortez `submissions` alfabetic înainte de afișare și export CSV/PDF:
  ```ts
  const sortedSubmissions = useMemo(() => sortByDisplayName(submissions), [submissions]);
  ```
- Folosesc `sortedSubmissions` în: render list (linia 390), `exportTestCSV` (linia 200), `exportTestPDF` (liniile ~274, 287).

**6) `src/components/teacher/ClassAnalytics.tsx`**
- Sortez datele studenților alfabetic în chart-uri/leaderboards (linia ~327 unde se construiește `name: m.profile?.display_name`). Sortare doar pentru afișări care listează elevi pe nume (NU pentru ranking-uri pe scor — acestea rămân sortate după performanță).

### Note
- `localeCompare("ro", { sensitivity: "base" })` ignoră diacriticele și majuscule/minuscule (Ăndrei = Andrei).
- Nu e nevoie de migrare DB — formatul e doar o convenție UI; istoric se sortează corect oricum.
- Numele existente care nu respectă formatul (ex: „Andrei Popescu") se vor sorta după primul cuvânt, ca până acum — nu spargem nimic, doar îndrumăm utilizatorii noi.

### Fișiere modificate (5) + 1 nou
- `src/lib/sortStudents.ts` (nou)
- `src/components/account/StudentTab.tsx`
- `src/components/account/TeacherWizard.tsx`
- `src/components/teacher/ClassDetail.tsx`
- `src/components/teacher/TestResults.tsx`
- `src/components/teacher/ClassAnalytics.tsx`

