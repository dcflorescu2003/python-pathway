# Rulare soluții + cazuri de test pe mai multe linii (Bancă)

## Ce am verificat

- În editorul de exerciții din Bancă (tip "Problemă"), câmpurile pentru cazuri de test folosesc `Input` (o singură linie), deci nu se pot introduce mai multe numere pe rânduri separate — nici la intrare, nici la ieșire.
- Același lucru la editorul de lecții: intrarea e pe mai multe rânduri, dar "Ieșire așteptată" e tot pe o singură linie.
- La editorul de Probleme (secțiunea Probleme) câmpurile sunt deja pe mai multe rânduri — acolo nu e nicio problemă.
- Nu există niciun buton de rulare a codului în interfața de admin; motorul Python (Pyodide) există deja și e folosit în aplicație la rezolvarea problemelor.

## Ce voi face

1. **Cazuri de test pe mai multe rânduri**
   - În editorul din Bancă, câmpurile "Input" și "Output așteptat" devin zone de text pe mai multe rânduri, cu font monospațiat, care păstrează exact liniile introduse.
   - Aceeași corectură pentru "Ieșire așteptată" în editorul de exerciții din lecții.
   - Se normalizează terminațiile de linie la salvare (fără `\r`), ca să nu apară diferențe false la comparare.

2. **Rulare soluție direct din Bancă**
   - Buton "Rulează soluția" în editorul de problemă din Bancă.
   - Execută soluția scrisă în editor pe toate cazurile de test și afișează, pentru fiecare caz: trecut/picat, intrarea, ieșirea așteptată și ieșirea reală (plus eroarea Python dacă e cazul).
   - Rezumat de tipul "4/5 teste trecute", ca profesorul să valideze problema înainte de salvare.
   - Se pot rula testele și fără a salva exercițiul.
   - Se poate rula și un cod ad-hoc (butonul folosește codul din câmpul "Soluție"), util pentru testarea rapidă a enunțului.

## Detalii tehnice

- `src/components/admin/EvalBankEditor.tsx`: `Input` → `Textarea` (rows=2) pentru `input` / `expected_output`; adăugare secțiune runner cu `usePyodide()` (`runCode(code, testCases)`), mapare `expected_output` → `expectedOutput` înainte de rulare, afișare `TestResult[]`.
- `src/components/admin/ExerciseEditor.tsx`: `Input` → `Textarea` pentru `expectedOutput`.
- Comparația de ieșire rămâne cea existentă din `usePyodide` (normalizare `\r\n` și trim la final), deci ieșirile multi-linie funcționează identic cu cele din aplicația elevului.
- Fără modificări de bază de date sau de schemă; `test_cases` este deja `jsonb` și acceptă `\n`.
