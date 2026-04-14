

## Plan: Completare bancă evaluare + Răspuns deschis (fără indiciu la probleme)

### Rezumat

Se adaugă 3 îmbunătățiri la Banca de Evaluare (EvalBank):
1. **Fill (Completare)** — interfață cu `codeTemplate` și variante separate prin virgulă
2. **Order (Ordonare)** — câmp „Grup" pe fiecare linie (linii cu același grup sunt interschimbabile)
3. **Problem (Problemă)** — tip nou, fără indiciu, cu cod template, soluție și cazuri de test
4. **Open Answer (Răspuns deschis)** — tip nou, profesorul pune o întrebare, elevul răspunde liber; evaluabil cu AI

### Modificări

**1. Migrare SQL**

- Actualizare trigger `validate_eval_exercise_type` → permite `'problem'` și `'open_answer'`
- Coloane noi pe `eval_exercises`:
  - `code_template text` — șablon cod (fill, problem)
  - `test_cases jsonb DEFAULT '[]'` — cazuri de test (problem)
  - `solution text DEFAULT ''` — rezolvare (problem)

**2. `src/hooks/useEvalBank.ts`**

- Extindere interfață `EvalExercise` cu `code_template`, `test_cases`, `solution`

**3. `src/components/admin/EvalBankEditor.tsx`**

- `typeLabels`: adaugă `problem: "Problemă"`, `open_answer: "Răspuns deschis"`
- **Fill**: adaugă câmp `codeTemplate` (Textarea mono, placeholder „Folosește ___ pentru spații goale"), la blanks se menționează „variante separate prin virgulă"
- **Order**: adaugă Input „Grup" pe fiecare linie (number, opțional)
- **Problem** (nou): editor cu `codeTemplate`, `solution`, `testCases` (input/output/hidden toggle) — fără indiciu
- **Open Answer** (nou): doar `question` + `explanation` opțional, fără alte câmpuri speciale
- `handleSave`: include `code_template`, `test_cases`, `solution` pentru problem

**4. `src/components/teacher/TestBuilder.tsx`**

- Adaugă `"open_answer"` la `CustomQuestionType`
- Editor custom simplu: Textarea pentru întrebare, fără opțiuni/răspuns corect
- `custom_data.type = "open_answer"` salvat pe item

**5. `src/pages/TakeTestPage.tsx`**

- Render `open_answer`: afișează întrebarea + Textarea pentru răspuns liber
- Salvează `answer_data = { text: "..." }`

**6. `supabase/functions/grade-submission/index.ts`**

- `open_answer` → scor 0 la evaluare automată, feedback „Necesită evaluare manuală sau AI"
- Dacă profesorul are AI: include open_answer items (limita de 3 rămâne aceeași, include atât probleme cât și răspunsuri deschise) în batch-ul AI cu prompt adaptat: „Evaluează răspunsul elevului la întrebarea X"

**7. RPC `get_test_items_for_student`** — nu necesită modificări (datele vin deja din `custom_data`)

### Fișiere modificate

| Fișier | Ce |
|--------|----|
| Migrare SQL | Coloane noi + trigger actualizat |
| `src/hooks/useEvalBank.ts` | Interfață extinsă |
| `src/components/admin/EvalBankEditor.tsx` | Fill cu cod template, Order cu grup, Problem + Open Answer |
| `src/components/teacher/TestBuilder.tsx` | Open Answer în custom editor |
| `src/pages/TakeTestPage.tsx` | Render open_answer |
| `supabase/functions/grade-submission/index.ts` | Evaluare open_answer (0 automat / AI) |

