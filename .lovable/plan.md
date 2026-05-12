## Restructurare tab-uri TestBuilder

Reorganizez bara de surse din `src/components/teacher/TestBuilder.tsx` într-o structură cu 3 tab-uri principale, fiecare cu sub-tab-uri unde e cazul. Toată logica de adăugare item, preview, limite AI, etc. rămâne neschimbată — doar layout-ul tab-urilor se modifică.

### Structura nouă

```
[ Banca testare ] [ Publice ] [ Custom ]
       │              │            │
       │              │            └── editor întrebări custom (cel actual)
       │              │
       │              ├── Exerciții (din lecțiile publice — actualul tab "Exerciții")
       │              └── Probleme  (din capitolele publice — actualul tab "Probleme")
       │
       ├── Teste     (testele predefinite — actualul tab "Predefinite")
       ├── Exerciții (toate exercițiile din eval bank, filtrate pe capitol)
       └── Probleme  (toate exercițiile cu type="problem" din eval bank, filtrate pe capitol)
```

### Comportament pentru "Banca testare"

- Sub-tab **Teste**: identic cu actualul "Predefinite" (lista `predefinedTests` cu butonul Duplică). Disponibil doar pentru profesori verificați (păstrăm gating-ul actual `teacherStatus === "verified"`); pentru ceilalți afișăm un mesaj scurt că e necesară verificarea.
- Sub-tab **Exerciții**: select cu capitolele din `eval_chapters`. La selecție, se afișează *toate* exercițiile din toate lecțiile capitolului ales unde `type !== "problem"` (quiz, truefalse, fill, order, match, open_answer). Preview cu același `renderExercisePreview`. Adăugare prin `addItem("exercise", ev.id)` (același flux ca azi pentru itemii `eval-*`).
- Sub-tab **Probleme**: select cu capitolele din `eval_chapters`. Listă cu exercițiile din capitol unde `type === "problem"`. Adăugare prin `addItem("problem", ev.id)`. Preview cu `renderProblemPreview` (cache-ul `evalItemsCache` deja gestionează asta).

### Comportament pentru "Publice"

- Sub-tab **Exerciții**: identic cu actualul "Exerciții" (select pe `chapters` din `useChapters`, lecții collapsible, exerciții din `lesson.exercises`).
- Sub-tab **Probleme**: identic cu actualul "Probleme" (select pe `problemChapters`, listă `filteredProblems`).

### Comportament pentru "Custom"

Identic cu actualul tab "Custom" — editor de întrebări custom.

### Detalii tehnice

**Fișiere modificate**
- `src/components/teacher/TestBuilder.tsx` — singura modificare. Înlocuiesc blocul `<Tabs>` curent (liniile ~684-cap fișier pentru selectorul de surse) cu `<Tabs>` exterior (3 valori: `bank` / `public` / `custom`) și `<Tabs>` interioare pentru sub-tab-uri.

**Date necesare**
- Adaug hook-ul `useEvalChapters` și `useAllEvalExercises` din `src/hooks/useEvalBank.ts` (deja existente). Le folosesc pentru a popula select-urile de capitol și pentru a derive listele de exerciții/probleme filtrate.
- Populez `evalItemsCache` cu rezultatele lui `useAllEvalExercises` la load, ca preview-urile să funcționeze imediat fără round-trip suplimentar.

**State nou**
- `selectedBankExerciseChapterId: string` și `selectedBankProblemChapterId: string` pentru cele două select-uri din "Banca testare". Independente de `selectedChapterId` / `selectedProblemChapterId` (care rămân pentru "Publice").
- Tab-ul activ exterior default-ează la `"bank"` pentru profesori verificați, altfel `"public"`.

**Ce nu se schimbă**
- `addItem`, `removeItem`, gating-ul AI (`MAX_AI_ITEMS_PER_TEST`), preview-urile, salvarea, variantele, întreaga logică de business.
- `TestManager`, `TeacherTestsTab`, hook-urile, schema DB.

### Întrebare deschisă (răspunde dacă vrei altceva)

Pentru profesorii **neverificați**, în "Banca testare" → "Teste" am afișat doar mesajul de gating (cum e azi). Vrei să le ascund complet sub-tabul "Teste" pentru ei, sau să-l las vizibil cu mesajul? Implicit îl las vizibil cu mesaj, ca să vadă că există feature-ul.