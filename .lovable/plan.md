

## Plan: Expirare automata a testelor dupa durata stabilita

### Problema

Dupa ce un profesor distribuie un test, elevii pot accesa subiectele oricand, chiar si dupa zile intregi. Trebuie ca testul sa expire automat dupa o durata stabilita de la momentul distribuirii.

### Solutia

Se adauga un camp **"Disponibil timp de (minute)"** pe assignment. Implicit ia valoarea `time_limit_minutes` de pe test (daca exista), dar profesorul o poate modifica la distribuire. Dupa acest interval de la `assigned_at`, elevii nu mai pot incepe testul si nu mai pot vedea subiectele.

Protectia se aplica in **3 straturi**: UI student, pagina de test, si functia RPC din backend.

### 1. Migrare DB -- coloana `window_minutes` pe `test_assignments`

```sql
ALTER TABLE public.test_assignments
  ADD COLUMN window_minutes integer DEFAULT NULL;
```

Cand `window_minutes` este setat, deadline-ul efectiv devine `assigned_at + window_minutes`. Daca `due_date` este deja setat manual, se ia cea mai mica valoare dintre cele doua.

### 2. TestManager -- input la distribuire

In `src/components/teacher/TestManager.tsx`:
- Adauga un camp numeric "Disponibil timp de (min)" langa selectorul de clasa, pre-populat cu `time_limit_minutes` de pe test (daca exista)
- Trimite `window_minutes` in `assignTest.mutateAsync()`

### 3. useTests.ts -- include `window_minutes` in `useAssignTest`

- Adauga `window_minutes?: number` la parametrii mutation-ului
- Include campul in `.insert()` catre `test_assignments`

### 4. Backend -- protectie in RPC `get_test_items_for_student`

Modifica functia RPC sa verifice expirarea inainte de a returna itemi:

```sql
-- In get_test_items_for_student, dupa obtinerea assignment-ului:
IF v_assignment.window_minutes IS NOT NULL
   AND v_assignment.assigned_at + (v_assignment.window_minutes || ' minutes')::interval < now()
THEN
  RETURN; -- nu returneaza nimic, testul a expirat
END IF;
```

Aceasta este protectia principala -- chiar daca frontend-ul ar fi manipulat, backend-ul refuza subiectele.

### 5. TakeTestPage -- verificare frontend

In `src/pages/TakeTestPage.tsx`:
- Dupa ce se incarca assignment-ul, calculeaza deadline-ul efectiv din `assigned_at + window_minutes`
- Daca a expirat, afiseaza mesaj "Testul a expirat" si blocheaza accesul

### 6. StudentTab -- afisare status expirat

In `src/components/account/StudentTab.tsx`:
- Calculeaza expirarea si din `window_minutes` (nu doar din `due_date`)
- Afiseaza badge "Expirat" si dezactiveaza butonul

### Fisiere modificate

| Fisier | Modificare |
|--------|-----------|
| Migrare DB | `ALTER TABLE test_assignments ADD COLUMN window_minutes integer` |
| `src/components/teacher/TestManager.tsx` | Input numeric "Disponibil timp de" la distribuire |
| `src/hooks/useTests.ts` | `window_minutes` in assign mutation |
| Migrare DB (RPC) | Update `get_test_items_for_student` cu verificare expirare |
| `src/pages/TakeTestPage.tsx` | Verificare expirare inainte de incarcare |
| `src/components/account/StudentTab.tsx` | Calcul expirare din `window_minutes` |

