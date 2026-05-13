## Plan

Voi corecta problema din admin unde importul CSV confirmă 15 exerciții salvate, dar lista lecției afișează doar 13.

### Ce voi schimba

1. **Fix pentru bucla de render din `CsvLessonImporter`**
   - `competencyAggregate` este recalculat ca array nou la fiecare render și declanșează `useEffect` continuu.
   - Voi stabiliza dependențele ca să dispară warning-ul `Maximum update depth exceeded`.

2. **Fix pentru afișarea incompletă după import**
   - Cererea de insert salvează toate cele 15 rânduri, dar refetch-ul imediat + starea de expand/collapsible poate afișa o listă incompletă sau stale.
   - Voi ajusta `useChapters` să grupeze și să sorteze exercițiile explicit per lecție, nu doar să se bazeze pe ordinea globală din query.
   - După import, voi face invalidare/refetch mai robustă pentru query-ul `chapters`, astfel încât lecția să afișeze toate exercițiile salvate.

3. **Mesaj de succes bazat pe rândurile confirmate**
   - Pentru importul de exerciții într-o lecție, voi cere backend-ului să returneze rândurile inserate (`select`) și voi afișa numărul confirmat, nu doar numărul din preview.
   - Dacă există diferență între preview și salvare, utilizatorul va primi mesaj clar.

### Fișiere vizate

- `src/components/admin/CsvImporter.tsx`
- `src/components/admin/CsvLessonImporter.tsx`
- `src/hooks/useChapters.ts`

### Rezultat așteptat

După import, dacă preview-ul spune 15 importabile, lecția va afișa 15 exerciții, fără warning-ul de `Maximum update depth exceeded`.