## Problemă

În tab-ul „Elev" → istoric teste, rezultatele apar ca JSON brut (`{"selected":"a"}`, `{"blanks":{...}}`, `{"order":[...]}`) și doar „Exercițiul N", fără cerință și fără răspunsul corect. Cauze:

- Pentru itemii din **bancă / predefiniți** (`source_type != 'custom'`), `test_items.custom_data` e gol → nu avem enunț, opțiuni, blanks, ordine corectă. Codul cade pe fallback `JSON.stringify(answerData)`.
- Răspunsul corect e afișat doar când `source_type === 'custom'`; itemii din bancă nu îl arată niciodată.
- Renderer-ul tratează special doar `quiz`; pentru `truefalse`, `fill`, `reorder`, `code`, `open` nu formatează răspunsul elevului.

## Soluție

### 1. Backend — RPC de review (o singură sursă de adevăr)

Migrare cu funcție SECURITY DEFINER:

`public.get_submission_review(_submission_id uuid) returns setof jsonb`

Reguli de acces:
- caller-ul trebuie să fie proprietarul submisiei **sau** profesorul clasei;
- submisia trebuie să aibă `submitted_at` și assignment-ul `scores_released = true` (pentru elev; profesorul vede oricând).

Pentru fiecare `test_answers` întoarce un obiect unificat cu:
- `sort_order`, `score`, `max_points`, `feedback`, `answer_data`
- `type` (quiz / truefalse / fill / reorder / code / open)
- `question` / `statement`
- `options` (quiz) + `correct_option_id`
- `blanks` (fill) cu `key` + `answer`
- `order_correct` (reorder) – lista corectă de linii
- `correct_answer` (open / short)
- `starter_code` / `expected_output` (code) când există

Sursa datelor:
- itemi `custom` → `test_items.custom_data`
- itemi din bancă → JOIN pe `eval_exercises` (folosim câmpurile existente: `question`, `statement`, `options`, `correct_option_id`, `blanks`, `order_lines`, `correct_answer`, etc.)

Grant `EXECUTE` doar către `authenticated`.

### 2. Frontend — `src/components/account/StudentTab.tsx`

- Înlocuim query-ul direct pe `test_answers` cu apel `supabase.rpc('get_submission_review', { _submission_id })`.
- Extragem un component nou `SubmissionAnswerRow` care primește itemul normalizat și randează după `type`:
  - **quiz** – enunț + listă opțiuni (bifă verde pe corect, X roșu pe cel ales greșit).
  - **truefalse** – afirmația, răspuns elev (Adevărat/Fals), răspuns corect.
  - **fill** – enunț cu blank-urile listate: pentru fiecare blank „b1: `Hello`  →  corect: `hello`" (verde/roșu).
  - **reorder** – două coloane / două liste numerotate: „Ordinea ta" vs „Ordinea corectă".
  - **code** – bloc `<pre>` cu codul elevului + (dacă există) output așteptat / soluție.
  - **open / short** – text elev + text corect.
- Fallback lizibil: dacă tot nu avem tipul, afișăm câmpurile answer_data ca listă `cheie: valoare`, nu `JSON.stringify`.
- Titlul devine cerința reală (`question` / `statement`), cu fallback „Exercițiul N".

### 3. Fără schimbări în alte fluxuri

Profesorul (`TestResults.tsx`) și pagina de test nu se modifică. Nu atingem policies existente; RPC-ul e strict pentru review post-submit.

## Detalii tehnice

- Sanitizăm output-ul RPC: pentru elev întoarcem răspunsurile corecte doar dacă `scores_released`; verificarea e în funcție, nu în client.
- Păstrăm `queryKey: ["student-test-answers", expandedTestId]` — doar sursa se schimbă.
- Fără modificări de schemă; folosim coloanele existente din `eval_exercises` și `test_items.custom_data`.
