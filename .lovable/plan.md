

## Plan: Auto-selectare clasa in TestResults cand se vine din ClassDetail

### Ce se schimba

Cand profesorul apasa "Rezultate" pe un test din pagina clasei (ClassDetail), TestResults va primi `classId`-ul si va pre-selecta automat assignment-ul corespunzator clasei respective, eliminand pasul manual de selectie.

### Implementare

**File: `src/components/teacher/TestResults.tsx`**

1. Adauga prop optional `initialClassId?: string` la interfata `TestResultsProps`
2. In `useEffect` (nou), cand `assignments` se incarca si `initialClassId` este setat, gaseste assignment-ul care are `class_id === initialClassId` si seteaza `selectedAssignmentId` automat

**File: `src/components/teacher/ClassDetail.tsx`**

1. La renderarea `<TestResults>` (linia ~126), adauga prop-ul `initialClassId={classId}` -- clasele deja au `classId` disponibil ca prop

### Fisiere modificate

| Fisier | Modificare |
|--------|-----------|
| `src/components/teacher/TestResults.tsx` | Prop `initialClassId` + auto-select assignment |
| `src/components/teacher/ClassDetail.tsx` | Transmite `initialClassId={classId}` la TestResults |

### Fara migrari DB

