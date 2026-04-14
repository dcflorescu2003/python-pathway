

## Plan: Tipuri noi vizibile + Control publicare note + Selectare itemi AI

### Probleme identificate

1. **Tipuri noi lipsă din PredefinedTestEditor** — `typeLabels` în `PredefinedTestEditor.tsx` (linia 412) conține doar `quiz/fill/order/truefalse`. Lipsesc `problem` și `open_answer`. Exercițiile de tip problemă/răspuns deschis din bancă nu au label corect și nu se recunosc vizual.

2. **Elevii văd nota imediat** — Nu există un mecanism de control al vizibilității notelor. Elevii văd `total_score/max_score` imediat după trimitere (pe pagina Index, linia 468-471 și pe TakeTestPage mesajul de confirmare).

3. **Profesorul trebuie să confirme notarea** — Profesorul trebuie să noteze manual răspunsurile deschise/probleme înainte de a publica. Profesorii cu Profesor AI pot avea notare automată fără confirmare.

4. **Selecție manuală a itemilor AI** — Dacă sunt >3 itemi problem/open_answer, profesorul trebuie să poată bifa care 3 să fie corectate cu AI.

### Modificări

**1. Migrare SQL**

- Adaugă coloana `scores_released boolean NOT NULL DEFAULT false` pe `test_assignments`
- Adaugă coloana `ai_grading_item_ids text[] DEFAULT '{}'` pe `tests` (lista de test_item IDs pe care profesorul le alege pentru AI grading)

**2. `PredefinedTestEditor.tsx`**

- Adaugă `problem: "Problemă"`, `open_answer: "Răspuns deschis"` la `typeLabels` (linia 412)

**3. `TestResults.tsx` — Buton „Publică notele"**

- Afișează un buton „Publică notele" per assignment (toggle `scores_released`)
- Când `scores_released = false`, elevii NU văd scorul
- Profesorul poate vedea itemii open_answer/problem neevaluate, le notează manual, apoi publică
- Badge vizual care arată câte itemi open_answer/problem nu au fost notate manual

**4. `Index.tsx` — Ascunde scorul**

- La afișarea testelor completate, verifică `scores_released` din assignment
- Dacă `false`: afișează „Rezultat în așteptare" în loc de scor

**5. `TakeTestPage.tsx` — Mesaj actualizat**

- După trimitere: „Testul a fost trimis! Vei vedea nota după ce profesorul o publică."

**6. `useTests.ts`**

- `useStudentAssignments`: include `scores_released` în select (e deja `*` dar trebuie să existe coloana)
- `useTestAssignments`: includ `scores_released`
- Adaugă hook `useToggleScoresReleased` — toggle `scores_released` pe assignment

**7. `TestBuilder.tsx` — Selectare itemi AI**

- Când profesorul are Profesor AI și sunt >3 itemi problem/open_answer:
  - Afișează checkbox pe fiecare item problem/open_answer
  - Maxim 3 bifate, cu label „Corectează cu AI"
  - Salvează selecția în `ai_grading_item_ids` pe test
- Când sunt ≤3, se selectează automat toate (comportament actual)

**8. `grade-submission/index.ts`**

- Citește `ai_grading_item_ids` din test
- Dacă lista nu e goală, doar itemii din listă sunt trimiși la AI (nu primii 3 găsiți)
- Dacă lista e goală, comportament actual (primii 3)

### Fișiere modificate

| Fișier | Ce |
|--------|----|
| Migrare SQL | `scores_released`, `ai_grading_item_ids` |
| `PredefinedTestEditor.tsx` | typeLabels actualizat |
| `TestResults.tsx` | Buton publică note, badge itemi nenotați |
| `Index.tsx` | Condiționare afișare scor |
| `TakeTestPage.tsx` | Mesaj actualizat post-trimitere |
| `useTests.ts` | Hook toggle scores_released |
| `TestBuilder.tsx` | Selectare itemi AI cu checkbox |
| `grade-submission/index.ts` | Respectă ai_grading_item_ids |

