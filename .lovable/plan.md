## Diagnostic

Sunt două fluxuri distincte care duc la ecrane greșite când fereastra de start a testului a expirat:

1. **Client-side kick-out** (`TakeTestPage.tsx`, liniile 101–108): dacă `assigned_at + window_minutes < now()`, se afișează `Testul a expirat.` și `navigate("/")` — **fără să verifice dacă elevul are deja o încercare `test_submissions` nesubmisă**. Un elev care a intrat în test înainte de expirare și încă mai are timp pe cronometrul propriu este scos afară fix cum era cu bug-ul RPC.

2. **`Eroare la încărcarea testului.`** — toast generic din `catch` (linia 297). Astăzi nu logăm mesajul real, deci nu putem şti dacă a picat `startSubmission` (INSERT în `test_submissions`), fetch-ul de `exercises` / `problems`, sau RPC-ul de eval bank. Fără mesajul concret nu putem repara categoria.

RPC-ul `get_test_items_for_student` din DB este deja corect (permite itemi pentru orice submission nesubmisă, indiferent de fereastră). Frontend-ul e cel care nu s-a aliniat.

## Modificări propuse

### 1. `src/pages/TakeTestPage.tsx`
- Mută verificarea existenței submission-ului **înainte** de client-side window check.
- Dacă `existingSub` există și `submitted_at IS NULL` (deci elevul a început testul), nu mai apela `navigate("/")` la expirare — lasă cronometrul propriu al testului să limiteze restul.
- Dacă `existingSub` nu există și fereastra a expirat, comportamentul rămâne același (toast „Testul a expirat." + redirect).
- În `catch (err)`, extrage mesajul (`err?.message` / `err?.error_description`) și îl atașează la toast: `Eroare la încărcarea testului: {mesaj}`. Loghează `err` cu `console.error` (deja e). Asta ne dă categoria pe raportul următor.

### 2. Verificare rapidă (fără cod)
- Query pe `test_submissions` pentru un elev care a raportat problema, să confirmăm că există rând nesubmis pentru assignment-ul respectiv — dacă nu există, atunci erorile lui vin din `startSubmission` și mesajul îmbogățit din toast ne va spune ce blochează INSERT-ul.

Nu ating logica de anti-cheat, draft-uri, roster sau grading. Nu modific RPC-ul (deja corect).