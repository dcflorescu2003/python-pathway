

## Plan: Scoatere teste din Index + notificare la publicare rezultate + afișare detaliată în StudentTab

### Ce se schimbă

**1. `src/pages/Index.tsx` — Scoatere secțiune teste**
- Șterg import-ul `useStudentAssignments` și referința `studentTests`
- Șterg blocul JSX „Teste de rezolvat" (liniile ~427-483)
- Elimin import-urile neutilizate (`FileText`, `CheckCircle`, `Clock` dacă nu mai sunt folosite altundeva)

**2. Notificare la publicarea rezultatelor**
- Când profesorul apasă „Publică notele" (`useToggleScoresReleased` cu `released: true`), inserez o notificare în tabelul `notifications` pentru fiecare student din clasa respectivă
- Modific hook-ul `useToggleScoresReleased` din `useTests.ts`: după update-ul `scores_released`, fac query pe `class_members` pentru a lua `student_id`-urile clasei, apoi `insert` batch în `notifications` cu titlul „Rezultate publicate" și body „Notele pentru testul «{title}» au fost publicate."

**3. `src/components/account/StudentTab.tsx` — Afișare detaliată a răspunsurilor**
- La secțiunea expandată a fiecărui test, pentru fiecare answer:
  - Afișez mai întâi **cerința** completă (question-ul din `custom_data`) cu text mai vizibil
  - Sub cerință, afișez „**Răspunsul tău:**" cu valoarea
  - **Pentru grile (quiz)**: dacă răspunsul e greșit, afișez varianta aleasă cu text roșu și varianta corectă cu text verde. Dacă e corect, afișez doar cu verde.
  - Pentru alte tipuri (fill, code, true/false) — păstrez logica actuală cu text simplu
- Adaug vizibilitate condiționată: răspunsurile detaliate se afișează **doar când `scores_released === true`** pe assignment

### Fișiere modificate

| Fișier | Ce |
|--------|-----|
| `src/pages/Index.tsx` | Șterg secțiunea teste + import-uri aferente |
| `src/hooks/useTests.ts` | `useToggleScoresReleased` trimite notificări studenților |
| `src/components/account/StudentTab.tsx` | Afișare cerință + răspuns colorat (roșu/verde pentru grile) |

