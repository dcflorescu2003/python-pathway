# Probleme cu fișiere în Bancă: rulare și salvare corectă

## Ce am verificat

- Editorul de exerciții din Bancă (`EvalBankEditor`) ține cazurile de test doar ca `{ input, expected_output, hidden }`. Nu are câmpuri pentru fișiere de intrare/ieșire (`date.in`, `date.out`).
- Butonul „Rulează soluția" trimite spre Python doar `input` și `expectedOutput`, fără fișiere — de aceea soluția care face `open("date.in")` cade cu `FileNotFoundError: date.in` (exact ce se vede în captură).
- La salvare, `test_cases` este reconstruit din aceleași trei câmpuri, deci dacă un exercițiu cu fișiere a fost importat din CSV, fișierele lui se pierd la prima editare din Bancă.
- Motorul Python (`usePyodide`) suportă deja `inputFiles` / `expectedFiles`, iar editorul de Probleme și pagina de test a elevului le folosesc corect. Lipsa e doar în editorul din Bancă.

## Ce voi face

1. **Fișiere în cazurile de test din Bancă**
   - Fiecare caz de test primește două secțiuni suplimentare: „Fișiere de intrare" și „Fișiere așteptate", cu nume de fișier + conținut pe mai multe rânduri, la fel ca în editorul de Probleme.
   - Butoane pentru adăugare/ștergere fișier; numele implicite `date.in` / `date.out`.

2. **Rulare corectă a soluției**
   - Butonul „Rulează soluția" trimite și fișierele, deci soluțiile cu `open("date.in")` rulează normal.
   - În rezultate se afișează, pe lângă stdout, și comparația pe fișiere: nume, conținut așteptat, conținut obținut, sau „fișier lipsă".

3. **Fără pierderi la salvare**
   - Fișierele existente sunt încărcate în editor la deschidere și salvate înapoi, astfel încât editarea unui exercițiu importat nu mai șterge partea de fișiere.
   - Ieșirea așteptată la stdout rămâne opțională: dacă e goală și există fișiere așteptate, testul se validează doar pe fișiere.

## Detalii tehnice

- `src/components/admin/EvalBankEditor.tsx`: extind starea `testCases` cu `inputFiles?: Record<string,string>` și `expectedFiles?: Record<string,string>`; inițializare din `exercise.test_cases`; UI de tip cheie/valoare (reutilizând tiparul din `ProblemsEditor.tsx`, liniile ~340-390).
- `handleRunSolution`: pasez `inputFiles` / `expectedFiles` către `runCode`; când `expected_output` e gol și există `expectedFiles`, trimit `expectedOutput: undefined` ca `usePyodide` să nu compare stdout-ul.
- `handleSave`: păstrez cheile de fișiere în `test_cases` (doar când sunt nevide), cu normalizare `\r\n` → `\n` pe conținut.
- Afișarea rezultatelor folosește `TestResult.fileResults` deja returnat de `usePyodide`.
- Fără modificări de schemă (`test_cases` este `jsonb`) și fără schimbări în corectarea testelor elevilor.
