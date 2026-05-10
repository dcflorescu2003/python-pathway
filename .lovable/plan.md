Plan:

1. Ajustez logica din `TestBuilder.tsx` care decide dacă un item este eligibil pentru corectare AI.
   - Acum ia în calcul doar `source_type === "problem"` și întrebări custom `open_answer`.
   - O voi extinde ca să includă și itemii importați din `eval_exercises` cu tip `problem` sau `open_answer`, folosind `evalItemsCache`.

2. Repar condiția de afișare a bifei `✨`.
   - Bifa va apărea pentru profesorii cu Profesor AI atunci când testul are peste limita de 3 itemi eligibili.
   - Pentru itemii importați din testul predefinit, nu va mai depinde doar de `source_type`, ci de tipul real al itemului din banca de evaluare.

3. Repar salvarea selecției pentru AI.
   - În prezent UI salvează chei temporare de forma `sel-0`, dar backend-ul verifică `test_items.id`, ceea ce nu se potrivește după salvare.
   - Voi salva un identificator stabil pentru item: `source_id` pentru itemii importați/existenți și un fallback indexat doar pentru custom fără ID, apoi aliniez backend-ul să recunoască selecția stabilă.

4. Verific fluxul de evaluare din `grade-submission` pentru `eval_exercises`.
   - Mă asigur că itemii `eval-...` de tip `problem` și `open_answer` pot intra în corectarea AI dacă profesorul are contul potrivit și itemul este selectat.
   - Nu modific reguli de abonament sau limita de 3 itemi AI/test.